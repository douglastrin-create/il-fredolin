/* ===================== PONTE ENTRE FÍSICA E PERCEPÇÃO (v18.15 · §25) =====================
   Propriedades físicas → processamento oral → percepção. Para cada atributo do léxico com grandeza física associada:
   junta, lote a lote, a média do painel (perfil por escala) e o valor instrumental do mesmo lote (medido quando existe,
   senão previsto pelo motor) e calcula a correlação de Pearson com intervalo de 95% (z de Fisher).
   Também confere duas hipóteses do próprio motor com o ponto ideal: doçura percebida (POD corrigido pela temperatura)
   × JAR de doçura e água congelada × JAR de dureza.
   Regras:
   - com menos de 5 lotes avaliados não há conclusão ("dados insuficientes");
   - correlação não é causa, e o resultado vale para este painel, estas receitas e esta faixa;
   - a variação entre avaliadores entra em cada lote como desvio-padrão e no peso da conclusão (n de lotes). */
const BRIDGE_MIN=5;
function pearson(x,y){const n=x.length;if(n<3)return null;const mx=sMean(x),my=sMean(y);let sxy=0,sxx=0,syy=0;for(let i=0;i<n;i++){sxy+=(x[i]-mx)*(y[i]-my);sxx+=(x[i]-mx)**2;syy+=(y[i]-my)**2;}
 if(!(sxx>0&&syy>0))return{n,r:null};const r=sxy/Math.sqrt(sxx*syy);const rr=Math.max(-.999999,Math.min(.999999,r));
 const z=Math.atanh(rr),se=n>3?1/Math.sqrt(n-3):null,t=rr*Math.sqrt((n-2)/(1-rr*rr));
 return{n,r,lo:se?Math.tanh(z-1.96*se):null,hi:se?Math.tanh(z+1.96*se):null,p:tP2(Math.abs(t),n-2)};}
/* estado do motor para o lote, na temperatura em que foi avaliado (mesma regra da calibração) */
function lotSt(L){const me=L.meas||{};return{tipo:L.tipo,vit:me.texTemp!=null&&me.texTemp!==''?+me.texTemp:L.vit,recipe:L.recipe,proc:L.proc||{},brix:L.brix||{},costs:{}};}
function bridgeVerdict(c){if(!c||c.n<BRIDGE_MIN)return'dados insuficientes';if(c.r==null)return'sem variação para comparar';if(c.p<=.05)return(c.r>0?'relação positiva':'relação negativa')+' provável';return'sem relação detectável';}
function sensBridge(lots){const rows=[];const evs=(lots||[]).filter(L=>L&&L.recipe&&L.recipe.length&&(L.panel||[]).length);
 const ms=new Map();const mOf=L=>{if(!ms.has(L.id)){const p=CAL.on;CAL.on=false;try{ms.set(L.id,analyzeRaw(lotSt(L)));}finally{CAL.on=p;}}return ms.get(L.id);};
 SENS_ATTR.filter(a=>a.inst).forEach(a=>{const pts=[];
  evs.forEach(L=>{const v=(L.panel||[]).filter(e=>e&&e.m==='qda'&&e.a&&e.a[a.id]!=null).map(e=>+e.a[a.id]);if(!v.length)return;
   const m=mOf(L);const iv=a.inst.f(m,L.meas||{});if(!iv||!isFinite(iv[0]))return;pts.push({lot:L.code||L.id,x:iv[0],src:iv[1],y:sMean(v),sd:sSd(v),n:v.length});});
  const c=pts.length>=3?pearson(pts.map(p=>p.x),pts.map(p=>p.y)):null;
  rows.push({id:a.id,n:a.n,inst:a.inst.n,u:a.inst.u,lots:pts.length,tasters:pts.reduce((s,p)=>s+p.n,0),sdTaster:pts.filter(p=>p.sd!=null).length?sMean(pts.filter(p=>p.sd!=null).map(p=>p.sd)):null,
   measured:pts.filter(p=>p.src==='medido').length,c,verdict:bridgeVerdict(c?{...c,n:pts.length}:null),pts});});
 /* hipóteses do motor × ponto ideal: se a previsão estivesse certa e a receita no ponto, o JAR ficaria perto de 0 */
 const jar=(key,label,inst)=>{const pts=[];evs.forEach(L=>{const v=(L.panel||[]).filter(e=>e&&(!e.m||e.m==='jar')&&!e.ex&&e[key]!=null&&e[key]!=='').map(e=>+e[key]);if(!v.length)return;const m=mOf(L);pts.push({lot:L.code||L.id,x:inst(m),y:sMean(v),sd:sSd(v),n:v.length});});
  const c=pts.length>=3?pearson(pts.map(p=>p.x),pts.map(p=>p.y)):null;return{id:key,n:label,lots:pts.length,c,verdict:bridgeVerdict(c?{...c,n:pts.length}:null),pts};};
 const hyp=[jar('jDoce','Doçura (ponto ideal) × doçura prevista na temperatura de serviço',m=>m.podPerc),jar('jDuro','Dureza (ponto ideal) × água congelada prevista',m=>m.fzVit)];
 return{rows,hyp,min:BRIDGE_MIN};}
