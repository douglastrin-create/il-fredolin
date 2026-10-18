/* ---------- conflito de edição (receita editada em dois aparelhos sem ver a versão do outro) ---------- */
/* cur = cópia local; rd = registro remoto; ts = hora da edição remota. Conflito: a cópia local é uma edição feita aqui
   (sem _by), o remoto não partiu dela (base diferente) e o conteúdo difere. */
function libConflict(cur,rd,ts){if(!cur||cur._by||!(ts>(cur.updatedAt||0)))return false;if((rd.base||0)===(cur.updatedAt||0))return false;
 try{return JSON.stringify(cur.st)!==JSON.stringify(rd.st);}catch(e){return false;}}
function conflictCopy(cur){const d=new Date();const c=JSON.parse(JSON.stringify(cur));c.id=String(Date.now())+'c';c.name=cur.name+' (conflito '+d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+')';delete c._by;delete c.base;c.conflict=1;if(c.st)c.st.name=c.name;return c;}
