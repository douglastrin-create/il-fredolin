/* ===================== PAINEL SENSORIAL (v18.15 · §24, §25) =====================
   O objetivo do experimento escolhe o método (core/sensory/painel.js). Amostras com código de 3 dígitos; a ordem gira a
   cada provador (quadrado latino por rotação, para posição e efeito residual se distribuírem). Cada avaliação é gravada
   no lote (sincroniza com a equipe) com o método (m) e a sessão (s). Avaliações antigas, sem método, são do tipo
   "ponto ideal + aceitação" e continuam valendo. */
const PANELKEY='fredolin_v13_panel';
const JAR=[[-2,'muito pouco'],[-1,'pouco'],[0,'ideal'],[1,'muito'],[2,'demais']];
const PANEL_Q=[['jDoce','Doçura','jar'],['jDuro','Dureza na colher','jar'],['jCrem','Cremosidade','jar'],['hed','Gostei (1–9)','hed'],['int','Intensidade do sabor (1–5)','s5'],['pers','Persistência (1–5)','s5']];
const TRI_LAY=['AAB','ABA','BAA','BBA','BAB','ABB'];
const PANEL0={m:'jar',s:null,lots:[],codes:{},order:[],taster:'',i:-1,cur:{},reveal:false,nT:0,attrs:['doce','crem','corpo','gran'],crit:'Preferência',tri:null,tds:null};
function panelState(){if(!U.panel){const x=LS.get(PANELKEY)||{};U.panel=Object.assign({},PANEL0,x);if(!SENS_METHODS[U.panel.m])U.panel.m='jar';}return U.panel;}
const savePanel=()=>LS.set(PANELKEY,U.panel);
const code3=used=>{let c;do{c=String(100+Math.floor(Math.random()*900));}while(used.has(c));used.add(c);return c;};
/* ordem do provador n: rotação (quadrado latino); nos provadores ímpares a sequência é invertida (equilibra quem vem antes de quem) */
function panelOrder(ids,n){const k=ids.length;const r=ids.map((_,i)=>ids[(i+n)%k]);return n%2?r.reverse():r;}
const panelEvals=(L,P)=>(L.panel||[]).filter(e=>e&&!e.ex&&(P.s?e.s===P.s:(!e.m||e.m==='jar'))&&(e.m||'jar')===P.m);
const attrsFor=m=>SENS_ATTR.filter(a=>!a.tds&&(m==='qda'||m==='tds'));
function panelReady(P){const M=SENS_METHODS[P.m];const n=P.lots.length;if(n<M.lots[0]||n>M.lots[1])return false;if((P.m==='qda'||P.m==='tds')&&P.attrs.length<(P.m==='tds'?3:1))return false;return true;}

function pgDegustacao(){const P=panelState();if(P.i>=0)return panelEvalPage(P);
 const lots=P.lots.map(id=>LOTS.find(l=>l.id===id)).filter(Boolean);const M=SENS_METHODS[P.m];const busy=!!P.s;
 const meth=`<div class="card" id="panel-method"><h2>1 · O que você quer saber?</h2>
  <div style="display:flex;flex-direction:column;gap:6px">${Object.entries(SENS_METHODS).map(([k,x])=>`<button class="btn ${P.m===k?'pri':'ghost'}" style="display:block;width:100%;height:auto;white-space:normal;text-align:left;line-height:1.3;padding:8px 12px" data-a="panelMethod" data-v="${k}" aria-pressed="${P.m===k}"${busy&&P.m!==k?' disabled':''}><b>${esc(x.q)}</b><br><span style="font-size:12px;opacity:.75">${esc(x.n)}</span></button>`).join('')}</div>
  <p class="note" style="margin:8px 0 0">${esc(M.how)}</p></div>`;
 const pick=`<div class="card"><h2>2 · Amostras <span class="muted" style="font-weight:400">(${M.lots[0]===M.lots[1]?M.lots[0]:M.lots[0]+' a '+M.lots[1]})</span></h2>
  ${LOTS.length?`<div style="display:flex;flex-direction:column;gap:6px">${LOTS.slice(0,24).map(L=>`<label class="row" style="gap:8px;font-size:13.5px"><input type="checkbox" data-c="panelLot" data-k="${L.id}" id="pl-${L.id}"${P.lots.includes(L.id)?' checked':''}${busy?' disabled':''}> <span class="mono">${esc(L.code)}</span> ${esc(L.name)} <span class="muted">${esc(L.date)}</span></label>`).join('')}</div>`:'<p class="muted">Registre lotes em "Lotes e qualidade" primeiro.</p>'}</div>`;
 const attrs=(P.m==='qda'||P.m==='tds')?`<div class="card" id="panel-attrs"><h2>3 · Atributos${P.m==='tds'?' que podem dominar (3 a 8)':''}</h2>
  <div class="chips" role="group" aria-label="Atributos">${attrsFor(P.m).map(a=>`<button data-a="panelAttr" data-v="${a.id}" aria-pressed="${P.attrs.includes(a.id)}"${busy?' disabled':''}>${esc(a.n)}</button>`).join('')}</div>
  <p class="note" style="margin:8px 0 0">${P.m==='qda'?'Cada atributo vai de 0 a 10 com âncoras escritas. Antes da sessão, combine com o painel uma referência para cada atributo (ex.: uma calda de açúcar para a doçura); sem referências, compare só dentro da mesma sessão.':'Escolha as sensações que podem aparecer. O provador toca a que domina em cada momento, até o sabor acabar.'}</p></div>`
  :P.m==='rank'?`<div class="card"><h2>3 · Critério da ordenação</h2><input type="text" data-i="panelCrit" value="${esc(P.crit)}" placeholder="Preferência, doçura, cremosidade…" style="max-width:280px" aria-label="Critério"${busy?' disabled':''}></div>`:'';
 const start=`<div class="card"><h2>${(P.m==='qda'||P.m==='tds'||P.m==='rank')?'4':'3'} · Provador</h2><div class="row"><input type="text" id="panelTaster" data-i="panelTaster" value="${esc(P.taster)}" placeholder="Nome ou iniciais" style="max-width:240px" aria-label="Provador"><button class="btn pri" data-a="panelStart"${panelReady(P)?'':' disabled'}>Começar a provar</button></div>
  <p class="note">Sirva todas as amostras na mesma temperatura, mesma porção (≈ 30 g), com água entre elas. ${P.s?`Sessão em andamento: ${P.nT} provador(es) até agora. Os próximos entram na mesma sessão.`:''}</p></div>`;
 return`<div class="pg"><div><h1>Painel cego</h1><p class="lead">Provas às cegas presas ao lote e à receita. O método segue a pergunta. Nada aqui é calculado a partir da receita: só o que o painel provou.</p></div>${meth}${pick}${attrs}${start}
  ${P.s||P.m==='jar'?panelResults(lots,P):''}${bridgeCard()}</div>`;}

/* ---------- telas de avaliação ---------- */
function panelEvalPage(P){const head=t=>`<div><h1>Painel cego</h1><p class="lead">Provador: <b>${esc(P.taster||'sem nome')}</b> · ${esc(SENS_METHODS[P.m].n)}${t?' · '+t:''}</p></div>`;
 const cancel=`<button class="btn sm" data-a="panelCancel">Cancelar provador</button>`;
 if(P.m==='tri'){const T=P.tri;return`<div class="pg">${head('')}<div class="card" id="panel-tri"><div class="row"><h2 style="margin:0">Qual copo é diferente?</h2><span class="sp"></span>${cancel}</div>
  <p class="note">Prove os três da esquerda para a direita. Dois são iguais. Mesmo sem certeza, escolha um.</p>
  <div class="row" style="gap:10px;margin-top:8px">${T.cups.map((c,i)=>`<button class="btn ${T.pick===i?'pri':''}" style="font-size:22px;padding:14px 18px" data-a="panelTri" data-v="${i}"><span class="mono">${esc(c)}</span></button>`).join('')}</div>
  <div class="row" style="margin-top:14px"><span class="sp"></span><button class="btn pri" data-a="panelNext"${T.pick!=null?'':' disabled'}>Concluir provador</button></div></div></div>`;}
 if(P.m==='rank'){const ids=P.order,cur=P.cur.rank||[];return`<div class="pg">${head('critério: '+esc(P.crit))}<div class="card" id="panel-rank"><div class="row"><h2 style="margin:0">Ordene: 1º = mais ${esc(P.crit.toLowerCase())}</h2><span class="sp"></span>${cancel}</div>
  <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">${ids.map(id=>{const pos=cur.indexOf(id);return`<button class="btn ${pos>=0?'pri':''}" data-a="panelRank" data-v="${id}"${pos>=0?' disabled':''}><span class="mono">${esc(P.codes[id])}</span>${pos>=0?' · '+(pos+1)+'º':''}</button>`;}).join('')}</div>
  <div class="row" style="margin-top:14px"><button class="btn ghost sm" data-a="panelRankReset">Recomeçar a ordem</button><span class="sp"></span><button class="btn pri" data-a="panelNext"${cur.length===ids.length?'':' disabled'}>Concluir provador</button></div></div></div>`;}
 const id=P.order[P.i],code=P.codes[id],cur=P.cur,step=`amostra ${P.i+1} de ${P.order.length}`;
 const nextBtn=(ok)=>`<div class="row" style="margin-top:14px"><span class="sp"></span><button class="btn pri" data-a="panelNext"${ok?'':' disabled'}>${P.i+1<P.order.length?'Próxima amostra':'Concluir provador'}</button></div>`;
 const top=`<div class="row"><h2 style="margin:0">Amostra <span class="mono c-ice" style="font-size:22px">${esc(code)}</span></h2><span class="sp"></span>${cancel}</div>`;
 if(P.m==='qda'){return`<div class="pg">${head(step)}<div class="card" id="panel-qda">${top}<div style="display:flex;flex-direction:column;gap:14px;margin-top:12px">
  ${P.attrs.map(k=>{const a=SENS_BY[k];return`<div class="field"><span class="lbl">${esc(a.n)} <span class="muted" style="font-weight:400">· ${esc(a.def)}</span></span>
   <div class="chips" role="group" aria-label="${esc(a.n)}">${[0,1,2,3,4,5,6,7,8,9,10].map(v=>`<button data-a="panelSet" data-v="${k}|${v}" aria-pressed="${String((cur.a||{})[k])===String(v)}">${v}</button>`).join('')}</div>
   <div class="row" style="font-size:11px"><span class="muted">0 = ${esc(a.lo)}</span><span class="sp"></span><span class="muted">10 = ${esc(a.hi)}</span></div></div>`;}).join('')}</div>${nextBtn(P.attrs.every(k=>(cur.a||{})[k]!=null))}</div></div>`;}
 if(P.m==='tds'){const T=P.tds||{};const run=T.t0!=null&&T.end==null;const last=T.seq&&T.seq.length?T.seq[T.seq.length-1][1]:null;
  return`<div class="pg">${head(step)}<div class="card" id="panel-tds">${top}
  ${T.t0==null?`<p class="note">Ponha a colherada na boca e toque <b>Começar</b>. Depois toque a sensação que domina em cada momento (pode repetir e trocar). Quando o sabor acabar, toque <b>Acabou</b>.</p><button class="btn pri" data-a="panelTdsGo">Começar</button>`
   :run?`<div class="chips" role="group" aria-label="Sensação dominante" style="margin-top:10px">${P.attrs.map(k=>`<button data-a="panelTdsTap" data-v="${k}" aria-pressed="${last===k}" style="font-size:15px;padding:10px 14px">${esc(SENS_BY[k].n)}</button>`).join('')}</div>
   <div class="row" style="margin-top:14px"><span class="muted">${T.seq.length} toque(s)</span><span class="sp"></span><button class="btn" data-a="panelTdsEnd"${T.seq.length?'':' disabled'}>Acabou</button></div>`
   :`<p class="note">Registrado: ${T.seq.length} toque(s) em ${f0(T.end-T.seq[0][0])} s.</p>`}
  ${nextBtn(T.end!=null)}</div></div>`;}
 /* ponto ideal + aceitação */
 const q=([k,n,t])=>`<div class="field"><span class="lbl">${n}</span><div class="chips" role="group" aria-label="${n}">${(t==='jar'?JAR:t==='hed'?[1,2,3,4,5,6,7,8,9].map(v=>[v,String(v)]):[1,2,3,4,5].map(v=>[v,String(v)])).map(([v,l])=>`<button data-a="panelSet" data-v="${k}|${v}" aria-pressed="${String(cur[k])===String(v)}">${t==='jar'?(v>0?'+':'')+v+' '+l:l}</button>`).join('')}</div></div>`;
 return`<div class="pg">${head(step)}<div class="card">${top}<div style="display:flex;flex-direction:column;gap:14px;margin-top:12px">${PANEL_Q.map(q).join('')}
  <label class="field"><span class="lbl">Comentário</span><input type="text" id="panelNote" data-i="panelNote" value="${esc(cur.note||'')}" placeholder="gelado, arenoso, aroma fraco…"></label></div>${nextBtn(cur.hed)}</div></div>`;}

/* ---------- resultados ---------- */
const lotLabel=(L,P)=>`<span class="mono c-ice">${esc(P.codes[L.id]||L.code)}</span>${P.reveal?' · '+esc(L.name)+' <span class="muted">'+esc(L.code)+'</span>':''}`;
const fmtCI=c=>!c?'—':f1(c.m)+(c.lo!=null?`<small class="muted"> [${f1(c.lo)}–${f1(c.hi)}]</small>`:'');
const pTxt=p=>p==null||!isFinite(p)?'—':p<.001?'< 0,001':f2(p).replace('.',',');
function panelResults(lots,P){if(!lots.length)return'';const E=lots.map(L=>({L,ev:panelEvals(L,P)}));if(!E.some(x=>x.ev.length))return'';
 const tools=`<span class="sp"></span><button class="btn sm" data-a="panelReveal">${P.reveal?'Ocultar nomes':'Revelar amostras'}</button><button class="btn sm" data-a="panelReset">Nova sessão</button>`;
 let body='';
 if(P.m==='tri'){const R=triAnalyze(E[0].ev);body=`<div class="kv"><span>Provadores</span><span class="mono">${R.n}</span></div><div class="kv"><span>Acertaram o copo diferente</span><span class="mono">${R.k} <span class="muted">(mínimo para 5%: ${R.min==null?'—':R.min})</span></span></div>
  <div class="kv"><span>Resultado</span><span class="chip ${R.diff?'ok':'warn'}">${esc(R.verdict)}</span></div><p class="note" style="margin:8px 0 0">${esc(R.note)}</p>`;}
 else if(P.m==='qda'){const S=lots.map(L=>L.id);const rows=P.attrs.map(k=>{const Y={};E.forEach(({L,ev})=>ev.forEach(e=>{if(e.a&&e.a[k]!=null){(Y[e.t||'?']=Y[e.t||'?']||{})[L.id]=+e.a[k];}}));return{k,A:anova2(Y,S)};});
  body=`<div class="tw"><table class="tbl" id="panel-qda-res"><thead><tr><th>Atributo</th>${lots.map(L=>`<th class="r">${lotLabel(L,P)}</th>`).join('')}<th class="r">Amostras diferem?</th><th class="r">Entre avaliadores</th></tr></thead><tbody>
  ${rows.map(({k,A})=>`<tr><td>${esc(SENS_BY[k].n)}</td>${lots.map(L=>{const x=A.ok?A.means.find(q=>q.s===L.id):null;return`<td class="r mono">${x?f1(x.m)+`<small class="muted"> [${f1(x.lo)}–${f1(x.hi)}]</small>`:'—'}</td>`;}).join('')}
   <td class="r">${A.ok?`<span class="chip ${A.pa<=.05?'ok':''}">${A.pa<=.05?'sim':'não detectado'}</span> <small class="muted">p ${pTxt(A.pa)}</small>`:`<span class="muted">${A.b} provador(es) completo(s)</span>`}</td>
   <td class="r">${A.ok?`<small class="mono">${f0(A.tasterShare*100)}% da variação</small>`:'—'}</td></tr>`).join('')}</tbody></table></div>
  <p class="note" style="margin:8px 0 0">Média e intervalo de 95% (ANOVA amostra × avaliador). "Entre avaliadores" é a parte da variação que vem de cada provador usar a escala do seu jeito; alta, ela pede treino com referências. Precisa de pelo menos 2 provadores que tenham avaliado todas as amostras.</p>`;}
 else if(P.m==='rank'){const R={};E.forEach(({L,ev})=>ev.forEach(e=>{(R[e.t||'?']=R[e.t||'?']||{})[L.id]=+e.r;}));const F=friedman(R,lots.map(L=>L.id));
  body=F.ok?`<div class="tw"><table class="tbl"><thead><tr><th>Amostra</th><th class="r">Soma dos postos</th><th class="r">Posição média</th></tr></thead><tbody>${F.sums.slice().sort((a,b)=>a.sum-b.sum).map(x=>{const L=lots.find(l=>l.id===x.s);return`<tr><td>${lotLabel(L,P)}</td><td class="r mono">${x.sum}</td><td class="r mono">${f1(x.mean)}</td></tr>`;}).join('')}</tbody></table></div>
   <p class="note" style="margin:8px 0 0">Critério: ${esc(P.crit)}. Teste de Friedman: ${F.p<=.05?'<b>a ordem não é aleatória</b>':'ordem não distinguível do acaso'} (χ² ${f1(F.chi)}, p ${pTxt(F.p)}). Somas que diferem em mais de ${f1(F.dmin)} indicam amostras diferentes (aproximação, sem correção para comparações múltiplas).</p>`
   :`<p class="muted">São necessários pelo menos 2 provadores que ordenaram todas as amostras.</p>`;}
 else if(P.m==='tds'){body=E.map(({L,ev})=>{const C=tdsCurves(ev,P.attrs);return`<div style="margin:6px 0 12px"><b>${lotLabel(L,P)}</b> <span class="muted">· ${ev.length} avaliação(ões)${C.ok?' · duração média '+f0(C.durMean)+' s':''}</span>${C.ok?tdsChart(C):''}</div>`;}).join('')+
  `<p class="note" style="margin:0">Fração dos provadores para quem cada sensação dominava, no tempo padronizado (do primeiro toque ao fim). Linha tracejada inferior: acaso; superior: significância de 5% (Pineau et al., 2009). Uma sensação acima da linha superior domina de fato naquele trecho.</p>`;}
 else{/* ponto ideal + aceitação */
  const st=ev=>{const g=k=>ciMean(ev.map(x=>x[k]).filter(v=>v!==''&&v!=null).map(Number));return{hed:g('hed'),jDoce:g('jDoce'),jDuro:g('jDuro'),jCrem:g('jCrem'),int:g('int'),pers:g('pers')};};
  const rows=E.map(x=>({L:x.L,ev:x.ev,s:st(x.ev)}));const Yh={};rows.forEach(({L,ev})=>ev.forEach(e=>{if(e.hed!=null&&e.t)(Yh[e.t]=Yh[e.t]||{})[L.id]=+e.hed;}));const Ah=anova2(Yh,lots.map(L=>L.id));
  const pen=['jDoce','jDuro','jCrem'].map(k=>({k,p:penalty(rows.flatMap(r=>r.ev),k)})).filter(x=>x.p);
  body=`<div class="tw"><table class="tbl"><thead><tr><th>Amostra</th><th class="r">Provadores</th><th class="r">Gostei (1–9)</th><th class="r">Doçura</th><th class="r">Dureza</th><th class="r">Cremosidade</th><th class="r">Intensidade</th><th class="r">Persistência</th></tr></thead><tbody>
  ${rows.map(({L,ev,s})=>`<tr><td>${lotLabel(L,P)}</td><td class="r mono">${ev.length}</td>${['hed','jDoce','jDuro','jCrem','int','pers'].map(k=>`<td class="r mono">${fmtCI(s[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
  <p class="note" style="margin:8px 0 0">Média [intervalo de 95%]. Ponto ideal: 0 = ideal; positivo = sobra, negativo = falta. ${Ah.ok?`Aceitação: ${Ah.pa<=.05?'<b>as amostras diferem</b>':'diferença não detectada'} (p ${pTxt(Ah.pa)}); ${f0(Ah.tasterShare*100)}% da variação vem de cada provador usar a escala do seu jeito.`:'Com 2 ou mais provadores que provaram todas as amostras, o app testa se a aceitação difere.'} É a preferência deste painel, não uma medida universal.</p>
  ${pen.length?`<h3 style="margin:12px 0 6px">O que mais custa na nota (análise de penalidade)</h3><div class="tw"><table class="tbl"><thead><tr><th>Atributo</th><th class="r">Achou pouco</th><th class="r">Ideal</th><th class="r">Achou demais</th></tr></thead><tbody>
   ${pen.map(({k,p})=>{const g=x=>`${f0(x.pct)}%${x.drop!=null&&x.lab!=='ideal'?` <small class="${x.relevant&&x.drop>0?'c-warn':'muted'}">−${f1(Math.max(0,x.drop))}</small>`:''}`;return`<tr><td>${{jDoce:'Doçura',jDuro:'Dureza',jCrem:'Cremosidade'}[k]}</td><td class="r mono">${g(p.lo)}</td><td class="r mono">${g(p.ideal)}</td><td class="r mono">${g(p.hi)}</td></tr>`;}).join('')}</tbody></table></div>
   <p class="note" style="margin:6px 0 0">Porcentagem de respostas e quanto a nota de aceitação cai em relação a quem achou ideal. Grupos com menos de 20% das respostas costumam ser desconsiderados.</p>`:''}
  <p class="note" style="margin:6px 0 0">${CAL.pref&&CAL.pref.n?'Preferência da casa aprendida ('+CAL.pref.n+' lote(s)): doçura '+(CAL.pref.pod>0?'+':'')+f1(CAL.pref.pod)+' pp de POD, água congelada '+(CAL.pref.fz>0?'+':'')+f0(CAL.pref.fz)+' pp. Vale para este painel; aplicada nas faixas do laudo com "Aplicar calibração" ligado.':'Com 3 ou mais provadores por lote, o motor ajusta as faixas de doçura e dureza ao gosto deste painel.'}</p>`;}
 return`<div class="card" id="panel-res"><div class="row"><h2 style="margin:0">Resultados${P.s?'':' · avaliações anteriores'}</h2>${tools}</div><div style="margin-top:10px">${body}</div></div>`;}
function tdsChart(C){const W=520,H=150,L=28,R=6,T=8,B=20,sx=b=>L+(b+.5)/C.bins*(W-L-R),sy=v=>T+(1-v)*(H-T-B);const cols=['var(--ice)','#fb923c','#a78bfa','var(--ok)','#f472b6','#facc15','#94a3b8','#f87171'];
 let g=`<line x1="${L}" x2="${W-R}" y1="${sy(C.P0)}" y2="${sy(C.P0)}" stroke="var(--t3)" stroke-dasharray="2 3"/><line x1="${L}" x2="${W-R}" y1="${sy(C.Ps)}" y2="${sy(C.Ps)}" stroke="var(--t2)" stroke-dasharray="5 3"/>`;
 [0,.5,1].forEach(v=>g+=`<text x="${L-4}" y="${sy(v)+3}" text-anchor="end" font-size="9" fill="var(--t3)">${f0(v*100)}%</text>`);
 C.curves.forEach((c,i)=>{g+=`<polyline points="${c.rate.map((v,b)=>sx(b).toFixed(1)+','+sy(v).toFixed(1)).join(' ')}" fill="none" stroke="${cols[i%cols.length]}" stroke-width="1.8"/>`;});
 g+=`<text x="${L}" y="${H-5}" font-size="9" fill="var(--t3)">início</text><text x="${W-R}" y="${H-5}" text-anchor="end" font-size="9" fill="var(--t3)">fim</text>`;
 return`<div style="overflow-x:auto"><svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:320px;height:auto;display:block" role="img" aria-label="Curvas de dominância temporal">${g}</svg></div>
  <div class="row" style="gap:10px;font-size:11.5px;flex-wrap:wrap">${C.curves.map((c,i)=>`<span><b style="color:${cols[i%cols.length]}">━</b> ${esc(SENS_BY[c.a].n)}</span>`).join('')}</div>`;}
/* ---------- física × percepção (todos os lotes) ---------- */
function bridgeCard(){if(!LOTS.some(L=>(L.panel||[]).length))return'';const B=sensBridge(LOTS);const rows=B.rows.filter(r=>r.lots).concat(B.hyp.filter(h=>h.lots));
 const ci=c=>c&&c.r!=null?`${f2(c.r)}${c.lo!=null?` <small class="muted">[${f2(c.lo)} a ${f2(c.hi)}]</small>`:''}`:'—';
 return`<div class="card" id="panel-bridge"><h2>Física × percepção</h2>
  <p class="note" style="margin:0 0 8px">Cada linha junta, lote a lote, a média do painel e a grandeza física do mesmo lote (medida quando você registrou, senão prevista pelo motor). Conclusão só com ${B.min} lotes ou mais. Correlação não é causa, e vale para este painel e estas receitas.</p>
  ${rows.length?`<div id="panel-bridge-rows">${rows.map(r=>`<div class="kv" style="display:block;padding:8px 0"><div class="row" style="gap:6px;align-items:baseline"><b>${esc(r.n)}</b><span class="sp"></span><span class="chip ${/provável/.test(r.verdict)?'ok':/insuficientes|variação/.test(r.verdict)?'':'warn'}">${esc(r.verdict)}</span></div>
   <div class="muted" style="font-size:12px;margin-top:2px">${r.inst?'× '+esc(r.inst)+' · ':''}${r.lots} lote(s)${r.measured?' ('+r.measured+' com medição)':''}${r.c&&r.c.r!=null?` · r = <span class="mono">${f2(r.c.r)}</span>${r.c.lo!=null?` [${f2(r.c.lo)} a ${f2(r.c.hi)}]`:''}`:''}${r.sdTaster!=null?' · desvio entre provadores '+f1(r.sdTaster):''}</div></div>`).join('')}</div>`
  :'<p class="muted">Ainda não há lotes avaliados com perfil por escala ou ponto ideal.</p>'}</div>`;}

/* ---------- ações ---------- */
const SENS_ACT={
 panelMethod:v=>{const P=panelState();if(P.s||!SENS_METHODS[v])return;P.m=v;const M=SENS_METHODS[v];if(P.lots.length>M.lots[1])P.lots=P.lots.slice(0,M.lots[1]);if(v==='tds'&&P.attrs.length<3)P.attrs=['doce','aroma','crem','frio'];P.codes={};savePanel();render();},
 panelAttr:v=>{const P=panelState();if(P.s||!SENS_BY[v])return;const i=P.attrs.indexOf(v);if(i>=0)P.attrs.splice(i,1);else if(P.attrs.length<8)P.attrs.push(v);savePanel();render();},
 panelStart:()=>{const P=panelState();if(!panelReady(P))return;if(!P.s){P.s='S'+Date.now().toString(36);P.nT=0;}
  if(!Object.keys(P.codes).length||P.lots.some(id=>!P.codes[id])){const used=new Set();P.codes={};P.lots.forEach(id=>{P.codes[id]=code3(used);});}
  P.order=panelOrder(P.lots,P.nT);P.i=0;P.cur={};P.tds=null;
  if(P.m==='tri'){const lay=TRI_LAY[P.nT%6];const used=new Set(Object.values(P.codes));const ids=P.lots;P.tri={lay,cups:[...lay].map(()=>code3(used)),ids:[...lay].map(c=>c==='A'?ids[0]:ids[1]),pick:null};}
  savePanel();render();},
 panelSet:v=>{const[k,x]=v.split('|');const P=panelState();if(P.m==='qda'){P.cur.a=Object.assign({},P.cur.a,{[k]:+x});}else P.cur[k]=+x;savePanel();render();},
 panelTri:v=>{const P=panelState();if(P.tri){P.tri.pick=+v;savePanel();render();}},
 panelRank:v=>{const P=panelState();const r=P.cur.rank=P.cur.rank||[];if(!r.includes(v))r.push(v);savePanel();render();},
 panelRankReset:()=>{const P=panelState();P.cur.rank=[];savePanel();render();},
 panelTdsGo:()=>{const P=panelState();P.tds={t0:Date.now(),seq:[],end:null};savePanel();render();},
 panelTdsTap:v=>{const P=panelState();const T=P.tds;if(!T||T.end!=null)return;const s=Math.round((Date.now()-T.t0)/100)/10;const last=T.seq[T.seq.length-1];if(!last||last[1]!==v)T.seq.push([s,v]);savePanel();render();},
 panelTdsEnd:()=>{const P=panelState();const T=P.tds;if(!T||!T.seq.length)return;T.end=Math.round((Date.now()-T.t0)/100)/10;savePanel();render();},
 panelNext:()=>{const P=panelState();const base={s:P.s,m:P.m,t:P.taster||'',date:today()};const add=(L,e)=>{if(!L)return;(L.panel=L.panel||[]).push(e);saveLot(L);};
  if(P.m==='tri'){const T=P.tri;if(!T||T.pick==null)return;const ids=P.lots;const odd=T.lay.split('').filter(c=>c==='A').length===1?'A':'B';const ok=T.lay[T.pick]===odd;const eid='e'+Date.now().toString(36);
   ids.forEach(id=>add(LOTS.find(l=>l.id===id),Object.assign({},base,{eid,lay:T.lay,ok,pick:T.cups[T.pick],pair:ids})));P.i=-1;}
  else if(P.m==='rank'){const r=P.cur.rank||[];if(r.length!==P.order.length)return;r.forEach((id,pos)=>add(LOTS.find(l=>l.id===id),Object.assign({},base,{code:P.codes[id],r:pos+1,k:r.length,crit:P.crit})));P.i=-1;}
  else{const L=LOTS.find(l=>l.id===P.order[P.i]);const cur=P.cur;
   if(P.m==='qda'){if(!P.attrs.every(k=>(cur.a||{})[k]!=null))return;add(L,Object.assign({},base,{code:P.codes[L.id],a:Object.assign({},cur.a)}));}
   else if(P.m==='tds'){const T=P.tds;if(!T||T.end==null)return;add(L,Object.assign({},base,{code:P.codes[L.id],seq:T.seq,end:T.end,attrs:P.attrs.slice()}));P.tds=null;}
   else{if(!cur.hed)return;add(L,Object.assign({},base,{code:P.codes[L.id]},cur));}
   P.i++;if(P.i>=P.order.length)P.i=-1;}
  P.cur={};if(P.i<0){P.nT++;P.taster='';P.tri=null;toast('Avaliações salvas nos lotes');}savePanel();render();},
 panelCancel:()=>{const P=panelState();P.i=-1;P.cur={};P.tri=null;P.tds=null;savePanel();render();},
 panelReveal:()=>{const P=panelState();P.reveal=!P.reveal;savePanel();render();},
 panelReset:()=>{const P=panelState();U.panel=Object.assign({},PANEL0,{m:P.m,attrs:P.attrs,crit:P.crit});savePanel();render();}};
const SENS_INP={panelTaster:v=>{panelState().taster=v;savePanel();},panelNote:v=>{panelState().cur.note=v;savePanel();},panelCrit:v=>{panelState().crit=String(v).slice(0,40)||'Preferência';savePanel();}};
const SENS_CHG={panelLot:t=>{const P=panelState();if(P.s)return false;const id=t.dataset.k;const M=SENS_METHODS[P.m];P.lots=P.lots.filter(x=>x!==id);if(t.checked&&P.lots.length<M.lots[1])P.lots.push(id);P.codes={};savePanel();}};
