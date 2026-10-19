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

/* ---------- MONTE CARLO (v18.12 · §10, §12) ----------
   Mesmas fontes de variação do cálculo linear, mas cada ingrediente sorteado de forma independente (N(0, cv)),
   o mesmo ingrediente igual em todo o lote, mais o erro do modelo N(0; 0,4 °C). Cada amostra roda a análise completa
   (sem a memória de cálculo), então não-linearidades da curva de congelamento aparecem nos percentis.
   Diferença para o linear: o linear trata ingredientes do mesmo grupo como totalmente correlacionados (conservador);
   aqui são independentes. Comparar os dois mostra quanto essa hipótese pesa.
   Contribuição de cada entrada = correlação² entre o sorteio dela e o resultado (normalizada). Sorteio reproduzível (semente). */
function uncInputs(st){const out=[];(st.recipe||[]).forEach(r=>{const i=ING_BY[r.id];if(!i||r.inf||!(+r.g>0))return;
 for(const [n,sel,cv,kind] of UNC_G)if(sel(i)){let c=cv;if(kind==='brix'){const me=(st.brix||{})[r.id];if(me!=null&&me!==''&&isFinite(+me))c=.03;}
  out.push({id:r.id,name:i.n,group:n,kind,cv:c});break;}});return out;}
const _UNCMC=new Map();
function uncertaintyMC(st,o){o=o||{};const N=Math.max(30,Math.min(2000,o.n||300)),seed=o.seed||7;const m0=analyzeRaw(st);if(m0.empty||!(m0.wat>0))return null;
 let key;try{key=JSON.stringify([st.tipo,st.vit,st.recipe,st.proc,st.brix,CAL.on?CAL.ver:-1,ING_VER,N,seed]);}catch(e){key=null;}
 if(key&&_UNCMC.has(key))return _UNCMC.get(key);
 const ins=uncInputs(st),rnd=mulberry32(seed);const nrm=()=>{let u=0;while(!u)u=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*rnd());};
 const ys=[],Z=ins.map(()=>[]),fz=[];const t0=Date.now();
 for(let s=0;s<N;s++){const br=Object.assign({},st.brix||{});const tmp=[];const ids={};
  ins.forEach((p,j)=>{const z=nrm();Z[j].push(z);const i=ING_BY[p.id];
   if(p.kind==='brix'){const me=(st.brix||{})[p.id];const b0=me!=null&&me!==''&&isFinite(+me)?+me:i.brix;br[p.id]=Math.max(0,b0*(1+p.cv*z));}
   else{const t=uncClone(i,p.kind,p.cv*z);t.id='~m'+p.id;tmp.push(t);ids[p.id]=t.id;}});
  tmp.forEach(t=>{ING_BY[t.id]=t;});
  let m;try{m=analyzeRaw(Object.assign({},st,{brix:br,recipe:st.recipe.map(r=>ids[r.id]?Object.assign({},r,{id:ids[r.id]}):r)}));}finally{tmp.forEach(t=>{delete ING_BY[t.id];});}
  const e=.4*nrm();ys.push(m.serveT+e);fz.push(m.fzVit);}
 const srt=[...ys].sort((a,b)=>a-b),q=p=>srt[Math.min(N-1,Math.max(0,Math.round(p*(N-1))))];
 const mean=ys.reduce((a,b)=>a+b,0)/N,sd=Math.sqrt(ys.reduce((a,b)=>a+(b-mean)*(b-mean),0)/(N-1));
 const corr=(a,b)=>{const ma=a.reduce((x,y)=>x+y,0)/a.length,mb=b.reduce((x,y)=>x+y,0)/b.length;let sab=0,sa=0,sb=0;for(let k=0;k<a.length;k++){const da=a[k]-ma,db=b[k]-mb;sab+=da*db;sa+=da*da;sb+=db*db;}return sa&&sb?sab/Math.sqrt(sa*sb):0;};
 let contrib=ins.map((p,j)=>({id:p.id,name:p.name,group:p.group,r2:Math.pow(corr(Z[j],ys),2)}));
 const tot=contrib.reduce((a,c)=>a+c.r2,0);const model=.16/(sd*sd||1);
 contrib=contrib.map(c=>Object.assign(c,{share:c.r2})).sort((a,b)=>b.r2-a.r2);
 const fs=[...fz].sort((a,b)=>a-b);
 const r={n:N,seed,base:m0.serveT,mean,sd,p05:q(.05),p50:q(.5),p95:q(.95),fz05:fs[Math.round(.05*(N-1))],fz95:fs[Math.round(.95*(N-1))],contrib,modelShare:Math.min(1,model),inputs:ins.length,ms:Date.now()-t0};
 if(key){_UNCMC.set(key,r);if(_UNCMC.size>30)_UNCMC.delete(_UNCMC.keys().next().value);}return r;}
