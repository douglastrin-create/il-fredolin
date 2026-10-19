/* ==== 45-shell.js ==== */
/* ===================== IL FREDOLIN · ESTRUTURA DO APLICATIVO =====================
   Navegação por tarefa (Formular, Analisar, Produzir, Acervo, Gestão) que se adapta à tela:
   barra lateral completa no computador, trilho de ícones no iPad, abas inferiores no celular.
   Termômetro da receita no topo, paleta de comandos (⌘K) e desfazer (⌘Z). */

const FAMILIES=[
 ['formular','Formular',[['bancada','Bancada'],['creator','Creator'],['processo','Processo e equipamentos'],['componentes','Componentes']]],
 ['analisar','Analisar',[['laudo','Laudo técnico'],['vitrine','Vitrine'],['defeitos','Diagnóstico de defeitos'],['ciencia','Ciência do motor']]],
 ['produzir','Produzir',[['linha','Produção ao vivo'],['producao','Ficha de produção'],['lotes','Lotes e qualidade'],['planejamento','Planejamento e estoque']]],
 ['acervo','Acervo',[['biblioteca','Biblioteca'],['ingredientes','Ingredientes'],['sazonal','Frutas da estação']]],
 ['gestao','Gestão',[['rotulo','Rótulo e alérgenos'],['custos','Custos'],...(APP_MODE==='app'?[['equipe','Equipe']]:[]),['dados','Dados e sincronização']]]
];
/* v17.7 · páginas que viraram seções de outra (a chave antiga continua valendo: links, testes, estado salvo, busca) */
const PAGE_ALIAS={congelamento:['laudo','congelamento','Congelamento'],quimica:['laudo','quimica','Química e estabilidade da textura'],brix:['bancada',null,'Calibração Brix'],
 execucao:['linha',null,'Receitas em execução'],degustacao:['lotes','painel','Painel cego'],estoque:['planejamento','estoque','Estoque']};
function pageResolve(){const k=S.page,al=PAGE_ALIAS[k];if(!al)return;S.page=al[0];if(al[1]){U.sub=U.sub||{};U.sub[al[0]]=al[1];}if(k==='brix')U.brixOpen=1;}
/* seções recolhíveis guardam o estado aberto/fechado (antes fechavam a cada digitação) */
const dOpen=(id,def)=>{const o=U.dopen&&U.dopen[id];return(o==null?def:o)?' open':'';};
const subOf=(pg,def)=>(U.sub&&U.sub[pg])||def;
/* usa uma página antiga como seção de outra: tira o invólucro .pg e o título; devolve a descrição (lead) e o corpo */
function embedPg(h){h=String(h||'').trim();const o=h.match(/^<div class="pg[^"]*">([\s\S]*)<\/div>$/);if(o)h=o[1].trim();
 const r=h.match(/^(?:<div[^>]*>\s*)?<h1[^>]*>[\s\S]*?<\/h1>\s*(?:<p class="lead"[^>]*>([\s\S]*?)<\/p>)?\s*(?:<\/div>)?/);
 if(!r)return{lead:'',body:h};let body=h.slice(r[0].length);
 /* cabeçalhos que trazem controles ao lado do título (ex.: lotes) ficam no corpo */
 return{lead:r[1]||'',body};}
/* seletor de seção dentro de uma página (mesmo componente em todas) */
const segHTML=(pg,items,cur,label)=>`<div class="seg" role="tablist" aria-label="${esc(label||'Seções')}">${items.map(([k,n])=>`<button role="tab" data-a="sub" data-v="${pg}:${k}" aria-selected="${cur===k}">${n}</button>`).join('')}</div>`;
/* formato antigo (grupo, páginas), usado pelos testes e pela busca */
const PAGES=FAMILIES.map(([,n,p])=>[n,p]);
const PAGE_N={};const PAGE_FAM={};FAMILIES.forEach(([f,,p])=>p.forEach(([k,n])=>{PAGE_N[k]=n;PAGE_FAM[k]=f;}));
const famPages=f=>(FAMILIES.find(x=>x[0]===f)||[null,null,[]])[2].filter(([k])=>can.page(k));

/* ícones de traço, desenhados para o app (20 × 20) */
const ICO={
 formular:'<path d="M8 2.8h4M8.8 2.8v5.1L4.3 15.4a1.6 1.6 0 0 0 1.4 2.4h8.6a1.6 1.6 0 0 0 1.4-2.4L11.2 7.9V2.8"/><path d="M6 12.6h8"/>',
 analisar:'<path d="M3.2 14.6a6.8 6.8 0 1 1 13.6 0"/><path d="M10 14.6l3.4-4.2"/><circle cx="10" cy="14.6" r="1.2"/>',
 produzir:'<path d="M2.8 7.2 10 3.2l7.2 4-7.2 4z"/><path d="M2.8 7.2v5.8l7.2 4 7.2-4V7.2"/><path d="M10 11.2V17"/>',
 acervo:'<path d="M4 4.2c0-.8.6-1.4 1.4-1.4H10v13.6H5.4c-.8 0-1.4.6-1.4 1.4z"/><path d="M16 4.2c0-.8-.6-1.4-1.4-1.4H10v13.6h4.6c.8 0 1.4.6 1.4 1.4z"/>',
 gestao:'<path d="M3.5 6h13M3.5 14h13"/><circle cx="7.5" cy="6" r="1.9"/><circle cx="12.5" cy="14" r="1.9"/>',
 busca:'<circle cx="8.8" cy="8.8" r="5.3"/><path d="m12.8 12.8 4.2 4.2"/>',
 lado:'<rect x="2.8" y="3.8" width="14.4" height="12.4" rx="2.4"/><path d="M7.6 3.8v12.4"/>',
 desfazer:'<path d="M7.5 5 3.8 8.7l3.7 3.7"/><path d="M4 8.7h7.6a4.6 4.6 0 0 1 0 9.2H8.5"/>',
 pagina:'<rect x="4" y="3" width="12" height="14" rx="2"/><path d="M7 7.5h6M7 10.5h6M7 13.5h3.5"/>',
 acao:'<path d="M11 2.8 4.8 11h5l-1 6.2L15.2 9h-5z"/>',
 ingrediente:'<circle cx="10" cy="10" r="6.4"/><path d="M10 6.6v6.8M6.6 10h6.8"/>',
 receita:'<path d="M5.4 3h9.2v14l-4.6-2.8L5.4 17z"/>'
};
const icon=(k,c='')=>`<svg class="ico ${c}" viewBox="0 0 20 20" aria-hidden="true">${ICO[k]||''}</svg>`;
const isMac=()=>{try{return /Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent||'');}catch(e){return false;}};
const kbd=k=>`<kbd>${isMac()?'⌘':'Ctrl '}${k}</kbd>`;

/* ---------- marca ---------- */
const VERSION='v18.16';
const brandHTML=()=>`<div class="brand"><div class="hex"></div><div><b>Il <span>Fredolin</span></b><small>Gelato Lab ${VERSION}${APP_MODE==='app'&&ME.email?' · '+ROLE_N[ROLE]:''}</small></div></div>`;

/* ---------- termômetro da receita: vitrine, serviço ideal (com faixa de incerteza) e freezer numa régua só ---------- */
const TH_LO=-24,TH_HI=-6;
/* Como a faixa do dia no app Tempo: trilho em cápsula, trecho colorido = faixa ideal de serviço,
   ponto branco = vitrine. O ponto dentro do trecho quer dizer gelato no ponto. */
const tm=v=>String(v).replace(/^-/,'−');
/* contexto do último desenho: o arraste da régua usa isto sem recalcular a receita a cada movimento */
let THX=null;
function thermoStatus(T,ideal,pote){const dev=T-ideal;const st=Math.abs(dev)<=1.5?'ok':Math.abs(dev)<=3?'warn':'crit';
 const msg=st==='ok'?(pote&&pote.tReady!=null?'No ponto':'No ponto'):(dev<0?fT(Math.abs(dev))+'° mais fria · mais duro':fT(dev)+'° mais quente · mais mole');return{st,msg};}
function thermo(m){const pos=t=>clamp((t-TH_LO)/(TH_HI-TH_LO)*100,0,100);const vit=+S.vit,frz=+S.proc.storeT;const pote=S.proc.serveFrom==='pote';
 const u=m.empty?null:uncertainty(S);const lo=u?u.lo:m.serveT,hi=u?u.hi:m.serveT;
 const P=pote&&!m.empty?poteModel(m,S.proc):null;
 const ss=m.empty?{st:'',msg:'Monte a receita para ver o ponto'}:thermoStatus(vit,m.serveT,P);
 let msg=ss.msg;if(P&&!m.empty)msg=P.tReady==null?'Não chega ao ponto em 40 min':ss.st==='ok'?'No ponto em '+f0(Math.max(0,+S.proc.waitMin))+' min':'Ponto em '+f0(P.tReady)+' min';
 THX={pote,ideal:m.empty?null:m.serveT,P,frz};
 const step=(a,lbl,d,u1,u2)=>`<div class="ios-step" role="group" aria-label="${lbl}"><button data-a="${a}" data-v="-${d}" aria-label="${lbl}: ${u1}">−</button><i></i><button data-a="${a}" data-v="${d}" aria-label="${lbl}: ${u2}">+</button></div>`;
 const frzQ=`<div class="tq${pote?'':' sec'}"><span class="tq-l">Freezer</span><div class="tq-v"><b>${tm(f1(frz))}</b><span>°C</span></div>${step('frz','Freezer','.5','mais frio','menos frio')}</div>`;
 const left=pote?frzQ:`<div class="tq"><span class="tq-l">${S.proc.serveFrom==='freezer'?'Serviço':'Vitrine'}</span><div class="tq-v"><b id="thV">${tm(f1(vit))}</b><span>°C</span></div>${step('vit','Vitrine','.5','mais frio','menos frio')}</div>`;
 const right=pote?`<div class="tq sec"><span class="tq-l">Espera fora</span><div class="tq-v"><b id="thV">${f0(+S.proc.waitMin)}</b><span>min</span></div>${step('wait','Espera','1','menos tempo','mais tempo')}</div>`:frzQ;
 const aria=pote?`aria-valuemin="0" aria-valuemax="60" aria-valuenow="${+S.proc.waitMin}" aria-valuetext="${f0(+S.proc.waitMin)} minutos fora do freezer"`:`aria-valuemin="${TH_LO}" aria-valuemax="${TH_HI}" aria-valuenow="${vit}" aria-valuetext="${f1(vit)} graus"`;
 return`<div class="thermo${pote?' pote':''}" aria-label="Temperaturas da receita">
  ${left}
  <div class="tbar">
   <div class="tbar-cap"${u?` title="Faixa provável: ${tm(f1(lo))}° a ${tm(f1(hi))}°"`:''}><span>${pote?'Na colher':'Ideal'} <b id="thC">${pote?tm(f1(vit))+'°':(m.empty?'—':tm(f1(m.serveT))+'°')}</b></span><span class="tbar-st ${ss.st}" id="thS">${msg}</span></div>
   <div class="th-rail" data-rail="1" tabindex="0" role="slider" aria-label="${pote?'Espera fora do freezer':'Temperatura da vitrine'}" ${aria} title="${pote?'Arraste para escolher a temperatura de servir: o app calcula a espera':'Toque ou arraste para mudar a vitrine'}"><span class="th-track"></span>${m.empty?'':`<span class="th-band" style="left:${pos(lo)}%;width:${Math.max(1.2,pos(hi)-pos(lo))}%"></span><span class="th-ideal" style="left:${pos(m.serveT)}%"></span>`}<span class="th-dot ${ss.st}" id="thD" style="left:${pos(vit)}%"></span></div>
   <div class="tbar-ax"><span>${tm(TH_LO)}°</span><span>${tm((TH_LO+TH_HI)/2)}°</span><span>${tm(TH_HI)}°</span></div>
  </div>
  ${right}
 </div>`;}
/* ---------- arraste da régua: só move o ponto e os números durante o gesto; a receita é recalculada ao soltar ---------- */
const RAIL={on:false,el:null,rect:null,T:null,raf:0,x:0};
function railT(clientX){const r=RAIL.rect;return clamp(TH_LO+(clientX-r.left)/r.width*(TH_HI-TH_LO),TH_LO,TH_HI);}
function railPaint(){RAIL.raf=0;if(!RAIL.on||!THX)return;const T=railT(RAIL.x);RAIL.T=T;const pos=(T-TH_LO)/(TH_HI-TH_LO)*100;
 const d=document.getElementById('thD'),v=document.getElementById('thV'),c=document.getElementById('thC'),st=document.getElementById('thS');
 if(d)d.style.left=pos+'%';
 if(THX.pote&&THX.P){const w=THX.P.timeTo(T);const tw=w==null?null:Math.round(w);if(v)v.textContent=tw==null?'60+':f0(tw);if(c)c.textContent=tm(f1(T))+'°';
  if(st&&THX.ideal!=null){const s2=thermoStatus(T,THX.ideal);st.className='tbar-st '+s2.st;st.textContent=tw==null?'Além de 40 min':'Espera de '+f0(tw)+' min';if(d)d.className='th-dot '+s2.st;}}
 else{const vs=Math.round(T*2)/2;if(v)v.textContent=tm(f1(vs));if(st&&THX.ideal!=null){const s2=thermoStatus(vs,THX.ideal);st.className='tbar-st '+s2.st;st.textContent=s2.msg;if(d)d.className='th-dot '+s2.st;}}}
function railStart(el,e){RAIL.on=true;RAIL.el=el;RAIL.rect=el.getBoundingClientRect();if(!RAIL.rect.width){RAIL.on=false;return;}RAIL.x=e.clientX;el.classList.add('dragging');try{el.setPointerCapture(e.pointerId);}catch(x){}railPaint();}
function railMove(e){if(!RAIL.on)return;RAIL.x=e.clientX;if(!RAIL.raf)RAIL.raf=(typeof requestAnimationFrame==='function'?requestAnimationFrame:setTimeout)(railPaint);}
function railEnd(){if(!RAIL.on)return;RAIL.on=false;if(RAIL.el)RAIL.el.classList.remove('dragging');const T=RAIL.T;if(T==null)return;RAIL.T=null;
 if(THX&&THX.pote){if(!THX.P)return;const w=THX.P.timeTo(T);const nw=w==null?60:clamp(Math.round(w),0,60);if(nw===+S.proc.waitMin){render();return;}undoMark();S.proc.waitMin=nw;U.bal=null;render();return;}
 const v=clamp(Math.round(T*2)/2,TH_LO,TH_HI);if(v===+S.vit){render();return;}undoMark();S.vit=v;if(S.proc.serveFrom==='freezer')S.proc.storeT=v;U.bal=null;render();}
/* teclado: setas mudam a vitrine (ou a espera no modo pote) */
function railKey(e){const k=e.key;const d=k==='ArrowRight'||k==='ArrowUp'?1:k==='ArrowLeft'||k==='ArrowDown'?-1:0;if(!d)return false;e.preventDefault();
 if(S.proc.serveFrom==='pote')runAct('wait',String(-d));else runAct('vit',String(d*.5));setTimeout(()=>{const r=document.querySelector('[data-rail]');r&&r.focus&&r.focus();},0);return true;}

/* ---------- índice ---------- */
function scoreBtn(m,sc,F){const c=F.filter(f=>f.sev==='crit').length,w=F.filter(f=>f.sev==='warn').length;const v=m.empty?0:sc.total;const r=13,C=2*Math.PI*r;
 return`<button class="score ${m.empty?'':scoreCls(v)}" data-a="go" data-v="laudo" title="Abrir o laudo"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="${r}" class="sc-bg"/><circle cx="16" cy="16" r="${r}" class="sc-fg" stroke-dasharray="${C*v/100} ${C}" transform="rotate(-90 16 16)"/></svg>
  <span class="sc-v">${m.empty?'—':v}</span><span class="sc-t">${m.empty?'Índice':c?c+' crítico'+(c>1?'s':''):w?w+' alerta'+(w>1?'s':''):'Sem alertas'}</span></button>`;}

/* ---------- cabeçalho ---------- */
function hdr(m,sc,F){F=F||[];
 const find=`<button class="kbtn" data-a="palOpen" aria-label="Buscar e comandos">${icon('busca')}<span>Buscar</span>${kbd('K')}</button>`;
 if(ROLE==='sous'){const ex=EXEC.find(e=>e.id===S.execId);
  return`<div class="hbrand">${brandHTML()}</div><div class="rcp"><span class="r-lbl">Receita em execução</span><output class="rname ro">${ex?esc(ex.name)+' <span class="muted">v'+ex.v+'</span>':'Escolha uma receita em "Em execução"'}</output></div><div class="hright">${find}<button class="btn sm ghost" data-a="logout">Sair</button></div>`;}
 return`<div class="hbrand">${brandHTML()}</div>
 <div class="rcp"><input type="text" id="nm" class="rname" data-i="name" value="${esc(S.name)}" maxlength="60" aria-label="Nome da receita" placeholder="Receita sem nome">
  <div class="rrow"><select id="tipo" class="rtype" data-c="tipo" aria-label="Tipo de produto">${Object.keys(FAM_N).map(f=>{const L=Object.entries(PROF).filter(([,p])=>(p.fam||'italiana')===f);return L.length?`<optgroup label="${FAM_N[f]}">${L.map(([k,p])=>`<option value="${k}"${k===S.tipo?' selected':''}>${p.n}</option>`).join('')}</optgroup>`:'';}).join('')}</select>${setSwitchHTML('ph')}</div></div>
 ${thermo(m)}
 <div class="hright">${setSwitchHTML('dk')}${scoreBtn(m,sc,F)}${find}</div>`;}

/* ---------- navegação ---------- */
function navHTML(F){const c=F.filter(f=>f.sev==='crit').length,w=F.filter(f=>f.sev==='warn').length;const cur=PAGE_FAM[S.page];
 const fams=FAMILIES.map(([f,n])=>{const P=famPages(f);if(!P.length)return'';const badge=f==='analisar'&&(c||w)?`<i class="nb ${c?'c':'w'}">${c||w}</i>`:'';
  return`<div class="nfam${cur===f?' on':''}"><button class="fam" data-a="fam" data-v="${f}"${cur===f?' aria-current="true"':''}>${icon(f)}<span>${n}</span>${badge}</button>
   ${P.map(([k,pn])=>`<button class="np" data-a="go" data-v="${k}"${S.page===k?' aria-current="page"':''}><span>${pn}</span>${k==='laudo'&&(c||w)?`<span class="cnt">${c?`<i class="c">${c}</i>`:''}${w?`<i class="w">${w}</i>`:''}</span>`:''}</button>`).join('')}</div>`;}).join('');
 const st=STORE.status;const dot={cloud:'ok',syncing:'info',offline:'warn',error:'crit'}[st]||'muted';
 return`<div class="nbrand">${brandHTML()}<button class="ntog" data-a="navTog" aria-label="${document.body&&document.body.dataset&&document.body.dataset.nav==='rail'?'Expandir':'Recolher'} a barra lateral" title="Barra lateral (${isMac()?'⌘':'Ctrl '}\\)">${icon('lado')}</button></div>
 <button class="nsearch" data-a="palOpen">${icon('busca')}<span>Buscar</span>${kbd('K')}</button>
 <div class="nlist">${fams}</div>
 <button class="nfoot" data-a="go" data-v="dados" title="${esc(STORE.msg||'')}"><i class="dot ${dot}"></i><span>${st==='cloud'?'Sincronizado':st==='syncing'?'Sincronizando…':st==='offline'?'Sem conexão':st==='error'?'Falha ao sincronizar':'Neste aparelho'}</span>${APP_MODE==='app'&&ME.email?`<small>${esc(ROLE_N[ROLE])}</small>`:''}</button>`;}
/* abas das páginas irmãs (aparecem no iPad e no celular, onde a lista lateral fica recolhida) */
function tabsHTML(){const f=PAGE_FAM[S.page];const P=famPages(f);if(P.length<2)return'';
 return`<div class="ptabs" role="tablist" aria-label="${esc((FAMILIES.find(x=>x[0]===f)||[])[1]||'')}">${P.map(([k,n])=>`<button role="tab" data-a="go" data-v="${k}" aria-selected="${S.page===k}">${n}</button>`).join('')}</div>`;}

/* ---------- desfazer (⌘Z): guarda o estado da receita antes de cada mudança ---------- */
const UNDO=[];const UNDO_MAX=60;
const undoSnap=()=>{try{return JSON.stringify([S.name,S.tipo,S.vit,S.recipe,S.proc,S.brix,S.comps||[]]);}catch(e){return null;}};
let undoT=0;
/* chamado antes de mudar a receita; digitações seguidas no mesmo campo viram um passo só */
function undoMark(coalesceKey){const now=Date.now();if(coalesceKey&&undoMark.k===coalesceKey&&now-undoT<1200){undoT=now;return;}undoMark.k=coalesceKey||null;undoT=now;
 const s=undoSnap();if(s&&UNDO[UNDO.length-1]!==s){UNDO.push(s);if(UNDO.length>UNDO_MAX)UNDO.shift();}}
/* depois de uma ação: se nada mudou, descarta o passo guardado */
function undoSettle(){const top=UNDO[UNDO.length-1];if(top&&top===undoSnap())UNDO.pop();}
const UNDO_TOAST=new Set(['liveApply','atTry','rm','applyAct','dexConv','balApply','norm','scale','preset','master','load','varToBench','sensApply','genToBench','nxApply','histLoad','lotBench','vitOpen','compRm','crAdd','add','infToggle']);
function undoRestore(){const s=UNDO.pop();if(!s)return false;const[name,tipo,vit,recipe,proc,brix,comps]=JSON.parse(s);Object.assign(S,{name,tipo,vit,recipe,proc,brix,comps});U.bal=null;return true;}

/* ---------- paleta de comandos ---------- */
const PAL_ACTS=[
 ['save','Salvar receita na biblioteca','S',['gravar','guardar']],
 ['undo','Desfazer a última mudança','Z',['voltar']],
 ['norm','Normalizar a receita para 1000 g',null,['escala','1kg']],
 ['palBal','Balancear açúcares para a vitrine',null,['açúcar','congelamento','acucar']],
 ['lotNew','Registrar lote já produzido',null,['produção','lote','bancada']],
 ['flowStart','Iniciar calda na produção ao vivo',null,['produção','cronômetro','maturação','timer']],
 ['varAdd','Copiar a bancada como variação',null,['comparar','creator']],
 ['compAdd:variegato','Adicionar variegato',null,['componente','calda']],
 ['compAdd:crocante','Adicionar crocante',null,['componente','stracciatella']],
 ['simOpen:b','Receitas dos mestres parecidas com a bancada',null,['similar','parecida']],
 ['applyEquip:casa_mg_pan','Usar o conjunto de casa: Maestro Gelatiere + freezer Panasonic',null,['maqp1','maestro','panasonic','casa','equipamento']]
];
function palItems(q){const nq=norm(q.trim());const words=nq.split(/\s+/).filter(Boolean);const out=[];
 const sc=(title,alias)=>{if(!words.length)return 1;const t=norm(title),a=norm((alias||[]).join(' '));let s=0;
  for(const w of words){if(t.startsWith(w))s+=100;else if(new RegExp('(^|\\s)'+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).test(t))s+=70;else if(t.includes(w))s+=40;else if(a.includes(w))s+=25;else return 0;}return s;};
 const recent=U.recent||[];
 FAMILIES.forEach(([f,fn,P])=>P.forEach(([k,n])=>{if(!can.page(k))return;const s=sc(n,[fn]);if(s)out.push({g:'Ir para',t:n,sub:fn,ic:f,a:'go',v:k,s:s+(recent.includes(k)?(8-recent.indexOf(k)):0)+(words.length?0:5)});}));
 if(words.length)Object.entries(PAGE_ALIAS).forEach(([k,[to,,n]])=>{if(!can.page(to))return;const s=sc(n,[PAGE_N[to]]);if(s)out.push({g:'Ir para',t:n,sub:PAGE_N[to],ic:PAGE_FAM[to],a:'go',v:k,s:s-1});});
 PAL_ACTS.forEach(([a,t,key,al])=>{const[act,v]=a.split(':');if(!ACT[act]||!can.act(act))return;if(act==='undo'&&!UNDO.length)return;const s=sc(t,al);if(s)out.push({g:'Ações',t,ic:'acao',a:act,v:v||'',key,s:s+(words.length?0:3)});});
 if(nq.length>=2){
  if(can.act('crAdd'))ING.filter(i=>i.id!=='nx_tmp').map(i=>({i,s:sc(i.n,[i.cat,i.lab||''])})).filter(x=>x.s).sort((a,b)=>b.s-a.s).slice(0,6).forEach(({i,s})=>out.push({g:'Adicionar à bancada',t:i.n,sub:i.cat,ic:'ingrediente',a:'crAdd',v:i.id,s:s*.8}));
  if(can.act('master'))MASTERS.map((p,k)=>({p,k,s:sc(p.name,[p.a,p.g||''])})).filter(x=>x.s).sort((a,b)=>b.s-a.s).slice(0,6).forEach(({p,k,s})=>out.push({g:'Receitas dos mestres',t:p.name,sub:p.a,ic:'receita',a:'master',v:String(k),s:s*.7}));
  if(can.act('load'))LIB.map(l=>({l,s:sc(l.name,[])})).filter(x=>x.s).slice(0,5).forEach(({l,s})=>out.push({g:'Minhas receitas',t:l.name,sub:l.date,ic:'receita',a:'load',v:String(l.id),s:s*.9}));
  if(can.act('execRun'))EXEC.map(e=>({e,s:sc(e.name,[])})).filter(x=>x.s).slice(0,5).forEach(({e,s})=>out.push({g:'Em execução',t:e.name,sub:'v'+e.v,ic:'receita',a:'execRun',v:String(e.id),s}));}
 const order=['Ir para','Ações','Minhas receitas','Em execução','Adicionar à bancada','Receitas dos mestres'];
 out.sort((a,b)=>words.length?b.s-a.s:order.indexOf(a.g)-order.indexOf(b.g)||b.s-a.s);
 return out.slice(0,words.length?14:16);}
function palHTML(){const P=U.pal;if(!P)return'';const L=palItems(P.q||'');const sel=clamp(P.sel||0,0,Math.max(0,L.length-1));P.sel=sel;let lastG='';
 return`<div class="pal-bg" data-a="palClose"></div><div class="pal" role="dialog" aria-modal="true" aria-label="Buscar e comandos">
  <div class="pal-in">${icon('busca')}<input type="text" id="palQ" data-i="palQ" value="${esc(P.q||'')}" placeholder="Buscar páginas, ações, ingredientes e receitas" autocomplete="off" aria-controls="palL" aria-activedescendant="pal-${sel}"><kbd>esc</kbd></div>
  <div class="pal-l" id="palL" role="listbox">${L.length?L.map((x,i)=>{const h=x.g!==lastG?`<div class="pal-g">${x.g}</div>`:'';lastG=x.g;
   return h+`<button id="pal-${i}" role="option" aria-selected="${i===sel}" data-a="palRun" data-v="${i}">${icon(x.ic)}<span class="pal-t">${esc(x.t)}${x.sub?`<small>${esc(x.sub)}</small>`:''}</span>${x.key?kbd(x.key):''}</button>`;}).join(''):`<p class="pal-empty">Nada encontrado para "${esc(P.q)}". Tente o nome de um ingrediente, de um mestre ou de uma página.</p>`}</div>
  <div class="pal-f"><span><kbd>↑</kbd><kbd>↓</kbd> navegar</span><span><kbd>↵</kbd> abrir</span><span>${kbd('K')} abre de qualquer tela</span></div></div>`;}
function palRun(i){const L=palItems((U.pal&&U.pal.q)||'');const x=L[+i];U.pal=null;if(!x)return render();if(!can.act(x.a)){denied();return render();}
 const before=undoSnap();if(['crAdd','master','load','norm','execRun'].includes(x.a))undoMark();ACT[x.a](x.v);if(UNDO_TOAST.has(x.a)&&undoSnap()!==before)toastUndo();else undoSettle();}

/* ---------- ações deste módulo ---------- */
const SHELL_ACT={
 navTog:()=>{const cur=navMode();if(cur==='tab')return;try{localStorage.setItem(NAVKEY,cur==='rail'?'full':'rail');}catch(e){}navApply();render();},
 toTop:()=>scrollTopAll(),
 fam:v=>{const P=famPages(v);if(!P.length)return;const last=(S.famLast||{})[v];ACT.go(P.some(([k])=>k===last)?last:P[0][0]);},
 palOpen:()=>{U.pal={q:'',sel:0};render();setTimeout(()=>{const e=document.getElementById('palQ');e&&e.focus();},0);},
 palClose:()=>{U.pal=null;render();},
 palRun:v=>palRun(v),
 palBal:()=>{S.page='laudo';U.bal=S.proc.serveFrom==='pote'?balancePote(S):balance(S);render();},
 wait:v=>{S.proc.waitMin=clamp(Math.round(+S.proc.waitMin+ +v),0,60);U.bal=null;render();},
 undo:()=>{if(undoRestore()){render();toast('Desfeito');}else toast('Nada para desfazer');}
};
const SHELL_INP={palQ:v=>{if(!U.pal)U.pal={q:'',sel:0};U.pal.q=v;U.pal.sel=0;render();}};

/* ---------- tamanho da tela → navegação (como o iPadOS: barra lateral, trilho de ícones ou abas inferiores) ----------
   compacto (≤ 760 px: iPhone, iPad em Split View estreito): abas inferiores e cabeçalho que rola junto com a página
   médio (761–1365 px: iPad, MacBook 13" com janela menor): trilho de ícones + abas das páginas irmãs
   amplo (≥ 1366 px: MacBook, iPad 13" deitado): barra lateral completa
   A barra lateral pode ser recolhida/expandida (botão ou ⌘\\); a escolha fica salva neste aparelho. */
const NAVKEY='fredolin_nav';
function navMode(){const w=typeof innerWidth==='number'?innerWidth:1440;if(w<=760)return'tab';let p=null;try{p=localStorage.getItem(NAVKEY);}catch(e){}if(p==='rail'||p==='full')return p;return w<1366?'rail':'full';}
function navApply(){try{const b=document.body;if(!b||!b.dataset)return;const m=navMode();if(b.dataset.nav!==m)b.dataset.nav=m;}catch(e){}}
function scrollTopAll(){try{const m=$('#main');if(m)m.scrollTop=0;const a=document.querySelector('.app');if(a&&'scrollTop' in a)a.scrollTop=0;}catch(e){}}
/* barra compacta que aparece no topo quando o cabeçalho sai da tela (iPhone) */
function miniHTML(m,sc){if(m.empty)return'';const v=S.proc.serveFrom==='pote'?'na colher '+fT(Math.round(S.vit*10)/10):fT(Math.round(S.vit*10)/10);
 return`<button class="minib" data-a="toTop" aria-label="Voltar ao topo"><b>${esc(S.name||'Receita')}</b><span class="mono">${v} °C</span><span class="mini-sc ${sc.total>=90?'c-ok':sc.total>=75?'c-warn':'c-crit'}">${sc.total}</span></button>`;}
let _miniObs=null;
function miniWire(){if(_miniObs||typeof IntersectionObserver==='undefined')return;const h=document.getElementById('hdr'),mi=document.getElementById('mini'),app=document.querySelector('.app');if(!h||!mi||!app)return;
 _miniObs=new IntersectionObserver(es=>{es.forEach(e=>{mi.classList[e.isIntersecting?'remove':'add']('show');});},{root:app,threshold:0});_miniObs.observe(h);}
if(typeof window!=='undefined'&&window.addEventListener&&window.document){window.addEventListener('resize',()=>{const b=document.body;const was=b&&b.dataset&&b.dataset.nav;navApply();if(b&&b.dataset&&b.dataset.nav!==was&&typeof render==='function')render();});}

