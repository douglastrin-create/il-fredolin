/* ---------- INCERTEZA (v18.11) ----------
   A composição real de cada ingrediente varia. Cada grupo tem a sua composição perturbada (não a massa pesada):
   · frutas: °Brix ±15% sem medir, ±3% medido no refratômetro;
   · lácteos: gordura ±3% (variação de rótulo/lote; estimativa do app);
   · cacau e oleaginosas: gordura ±5% (estimativa do app);
   · ingredientes SEM FONTE: sólidos ±10% (o que não se sabe de onde vem alarga a faixa);
   · substâncias de definição (açúcares puros, água, sal): desprezível.
   Até a v18.10 os grupos de lácteos, cacau/oleaginosas e açúcares mudavam a MASSA pesada (±3/5/1%), o que simula erro
   de balança, não de composição, apesar do texto dizer "gordura". Os efeitos na temperatura de serviço somam em
   quadratura, mais ±0,4 °C do próprio modelo; a faixa mostrada é ±1,65 σ (≈ 90% se as hipóteses valerem; cobertura
   ainda não conferida com medições). Dentro de um grupo a variação é tratada como totalmente correlacionada. */
const UNC_G=[['Frutas (Brix)',i=>i.cat==='Frutas'&&i.brix,.15,'brix'],
 ['Lácteos (gordura)',i=>i.dairy&&(i.c.fat||0)>.5&&ingProv(i)!=='sem',.03,'fat'],
 ['Cacau e oleaginosas (gordura)',i=>(i.cat==='Cacau'||i.cat==='Oleaginosas')&&(i.c.fat||0)>.5&&ingProv(i)!=='sem',.05,'fat'],
 ['Sem fonte (sólidos)',i=>ingProv(i)==='sem'&&!(i.cat==='Frutas'&&i.brix),.10,'sol']];
/* cópia do ingrediente com a composição perturbada (a água compensa; nada fica negativo) */
function uncClone(i,kind,cv){const c=Object.assign({},i.c);let d=0;
 if(kind==='fat'){const f=c.fat||0;c.fat=f*(1+cv);d=c.fat-f;}
 else{for(const k in c)if(k!=='w'){const v=+c[k]||0;c[k]=v*(1+cv);d+=c[k]-v;}}
 c.w=Math.max(0,(c.w||0)-d);return Object.assign({},i,{c,id:'~u'+i.id});}
const _UNC=new Map();
function uncertainty(st){const m0=analyze(st);if(m0.empty||!(m0.wat>0))return null;let key;try{key=JSON.stringify([st.tipo,st.vit,st.recipe,st.proc,st.brix,CAL.on?CAL.ver:-1,ING_VER]);}catch(e){key=null;}
 if(key&&_UNC.has(key))return _UNC.get(key);const parts=[];let v=.4*.4;
 UNC_G.forEach(([n,sel,cv,kind])=>{const ids=(st.recipe||[]).filter(r=>!r.inf&&ING_BY[r.id]&&sel(ING_BY[r.id])&&+r.g>0).map(r=>r.id);if(!ids.length)return;
  let d;
  if(kind==='brix'){const br=Object.assign({},st.brix||{});ids.forEach(id=>{const meas=(st.brix||{})[id];const b0=meas!=null&&meas!==''&&isFinite(+meas)?+meas:ING_BY[id].brix;const c=meas!=null&&meas!==''?.03:cv;br[id]=b0*(1+c);});d=analyze(Object.assign({},st,{brix:br})).serveT-m0.serveT;}
  else{const tmp=ids.map(id=>uncClone(ING_BY[id],kind,cv));tmp.forEach(t=>{ING_BY[t.id]=t;});
   try{d=analyze(Object.assign({},st,{recipe:st.recipe.map(r=>ids.includes(r.id)?Object.assign({},r,{id:'~u'+r.id}):r)})).serveT-m0.serveT;}
   finally{tmp.forEach(t=>{delete ING_BY[t.id];});}}
  v+=d*d;parts.push({n,d});});
 const sd=Math.sqrt(v),r={sd,lo:m0.serveT-1.65*sd,hi:m0.serveT+1.65*sd,parts,fzLo:m0.fz(m0.vit-1.65*sd),fzHi:m0.fz(m0.vit+1.65*sd)};
 if(key){_UNC.set(key,r);if(_UNC.size>200)_UNC.delete(_UNC.keys().next().value);}return r;}

