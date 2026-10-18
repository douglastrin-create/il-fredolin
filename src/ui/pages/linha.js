/* ==== 59-linha.js ==== */
/* ===================== PRODUÇÃO AO VIVO =====================
   Cada calda em produção é um lote (coleção "lots", já sincronizada com a equipe e com regras de acesso no banco)
   com um fluxo: preparo → pasteurização → resfriamento → maturação → mantecação → endurecimento → freezer.
   Ideias das cozinhas de alta performance e das suítes de equipe:
   • KDS (kitchen display): cartão por calda, cronômetro com cor por urgência (verde pronto, âmbar atenção,
     vermelho fora do limite), "avançar" com um toque, voltar por engano (recall), contagem do dia;
   • quadro (Trello/Linear): colunas por etapa, cartões com responsável e etiqueta de cor;
   • linha do tempo (Gantt/Asana): o que já aconteceu e a previsão de cada etapa até o freezer;
   • APPCC automático: tempos medidos pelo próprio fluxo (resfriamento, maturação) entram no registro do lote.
   Os alvos de cada etapa vêm do motor: maturação pelo modelo cinético (ideal, não compensa, máximo),
   endurecimento pelo conjunto de equipamentos, horizonte de textura pelo modelo de cristais (não é validade sanitária). */
const FLOW=[['prep','Preparo','pesagem e mistura'],['past','Pasteurização','aquecer e manter'],['cool','Resfriamento','até 4–6 °C'],['mat','Maturação','na geladeira'],['mant','Mantecação','na máquina'],['hard','Endurecimento','freezer / abatedor'],['store','No freezer','pronto para servir'],['done','Concluído',''],['disc','Descartado','']];
const FLOW_N={};FLOW.forEach(([k,n])=>FLOW_N[k]=n);
const FLOW_COL=['#7dd3fc','#6ee7b7','#f6c90e','#fb923c','#f472b6','#a78bfa'];
const FLOW_ACTIVE=['prep','past','cool','mat','mant','hard','store'];
/* sequência do lote: sem pasteurização (base a frio) pula aquecimento e resfriamento */
const flowSeq=L=>FLOW_ACTIVE.filter(k=>!(+((L.proc||{}).pastT)<50&&(k==='past'||k==='cool')));
/* alvos calculados no início (o lote guarda a receita; o alvo não muda se a bancada mudar depois) */
function flowTargets(st,m){const pr=m.pr;const out={prep:{t:25,late:60}};
 const ramp=+pr.pastT>25?(+pr.pastT-25)/2:0;const hold=holdS(pr)/60;out.past={t:Math.round(ramp+hold),late:Math.round(ramp+hold+30)};
 out.cool={t:+pr.coolMin||60,late:90,crit:120};
 let R=null;try{R=matModel(st,m);}catch(e){}
 if(R)out.mat={t:R.tIdeal[1]*60,lo:R.tIdeal[0]*60,hi:R.tIdeal[2]*60,late:R.tPlat[1]*60,crit:(R.tMax[0]!=null?R.tMax[0]:72)*60,min:R.t80[1]!=null?R.t80[1]*60:null,T:R.FT.mu};
 else out.mat={t:(+pr.matH||8)*60,late:((+pr.matH||8)+4)*60,crit:72*60};
 out.mant={t:+pr.drawMin||10,late:(+pr.drawMin||10)+10};
 let hm=+pr.hardMin||40;try{if(pr.serveFrom==='pote'||pr.hardAuto){const H=hardenModel(m,pr);if(H&&H.tDone)hm=H.tDone;}}catch(e){}
 out.hard={t:Math.round(hm),late:Math.round(hm*1.5)};
 const days=pr.serveFrom==='vitrine'?Math.min(m.shelfVit||7,30):Math.min(m.shelfStore||30,90);out.store={t:days*1440,late:days*1440*.8,crit:days*1440,days};
 return out;}
let FLOW_LET=0;
function flowNextLabel(){const used=new Set(LOTS.filter(l=>l.flow&&FLOW_ACTIVE.includes(l.flow.stage)).map(l=>l.flow.label));for(let i=0;i<26;i++){const n='Calda '+String.fromCharCode(65+i);if(!used.has(n))return n;}return'Calda '+(++FLOW_LET);}
function flowNew(){const m=analyze(S);if(m.empty)return null;const L=newLotFromBench();if(!L)return null;const now=Date.now();
 const used=LOTS.filter(l=>l.flow&&FLOW_ACTIVE.includes(l.flow.stage)).length;
 L.flow={label:flowNextLabel(),color:FLOW_COL[used%FLOW_COL.length],stage:'prep',ev:[{s:'prep',at:now,by:ME.email||''}],tg:flowTargets(S,m),kg:Math.round(m.tot)/1000,owner:ME.email||''};
 return L;}
const flowLots=()=>LOTS.filter(l=>l.flow);
const flowSince=L=>{const e=(L.flow.ev||[]).filter(x=>x.s===L.flow.stage).slice(-1)[0];return e?e.at:Date.now();};
/* estado do cronômetro da etapa: run (correndo), ready (no ponto), late (passou do ideal), crit (fora do limite) */
function flowState(L,now){now=now||Date.now();const f=L.flow,k=f.stage,tg=(f.tg||{})[k]||{};const el=(now-flowSince(L))/60000;
 if(k==='done'||k==='disc')return{k,el,lvl:'idle',pct:1};
 let lvl='run';if(tg.crit!=null&&el>=tg.crit)lvl='crit';else if(tg.late!=null&&el>=tg.late)lvl='late';else if(tg.t!=null&&el>=tg.t)lvl='ready';
 if(k==='store')lvl=el>=tg.crit?'crit':el>=tg.late?'late':'ready';
 const pct=tg.t?clamp(el/tg.t,0,1):0;const eta=tg.t!=null?tg.t-el:null;return{k,el,tg,lvl,pct,eta};}
const fDur=min=>{min=Math.max(0,min);if(min<1)return'agora';if(min<60)return f0(min)+' min';if(min<1440){const t=Math.round(min),h=Math.floor(t/60),mm=t%60;return h+' h'+(mm?' '+String(mm).padStart(2,'0'):'');}return fT(Math.round(min/144)/10)+' d';};
function flowMsg(L,s){const k=s.k,tg=s.tg||{};
 if(k==='mat'){if(s.lvl==='crit')return'Passou do máximo (qualidade/segurança): avalie antes de usar';if(s.lvl==='late')return'No ponto há '+fDur(s.el-tg.t)+' · ganho já mínimo';if(s.lvl==='ready')return'Pronta para a mantecadora';return'Pronta em '+fDur(s.eta)+(tg.min!=null&&s.el>=tg.min?' · já utilizável':'');}
 if(k==='cool'){if(s.lvl==='crit')return'Resfriamento acima de 120 min: fora do APPCC';if(s.lvl==='late')return'Resfriamento lento: use banho de gelo';return s.lvl==='ready'?'Meça: abaixo de 6 °C, vá para a geladeira':'Meta '+fDur(tg.t)+' · faltam '+fDur(s.eta);}
 if(k==='past')return s.lvl==='run'?'Termina em '+fDur(s.eta):'Patamar cumprido: resfrie já';
 if(k==='mant')return s.lvl==='run'?'Saída em ~'+fDur(s.eta):'Confira a saída e passe ao freezer';
 if(k==='hard')return s.lvl==='run'?'Centro a −18 °C em '+fDur(s.eta):'Endurecido: pronto para servir';
 if(k==='store'){const left=tg.t-s.el;return s.lvl==='crit'?'Passou do horizonte de textura previsto ('+fT(tg.days)+' d) · não é validade sanitária':'Textura estável por ~'+fDur(left)+' (estimativa)';}
 if(k==='prep')return'Em preparo há '+fDur(s.el);return'';}
function flowRing(s,col){const r=17,c=2*Math.PI*r;const p=s.k==='store'?clamp(1-s.el/(s.tg.t||1),0,1):s.pct;const cc={run:col,ready:'var(--ok)',late:'var(--warn)',crit:'var(--crit)',idle:'var(--t3)'}[s.lvl];
 return`<svg class="fring" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="${r}" fill="none" stroke="var(--line2)" stroke-width="4"/><circle cx="22" cy="22" r="${r}" fill="none" stroke="${cc}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(p*c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 22 22)"/>${s.lvl==='ready'?'<path d="M15 22.5l4.5 4.5 9-10" fill="none" stroke="var(--ok)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>':`<text x="22" y="26" text-anchor="middle" font-size="10.5" fill="var(--t1)" font-family="var(--fm)">${s.k==='store'?f0(p*100):f0(s.pct*100)}%</text>`}</svg>`;}
/* ---------- v17.8 · cartão da calda: etapa atual em destaque, etapas concluídas com check, cronômetro grande ---------- */
const FLOW_SH={prep:'Preparo',past:'Pasteur.',cool:'Resfriar',mat:'Maturação',mant:'Mantecar',hard:'Endurecer',store:'Freezer'};
const hm=min=>{min=Math.max(0,Math.round(min));const h=Math.floor(min/60),mm=min%60;return h?h+':'+String(mm).padStart(2,'0'):mm+' min';};
function flowTimer(s,col){const r=40,c=2*Math.PI*r,tg=s.tg||{};const store=s.k==='store',prep=s.k==='prep';
 const p=store?clamp(1-s.el/(tg.t||1),0,1):prep?0:s.pct;const cc={run:col,ready:'var(--ok)',late:'var(--warn)',crit:'var(--crit)',idle:'var(--t3)'}[s.lvl];
 let big,sub;if(prep){big=hm(s.el);sub='decorridos';}
 else if(store){const d=Math.max(0,tg.t-s.el)/1440;if(d>=1){big=fT(Math.round(d*10)/10);sub=(d>=2?'dias':'dia')+' de textura (est.)';}else{big=hm(tg.t-s.el);sub='de textura (est.)';}}
 else if(s.lvl==='run'&&s.eta!=null){big=hm(s.eta);sub=s.k==='mat'?'para o ideal':'restantes';}
 else if(s.lvl==='ready'){big='✓';sub='no ponto';}
 else{big='+'+hm(s.el-(tg.t||0));sub=s.lvl==='crit'?'fora do limite':'além do ideal';}
 return`<div class="ftimer lvl-${s.lvl}"><svg viewBox="0 0 96 96" aria-hidden="true"><circle cx="48" cy="48" r="${r}" fill="none" stroke="var(--line2)" stroke-width="6"/><circle cx="48" cy="48" r="${r}" fill="none" stroke="${cc}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(p*c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 48 48)"/></svg><div class="ftv"><b${String(big).length>5?' class="long"':''}>${big}</b><small>${sub}</small></div></div>`;}
/* régua da maturação: utilizável → ideal → não compensa → máximo, com o "agora" */
function matTrack(s){const tg=s.tg||{};if(s.k!=='mat'||!tg.t)return'';const end=Math.max(tg.late||tg.t*1.3,tg.hi||0,s.el)*1.12;const x=v=>clamp(v/end*100,0,100);
 const lo=tg.lo||tg.t*.9,hi=tg.hi||tg.t*1.1,mn=tg.min!=null?tg.min:lo*.4,late=tg.late||hi*1.2;
 const seg=(a,b,cls)=>`<i class="${cls}" style="left:${x(a)}%;width:${Math.max(.5,x(b)-x(a))}%"></i>`;
 return`<div class="mtrack" role="img" aria-label="Maturação: ${fDur(s.el)} de ${fDur(tg.t)} ideais">${seg(0,mn,'m0')}${seg(mn,lo,'m1')}${seg(lo,hi,'m2')}${seg(hi,late,'m3')}${seg(late,end,'m4')}<b style="left:${x(s.el)}%"></b></div>
  <div class="mlegend"><span>utilizável ${fDur(mn)}</span><span class="c-ok">ideal ${fDur(lo)}–${fDur(hi)}</span><span>máx. ${fDur(tg.crit||late)}</span></div>`;}
function flowSteps(L){const seq=flowSeq(L),ci=seq.indexOf(L.flow.stage);const done=L.flow.stage==='done';
 return`<ol class="fsteps" style="--n:${seq.length}">${seq.map((k,i)=>{const st=done||i<ci?'done':i===ci?'cur':'';return`<li class="${st}"><i>${st==='done'?'<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.3l2.3 2.3 4.7-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>':''}</i><span>${FLOW_SH[k]||FLOW_N[k]}</span></li>`;}).join('')}</ol>`;}
function flowCard(L,now){const f=L.flow,s=flowState(L,now),seq=flowSeq(L),i=seq.indexOf(f.stage),nx=seq[i+1]||'done';const open=U.flowOpen===L.id;const col=f.color||'#7dd3fc';
 const since=new Date(flowSince(L)).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});const tg=s.tg||{};
 return`<article class="fcard lvl-${s.lvl}${open?' open':''}" style="--fc:${col}">
  <div class="fhead"><span class="fdot"></span><div class="ftit"><button class="fname" data-a="flowOpen" data-v="${L.id}" aria-expanded="${open}">${esc(f.label||L.code)}</button><small>${esc(L.name||'')} · ${fT(f.kg||0)} kg · <span class="mono">${esc(L.code)}</span></small></div>${f.owner?`<span class="fown" title="${esc(f.owner)}">${esc(f.owner.split('@')[0].slice(0,2).toUpperCase())}</span>`:''}</div>
  ${flowSteps(L)}
  <div class="fbody">${flowTimer(s,col)}<div class="finfo"><div class="fstage">${FLOW_N[f.stage]}</div><p class="fmsg">${esc(flowMsg(L,s))}</p><div class="fsub">desde ${since}${tg.t&&f.stage!=='store'&&f.stage!=='prep'?' · alvo '+fDur(tg.t):''}</div>${matTrack(s)}</div></div>
  ${FLOW_ACTIVE.includes(f.stage)?`<div class="fact"><button class="btn ${s.lvl==='ready'||s.lvl==='late'?'okb':'pri'}" data-a="flowNext" data-v="${L.id}">${nx==='done'?'Concluir (servido)':'Concluir etapa → '+FLOW_N[nx]}</button><button class="btn sm ghost" data-a="flowOpen" data-v="${L.id}">${open?'Fechar':'Detalhes'}</button></div>`:''}
  ${open?flowDetail(L,s):''}</article>`;}
const FLOW_PRI={crit:0,late:1,ready:2,run:3,idle:4};
function flowDetail(L,s){const f=L.flow,me=L.meas||{};const tg=f.tg||{};
 const inp=(k,lab,ph)=>`<label class="field"><span class="lbl">${lab}</span><input type="number" id="fm-${L.id}-${k}" data-i="flowMeas" data-id="${L.id}" data-k="${k}" value="${me[k]!=null?esc(String(me[k])):''}" step=".1" placeholder="${ph||''}"></label>`;
 const m=f.stage==='past'?inp('pastT','Temperatura medida (°C)','85'):f.stage==='mat'?inp('matT','Geladeira medida (°C)',tg.mat&&tg.mat.T!=null?fT(Math.round(tg.mat.T*10)/10):'4'):f.stage==='mant'?inp('drawT','Saída medida (°C)','−9'):'';
 return`<div class="fdet">
  <label class="field"><span class="lbl">Nome da calda</span><input type="text" id="fl-${L.id}" data-i="flowLabel" data-id="${L.id}" value="${esc(f.label||'')}" maxlength="32"></label>
  <div class="chips" style="margin:6px 0" role="group" aria-label="Cor">${FLOW_COL.map(c=>`<button data-a="flowColor" data-v="${L.id}|${c}" aria-pressed="${f.color===c}" aria-label="Cor" style="width:26px;height:26px;padding:0;background:${c};border-color:${f.color===c?'var(--t1)':'transparent'}"></button>`).join('')}</div>
  ${m?`<div class="form" style="grid-template-columns:minmax(0,1fr)">${m}</div>`:''}
  ${f.stage==='mat'&&tg.mat?`<p class="note" style="margin:6px 0">Maturação calculada: ideal ${fDur(tg.mat.t)} (faixa ${fDur(tg.mat.lo||tg.mat.t)}–${fDur(tg.mat.hi||tg.mat.t)}), não compensa passar de ${fDur(tg.mat.late)}, máximo ${fDur(tg.mat.crit)}.</p>`:''}
  <ol class="flog">${(f.ev||[]).map(e=>`<li><span class="mono">${new Date(e.at).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span> ${FLOW_N[e.s]||e.s}${e.by?` <small class="muted">· ${esc(e.by.split('@')[0])}</small>`:''}</li>`).join('')}</ol>
  <div class="row" style="gap:6px;margin-top:6px">${(f.ev||[]).length>1?`<button class="btn sm" data-a="flowBack" data-v="${L.id}">Voltar etapa</button>`:''}${FLOW_ACTIVE.includes(f.stage)?`<button class="btn sm del" data-a="flowDisc" data-v="${L.id}">Descartar</button>`:''}<button class="btn sm" data-a="flowLot" data-v="${L.id}">Registro do lote</button></div>
  <pre class="flabel" aria-label="Etiqueta">${esc(flowLabelText(L))}</pre></div>`;}
function flowLabelText(L){const f=L.flow;const ev=k=>(f.ev||[]).find(e=>e.s===k);const d=t=>new Date(t).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
 const mat=ev('mat'),st=ev('store')||ev('hard');const al=[...new Set((L.recipe||[]).flatMap(r=>(ING_BY[r.id]&&ING_BY[r.id].al)||[]))];
 return[(f.label||'')+' · '+(L.name||''),L.code+' · '+fT(f.kg||0)+' kg',mat?'Maturação: '+d(mat.at)+(f.tg&&f.tg.mat?' → pronta ~'+d(mat.at+f.tg.mat.t*60000):''):'',st&&f.tg&&f.tg.store?'Freezer: '+d(st.at)+' · textura estável até ~'+d(st.at+f.tg.store.t*60000)+' (est.)':'',al.length?'Contém: '+al.join(', '):'',f.owner?'Resp.: '+f.owner.split('@')[0]:''].filter(Boolean).join('\n');}
/* linha do tempo (Gantt): passado real + previsão de cada etapa até o freezer */
function flowGantt(list,now){if(!list.length)return'';const W=760,rowH=30,L0=120,R0=10,T0=22;const t0=now-6*3600e3,t1=now+18*3600e3;const H=T0+list.length*rowH+8;
 const sx=t=>L0+(clamp(t,t0,t1)-t0)/(t1-t0)*(W-L0-R0);let g='';
 for(let h=-6;h<=18;h+=3){const t=now+h*3600e3;g+=`<line x1="${sx(t)}" x2="${sx(t)}" y1="${T0-6}" y2="${H}" stroke="var(--line)" stroke-dasharray="2 4"/><text x="${sx(t)}" y="12" text-anchor="middle" font-size="9.5" fill="var(--t3)">${h===0?'agora':new Date(t).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</text>`;}
 list.forEach((L,ri)=>{const f=L.flow,y=T0+ri*rowH;const seq=flowSeq(L);g+=`<text x="4" y="${y+17}" font-size="11" fill="var(--t1)">${esc((f.label||L.code).slice(0,16))}</text>`;
  const ev=f.ev||[];ev.forEach((e,j)=>{const end=j<ev.length-1?ev[j+1].at:now;if(e.s==='done'||e.s==='disc')return;const x1=sx(e.at),x2=sx(end);if(x2-x1<.5)return;
   g+=`<rect x="${x1}" y="${y+5}" width="${Math.max(1,x2-x1)}" height="18" rx="4" fill="${f.color||'#7dd3fc'}" opacity="${j===ev.length-1?.95:.55}"><title>${FLOW_N[e.s]}</title></rect>`;});
  /* previsão */
  let t=flowSince(L);const i=seq.indexOf(f.stage);if(i>=0){const tg=f.tg||{};for(let j=i;j<seq.length-1;j++){const k=seq[j];const dur=((tg[k]||{}).t||30)*60000;const st=j===i?t:t;const en=j===i?Math.max(now,t+dur):t+dur;if(j>i){g+=`<rect x="${sx(st)}" y="${y+5}" width="${Math.max(1,sx(en)-sx(st))}" height="18" rx="4" fill="none" stroke="${f.color||'#7dd3fc'}" stroke-dasharray="3 3" opacity=".8"><title>${FLOW_N[k]} (previsto)</title></rect>`;}
   else if(en>now)g+=`<rect x="${sx(now)}" y="${y+5}" width="${Math.max(1,sx(en)-sx(now))}" height="18" rx="4" fill="${f.color||'#7dd3fc'}" opacity=".18"/>`;
   t=en;}
   g+=`<circle cx="${sx(t)}" cy="${y+14}" r="4" fill="var(--ok)"><title>No freezer (previsto)</title></circle>`;}});
 g+=`<line x1="${sx(now)}" x2="${sx(now)}" y1="${T0-8}" y2="${H}" stroke="var(--ice)" stroke-width="1.6"/>`;
 return`<svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:560px;height:auto;display:block" role="img" aria-label="Linha do tempo da produção">${g}</svg>`;}
function pgLinha(m){const now=Date.now();const all=flowLots();const act=all.filter(L=>FLOW_ACTIVE.includes(L.flow.stage));const st=act.map(L=>flowState(L,now));
 const cnt=k=>act.filter(L=>L.flow.stage===k).length;const al=st.filter(s=>s.lvl==='crit'||s.lvl==='late').length;const rd=act.filter((L,i)=>L.flow.stage==='mat'&&st[i].lvl!=='run').length;
 const day=new Date().toISOString().slice(0,10);const todayKg=all.filter(L=>(L.flow.ev||[]).some(e=>e.s==='mant'&&new Date(e.at).toISOString().slice(0,10)===day)).reduce((a,L)=>a+(+L.flow.kg||0),0);
 const view=U.flowView||'quadro';const cols=[['prep','Preparo'],['heat','Pasteurização e resfriamento'],['mat','Maturação'],['mant','Mantecadora'],['hard','Endurecendo'],['store','No freezer']];
 const inCol=(L,c)=>c==='heat'?['past','cool'].includes(L.flow.stage):L.flow.stage===c;
 const hist=all.filter(L=>['done','disc'].includes(L.flow.stage)).slice(0,8);
 const kpi=(n,v,sub,cls)=>`<div class="fkpi ${cls||''}${v&&v!=='0'&&v!==0?' on':''}"><b>${v}</b><span>${n}${sub?' · '+sub:''}</span></div>`;
 const notif=typeof Notification!=='undefined'?Notification.permission:'na';
 return`<div class="pg"><div class="row" style="align-items:flex-end"><div style="flex:1;min-width:240px"><h1>Produção ao vivo</h1><p class="lead">Cada calda com cronômetro e alvo calculado pelo motor. A equipe inteira vê o que está maturando, o que está na mantecadora e o que já está no freezer.</p></div>
  <div class="row" style="gap:8px">${notif==='default'?'<button class="btn sm" data-a="flowNotify">Ativar avisos</button>':notif==='granted'?'<span class="chip ok">Avisos ativos</span>':''}${can.edit()||ROLE==='sous'?`<button class="btn pri" data-a="flowStart"${m.empty?' disabled':''}>+ Iniciar calda: ${esc(S.name||'bancada')}</button>`:''}</div></div>
 <div class="fkpis">${kpi('Maturando',cnt('mat'),rd?rd+' pronta'+(rd>1?'s':''):'')}${kpi('Mantecadora',cnt('mant'))}${kpi('Endurecendo',cnt('hard'))}${kpi('No freezer',cnt('store'),act.filter(L=>L.flow.stage==='store').reduce((a,L)=>a+(+L.flow.kg||0),0).toFixed(1).replace('.',',')+' kg')}${kpi('Atenção',al,al?'ver cartões':'tudo no prazo',al?'warn':'')}${kpi('Hoje',fT(Math.round(todayKg*10)/10)+' kg','mantecados')}</div>
 <div class="seg" role="tablist" aria-label="Visualização" style="margin:0 0 14px">${[['quadro','Caldas'],['tempo','Linha do tempo']].map(([k,n])=>`<button role="tab" data-a="flowView" data-v="${k}" aria-selected="${view===k}">${n}</button>`).join('')}</div>
 ${!act.length?`<div class="card"><p class="muted" style="margin:0">Nenhuma calda em produção. Escolha uma receita aprovada abaixo (Produzir) ou abra uma receita na Bancada e toque em <b>Iniciar calda</b>: o app passa a cronometrar cada etapa e avisa quando a maturação chegar ao ponto.</p></div>`:
  view==='tempo'?`<div class="card" style="overflow-x:auto">${flowGantt(act,now)}<p class="note">Barras cheias: o que já aconteceu. Tracejado: previsão pelos alvos do motor. Ponto verde: chegada prevista ao freezer.</p></div>`:
  `<div class="flist">${act.map((L,i)=>({L,s:st[i]})).sort((a,b)=>(FLOW_PRI[a.s.lvl]-FLOW_PRI[b.s.lvl])||((a.s.eta==null?1e9:a.s.eta)-(b.s.eta==null?1e9:b.s.eta))).map(x=>flowCard(x.L,now)).join('')}</div>`}
 ${hist.length?`<div class="card"><h2>Recentes</h2>${hist.map(L=>`<div class="kv"><span><i class="sw" style="background:${L.flow.color}"></i>${esc(L.flow.label)} · ${esc(L.name||'')}</span><span class="muted" style="font-size:12px">${FLOW_N[L.flow.stage]} · ${new Date(flowSince(L)).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span></div>`).join('')}</div>`:''}
 <p class="note">Os avisos aparecem com o app aberto (inclusive em outra aba ou com a tela do app em segundo plano). Os tempos medidos pelo fluxo (resfriamento, maturação) entram sozinhos no registro do lote para o APPCC e para a calibração.</p></div>`;}
/* ---------- avisos: verifica a cada 30 s e quando o app volta à frente ---------- */
const FLOW_SEEN_K='fredolin_flow_seen';
function flowAlerts(now){const seen=LS.get(FLOW_SEEN_K)||{};const out=[];
 flowLots().forEach(L=>{if(!FLOW_ACTIVE.includes(L.flow.stage))return;const s=flowState(L,now);if(s.lvl==='run')return;const key=L.id+'|'+L.flow.stage+'|'+flowSince(L)+'|'+s.lvl;if(seen[key])return;seen[key]=now;
  out.push({L,s,title:(L.flow.label||L.code)+' · '+FLOW_N[L.flow.stage],body:flowMsg(L,s)});});
 if(out.length){const keys=Object.keys(seen);if(keys.length>300)keys.slice(0,keys.length-300).forEach(k=>delete seen[k]);LS.set(FLOW_SEEN_K,seen);}return out;}
function flowBeep(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const c=new A(),o=c.createOscillator(),g=c.createGain();o.frequency.value=880;g.gain.value=.08;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.25);}catch(e){}}
function flowNotify(a){toast(a.title+': '+a.body);try{if(navigator.vibrate)navigator.vibrate([120,60,120]);}catch(e){}flowBeep();
 try{if(typeof Notification!=='undefined'&&Notification.permission==='granted'){const opt={body:a.body,tag:a.L.id+a.L.flow.stage,icon:'icons/icon-192.png'};
  if(navigator.serviceWorker&&navigator.serviceWorker.ready)navigator.serviceWorker.ready.then(r=>r.showNotification(a.title,opt)).catch(()=>{try{new Notification(a.title,opt);}catch(e){}});else new Notification(a.title,opt);}}catch(e){}}
function flowTick(){const a=flowAlerts(Date.now());a.forEach(flowNotify);if(S.page==='linha'&&!document.hidden)render();}
if(typeof window!=='undefined'&&window.document&&typeof setInterval==='function'){setInterval(flowTick,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)flowTick();});setTimeout(flowTick,4000);}
/* ao sair de uma etapa, o tempo medido vai para o registro do lote (APPCC) */
function flowRecord(L,from,mins){L.meas=L.meas||{};if(from==='cool')L.meas.coolMin=Math.round(mins);if(from==='mat'){L.meas.matH=Math.round(mins/6)/10;if(L.meas.matT==null||L.meas.matT===''){const T=L.flow.tg&&L.flow.tg.mat&&L.flow.tg.mat.T;const ms=typeof matState==='function'?matState():null;if(T!=null&&ms&&fridgeT(ms).src==='medida')L.meas.matT=Math.round(T*10)/10;}}}
const flowFind=id=>LOTS.find(l=>l.id===id&&l.flow);
const FLOW_ACT={
 flowStart:()=>{const L=flowNew();if(!L){toast('Abra uma receita primeiro');return;}saveLot(L);S.page='linha';U.flowOpen=null;render();toast(L.flow.label+' iniciada · '+L.code);},
 flowNext:v=>{const L=flowFind(v);if(!L)return;const f=L.flow,seq=flowSeq(L),i=seq.indexOf(f.stage);const nx=seq[i+1]||'done';const now=Date.now();flowRecord(L,f.stage,(now-flowSince(L))/60000);
  f.stage=nx;f.ev=(f.ev||[]).concat([{s:nx,at:now,by:ME.email||''}]);saveLot(L);render();toast(f.label+' → '+FLOW_N[nx]);},
 flowBack:v=>{const L=flowFind(v);if(!L)return;const f=L.flow;if((f.ev||[]).length<2)return;f.ev=f.ev.slice(0,-1);f.stage=f.ev[f.ev.length-1].s;saveLot(L);render();toast(f.label+' voltou para '+FLOW_N[f.stage]);},
 flowDisc:v=>{const L=flowFind(v);if(!L)return;const f=L.flow;f.stage='disc';f.ev=(f.ev||[]).concat([{s:'disc',at:Date.now(),by:ME.email||''}]);saveLot(L);U.flowOpen=null;render();toast(f.label+' descartada');},
 flowOpen:v=>{U.flowOpen=U.flowOpen===v?null:v;render();},
 flowColor:v=>{const[id,c]=String(v).split('|');const L=flowFind(id);if(!L||!FLOW_COL.includes(c))return;L.flow.color=c;saveLot(L);render();},
 flowView:v=>{U.flowView=v==='tempo'?'tempo':'quadro';render();},
 flowLot:v=>{U.lotOpen=v;S.page='lotes';render();},
 flowNotify:()=>{try{if(typeof Notification!=='undefined'&&Notification.requestPermission)Notification.requestPermission().then(()=>render());}catch(e){}}};
const FLOW_INP={
 flowLabel:(v,t)=>{const L=flowFind(t.dataset.id);if(!L)return;L.flow.label=String(v).slice(0,32);saveLotSoon(L);},
 flowMeas:(v,t)=>{const L=flowFind(t.dataset.id);if(!L)return;const k=t.dataset.k;if(!['pastT','matT','drawT'].includes(k))return;L.meas=L.meas||{};L.meas[k]=v===''?'':num(v,-40,120,0);saveLotSoon(L);}};

