/* ==== 60-store.js ==== */
/* ===================== IL FREDOLIN · ARMAZENAMENTO (aparelho + nuvem) =====================
   Cada coleção vive neste aparelho (localStorage) e, com a conta conectada, na nuvem.
   A nuvem é plugável: no artefato usa o banco privado do Claude; no aplicativo usa o Supabase da equipe.
   Conflitos: vence o registro com updatedAt mais recente. Exclusões viram "lápides" ({id, deleted, updatedAt})
   para que um item apagado num aparelho não ressuscite quando outro aparelho, ainda com a cópia antiga, sincronizar. */
const COLS={lib:{get:()=>LIB,set:v=>{LIB=v;},lk:LIBKEY},lots:{get:()=>LOTS,set:v=>{LOTS=v;},lk:K10.lots},ings:{get:()=>CUST,set:v=>{CUST=v;},lk:K10.ings},nx:{get:()=>NXLIB,set:v=>{NXLIB=v;},lk:NXKEY},inv:{get:()=>INV,set:v=>{INV=v;},lk:K10.inv},
 exec:{get:()=>EXEC,set:v=>{EXEC=v;},lk:EXECKEY},vit:{get:()=>VITS,set:v=>{VITS=v;},lk:VITSKEY}};
const TOMBKEY='fredolin_v11_tomb';
const byNewest=(a,b)=>(b.updatedAt||0)-(a.updatedAt||0);
const plain=r=>JSON.parse(JSON.stringify(r));
/* ingredientes próprios e neutros do usuário que foram apagados (aqui ou em outro aparelho) saem do banco de cálculo */
function syncRegistry(){const keepC=new Set(CUST.map(c=>c.id)),keepN=new Set(NXLIB.map(n=>n.id)),pre=new Set(NEUTRO_PRESETS.map(n=>n.id));let ch=false;
 for(let k=ING.length-1;k>=0;k--){const i=ING[k];const goneC=i.custom&&!keepC.has(i.id),goneN=i.blend&&!pre.has(i.id)&&i.id!=='nx_tmp'&&!keepN.has(i.id);if(goneC||goneN){ING.splice(k,1);delete ING_BY[i.id];ch=true;}}
 CUST.forEach(registerCustom);NXLIB.forEach(registerNeutro);if(ch)ING_VER++;}
const STORE={backend:null,status:'local',msg:'Salvando somente neste aparelho.',tomb:LS.get(TOMBKEY)||{},
 saveLocal(c){LS.set(COLS[c].lk,COLS[c].get());},
 saveTomb(){LS.set(TOMBKEY,this.tomb);},
 after(c){if(c==='ings'||c==='nx')syncRegistry();if(c==='inv')invRecompute(INV);if(c==='lots')fitCalibration(LOTS);if(c==='vit'){const v=VITS.find(x=>x.id==='main')||VITS.find(x=>!x.kind);APPEV.emit('vit',v);}},
 setStatus(st,msg){this.status=st;this.msg=msg;APPEV.emit('changed');},
 put(c,rec){const arr=COLS[c].get();const k=arr.findIndex(x=>String(x.id)===String(rec.id));
  /* receitas guardam de qual versão partiram (base): assim duas edições paralelas viram conflito, não perda */
  if(c==='lib')rec.base=k>=0?(arr[k]===rec?rec.base||0:arr[k].updatedAt||0):0;
  rec.updatedAt=Date.now();if(k>=0)arr[k]=rec;else arr.unshift(rec);
  if(this.tomb[c]&&this.tomb[c][rec.id]){delete this.tomb[c][rec.id];this.saveTomb();}
  this.saveLocal(c);this.after(c);if(this.backend)this.backend.push(c,rec);},
 del(c,id){const now=Date.now();COLS[c].set(COLS[c].get().filter(x=>String(x.id)!==String(id)));(this.tomb[c]=this.tomb[c]||{})[id]=now;this.saveTomb();this.saveLocal(c);this.after(c);
  if(this.backend)this.backend.push(c,{id:String(id),deleted:true,updatedAt:now});},
 /* aplica uma coleção vinda da nuvem (já sem lápides) */
 replace(c,list){COLS[c].set(safeList(list).filter(r=>!r.deleted).sort(byNewest));this.saveLocal(c);this.after(c);},
 /* junta o que está no aparelho com o que está na nuvem (função pura: testável sem rede) */
 merge(local,remote,tomb,col){const out=new Map(remote),push=[];
  local.forEach(r=>{const id=String(r.id),rr=out.get(id);if(rr&&rr.deleted&&(rr.updatedAt||0)>=(r.updatedAt||0))return;if(!rr||(r.updatedAt||0)>(rr.updatedAt||0)){out.set(id,r);push.push(r);}
   /* receita editada aqui e, em paralelo, em outro aparelho: guarda as duas */
   else if(col==='lib'&&rr&&!rr.deleted&&(rr.updatedAt||0)>(r.updatedAt||0)&&libConflict(r,rr,rr.updatedAt||0)){const cp=conflictCopy(r);cp.updatedAt=Date.now();out.set(cp.id,cp);push.push(cp);}});
  for(const id in tomb||{}){const rr=out.get(String(id));if(!rr||(!rr.deleted&&(rr.updatedAt||0)<=tomb[id])){const t={id:String(id),deleted:true,updatedAt:tomb[id]};out.set(String(id),t);push.push(t);}}
  return{list:[...out.values()].filter(r=>!r.deleted).sort(byNewest),push};},
 /* apaga todos os dados deste aparelho (troca de usuário ou "Sair" num aparelho compartilhado) */
 wipe(){for(const c in COLS){COLS[c].set([]);this.saveLocal(c);}this.tomb={};this.saveTomb();syncRegistry();invRecompute(INV);fitCalibration(LOTS);},
 init(){const b=APP_MODE==='app'?SUPA_BACKEND:CLAUDE_BACKEND;this.backend=b;/* já recebe as gravações; envia quando a conexão estiver pronta */return b.start(this).catch(e=>this.setStatus('error','Não foi possível sincronizar ('+(e&&e.message||'erro')+'). Salvando neste aparelho.'));}
};

/* ---------- nuvem do artefato (banco privado do Claude) ---------- */
const CLAUDE_BACKEND={db:null,uid:null,
 path(c){return'data/users/'+this.uid+'/fredolin/'+c;},
 push(c,rec){if(this.db)this.db.collection(this.path(c)).doc(String(rec.id)).set(plain(rec)).catch(e=>STORE.setStatus('error','Falha ao gravar na nuvem ('+(e&&e.code||'erro')+'). Os dados continuam neste aparelho.'));},
 async start(st){if(!window.claude||typeof window.claude.use!=='function')return false;const [db,user]=await Promise.all([claude.use('db'),claude.use('user')]);
  if(!db||!user){st.setStatus('local','Sincronização indisponível nesta visualização; salvando neste aparelho.');return false;}
  const id=await user.id();if(!id){st.setStatus('local','Entre na sua conta para sincronizar.');return false;}this.db=db;this.uid=id;st.setStatus('syncing','Sincronizando…');
  for(const c in COLS){const col=db.collection(this.path(c));const snap=await col.get();
   const r=st.merge(COLS[c].get(),new Map(snap.docs.map(d=>[d.id,d.data()])),st.tomb[c],c);
   r.push.forEach(x=>col.doc(String(x.id)).set(plain(x)).catch(()=>{}));
   st.replace(c,r.list);
   col.onSnapshot(sn=>{if(sn.metadata&&sn.metadata.hasPendingWrites)return;st.replace(c,sn.docs.map(d=>d.data()));APPEV.emit('changed');},()=>{});}
  st.setStatus('cloud','Sincronizado com sua conta: biblioteca, lotes, ingredientes, neutros e estoque aparecem em todos os seus aparelhos.');return true;}
};

