/* ===================== v18.9 · CÓPIAS AUTOMÁTICAS NO APARELHO (§42, §45) =====================
   Uma cópia por dia, no formato do backup exportado (schema 2), guardada no IndexedDB (loja "snap"); ficam as 7 mais
   recentes. Restaurar usa a mesma importação planejada do backup: mostra o que muda e nunca troca registro igual ou
   mais novo deste aparelho. Não substitui o backup exportado (que sai do aparelho). */
const SNAP_KEEP=7;
const snapOn=()=>typeof KV!=='undefined'&&KV.ok&&!!KV.db;
function snapTx(mode,fn){return new Promise((ok,ko)=>{const tx=KV.db.transaction('snap',mode);const r=fn(tx.objectStore('snap'));tx.oncomplete=()=>ok(r&&r.result);tx.onerror=tx.onabort=()=>ko(tx.error);});}
async function kvSnapList(){if(!snapOn())return[];const all=await snapTx('readonly',st=>st.getAll());
 return(all||[]).map(s=>({id:s.id,at:s.at,n:s.n,size:s.size,v:s.v})).sort((a,b)=>b.id<a.id?-1:1);}
async function kvSnapGet(id){if(!snapOn())return null;const r=await snapTx('readonly',st=>st.get(id));return r||null;}
/* meta: {v: versão do app, date: AAAA-MM-DD}. Uma por dia (a do dia é atualizada). */
async function kvSnapTake(meta){if(!snapOn())return{ok:false,msg:'armazenamento principal indisponível'};
 await KV.flush();const cols={};BACKUP_COLS.forEach(c=>cols[c]=COLS[c].get());
 const n=BACKUP_COLS.reduce((a,c)=>a+(Array.isArray(cols[c])?cols[c].filter(r=>r&&!r.deleted).length:0),0);
 if(!n)return{ok:false,msg:'nada para guardar ainda'};
 const id=(meta&&meta.date)||new Date().toISOString().slice(0,10);
 const json=JSON.stringify(backupPayload(cols,STORE.tomb,Object.assign({auto:true},meta||{})));
 try{await snapTx('readwrite',st=>st.put({id,at:Date.now(),n,size:json.length,v:meta&&meta.v,json}));
  const L=await kvSnapList();const old=L.slice(SNAP_KEEP);if(old.length)await snapTx('readwrite',st=>{old.forEach(s=>st.delete(s.id));});
  return{ok:true,id,n,size:json.length};}
 catch(e){KV.fail(e);return{ok:false,msg:(e&&e.name)||'erro'};}}
