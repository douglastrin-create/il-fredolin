/* ===================== LAUDO › CICLO COMPLETO (v18.13 · §16, §33, §34) =====================
   Mostra o gêmeo do ciclo (product/production/ciclo.js): etapas encadeadas, o modelo e a fidelidade de cada uma,
   a resposta do pote à oscilação do freezer e a comparação com um cenário B. A geladeira vem da página Maturação
   (ajuste, posição, leituras medidas e a calda medida "6,5@90"). */
const TWIN_FCL={none:'',exp:'warn',mec:'info',cal:'ok',sync:'ok'};
function twinEnv(over){const ms=matState(),FT=fridgeT(ms);const eq=MAT_PRO[ms.fridge]&&MAT_PRO[ms.fridge].tau;const fit=probeFit(ms,FT.mu);
 const e={fridge:FT.mu,fridgeSrc:FT.src==='medida'?'medida, '+FT.n+' leitura(s)':FT.src==='setpoint'?'setpoint do processo':'estimada pelo ajuste da geladeira',
  tauFit:fit!=null?clamp(fit,.2,12):eq||null,tauSrc:fit!=null?'medido':eq?'equipamento':null};
 if(over&&over.fridge!=null&&isFinite(+over.fridge)){e.fridge=+over.fridge;e.fridgeSrc='cenário B';}return e;}
function twinChart(T){const W=640,H=190,L=30,R=6,top=18,bot=30,ks=T.stages,n=ks.length,pw=(W-L-R)/n,lo=-25,hi=Math.max(90,...ks.map(s=>s.T0||0))+2;
 const sy=v=>top+(hi-clamp(v,lo,hi))/(hi-lo)*(H-top-bot);let g='';
 [-20,0,20,40,60,80].forEach(v=>{g+=`<line x1="${L}" x2="${W-R}" y1="${sy(v)}" y2="${sy(v)}" stroke="var(--line)" stroke-dasharray="2 4"/><text x="${L-4}" y="${sy(v)+3}" text-anchor="end" font-size="9" fill="var(--t3)">${v}</text>`;});
 const dur=s=>s.k==='store'?'meses':s.min==null?'—':s.min>=90?fT(Math.round(s.min/6)/10)+' h':f0(s.min)+' min';
 ks.forEach((s,i)=>{const x0=L+i*pw,x1=x0+pw-6;g+=`<line x1="${x0}" x2="${x0}" y1="${top-4}" y2="${H-bot}" stroke="var(--line)"/>`;
  g+=`<text x="${(x0+x1)/2}" y="${top-6}" text-anchor="middle" font-size="9" fill="var(--t2)">${esc(s.n.split(' ')[0])}</text><text x="${(x0+x1)/2}" y="${H-bot+12}" text-anchor="middle" font-size="9" fill="var(--t3)">${dur(s)}</text>`;
  const pts=(c,key)=>{const hm=c[c.length-1].h||1;return c.map(p=>(x0+3+(p.h/hm)*(x1-x0-3)).toFixed(1)+','+sy(p[key]).toFixed(1)).join(' ');};
  if(s.curve&&s.curve.length>1){if(s.curve[0].S!=null)g+=`<polyline points="${pts(s.curve,'S')}" fill="none" stroke="var(--ok)" stroke-width="1.3"/>`;g+=`<polyline points="${pts(s.curve,'T')}" fill="none" stroke="var(--ice)" stroke-width="2"/>`;}
  else if(s.k==='store'){const a=s.A;g+=`<rect x="${x0+3}" y="${sy(s.T0+a)}" width="${x1-x0-3}" height="${Math.max(1,sy(s.T0-a)-sy(s.T0+a))}" fill="rgba(125,211,252,.15)"/><line x1="${x0+3}" x2="${x1}" y1="${sy(s.T0)}" y2="${sy(s.T0)}" stroke="var(--ice)" stroke-width="2"/>`;}
  else if(s.k==='serve'){g+=`<circle cx="${(x0+x1)/2}" cy="${sy(s.T0)}" r="3.5" fill="var(--ice)"/><line x1="${x0+6}" x2="${x1-3}" y1="${sy(s.ideal)}" y2="${sy(s.ideal)}" stroke="var(--ok)" stroke-dasharray="3 2"/>`;}
  else if(s.T0!=null&&s.T1!=null){g+=`<line x1="${x0+3}" y1="${sy(s.T0)}" x2="${x1}" y2="${sy(s.T1)}" stroke="var(--t3)" stroke-width="1.4" stroke-dasharray="4 4"/>`;}});
 return`<div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:600px;height:auto;display:block" role="img" aria-label="Temperatura em cada etapa do ciclo">${g}</svg></div>
 <div class="row" style="gap:12px;font-size:11.5px;margin-top:4px;flex-wrap:wrap"><span><b style="color:var(--ice)">━</b> calda / centro do pote (simulado)</span><span><b style="color:var(--ok)">━</b> camada de servir</span><span><b style="color:var(--t3)">╌</b> só início e fim: o caminho não é simulado</span><span class="muted">Cada etapa tem a sua própria escala de tempo.</span></div>`;}
function twinStoreTable(s){return`<div class="tw"><table class="tbl"><thead><tr><th>Oscilação do ar (± ${fT(s.A)} °C) com período de</th><th class="r">Camada de servir</th><th class="r">Centro</th></tr></thead><tbody>
 ${s.resp.map(r=>`<tr><td>${r.P<1?f0(r.P*60)+' min':f0(r.P)+' h'}</td><td class="r mono">± ${f2(r.scoop)} °C <span class="muted">(${f0(r.scoop/r.A*100)}%)</span></td><td class="r mono">± ${f2(r.core)} °C</td></tr>`).join('')}</tbody></table></div>`;}
const TWIN_B_FIELDS=[['coolMode','Resfriamento','sel',()=>Object.entries(COOL_MODE).map(([k,v])=>[k,v.n])],['coolVessel','Recipiente','sel',()=>Object.entries(COOL_VESSEL).map(([k,v])=>[k,v.n])],
 ['coolMin','Tempo no resfriamento (min)','num'],['matH','Maturação (h)','num'],['fridge','Geladeira (°C)','num'],['preChill','Máquina pré-resfriada','sel',()=>[['1','sim'],['0','não']]],
 ['poteMl','Pote (mL)','num'],['turboMin','Turbo do freezer (min)','num'],['storeFluct','Oscilação do freezer (± °C)','num']];
function twinCard(m){const pr=Object.assign({},PROC0,S.proc);const A=cycleTwin(m,pr,twinEnv());if(!A)return'';
 const B0=U.twinB;let B=null;if(B0){const pb=Object.assign({},pr);for(const[k,v]of Object.entries(B0))if(k!=='fridge')pb[k]=PROC_LIM[k]?clamp(+v,PROC_LIM[k][0],PROC_LIM[k][1]):v;B=cycleTwin(analyze({...S,proc:pb}),pb,twinEnv(B0));}
 const ra=twinRows(A),rb=B?twinRows(B):null;const fmt=(v,d)=>v==null||!isFinite(v)?'—':d===0?f0(v):d===2?f2(v):f1(v);
 const selA=(k,opts)=>`<select data-c="proc" data-k="${k}" aria-label="${k}">${opts.map(([v,n])=>`<option value="${v}"${String(pr[k])===String(v)?' selected':''}>${esc(n)}</option>`).join('')}</select>`;
 const bVal=k=>B0&&B0[k]!=null?B0[k]:k==='fridge'?Math.round(A.fridge*10)/10:pr[k];
 return`<div class="card" id="twin-card"><h2>Ciclo completo · da panela à colher</h2>
  <p class="note" style="margin:0 0 10px">Cada etapa começa onde a anterior terminou. Etapas sem modelo do tempo aparecem só com início e fim.</p>
  ${twinChart(A)}
  <div class="row" style="gap:10px;margin:12px 0 4px;flex-wrap:wrap"><label class="field" style="min-width:180px"><span class="lbl">Como a calda esfria</span>${selA('coolMode',Object.entries(COOL_MODE).map(([k,v])=>[k,v.n]))}</label>
   <label class="field" style="min-width:160px"><span class="lbl">Recipiente</span>${selA('coolVessel',Object.entries(COOL_VESSEL).map(([k,v])=>[k,v.n]))}</label>
   ${fieldNum('p-prepT','Calda antes de aquecer (°C)',pr.prepT,1,'Para a energia do aquecimento')}</div>
  <div id="twin-stages">${A.stages.map(s=>`<div class="kv" style="display:block;padding:7px 0"><div class="row" style="gap:6px;align-items:baseline"><b>${esc(s.n)}</b><span class="chip ${TWIN_FCL[s.fid]||''}">${TWIN_FID[s.fid]}</span><span class="sp"></span><span class="mono t2">${s.T0!=null?f1(s.T0):'—'} → ${s.T1!=null?f1(s.T1):'—'} °C</span></div>
   <div class="muted" style="font-size:12px;margin-top:2px">${esc(s.note)}${s.k==='past'?' Energia ≈ '+f0(s.E)+' kJ.':''}${s.k==='cool'&&s.t60_10!=null?' De 60 a 10 °C: '+f0(s.t60_10)+' min (a RDC 216/2004 da Anvisa pede até 2 h para alimentos preparados; o app só informa o tempo).':''}${s.k==='mat'?' Efetivas: '+f1(s.hEff)+' de '+f1(s.min/60)+' h.':''}${s.k==='maq'&&s.min!=null?' Previsto '+f0(s.min)+' min (informado '+f0(s.minDecl)+').':''}${s.k==='temp'&&s.tReady!=null?' Camada de servir no ponto em '+f0(s.tReady)+' min.':''}</div></div>`).join('')}</div>
  <h3 style="margin:14px 0 6px">Armazenamento: o que chega ao pote</h3>${twinStoreTable(A.stages.find(s=>s.k==='store'))}
  <p class="note" style="margin:6px 0 0">Oscilações curtas (ciclo do compressor) quase não passam da superfície; as lentas (degelo, porta, dia e noite) chegam inteiras ao centro. Solução exata da condução com as propriedades na temperatura do freezer, conferida contra a simulação completa.</p>
  <p class="muted" style="font-size:11.5px;margin:8px 0 0">${esc(A.syncNote)}</p></div>
 <div class="card" id="twin-cmp"><div class="row"><h2 style="margin:0">Comparar cenários</h2><span class="sp"></span>${B0?`<button class="btn ghost sm" data-a="twinBOff">Fechar o cenário B</button>`:`<button class="btn sm" data-a="twinBOn">Criar cenário B</button>`}</div>
  ${B0?`<div class="row" style="gap:10px;margin:10px 0;flex-wrap:wrap">${TWIN_B_FIELDS.map(([k,l,t,o])=>`<label class="field" style="min-width:150px"><span class="lbl">${l}</span>${t==='sel'?`<select data-c="twinB" data-k="${k}">${o().map(([v,n])=>`<option value="${v}"${String(bVal(k))===String(v)?' selected':''}>${esc(n)}</option>`).join('')}</select>`:`<input type="number" data-c="twinB" data-k="${k}" value="${bVal(k)}" step="${k==='fridge'||k==='storeFluct'?.5:k==='poteMl'?50:5}">`}</label>`).join('')}</div>`:'<p class="note" style="margin:8px 0 0">Mude o modo de resfriar, o recipiente, a geladeira, o pote ou o freezer e veja cada etapa lado a lado com o processo atual.</p>'}
  <div class="tw"><table class="tbl"><thead><tr><th>Grandeza</th><th class="r">Atual</th>${rb?'<th class="r">Cenário B</th><th class="r">Diferença</th>':''}</tr></thead><tbody>
  ${ra.map((r,i)=>{const b=rb&&rb[i];let d=b&&r[2]!=null&&b[2]!=null?b[2]-r[2]:null;if(d!=null&&Math.abs(d)<.5*Math.pow(10,-r[3]))d=0;return`<tr><td>${esc(r[0])}</td><td class="r mono">${fmt(r[2],r[3])} <span class="muted">${esc(r[1])}</span></td>${rb?`<td class="r mono">${fmt(b[2],b[3])}</td><td class="r mono ${d==null||d===0?'muted':''}">${d==null?'—':d===0?'igual':(d>0?'+':'')+fmt(d,r[3])}</td>`:''}</tr>`;}).join('')}
  </tbody></table></div></div>`;}
