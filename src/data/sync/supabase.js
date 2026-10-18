/* ==== 62-supabase.js ==== */
/* ===================== IL FREDOLIN · NUVEM DA EQUIPE (Supabase) =====================
   Cliente próprio, sem bibliotecas externas: login (e-mail e senha), renovação do acesso,
   e sincronização "primeiro no aparelho": tudo é gravado aqui na hora e enviado à nuvem
   por uma fila; sem internet o app segue funcionando e a fila é enviada quando a conexão volta.
   Custos e preços viajam separados (coleção "fin"), que só o Maestro recebe. */
const CFG=(()=>{const c=window.FREDOLIN_CONFIG||{},l=LS.get('fredolin_app_cfg')||{};return{url:String(c.url||l.url||'').trim().replace(/\/+$/,''),key:String(c.key||l.key||'').trim()};})();
const SESSKEY='fredolin_app_session',OWNKEY='fredolin_app_owner',CURKEY='fredolin_app_cursor',OUTKEY='fredolin_app_outbox',FINKEY='fredolin_app_fin',MEKEY='fredolin_app_me',REJKEY='fredolin_app_rejected',VERKEY='fredolin_app_vers';
/* v18 (auditoria): o que conta como recusa definitiva do servidor. Sessão vencida (401), excesso de pedidos (429),
   falha do servidor (5xx) e falta de rede NÃO são definitivas: a alteração continua na fila e é reenviada.
   As definitivas (permissão, dado inválido, conflito de chave) vão para a quarentena: nada é descartado sem o usuário ver. */
const sbPermanent=e=>!!e&&!e.offline&&[400,403,404,409,413,422].includes(e.status);
const SB_MSG=[[/invalid login credentials/i,'E-mail ou senha incorretos.'],[/email not confirmed/i,'Confirme o e-mail pelo link que enviamos antes de entrar.'],[/already registered|already been registered/i,'Este e-mail já tem conta: use "Entrar".'],
 [/password should be at least|weak password/i,'A senha precisa ter pelo menos 6 caracteres.'],[/for security purposes|rate limit/i,'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.'],[/failed to fetch|networkerror|load failed/i,'Sem conexão com a internet.'],
 [/invalid api key|no api key/i,'Chave do Supabase inválida: confira o arquivo config.js.'],[/permission denied|row-level security|42501/i,'Seu perfil não tem permissão para isso.'],[/duplicate key/i,'Esse e-mail já está na equipe.']];
const trMsg=m=>{for(const[re,t]of SB_MSG)if(re.test(m))return t;return String(m);};
const SB={sess:LS.get(SESSKEY),
 configured(){return!!(CFG.url&&CFG.key);},
 async req(method,path,body,opt={}){const auth=opt.auth!==false;if(auth)await this.ensureFresh();
  const h=Object.assign({apikey:CFG.key,'Content-Type':'application/json'},opt.headers||{});if(auth&&this.sess)h.Authorization='Bearer '+this.sess.access_token;
  let r;try{r=await fetch(CFG.url+path,{method,headers:h,body:body==null?undefined:JSON.stringify(body)});}catch(e){const x=new Error(trMsg('failed to fetch'));x.offline=true;throw x;}
  if(r.status===401&&auth&&!opt.retried&&this.sess&&this.sess.refresh_token){await this.refresh();return this.req(method,path,body,{...opt,retried:true});}
  const txt=await r.text();let d=null;try{d=txt?JSON.parse(txt):null;}catch(e){d=txt;}
  if(!r.ok){const raw=(d&&(d.msg||d.message||d.error_description||d.error_code||d.error))||('HTTP '+r.status);const x=new Error(trMsg(raw+' '+(d&&d.code||'')));x.status=r.status;x.raw=raw;throw x;}
  return d;},
 setSess(d){if(!d||!d.access_token){this.sess=null;LS.set(SESSKEY,null);return;}
  this.sess={access_token:d.access_token,refresh_token:d.refresh_token||(this.sess&&this.sess.refresh_token),expires_at:+d.expires_at||Math.floor(Date.now()/1000)+(+d.expires_in||3600),user:d.user||(this.sess&&this.sess.user)||null};LS.set(SESSKEY,this.sess);},
 async ensureFresh(){if(this.sess&&this.sess.expires_at-60<Date.now()/1000)await this.refresh();},
 refresh(){if(!this.sess||!this.sess.refresh_token)return Promise.resolve();if(this._ref)return this._ref;
  this._ref=(async()=>{try{this.setSess(await this.req('POST','/auth/v1/token?grant_type=refresh_token',{refresh_token:this.sess.refresh_token},{auth:false}));}
   catch(e){if(e.status===400||e.status===401){this.setSess(null);AUTH.lost();}throw e;}finally{this._ref=null;}})();return this._ref;},
 async signIn(email,password){this.setSess(await this.req('POST','/auth/v1/token?grant_type=password',{email,password},{auth:false}));},
 /* os links enviados por e-mail voltam para este mesmo endereço do app */
 back(){try{return'?redirect_to='+encodeURIComponent(location.origin+location.pathname);}catch(e){return'';}},
 async signUp(email,password){const d=await this.req('POST','/auth/v1/signup'+this.back(),{email,password},{auth:false});if(d&&d.access_token){this.setSess(d);return true;}return false;},
 recover(email){return this.req('POST','/auth/v1/recover'+this.back(),{email},{auth:false});},
 setPassword(password){return this.req('PUT','/auth/v1/user',{password});},
 async signOut(){try{await this.req('POST','/auth/v1/logout',{});}catch(e){}this.setSess(null);},
 rpc(fn,args){return this.req('POST','/rest/v1/rpc/'+fn,args||{});},
 get(path){return this.req('GET','/rest/v1/'+path);}
};

/* ---------- custos separados: só o Maestro grava e recebe ---------- */
let FIN=LS.get(FINKEY)||{};
const FIN_FIELD={inv:[r=>r.costKg,(r,v)=>{if(v==null)delete r.costKg;else r.costKg=v;}],ings:[r=>r.x&&r.x.cost,(r,v)=>{r.x=r.x||{};if(v==null)delete r.x.cost;else r.x.cost=v;}],lib:[r=>r.st&&r.st.costs,(r,v)=>{if(!r.st)return;if(v==null)delete r.st.costs;else r.st.costs=v;}]};
/* v18 · o multiplicador de preço (markup) também é dado financeiro: sai da receita/execução/lote e viaja em fin
   (id "mk:<coleção>:<id>"), que só o Maestro lê. O banco (migração 001) também retira, se um app antigo mandar. */
const FIN_MK={lib:['st','proc'],exec:['proc'],lots:['proc']};
const mkObj=(c,d)=>FIN_MK[c].reduce((a,k)=>a&&typeof a==='object'?a[k]:undefined,d);
function toRows(c,rec){const ts=rec.updatedAt||Date.now();if(rec.deleted)return[{col:c,id:String(rec.id),data:{},deleted:true,updated_at:ts}];
 const data=plain(rec);delete data.updatedAt;delete data._by;delete data._ver;const rows=[];const f=FIN_FIELD[c];
 if(f){const v=f[0](data);f[1](data,null);if(ROLE==='maestro'&&v!=null&&v!==''&&!(typeof v==='object'&&!Object.keys(v).length))rows.push({col:'fin',id:c+':'+rec.id,data:{v},updated_at:ts});}
 if(FIN_MK[c]){const o=mkObj(c,data);if(o&&o.markup!=null){const v=o.markup;delete o.markup;if(ROLE==='maestro')rows.push({col:'fin',id:'mk:'+c+':'+rec.id,data:{v},updated_at:ts});}}
 rows.unshift({col:c,id:String(rec.id),data,updated_at:ts});return rows;}
function withFin(c,rec){const f=FIN_FIELD[c];if(f){const x=FIN[c+':'+rec.id];f[1](rec,x!=null?x:null);}
 if(FIN_MK[c]){const v=FIN['mk:'+c+':'+rec.id];const o=mkObj(c,rec);if(o&&v!=null)o.markup=v;}return rec;}

const SUPA_BACKEND={running:null,again:false,cursor:LS.get(CURKEY)||'1970-01-01T00:00:00.000Z',outbox:LS.get(OUTKEY)||[],rejected:LS.get(REJKEY)||[],lastOk:0,
 /* v18 · versão de cada registro como o servidor a numerou (migração 001). verMode: null = ainda não sabemos se o
    banco já tem a coluna ver; false = banco antigo (regra do relógio); true = conflitos por versão. */
 vers:LS.get(VERKEY)||{},verMode:null,
 reset(keepQueue){this.cursor='1970-01-01T00:00:00.000Z';FIN={};LS.set(CURKEY,this.cursor);LS.set(FINKEY,{});if(!keepQueue){this.outbox=[];this.rejected=[];this.vers={};LS.set(OUTKEY,[]);LS.set(REJKEY,[]);LS.set(VERKEY,{});}},
 push(c,rec){let rj=false;for(const row of toRows(c,rec)){if(row.col==='fin'){FIN[row.id]=row.data.v;LS.set(FINKEY,FIN);}
  /* versão de partida: a da primeira edição ainda não enviada (duas edições seguidas partem da mesma versão do servidor) */
  const prev=this.outbox.find(o=>o.col===row.col&&o.id===row.id),k=row.col+':'+row.id;row.base_ver=prev?prev.base_ver:(this.vers[k]!=null?this.vers[k]:null);
  this.outbox=this.outbox.filter(o=>o!==prev);this.outbox.push(row);
  /* uma edição nova do mesmo registro substitui a versão que estava na quarentena */
  const n=this.rejected.length;this.rejected=this.rejected.filter(q=>!(q.row.col===row.col&&q.row.id===row.id));if(this.rejected.length!==n)rj=true;}
  LS.set(OUTKEY,this.outbox);if(rj)LS.set(REJKEY,this.rejected);this.kick();},
 kick(){clearTimeout(this.kt);this.kt=setTimeout(()=>this.sync(),250);},
 /* pendências = fila + quarentena: sair da conta com qualquer uma delas exige confirmação */
 pending(){return this.outbox.length+this.rejected.length;},
 quarantine(row,e){this.rejected=this.rejected.filter(q=>!(q.row.col===row.col&&q.row.id===row.id));
  this.rejected.push({row,status:e&&e.status||0,msg:String(e&&(e.raw||e.message)||'erro'),at:Date.now()});LS.set(REJKEY,this.rejected);},
 /* devolve a quarentena para a fila (a não ser que já exista versão mais nova do mesmo registro na fila) */
 retryRejected(){const back=this.rejected.filter(q=>!this.outbox.some(o=>o.col===q.row.col&&o.id===q.row.id)).map(q=>q.status===409?Object.assign({},q.row,{force:true}):q.row);
  this.outbox.push(...back);this.rejected=[];LS.set(OUTKEY,this.outbox);LS.set(REJKEY,[]);this.kick();return back.length;},
 dropRejected(){const n=this.rejected.length;this.rejected=[];LS.set(REJKEY,[]);return n;},
 async start(){if(!SB.sess||!ME.ws)return false;const lib=loadLibrary();
  if(!this.wired){this.wired=true;setInterval(()=>{if(!document.hidden)this.sync();},20000);
   window.addEventListener('online',()=>this.sync());document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.sync();});}
  await Promise.all([lib,this.sync()]);return true;},
 /* uma sincronização por vez; quem pedir durante uma em andamento espera e garante mais uma rodada */
 async sync(){if(this.running){this.again=true;await this.running.catch(()=>{});if(this.again){this.again=false;return this.sync();}return;}
  this.running=this._sync();try{await this.running;}finally{this.running=null;}},
 async _sync(){if(!SB.sess||!ME.ws)return;if(navigator.onLine===false){STORE.setStatus('offline','Sem internet: trabalhando neste aparelho'+(this.outbox.length?' · '+this.outbox.length+' alteração(ões) aguardando envio':'')+'.');return;}
  try{await this.flush();await this.pull();this.lastOk=Date.now();
   STORE.setStatus('cloud','Sincronizado com a equipe às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'.');}
  catch(e){STORE.setStatus(e.offline?'offline':'error',e.offline?'Sem conexão: trabalhando neste aparelho'+(this.outbox.length?' · '+this.outbox.length+' alteração(ões) aguardando envio':'')+'.':'Falha ao sincronizar: '+e.message);}
  },
 async send(rows){const vm=this.verMode===true;
  const r=await SB.req('POST','/rest/v1/records?on_conflict=workspace_id,col,id',rows.map(o=>{const x={workspace_id:ME.ws,col:o.col,id:o.id,data:o.data,deleted:!!o.deleted,updated_at:o.updated_at};
   /* todas as linhas com as mesmas chaves (exigência do envio em lote) */
   if(vm){x.base_ver=o.force?null:(o.base_ver!=null?o.base_ver:null);x.force=!!o.force;}return x;}),{headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});
  /* gravou: a versão do servidor passou a ser a seguinte à de partida (a releitura confirma) */
  if(vm){rows.forEach(o=>{const k=o.col+':'+o.id;if(o.base_ver!=null&&!o.force)this.vers[k]=o.base_ver+1;else delete this.vers[k];});LS.set(VERKEY,this.vers);}
  return r;},
 /* envia a fila em lotes. Até a v17.12 um lote recusado era reenviado item a item e TODO item que falhasse
    (inclusive por sessão vencida ou erro 5xx passageiro) saía da fila e era perdido em silêncio, com o aviso de saída
    mostrando zero pendências. Agora: falha passageira → para e mantém a fila (o envio é idempotente: upsert por chave);
    recusa definitiva → quarentena persistente, visível em Conta e sincronização, com reenviar/exportar. */
 async flush(){let quar=0;
  while(this.outbox.length){const batch=this.outbox.slice(0,200);
   try{await this.send(batch);}
   catch(e){if(!sbPermanent(e))throw e;
    for(const row of batch){try{await this.send([row]);}catch(e2){if(!sbPermanent(e2))throw e2;this.quarantine(row,e2);quar++;}}}
   this.outbox=this.outbox.filter(o=>!batch.includes(o));LS.set(OUTKEY,this.outbox);}
  if(quar&&typeof toast==='function')toast(quar+' alteração(ões) recusada(s) pelo servidor ficaram em quarentena (Conta e sincronização).');
  return quar;},
 async pull(){const since=new Date(Date.parse(this.cursor)-120000).toISOString();const changed=new Set();let off=0,max=this.cursor;
  const q=(cols,o)=>SB.get('records?select='+cols+'&workspace_id=eq.'+ME.ws+'&srv_at=gt.'+encodeURIComponent(since)+'&order=srv_at.asc,col.asc,id.asc&limit=1000&offset='+o);
  for(;;){let rows;
   if(this.verMode!==false){try{rows=await q('col,id,data,deleted,updated_at,updated_by,srv_at,ver',off);this.verMode=true;}
    catch(e){if(e.offline||!(e.status===400&&/records\.ver|\bver\b|42703/.test(String(e.raw||e.message))))throw e;this.verMode=false;}}
   if(!rows)rows=await q('col,id,data,deleted,updated_at,updated_by,srv_at',off);
   rows.forEach(r=>{this.apply(r,changed);if(r.srv_at>max)max=r.srv_at;});if(rows.length<1000)break;off+=1000;}
  this.cursor=max;LS.set(CURKEY,max);LS.set(VERKEY,this.vers);
  if(changed.has('fin')){LS.set(FINKEY,FIN);['inv','ings','lib','exec','lots'].forEach(c=>{COLS[c].get().forEach(r=>withFin(c,r));changed.add(c);});changed.delete('fin');}
  changed.forEach(c=>{STORE.saveLocal(c);STORE.after(c);});if(changed.size)render();},
 apply(r,changed){
  const pend=this.outbox.some(o=>o.col===r.col&&o.id===r.id);
  /* a edição pendente partiu da versão antiga: não atualiza a versão conhecida, para o servidor acusar o conflito */
  if(r.ver!=null&&!pend)this.vers[r.col+':'+r.id]=+r.ver;
  if(r.col==='fin'){if(r.deleted)delete FIN[r.id];else FIN[r.id]=r.data&&r.data.v;changed.add('fin');return;}
  const C=COLS[r.col];const ts=+r.updated_at||0;
  if(!C)return;
  if(this.outbox.some(o=>o.col===r.col&&o.id===r.id&&o.updated_at>ts))return;   /* a edição local ainda não enviada é mais nova */
  const arr=C.get();let k=arr.findIndex(x=>String(x.id)===r.id);const cur=k>=0?arr[k]:null;
  /* depois de um conflito (409) a versão do servidor vale aqui também; a edição deste aparelho está na quarentena */
  const lost=this.rejected.some(q=>q.status===409&&q.row.col===r.col&&q.row.id===r.id);
  if(cur&&(cur.updatedAt||0)>ts&&!lost)return;
  if(r.deleted){if(k>=0){arr.splice(k,1);changed.add(r.col);}return;}
  if(cur&&(cur.updatedAt||0)===ts&&cur._by===r.updated_by)return;
  /* receita editada aqui sem ver a versão do outro aparelho: a nossa vira uma cópia de conflito */
  if(r.col==='lib'&&libConflict(cur,r.data||{},ts)){const cp=conflictCopy(cur);STORE.put('lib',cp);k=arr.findIndex(x=>String(x.id)===r.id);toast('Receita "'+cur.name+'" foi editada em outro aparelho: sua versão ficou como cópia.');}
  const rec=safeRec(withFin(r.col,Object.assign({},r.data,{id:r.id,updatedAt:ts,_by:r.updated_by})));if(!rec)return;
  if(k>=0)arr[k]=rec;else arr.unshift(rec);changed.add(r.col);}
};

/* ---------- biblioteca dos mestres: vem do banco (só Maestro e Chef) e fica guardada para uso sem internet ---------- */
const REFKEY='fredolin_app_ref';
function setMasters(list){masterDexFix(list);MASTERS.splice(0,MASTERS.length,...list);try{localStorage.setItem(REFKEY,JSON.stringify(list));}catch(e){}}
async function loadLibrary(){if(ROLE==='sous'){if(MASTERS.length)setMasters([]);return;}
 try{const rows=await SB.get('library?select=id,data&order=id.asc');if(Array.isArray(rows)&&rows.length){setMasters(rows.map(r=>r.data));render();}}catch(e){}}

