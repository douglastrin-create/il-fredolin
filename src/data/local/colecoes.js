/* v18.10 · CANAL DE EVENTOS entre dados e tela. Os dados avisam ("changed", "vit", "session") e a tela decide o que
   fazer (redesenhar, ajustar a vitrine, voltar ao estado inicial). Evento sem assinante fica na fila e é entregue
   quando a tela assina (a tela só assina no fim do carregamento). */
const APPEV={h:{},q:[],
 on(e,f){(this.h[e]=this.h[e]||[]).push(f);const keep=[];this.q.forEach(x=>{if(x[0]===e){try{f(x[1]);}catch(err){console.error(err);}}else keep.push(x);});this.q=keep;},
 emit(e,d){const L=this.h[e];if(!L||!L.length){if(this.q.length<100)this.q.push([e,d]);return;}L.forEach(f=>{try{f(d);}catch(err){console.error(err);}});}};
/* v18 (auditoria): gravar pode falhar (cota cheia do Safari, modo privado). Antes o erro era engolido e a alteração
   simplesmente não ficava no aparelho. Agora set() devolve true/false, guarda quais chaves falharam (LS.bad) e avisa. */
/* v18.9 · com o IndexedDB ativo (kv-boot.js), cada gravação vai para os dois; a leitura usa a cópia vencedora da
   abertura (KV.boot) e, depois, a última gravada. Se só o localStorage falhar (cota do Safari), o dado está no IndexedDB:
   não há perda nem aviso de memória cheia. Sem IndexedDB, o comportamento é o da v18. */
const LS={bad:{},
 get(k){try{const b=typeof KV!=='undefined'?KV.boot[k]:undefined;const v=b!==undefined?b:localStorage.getItem(k);return v?JSON.parse(v):null;}catch(e){return null;}},
 set(k,v){return this.setRaw(k,JSON.stringify(v));},
 setRaw(k,s){const kv=typeof KV!=='undefined'&&KV.ok&&KV.mirrored(k);if(kv){KV.boot[k]=s;KV.put(k,s);}
  try{localStorage.setItem(k,s);if(kv){const m=KV.meta();m[k]=Date.now();KV.metaSet(m);}if(this.bad[k])delete this.bad[k];return true;}
  catch(e){this.bad[k]=(e&&e.name)||'erro';if(kv)return true;const now=Date.now();
   if(typeof toast==='function'&&(!this._w||now-this._w>30000)){this._w=now;setTimeout(()=>toast('Memória do aparelho cheia: a última alteração NÃO foi gravada neste aparelho. Exporte um backup.'),0);}
   return false;}}};
/* chaves de armazenamento (mantidas desde a v9 para não perder dados salvos) */
const KEY='fredolin_v9_state',LIBKEY='fredolin_v9_lib',NXKEY='fredolin_v9_neutros';
const K10={lots:'fredolin_v10_lots',ings:'fredolin_v10_ings',inv:'fredolin_v10_inv',vit:'fredolin_v10_vit',cal:'fredolin_v10_cal'};

/* ---------- dados que chegam de fora (nuvem, backup, aparelho): ids e gramas validados antes de irem para a tela ---------- */
const SAFE_ID=/^[\w.:@-]{1,120}$/;
function cleanRecipe(arr){return Array.isArray(arr)?arr.filter(r=>r&&SAFE_ID.test(String(r.id))).map(r=>Object.assign({},r,{g:isFinite(+r.g)?Math.max(0,+r.g):0})):[];}
function safeRec(r){if(!r||typeof r!=='object'||!SAFE_ID.test(String(r.id)))return null;if(r.deleted)return r;
 if(Array.isArray(r.recipe))r.recipe=cleanRecipe(r.recipe);if(r.st&&Array.isArray(r.st.recipe))r.st.recipe=cleanRecipe(r.st.recipe);
 if(Array.isArray(r.hist))r.hist=r.hist.filter(h=>h&&h.st).map(h=>{h.st.recipe=cleanRecipe(h.st.recipe);return h;});
 if(Array.isArray(r.items))r.items.forEach(it=>{if(it)it.recipe=cleanRecipe(it.recipe);});
 if(r.parts&&typeof r.parts==='object')for(const k in r.parts)if(!SAFE_ID.test(k)||!isFinite(+r.parts[k]))delete r.parts[k];
 return r;}
const safeList=a=>(Array.isArray(a)?a:[]).map(safeRec).filter(Boolean);
/* ---------- coleções do usuário ---------- */
const EXECKEY='fredolin_v11_exec',VITSKEY='fredolin_v11_vits';
let LIB=safeList(LS.get(LIBKEY)),NXLIB=safeList(LS.get(NXKEY)),LOTS=safeList(LS.get(K10.lots)),CUST=safeList(LS.get(K10.ings)),INV=safeList(LS.get(K10.inv));
/* receitas aprovadas pelo Maestro/Chef que estão em execução (a biblioteca Il Fredolin do Sous Chef) e a vitrine da loja */
let EXEC=safeList(LS.get(EXECKEY)),VITS=safeList(LS.get(VITSKEY));
function registerCustom(ci){const ing=I(ci.id,ci.n,'Meus ingredientes',ci.c,Object.assign({},ci.x||{},{custom:1}));const k=ING.findIndex(x=>x.id===ci.id);if(k>=0)ING[k]=ing;else ING.push(ing);ING_BY[ci.id]=ing;ING_VER++;return ing;}
NXLIB.forEach(registerNeutro);CUST.forEach(registerCustom);invRecompute(INV);fitCalibration(LOTS);
{const calPref=LS.get(K10.cal);if(calPref&&calPref.on===false)CAL.on=false;}
