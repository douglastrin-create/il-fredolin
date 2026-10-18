/* ---------- INCERTEZA ----------
   Composição real varia: Brix das frutas (±15% sem medir; ±3% medido no refratômetro), gordura dos lácteos (±3%),
   cacau e oleaginosas (±5%), açúcares (±1%). Cada grupo é perturbado e o efeito na temperatura de serviço é somado
   em quadratura, mais ±0,4 °C do próprio modelo. A faixa mostrada cobre ≈90% dos casos (±1,65 σ). */
const UNC_G=[['Frutas (Brix)',i=>i.cat==='Frutas'&&i.brix,.15],['Lácteos',i=>i.dairy,.03],['Cacau e oleaginosas',i=>i.cat==='Cacau'||i.cat==='Oleaginosas',.05],['Açúcares',i=>i.cat==='Açúcares',.01]];
const _UNC=new Map();
function uncertainty(st){const m0=analyze(st);if(m0.empty||!(m0.wat>0))return null;let key;try{key=JSON.stringify([st.tipo,st.vit,st.recipe,st.proc,st.brix,CAL.on?CAL.ver:-1,ING_VER]);}catch(e){key=null;}
 if(key&&_UNC.has(key))return _UNC.get(key);const parts=[];let v=.4*.4;
 UNC_G.forEach(([n,sel,cv])=>{const ids=(st.recipe||[]).filter(r=>!r.inf&&ING_BY[r.id]&&sel(ING_BY[r.id])&&+r.g>0).map(r=>r.id);if(!ids.length)return;
  let st2;if(n.startsWith('Frutas')){const br=Object.assign({},st.brix||{});ids.forEach(id=>{const meas=(st.brix||{})[id];const b0=meas!=null&&meas!==''&&isFinite(+meas)?+meas:ING_BY[id].brix;const c=meas!=null&&meas!==''?.03:cv;br[id]=b0*(1+c);});st2=Object.assign({},st,{brix:br});}
  else st2=Object.assign({},st,{recipe:st.recipe.map(r=>ids.includes(r.id)?Object.assign({},r,{g:+r.g*(1+cv)}):r)});
  const d=analyze(st2).serveT-m0.serveT;v+=d*d;parts.push({n,d});});
 const sd=Math.sqrt(v),r={sd,lo:m0.serveT-1.65*sd,hi:m0.serveT+1.65*sd,parts,fzLo:m0.fz(m0.vit-1.65*sd),fzHi:m0.fz(m0.vit+1.65*sd)};
 if(key){_UNC.set(key,r);if(_UNC.size>200)_UNC.delete(_UNC.keys().next().value);}return r;}

