/* ===================== LAUDO › MICROESTRUTURA E REOLOGIA (v18.16 · §17–18) ===================== */
const MICRO_COL={ice:'var(--ice)',air:'#94a3b8',fat:'#facc15',mat:'#a78bfa'};
const MICRO_N={ice:'Gelo',air:'Ar',fat:'Gordura',mat:'Matriz não congelada'};
function microChart(m,Ts){const P=phaseProfile(m,-30,-4,.5);if(!P.length)return'';const W=560,H=170,L=34,R=8,T=8,B=22;const t0=P[0].T,t1=P[P.length-1].T;
 const sx=t=>L+(t-t0)/(t1-t0)*(W-L-R),sy=v=>T+(1-v)*(H-T-B);let g='';const keys=['ice','air','fat','mat'];
 const acc=P.map(()=>0);keys.forEach(k=>{const top=P.map((p,i)=>acc[i]+p.vol[k]);const pts=P.map((p,i)=>sx(p.T).toFixed(1)+','+sy(top[i]).toFixed(1)).join(' ')+' '+P.slice().reverse().map((p,j)=>{const i=P.length-1-j;return sx(p.T).toFixed(1)+','+sy(acc[i]).toFixed(1);}).join(' ');
  g+=`<polygon points="${pts}" fill="${MICRO_COL[k]}" fill-opacity=".55" stroke="${MICRO_COL[k]}" stroke-width=".6"/>`;P.forEach((p,i)=>acc[i]=top[i]);});
 [-30,-25,-20,-15,-10,-5].forEach(t=>g+=`<text x="${sx(t)}" y="${H-6}" text-anchor="middle" font-size="9" fill="var(--t3)">${t}</text>`);
 [0,.5,1].forEach(v=>g+=`<text x="${L-4}" y="${sy(v)+3}" text-anchor="end" font-size="9" fill="var(--t3)">${f0(v*100)}%</text>`);
 Ts.forEach(([t,l])=>{if(t>=t0&&t<=t1)g+=`<line x1="${sx(t)}" x2="${sx(t)}" y1="${T}" y2="${H-B}" stroke="var(--t1)" stroke-dasharray="3 3"/><text x="${sx(t)+3}" y="${T+9}" font-size="9" fill="var(--t1)">${esc(l)}</text>`;});
 return`<div style="overflow-x:auto"><svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:340px;height:auto;display:block" role="img" aria-label="Frações de volume por temperatura">${g}</svg></div>
  <div class="row" style="gap:10px;font-size:11.5px;flex-wrap:wrap">${keys.map(k=>`<span><b style="color:${MICRO_COL[k]}">■</b> ${MICRO_N[k]}</span>`).join('')}<span class="muted">°C · fração do volume</span></div>`;}
function crystChart(D){const W=520,H=150,L=8,R=8,T=8,B=20,xmax=D[0].pts[D[0].pts.length-1][0];const ym=Math.max(...D.flatMap(d=>d.pts.map(p=>p[1])));
 const sx=x=>L+x/xmax*(W-L-R),sy=v=>T+(1-v/ym)*(H-T-B);let g=`<rect x="${sx(MICRO_REF.iceHard[0])}" y="${T}" width="${sx(MICRO_REF.iceHard[1])-sx(MICRO_REF.iceHard[0])}" height="${H-T-B}" fill="var(--ok)" fill-opacity=".08"/>`;
 g+=`<line x1="${sx(50)}" x2="${sx(50)}" y1="${T}" y2="${H-B}" stroke="var(--warn)" stroke-dasharray="3 3"/><text x="${sx(50)+3}" y="${T+9}" font-size="9" fill="var(--warn)">50 µm</text>`;
 for(let x=0;x<=xmax;x+=20)g+=`<text x="${sx(x)}" y="${H-6}" text-anchor="middle" font-size="9" fill="var(--t3)">${x}</text>`;
 D.forEach(d=>{g+=`<polyline points="${d.pts.map(p=>sx(p[0]).toFixed(1)+','+sy(p[1]).toFixed(1)).join(' ')}" fill="none" stroke="${d.col}" stroke-width="1.8"${d.dash?` stroke-dasharray="${d.dash}"`:''}/>`;});
 return`<div style="overflow-x:auto"><svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:320px;height:auto;display:block" role="img" aria-label="Distribuição hipotética de tamanho dos cristais">${g}</svg></div>`;}
function microCard(m){const pr=m.pr||PROC0;const Tv=+m.vit,Ts=+pr.storeT;const A=phaseAt(m,Tv),Z=phaseAt(m,Ts);if(!A)return'';
 const pc=v=>f0(v*100)+'%';const row=(n,a,z,tag)=>`<tr><td>${n}${tag?` <span class="chip ${tag[1]}" style="font-size:10.5px">${tag[0]}</span>`:''}</td><td class="r mono">${a}</td><td class="r mono">${z}</td></tr>`;
 const D=['balanço','ok'],SE=['semiempírico','info'],H=['heurístico','warn'];
 const fases=`<div class="card" id="micro-fases"><h2>Fases</h2>${microChart(m,[[Tv,'serviço'],[Ts,'freezer']])}
  <div class="tw" style="margin-top:8px"><table class="tbl"><thead><tr><th></th><th class="r">Serviço (${fT(Tv)} °C)</th><th class="r">Freezer (${fT(Ts)} °C)</th></tr></thead><tbody>
  ${row('Gelo (volume)',pc(A.vol.ice),pc(Z.vol.ice),D)}${row('Ar (volume)',pc(A.vol.air),pc(Z.vol.air),D)}${row('Gordura (volume)',pc(A.vol.fat),pc(Z.vol.fat),D)}${row('Matriz não congelada (volume)',pc(A.vol.mat),pc(Z.vol.mat),D)}
  ${row('Água da mistura congelada',f0(A.fz)+'%',f0(Z.fz)+'%',SE)}
  ${row('Solutos na matriz',f0(A.conc)+'% <small class="muted">(×'+f1(A.cf)+')</small>',f0(Z.conc)+'% <small class="muted">(×'+f1(Z.cf)+')</small>',D)}
  ${row('Distância de Tg′ ('+fT(m.tg)+' °C)',fT(A.dTg)+' °C',fT(Z.dTg)+' °C',SE)}
  ${row('Viscosidade da matriz',`10<sup>${f1(A.logEtaMat)}</sup> Pa·s`,`10<sup>${f1(Z.logEtaMat)}</sup> Pa·s`,SE)}
  ${row('Gordura sólida (da gordura)',f0(A.sfc)+'%',f0(Z.sfc)+'%',SE)}</tbody></table></div>
  <p class="note" style="margin:8px 0 0">Volumes por balanço de massa a partir da curva de congelamento, do overrun e da composição (somam 100%). A matriz não congelada é a calda que sobra entre os cristais: no frio ela fica ${f1(Z.cf)} vez(es) mais concentrada que a mistura, e a viscosidade dela, estimada pela equação WLF com constantes universais (ordem de grandeza), é o que freia a recristalização. Gordura sólida pela curva de gordura sólida de cada tipo de gordura.</p></div>`;
 const K=(m.kin&&m.kin.Kstore)||0,ag=crystalAging(m,[0,7,30],K);const xmax=Math.max(120,Math.ceil(ag[2].mean*2.6/20)*20);
 const Dh=[crystalDist(ag[0].mean,CRYST_CV[0],xmax),crystalDist(ag[0].mean,CRYST_CV[1],xmax),crystalDist(ag[2].mean,CRYST_CV[0],xmax)];
 const cr=`<div class="card" id="micro-cristais"><h2>Cristais de gelo <span class="chip warn" style="font-size:10.5px">distribuição hipotética</span></h2>
  ${crystChart([{...Dh[0],col:'var(--ice)'},{...Dh[1],col:'var(--ice)',dash:'4 3'},{...Dh[2],col:'#fb923c'}])}
  <div class="row" style="gap:10px;font-size:11.5px;flex-wrap:wrap"><span><b style="color:var(--ice)">━</b> hoje, dispersão menor (CV ${f2(CRYST_CV[0])})</span><span><b style="color:var(--ice)">╌</b> hoje, dispersão maior (CV ${f2(CRYST_CV[1])})</span><span><b style="color:#fb923c">━</b> 30 dias no freezer</span><span class="muted">µm · faixa verde: 35–45 µm depois do endurecimento (literatura)</span></div>
  <div class="tw" style="margin-top:8px"><table class="tbl"><thead><tr><th></th><th class="r">Hoje</th><th class="r">7 dias</th><th class="r">30 dias</th></tr></thead><tbody>
   <tr><td>Média (índice do motor) <span class="chip warn" style="font-size:10.5px">heurístico</span></td>${ag.map(a=>`<td class="r mono">${f0(a.mean)} µm</td>`).join('')}</tr>
   <tr><td>Acima de 50 µm (CV ${f2(CRYST_CV[0])} a ${f2(CRYST_CV[1])})</td>${ag.map(a=>{const lo=crystalDist(a.mean,CRYST_CV[0]).above50,hi=crystalDist(a.mean,CRYST_CV[1]).above50;return`<td class="r mono">${f0(Math.min(lo,hi))}–${f0(Math.max(lo,hi))}%</td>`;}).join('')}</tr></tbody></table></div>
  <p class="note" style="margin:8px 0 0"><b>Não é medição.</b> A média vem do índice de cristal do motor; a forma da curva (gama) e a dispersão são suposições, mostradas em dois extremos. O envelhecimento segue o amadurecimento de Ostwald do motor (d³ cresce linearmente no tempo) no freezer a ${fT(Ts)} °C. Referências para comparar: 20–35 µm na saída da produtora e 35–45 µm depois do endurecimento; acima de ~50 µm a textura fica granulosa (${esc(MICRO_REF.src)}). Para medir: microscópio a −15 °C, pelo menos 300 cristais (Donhowe et al., 1991); registre a média e o coeficiente de variação no lote.</p></div>`;
 const fa=`<div class="card" id="micro-gordura"><h2>Gordura, proteínas e ar</h2>
  <div class="kv"><span>Glóbulos de gordura depois da homogeneização <span class="muted">(literatura)</span></span><span class="mono">≈ ${MICRO_REF.fatGlob} µm</span></div>
  <div class="kv"><span>Aglomerados de gordura parcialmente coalescida <span class="muted">(literatura)</span></span><span class="mono">${MICRO_REF.fatClust[0]}–${MICRO_REF.fatClust[1]} µm</span></div>
  <div class="kv"><span>Micelas de caseína <span class="muted">(literatura)</span></span><span class="mono">${MICRO_REF.casein[0]}–${MICRO_REF.casein[1]} µm</span></div>
  <div class="kv"><span>Desestabilização da gordura nesta receita <span class="chip warn" style="font-size:10.5px">heurístico</span></span><span class="mono">${f0(m.destab||0)}</span></div>
  <div class="kv"><span>Ar no volume do gelato (overrun ${f0(m.ov)}%)</span><span class="mono">${pc(A.vol.air)}</span></div>
  <div class="kv"><span>Tamanho das bolhas</span><span class="muted">não estimado</span></div>
  <p class="note" style="margin:8px 0 0">O app não estima o tamanho das bolhas nem a rede de gordura: não há dado de referência que sustente um número. Medem-se por microscopia (bolhas: Chang e Hartel, 2002) e por difração a laser (gordura). O índice de desestabilização é uma combinação heurística do motor.</p></div>`;
 const lots=LOTS.filter(L=>L&&L.meas&&L.meas.rheo&&parseRheo(L.meas.rheo).length>=2&&(L.name===S.name||JSON.stringify((L.recipe||[]).map(r=>r.id).sort())===JSON.stringify(S.recipe.map(r=>r.id).sort()))).slice(0,3);
 const rh=`<div class="card" id="micro-reologia"><h2>Reologia da calda</h2>
  <div class="kv"><span>Viscosidade prevista a 4 °C <span class="chip warn" style="font-size:10.5px">heurístico</span></span><span class="mono">${f0(m.visc)} mPa·s</span></div>
  ${lots.length?lots.map(L=>{const R=rheoMeasured(L.meas);const f=R.fit;return`<div style="margin-top:10px"><b>Lote ${esc(L.code)}</b> <span class="muted">· ${f.pts.length} leituras${R.T!=null?' a '+fT(R.T)+' °C':''}</span>
    <div class="kv"><span>Lei de potência</span><span class="mono">n = ${f2(f.n)} · K = ${f0(f.K)} mPa·sⁿ · R² ${f2(f.r2)}</span></div>
    <div class="kv"><span>Comportamento</span><span>${esc(f.kind)}</span></div>
    <div class="kv"><span>Viscosidade a ${RHEO_REF_RATE} s⁻¹</span><span class="mono">${f0(R.eta50)} mPa·s${R.T!=null&&R.T>=2&&R.T<=8?` <small class="muted">(motor: ${f0(m.visc)})</small>`:''}</span></div>
    ${f.hb?`<div class="kv"><span>Herschel–Bulkley</span><span class="mono">τ0 = ${f2(f.hb.tau0)} Pa · n = ${f2(f.hb.n)} · R² ${f2(f.hb.r2)}</span></div>`:''}</div>`;}).join('')
   :`<p class="note" style="margin:8px 0 0">Nenhum lote desta receita tem leituras de viscosímetro. Registre no lote, em "Viscosidade da calda", pares taxa:viscosidade (ex.: 10:850; 50:420; 100:300) e a temperatura da leitura. Com duas leituras o app ajusta a lei de potência; com quatro, Herschel–Bulkley (tensão de escoamento).</p>`}
  <p class="note" style="margin:8px 0 0">O motor não prevê comportamento não newtoniano nem tensão de escoamento: eles dependem de hidrocoloides e proteínas de um jeito que exige medição. Viscoelasticidade (reômetro oscilatório) e atrito na boca (tribômetro) estão fora do alcance do app; a cremosidade percebida é conferida no Painel cego (física × percepção). Medições entre 2 e 8 °C entram na validação da viscosidade (Ciência do motor).</p></div>`;
 return fases+cr+fa+rh;}
