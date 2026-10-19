/* ---------- VALIDAÇÃO PELOS LOTES MEDIDOS (v18.8 · §46–48) ----------
   Três níveis (§47): verificação de software (testes), verificação matemática (conservação, convergência) e validação
   científica. Esta é a terceira: compara o que o motor previu com o que foi medido nos lotes da produção.
   Para não usar o mesmo lote para ajustar e para conferir, cada lote é previsto com a calibração feita SEM ele
   (validação cruzada deixa-um-fora); o erro "sem calibração" também é mostrado. Nada aqui promove um modelo a
   "validado": o status diz quanto dado existe e se o erro fora-da-amostra ficou dentro da tolerância registrada. */
const VAL_Q={
 ov:{n:'Overrun',u:'p.p.',model:'overrun',tol:5,k:3,cal:true},
 melt:{n:'Derretido em 10 min',u:'p.p.',model:'melt',tol:10,k:3,cal:true},
 brix:{n:'°Brix da mistura',u:'°Bx',model:'composition',tol:1,cal:false},
 ph:{n:'pH',u:'pH',model:'ph',tol:.2,cal:false},
 core:{n:'Núcleo do pote no freezer',u:'°C',model:'heat-transfer',tol:2,cal:false},
 tex:{n:'Textura na vitrine',u:'pontos (−2…+2)',model:'frozen-fraction',tol:1,cal:false}};
const VAL_MIN=5;
function valStats(e){const n=e.length;if(!n)return null;const b=e.reduce((a,x)=>a+x,0)/n;return{n,bias:b,mae:e.reduce((a,x)=>a+Math.abs(x),0)/n,rmse:Math.sqrt(e.reduce((a,x)=>a+x*x,0)/n)};}
/* res = CAL.res (pares [previsto sem calibração, medido] por lote). Erro = medido − previsto. */
function validateLOO(res){const out={};
 for(const q in VAL_Q){const Q=VAL_Q[q];const rows=[];
  (res||[]).forEach(r=>{const p=r[q];if(!Array.isArray(p))return;const pred=+p[0],meas=+p[1];if(!isFinite(pred)||!isFinite(meas))return;rows.push({id:r.id,code:r.code,tipo:r.tipo||'?',g:q==='ov'?(r.ovKey||'?'):'all',pred,meas});});
  rows.forEach(x=>{x.raw=x.meas-x.pred;if(Q.cal){const o=rows.filter(y=>y!==x&&y.g===x.g).map(y=>y.meas-y.pred);const bias=o.length?o.reduce((a,b)=>a+b,0)/(o.length+Q.k):0;x.loo=x.meas-(x.pred+bias);}else x.loo=x.raw;});
  const fams={};rows.forEach(x=>{(fams[x.tipo]=fams[x.tipo]||[]).push(x);});
  const st=(L)=>{const raw=valStats(L.map(x=>x.raw)),loo=valStats(L.map(x=>x.loo));const n=L.length;
   return{n,raw,loo,status:!n?'sem dados':n<VAL_MIN?'evidência inicial':loo.rmse<=Q.tol?'dentro da tolerância':'avaliado'};};
  const F={};for(const t in fams)F[t]=st(fams[t]);
  out[q]={...Q,all:st(rows),fam:F,rows};}
 return out;}
/* ---------- COBERTURA DA FAIXA DE 90% (v18.12) ----------
   Lote com textura "ideal" (0) numa temperatura medida é uma observação da temperatura de serviço real. Se a faixa
   mostrada é honesta, ~90% dessas observações caem dentro dela. Usa a faixa linear (a que o app mostra) e, sem
   calibração, para não usar o lote que se quer conferir. Poucos lotes: o número é informativo, não conclusivo. */
function uncCoverage(lots){const prev=CAL.on;CAL.on=false;const rows=[];
 try{(lots||[]).forEach(L=>{const me=L.meas||{};if(!(me.tex!==''&&me.tex!=null&&+me.tex===0&&me.texTemp!==''&&me.texTemp!=null&&isFinite(+me.texTemp)))return;
  if(!Array.isArray(L.recipe)||!L.recipe.length)return;const st={tipo:L.tipo,vit:+me.texTemp,recipe:L.recipe,proc:L.proc||{},brix:L.brix||{},costs:{}};
  const u=uncertainty(st);if(!u)return;const T=+me.texTemp;rows.push({id:L.id,code:L.code,tipo:L.tipo,T,lo:u.lo,hi:u.hi,inside:T>=Math.min(u.lo,u.hi)&&T<=Math.max(u.lo,u.hi)});});}
 finally{CAL.on=prev;}
 const n=rows.length,k=rows.filter(r=>r.inside).length;
 return{n,k,pct:n?k/n*100:null,rows,status:!n?'sem dados':n<10?'evidência inicial':k/n>=.8?'coerente com 90%':'faixa estreita demais'};}
