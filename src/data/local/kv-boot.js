/* ===================== v18.9 · ARMAZENAMENTO LOCAL: IndexedDB principal, localStorage espelho (§42) =====================
   Este trecho roda ANTES do app. Ele abre o IndexedDB, concilia com o localStorage e só então executa o app
   (que continua lendo de forma síncrona, como sempre). Por quê:
   · localStorage no Safari tem cota de ~5 MB, grava sem transação e pode ser apagado/corrompido sem cópia;
   · IndexedDB tem cota maior, transações e sobrevive quando o espelho falha.
   Regras:
   · cada gravação vai para os dois (LS.set); na abertura, por chave, vale a cópia mais nova (carimbo de tempo);
   · migração não destrutiva: na primeira abertura todas as chaves fredolin_* são copiadas; nada é apagado do localStorage;
   · sem IndexedDB (navegador antigo, modo privado) ou se ele demorar mais de 2,5 s: o app abre só com o localStorage,
     exatamente como antes;
   · caches que se baixam de novo (biblioteca dos mestres, ajuste térmico, menu) ficam só no localStorage. */
const KV_DB='fredolin',KV_META='fredolin_kvat',KV_SKIP=new Set(['fredolin_app_ref','fredolin_nav','fredolin_hfit_v1','fredolin_kvat']);
const KV={ok:false,reason:'',boot:Object.create(null),db:null,pend:new Map(),timer:null,bad:null,restored:[],migrated:0,keys:0,ms:0,
 meta(){try{return JSON.parse(localStorage.getItem(KV_META))||{};}catch(e){return{};}},
 metaSet(m){try{localStorage.setItem(KV_META,JSON.stringify(m));return true;}catch(e){return false;}},
 mirrored:k=>typeof k==='string'&&k.startsWith('fredolin_')&&!KV_SKIP.has(k),
 /* grava no IndexedDB em lote (uma transação por lote: tudo ou nada) */
 put(k,s){if(!this.ok||!this.mirrored(k))return;this.pend.set(k,{k,s,at:Date.now()});if(!this.timer)this.timer=setTimeout(()=>this.flush(),250);},
 flush(){clearTimeout(this.timer);this.timer=null;if(!this.ok||!this.pend.size)return Promise.resolve(true);const batch=[...this.pend.values()];
  return new Promise(res=>{let tx;try{tx=this.db.transaction('kv','readwrite');}catch(e){this.fail(e);res(false);return;}
   const st=tx.objectStore('kv');batch.forEach(r=>st.put(r));
   tx.oncomplete=()=>{batch.forEach(r=>{const p=this.pend.get(r.k);if(p&&p.at===r.at)this.pend.delete(r.k);});this.bad=null;res(true);};
   tx.onerror=tx.onabort=()=>{this.fail(tx.error);res(false);};});},
 fail(e){this.bad=(e&&e.name)||'erro';const now=Date.now();
  if(typeof toast==='function'&&(!this._w||now-this._w>30000)){this._w=now;setTimeout(()=>toast('O armazenamento principal do aparelho recusou a gravação ('+this.bad+'). Exporte um backup.'),0);}}};
function kvReq(r){return new Promise((ok,ko)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error);});}
async function kvOpen(){const r=indexedDB.open(KV_DB,1);
 r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('kv'))db.createObjectStore('kv',{keyPath:'k'});if(!db.objectStoreNames.contains('snap'))db.createObjectStore('snap',{keyPath:'id'});};
 return kvReq(r);}
/* concilia por chave: a cópia mais nova vale; espelho e principal são reparados; o app recebe a vencedora em KV.boot */
async function kvReconcile(){const t0=performance.now();const db=await kvOpen();KV.db=db;
 const recs=await kvReq(db.transaction('kv').objectStore('kv').getAll());const idb=new Map(recs.map(r=>[r.k,r]));
 const meta=KV.meta(),now=Date.now(),lsKeys=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(KV.mirrored(k))lsKeys.push(k);}
 const toIdb=[];let metaDirty=false;
 for(const k of new Set([...idb.keys(),...lsKeys])){let ls=null;try{ls=localStorage.getItem(k);}catch(e){}
  const rec=idb.get(k),lsAt=+meta[k]||0;
  if(!rec){if(ls!=null){toIdb.push({k,s:ls,at:lsAt||now});if(!lsAt){meta[k]=now;metaDirty=true;}if(!recs.length)KV.migrated++;}continue;}
  if(ls==null||rec.at>lsAt){KV.boot[k]=rec.s;if(ls!==rec.s){KV.restored.push(k);try{localStorage.setItem(k,rec.s);meta[k]=rec.at;metaDirty=true;}catch(e){}}}
  else if(lsAt>rec.at&&ls!==rec.s)toIdb.push({k,s:ls,at:lsAt});}
 if(toIdb.length)await new Promise((ok,ko)=>{const tx=db.transaction('kv','readwrite');const st=tx.objectStore('kv');toIdb.forEach(r=>st.put(r));tx.oncomplete=ok;tx.onerror=tx.onabort=()=>ko(tx.error);});
 if(metaDirty)KV.metaSet(meta);
 KV.keys=new Set([...idb.keys(),...toIdb.map(r=>r.k)]).size;KV.ok=true;KV.ms=Math.round(performance.now()-t0);}
/* executa o app (o script principal está guardado como texto) uma única vez */
function kvStartApp(){if(kvStartApp.done)return;kvStartApp.done=true;const src=document.getElementById('fredolin-app');
 const s=document.createElement('script');s.text=src.textContent;document.body.appendChild(s);}
(function kvBoot(){
 if(typeof indexedDB==='undefined'||!indexedDB){KV.reason='indisponível neste navegador';kvStartApp();return;}
 const limit=setTimeout(()=>{if(!kvStartApp.done){KV.ok=false;KV.reason='não respondeu em 2,5 s';kvStartApp();}},2500);
 kvReconcile().then(()=>{clearTimeout(limit);if(kvStartApp.done){KV.ok=false;return;}kvStartApp();})
  .catch(e=>{clearTimeout(limit);KV.ok=false;KV.reason=(e&&e.name)||'erro ao abrir';kvStartApp();});
 const out=()=>{try{KV.flush();}catch(e){}};addEventListener('pagehide',out);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')out();});})();
