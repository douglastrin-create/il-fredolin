/* ==== 50-pages.js ==== */
/* ===================== IL FREDOLIN · PÁGINAS ===================== */
function pgBancada(m,F,sc){
 const P=m.P;const q=norm(U.q.trim());
 const res=q&&!U.sel?ING.filter(i=>i.id!=='nx_tmp'&&norm(i.n+' '+i.cat).includes(q)).slice(0,14):[];
 const rows=(S.recipe||[]).map(r=>{const i=ING_BY[r.id];if(!i)return'';const pct=m.tot?r.g/m.tot*100:0;
  return`<tr><td><div style="font-weight:500">${esc(i.n)}</div><div class="muted" style="font-size:11.5px">${esc(i.cat)}${(i.al||[]).length?' · <span class="c-crit">alérgeno</span>':''}${(i.hfB||i.hfS||i.hfN)?' · <span class="c-gold">HF</span>':''}${S.brix[i.id]!=null&&S.brix[i.id]!==''?' · <span class="c-ice">Brix '+esc(S.brix[i.id])+'</span>':''}${r.inf?' · <span class="c-gold">infusionado e coado</span>':''}</div></td>
  <td class="r"><input type="number" id="g-${r.id}" data-i="g" data-id="${r.id}" value="${r.g}" min="0" step="${r.g<5?.1:1}" aria-label="Gramas de ${esc(i.n)}"></td>
  <td class="r mono t2">${r.inf?'<span title="sai na coagem">—</span>':f1(pct)+'%'}</td><td class="r"><div class="row" style="justify-content:flex-end;gap:4px;flex-wrap:nowrap">${INF[r.id]||INF_EXTRA.has(r.id)?`<button class="btn sm${r.inf?' pri':''}" data-a="infToggle" data-v="${r.id}" title="Infusionar no leite quente e coar" aria-pressed="${!!r.inf}">infusão</button>`:''}<button class="btn del" data-a="rm" data-v="${r.id}" aria-label="Remover ${esc(i.n)}">✕</button></div></td></tr>`;}).join('');
 const T=[
  ['Sólidos',m.sol,'%',P.sol,P.sol[0]-10,P.sol[1]+10,'alvo '+fT(P.sol[0])+'–'+f0(P.sol[1])],
  ['Gordura',m.fat,'%',P.fat,0,P.fat[1]+6,'alvo '+fT(P.fat[0])+'–'+P.fat[1]],
  ['MSNF',m.msnf,'%',P.msnf[1]>0?P.msnf:null,0,13,P.msnf[1]>0?'alvo '+fT(P.msnf[0])+'–'+P.msnf[1]:'sem lácteos'],
  ['Doçura POD',m.pod,'%',P.pod,P.pod[0]-8,P.pod[1]+8,'alvo '+f1(P.pod[0])+'–'+f1(P.pod[1])],
  ['Congelada a '+f1(S.vit)+'°',m.fzVit,'%',P.fz,50,90,'alvo '+fT(P.fz[0])+'–'+P.fz[1]],
  ['Lactose/água',m.lacW,'%',[0,9],0,14,'seguro até 9']
 ];
 const top=F.filter(f=>f.sev==='crit'||f.sev==='warn').slice(0,3);
 return`<div class="pg">
 <div><h1>Bancada</h1><p class="lead">${P.n} · ${f0(m.tot)} g de mistura · ${S.proc.serveFrom==='pote'?'na colher após '+f0(+S.proc.waitMin)+' min fora do freezer: '+f1(S.vit)+' °C':'vitrine a '+f1(S.vit)+' °C'}${m.empty?'':' · serviço ideal '+f1(m.serveT)+' °C <span class="muted">('+uncLine(m)+')</span>'}${m.empty?'':' · quenelle '+f1(quenelleModel(m).T)+' °C'}${P.adj?' · faixas ajustadas para cacau/oleaginosas':''}${P.pref?' · <span class="c-gold">gosto da casa</span>':''}</p></div>
 <div class="tiles">${T.map(([n,v,u,r,a,b,t])=>`<div class="tile"><span class="lbl">${n}</span><span class="v ${m.empty?'':stCls(v,r)}">${m.empty?'—':f1(v)}<small>${u}</small></span>${m.empty?'':rbar(v,r,a,b)}<span class="t">${t}</span></div>`).join('')}</div>
 <div class="bgrid"><div class="bcol"><div class="card"><h2>Adicionar ingrediente <span class="muted" style="text-transform:none;letter-spacing:0">${ING.length} no banco</span></h2>
  <div class="row"><div class="search"><input type="text" id="q" data-i="q" value="${esc(U.q)}" placeholder="Buscar: leite, dextrose, pistache, maracujá, goma jataí…" autocomplete="off" aria-label="Buscar ingrediente">
   ${res.length?`<div class="res" role="listbox">${res.map((i,k)=>`<button data-a="pick" data-v="${i.id}" id="r${k}"><span>${esc(i.n)}</span><span class="tag">${esc(i.cat)}</span></button>`).join('')}</div>`:''}</div>
   <input type="number" id="addG" data-i="addG" value="${U.addG}" min="0" step="1" style="width:100px" aria-label="Gramas"><span class="muted">g</span>
   <button class="btn pri" data-a="add">Adicionar</button></div></div>
 <div class="card"><div class="row" style="margin-bottom:8px"><h2 style="margin:0">Receita</h2><span class="sp"></span><span class="chip">${f0(m.tot)} g</span></div>
  ${rows?`<div class="tw"><table class="tbl"><thead><tr><th>Ingrediente</th><th class="r">Gramas</th><th class="r">% mistura</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`:'<p class="muted">Bancada vazia. Busque um ingrediente acima ou carregue uma base na Biblioteca.</p>'}
  <div class="row" style="margin-top:12px"><button class="btn sm" data-a="norm">Normalizar para 1000 g</button><span class="sp"></span>
   <input type="number" id="scaleG" data-i="scaleG" value="${U.scaleG}" placeholder="peso do lote" style="width:130px" aria-label="Novo peso do lote em gramas"><button class="btn sm" data-a="scale">Escalar lote</button></div>${pairChips()}</div>${brixFruitCard(m)}${compBenchCard(m)}</div><div class="bcol">
 ${S.proc.serveFrom==='pote'?poteCard(m,true):''}
 ${balanceCard(m)}
 ${approveCard(m,F,sc)}
 ${top.length?`<div class="card"><div class="row"><h2 style="margin:0">Pontos que pedem ajuste</h2><span class="sp"></span><button class="btn sm pri" data-a="go" data-v="laudo">Abrir laudo completo</button></div>${top.map(findHTML).join('')}</div>`:(m.empty?'':`<div class="card"><h2>Laudo</h2><p class="c-ok" style="margin:0">Nenhum erro ou alerta. A receita está equilibrada para ${P.n.toLowerCase()} a ${f1(S.vit)} °C.</p></div>`)}
 </div></div></div>`;}

/* ---------- LAUDO ---------- */
/* Laudo único (v17.7): resumo com problemas primeiro e riscos de defeito; congelamento, química/vida útil e parâmetros como seções */
const LAUDO_SEC=[['resumo','Resumo'],['congelamento','Congelamento'],['textura','Textura e quenelle'],['quimica','Química e estabilidade da textura'],['medir','O que medir'],['parametros','Parâmetros']];
function pgLaudo(m,F,sc){
 if(m.empty)return`<div class="pg"><h1>Laudo técnico</h1><p class="lead">Monte uma receita na Bancada para gerar o laudo.</p></div>`;
 const P=m.P,groups=['crit','warn','info','ok'];const t=subOf('laudo','resumo');
 const prm=[
  ['Água congelada na vitrine',m.fzVit,'%',P.fz,1],['Sólidos totais',m.sol,'%',P.sol,1],['Gordura',m.fat,'%',P.fat,1],['Proteína',m.prot,'%',P.prot,1],
  ['MSNF',m.msnf,'%',P.msnf[1]>0?P.msnf:null,1],['Lactose / água',m.lacW,'%',[0,9],1],['Açúcares e polióis (sem lactose)',m.swt,'%',P.swt,1],
  ['Doçura POD',m.pod,'%',P.pod,1],['Estabilizantes',m.hydro,'%',P.stab,2],['Emulsificantes',m.emul,'%',null,2],['Gema',m.yolkPct,'%',null,1],
  ['Fruta',m.fruit,'%',P.frt,0],['Álcool (etanol)',m.alc,'%',null,1],['Overrun previsto',m.ov,'%',P.ov,0]];

 let body='',lead='';
 if(t==='congelamento'){const E=embedPg(pgCongel(m));lead=E.lead;body=E.body;}
 else if(t==='textura'){lead='Dureza na colher pelo volume de gelo e ponto de quenelle para empratar.';body=quenelleCard(m)+textureCard(m);}
 else if(t==='quimica'){const E=embedPg(pgQuimica(m));lead=E.lead;body=E.body+brixMixCards(m);}
 else if(t==='medir'){lead='As medições que mais aumentariam a confiança nas previsões desta receita, das mais úteis às menos úteis. Nenhuma é obrigatória para usar o app.';body=measureCard(m);}
 else if(t==='parametros'){lead='Cada parâmetro da receita contra a faixa de '+esc(P.n.toLowerCase())+'.';body=`<div class="card"><h2>Parâmetros</h2><div class="tw"><table class="tbl"><thead><tr><th>Parâmetro</th><th class="r">Valor</th><th class="r">Alvo</th><th style="width:30%">Posição</th></tr></thead><tbody>
  ${prm.map(([n,v,u,r,d])=>{const lo=r?Math.min(r[0],v)-(r[1]-r[0]||1)*.6:0,hi=r?Math.max(r[1],v)+(r[1]-r[0]||1)*.6:1;return`<tr><td>${n}</td><td class="r mono ${stCls(v,r)}">${d===0?f0(v):d===2?f2(v):f1(v)}${u}</td><td class="r mono muted">${r?(d===2?f2(r[0])+'–'+f2(r[1]):f0(r[0])+'–'+f0(r[1]))+u:'—'}</td><td>${r?rbar(v,r,lo,hi):''}</td></tr>`;}).join('')}
 </tbody></table></div></div>`;}
 else{lead='Cada parâmetro é comparado com a faixa de '+esc(P.n.toLowerCase())+' e com o processo informado. As soluções trazem gramagens calculadas para o lote atual de '+f0(m.tot)+' g.';
  const R=defectRisks(m),ok=F.filter(f=>f.sev==='ok');
  body=famCard(m)+`<div class="card"><div class="row" style="gap:20px;align-items:center">${ring(sc.total)}<div style="flex:1;min-width:240px;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px 16px">
  ${sc.parts.map(([n,w,v])=>`<div><div class="row" style="justify-content:space-between"><span class="t2" style="font-size:12.5px">${n}</span><span class="mono" style="font-size:11px">${f0(v*100)}</span></div>${rbar(v*100,[85,100],0,100)}</div>`).join('')}</div></div>
  <div class="row" style="margin-top:12px">${groups.map(g=>{const n=F.filter(f=>f.sev===g).length;const PL={crit:['crítico','críticos'],warn:['alerta','alertas'],info:['observação','observações'],ok:['acerto','acertos']}[g];return n?`<span class="chip ${g}">${n} ${PL[n>1?1:0]}</span>`:'';}).join('')}<span class="sp"></span><span class="chip" title="Faixa provável com a variação natural dos ingredientes">serviço ideal ${f1(m.serveT)} °C · ${uncLine(m)}</span></div></div>
  ${groups.slice(0,3).map(g=>{const L=F.filter(f=>f.sev===g);return L.length?`<div class="card"><h2>${{crit:'Erros críticos',warn:'Atenção',info:'Observações'}[g]}</h2>${L.map(findHTML).join('')}</div>`:'';}).join('')}
  ${F.some(f=>f.sev==='crit'||f.sev==='warn')&&can.edit()?balanceCard(m):''}
  <div class="card"><div class="row"><h2 style="margin:0">Riscos de defeito</h2><span class="sp"></span><button class="btn sm" data-a="go" data-v="defeitos">Diagnóstico por sintomas</button></div>
   ${R.length?R.map(x=>`<div class="find"><div class="bar ${defLvl(x.s)}"></div><div><div class="area">${esc(x.d.n)} · risco ${defLvlN(x.s)} · ${f0(x.s*100)}%</div><h3>${esc(x.R[0].txt)}</h3><div class="fix"><b>Correção</b>${esc(x.R[0].fix)}</div><div style="margin-top:6px"><button class="btn ghost sm" data-a="defOpenB" data-v="${x.d.id}">Ficha do defeito</button></div></div></div>`).join('')
   :'<p class="t2" style="margin:0">Nenhum dos '+DEFECTS.length+' defeitos do banco tem causa provável na receita e no processo atuais.</p>'}</div>
  ${ok.length?`<details class="card dcard" id="laudoOk"${dOpen('laudoOk',false)}><summary><h2 style="margin:0">Acertos</h2><span class="chip ok">${ok.length}</span></summary>${ok.map(findHTML).join('')}</details>`:''}`;}
 return`<div class="pg"><div class="pghead"><div><h1>Laudo técnico</h1><p class="lead">${lead}</p></div>${segHTML('laudo',LAUDO_SEC,t,'Seções do laudo')}</div>${body}</div>`;}

/* ---------- EXPERIMENTOS (v18.1, especificação §28) ----------
   Planeja um fatorial a partir da receita da Bancada, cria um lote por corrida (o lote guarda o plano em L.doe,
   então o experimento sincroniza com a equipe junto com os lotes) e analisa os efeitos à medida que os lotes são medidos. */
const doeNum=v=>v!==''&&v!=null&&isFinite(+v)?+v:null;
const doePanel=(L,k)=>{const v=(L.panel||[]).filter(x=>x&&!x.ex).map(x=>doeNum(x[k])).filter(v=>v!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;};
const DOE_RESP=[['ov','Overrun medido (%)',L=>measuredOverrun(L.meas||{})],['melt10','Derretido em 10 min (%)',L=>doeNum((L.meas||{}).melt10)],
 ['tex','Textura na vitrine (nota)',L=>doeNum((L.meas||{}).tex)],['brix','Brix da mistura (°Bx)',L=>doeNum((L.meas||{}).brix)],['ph','pH medido',L=>doeNum((L.meas||{}).ph)],
 ['drawT','Saída medida (°C)',L=>doeNum((L.meas||{}).drawT)],['coreT','Núcleo após abatimento (°C)',L=>doeNum((L.meas||{}).coreT)],
 ['jDoce','Painel: doçura (−2 a +2)',L=>doePanel(L,'jDoce')],['jDuro','Painel: dureza (−2 a +2)',L=>doePanel(L,'jDuro')]];
function doeCands(){const p=S.proc||{},r1=v=>Math.round(v*10)/10;
 return[...(S.recipe||[]).filter(r=>ING_BY[r.id]&&+r.g>0&&!r.inf).map(r=>({key:r.id,kind:'ing',label:ING_BY[r.id].n,unit:'g',lo:r1(+r.g*.8),hi:r1(+r.g*1.2)})),
  {key:'drawT',kind:'proc',label:'Temperatura de saída',unit:'°C',lo:r1(+p.drawT-1.5),hi:r1(+p.drawT+1.5)},
  {key:'matH',kind:'proc',label:'Maturação',unit:'h',lo:Math.max(0,+p.matH-4),hi:+p.matH+4},
  {key:'drawMin',kind:'proc',label:'Tempo de mantecação',unit:'min',lo:Math.max(2,+p.drawMin-3),hi:+p.drawMin+3},
  {key:'pastT',kind:'proc',label:'Temperatura de pasteurização',unit:'°C',lo:+p.pastT-5,hi:Math.min(90,+p.pastT+3)}];}
function doeState(){const D=U.doe=U.doe||{sel:['','',''],lim:{},reps:1,centers:2,filler:'',name:''};
 if(!D.filler||!(S.recipe||[]).some(r=>r.id===D.filler)){const w=(S.recipe||[]).filter(r=>ING_BY[r.id]).map(r=>({id:r.id,w:+r.g*((ING_BY[r.id].c||{}).w||0)/100})).sort((a,b)=>b.w-a.w);D.filler=w[0]?w[0].id:'';}
 return D;}
function doeFactors(){const D=doeState(),C=doeCands();return D.sel.map((k,j)=>{const c=C.find(x=>x.key===k);if(!c)return null;const L=D.lim[k]||{};
 return{id:'f'+j,key:c.key,kind:c.kind,label:c.label,unit:c.unit,lo:L.lo!=null&&L.lo!==''?+L.lo:c.lo,hi:L.hi!=null&&L.hi!==''?+L.hi:c.hi};}).filter(Boolean);}
function doeGroups(){const g={};LOTS.forEach(L=>{if(L&&L.doe&&L.doe.id)(g[L.doe.id]=g[L.doe.id]||[]).push(L);});
 return Object.values(g).map(G=>G.sort((a,b)=>a.doe.order-b.doe.order)).sort((a,b)=>String(b[0].doe.id).localeCompare(String(a[0].doe.id)));}
const doeVerdict=e=>e.p==null?'sem margem de erro (faça réplicas ou pontos centrais)':e.p<.05?'efeito provável':e.p<.1?'indício fraco':'não se distingue do ruído';
function pgDoe(m){if(m.empty)return`<div class="pg"><p class="lead">Monte na Bancada a receita de partida do experimento.</p></div>`;
 const D=doeState(),C=doeCands(),F=doeFactors(),PL=U.doePlan;
 const slot=j=>`<div class="form" style="margin-bottom:8px"><label class="field" style="grid-column:span 2"><span class="lbl">Fator ${j+1}</span><select data-c="doeSel" data-k="${j}"><option value="">—</option>${C.filter(c=>c.key===D.sel[j]||!D.sel.includes(c.key)).map(c=>`<option value="${esc(c.key)}"${c.key===D.sel[j]?' selected':''}>${esc(c.label)} (${c.unit})</option>`).join('')}</select></label>
  ${D.sel[j]?(()=>{const f=F.find(x=>x.key===D.sel[j]);return`<label class="field"><span class="lbl">Nível baixo</span><input type="number" step="any" data-i="doeLim" data-k="${esc(D.sel[j])}|lo" value="${f.lo}"></label><label class="field"><span class="lbl">Nível alto</span><input type="number" step="any" data-i="doeLim" data-k="${esc(D.sel[j])}|hi" value="${f.hi}"></label>`;})():''}</div>`;
 const n=F.length?(1<<F.length)*D.reps+(+D.centers):0;
 let html=`<div class="card"><h2>Novo experimento</h2><p class="note" style="margin-top:0">Escolha de 1 a 3 fatores para variar a partir da receita da Bancada. Cada combinação vira um lote; a ordem é sorteada para que diferenças de dia, máquina ou temperatura ambiente não se confundam com o efeito dos fatores.</p>
  <label class="field"><span class="lbl">Nome</span><input type="text" data-i="doeName" value="${esc(D.name)}" placeholder="ex.: dextrose × saída"></label>
  ${[0,1,2].map(slot).join('')}
  <div class="form"><label class="field"><span class="lbl">Réplicas</span><select data-c="doeOpt" data-k="reps">${[1,2,3].map(v=>`<option${v==D.reps?' selected':''}>${v}</option>`).join('')}</select></label>
  <label class="field"><span class="lbl">Pontos centrais</span><select data-c="doeOpt" data-k="centers">${[0,1,2,3].map(v=>`<option${v==D.centers?' selected':''}>${v}</option>`).join('')}</select></label>
  <label class="field" style="grid-column:span 2"><span class="lbl">Compensar o peso com</span><select data-c="doeOpt" data-k="filler">${(S.recipe||[]).filter(r=>ING_BY[r.id]).map(r=>`<option value="${esc(r.id)}"${r.id===D.filler?' selected':''}>${esc(ING_BY[r.id].n)}</option>`).join('')}</select></label></div>
  <p class="note">${F.length?n+' lote(s): '+(1<<F.length)+' combinações × '+D.reps+' réplica(s)'+(+D.centers?' + '+D.centers+' central(is)':'')+'. ':''}Sem réplica nem ponto central o efeito aparece, mas sem margem de erro. Pontos centrais também mostram se a resposta faz curva no meio da faixa.</p>
  <div class="row"><button class="btn pri" data-a="doeGen"${F.length?'':' disabled'}>Gerar plano</button></div></div>`;
 if(PL){const fs=PL.design.factors;
  html+=`<div class="card"><h2>Plano: ${esc(PL.name)}</h2><div class="tw"><table class="tbl"><thead><tr><th>Ordem</th>${fs.map(f=>`<th class="r">${esc(f.label)} (${f.unit})</th>`).join('')}<th class="r">Serviço prev.</th><th class="r">Overrun prev.</th><th class="r">POD</th></tr></thead><tbody>
   ${PL.design.runs.map(r=>`<tr${r.ok?'':' class="c-crit"'}><td class="mono">${r.order}${r.center?' ·c':''}</td>${fs.map(f=>`<td class="r mono">${f1(r.values[f.id])}</td>`).join('')}<td class="r mono">${r.ok?fT(r.pred.serveT)+' °C':'inviável'}</td><td class="r mono">${r.ok?f0(r.pred.ov)+'%':'—'}</td><td class="r mono">${r.ok?f1(r.pred.pod):'—'}</td></tr>`).join('')}
   </tbody></table></div>${PL.design.runs.some(r=>!r.ok)?`<p class="c-crit">Corridas inviáveis: a compensação ficaria negativa. Reduza a faixa ou escolha outro ingrediente para compensar.</p>`:''}
   <p class="note">As previsões vêm do motor e servem para conferir o plano; a análise usa só o que for medido.</p>
   <div class="row"><button class="btn pri" data-a="doeLots"${PL.design.runs.every(r=>r.ok)?'':' disabled'}>Criar ${PL.design.runs.length} lotes</button><button class="btn" data-a="doeCancel">Descartar plano</button></div></div>`;}
 const G=doeGroups();
 html+=G.length?G.map(Gs=>{const d=Gs[0].doe,id=d.id,resp=(U.doeResp||{})[id]||'ov',RS=DOE_RESP.find(x=>x[0]===resp)||DOE_RESP[0];
  const design={factors:d.factors,runs:Gs.map(L=>({coded:L.doe.coded,center:!!L.doe.center}))},ys=Gs.map(L=>RS[2](L));const R=doeAnalyze(design,ys);
  return`<div class="card"><div class="row" style="gap:8px"><h2 style="margin:0;flex:1">${esc(d.name)}</h2><span class="chip">${Gs.length} lotes</span></div>
   <p class="t2">${d.factors.map(f=>esc(f.label)+' de '+f1(f.lo)+' a '+f1(f.hi)+' '+f.unit).join(' · ')}</p>
   <label class="field"><span class="lbl">Resposta medida</span><select data-c="doeResp" data-k="${esc(id)}">${DOE_RESP.map(([k,n])=>`<option value="${k}"${k===resp?' selected':''}>${n}</option>`).join('')}</select></label>
   ${R.ok?`<p class="note">${R.n} de ${R.need} lotes medidos · média ${f2(R.mean)}${R.sd!=null?' · erro puro ±'+f2(R.sd)+' ('+R.df+(R.df===1?' grau':' graus')+' de liberdade)':''}${R.dropped?' · '+R.dropped+' termo(s) fora do modelo por falta de lotes medidos':''}</p>
    <div class="tw"><table class="tbl"><thead><tr><th>Termo</th><th class="r">Efeito (baixo → alto)</th><th class="r">p</th><th>Leitura</th></tr></thead><tbody>
    ${R.effects.map(e=>`<tr><td>${esc(e.n)}</td><td class="r mono">${(e.effect>=0?'+':'')+f2(e.effect)}${e.se!=null?' ± '+f2(e.se):''}</td><td class="r mono">${e.p==null?'—':e.p<.001?'<0,001':f2(e.p).replace(/^0/,'0')}</td><td>${doeVerdict(e)}</td></tr>`).join('')}
    ${R.curvature?`<tr><td>Curvatura (centro)</td><td class="r mono">${(R.curvature.diff>=0?'+':'')+f2(R.curvature.diff)}${R.curvature.se!=null?' ± '+f2(R.curvature.se):''}</td><td class="r mono">${R.curvature.p==null?'—':R.curvature.p<.001?'<0,001':f2(R.curvature.p)}</td><td>${doeVerdict(R.curvature)}</td></tr>`:''}
    </tbody></table></div><p class="note">Vale só para estes fatores, nesta faixa e com esta receita de partida. Efeito não é causa fora do que foi variado.</p>`
   :`<p class="muted">${esc(R.msg)} (${R.n} de ${R.need} medidos).</p>`}
   <details><summary class="t2">Lotes do experimento</summary>${Gs.map(L=>`<div class="kv"><span>${L.doe.order}${L.doe.center?' ·c':''} · ${esc(L.code)}</span><span class="mono">${RS[2](L)!=null?f2(RS[2](L)):'não medido'}</span></div>`).join('')}</details></div>`;}).join('')
  :`<div class="card"><p class="muted">Nenhum experimento ainda. Depois de criar os lotes, registre as medições em "Lotes e calibração"; a análise aparece aqui.</p></div>`;
 return`<div class="pg"><p class="lead">Planeje variações controladas da receita e descubra o que de fato muda o resultado, com o menor número de lotes.</p>${html}</div>`;}
const DOE_ACT={
 doeGen:()=>{const F=doeFactors(),D=doeState();if(!F.length)return toast('Escolha pelo menos um fator.');
  if(F.some(f=>f.kind==='ing'&&f.key===D.filler))return toast('O ingrediente de compensação não pode ser um fator.');
  let design;try{design=doeDesign({factors:F,reps:D.reps,centers:D.centers,seed:(Date.now()%2147483647)||1});}catch(e){return toast(e.message);}
  const base=JSON.parse(JSON.stringify({name:S.name,tipo:S.tipo,vit:S.vit,recipe:S.recipe,proc:S.proc,brix:S.brix||{}}));
  design.runs.forEach(r=>{const R=doeRecipe(base,design.factors,r.values,D.filler);r.ok=R.ok;if(R.ok){const m=analyze(R.st);r.pred={serveT:m.serveT,ov:m.ov,pod:m.pod,fzVit:m.fzVit};}});
  U.doePlan={design,base,filler:D.filler,name:(D.name||'').trim()||F.map(f=>f.label).join(' × ')};render();},
 doeCancel:()=>{U.doePlan=null;render();},
 doeLots:()=>{const PL=U.doePlan;if(!PL)return;const id='X'+Date.now(),n=PL.design.runs.length;let k=0;
  PL.design.runs.forEach(r=>{const R=doeRecipe(PL.base,PL.design.factors,r.values,PL.filler);if(!R.ok)return;
   const st=Object.assign({},R.st,{name:PL.name+' · corrida '+r.order});const L=newLotFromSt(st,r.order);if(!L)return;
   L.doe={id,name:PL.name,order:r.order,std:r.std,coded:r.coded,center:!!r.center,values:r.values,factors:PL.design.factors.map(f=>Object.assign({},f)),filler:PL.filler,reps:PL.design.reps,centers:PL.design.centers};
   L.notes='Experimento "'+PL.name+'": corrida '+r.order+' de '+n+'. Produza na ordem do número da corrida.';saveLot(L);k++;});
  U.doePlan=null;render();toast(k+' lotes do experimento criados');}
};
const DOE_INP={doeName:v=>{doeState().name=v;},doeLim:(v,t)=>{const[k,w]=String(t.dataset.k).split('|');const D=doeState();(D.lim[k]=D.lim[k]||{})[w]=v;}};
const DOE_CHG={doeSel:t=>{const D=doeState();D.sel[+t.dataset.k]=t.value;U.doePlan=null;},doeOpt:t=>{const D=doeState(),k=t.dataset.k;D[k]=k==='filler'?t.value:+t.value;U.doePlan=null;},
 doeResp:t=>{U.doeResp=U.doeResp||{};U.doeResp[t.dataset.k]=t.value;}};

/* ---------- FAMÍLIA DO PRODUTO (v18.3) ---------- */
const PROC_N={batch:'mantecadora (batch)',soft:'servido direto da máquina',still:'congelado parado após bater',molded:'moldado, sem ar',scraped:'raspado durante o congelamento'};
function famCard(m){const P=m.P;if(!P||!P.fam||(!P.proc&&!P.src))return'';
 return`<div class="card"><div class="row" style="gap:8px;align-items:baseline"><h2 style="margin:0;flex:1">${esc(P.n)}</h2><span class="chip">${FAM_N[P.fam]||''}</span><span class="chip${P.conf==='fonte'?' ok':''}">${P.conf==='fonte'?'faixas com fonte':'faixas de prática'}</span></div>
  <div class="kv"><span>Processo</span><span>${PROC_N[P.proc||'batch']}</span></div><div class="kv"><span>Serviço</span><span>${esc(P.serveCtx||'vitrine')}${P.serveT!=null?' · '+fT(P.serveT)+' °C':''}</span></div>
  <div class="kv"><span>Overrun</span><span>${f0(m.ov)}% (${m.ovSrc==='processo'?'típico da família':'previsto pela máquina'}; faixa ${f0(P.ov[0])}–${f0(P.ov[1])}%)</span></div>
  ${(P.src||[]).length?`<details><summary class="t2">Origem das faixas</summary>${P.src.map(x=>`<p class="note" style="margin:6px 0">${esc(x)}</p>`).join('')}</details>`:''}</div>`;}

/* ---------- O QUE MEDIR (v18.1, especificação §30) ---------- */
function measureCard(m){const P=measurePlan(S,m,CAL.on?CAL:{counts:{}},uncertainty(S));if(!P.length)return'<div class="card"><p class="muted">Monte uma receita para ver o que medir.</p></div>';
 const ACC={casa:'em casa',barato:'equipamento barato',lab:'laboratório'};
 return`<div class="card"><p class="note" style="margin-top:0">A ordem combina: o efeito que o motor consegue calcular nesta receita (quando dá para calcular), a natureza do modelo que a medição corrige (regra prática pesa mais que física), quantos lotes já o corrigiram e o custo de medir. Os números aparecem para você julgar.</p></div>
 ${P.map((p,i)=>`<div class="card"><div class="row" style="gap:8px;align-items:baseline"><span class="mono muted">${i+1}</span><h2 style="margin:0;flex:1">${esc(p.what)}</h2><span class="chip">${ACC[p.acc]}</span>${p.n&&p.n<9?`<span class="chip ok">já corrigido por ${p.n} lote(s)</span>`:''}</div>
  ${p.impact?`<p class="t2" style="margin:8px 0 4px">${p.quant?'<b>Efeito calculado:</b> ':''}${esc(p.impact)}</p>`:''}
  <p style="margin:4px 0">${esc(p.why)}</p>
  <div class="kv"><span>Equipamento</span><span>${esc(p.equip)}</span></div><div class="kv"><span>Onde registrar</span><span>${esc(p.field)}</span></div>
  <p class="note" style="margin-bottom:0">${esc(p.how)}</p></div>`).join('')}`;}

/* ---------- MAESTRO GELATIERE NESTA RECEITA (v17.10) ---------- */
function maqCard(m){const M=maqPlan(m,S.proc);if(!M)return'';const p=S.proc;
 return`<div class="card"><div class="row"><h2 style="margin:0">Maestro Gelatiere nesta receita</h2><span class="sp"></span>${can.edit()&&Math.abs(+p.drawT-M.t35)>.15?`<button class="btn sm pri" data-a="maqUse">Usar saída ${f1(M.t35)} °C</button>`:''}</div>
  <p class="t2" style="margin:6px 0 10px">Saída a <b>${fT(+p.drawT)} °C</b> no centro: <b>${f0(M.fzNow)}%</b> da água já em gelo. Nas mantecadoras profissionais sai a −10/−11 °C com ~75% (Corvitto); na Maestro o alvo realista é <b>${f1(M.t35)} °C</b> (35%), e cada grau a mais vale ~12–15 pontos de gelo. O resto do gelo se forma no freezer: por isso o endurecimento rápido pesa tanto.</p>
  <div class="tw"><table class="tbl"><thead><tr><th>Carga</th><th class="r">Até ${fT(+p.drawT)} °C</th><th class="r">Até ${f1(M.t35)} °C</th></tr></thead><tbody>
  ${M.loads.map(l=>`<tr${l.g===M.best?' style="background:var(--hov)"':''}><td>${f0(l.g)} g${l.g===M.best?' · <span class="c-ok">melhor textura</span>':''}</td><td class="r mono" style="white-space:nowrap">${f0(l.tDraw)} min</td><td class="r mono" style="white-space:nowrap">${f0(l.t35)} min</td></tr>`).join('')}</tbody></table></div>
  <div class="g3" style="margin-top:10px;gap:10px">
   <div class="kv"><span>Capacidade estimada</span><span>${f0(M.Q)} W</span></div><div class="kv"><span>Calda entra a</span><span>${fT(M.Tin)} °C</span></div><div class="kv"><span>Ponto de congelamento</span><span>${f1(M.fp)} °C</span></div></div>
  <ul class="t2" style="margin:10px 0 0;padding-left:18px">
   <li>Calda direto da geladeira; a 1 °C em vez de ${fT(M.Tin)} °C o ciclo cai ~${f0(M.saveCold)} min.</li>
   <li>${M.preChill?'Pré-resfriando, a parede deve estar bem abaixo de '+f0(M.wall)+' °C (12 °C abaixo do ponto de congelamento) quando a calda entra.':'Pelo manual a refrigeração liga depois da calda. Pré-resfriar 5–8 min com o batedor ligado economizaria ~'+f0(M.savePre)+' min e daria cristais menores; confirme com a Maqp1 antes.'}</li>
   <li>A temperatura da máquina ao receber a calda não muda de receita para receita (quanto mais fria, melhor). O que muda é a saída: receitas com mais PAC (álcool, dextrose, sorbets) congelam mais frio e pedem mais tempo.</li></ul>
  <p class="note" style="margin:8px 0 0">Capacidade calculada a partir da sua carga e do seu tempo (${f0(M.load)} g em ${fT(M.min)} min). Meça o tempo real até a saída e ajuste no campo "Tempo de mantecação": a tabela se recalibra. Estimativa linear: perto do limite da máquina o frio rende menos e os tempos longos podem ser maiores.</p></div>`;}

/* ---------- PONTO DE QUENELLE (v17.9) ---------- */
function quenelleCard(m,compact){const q=quenelleModel(m);if(!q)return'';
 const T0=Math.floor(Math.min(q.Tbr,m.serveT,+S.vit)-2),T1=Math.ceil(Math.max(q.Tsl,m.serveT)+2);const W=380,H=compact?84:96,L=10,R=10,y0=32,bh=22;
 const x=t=>L+(t-T0)/(T1-T0)*(W-L-R);let g='';
 g+=`<rect x="${x(T0)}" y="${y0}" width="${x(q.Tbr)-x(T0)}" height="${bh}" rx="4" fill="rgba(125,211,252,.22)"/><rect x="${x(q.Tbr)}" y="${y0}" width="${x(q.Tsl)-x(q.Tbr)}" height="${bh}" fill="rgba(110,231,183,.55)"/><rect x="${x(q.Tsl)}" y="${y0}" width="${x(T1)-x(q.Tsl)}" height="${bh}" rx="4" fill="rgba(251,191,36,.25)"/>`;
 g+=`<text x="${(x(T0)+x(q.Tbr))/2}" y="${y0+15}" text-anchor="middle" font-size="11.5" fill="var(--t1)">racha</text><text x="${(x(q.Tsl)+x(T1))/2}" y="${y0+15}" text-anchor="middle" font-size="11.5" fill="var(--t1)">desaba</text>`;
 for(let t=Math.ceil(T0)+1;t<T1;t++)g+=`<text x="${x(t)}" y="${y0+bh+17}" text-anchor="middle" font-size="11" fill="var(--t3)">${t}°</text>`;
 const mk=(t,lab,col,up)=>`<line x1="${x(t)}" x2="${x(t)}" y1="${y0-6}" y2="${y0+bh+4}" stroke="${col}" stroke-width="2"/><text x="${x(t)}" y="${up?y0-20:y0-9}" text-anchor="middle" font-size="12" font-weight="600" fill="${col}">${lab}</text>`;
 g+=mk(q.T,'quenelle '+f1(q.T)+'°','var(--ok)')+(Math.abs(m.serveT-q.T)>.6?mk(m.serveT,'colher '+f1(m.serveT)+'°','var(--ice)',Math.abs(m.serveT-q.T)<2.2):'');
 const pote=poteModel(m,m.pr);const tq=pote&&pote.timeTo?pote.timeTo(q.T):null;
 const pct=v=>f0(v*100)+'%';
 return`<div class="card"><div class="row"><h2 style="margin:0">Ponto de quenelle${natTag('quenelle')}</h2><span class="sp"></span><span class="chip ok">${f1(q.T)} °C</span></div>
  <p class="t2" style="margin:6px 0 4px">Quenelle lisa entre <b>${f1(q.Tbr)}</b> e <b>${f1(q.Tsl)} °C</b> (janela de ${f1(q.width)} °C). Mais frio racha; mais quente desaba no prato.</p>
  <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="Janela de quenelle de ${f1(q.Tbr)} a ${f1(q.Tsl)} graus">${g}</svg>
  ${compact?'':`<div class="g3" style="margin-top:10px;gap:10px">
   <div class="kv"><span>Gelo em volume no ponto</span><span>${pct(q.phiQ)}</span></div><div class="kv"><span>Coesão (não racha)</span><span class="${q.C>=.7?'c-ok':q.C>=.5?'c-warn':'c-crit'}">${pct(q.C)}</span></div><div class="kv"><span>Sustentação no prato</span><span class="${q.H>=.6?'c-ok':q.H>=.35?'c-warn':'c-crit'}">${pct(q.H)}</span></div>
   <div class="kv"><span>Superfície</span><span style="font-family:var(--fb)">${esc(q.sheen)}</span></div><div class="kv"><span>Textura</span><span style="font-family:var(--fb)">${esc(q.smooth)}</span></div><div class="kv"><span>Do freezer ao ponto</span><span>${tq!=null?f0(tq)+' min':'—'}</span></div></div>
   ${q.notes.length?`<ul class="t2" style="margin:10px 0 0;padding-left:18px">${q.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>`:''}
   <p class="note" style="margin:10px 0 0">Calculado pela fração de gelo em volume (gelo, matriz e ar), pela coesão (rede de gordura, viscosidade, estabilizante) e pela resistência ao derretimento. "Do freezer ao ponto": pote de ${f0(+m.pr.poteMl)} ml saindo a ${fT(+m.pr.storeT)} °C em ambiente a ${fT(+m.pr.ambT)} °C, na camada de onde sai a colherada. Colher mergulhada em água quente e seca. ${CAL.counts&&CAL.counts.q?'Ajustado por '+CAL.counts.q+' teste(s) de quenelle dos seus lotes.':'Registre testes de quenelle nos Lotes (temperatura e resultado) para ajustar o ponto à sua produção.'}</p>`}</div>`;}

function textureCard(m){const pts=[['Saída da mantecadora',m.pr.drawT],['Ponto de quenelle',quenelleModel(m).T],['Serviço ideal',m.serveT],['Vitrine configurada',+S.vit],['Freezer',m.pr.storeT]];
 const fmax=fzMaxFrac(m.SE)*100;
 return`<div class="card"><h2>Gelo em volume e dureza${natTag('ice-volume')}</h2><p class="t2" style="margin:0 0 8px">A dureza acompanha o volume ocupado pelo gelo no gelato pronto, e não só o % de água congelada: o ar dilui o gelo. Esta receita tem ${f0(m.ov)}% de overrun e ${f0(m.wat)}% de água.</p>
  <div class="tw"><table class="tbl"><thead><tr><th>Momento</th><th class="r">Temperatura</th><th class="r">Água congelada</th><th class="r">Gelo em volume</th></tr></thead><tbody>
  ${pts.map(([n,t])=>`<tr><td>${n}</td><td class="r mono">${f1(t)} °C</td><td class="r mono">${f0(m.fz(t))}%</td><td class="r mono">${f0(icePhaseVol(m,t)*100)}%</td></tr>`).join('')}</tbody></table></div>
  <p class="note" style="margin:8px 0 0">Água que nunca congela nesta receita: ${f0(100-fmax)}% da água (a fase concentrada vitrifica perto de −35 °C, concentração máxima de ~80% em equivalente de sacarose).</p></div>`;}

/* ---------- CONGELAMENTO ---------- */
function chart(m){
 /* eixo até −25 °C, ou mais frio se o freezer/serviço estiver abaixo disso */
 const TM=Math.min(-25,Math.floor((Math.min(m.pr.storeT,+S.vit)-2)/5)*5),W=640,H=300,L=44,R=14,Tp=16,B=36,tx=t=>L+(-t)/(-TM)*(W-L-R),ty=p=>Tp+(100-p)/100*(H-Tp-B);
 const pts=[],raw=[];for(let t=0;t>=TM;t-=.25){pts.push([tx(t),ty(m.fz(t))]);if(m.hfAbs>0)raw.push([tx(t),ty(frozenPct(t,m.SEraw,m.S))]);}
 const path=a=>'M'+a.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L');
 const P=m.P;let g='';
 for(let p=0;p<=100;p+=20)g+=`<line x1="${L}" x2="${W-R}" y1="${ty(p)}" y2="${ty(p)}" stroke="var(--line)" stroke-width="1"/><text x="${L-8}" y="${ty(p)+4}" text-anchor="end" fill="var(--t3)" font-size="10">${p}%</text>`;
 for(let t=0;t>=TM;t-=5)g+=`<text x="${tx(t)}" y="${H-B+18}" text-anchor="middle" fill="var(--t3)" font-size="10">${t}°</text>`;
 g+=`<text x="${(W+L)/2}" y="${H-4}" text-anchor="middle" fill="var(--t3)" font-size="10">temperatura (°C)</text>`;
 g+=`<rect x="${L}" y="${ty(P.fz[1])}" width="${W-L-R}" height="${ty(P.fz[0])-ty(P.fz[1])}" fill="rgba(110,231,183,.1)"/>`;
 /* rótulos à esquerda da linha quando perto da borda direita; vitrine e estoque iguais viram um rótulo só */
 const mk=(t,lab,col,dy)=>{const x=tx(t),right=x>W-150;return`<line x1="${x}" x2="${x}" y1="${Tp}" y2="${H-B}" stroke="${col}" stroke-dasharray="3 3"/><text x="${right?x-4:x+4}" y="${Tp+10+dy}" text-anchor="${right?'end':'start'}" fill="${col}" font-size="10">${lab} ${f1(t)}°</text>`;};
 const same=Math.abs(+S.vit-m.pr.storeT)<.6;
 g+=mk(m.pr.drawT,'saída','var(--gold)',0)+(m.pr.serveFrom==='pote'?mk(+S.vit,'colher após '+f0(+m.pr.waitMin)+' min','var(--ice)',14)+mk(m.pr.storeT,'freezer','var(--info)',28):same?mk(+S.vit,'vitrine = estoque','var(--ice)',14):mk(+S.vit,'vitrine','var(--ice)',14)+mk(m.pr.storeT,'estoque','var(--info)',28));
 if(raw.length)g+=`<path d="${path(raw)}" fill="none" stroke="var(--t3)" stroke-width="1.5" stroke-dasharray="4 4"/>`;
 g+=`<path d="${path(pts)}" fill="none" stroke="var(--ice)" stroke-width="2.5"/>`;
 {const x=tx(+S.vit),r=x>W-60;g+=`<circle cx="${x}" cy="${ty(m.fzVit)}" r="5" fill="var(--ice)"/><text x="${r?x-8:x+8}" y="${ty(m.fzVit)+18}" text-anchor="${r?'end':'start'}" fill="var(--t1)" font-size="11">${f0(m.fzVit)}%</text>`;}
 if(m.serveT<0&&m.serveT>TM)g+=`<circle cx="${tx(m.serveT)}" cy="${ty(m.fzMid)}" r="4" fill="none" stroke="var(--ok)" stroke-width="2"/>`;
 return`<div class="tw"><svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:480px;height:auto" role="img" aria-label="Curva de água congelada por temperatura">${g}</svg></div>
 <div class="row note" style="gap:16px;margin-top:6px"><span><span class="c-ice">━</span> curva efetiva (com fator de dureza)</span>${raw.length?'<span>┅ curva sem fator de dureza</span>':''}<span><span class="c-ok">■</span> faixa de serviço ${fT(P.fz[0])}–${fT(P.fz[1])}%</span><span><span class="c-ok">○</span> ponto ideal</span></div>`;}
function pgCongel(m){
 if(m.empty)return`<div class="pg"><h1>Congelamento</h1><p class="lead">Monte uma receita primeiro.</p></div>`;
 return`<div class="pg"><div><h1>Congelamento</h1><p class="lead">Quanto da água vira gelo em cada temperatura. A textura de vitrine ideal fica com ${fT(m.P.fz[0])}–${fT(m.P.fz[1])}% da água congelada.</p></div>
 ${S.proc.serveFrom==='pote'?poteCard(m,false):''}
 <div class="card">${chart(m)}</div>
 <div class="g3">
  <div class="card"><h2>Temperaturas</h2>
   <div class="kv"><span>Início do congelamento</span><span>${f2(m.fp)} °C</span></div>
   <div class="kv"><span>Serviço ideal desta receita</span><span class="c-ok">${f1(m.serveT)} °C</span></div>
   <div class="kv"><span>Faixa de serviço</span><span>${f1(m.serveRange[1])} a ${f1(m.serveRange[0])} °C</span></div>
   <div class="kv"><span>Vitrine configurada</span><span class="c-ice">${f1(S.vit)} °C</span></div>${uncCard(m)}</div>
  <div class="card"><h2>Água congelada</h2>
   <div class="kv"><span>Na saída (${f1(m.pr.drawT)} °C)</span><span class="${m.fzDraw>=45?'c-ok':'c-warn'}">${f0(m.fzDraw)}%</span></div>
   <div class="kv"><span>Na vitrine (${f1(S.vit)} °C)</span><span class="${stCls(m.fzVit,m.P.fz)}">${f0(m.fzVit)}%</span></div>
   <div class="kv"><span>No estoque (${f1(m.pr.storeT)} °C)</span><span>${f0(m.fzStore)}%</span></div></div>
  <div class="card"><h2>PAC (método Corvitto)</h2>
   <div class="kv"><span>PAC da mistura</span><span>${f0(m.pacKg)} /kg</span></div>
   <div class="kv"><span>Fator de dureza (HF)</span><span class="${m.hfKg>=.5?'c-gold':'muted'}">${m.hfKg>=.5?'−'+f0(m.hfKg):'0'} /kg</span></div>
   <div class="kv"><span>PAC efetivo</span><span class="c-ice">${f0(m.pacEffKg)} /kg</span></div>
   <div class="kv"><span>PAC necessário a ${f1(S.vit)} °C</span><span>${f0(m.pacNeedKg-m.hfKg)} /kg</span></div>
   <div class="kv"><span>Referência rápida Corvitto (≈23 × |T|)</span><span class="muted">${f0(m.corvittoRef)} /kg</span></div></div>
 </div>
 <div class="card flat"><h2>Como o motor calcula</h2><p class="note" style="margin:0">Cada açúcar, poliol, sal e álcool é convertido em equivalente de sacarose pelo seu peso molecular (sacarose 100, dextrose 190, frutose 190, lactose 100, eritritol 280, etanol 740, sal 1090). A concentração na água da mistura dá o ponto de congelamento pela tabela de Goff &amp; Hartel; os sais do leite entram pelo termo de Leighton (2,37 × MSNF / água). Conforme o gelo se forma, a água restante concentra e o motor resolve, grau a grau, a fração que ainda pode congelar. Cacau e oleaginosas entram pelo fator de dureza de Corvitto, recalibrado para que o Helado de nata (410 PAC) e o Helado de chocolate do Recetario sirvam ambos a −18 °C, como no livro.</p></div>
 </div>`;}

/* ---------- PROCESSO ---------- */
function pgProcesso(m,F){
 const p=S.proc,PF=F.filter(f=>f.area==='Processo'||f.area==='Segurança');
 const sel=(id,label,opts,val,hint)=>`<label class="field"><span class="lbl">${label}</span><select id="p-${id}" data-c="proc" data-k="${id}">${opts.map(([v,n])=>`<option value="${v}"${String(v)===String(val)?' selected':''}>${n}</option>`).join('')}</select>${hint?`<span class="hint">${hint}</span>`:''}</label>`;
 return`<div class="pg"><div><h1>Processo e equipamentos</h1><p class="lead">Pasteurização, maturação, mantecação e abatimento mudam o resultado tanto quanto a fórmula. Os valores pertencem ao set ativo (Artigianale ou Professionale); o roteiro passo a passo fica na Ficha de produção.</p></div>
 ${setGearCard()}
 <div class="card"><h2>Pasteurização e resfriamento</h2><div class="form">
  ${fieldNum('p-pastT','Temperatura (°C)',p.pastT,1,'Alta 85 °C · baixa 65 °C')}
  ${fieldNum('p-pastHold','Retenção',p.pastHold,1,'')}
  ${sel('pastHoldU','Unidade da retenção',[['s','segundos'],['min','minutos']],p.pastHoldU)}
  ${fieldNum('p-coolMin','Resfriar até 4 °C em (min)',p.coolMin,5,'Máximo seguro: 120 min')}
  ${fieldNum('p-lossPct','Perda no cozimento (%)',p.lossPct,1,'Água evaporada em cremes cozidos e reduções. Pese a panela antes e depois')}
 </div></div>
 <div class="card"><h2>Maturação</h2><div class="form">
  ${fieldNum('p-matH','Tempo (h)',p.matH,.5,'Calculado para a receita no quadro abaixo')}
  ${fieldNum('p-matT','Temperatura (°C)',p.matT,.5,'Ideal 2–4 °C')}
  ${sel('fruitStage','Fruta ácida entra',[['depois','fria, após maturar'],['antes','antes de pasteurizar']],p.fruitStage)}
  ${sel('alcStage','Álcool entra',[['depois','na mistura fria'],['antes','antes do calor']],p.alcStage)}
 </div></div>
 ${matCard(S,m)}
 ${p.machine==='maqp1'?maqCard(m):''}
 <div class="card"><h2>Mantecação, abatimento e armazenamento</h2><div class="form">
  ${sel('machine','Equipamento',Object.entries(MACH).map(([k,v])=>[k,v.n]),p.machine)}
  ${p.machine==='maqp1'?fieldNum('p-load','Carga por ciclo (g)',p.load||1100,50,'Tanque 3 L: de ¼ a ⅔ (≈ 800 a 2.000 g)'):''}
  ${fieldNum('p-drawT','Temperatura de saída (°C)',p.drawT,.5,p.machine==='maqp1'?'No centro da massa · alvo desta receita '+f1(tempAtFz(m,35))+' °C':'Ideal '+fT(m.P.draw[1])+' a '+fT(m.P.draw[0])+' °C')}
  ${fieldNum('p-drawMin','Tempo de mantecação (min)',p.drawMin,1,p.machine==='maqp1'?'O tempo que você mede com essa carga (calibra a máquina)':'Batch: 8–12 min')}
  ${p.machine==='maqp1'?sel('preChill','Antes da calda',[[0,'Como no manual: refrigeração depois da calda'],[1,'Pré-resfriar 5–8 min com o batedor ligado']],+p.preChill||0):''}
  ${fieldNum('p-blastT',p.hardAuto?'Freezer no Turbo (°C)':'Abatedor (°C)',p.blastT,1,p.hardAuto?'Ar do freezer com Turbo ligado; meça se puder':'−35 a −40 °C')}${p.hardAuto?fieldNum('p-turboMin','Turbo durante o endurecimento (min)',p.turboMin,10,'O Turbo dura 150 min; ligado 30 min antes, sobram 120'):''}
  ${fieldNum('p-hardMin','Até −18 °C no núcleo (min)',p.hardMin,5,p.hardAuto?'Calculado pelo conjunto (tamanho do pote, saída e freezer)':'Ideal até 60 min',p.hardAuto?'readonly':'')}
  ${fieldNum('p-storeT','Freezer de armazenamento (°C)',p.storeT,.5,'Meça no centro de uma cuba · ideal −18 a −22 °C')}
  ${fieldNum('p-storeFluct','Oscilação do freezer (± °C)',p.storeFluct,.5,'Diferença entre a máxima e a mínima do dia ÷ 2')}
  ${sel('serveFrom','Serviço',[['vitrine','Vitrine (sai do freezer para a vitrine)'],['pote','Em casa: do freezer para o pote, espera e serve'],['freezer','Na temperatura do freezer (sem espera)']],p.serveFrom)}
  ${p.serveFrom==='pote'?fieldNum('p-poteMl','Tamanho do pote (mL)',p.poteMl,50,'Volume do gelato no pote')+fieldNum('p-ambT','Temperatura da cozinha (°C)',p.ambT,1,'Onde o pote fica esperando')+fieldNum('p-waitMin','Espera antes de servir (min)',p.waitMin,1,'O balanceamento mira o ponto depois deste tempo'):''}
 </div></div>
 ${m.empty?'':`<div class="g3">
  <div class="card"><h2>Overrun previsto${natTag('overrun')}</h2><div class="big c-ice">${f0(m.ov)}%</div><p class="t2" style="margin:6px 0 0">≈ ${f0(m.gPerL)} g de gelato por litro · ${f2(1+m.ov/100)} L por kg de mistura</p><p class="note">Faixa usual: ${fT(m.P.ov[0])}–${fT(m.P.ov[1])}% · ${esc(m.mach.n)}</p></div>
  <div class="card"><h2>Cristalização${natTag('ice-crystal-size')}</h2><div class="big ${m.ci>=80?'c-ok':m.ci>=60?'c-warn':'c-crit'}">${m.ci}<small class="muted" style="font-size:14px"> /100</small></div><p class="t2" style="margin:6px 0 0">Cristais estimados ≈ ${m.crystal} µm (índice heurístico, não medido) (acima de ~50 µm a língua percebe gelo)</p><p class="note">${m.ciNotes.length?'Pesam contra: '+m.ciNotes.join(', ')+'.':'Processo favorece cristais pequenos.'} ${f0(m.fzDraw)}% da água sai congelada da máquina.</p></div>
  <div class="card"><h2>Resistência ao derretimento${natTag('melt')}</h2><div class="big ${m.melt>=65?'c-ok':m.melt>=45?'c-warn':'c-crit'}">${f0(m.melt)}<small class="muted" style="font-size:14px"> /100</small></div><p class="note">Combina estabilizantes, emulsificantes, ar incorporado, sólidos e o quanto a receita congela na vitrine.</p></div>
 </div>
 <div class="card"><h2>Verificações de processo</h2>${PF.map(findHTML).join('')||'<p class="muted">Nada a apontar.</p>'}</div>`}
 </div>`;}

/* ---------- BRIX ---------- */
/* Brix da safra: cartão contextual na Bancada (só aparece com fruta na receita) e leitura da mistura no Laudo */
function brixFruitCard(m){const fr=(S.recipe||[]).filter(r=>ING_BY[r.id]&&ING_BY[r.id].brix);if(!fr.length||m.empty)return'';
 const ref=analyze({...S,brix:{}});const dPod=m.A.pod-ref.A.pod,dPac=m.A.pac-ref.A.pac;const meas=fr.some(r=>S.brix[r.id]!=null&&S.brix[r.id]!=='');
 return`<details class="card dcard" id="brixCard"${dOpen('brixCard',U.brixOpen||meas)}><summary><h2 style="margin:0">Brix da fruta desta safra</h2><span class="chip${meas?' ok':''}">${meas?'medido':'tabela'}</span></summary>
 <p class="note" style="margin:8px 0 4px">A doçura de cada safra varia. Meça o °Brix da polpa no refratômetro e digite ao lado: açúcares, água e a receita inteira são recalculados.</p>
 <div class="bxlist">${fr.map(r=>{const i=ING_BY[r.id],b=S.brix[r.id];const has=b!=null&&b!=='';const d=has?(+b-i.brix):0;const dg=r.g*.9*d/100;
  return`<div class="bxrow"><div class="bxn"><b>${esc(i.n)}</b><small>${f0(r.g)} g · tabela ${fT(i.brix)} °Bx${has?` · <span class="${d>0?'c-gold':d<0?'c-crit':''}">${dg>=0?'+':''}${f1(dg)} g de açúcar no lote</span>`:''}</small></div>
   <div class="bxin"><input type="number" inputmode="decimal" id="bx-${r.id}" data-i="brix" data-id="${r.id}" value="${has?esc(b):''}" placeholder="${fT(i.brix)}" step=".1" min="1" max="85" aria-label="Brix medido de ${esc(i.n)}"><span>°Bx</span>${has?`<button class="btn sm ghost" data-a="brixReset" data-v="${r.id}" aria-label="Voltar ao valor de tabela">Tabela</button>`:''}</div></div>`;}).join('')}</div>
 ${Math.abs(dPod)>.5?`<div class="find" style="border:0;padding-bottom:0"><div class="bar ${dPod>0?'warn':'info'}"></div><div><h3>Compensação da safra</h3><p>A fruta medida traz ${dPod>0?'+':''}${f0(dPod)} g de doçura equivalente e ${dPac>0?'+':''}${f0(dPac)} de PAC em relação à tabela.</p><div class="fix"><b>Solução</b>Para manter a receita original, ${dPod>0?'retire':'acrescente'} ≈ ${f0(Math.abs(dPod))} g de sacarose; ou aplique o balanceamento ao lado, que já considera a fruta medida.</div></div></div>`:''}
</details>`;}
function brixMixCards(m){if(m.empty)return'';return`<div class="g2">
  <div class="card"><h2>Brix estimado da mistura</h2><div class="big c-ice">${m.empty?'—':f1(m.brixMix)}<small class="muted" style="font-size:14px"> °Bx</small></div>
   <p class="t2" style="margin:6px 0 0">${tbase(S.tipo)==='sorbetto'?'Sorbetto: leitura no refratômetro entre 28 e 32 °Bx. Se medir diferente do previsto, a fruta ou a pesagem divergem.':'Em bases lácteas a gordura e a proteína distorcem a leitura do refratômetro; use o valor só como controle de lote para lote.'}</p></div>
  <div class="card"><h2>Relação Brix / acidez</h2><div class="big ${m.brixAcid==null?'muted':m.brixAcid<20?'c-warn':m.brixAcid>60?'c-info':'c-ok'}">${m.brixAcid==null||m.acd<.05?'—':f0(m.brixAcid)}</div>
   <p class="t2" style="margin:6px 0 0">Abaixo de 20: ácido dominante · 20–35: vivo, cítrico · 35–60: fruta madura equilibrada · acima de 60: plano. Acidez orgânica da mistura: ${f2(m.acd)}%.</p></div>
 </div></div>`;}
function pgBrix(m){return`<div class="pg"><div><h1>Calibração Brix</h1></div>${brixFruitCard(m)||'<p class="muted">Nenhuma fruta na receita.</p>'}${brixMixCards(m)}</div>`;}

/* ---------- DEFEITOS (v17.6): sintomas → diagnóstico diferencial · banco por defeito · risco da receita ---------- */
const DEF_SEV={qualidade:['Qualidade','info'],comercial:['Comercial','warn'],seguranca:['Segurança','crit']};
const defLvl=s=>s>.66?'crit':s>.33?'warn':'info';
const defLvlN=s=>s>.66?'alta':s>.33?'média':'baixa';
const DEF_SNAME={};DEF_SINT.forEach(g=>g[2].forEach(([k,n])=>DEF_SNAME[k]=n));
function defCauses(R){return R.length?R.map(r=>`<div class="find"><div class="bar ${defLvl(r.s)}"></div><div><div class="area">Probabilidade ${defLvlN(r.s)} · ${f0(r.s*100)}%</div><h3>${esc(r.txt)}</h3><div class="fix"><b>Correção</b>${esc(r.fix)}</div></div></div>`).join('')
 :'<p class="t2" style="margin:0">Nenhuma causa provável na receita e no processo atuais. Confira a lista de processo e manuseio abaixo, a pesagem e a calibração dos termômetros.</p>';}
function defDetail(d,m){const R=m.empty?[]:rankDefect(d,m);const sv=DEF_SEV[d.sev]||DEF_SEV.qualidade;const al=d.al||{};
 return`<div class="card"><h2>${esc(d.n)} <span class="muted" style="text-transform:none;letter-spacing:0">— ${esc(d.d)}</span></h2>
 <div class="chips" style="margin:2px 0 10px">${[['it','IT'],['es','ES'],['en','EN']].filter(([k])=>al[k]).map(([k,n])=>`<span class="tag">${n} · ${esc(al[k])}</span>`).join('')}<span class="tag" style="color:var(--${sv[1]==='info'?'t2':sv[1]})">${sv[0]}</span></div>
 ${d.sev==='seguranca'?'<p class="t2" style="margin:0 0 10px"><b style="color:var(--crit)">Segurança alimentar:</b> na dúvida, não prove de novo. Descarte o lote e registre em Produção ao vivo.</p>':''}
 ${d.how?`<h3 style="margin:10px 0 4px">Como identificar</h3><p class="t2" style="margin:0 0 6px">${esc(d.how)}</p>`:''}
 ${d.mec?`<h3 style="margin:10px 0 4px">Por que acontece</h3><p class="t2" style="margin:0">${esc(d.mec)}</p>`:''}</div>
 <div class="card"><h2>Causas na receita e no processo atuais</h2>${defCauses(R)}</div>
 ${(d.pc&&d.pc.length)?`<div class="card"><h2>Verifique também (processo e manuseio)</h2>${d.pc.map(([c,f],i)=>`<label class="find" style="cursor:pointer"><div class="bar info"></div><div><h3><input type="checkbox" data-c="defChk" data-v="${d.id}:${i}"${U.defChk&&U.defChk[d.id+':'+i]?' checked':''} style="margin-right:8px">${esc(c)}</h3><div class="fix"><b>Correção</b>${esc(f)}</div></div></label>`).join('')}</div>`:''}
 <div class="card"><h2>Prevenção</h2><ul class="t2" style="margin:0;padding-left:18px">${(d.prev||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
 <h3 style="margin:14px 0 4px">Fontes</h3><ul class="muted" style="margin:4px 0 0;padding-left:18px;font-size:12px">${(d.src||[]).map(k=>`<li>${esc(DEF_SRC[k]||k)}</li>`).join('')}</ul></div>`;}
function pgDefeitos(m){
 const mode=subOf('defeitos',U.defMode||'sint');const sel=U.defSym||[];
 const tabs=segHTML('defeitos',[['sint','Pelos sintomas'],['banco','Por defeito']],mode,'Modo do diagnóstico');
 let body='';
 if(mode==='sint'){
  const D=sel.length?diagnoseSymptoms(sel,m):[];const top=D[0];
  body=`<div class="card"><h2>O que você percebe? <span class="muted" style="text-transform:none;letter-spacing:0">— marque um ou mais sintomas</span></h2>
  ${DEF_SINT.map(([g,gn,L])=>`<div style="margin:10px 0 4px" class="muted">${gn}</div><div class="chips">${L.map(([k,n])=>`<button data-a="defSym" data-v="${k}" aria-pressed="${sel.includes(k)}">${n}</button>`).join('')}</div>`).join('')}
  ${sel.length?`<div style="margin-top:12px"><button class="btn ghost" data-a="defClr">Limpar sintomas</button></div>`:''}</div>
  ${sel.length?`<div class="card"><h2>Diagnóstico diferencial</h2><p class="t2" style="margin:0 0 8px">Ordem pela combinação dos sintomas marcados e das causas que o motor encontra na receita e no processo atuais.</p>
  ${D.length?`<div class="pills">${D.slice(0,8).map(x=>`<button class="pill2 ${defLvl(x.score)}" data-a="defOpen" data-v="${x.d.id}" style="text-align:left;cursor:pointer" aria-pressed="${top&&x.d.id===(U.defPick||top.d.id)}"><span class="dot"></span><span class="n">${esc(x.d.n)}</span><span class="v">${f0(x.score*100)}% · ${x.ev>.05?'receita confirma':'sintomas'}</span></button>`).join('')}</div>`:'<p class="t2">Nenhum defeito do banco combina com esses sintomas.</p>'}</div>
  ${(()=>{const pk=D.find(x=>x.d.id===U.defPick)||top;return pk?defDetail(pk.d,m):'';})()}`:''}`;
 }else if(mode==='banco'){
  const cat=U.defCat||'';const L=DEFECTS.filter(x=>!cat||x.cat===cat);const d=DEFECTS.find(x=>x.id===S.defect)||L[0]||DEFECTS[0];
  body=`<div class="card"><div class="chips" style="margin-bottom:10px"><button data-a="defCat" data-v="" aria-pressed="${!cat}">Todos · ${DEFECTS.length}</button>${DEF_CAT.map(([k,n])=>`<button data-a="defCat" data-v="${k}" aria-pressed="${cat===k}">${n} · ${DEFECTS.filter(x=>x.cat===k).length}</button>`).join('')}</div>
  <div class="chips">${L.map(x=>`<button data-a="defect" data-v="${x.id}" aria-pressed="${x.id===d.id}">${x.n}</button>`).join('')}</div></div>${defDetail(d,m)}`;
 }
 return`<div class="pg"><div class="pghead"><div><h1>Diagnóstico de defeitos</h1><p class="lead">Banco de ${DEFECTS.length} defeitos do gelato artesanal com sintomas, mecanismo, causas medidas pelo motor, checklist de processo, prevenção e fontes. Os riscos da receita atual estão no Laudo.</p></div>${tabs}</div>${body}</div>`;}

/* ---------- RÓTULO ---------- */
const BRAL={leite:'LEITE E DERIVADOS',ovo:'OVOS E DERIVADOS',soja:'SOJA E DERIVADOS',amendoim:'AMENDOIM',peixe:'PEIXES',crustaceo:'CRUSTÁCEOS'};
const EU14=[['leite','Leite'],['ovo','Ovo'],['nozes','Frutos de casca'],['amendoim','Amendoim'],['soja','Soja'],['gluten','Glúten'],['sesamo','Sésamo'],['sulfito','Sulfitos'],['peixe','Peixe'],['crustaceo','Crustáceos'],['molusco','Moluscos'],['aipo','Aipo'],['mostarda','Mostarda'],['tremoco','Tremoço']];
function pgRotulo(m){
 if(m.empty)return`<div class="pg"><h1>Rótulo e alérgenos</h1><p class="lead">Monte uma receita primeiro.</p></div>`;
 const n=m.nut,pp=+S.proc.labelPortion||60,k=pp/100;
 const VD={kcal:2000,carb:300,add:50,prot:50,fat:65,sat:20,fib:25,na:2000};
 const vd=(v,key)=>VD[key]?f0(v*k/VD[key]*100):'**';
 const rows=[['Valor energético (kcal)',n.kcal,'kcal',0],['Carboidratos totais (g)',n.carb,'carb',1],['Açúcares totais (g)',n.sug,null,1,1],['Açúcares adicionados (g)',n.add,'add',1,1],...(n.pol>.05?[['Polióis (g)',n.pol,null,1,1]]:[]),['Proteínas (g)',n.prot,'prot',1],['Gorduras totais (g)',n.fat,'fat',1],['Gorduras saturadas (g)',n.sat,'sat',1,1],['Gorduras trans (g)',n.trans,null,1,1],['Fibras alimentares (g)',n.fib,'fib',1],['Sódio (mg)',n.na,'na',0]];
 const lupa=[n.add>=15&&'AÇÚCAR ADICIONADO',n.sat>=6&&'GORDURA SATURADA',n.na>=600&&'SÓDIO'].filter(Boolean);
 const ord=[...m.A.lines].sort((a,b)=>b.g-a.g);const seen=new Set();const labs=ord.map(l=>l.ing.lab||l.ing.n.toLowerCase()).filter(x=>!seen.has(x)&&seen.add(x));
 const brl=[];m.A.al.forEach(a=>BRAL[a]&&brl.push(BRAL[a]));m.A.br.forEach(b=>brl.push(b));
 const glu=m.A.al.has('gluten');
 return`<div class="pg"><div><h1>Rótulo e alérgenos</h1><p class="lead">Tabela no formato da RDC 429/2020 e IN 75/2020 (ANVISA), declarações da RDC 26/2015 e RDC 136/2017, e os 14 alérgenos do Regulamento UE 1169/2011. Valores calculados pela composição média dos ingredientes; para o rótulo final, valide com laudo de laboratório.</p></div>
 <div class="g2">
  <div class="card" style="background:var(--surf)"><h2>Tabela nutricional</h2>
   <div class="row" style="margin-bottom:10px"><label class="field" style="width:150px"><span class="lbl">Porção (g)</span><input type="number" id="p-labelPortion" data-i="proc" data-k="labelPortion" value="${pp}" min="10" step="5"></label><span class="note">Gelados comestíveis: porção de referência 60 g.</span></div>
   <div class="nut"><table><caption>INFORMAÇÃO NUTRICIONAL</caption><thead><tr><th>Porções por embalagem: —<br>Porção: ${fT(pp)} g</th><th>100 g</th><th>${fT(pp)} g</th><th>%VD*</th></tr></thead><tbody>
    ${rows.map(([l,v,key,d,ind])=>`<tr><td class="${ind?'in':''}">${l}</td><td>${d?f1(v):f0(v)}</td><td>${d?f1(v*k):f0(v*k)}</td><td>${key?vd(v,key):''}</td></tr>`).join('')}
   </tbody></table><div style="font-size:10px;margin-top:5px">*Percentual de valores diários fornecidos pela porção.</div></div>
   <p class="note">Energia também em ${f0(n.kj)} kJ/100 g para rótulo europeu.</p></div>
  <div style="display:flex;flex-direction:column;gap:14px">
   <div class="card"><h2>Rotulagem frontal (lupa)</h2>${lupa.length?`<div class="lupa"><div class="h">🔍 ALTO EM</div>${lupa.map(x=>`<div class="i">${x}</div>`).join('')}</div><p class="note">Limites para sólidos por 100 g: açúcar adicionado ≥ 15 g · gordura saturada ≥ 6 g · sódio ≥ 600 mg. Hoje: ${f1(n.add)} g · ${f1(n.sat)} g · ${f0(n.na)} mg.</p>`:`<p class="c-ok" style="margin:0">Dispensa lupa: açúcar adicionado ${f1(n.add)} g, gordura saturada ${f1(n.sat)} g e sódio ${f0(n.na)} mg por 100 g estão abaixo dos limites.</p>`}</div>
   <div class="card"><h2>Declarações obrigatórias (Brasil)</h2>
    <p style="margin:0 0 8px;font-weight:600">${brl.length?'ALÉRGICOS: CONTÉM '+[...new Set(brl)].join(', ')+'.':'Sem alérgenos da lista da RDC 26/2015.'}</p>
    ${n.lacMg>100?'<p style="margin:0 0 8px;font-weight:600">CONTÉM LACTOSE.</p>':''}
    <p style="margin:0 0 8px;font-weight:600">${glu?'CONTÉM GLÚTEN.':'NÃO CONTÉM GLÚTEN.'}</p>
    ${n.pol>2&&(m.A.sor+m.A.xyl+m.A.mlt)>0?'<p style="margin:0;font-weight:600">Este produto pode ter efeito laxativo.</p>':''}
    ${m.A.al.has('sesamo')||m.A.al.has('sulfito')?'<p class="note">Gergelim e sulfitos não estão na lista brasileira, mas são obrigatórios na UE; declare por boa prática.</p>':''}</div>
  </div></div>
 <div class="card"><h2>Lista de ingredientes</h2><p style="margin:0;max-width:90ch">Ingredientes: ${esc(labs.join(', '))}.</p><p class="note">Em ordem decrescente de peso na receita. Revise os nomes comerciais dos aditivos conforme o fornecedor.</p></div>
 <div class="card"><h2>14 alérgenos UE (Reg. 1169/2011)</h2><div class="al">${EU14.map(([c,l])=>`<div class="${m.A.al.has(c)?'on':''}">${l}</div>`).join('')}</div></div>
 </div>`;}

/* ---------- CUSTOS ---------- */
function pgCustos(m){
 const p=S.proc,mk=+p.markup||3.5,por=+p.portion||90;
 const rows=m.A.lines.map(l=>{const i=l.ing;const c=S.costs[i.id];return`<tr><td>${esc(i.n)}</td><td class="r mono">${f0(l.g)} g</td><td class="r"><input type="number" id="c-${i.id}" data-i="cost" data-id="${i.id}" value="${c!=null&&c!==''?esc(c):''}" placeholder="${i.cost}" step=".1" min="0" aria-label="Custo por kg de ${esc(i.n)}"></td><td class="r mono">R$ ${f2(l.g/1000*l.unit)}</td><td class="r mono muted">${m.A.cost?f0(l.g/1000*l.unit/m.A.cost*100):0}%</td></tr>`;}).join('');
 return`<div class="pg"><div><h1>Custos</h1><p class="lead">Preços em R$/kg. Deixe em branco para usar a referência do banco. O custo por litro e por porção já considera o overrun previsto no Processo.</p></div>
 <div class="g3">
  <div class="card"><h2>Mistura</h2><div class="big c-ice">R$ ${f2(m.costKg)}</div><p class="t2" style="margin:4px 0 0">por kg · lote atual R$ ${f2(m.A.cost)}</p></div>
  <div class="card"><h2>Gelato pronto</h2><div class="big">R$ ${f2(m.costL)}</div><p class="t2" style="margin:4px 0 0">por litro (overrun ${f0(m.ov)}%) · R$ ${f2(m.costPortion)} por porção de ${por} g</p></div>
  <div class="card"><h2>Preço sugerido</h2><div class="big c-ok">R$ ${f2(m.costKg*mk)}</div><p class="t2" style="margin:4px 0 0">por kg · R$ ${f2(m.costPortion*mk)} por porção · margem bruta ${f0((1-1/mk)*100)}%</p></div>
 </div>
 <div class="card"><div class="form" style="margin-bottom:12px">${fieldNum('p-markup','Multiplicador (markup)',mk,.1,'Gelaterias artesanais: 3 a 4,5')}${fieldNum('p-portion','Porção vendida (g)',por,5,'Uma bola ≈ 60–90 g')}</div>
  <div class="tw"><table class="tbl"><thead><tr><th>Ingrediente</th><th class="r">Lote</th><th class="r">R$/kg</th>${$cost('<th class="r">Custo</th>')}<th class="r">Peso no custo</th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="muted">Receita vazia.</td></tr>'}</tbody></table></div>
  <p class="note">Custo apenas de matéria-prima (CMV). Embalagem, energia, perdas e mão de obra devem caber no multiplicador.</p></div></div>`;}
/* ---------- PRODUÇÃO ---------- */
function fichaText(m,target){
 const f=m.tot?target/m.tot:1,p=m.pr;
 const L=[`IL FREDOLIN — ${S.name}`,`${m.P.n} · lote ${f0(target)} g · vitrine ${f1(S.vit)} °C`,'',...(S.recipe||[]).map(r=>`[ ] ${f1(r.g*f).padStart(8)} g  ${ING_BY[r.id]?ING_BY[r.id].n:r.id}`),'',
  `Pasteurizar ${fT(p.pastT)} °C / ${fT(p.pastHold)} ${p.pastHoldU} → 4 °C em até ${fT(p.coolMin)} min`,`Maturar ${fT(p.matH)} h a ${fT(p.matT)} °C`,`Mantecar até ${fT(p.drawT)} °C (${fT(p.drawMin)} min) → abater a ${fT(p.blastT)} °C`,`Armazenar a ${fT(p.storeT)} °C · servir a ${f1(m.serveT)} °C`,'',
  `Sólidos ${f1(m.sol)}% · gordura ${f1(m.fat)}% · MSNF ${f1(m.msnf)}% · POD ${f1(m.pod)}% · PAC ${f0(m.pacKg)}/kg · HF ${f0(m.hfKg)}/kg · overrun ${f0(m.ov)}%`];
 return L.join('\n');}
function pgProducao(m){
 const target=+U.prodG>0?+U.prodG:Math.round(m.tot),f=m.tot?target/m.tot:1,p=m.pr;const eqs=m.empty?null:equipSteps(m);
 const powders=(S.recipe||[]).filter(r=>{const i=ING_BY[r.id];return i&&(i.c.w||0)<15;}).map(r=>ING_BY[r.id].n);
 const steps=[
  `Pese os líquidos no pasteurizador e comece a aquecer. Misture a seco os pós (${esc(powders.slice(0,5).join(', ')||'açúcares e estabilizante')}) para o estabilizante não empelotar; adicione em chuva a 40 °C.`,
  m.A.eggFresh+m.A.eggPast>0?'Adicione as gemas a 40–45 °C, mexendo sem parar.':null,
  `Leve a ${fT(p.pastT)} °C e mantenha ${fT(p.pastHold)} ${p.pastHoldU==='min'?'min':'s'}${m.A.cocoaG>0?'; o chocolate entra a ~70 °C':''}.`,
  `Resfrie até 4 °C em no máximo ${fT(p.coolMin)} min.`,
  `Mature ${fT(p.matH)} h a ${fT(p.matT)} °C com agitação lenta.`,
  m.A.acidFruitG>0||m.A.fruitG>0?`Adicione a fruta${m.A.alc>0?' e o álcool':''} à mistura fria e passe o mixer.`:(m.A.alc>0?'Adicione o álcool à mistura fria.':null),
  `Mantecar até ${fT(p.drawT)} °C (cerca de ${fT(p.drawMin)} min).`,
  `Abata imediatamente a ${fT(p.blastT)} °C até −18 °C no núcleo (até ${fT(p.hardMin)} min).`,
  `Armazene a ${fT(p.storeT)} °C e sirva com a vitrine a ${f1(m.serveT)} °C (configurada: ${f1(S.vit)} °C).`].filter(Boolean);
 return`<div class="pg"><div><h1>Ficha de produção</h1><p class="lead">Pesagem com conferência item a item e o roteiro de processo deste lote.</p></div>
 <div class="card"><div class="row"><label class="field" style="width:170px"><span class="lbl">Peso do lote (g)</span><input type="number" id="prodG" data-i="prodG" value="${U.prodG||Math.round(m.tot)}" min="0" step="100"></label><span class="sp"></span><button class="btn sm pri" data-a="flowStart"${m.empty?' disabled':''}>Iniciar calda (cronômetro)</button><button class="btn sm" data-a="unchk">Limpar marcações</button><button class="btn pri" data-a="copy">Copiar ficha</button></div>
 ${U.copy?`<textarea id="copyArea" rows="10" style="margin-top:10px;font-family:var(--fm);font-size:12px" readonly>${esc(U.copy)}</textarea><p class="note">Selecione e copie o texto acima.</p>`:''}</div>
 <div class="card"><h2>Pesagem</h2><div style="display:flex;flex-direction:column;gap:8px">${(S.recipe||[]).map(r=>{const i=ING_BY[r.id];if(!i)return'';const on=!!U.checks[r.id];return`<button class="check" data-a="chk" data-v="${r.id}" aria-pressed="${on}"><span class="box">${on?'✓':''}</span><span><b>${esc(i.n)}</b><br><span class="muted" style="font-size:12px">${esc(i.cat)}</span></span><span class="w">${(r.g*f)<10?f1(r.g*f):f0(r.g*f)} g</span></button>`;}).join('')}</div></div>
 <div class="card"><h2>${eqs?'Roteiro · '+esc(EQUIP[S.proc.equip].n):'Processo'}</h2><ol class="steps">${eqs?eqs.map(([t,x])=>`<li><span><b style="color:var(--t1)">${t}.</b> ${x}</span></li>`).join(''):steps.map(s=>`<li><span>${s}</span></li>`).join('')}</ol></div></div>`;}


/* ---------- LAB DE P&D (dentro do Creator) ---------- */
function labGerar(){
 const g=S.lab.gen,P=PROF[g.tipo],r=U.gen;
 const fx=(g.fixed||[]);
 return`<div class="card"><h2>1 · Base e sabor</h2><div class="form">
  <label class="field"><span class="lbl">Tipo</span><select id="gen-tipo" data-c="gen" data-k="tipo">${Object.entries(PROF).map(([k,p])=>`<option value="${k}"${k===g.tipo?' selected':''}>${p.n}</option>`).join('')}</select></label>
  <label class="field"><span class="lbl">Lote (g)</span><input type="number" id="gen-batch" data-i="gen" data-k="batch" value="${g.batch}" step="50" min="200"><span class="hint">Maqp1: ~1,1 kg por ciclo (até 2 kg)</span></label>
  <div class="field"><span class="lbl">Vitrine</span><span class="mono c-ice" style="padding:7px 0">${f1(S.vit)} °C (no topo)</span></div>
 </div>
 <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">${fx.map((f,k)=>`<div class="row"><select id="gen-fx${k}" data-c="genfx" data-k="${k}" style="flex:1;min-width:180px" aria-label="Ingrediente de sabor ${k+1}">${ingOpts(f.id)}</select><input type="number" id="gen-fg${k}" data-i="genfg" data-k="${k}" value="${f.g}" step="5" min="0" style="width:100px" aria-label="Gramas"><span class="muted">g</span><button class="btn del" data-a="genRmFx" data-v="${k}" aria-label="Remover">✕</button></div>`).join('')}
  ${fx.length<4?`<div><button class="btn sm" data-a="genAddFx">+ Ingrediente fixo (sabor, fruta, pasta, inclusão)</button></div>`:''}</div></div>
 <div class="card"><h2>2 · Metas</h2><div class="form">
  ${[['fat','Gordura (%)',P.fat],['msnf','MSNF (%)',P.msnf],['pod','Doçura POD (%)',P.pod],['sol','Sólidos (%)',P.sol]].map(([k,n,rg])=>`<label class="field"><span class="lbl">${n}</span><input type="number" id="gen-${k}" data-i="gen" data-k="${k}" value="${g[k]}" step=".5"><span class="hint">Faixa ${rg[0]}–${rg[1]}</span></label>`).join('')}
  <label class="field"><span class="lbl">Estabilizante</span><select id="gen-stab" data-c="gen" data-k="stabId">${ingOpts(g.stabId,stabFilter)}</select></label>
  <label class="field"><span class="lbl">Dose (g/kg)</span><input type="number" id="gen-dose" data-i="gen" data-k="stabGkg" value="${g.stabGkg}" step=".5" min="0"></label>
 </div><p class="note">Congelamento é sempre meta obrigatória (${fT(P.fz[0])}–${fT(P.fz[1])}% a ${f1(S.vit)} °C). ${genSolTgt(g.tipo)?'Os sólidos entram como meta.':'Sólidos resultam das demais metas.'} Se alguma meta for impossível com os ingredientes fixos, o motor a libera e avisa.</p>
 <div class="row"><button class="btn pri" data-a="genRun">Gerar receita</button><button class="btn sm" data-a="genDefaults">Metas padrão do tipo</button></div></div>
 ${r?(r.ok?`<div class="card"><div class="row"><h2 style="margin:0">Receita gerada</h2><span class="sp"></span>${(()=>{const st=stReal(stOf(r.recipe,g.tipo)),gs=score(st,r.m,diagnose(st,r.m)).total;return`<span class="chip ${scoreCls(gs)}">Índice ${gs}</span>`;})()}</div>
  ${r.dropped.length?`<p class="c-warn" style="margin:8px 0">Com esses ingredientes fixos nem todas as metas cabem juntas; o motor priorizou congelamento, doçura e gordura e chegou o mais perto possível: ${r.dropped.map(k=>({pod:'doçura',fat:'gordura',msnf:'MSNF',sol:'sólidos'})[k]+' '+f1(r.miss[k])+'% ('+(k==='sol'&&!genSolTgt(g.tipo)?'faixa '+fRg(P.sol):'meta '+f1(g[k]))+'%)').join(' · ')}.</p>`:''}
  <div class="tw"><table class="tbl"><thead><tr><th>Ingrediente</th><th class="r">Gramas</th><th class="r">%</th></tr></thead><tbody>${r.recipe.map(x=>`<tr><td>${esc(ING_BY[x.id].n)}</td><td class="r mono">${x.g<10?f1(x.g):f0(x.g)} g</td><td class="r mono t2">${f1(x.g/r.m.tot*100)}%</td></tr>`).join('')}</tbody></table></div>
  <div class="row note" style="gap:16px;margin:10px 0">${[['Congelada',f0(r.m.fzVit)+'%'],['POD',f1(r.m.pod)+'%'],['Gordura',f1(r.m.fat)+'%'],['MSNF',f1(r.m.msnf)+'%'],['Sólidos',f1(r.m.sol)+'%'],['Lactose/água',f1(r.m.lacW)+'%'],['Serviço',f1(r.m.serveT)+' °C']].map(([a,b])=>`<span>${a} <b class="mono" style="color:var(--t1)">${b}</b></span>`).join('')}</div>
  <div class="row"><button class="btn okb" data-a="genToBench">Levar para a bancada</button><button class="btn sm" data-a="genToVar">Adicionar às variações</button></div></div>`
  :`<div class="card"><p class="c-warn" style="margin:0">${esc(r.msg)}</p></div>`):''}
 ${labFront(g)}`;}
/* etapa 3 · design inverso: alternativas que trocam um critério por outro (fronteira de Pareto) */
/* no celular, até 8 opções: as melhores de cada critério e as demais espaçadas ao longo do 1º critério */
const frontShown=F=>{const n=F.front.length,all=[...Array(n).keys()];if(U.genFrAll||n<=8)return all;
 const pick=new Set(all.filter(i=>F.front[i].best.length));for(let j=0;pick.size<8&&j<8;j++)pick.add(Math.round(j*(n-1)/7));
 return[...pick].sort((a,b)=>a-b).slice(0,Math.max(8,pick.size));};
const frontCrits=g=>(g.crit||[]).filter(k=>FRONT_CRIT[k]&&(!FRONT_CRIT[k].maestro||can.cost()));
function labFront(g){const F=U.genFr,cr=frontCrits(g),fmt=(k,v)=>{const c=FRONT_CRIT[k];return(c.d===2?f2(v):c.d===1?f1(v):f0(v));};
 const res=F&&F.busy?`<p class="muted" style="margin:10px 0 0">Calculando as alternativas…</p>`:F&&!F.ok?`<p class="c-warn" style="margin:10px 0 0">${esc(F.msg)}</p>`:F&&F.ok?`
  <p class="note" style="margin:10px 0">${F.tried} combinações de metas testadas dentro da faixa de ${esc(PROF[g.tipo].n)}; ${F.feasible} viraram receitas válidas (congelamento e faixas da família); ${F.front.length===1?'uma só não é superada':F.front.length+' não são superadas'} em todos os critérios escolhidos.${F.front.length===1?' Com estes ingredientes e critérios não há troca a fazer: as metas não têm folga ou uma receita ganha em tudo.':' Nenhuma é a melhor: cada uma ganha num critério e perde em outro. ★ marca a melhor em cada critério.'}</p>
  <div id="front-tbl" style="display:flex;flex-direction:column;gap:8px">${frontShown(F).map(i=>{const o=F.front[i];return`<div class="front-opt" style="border:1px solid var(--line,rgba(255,255,255,.12));border-radius:10px;padding:10px 12px">
   <div class="row" style="gap:6px;align-items:baseline"><b>Opção ${i+1}</b>${o.best.length?`<span class="c-gold">★ ${o.best.map(k=>FRONT_CRIT[k].n.toLowerCase()).join(' · ')}</span>`:''}<span class="sp"></span><button class="btn sm" data-a="frPick" data-v="${i}">Usar esta</button></div>
   <div class="row note" style="gap:14px;margin:6px 0 0">${F.crits.map(k=>`<span>${FRONT_CRIT[k].n.replace(/^(Menor|Menos|Mais|Derrete mais) /,'').replace(/^devagar$/,'derretido')} <b class="mono" style="color:var(--t1)">${fmt(k,o.v[k])}</b> <span class="muted">${FRONT_CRIT[k].u}</span></span>`).join('')}</div>
   <div class="muted" style="font-size:.85em;margin-top:4px">POD ${f1(o.m.pod)}% · gordura ${f1(o.m.fat)}% · MSNF ${f1(o.m.msnf)}% · sólidos ${f1(o.m.sol)}%</div></div>`;}).join('')}</div>
  ${F.front.length>frontShown(F).length||U.genFrAll?`<div class="row" style="margin-top:8px"><button class="btn sm" data-a="frAll">${U.genFrAll?'Mostrar só as mais diferentes':'Mostrar todas as '+F.front.length}</button></div>`:''}
  ${F.crits.some(k=>FRONT_CRIT[k].nat==='H')?`<p class="note" style="margin:8px 0 0">Derretimento e tamanho de cristal são estimativas heurísticas (corrigidas pelos lotes medidos); custo, açúcar, calorias, sólidos e gordura são contas de composição.</p>`:''}`:'';
 return`<div class="card" id="front-card"><h2>3 · Alternativas e compromissos</h2>
  <p class="note" style="margin:0 0 10px">Em vez de uma receita só, o motor varia as metas dentro da faixa do tipo, mantém o congelamento e os ingredientes fixos, e mostra só as receitas que nenhuma outra supera em todos os critérios marcados.</p>
  <div class="chips" role="group" aria-label="Critérios">${Object.entries(FRONT_CRIT).filter(([k,c])=>!c.maestro||can.cost()).map(([k,c])=>`<button data-a="frCrit" data-v="${k}" aria-pressed="${cr.includes(k)}">${c.n}</button>`).join('')}</div>
  <div class="row" style="margin-top:10px"><button class="btn pri" data-a="frRun"${cr.length<2?' disabled':''}>Mostrar alternativas</button><span class="muted">${cr.length<2?'Escolha pelo menos dois critérios':cr.length+' critérios'}</span></div>${res}</div>`;}
function labComparar(m){
 const V=S.lab.variants;const all=[{name:'Bancada · '+(S.name||'atual'),recipe:S.recipe,bench:1},...V];
 const ids=[...new Set(all.flatMap(v=>v.recipe.map(r=>r.id)))];
 const ms=all.map(v=>{const st=stReal(stOf(v.recipe));const mm=analyze(st);const F=diagnose(st,mm);return{mm,sc:score(st,mm,F).total};});
 const rows=[['Índice',x=>x.sc,0,1],['Congelada na vitrine (%)',x=>x.mm.fzVit,0,0,PROF[S.tipo].fz],['Serviço ideal (°C)',x=>x.mm.serveT,1],['Doçura POD (%)',x=>x.mm.pod,1,0,x0=>null],['Sólidos (%)',x=>x.mm.sol,1],['Gordura (%)',x=>x.mm.fat,1],['MSNF (%)',x=>x.mm.msnf,1],['Lactose/água (%)',x=>x.mm.lacW,1],['PAC efetivo (/kg)',x=>x.mm.pacEffKg,0],['Overrun (%)',x=>x.mm.ov,0],['Cristalização',x=>x.mm.ci,0,1],['Derretimento',x=>x.mm.melt,0,1],...(can.cost()?[['Custo (R$/kg)',x=>x.mm.costKg,2]]:[])];
 return`<div class="card"><div class="row"><h2 style="margin:0">Variações</h2><span class="sp"></span>${V.length<4?`<button class="btn sm pri" data-a="varAdd">+ Copiar a bancada como variação</button>`:''}</div>
  <p class="note">Edite as gramas direto na tabela. A primeira coluna é a receita da bancada (somente leitura). Até 4 variações.</p>
  ${V.length?`<div class="tw"><table class="tbl"><thead><tr><th>Ingrediente</th>${all.map((v,k)=>`<th class="r" style="min-width:110px">${k?`<input type="text" id="vn${k-1}" data-i="varName" data-k="${k-1}" value="${esc(v.name)}" style="font-weight:600;color:${VCOL[k]}" aria-label="Nome da variação">`:`<span style="color:${VCOL[0]}">Bancada</span>`}</th>`).join('')}</tr></thead><tbody>
   ${ids.map(id=>`<tr><td>${esc(ING_BY[id]?ING_BY[id].n:id)}</td>${all.map((v,k)=>{const r=v.recipe.find(x=>x.id===id);const g=r?r.g:0;return`<td class="r">${k?`<input type="number" id="vg${k-1}-${id}" data-i="varG" data-k="${k-1}" data-id="${id}" value="${g}" min="0" step="1" aria-label="Gramas">`:`<span class="mono">${g?f1(g):'—'}</span>`}</td>`;}).join('')}</tr>`).join('')}
   <tr><td><select id="varNewIng" data-c="varNew" aria-label="Adicionar ingrediente às variações"><option value="">+ ingrediente…</option>${ingOpts('')}</select></td>${all.map(()=>'<td></td>').join('')}</tr>
   ${rows.map(([n,fn,d,hiBest])=>{const vals=ms.map(fn);const best=hiBest?Math.max(...vals):null;return`<tr><td class="t2">${n}</td>${vals.map(v=>`<td class="r mono${hiBest&&v===best?' c-ok':''}">${d===2?f2(v):d===1?f1(v):f0(v)}</td>`).join('')}</tr>`;}).join('')}
   <tr><td></td>${all.map((v,k)=>`<td class="r">${k?`<div class="row" style="justify-content:flex-end;gap:4px"><button class="btn sm okb" data-a="varToBench" data-v="${k-1}">Usar</button><button class="btn del" data-a="varRm" data-v="${k-1}" aria-label="Remover variação">✕</button></div>`:''}</td>`).join('')}</tr>
  </tbody></table></div>`:'<p class="muted" style="margin:0">Nenhuma variação. Copie a bancada para começar, gere uma receita na aba "Criar por alvo" ou use "Comparar" em uma receita da Biblioteca.</p>'}</div>
 ${V.length?`<div class="card"><h2>Curvas de congelamento</h2>${miniCurves(all.map((v,k)=>({name:k?v.name:'Bancada',m:ms[k].mm,col:VCOL[k]})))}</div>`:''}`;}
function labSens(m){
 const s=S.lab.sens;const R=U.sens;const ids=(S.recipe||[]).map(r=>r.id);
 if(!ids.includes(s.id))s.id=ids.find(id=>/sacarose|dextrose/.test(id))||ids[0]||'';
 let chartH='';if(R&&R.length){const W=640,H=220,L=40,Rr=40,Tp=12,B=30;const xs=i=>L+i/(R.length-1)*(W-L-Rr),y1=v=>Tp+(100-v)/100*(H-Tp-B);
  let g='';for(let p=0;p<=100;p+=25)g+=`<line x1="${L}" x2="${W-Rr}" y1="${y1(p)}" y2="${y1(p)}" stroke="var(--line)"/><text x="${L-6}" y="${y1(p)+4}" text-anchor="end" fill="var(--t3)" font-size="10">${p}</text>`;
  R.forEach((x,i)=>{if(i%2===0)g+=`<text x="${xs(i)}" y="${H-B+16}" text-anchor="middle" fill="var(--t3)" font-size="10">${x.k>0?'+':''}${f0(x.k)}%</text>`;});
  const P=PROF[S.tipo];g+=`<rect x="${L}" y="${y1(P.fz[1])}" width="${W-L-Rr}" height="${y1(P.fz[0])-y1(P.fz[1])}" fill="rgba(110,231,183,.1)"/>`;
  const line=(fn,col)=>`<path d="${R.map((x,i)=>(i?'L':'M')+xs(i).toFixed(1)+','+y1(fn(x)).toFixed(1)).join('')}" fill="none" stroke="${col}" stroke-width="2.2"/>`;
  g+=line(x=>x.fz,'var(--ice)')+line(x=>x.sc,'var(--ok)');
  chartH=`<div class="tw"><svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:460px;height:auto" role="img" aria-label="Efeito da variação do ingrediente">${g}</svg></div><div class="row note" style="gap:14px"><span><span class="c-ice">━</span> % de água congelada</span><span><span class="c-ok">━</span> índice de qualidade</span><span><span class="c-ok">■</span> faixa de congelamento</span></div>`;}
 const best=R&&R.length?R.reduce((a,b)=>b.sc>a.sc||(b.sc===a.sc&&Math.abs(b.k)<Math.abs(a.k))?b:a):null;
 return`<div class="card"><h2>Simulação "e se"</h2><p class="note" style="margin-top:0">Varia um ingrediente da bancada em passos e recalcula tudo, mantendo o resto fixo.</p>
 <div class="form"><label class="field"><span class="lbl">Ingrediente</span><select id="sens-id" data-c="sens" data-k="id">${ids.map(id=>`<option value="${id}"${id===s.id?' selected':''}>${esc(ING_BY[id]?ING_BY[id].n:id)}</option>`).join('')}</select></label>
  <label class="field"><span class="lbl">De (%)</span><input type="number" id="sens-lo" data-i="sens" data-k="lo" value="${s.lo}" step="10"></label>
  <label class="field"><span class="lbl">Até (%)</span><input type="number" id="sens-hi" data-i="sens" data-k="hi" value="${s.hi}" step="10"></label></div>
 <div class="row" style="margin-top:12px"><button class="btn pri" data-a="sensRun"${ids.length?'':' disabled'}>Simular</button></div></div>
 ${R&&R.length?`<div class="card">${chartH}<div class="tw" style="margin-top:10px"><table class="tbl"><thead><tr><th class="r">Variação</th><th class="r">Gramas</th><th class="r">Congelada</th><th class="r">Serviço</th><th class="r">POD</th><th class="r">Sólidos</th><th class="r">Gordura</th><th class="r">Índice</th></tr></thead><tbody>
  ${R.map(x=>`<tr${x===best?' style="background:var(--ok-a)"':''}><td class="r mono">${x.k>0?'+':''}${f0(x.k)}%</td><td class="r mono">${f1(x.g)}</td><td class="r mono ${stCls(x.fz,PROF[S.tipo].fz)}">${f0(x.fz)}%</td><td class="r mono">${f1(x.serve)}°</td><td class="r mono">${f1(x.pod)}</td><td class="r mono">${f1(x.sol)}</td><td class="r mono">${f1(x.fat)}</td><td class="r mono">${x.sc}</td></tr>`).join('')}</tbody></table></div>
  ${best?`<div class="row" style="margin-top:10px"><span class="t2">Melhor índice: ${best.sc} com ${f1(best.g)} g (${best.k>0?'+':''}${f0(best.k)}%).</span><span class="sp"></span><button class="btn okb" data-a="sensApply" data-v="${best.g}">Aplicar ${f1(best.g)} g</button></div>`:''}</div>`:''}`;}

/* ---------- BIBLIOTECA ---------- */
const LIB_PAGE=30;
const listPt=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' e '+a[a.length-1];
function pgBiblioteca(){
 const tab=S.libTab;const tabs=[['ilf','Il Fredolin · em execução ('+EXEC.length+')'],['mestres','Receitas dos mestres ('+MASTERS.length+')'],['minhas','Minhas receitas ('+LIB.length+')'],['bases','Bases Il Fredolin ('+PRESETS.length+')']];
 let body;
 if(tab==='ilf'){body=execList();}
 else if(tab==='mestres'){const grp=p=>p.g||p.a;const authors=['Todos',...new Set(MASTERS.map(grp))];const q=norm(U.libQ||'');
  const vf=(VIT_F[U.libVitF||0]||VIT_F[0])[1],tp=U.libTipo||'';const qs=q.split(/\s+/).filter(Boolean);
  const LA=MASTERS.map((p,k)=>({p,k})).filter(({p})=>(S.libAuthor==='Todos'||grp(p)===S.libAuthor)&&(!tp||p.tipo===tp)&&vf(+p.vit)&&(!qs.length||qs.every(w=>mText(p).includes(w))));
  const idx=MIDX.key===idxKey()?MIDX.list:null;
  const libN=U.libN||LIB_PAGE;const L=LA.slice(0,libN);
  body=`<div class="card"><div class="row"><div class="chips">${authors.map(a=>`<button data-a="libAuthor" data-v="${a}" aria-pressed="${S.libAuthor===a}">${a}</button>`).join('')}</div><span class="sp"></span><input type="text" id="libQ" data-i="libQ" value="${esc(U.libQ||'')}" placeholder="Nome, autor ou ingrediente" style="max-width:240px" aria-label="Buscar receita por nome, autor ou ingrediente"></div>
   <div class="row" style="margin-top:10px"><select id="libTipo" data-c="libTipoSel" style="max-width:200px" aria-label="Tipo"><option value="">Todos os tipos</option>${Object.entries(PROF).map(([k,v])=>`<option value="${k}"${tp===k?' selected':''}>${esc(v.n)}</option>`).join('')}</select>
    <div class="chips">${VIT_F.map(([n],i)=>`<button data-a="libVitF" data-v="${i}" aria-pressed="${(U.libVitF||0)===i}">${n}</button>`).join('')}</div><span class="sp"></span><button class="btn sm" data-a="simOpen" data-v="b">Parecidas com a bancada</button></div>
   <p class="note">Ingredientes e quantidades transcritos dos livros e mapeados para o banco; inclusões e decorações ficam fora do balanceamento. A busca procura também nos ingredientes (ex.: "pistache gema"). Cada receita foi pensada para a vitrine, máquina e método do autor: o índice abaixo mostra como ela se comporta nas suas condições (vitrine indicada), e "serviço ideal" diz a temperatura em que ela entrega a textura certa.</p></div>
   ${compareCard()}${similarCard(U.simOf?masterIndex():idx)}
   <p class="note" style="margin:0">${LA.length} receita(s)${qs.length||tp||U.libVitF?' com esses filtros':''}.</p>
   <div class="g2">${L.map(({p,k})=>{const x=idx&&idx[k];let mm,sc;if(x){mm={sol:x.sol,fat:x.fat,pod:x.pod,pacKg:x.pac,serveT:x.serveT};sc=x.sc;}else{const st={...stOf(p.recipe.map(([id,g])=>({id,g})),p.tipo,p.vit),proc:vitProc(S.proc)};mm=analyze(st);sc=score(st,mm,diagnose(st,mm)).total;}
    return`<div class="card flat"><div class="row"><div style="min-width:0;flex:1"><h3>${esc(p.name)}</h3><div class="muted" style="font-size:12px">${esc(p.a)} · ${esc(p.src)}</div></div><span class="chip ${scoreCls(sc)}" title="Índice a ${fT(p.vit)} °C">${sc}</span></div>
     <p class="note" style="margin:8px 0">${PROF[p.tipo].n} · sólidos ${f1(mm.sol)}% · gordura ${f1(mm.fat)}% · POD ${f1(mm.pod)}% · PAC ${f0(mm.pacKg)}/kg · <span class="c-ok">serviço ideal ${f1(mm.serveT)} °C</span>${x&&x.home!=null&&S.proc.serveFrom==='pote'?` · <span class="${x.home<0||x.home>20?'c-warn':'c-ice'}">em casa: ${x.home<0?'mais de 40 min':'no ponto em '+f0(x.home)+' min'}</span>`:''} (vitrine ${fT(p.vit)} °C)</p>${p.note?`<p class="note" style="margin:0 0 8px">${esc(p.note)}</p>`:''}${p.how?`<details class="dcard" style="margin:0 0 8px"><summary class="t2" style="font-size:12.5px;cursor:pointer">Método do autor${p.proc?' · '+fT(p.proc.pastT)+' °C, maturação '+fT(p.proc.matH)+' h':''}</summary><p class="note" style="margin:6px 0 0">${esc(p.how)}</p></details>`:''}
     <div class="row"><button class="btn sm pri" data-a="master" data-v="${k}">Carregar</button><button class="btn sm" data-a="masterVar" data-v="${k}">Comparar no Lab</button><button class="btn sm" data-a="simOpen" data-v="m:${k}">Parecidas</button><button class="btn sm" data-a="cmpToggle" data-v="m:${k}" aria-pressed="${(U.cmp||[]).includes('m:'+k)}" title="Comparar lado a lado">⇄${(U.cmp||[]).includes('m:'+k)?' ✓':''}</button></div></div>`;}).join('')||'<p class="muted">Nenhuma receita encontrada.</p>'}</div>${LA.length>L.length?`<div class="row" style="justify-content:center;margin-top:12px"><button class="btn" data-a="libMore">Mostrar mais ${Math.min(LIB_PAGE,LA.length-L.length)} (de ${LA.length-L.length} restantes)</button></div>`:''}`;}
 else if(tab==='minhas'){body=`<div class="card"><div class="row" style="margin-bottom:10px"><h2 style="margin:0">Minhas receitas</h2><span class="sp"></span><input type="text" id="saveNote" data-i="saveNote" value="${esc(U.saveNote||'')}" placeholder="o que mudou nesta versão (opcional)" style="max-width:260px" aria-label="Nota da versão"><button class="btn okb" data-a="save">Salvar "${esc(S.name||'Receita')}"</button></div>${compareCard()}
  ${LIB.length?LIB.map(l=>`<div class="kv" style="align-items:center"><span><b style="color:var(--t1)">${esc(l.name)}</b><br><span class="muted" style="font-size:12px">${esc(PROF[l.st.tipo]?PROF[l.st.tipo].n:'')} · ${esc(l.date)}${l.note?' · '+esc(l.note):''}${l.conflict?' · <span class="c-warn">cópia de conflito: compare com a original e apague a que sobrar</span>':''}</span></span><span class="row" style="justify-content:flex-end">${U.del===String(l.id)?`<span class="c-crit" style="font-family:var(--fb);font-size:12.5px">Excluir?</span><button class="btn del" data-a="delYes" data-v="${l.id}">Excluir</button><button class="btn sm" data-a="delNo">Cancelar</button>`:`<button class="btn sm pri" data-a="load" data-v="${l.id}">Abrir</button><button class="btn sm" data-a="libVar" data-v="${l.id}">Comparar</button><button class="btn sm" data-a="cmpToggle" data-v="l:${l.id}" aria-pressed="${(U.cmp||[]).includes('l:'+l.id)}" title="Comparar lado a lado">⇄</button><button class="btn sm" data-a="histOpen" data-v="${l.id}">Versões (${(l.hist||[]).length})</button><button class="btn del" data-a="del" data-v="${l.id}" aria-label="Excluir ${esc(l.name)}">✕</button>`}</span></div>${U.hist===String(l.id)?histHTML(l):''}`).join(''):'<p class="muted" style="margin:0">Nenhuma receita salva ainda.</p>'}
  <p class="note">Salvas neste aparelho. Para levar a outro, use "Copiar ficha" na Ficha de produção.</p></div>`;}
 else{body=`<div class="card"><p class="note" style="margin-top:0">Formulações equilibradas pelo próprio motor para servir a −13 °C.</p><div class="g2">${PRESETS.map((p,k)=>{const st=stOf(p.recipe.map(([id,g])=>({id,g})),p.tipo,p.vit);const mm=analyze(st);const sc=score(st,mm,diagnose(st,mm)).total;return`<div class="card flat"><div class="row"><h3>${esc(p.name)}</h3><span class="sp"></span><span class="chip ${scoreCls(sc)}">${sc}</span></div><p class="note" style="margin:6px 0 10px">${PROF[p.tipo].n} · sólidos ${f1(mm.sol)}% · gordura ${f1(mm.fat)}% · POD ${f1(mm.pod)}% · serviço ${f1(mm.serveT)} °C</p><button class="btn sm pri" data-a="preset" data-v="${k}">Carregar</button></div>`;}).join('')}</div></div>`;}
 return`<div class="pg"><div><h1>Biblioteca</h1><p class="lead">${MASTERS.length?MASTERS.length+' receitas dos mestres ('+listPt([...new Set(MASTERS.map(x=>x.g||x.a))])+'), suas':'Suas'} receitas salvas e as bases Il Fredolin.</p></div>
  <div class="chips">${tabs.map(([k,n])=>`<button data-a="libTab" data-v="${k}" aria-pressed="${tab===k}">${n}</button>`).join('')}</div>${body}</div>`;}

/* ===================== LOTES E CALIBRAÇÃO ===================== */
function lotCode(){const d=new Date();const ymd=d.toISOString().slice(2,10).replace(/-/g,'');const n=LOTS.filter(l=>(l.code||'').includes(ymd)).length+1;return'IF-'+ymd+'-'+String(n).padStart(2,'0');}
function newLotFromBench(){return newLotFromSt(S);}
/* previsão guardada no lote, formatada; '—' se o lote não tiver (registro antigo ou importado) */
const lotPred=(L,k,fmt)=>L&&L.pred&&Number.isFinite(+L.pred[k])&&L.pred[k]!==null&&L.pred[k]!==''?fmt(+L.pred[k]):'—';
/* hora em que o pote entrou no freezer (evento 'hard' da Produção ao vivo), se houver */
function flowHardAt(L){const ev=L&&L.flow&&L.flow.ev;if(!Array.isArray(ev))return null;const e=ev.filter(x=>x&&x.s==='hard').pop();return e&&e.at?+e.at:null;}
/* v18.1 · mesmo lote a partir de qualquer estado de receita (a bancada ou uma corrida de experimento) */
function newLotFromSt(st,idSfx){const m=analyze(st);if(m.empty)return null;const id='L'+Date.now()+(idSfx!=null?'-'+idSfx:'');const P=st.proc||{};
 return{id,code:lotCode(),date:today(),name:st.name,tipo:st.tipo,vit:st.vit,recipe:JSON.parse(JSON.stringify(st.recipe)),proc:JSON.parse(JSON.stringify(P)),brix:JSON.parse(JSON.stringify(st.brix||{})),
  pred:{ov:m.ov,fzVit:m.fzVit,serveT:m.serveT,melt10:m.melt10,crystal:m.crystal,brix:m.brixMix,shelf:m.shelfVit,ph:m.ph,visc:m.visc},
  /* o plano fica guardado à parte; as medições começam vazias: um registro de APPCC só vale com o valor medido */
  plan:{pastT:P.pastT,pastHold:P.pastHold,coolMin:P.coolMin,matH:P.matH,matT:P.matT,drawT:P.drawT,drawMin:P.drawMin},
  meas:{texTemp:st.vit},sens:{},trace:{},notes:'',status:'aberto',by:ME.email||'',exec:st===S&&S.execId&&EXEC.some(e=>e.id===S.execId)?{id:S.execId,v:(EXEC.find(e=>e.id===S.execId)||{}).v}:null};}
/* pontos críticos de controle do lote; campo não medido nunca conta como "ok" */
function haccp(L){const me=L.meas||{};const out=[];const has=k=>me[k]!==''&&me[k]!=null&&isFinite(+me[k]);const fm=k=>has(k)?fT(+me[k]):'—';const pT=+me.pastT;
 const holdOk=L.proc&&L.proc.pastHoldU==='min'?+me.pastHold>=30:true;
 out.push(['Pasteurização',!has('pastT')?'warn':pT>=80||(pT>=65&&holdOk&&L.proc&&L.proc.pastHoldU==='min')?'ok':pT>=72?'warn':'crit',fm('pastT')+' °C']);
 out.push(['Resfriamento',!has('coolMin')?'warn':+me.coolMin<=120?'ok':'crit',fm('coolMin')+' min até 4 °C']);
 out.push(['Maturação',!has('matT')||!has('matH')?'warn':+me.matT<=4.5&&+me.matH<=72?'ok':+me.matT<=6?'warn':'crit',fm('matH')+' h a '+fm('matT')+' °C']);
 const eggFresh=(L.recipe||[]).some(r=>ING_BY[r.id]&&ING_BY[r.id].egg==='fresh');if(eggFresh)out.push(['Ovo cru',has('pastT')&&pT>=82?'ok':'crit','exige ≥ 82 °C']);
 out.push(['Rastreabilidade',(L.recipe||[]).every(r=>(L.trace||{})[r.id])?'ok':'warn',Object.keys(L.trace||{}).filter(k=>L.trace[k]).length+'/'+(L.recipe||[]).length+' lotes']);
 return out;}
function pgLotes(m){
 const open=U.lotOpen&&LOTS.find(l=>l.id===U.lotOpen);
 const res=CAL.res||[];const ovPts=res.filter(r=>r.ov);
 let scat='';if(ovPts.length){const W=300,H=200,L=34,B=26,T=10,R=10;const lo=Math.min(...ovPts.flatMap(r=>r.ov))-5,hi=Math.max(...ovPts.flatMap(r=>r.ov))+5;const sx=v=>L+(v-lo)/(hi-lo)*(W-L-R),sy=v=>T+(1-(v-lo)/(hi-lo))*(H-T-B);
  scat=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:340px;height:auto" role="img" aria-label="Overrun previsto contra medido"><line x1="${sx(lo)}" y1="${sy(lo)}" x2="${sx(hi)}" y2="${sy(hi)}" stroke="var(--t3)" stroke-dasharray="3 3"/>${ovPts.map(r=>`<circle cx="${sx(r.ov[0])}" cy="${sy(r.ov[1])}" r="4.5" fill="var(--ice)"/>`).join('')}<text x="${W/2}" y="${H-6}" text-anchor="middle" fill="var(--t3)" font-size="9.5">previsto (%)</text><text x="12" y="${H/2}" fill="var(--t3)" font-size="9.5" transform="rotate(-90 12 ${H/2})" text-anchor="middle">medido (%)</text>${[lo,hi].map(v=>`<text x="${sx(v)}" y="${H-14}" text-anchor="middle" fill="var(--t3)" font-size="9">${f0(v)}</text>`).join('')}</svg>`;}
 const cnt=CAL.counts||{ov:0,tex:0,melt:0,icy:0};
 return`<div class="pg"><div><h1>Lotes e calibração</h1><p class="lead">Cada calda iniciada na Produção ao vivo já vira um lote aqui. Registre as medições reais: os desvios entre previsto e medido ajustam o motor para a sua máquina, seus fornecedores e seu paladar.</p></div>
 <div class="card"><div class="row"><h2 style="margin:0">Diário de produção</h2><span class="sp"></span><button class="btn pri" data-a="lotNew"${m.empty?' disabled':''}>${m.empty?'Abra uma receita aprovada':'Registrar lote já produzido'}</button></div>
  ${LOTS.length?`<div class="tw" style="margin-top:10px"><table class="tbl"><thead><tr><th>Lote</th><th>Receita</th><th>Data</th><th class="r">Overrun prev./med.</th><th>APPCC</th><th></th></tr></thead><tbody>
   ${LOTS.map(L=>{const ov=measuredOverrun(L.meas||{});const h=haccp(L);const worst=h.some(x=>x[1]==='crit')?'crit':h.some(x=>x[1]==='warn')?'warn':'ok';return`<tr${U.lotOpen===L.id?' style="background:var(--hov)"':''}><td class="mono">${esc(L.code)}</td><td>${esc(L.name)}</td><td class="mono">${esc(L.date)}</td><td class="r mono">${lotPred(L,'ov',f0)}% / ${ov!=null?f0(ov)+'%':'—'}</td><td><span class="chip ${worst}">${worst==='ok'?'conforme':worst==='warn'?'pendências':'não conforme'}</span></td><td class="r"><button class="btn sm" data-a="lotOpen" data-v="${L.id}">${U.lotOpen===L.id?'Fechar':'Abrir'}</button></td></tr>`;}).join('')}</tbody></table></div>`:'<p class="muted" style="margin:10px 0 0">Nenhum lote registrado. Produza a receita da bancada e registre aqui as medições.</p>'}</div>
 ${open?lotEditor(open):''}
 ${ROLE==='sous'?'':` <div class="card"><div class="row"><h2 style="margin:0">Calibração do motor</h2><span class="sp"></span><label class="row" style="gap:6px;font-size:13px"><input type="checkbox" id="calOn" data-c="calOn" ${CAL.on?'checked':''}> Aplicar calibração</label></div>
  <div class="g3" style="margin-top:12px;gap:12px">
   <div class="card flat"><span class="lbl">Overrun por máquina</span>${Object.keys(CAL.ov).length?Object.entries(CAL.ov).map(([k,v])=>`<div class="kv"><span>${esc((MACH[k]||{}).n||k)}</span><span>${v>0?'+':''}${f1(v)} pp</span></div>`).join(''):'<p class="note">Sem medições ainda.</p>'}<p class="note">${cnt.ov} lote(s) com overrun medido</p></div>
   <div class="card flat"><span class="lbl">Dureza na vitrine</span><div class="kv"><span>Ajuste de temperatura</span><span>${CAL.tShift>0?'+':''}${f2(CAL.tShift)} °C</span></div><div class="kv"><span>Derretimento (10 min)</span><span>${CAL.meltBias>0?'+':''}${f1(CAL.meltBias)} pp</span></div><p class="note">${cnt.tex} avaliação(ões) de textura · ${cnt.melt} teste(s) de derretimento</p></div>
   <div class="card flat"><span class="lbl">Recristalização</span><div class="kv"><span>Multiplicador de K</span><span>× ${f2(CAL.kMult)}</span></div><p class="note">${cnt.icy} lote(s) com dia de gelo perceptível. Cada ajuste é encolhido em direção a zero até haver lotes suficientes (média bayesiana com prior de 3 lotes).</p></div>
   <div class="card flat"><span class="lbl">Endurecimento no freezer</span><div class="kv"><span>Troca de calor</span><span>× ${f2(CAL.hMult||1)} (${f0(H_FREEZER*(CAL.hMult||1))} W/m²K)</span></div><p class="note">${cnt.core||0} lote(s) com núcleo medido e minutos no freezer. Acima de 1: seu freezer resfria mais rápido que a estimativa; abaixo: mais devagar. Medições já em equilíbrio com o freezer não entram.</p></div>
  </div>${scat?`<div style="margin-top:10px"><span class="lbl">Overrun previsto × medido</span>${scat}</div>`:''}</div>`}
 <div class="card flat"><p class="note" style="margin:0"><b style="color:var(--t2)">Como medir sem laboratório.</b> Overrun: encha um copo de volume fixo com a mistura e pese; depois o mesmo copo com o gelato recém-extraído, nivelado (overrun = (mistura − gelato) ÷ gelato). Derretimento: 100 g de gelato numa grade a 20 °C; pese o que escorreu em 10 min. Textura: avalie na espátula, de −2 (muito mole) a +2 (muito duro), anotando a temperatura da vitrine. Gelo: anote o dia em que percebeu cristais na língua.</p></div></div>`;}
function lotEditor(L){const me=L.meas||{},se=L.sens||{};const ov=measuredOverrun(me);const h=haccp(L);
 const plan=L.plan||{};const num=(k,label,step,hint)=>{const pk=k.startsWith('meas.')?plan[k.slice(5)]:null;return`<label class="field"><span class="lbl">${label}</span><input type="number" id="lot-${k.replace('.','-')}" data-i="lot" data-k="${k}" value="${getPath(L,k)!=null?esc(getPath(L,k)):''}" step="${step}"${pk!=null?` placeholder="plano: ${esc(fT(pk))}"`:''}>${hint?`<span class="hint">${hint}</span>`:''}</label>`;};
 const prev=LOTS.filter(x=>x.id!==L.id&&x.name===L.name&&x.sens&&Object.keys(x.sens).length)[0];
 return`<div class="card" style="border-color:var(--line2)"><div class="row"><h2 style="margin:0">Lote ${esc(L.code)} · ${esc(L.name)}</h2><span class="sp"></span><button class="btn okb sm" data-a="lotSave">Salvar lote</button><button class="btn sm" data-a="lotConsume">Baixar do estoque</button>${can.edit()?`<button class="btn sm" data-a="lotBench">Abrir receita</button><button class="btn del" data-a="lotDel" aria-label="Excluir lote">✕</button>`:''}</div>
 <div class="pills" style="margin:12px 0">${h.map(([n,s,v])=>`<div class="pill2 ${s}"><span class="dot"></span><span class="n">${n}</span><span class="v">${esc(v)}</span></div>`).join('')}</div>
 ${protocolCard(L)}
 <h3 style="margin:14px 0 8px">Processo real (APPCC)</h3><div class="form">${num('meas.pastT','Pasteurização (°C)',1)}${num('meas.pastHold','Retenção ('+(L.proc.pastHoldU||'s')+')',1)}${num('meas.coolMin','Resfriar a 4 °C (min)',5)}${num('meas.matH','Maturação (h)',1)}${num('meas.matT','Maturação (°C)',.5)}${num('meas.drawT','Saída (°C)',.5)}${num('meas.drawMin','Mantecação (min)',1)}</div>
 <h3 style="margin:16px 0 8px">Medições do produto</h3><div class="form">
  ${num('meas.brix','Brix da mistura (°Bx)',.1,'previsto '+lotPred(L,'brix',f1))}${num('meas.ph','pH medido',.01,L.pred&&L.pred.ph!=null?'estimado '+f1(L.pred.ph)+' (pHmetro calibrado)':'pHmetro calibrado')}${num('meas.cupMix','Copo com mistura (g)',1)}${num('meas.cupGel','Copo com gelato (g)',1,ov!=null?'overrun '+f0(ov)+'% (previsto '+lotPred(L,'ov',f0)+'%)':'mesmo copo, nivelado')}
  ${num('meas.melt10','Derretido em 10 min (%)',1,'previsto '+lotPred(L,'melt10',f0)+'%')}
  <label class="field"><span class="lbl">Textura na vitrine</span><select id="lot-tex" data-c="lot" data-k="meas.tex"><option value=""${me.tex==null||me.tex===''?' selected':''}>não avaliada</option>${[[-2,'muito mole'],[-1,'mole'],[0,'ideal'],[1,'duro'],[2,'muito duro']].map(([v,n])=>`<option value="${v}"${String(me.tex)===String(v)?' selected':''}>${v>0?'+':''}${v} · ${n}</option>`).join('')}</select></label>
  ${num('meas.texTemp','Temperatura avaliada (°C)',.5)}${num('meas.icyDay','Dia em que percebeu gelo',1,'vazio = não percebeu')}
  ${num('meas.qT','Quenelle: temperatura do gelato (°C)',.5,'termômetro de espeto no centro')}
  <label class="field"><span class="lbl">Quenelle: resultado</span><select id="lot-qres" data-c="lot" data-k="meas.qRes"><option value=""${me.qRes==null||me.qRes===''?' selected':''}>não testada</option>${[[-1,'rachou / duro demais'],[0,'lisa, no ponto'],[1,'mole / desabou']].map(([v,n])=>`<option value="${v}"${String(me.qRes)===String(v)?' selected':''}>${n}</option>`).join('')}</select></label></div>
 <div class="g2" style="margin-top:16px;gap:16px"><div><h3 style="margin:0 0 8px">Ficha sensorial (1–5)</h3><div class="form" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr))">${[['doce','Doçura'],['cremoso','Cremosidade'],['gelo','Sem gelo'],['corpo','Corpo'],['sabor','Intensidade'],['derr','Derretimento'],['visual','Aparência']].map(([k,n])=>`<label class="field"><span class="lbl">${n}</span><input type="number" id="lot-s-${k}" data-i="lot" data-k="sens.${k}" value="${se[k]!=null?se[k]:''}" min="1" max="5" step="1"></label>`).join('')}</div>
  <label class="field" style="margin-top:10px"><span class="lbl">Observações</span><textarea id="lot-notes" data-i="lotTxt" rows="3">${esc(L.notes||'')}</textarea></label></div>
  <div>${Object.keys(se).length?radar([...(prev?[{v:prev.sens,col:'var(--t3)'}]:[]),{v:se,col:'var(--ice)'}]):'<p class="note">Preencha a ficha para ver o perfil.</p>'}${prev?`<p class="note">Cinza: lote anterior ${esc(prev.code)}.</p>`:''}</div></div>
 <h3 style="margin:16px 0 8px">Rastreabilidade · lote de cada ingrediente</h3><div class="form">${(L.recipe||[]).map(r=>`<label class="field"><span class="lbl">${esc(ING_BY[r.id]?ING_BY[r.id].n:r.id)}</span><input type="text" id="lot-t-${r.id}" data-i="lot" data-k="trace.${r.id}" value="${esc((L.trace||{})[r.id]||'')}" placeholder="lote do fornecedor"></label>`).join('')}</div>
 </div>`;}

/* ===================== INGREDIENTES ===================== */
const CFIELDS=[['w','Água'],['fat','Gordura'],['prot','Proteína'],['lac','Lactose'],['suc','Sacarose'],['glu','Glicose'],['fru','Frutose'],['gs','Xarope de glicose / malto (sólidos)'],['alu','Alulose'],['iso','Isomaltulose'],['tre','Trealose'],['ery','Eritritol'],['sor','Sorbitol'],['xyl','Xilitol'],['mlt','Maltitol'],['gly','Glicerol'],['inu','Inulina'],['fos','FOS'],['fib','Outras fibras'],['alc','Etanol'],['salt','Sal (NaCl)'],['acd','Ácidos orgânicos'],['ash','Minerais'],['stab','Hidrocoloides'],['emul','Emulsificantes'],['oth','Outros sólidos']];
const EU14K=['leite','ovo','nozes','amendoim','soja','gluten','sesamo','sulfito','peixe','crustaceo','molusco','aipo','mostarda','tremoco'];
function ingPacPod(i){const c=i.c;let pac=0,pod=0;for(const f in PACK)pac+=(c[f]||0)*PACK[f]/100;for(const f in PODK)pod+=(c[f]||0)*PODK[f]/100;if(c.gs){pac+=c.gs*1.9*(i.de||20)/100;pod+=c.gs*.9*(i.de||20)/100;}return[pac,pod];}
function pgIngredientes(){const E=U.ingEdit;const q=norm(U.ingQ||'');const cat=U.ingCat||'Todas';
 const cats=['Todas',...new Set(ING.filter(i=>i.id!=='nx_tmp').map(i=>i.cat))];
 const L=ING.filter(i=>i.id!=='nx_tmp'&&(cat==='Todas'||i.cat===cat)&&(!q||norm(i.n).includes(q)));
 return`<div class="pg"><div><h1>Ingredientes</h1><p class="lead">${ING.length} ingredientes no banco. Cadastre os seus a partir da ficha técnica do fornecedor: o motor passa a calcular PAC, POD, fator de dureza, alérgenos, rótulo e custo com eles.</p></div>
 ${E?ingEditor(E):`<div class="row"><button class="btn pri" data-a="ingNew">Novo ingrediente</button></div>`}
 <div class="card"><div class="row" style="margin-bottom:10px"><input type="text" id="ingQ" data-i="ingQ" value="${esc(U.ingQ||'')}" placeholder="Buscar ingrediente" style="max-width:260px" aria-label="Buscar ingrediente"><select id="ingCat" data-c="ingCat" style="max-width:220px" aria-label="Categoria">${cats.map(c=>`<option${c===cat?' selected':''}>${esc(c)}</option>`).join('')}</select></div>
 <div class="tw"><table class="tbl"><thead><tr><th>Ingrediente</th><th class="r">Água</th><th class="r">Gord.</th><th class="r">PAC</th><th class="r">POD</th>${$cost('<th class="r">R$/kg</th>')}<th></th></tr></thead><tbody>
 ${L.slice(0,160).map(i=>{const[pac,pod]=ingPacPod(i);return`<tr><td>${esc(i.n)}<div class="muted" style="font-size:11px">${esc(i.cat)}${(i.al||[]).length?' · '+i.al.join(', '):''}</div></td><td class="r mono">${f0(i.c.w||0)}</td><td class="r mono">${f1(i.c.fat||0)}</td><td class="r mono">${f0(pac)}</td><td class="r mono">${f0(pod)}</td>${$cost(`<td class="r mono">${f0(INVCOST[i.id]!=null?INVCOST[i.id]:i.cost||0)}</td>`)}<td class="r"><div class="row" style="justify-content:flex-end;gap:4px">${i.custom?`<button class="btn sm" data-a="ingEdit" data-v="${i.id}">Editar</button><button class="btn del" data-a="ingDel" data-v="${i.id}" aria-label="Excluir">✕</button>`:`<button class="btn sm" data-a="ingDup" data-v="${i.id}">Duplicar</button>`}</div></td></tr>`;}).join('')}</tbody></table></div><p class="note">PAC e POD por 100 g do ingrediente.</p></div></div>`;}
function ingEditor(E){const sum=CFIELDS.reduce((a,[k])=>a+(+E.c[k]||0),0);const tmp={c:E.c,de:+E.x.de||20};const[pac,pod]=ingPacPod(tmp);const hf=HFK.B*(+E.x.hfB||0)+HFK.S*(+E.x.hfS||0)+HFK.N*(+E.x.hfN||0);
 const n=(k,l,p)=>`<label class="field"><span class="lbl">${l}</span><input type="number" id="ie-${p}${k}" data-i="ing" data-k="${p}${k}" value="${(p==='c.'?E.c[k]:E.x[k])!=null?esc(p==='c.'?E.c[k]:E.x[k]):''}" step=".1" min="0"></label>`;
 return`<div class="card" style="border-color:var(--line2)"><div class="row"><h2 style="margin:0">${E.id?'Editar':'Novo'} ingrediente</h2><span class="sp"></span><span class="chip ${Math.abs(sum-100)<=1?'ok':'warn'}">Soma ${f1(sum)} g / 100 g</span></div>
 <div class="form" style="margin-top:12px"><label class="field" style="grid-column:span 2"><span class="lbl">Nome</span><input type="text" id="ie-n" data-i="ingName" value="${esc(E.n)}" maxlength="60"></label>
  <label class="field" style="grid-column:span 2"><span class="lbl">Nome no rótulo</span><input type="text" id="ie-lab" data-i="ing" data-k="x.lab" value="${esc(E.x.lab||'')}"></label>
  ${can.cost()?n('cost','Custo (R$/kg)','x.'):''}${n('brix','°Brix (frutas)','x.')}${n('ph','pH','x.')}${n('de','DE do xarope','x.')}${n('na','Sódio (mg/100 g)','x.')}${n('sat','Fração saturada (0–1)','x.')}</div>
 <h3 style="margin:14px 0 8px">Composição por 100 g</h3><div class="form" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">${CFIELDS.map(([k,l])=>n(k,l,'c.')).join('')}</div>
 <h3 style="margin:14px 0 8px">Fator de dureza (g por 100 g)</h3><div class="form">${n('hfB','Manteiga de cacau / gordura dura','x.')}${n('hfS','Sólidos de cacau não gordurosos','x.')}${n('hfN','Gordura de oleaginosas','x.')}</div>
 <div class="row" style="margin-top:12px;gap:14px;flex-wrap:wrap">${EU14K.map(a=>`<label class="row" style="gap:5px;font-size:12.5px"><input type="checkbox" data-c="ingAl" data-k="${a}" id="ie-al-${a}"${(E.x.al||[]).includes(a)?' checked':''}> ${a}</label>`).join('')}
  <label class="row" style="gap:5px;font-size:12.5px"><input type="checkbox" data-c="ingFlag" data-k="dairy" id="ie-dairy"${E.x.dairy?' checked':''}> lácteo (MSNF)</label><label class="row" style="gap:5px;font-size:12.5px"><input type="checkbox" data-c="ingFlag" data-k="added" id="ie-added"${E.x.added?' checked':''}> açúcar adicionado</label><label class="row" style="gap:5px;font-size:12.5px"><input type="checkbox" data-c="ingFlag" data-k="acid" id="ie-acid"${E.x.acid?' checked':''}> fruta ácida</label></div>
 <div class="row" style="margin-top:12px"><span class="t2" style="font-size:13px">Por 100 g: PAC <b class="mono c-ice">${f0(pac)}</b> · POD <b class="mono c-gold">${f0(pod)}</b> · HF <b class="mono">${f0(hf)}</b></span><span class="sp"></span><button class="btn okb" data-a="ingSave"${E.n.trim()?'':' disabled'}>Salvar ingrediente</button><button class="btn sm" data-a="ingCancel">Cancelar</button></div></div>`;}

/* ===================== VITRINE ===================== */
function pgVitrine(){const V=S.vitrine;const rows=vitrineAnalysis(V.items,V.temp);const best=rows.length?bestVitrineTemp(rows):null;const srcs=recipeSources();
 const W=640,H=Math.max(80,rows.length*30+40),L=170,R=20,T=10,tx=t=>L+(clamp(t,-24,-4)+24)/20*(W-L-R);let g=`<rect x="${tx(V.temp-1.5)}" y="${T}" width="${tx(V.temp+1.5)-tx(V.temp-1.5)}" height="${H-T-24}" fill="rgba(110,231,183,.1)"/><line x1="${tx(V.temp)}" x2="${tx(V.temp)}" y1="${T}" y2="${H-24}" stroke="var(--ok)"/>`;
 for(let t=-24;t<=-4;t+=4)g+=`<text x="${tx(t)}" y="${H-8}" text-anchor="middle" fill="var(--t3)" font-size="10">${t}°</text>`;
 rows.forEach((r,i)=>{const y=T+16+i*30;const col=Math.abs(r.dev)<=1.5?'var(--ok)':Math.abs(r.dev)<=3?'var(--warn)':'var(--crit)';g+=`<text x="${L-8}" y="${y+4}" text-anchor="end" fill="var(--t2)" font-size="11">${esc(r.it.name.slice(0,24))}</text><line x1="${tx(V.temp)}" x2="${tx(r.m.serveT)}" y1="${y}" y2="${y}" stroke="${col}" stroke-width="2"/><circle cx="${tx(r.m.serveT)}" cy="${y}" r="6" fill="${col}"/>`;});
 return`<div class="pg"><div><h1>Vitrine</h1><p class="lead">Todos os sabores dividem a mesma temperatura. Monte a vitrine do dia: o motor mostra qual sabor vai ficar duro ou mole e rebalanceia cada um para servir no ponto.</p></div>
 <div class="card"><div class="row"><div class="field" style="width:auto"><span class="lbl">Temperatura da vitrine</span><div class="vit"><button data-a="vitT" data-v="-.5" aria-label="Mais frio">−</button><output>${f1(V.temp)} °C</output><button data-a="vitT" data-v=".5" aria-label="Menos frio">+</button></div></div>
  ${best!=null&&Math.abs(best-V.temp)>=.5?`<button class="btn sm" data-a="vitBest">Usar ${f1(best)} °C (mediana dos sabores)</button>`:''}<span class="sp"></span>
  <select id="vitAdd" data-c="vitAdd" style="max-width:320px" aria-label="Adicionar sabor"><option value="">+ adicionar sabor…</option>${srcs.map(s=>`<option value="${esc(s.key)}">${esc(s.name)}</option>`).join('')}</select></div></div>
 ${rows.length?`<div class="card"><h2>Temperatura ideal de cada sabor</h2><div class="tw"><svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:520px;height:auto" role="img" aria-label="Temperatura ideal de serviço por sabor">${g}</svg></div><p class="note">Ponto: temperatura em que o sabor fica com a textura ideal. Faixa verde: ±1,5 °C da vitrine.</p></div>
 <div class="card"><h2>Sabores (${rows.length})</h2><div class="tw"><table class="tbl"><thead><tr><th>Sabor</th><th class="r">Serviço ideal</th><th class="r">Congelada a ${f1(V.temp)}°</th><th class="r">Índice</th><th></th></tr></thead><tbody>
  ${rows.map((r,i)=>{const s=Math.abs(r.dev)<=1.5?'ok':Math.abs(r.dev)<=3?'warn':'crit';const hb=U.vitBal&&U.vitBal.i===i?U.vitBal.r:null;return`<tr><td>${esc(r.it.name)}<div class="muted" style="font-size:11px">${esc(PROF[r.it.tipo].n)}</div></td><td class="r mono">${f1(r.m.serveT)} °C</td><td class="r"><span class="chip ${s}">${f0(r.m.fzVit)}% · ${r.dev>1.5?'fica duro':r.dev<-1.5?'fica mole':'no ponto'}</span></td><td class="r mono">${r.sc}</td><td class="r"><div class="row" style="justify-content:flex-end;gap:4px">${s!=='ok'?`<button class="btn sm pri" data-a="vitHarm" data-v="${i}">Harmonizar</button>`:''}<button class="btn sm" data-a="vitOpen" data-v="${i}">Abrir</button><button class="btn del" data-a="vitRm" data-v="${i}" aria-label="Remover">✕</button></div></td></tr>
   ${hb?`<tr><td colspan="5">${hb.ok?`<div class="fix" style="padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--surf)">${hb.prop.map((x,k)=>esc(ING_BY[x.id].n)+' '+f0(hb.cur[k])+' → <b class="c-ice">'+f0(x.g)+' g</b>').join(' · ')} → ${f0(hb.m1.fzVit)}% congelada, POD ${f1(hb.m1.pod)}% <button class="btn sm okb" data-a="vitApply" style="margin-left:8px">Aplicar</button></div>`:`<span class="c-warn">${esc(hb.msg)}</span>`}</td></tr>`:''}`;}).join('')}</tbody></table></div></div>`:'<div class="card"><p class="muted" style="margin:0">Adicione os sabores do dia pelo menu acima.</p></div>'}</div>`;}

/* ===================== QUÍMICA E SENSORIAL ===================== */
function pgQuimica(m){if(m.empty)return`<div class="pg"><h1>Química e sensorial</h1><p class="lead">Monte uma receita primeiro.</p></div>`;
 const t0=Math.min(-20,Math.floor(m.vit/2)*2);const temps=[];for(let t=t0;t<=-6;t+=1)temps.push(t);const W=600,H=200,L=40,R=12,T=12,B=28;const pods=temps.map(t=>m.pod*podTempFactor(t));const lo=Math.min(...pods,m.P.pod[0])-2,hi=Math.max(...pods,m.P.pod[1])+2;
 const sx=t=>L+(t-t0)/(-6-t0)*(W-L-R),sy=v=>T+(1-(v-lo)/(hi-lo))*(H-T-B);let g=`<rect x="${L}" y="${sy(m.P.pod[1])}" width="${W-L-R}" height="${sy(m.P.pod[0])-sy(m.P.pod[1])}" fill="rgba(110,231,183,.1)"/>`;
 temps.forEach(t=>{if(t%2===0)g+=`<text x="${sx(t)}" y="${H-10}" text-anchor="middle" fill="var(--t3)" font-size="10">${t}°</text>`;});
 g+=`<path d="${temps.map((t,i)=>(i?'L':'M')+sx(t)+','+sy(pods[i])).join('')}" fill="none" stroke="var(--gold)" stroke-width="2.4"/><line x1="${sx(m.vit)}" x2="${sx(m.vit)}" y1="${T}" y2="${H-B}" stroke="var(--ice)" stroke-dasharray="3 3"/><circle cx="${sx(m.vit)}" cy="${sy(m.podPerc)}" r="5" fill="var(--ice)"/>`;
 [lo,hi].forEach(v=>g+=`<text x="${L-6}" y="${sy(v)+4}" text-anchor="end" fill="var(--t3)" font-size="10">${f0(v)}</text>`);
 const tg=m.tg;
 return`<div class="pg"><div><h1>Química e sensorial</h1><p class="lead">Propriedades que o balanceamento clássico não mostra: viscosidade da mistura, pH, transição vítrea da fase concentrada, cinética de recristalização e percepção de doçura e aroma.</p></div>
 <div class="g3">
  <div class="card"><h2>Viscosidade a 4 °C${natTag('viscosity')}</h2><div class="big ${m.visc<25||m.visc>800?'c-warn':'c-ok'}">${f0(m.visc)}<small class="muted" style="font-size:14px"> mPa·s</small></div><p class="note">Fase sérica pela concentração de solutos, proteínas, Krieger-Dougherty para gordura e insolúveis e contribuição de cada hidrocoloide. Faixa de trabalho 50–400 mPa·s; abaixo de 25 a mistura não segura ar, acima de 800 a mantecadora sofre.</p></div>
  <div class="card"><h2>pH e acidez${natTag('ph')}</h2><div class="big ${m.msnf>.5&&m.ph<5.2?'c-warn':''}">${f1(m.ph)}</div><p class="t2" style="margin:6px 0 0">Acidez titulável ${f2(m.ta)}% (ácido cítrico equivalente)</p><p class="note">Fonte ácida dominante diluída na água da mistura, tamponada pelas proteínas do leite. Com leite, abaixo de 5,2 a caseína coagula no calor; abaixo de 4,6 agrega mesmo a frio.</p></div>
  <div class="card"><h2>Transição vítrea Tg′${natTag('tg-prime')}</h2><div class="big c-ice">${f1(tg)}<small class="muted" style="font-size:14px"> °C</small></div><p class="t2" style="margin:6px 0 0">Vitrine a ${f0(m.dTgVit)} °C acima · estoque a ${f0(m.dTgStore)} °C acima</p><p class="note">Abaixo de Tg′ a fase concentrada vira vidro e os cristais param de crescer. A velocidade de recristalização segue a equação WLF da distância até Tg′.</p></div>
 </div>
 <div class="card"><div class="row"><h2 style="margin:0">Freezer de armazenamento</h2><span class="sp"></span><button class="btn sm" data-a="go" data-v="processo">Ajustar no Processo</button></div>
  <div class="g3" style="margin-top:10px;gap:12px">
   <div><span class="lbl">Temperatura medida</span><div class="big ${m.pr.storeT>-15?'c-crit':m.pr.storeT>-18?'c-warn':'c-ice'}">${f1(m.pr.storeT)}<small class="muted" style="font-size:14px"> °C ± ${f1(+m.pr.storeFluct||0)}</small></div></div>
   <div><span class="lbl">Água congelada no freezer</span><div class="big">${f0(m.fzStore)}<small class="muted" style="font-size:14px">%</small></div><p class="note" style="margin:4px 0 0">Ao retirar: ${m.storeHard}${m.pr.serveFrom==='freezer'?' · serviço direto do freezer':''}</p></div>
   <div><span class="lbl">${m.pr.serveFrom==='freezer'?'Textura estável no freezer':m.pr.serveFrom==='pote'?'Espera até o ponto':'Aclimatação até a vitrine'}</span><div class="big">${m.pr.serveFrom==='freezer'?(m.shelfStore>180?'180+':f0(m.shelfStore))+'<small class="muted" style="font-size:14px"> dias</small>':f0(m.temperMin)+'<small class="muted" style="font-size:14px"> min</small>'}</div><p class="note" style="margin:4px 0 0">${m.pr.serveFrom==='freezer'?'Com oscilação de ±'+f1(+m.pr.storeFluct||0)+' °C (fator ×'+f2(m.kin.fFluct)+').':(m.pr.serveFrom==='pote'?'Pote de '+f0(+m.pr.poteMl)+' mL fora do freezer numa cozinha a '+fT(+m.pr.ambT)+' °C.':'Cuba de 5 L, de '+f1(m.pr.storeT)+' a '+f1(m.vit)+' °C. Faça em etapas para evitar choque térmico.')}</p></div>
  </div>
  <p class="note">O freezer não muda a temperatura de serviço, que é a da vitrine; ele decide quanto o gelato endurece no estoque, quanto tempo precisa aclimatar e, sobretudo, a velocidade com que os cristais crescem. Oscilação (porta, degelo) pesa mais que a temperatura média. Se você serve direto do freezer, escolha "Direto do freezer" no Processo: o balanceamento passa a mirar a temperatura dele.</p></div>
 <div class="g2">
  <div class="card"><h2>Estabilidade da textura${natTag('texture-stability')}</h2><p class="note" style="margin-top:0">Tempo até os cristais de gelo chegarem a ~50 µm (arenosidade), por um modelo de crescimento ainda <b>não calibrado</b> com medições. <b>Não é prazo de validade:</b> segurança de consumo depende de pasteurização, higiene, cadeia de frio e da legislação.</p><div class="kv"><span>Na vitrine (${f1(m.vit)} °C)</span><span class="${m.shelfVit>=5?'c-ok':m.shelfVit>=2?'c-warn':'c-crit'}">${m.shelfVit>60?'60+':f1(m.shelfVit)} dias</span></div><div class="kv"><span>No freezer (${fT(m.pr.storeT)} °C)</span><span>${m.shelfStore>180?'180+':f0(m.shelfStore)} dias</span></div><div class="kv"><span>Cristal inicial</span><span>${m.crystal} µm</span></div>
   <div class="kv"><span>Fatores de K</span><span>estab. ${f2(m.kin.fStab)} · choque ${f2(m.kin.fShock)} · WLF ${f2(m.kin.fKinVit)}${m.kin.km!==1?' · calib. '+f2(m.kin.km):''}</span></div><p class="note">Dias até o cristal médio passar de 50 µm (Ostwald, d³ = d₀³ + K·t).</p></div>
  <div class="card"><h2>Percepção</h2><div class="kv"><span>Doçura percebida a ${f1(m.vit)} °C</span><span class="c-gold">${f1(m.podPerc)}%</span></div><div class="kv"><span>Liberação de aroma</span><span class="${m.aroma>=75?'c-ok':m.aroma>=55?'c-warn':'c-crit'}">${f0(m.aroma)}/100</span></div><div class="kv"><span>Derretido em 10 min a 20 °C</span><span>${f0(m.melt10)}%</span></div>${aromaRows(m)}
   <p class="note">O frio reduz a doçura percebida (cerca de 2,5% por grau abaixo de −12 °C). Gordura, gomas, ar e proteína em excesso prendem os voláteis: aromas delicados (flores, ervas, frutas brancas) pedem índice acima de 75.</p></div></div>
 ${fatCard(m)}
 <div class="card"><h2>Doçura percebida × temperatura de serviço${natTag('sensory-temperature')}</h2><div class="tw"><svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:460px;height:auto" role="img" aria-label="Doçura percebida por temperatura">${g}</svg></div><p class="note">Faixa verde: doçura-alvo de ${esc(m.P.n.toLowerCase())}. Ponto azul: vitrine atual.</p></div></div>`;}

/* ===================== PLANEJAMENTO ===================== */
function pgPlanejamento(){const mach=MACH[S.proc.machine]||MACH.horiz;const cap=+S.planCap||mach.batch||5000;const srcs=recipeSources();
 const res=planNeeds(S.plan,p=>srcByKey(p.key),cap);const by=invStock(INV);
 const rows=Object.entries(res.need).map(([id,g])=>{const have=(by[id]||{q:0}).q;const i=ING_BY[id];const unit=INVCOST[id]!=null?INVCOST[id]:(i?i.cost:0)||0;return{id,g,have,short:Math.max(0,g-have),cost:g/1000*unit};}).sort((a,b)=>b.g-a.g);
 const tot=rows.reduce((a,r)=>a+r.cost,0);
 return`<div class="pg"><div><h1>Planejamento de produção</h1><p class="lead">Defina quantos quilos de cada sabor. O motor divide em ciclos da máquina, soma os ingredientes e confere com o estoque.</p></div>
 <div class="card"><div class="form"><label class="field"><span class="lbl">Capacidade por ciclo (g)</span><input type="number" id="planCap" data-i="planCap" value="${cap}" step="50"><span class="hint">${esc(mach.n)}</span></label></div>
  <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">${S.plan.map((p,k)=>`<div class="row"><select id="plan-s${k}" data-c="planSrc" data-k="${k}" style="flex:1;min-width:200px" aria-label="Sabor">${srcs.map(s=>`<option value="${esc(s.key)}"${s.key===p.key?' selected':''}>${esc(s.name)}</option>`).join('')}</select><input type="number" id="plan-kg${k}" data-i="planKg" data-k="${k}" value="${p.kg}" step=".5" min="0" style="width:90px" aria-label="Quilos"><span class="muted">kg</span><button class="btn del" data-a="planRm" data-v="${k}" aria-label="Remover">✕</button></div>`).join('')}
  <div><button class="btn sm" data-a="planAdd">+ Sabor</button></div></div></div>
 ${res.runs.length?`<div class="card"><h2>Ciclos</h2>${res.runs.map(r=>`<div class="kv"><span>${esc(r.name)}</span><span>${f1(r.g/1000)} kg · ${r.cycles} ${r.cycles===1?'ciclo':'ciclos'} de ${f0(r.perCycle)} g</span></div>`).join('')}<div class="kv"><span><b>Total</b></span><span><b>${(n=>n+(n===1?' ciclo':' ciclos'))(res.runs.reduce((a,r)=>a+r.cycles,0))}</b></span></div></div>
 <div class="card"><div class="row"><h2 style="margin:0">Ingredientes necessários</h2><span class="sp"></span><button class="btn sm" data-a="planCopy">Copiar lista de compras</button></div>
  <div class="tw" style="margin-top:10px"><table class="tbl"><thead><tr><th>Ingrediente</th><th class="r">Necessário</th><th class="r">Em estoque</th><th class="r">Comprar</th>${$cost('<th class="r">Custo</th>')}</tr></thead><tbody>
  ${rows.map(r=>`<tr><td>${esc(ING_BY[r.id]?ING_BY[r.id].n:r.id)}</td><td class="r mono">${r.g>=1000?f2(r.g/1000)+' kg':f0(r.g)+' g'}</td><td class="r mono">${r.have>=1000?f2(r.have/1000)+' kg':f0(r.have)+' g'}</td><td class="r mono ${r.short>0?'c-crit':'c-ok'}">${r.short>0?(r.short>=1000?f2(r.short/1000)+' kg':f0(r.short)+' g'):'ok'}</td>${$cost(`<td class="r mono">R$ ${f2(r.cost)}</td>`)}</tr>`).join('')}
  ${$cost(`<tr><td colspan="4"><b>Custo de matéria-prima</b></td><td class="r mono"><b>R$ ${f2(tot)}</b></td></tr>`)}</tbody></table></div>
  ${U.planCopy?`<textarea id="planArea" rows="8" readonly style="margin-top:10px;font-family:var(--fm);font-size:12px">${esc(U.planCopy)}</textarea>`:''}</div>`:''}</div>`;}

/* ===================== ESTOQUE ===================== */
function pgEstoque(){const by=invStock(INV);const N=U.invNew||{ingId:'leite',kg:'',costKg:'',lot:'',exp:''};const soon=d=>d&&(new Date(d)-new Date())/864e5<=7;
 const groups=Object.keys(by).sort((a,b)=>(ING_BY[a]?ING_BY[a].n:a).localeCompare(ING_BY[b]?ING_BY[b].n:b));
 return`<div class="pg"><div><h1>Estoque</h1><p class="lead">Entradas por lote com custo e validade. O custo médio ponderado alimenta os custos das receitas automaticamente, e a produção baixa o estoque pela ordem de validade (FEFO).</p></div>
 <div class="card"><h2>Nova entrada</h2><div class="form"><label class="field" style="grid-column:span 2"><span class="lbl">Ingrediente</span><select id="inv-ing" data-c="invNew" data-k="ingId">${ingOpts(N.ingId)}</select></label>
  <label class="field"><span class="lbl">Quantidade (kg)</span><input type="number" id="inv-kg" data-i="invNew" data-k="kg" value="${esc(N.kg)}" step=".1" min="0"></label>
  ${$cost(`<label class="field"><span class="lbl">Custo (R$/kg)</span><input type="number" id="inv-cost" data-i="invNew" data-k="costKg" value="${esc(N.costKg)}" step=".1" min="0"></label>`)}
  <label class="field"><span class="lbl">Lote do fornecedor</span><input type="text" id="inv-lot" data-i="invNew" data-k="lot" value="${esc(N.lot)}"></label>
  <label class="field"><span class="lbl">Validade</span><input type="date" id="inv-exp" data-i="invNew" data-k="exp" value="${esc(N.exp)}"></label></div>
  <div class="row" style="margin-top:10px"><button class="btn okb" data-a="invAdd">Registrar entrada</button></div></div>
 <div class="card"><h2>Saldo</h2>${groups.length?`<div class="tw"><table class="tbl"><thead><tr><th>Ingrediente</th><th class="r">Saldo</th>${$cost('<th class="r">Custo médio</th>')}<th>Lotes</th></tr></thead><tbody>
  ${groups.map(id=>{const es=invEntries(INV).filter(e=>e.ingId===id&&+e.qty>0);if(!es.length)return'';return`<tr><td>${esc(ING_BY[id]?ING_BY[id].n:id)}</td><td class="r mono">${f2(by[id].q/1000)} kg</td>${$cost(`<td class="r mono">R$ ${f2(INVCOST[id]||0)}</td>`)}<td>${es.map(e=>`<span class="chip ${soon(e.exp)?'warn':''}" style="margin:2px">${esc(e.lot||'s/ lote')} · ${f2(e.qty/1000)} kg${e.exp?' · '+esc(e.exp):''}<button class="btn del" data-a="invDel" data-v="${e.id}" style="padding:0 5px;margin-left:4px" aria-label="Excluir entrada">✕</button></span>`).join('')}</td></tr>`;}).join('')}</tbody></table></div>`:'<p class="muted" style="margin:0">Estoque vazio.</p>'}
  <p class="note">Laranja: vence em até 7 dias.</p></div></div>`;}

/* ===================== DADOS ===================== */
function pgDados(){const st=STORE.status;
 const pend=APP_MODE==='app'?SUPA_BACKEND.pending():0;
 return`<div class="pg"><div><h1>${APP_MODE==='app'?'Conta e sincronização':'Dados e sincronização'}</h1><p class="lead">Onde seus dados ficam e como levá-los.</p></div>
 ${APP_MODE==='app'?accountCard(pend):''}
 <div class="card"><div class="row"><span class="chip ${st==='cloud'?'ok':st==='error'?'crit':st==='syncing'?'info':'warn'}">${st==='cloud'?'Nuvem':st==='syncing'?'Sincronizando':st==='error'?'Erro':st==='offline'?'Sem internet':'Este aparelho'}</span><span class="t2" style="font-size:13px">${esc(STORE.msg)}</span><span class="sp"></span>${APP_MODE==='app'?`<button class="btn sm" data-a="syncNow">Sincronizar agora</button>`:''}</div>
  <div class="g3" style="margin-top:12px">${(ROLE==='sous'?[['Receitas em execução',EXEC.length],['Lotes',LOTS.length]]:[['Receitas em execução',EXEC.length],['Minhas receitas',LIB.length],['Lotes',LOTS.length],['Ingredientes próprios',CUST.length],['Neutros',NXLIB.length],['Entradas de estoque',INV.filter(e=>!isMov(e)).length],['Baixas registradas',INV.filter(isMov).length]]).map(([n,v])=>`<div class="kv"><span>${n}</span><span>${v}</span></div>`).join('')}${pend?`<div class="kv"><span>Aguardando envio</span><span class="c-warn">${pend}</span></div>`:''}</div></div>
 ${can.cost()?`<div class="card"><h2>Exportar e importar</h2><div class="row"><button class="btn pri" data-a="expJson">Exportar backup (JSON)</button><button class="btn" data-a="expCsv">Exportar lotes (CSV)</button><label class="btn" for="impFile">Importar backup</label><input type="file" id="impFile" accept=".json,application/json" style="display:none"></div>
  ${U.exp?`<textarea id="expArea" rows="8" readonly style="margin-top:10px;font-family:var(--fm);font-size:11px">${esc(U.exp)}</textarea><p class="note">Download indisponível nesta visualização: selecione e copie o texto.</p>`:''}
  <p class="note">O backup inclui biblioteca, receitas em execução, lotes, ingredientes, neutros, estoque, vitrine, sets e itens apagados. Ao importar, você vê o que muda antes de confirmar; nada mais novo deste aparelho é sobrescrito.${APP_MODE==='app'?' Para trazer os dados do artefato: exporte o backup lá e importe aqui — tudo vai para a nuvem da equipe.':''}</p></div>${importCard()}`:''}
 ${ROLE==='sous'?'':testCard()}</div>`;}
/* bateria de testes dentro do app: mesma bateria que roda antes de cada publicação */
function testCard(){const R=U.test;const grp=R?[...new Set(R.list.map(t=>t.group))]:[];
 return`<div class="card"><div class="row"><h2 style="margin:0">Testes do motor</h2><span class="sp"></span>${R?`<span class="chip ${R.fail?'crit':'ok'}">${R.fail?R.fail+' falha(s)':'Tudo certo'}</span>`:''}<button class="btn pri" data-a="testRun">${R?'Rodar de novo':'Rodar testes'}</button></div>
 <p class="note">Roda as ${MASTERS.length} receitas dos mestres e as ${PRESETS.length} bases em três vitrines e no modo freezer: física (Goff–Hartel, âncoras de ponto de congelamento, Corvitto), ausência de valores inválidos, se cada solução do laudo realmente leva à faixa, balanceador, gerador, regressão contra a referência e todas as páginas. Sua calibração fica desligada durante o teste.</p>
 ${R?`${grp.map(g=>`<div class="lbl" style="margin-top:10px">${esc(g)}</div>${R.list.filter(t=>t.group===g).map(t=>`<div class="kv"><span><span class="${t.ok?'c-ok':'c-crit'}">${t.ok?'✓':'✗'}</span> ${esc(t.name)}${t.detail?`<br><span class="muted" style="font-size:11.5px">${esc(t.detail)}</span>`:''}</span><span class="${t.ok?'c-ok':'c-crit'}">${t.ok?'ok':'falhou'}</span></div>`).join('')}`).join('')}
 <p class="note">${R.pass} de ${R.list.length} testes em ${R.ms} ms · ${new Date(R.date).toLocaleString('pt-BR')}</p>`:''}</div>`;}


