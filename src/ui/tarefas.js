/* ===================== TAREFAS PESADAS NO WEB WORKER (v18.14 · §13) =====================
   Cálculos sob demanda (Monte Carlo, medição de desempenho) rodam fora da tela: um Web Worker com o mesmo motor
   (trecho 01-util → 33-golden do próprio app), com progresso e cancelamento. Cancelar = encerrar o worker; nada fica
   pela metade no estado do app, porque o worker só devolve o resultado no fim.
   O worker recebe o que muda o resultado: ingredientes próprios, neutros, custos, lotes (calibração), calibração
   ligada/desligada e a forma de dextrose. Sem Web Worker, a tarefa roda na própria página (mesmo resultado). */
const JOB_HANDLER=`
let _ok=false;
self.onmessage=async e=>{const d=e.data;try{
 if(!_ok){_ok=true;(d.cust||[]).forEach(ci=>{const ing=I(ci.id,ci.n,'Meus ingredientes',ci.c,Object.assign({},ci.x||{},{custom:1}));ING.push(ing);ING_BY[ci.id]=ing;});
  (d.nx||[]).forEach(n=>{try{registerNeutro(n);}catch(x){}});Object.assign(INVCOST,d.invcost||{});fitCalibration(d.lots||[]);}
 CAL.on=d.calOn;if(d.dex)DEX_PREF=()=>d.dex;
 const prog=(p,l)=>self.postMessage({id:d.id,progress:p,label:l||''});let r;
 if(d.job==='bench'){r=benchRun({scale:d.scale||1,onProgress:(i,n,op)=>prog(i/n,op)});
  if(d.wasm){prog(1,'wasm');try{(0,eval)(d.wasm.src);r.wasm=await wasmCompare({analyze,heatSim,PRESETS,PROC0,clamp},d.wasm.bytes,9);}catch(x){r.wasm={err:String(x&&x.message||x)};}}}
 else if(d.job==='mc')r=uncertaintyMC(d.st,{n:d.n,onProgress:p=>prog(p)});
 else throw new Error('tarefa desconhecida: '+d.job);
 self.postMessage({id:d.id,result:r});}catch(err){self.postMessage({id:d.id,error:String(err&&err.message||err)});}};`;
function engineSrc(){const sc=[...document.scripts].map(s=>s.textContent).find(t=>t.includes('/* ==== 01-util.js ==== */'));if(!sc)return null;
 const a=sc.indexOf('/* ==== 01-util.js ==== */'),b=sc.indexOf('/* ==== 33-golden.js ==== */');return a<0||b<0?null:sc.slice(a,b)+'\n'+JOB_HANDLER;}
let _jobSeq=0;
/* runJob('mc', {st, n}, {onProgress}) → {promise, cancel}. promise resolve {result, ms, worker, startMs} ou rejeita com Error('cancelado') */
function runJob(job,payload,o){o=o||{};const id=++_jobSeq,t0=Date.now();let w=null,done=false,cancel=()=>{};
 const promise=new Promise((res,rej)=>{
  const local=()=>{/* sem worker: mesma função, na página */setTimeout(()=>{if(done)return;try{const r=job==='bench'?benchRun({scale:payload.scale||1,onProgress:(i,n,op)=>o.onProgress&&o.onProgress(i/n,op)}):job==='mc'?uncertaintyMC(payload.st,{n:payload.n}):null;done=true;res({result:r,ms:Date.now()-t0,worker:false});}catch(e){done=true;rej(e);}},30);};
  cancel=()=>{if(done)return;done=true;try{w&&w.terminate();}catch(e){}rej(new Error('cancelado'));};
  if(typeof Worker!=='function'||typeof Blob!=='function'||o.noWorker){local();return;}
  try{const src=engineSrc();if(!src){local();return;}w=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));}catch(e){w=null;local();return;}
  let first=null;
  w.onmessage=e=>{const d=e.data;if(d.id!==id||done)return;if(first==null)first=Date.now()-t0;
   if(d.progress!=null){o.onProgress&&o.onProgress(d.progress,d.label);return;}
   done=true;try{w.terminate();}catch(x){}if(d.error)rej(new Error(d.error));else res({result:d.result,ms:Date.now()-t0,worker:true,startMs:first});};
  w.onerror=ev=>{if(done)return;done=true;try{w.terminate();}catch(x){}rej(new Error('worker: '+(ev&&ev.message||'erro')));};
  w.postMessage(Object.assign({id,job,cust:CUST,nx:NXLIB,lots:LOTS,calOn:CAL.on,invcost:INVCOST,dex:DEX_PREF()},payload));});
 return{promise,cancel:()=>cancel()};}

/* ---------- medição deste aparelho (Ciência do motor) ---------- */
const BENCH_KEY='fredolin_bench_v1';
function benchSaved(){try{const v=JSON.parse(localStorage.getItem(BENCH_KEY)||'[]');return Array.isArray(v)?v:[];}catch(e){return[];}}
function benchDevice(){const n=typeof navigator!=='undefined'?navigator:{};const ua=n.userAgent||'';
 const kind=/iPad/.test(ua)||(/Macintosh/.test(ua)&&n.maxTouchPoints>1)?'iPad':/iPhone/.test(ua)?'iPhone':/Mac OS X/.test(ua)?'Mac':/Android/.test(ua)?'Android':/Windows/.test(ua)?'Windows':'outro';
 const eng=/Chrome\//.test(ua)&&!/Edg\//.test(ua)?'Chrome':/Safari\//.test(ua)&&!/Chrome\//.test(ua)?'Safari':/Firefox\//.test(ua)?'Firefox':'navegador';
 return{kind,eng,cores:n.hardwareConcurrency||null,memGB:n.deviceMemory||null,ua:ua.slice(0,160)};}
/* protótipo WebAssembly (tools/wasm-proto, publicado junto com o app): baixado só para esta medição; offline, fica de fora */
async function benchWasmFiles(){try{const[a,b]=await Promise.all([fetch('tools/wasm-proto/compare.js',{cache:'no-store'}),fetch('tools/wasm-proto/heat.wasm',{cache:'no-store'})]);
 if(!a.ok||!b.ok)return null;return{src:await a.text(),bytes:await b.arrayBuffer()};}catch(e){return null;}}
async function benchStart(){if(U.bench&&U.bench.busy)return;U.bench={busy:true,p:0,label:'',cancel:()=>{}};render();const wasm=await benchWasmFiles();const J=runJob('bench',{scale:1,wasm},{onProgress:(p,l)=>{if(U.bench&&U.bench.busy){U.bench.p=p;U.bench.label=l;render();}}});
 U.bench={busy:true,p:0,label:'',cancel:J.cancel};render();
 J.promise.then(r=>{const rec={at:Date.now(),dev:benchDevice(),ver:VERSION,worker:r.worker,startMs:r.startMs||null,totalMs:r.ms,ops:r.result.ops.map(o=>({id:o.id,cls:o.cls,med:Math.round(o.med*1000)/1000,budget:o.budget})),wasm:r.result.wasm?r.result.wasm.err?{err:r.result.wasm.err}:r.result.wasm.casos.map(c=>({id:c.id,js:Math.round(c.js*1000)/1000,wasm:Math.round(c.wasm*1000)/1000,dif:c.difMax})):null};
  const all=[rec,...benchSaved()].slice(0,5);try{localStorage.setItem(BENCH_KEY,JSON.stringify(all));}catch(e){}U.bench={done:true};render();})
  .catch(e=>{U.bench={err:e.message==='cancelado'?'Medição cancelada.':'Não foi possível medir: '+e.message};render();});}
function benchCard(){const B=U.bench||{},L=benchSaved(),last=L[0];const opN=Object.fromEntries(BENCH_OPS.map(o=>[o.id,o.n]));
 const row=o=>{const v=benchVerdict(o);return`<tr><td>${esc(opN[o.id]||o.id)}</td><td class="r"><span class="muted">${o.cls==='diario'?'diário':'sob demanda'}</span></td><td class="r mono">${o.med<1?f2(o.med):o.med<10?f1(o.med):f0(o.med)} ms</td><td class="r"><span class="chip ${v}">${v==='ok'?'dentro':v==='warn'?'até 2×':'acima'} de ${o.budget>=1000?f0(o.budget/1000)+' s':o.budget+' ms'}</span></td></tr>`;};
 return`<div class="card" id="bench-card"><div class="row"><h2 style="margin:0">Desempenho deste aparelho</h2><span class="sp"></span>
  ${B.busy?`<button class="btn ghost sm" data-a="benchStop">Cancelar</button>`:`<button class="btn sm" data-a="benchRun">${last?'Medir de novo':'Medir este aparelho'}</button>`}</div>
  <p class="note" style="margin:8px 0 10px">Roda as ${BENCH_OPS.length} operações do motor no próprio aparelho, fora da tela (Web Worker), e compara com o orçamento: o que roda a cada toque precisa ficar abaixo de 50 ms; o que roda sob demanda, abaixo de 2 s, com progresso. Leva de 5 a 30 s. Os números servem para decidir a arquitetura com medição real de iPhone, iPad e Mac.</p>
  ${B.busy?`<div style="height:6px;background:var(--line);border-radius:3px;overflow:hidden"><div style="height:100%;width:${f0((B.p||0)*100)}%;background:var(--ice)"></div></div><p class="muted" style="font-size:12px;margin:6px 0 0">Medindo${B.label?': '+esc(opN[B.label]||B.label):'…'}</p>`:''}
  ${B.err?`<p class="c-warn" style="margin:6px 0">${esc(B.err)}</p>`:''}
  ${last&&!B.busy?`<p class="muted" style="font-size:12px;margin:0 0 6px">${esc(last.dev.kind)} · ${esc(last.dev.eng)}${last.dev.cores?' · '+last.dev.cores+' núcleos':''} · ${new Date(last.at).toLocaleString('pt-BR')} · app ${esc(last.ver)} · ${last.worker?'Web Worker aberto em '+(last.startMs!=null?f0(last.startMs)+' ms':'—'):'sem Web Worker'} · total ${f1(last.totalMs/1000)} s</p>
   <div class="tw"><table class="tbl" id="bench-tbl"><thead><tr><th>Operação</th><th class="r">Tipo</th><th class="r">Mediana</th><th class="r">Orçamento</th></tr></thead><tbody>${last.ops.map(row).join('')}</tbody></table></div>
   ${last.wasm&&!last.wasm.err?`<h3 style="margin:12px 0 6px">Núcleo térmico: JavaScript × WebAssembly neste aparelho</h3><div class="tw"><table class="tbl" id="bench-wasm"><thead><tr><th>Simulação</th><th class="r">JavaScript</th><th class="r">WebAssembly</th><th class="r">Ganho</th></tr></thead><tbody>${last.wasm.map(c=>`<tr><td>${{pote:'Pote saindo do freezer',endurecimento:'Endurecimento 12 h',malha40:'Malha fina (N = 40)'}[c.id]||esc(c.id)}</td><td class="r mono">${f2(c.js)} ms</td><td class="r mono">${f2(c.wasm)} ms</td><td class="r mono">${f1(c.js/Math.max(c.wasm,1e-6))}×</td></tr>`).join('')}</tbody></table></div><p class="muted" style="font-size:11.5px;margin:4px 0 0">Protótipo de medição (tools/wasm-proto), baixado só para esta comparação; o app continua em JavaScript. Mesma curva nos dois (diferença ≤ 10⁻¹⁴ °C).</p>`:last.wasm===null?'<p class="muted" style="font-size:11.5px;margin:8px 0 0">Comparação com WebAssembly não feita (precisa de internet para baixar o protótipo).</p>':''}
   <div class="row" style="margin-top:8px"><button class="btn ghost sm" data-a="benchCopy">Copiar resultado</button>${L.length>1?`<span class="muted" style="font-size:12px">${L.length} medições guardadas neste aparelho</span>`:''}</div>`:''}</div>`;}
