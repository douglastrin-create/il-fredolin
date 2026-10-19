/* ===================== DESEMPENHO DO MOTOR (v18.14 · §11, §13) =====================
   Bateria única de medição: a mesma lista de operações roda no Node (tools/bench.mjs), nos navegadores do CI
   (tests/e2e/bench.mjs) e no próprio aparelho (Ciência do motor → Desempenho deste aparelho, dentro do Web Worker).
   Cada execução usa uma receita diferente (contador global; o primeiro ingrediente varia até 10 g em passos de 0,1 mg) para nunca medir o cache. Mediana de n repetições.
   Classes de orçamento (§13):
     diário  — roda a cada toque na bancada; precisa parecer instantâneo (< 50 ms no aparelho)
     pesado  — roda sob demanda; vai para o Web Worker com progresso e cancelamento (< 2 s no aparelho) */
const BENCH_BUDGET={diario:50,pesado:2000};
function benchState(name,k){const p=PRESETS.find(x=>x.name===name)||PRESETS[0];
 return{tipo:p.tipo,vit:p.vit,recipe:p.recipe.map(([id,g],i)=>({id,g:i===0?g+(k%100000)*1e-4:g})),proc:Object.assign({},PROC0),brix:{},costs:{}};}
function benchGen(k){const P=PROF.crema;return Object.assign({tipo:'crema',batch:1000+(k%100000)*1e-4,fixed:[],stabId:'nx_fredolin',stabGkg:25,vit:-12,proc:{}},genDef('crema'));}
const BENCH_OPS=[
 {id:'analise',n:'Análise da receita (composição, congelamento, overrun…)',cls:'diario',reps:40,fn:k=>analyzeRaw(benchState('Fiordilatte',k))},
 {id:'laudo',n:'Análise + laudo (diagnóstico)',cls:'diario',reps:30,fn:k=>{const st=benchState('Pistacchio',k);diagnose(st,analyzeRaw(st));}},
 {id:'incerteza',n:'Faixa de incerteza (linear)',cls:'diario',reps:20,fn:k=>uncertainty(benchState('Sorbetto di fragola',k))},
 {id:'quenelle',n:'Textura e quenelle',cls:'diario',reps:30,fn:k=>quenelleModel(analyzeRaw(benchState('Nocciola',k)))},
 {id:'pote',n:'Pote saindo do freezer (condução 1-D)',cls:'diario',reps:15,fn:k=>{const pr=Object.assign({},PROC0,{serveFrom:'pote',poteMl:500});const st=benchState('Fiordilatte',k);st.proc=pr;poteModel(analyzeRaw(st),pr);}},
 {id:'balancear',n:'Balancear açúcares',cls:'diario',reps:10,fn:k=>{const st=benchState('Cioccolato fondente',k);st.vit=-14;balance(st);}},
 {id:'gerar',n:'Gerar receita por alvo',cls:'diario',reps:10,fn:k=>generate(benchGen(k))},
 {id:'endurecimento',n:'Endurecimento até o centro pronto',cls:'pesado',reps:5,fn:k=>hardenModel(analyzeRaw(benchState('Fiordilatte',k)),PROC0)},
 {id:'ciclo',n:'Ciclo completo (gêmeo do processo)',cls:'pesado',reps:5,fn:k=>cycleTwin(analyzeRaw(benchState('Pistacchio',k)),PROC0,{fridge:4.5})},
 {id:'oscilacao',n:'Oscilação do freezer, simulação completa (3 h)',cls:'pesado',reps:3,fn:k=>storeResponseSim(analyzeRaw(benchState('Fiordilatte',k)),Object.assign({},PROC0,{poteMl:500}),3,1)},
 {id:'montecarlo',n:'Monte Carlo da incerteza (300 sorteios)',cls:'pesado',reps:3,fn:k=>uncertaintyMC(benchState('Sorbetto di fragola',k),{n:300})},
 {id:'alternativas',n:'Alternativas e compromissos (60 metas)',cls:'pesado',reps:3,fn:k=>genFrontier(benchGen(k),['sug','sol','melt'])}];
let benchSeq=1;
const benchNow0=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();
/* roda a bateria; onProgress(i, total, id) depois de cada operação. scale < 1 reduz as repetições (teste rápido). */
function benchRun(o){o=o||{};const scale=o.scale||1,only=o.only,benchNow=o.now||benchNow0;const ops=(o.ops||BENCH_OPS).filter(x=>!only||only.includes(x.id));const out=[];const t0=benchNow();const cal=CAL.on;CAL.on=false;
 try{ops.forEach((op,i)=>{const reps=Math.max(1,Math.round(op.reps*scale));op.fn(benchSeq++);/* aquecimento (JIT) */const ts=[];
  /* lote: o Safari arredonda o relógio a 1 ms. O lote dobra até durar ≥ 20 ms (erro do relógio < 5%); cada repetição
     mede um lote inteiro e divide. (v18.14.1: a regra anterior decidia o lote por UMA leitura do relógio grosso e
     gerava medianas quantizadas, como 1/4 ou 1/200 ms, no iPhone.) */
  let inner=1;for(;;){const a=benchNow();for(let j=0;j<inner;j++)op.fn(benchSeq++);const d=benchNow()-a;if(d>=20||inner>=4096)break;inner*=2;}
  const rr=inner>1?Math.min(reps,9):reps;
  for(let k=0;k<rr;k++){const a=benchNow();for(let j=0;j<inner;j++)op.fn(benchSeq++);ts.push((benchNow()-a)/inner);}ts.sort((a,b)=>a-b);
  out.push({id:op.id,n:op.n,cls:op.cls,reps:rr,inner,med:ts[Math.floor(ts.length/2)],min:ts[0],max:ts[ts.length-1],budget:BENCH_BUDGET[op.cls]});
  if(o.onProgress)o.onProgress(i+1,ops.length,op.id);});}
 finally{CAL.on=cal;}
 return{ops:out,totalMs:benchNow()-t0,at:Date.now()};}
/* veredito por classe: dentro do orçamento, perto (até 2×) ou fora */
function benchVerdict(r){return r.med<=r.budget?'ok':r.med<=2*r.budget?'warn':'crit';}
