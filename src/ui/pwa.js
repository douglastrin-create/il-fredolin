/* ==== 68-pwa.js ==== */
/* ===================== IL FREDOLIN · APLICATIVO INSTALÁVEL =====================
   Service worker: guarda o app para funcionar sem internet e busca a versão nova quando há conexão. */
/* v18.9 · o app agora roda depois de o IndexedDB abrir: o evento load da página pode já ter passado */
const onLoaded=fn=>{if(document.readyState==='complete')fn();else window.addEventListener('load',fn);};
if(APP_MODE==='app'&&'serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
 /* v17.7.1 · atualização: o app procura versão nova ao abrir, ao voltar para a tela e a cada 20 min; quando ela chega, avisa e recarrega com um toque */
 const hadCtl=!!navigator.serviceWorker.controller;let shown=false;
 const offerReload=()=>{if(shown)return;shown=true;try{const e=document.getElementById('toast');if(!e){location.reload();return;}
  e.innerHTML='<span>Nova versão do Il Fredolin disponível</span><button data-a="appReload">Atualizar agora</button>';e.hidden=false;clearTimeout(tt);}catch(x){location.reload();}};
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadCtl)offerReload();});
 onLoaded(()=>{navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(reg=>{
  const up=()=>{try{reg.update();}catch(e){}};document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')up();});setInterval(up,20*60*1000);
  if(reg.waiting&&hadCtl)offerReload();}).catch(()=>{});});}

/* ===================== v18.7 · FUNCIONAMENTO OFFLINE: diagnóstico, reparo e armazenamento persistente =====================
   O service worker responde o que está guardado nesta versão (arquivos do núcleo, conferência do hash do index.html,
   versões antigas ainda presentes). O app pede ao navegador armazenamento persistente (menos risco de o sistema apagar
   dados e cache por falta de espaço) e mostra a data do último backup exportado. */
const LASTBK_KEY='fredolin_v18_lastbackup';
function swAsk(type,ms){return new Promise(res=>{try{const c=navigator.serviceWorker&&navigator.serviceWorker.controller;if(!c){res({none:true});return;}
 const ch=new MessageChannel();const t=setTimeout(()=>res({timeout:true}),ms||8000);ch.port1.onmessage=e=>{clearTimeout(t);res(e.data||{});};c.postMessage({type},[ch.port2]);}catch(e){res({err:String(e)});}});}
async function offlineDiag(){U.off={busy:true};render();const o={};
 try{o.snaps=await kvSnapList();}catch(e){o.snaps=[];}
 o.sw='serviceWorker' in navigator;o.d=o.sw?await swAsk('diag'):{none:true};
 try{if(navigator.storage&&navigator.storage.persisted)o.persisted=await navigator.storage.persisted();}catch(e){}
 try{if(navigator.storage&&navigator.storage.estimate){const e=await navigator.storage.estimate();o.usage=e.usage;o.quota=e.quota;}}catch(e){}
 o.at=Date.now();U.off=o;render();}
async function offlineRepair(){U.off=Object.assign({},U.off||{},{busy:true,repair:null});render();const r=await swAsk('repair',30000);
 await offlineDiag();U.off.repair=r;render();}
/* pede armazenamento persistente uma vez por aparelho, depois de o app abrir (o navegador pode recusar em silêncio) */
if(APP_MODE==='app'&&typeof navigator!=='undefined'&&navigator.storage&&navigator.storage.persist){
 onLoaded(()=>{setTimeout(()=>{try{navigator.storage.persisted().then(p=>{if(!p&&!LS.get('fredolin_v18_persistAsked')){LS.set('fredolin_v18_persistAsked',1);navigator.storage.persist().catch(()=>{});}}).catch(()=>{});}catch(e){}},3000);});}
function offlineCard(){if(APP_MODE!=='app')return'';const o=U.off,lb=LS.get(LASTBK_KEY);const mb=x=>x>=1e9?f1(x/1e9)+' GB':f0(x/1e6)+' MB';
 const st=!o?null:o.busy?'busy':!o.sw||o.d.none?'none':o.d.timeout||o.d.err?'erro':o.d.miss&&o.d.miss.length||!o.d.indexOk?'falta':'ok';
 const rows=o&&!o.busy?[
  ['Service worker',!o.sw?'<span class="c-crit">não suportado neste navegador</span>':o.d.none?'<span class="c-warn">ainda não controla esta página (abra o app de novo)</span>':o.d.timeout||o.d.err?'<span class="c-crit">não respondeu</span>':'<span class="c-ok">ativo · versão '+esc(o.d.version||'?')+'</span>'],
  ...(o.d&&o.d.have?[['Arquivos do app guardados',(o.d.miss.length?'<span class="c-warn">':'<span class="c-ok">')+o.d.have.length+' de '+(o.d.have.length+o.d.miss.length)+'</span>'+(o.d.miss.length?' · faltam '+esc(o.d.miss.join(', ')):'')],
   ['Página guardada confere (SHA-256)',o.d.indexOk?'<span class="c-ok">sim</span>':'<span class="c-crit">não</span>'],
   ['Versão em uso',esc(VERSION)+(o.d.version&&o.d.version!==VERSION?' <span class="c-warn">(guardada: '+esc(o.d.version)+'; feche e abra o app)</span>':'')],
   ['Versões antigas no aparelho',o.d.others.length?o.d.others.length+' <span class="muted">(apagadas quando a nova estiver completa)</span>':'nenhuma']]:[]),
  ['Armazenamento persistente',o.persisted===true?'<span class="c-ok">sim</span>':o.persisted===false?'<span class="c-warn">não</span> <span class="muted">(o sistema pode apagar dados se faltar espaço; faça backup)</span>':'<span class="muted">não informado pelo navegador</span>'],
  ...(o.quota?[['Espaço usado',mb(o.usage||0)+' de '+mb(o.quota)]]:[]),
 ]:[];
 /* v18.9 · onde os dados ficam neste aparelho */
 const kvOk=typeof KV!=='undefined'&&KV.ok,lsBad=Object.keys(LS.bad||{}).length;
 rows.push(['Armazenamento principal (IndexedDB)',kvOk?(KV.bad?'<span class="c-crit">gravação recusada ('+esc(KV.bad)+')</span>':'<span class="c-ok">ativo</span> · '+KV.keys+' chave(s)'+(KV.migrated?' · '+KV.migrated+' migrada(s) nesta abertura':'')):'<span class="c-warn">'+esc(typeof KV!=='undefined'&&KV.reason?KV.reason:'indisponível')+'</span> · usando só o localStorage']);
 rows.push(['Cópia espelho (localStorage)',lsBad?(kvOk?'<span class="c-warn">recusou '+lsBad+' gravação(ões)</span> <span class="muted">(dados seguros no IndexedDB)</span>':'<span class="c-crit">recusou '+lsBad+' gravação(ões): exporte um backup</span>'):'<span class="c-ok">em dia</span>']);
 if(kvOk&&KV.restored.length)rows.push(['Recuperado na abertura',KV.restored.length+' chave(s) estavam mais novas no IndexedDB que no espelho']);
 return`<div class="card" id="off-card"><div class="row"><h2 style="margin:0">Funcionamento offline</h2><span class="sp"></span>${st?`<span class="chip ${st==='ok'?'ok':st==='busy'?'info':st==='falta'||st==='none'?'warn':'crit'}">${st==='ok'?'Pronto para usar sem internet':st==='busy'?'Verificando…':st==='falta'?'Incompleto':st==='none'?'Sem service worker':'Erro'}</span>`:''}</div>
  <p class="note" style="margin:6px 0 10px">Confere se este aparelho tem tudo para abrir o app sem internet. Os seus dados ficam no aparelho e na nuvem da equipe; o backup é a terceira cópia.</p>
  ${rows.length?rows.map(([a,b])=>`<div class="kv"><span>${a}</span><span>${b}</span></div>`).join(''):''}
  ${o&&!o.busy&&o.snaps?`<div class="kv" style="display:block;padding:8px 0"><span>Cópias automáticas no aparelho <span class="muted">(1 por dia, ficam 7)</span></span><div style="margin-top:4px">${o.snaps.length?o.snaps.map(s=>`<div class="row" style="gap:8px;margin:2px 0"><span class="mono">${new Date(s.at).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span><span class="muted">${s.n} itens · ${f0(s.size/1024)} KB${s.v?' · '+esc(s.v):''}</span><span class="sp"></span>${can.act('snapRestore')?`<button class="btn sm" data-a="snapRestore" data-v="${esc(s.id)}">Ver e restaurar</button>`:''}</div>`).join(''):'<span class="muted">nenhuma ainda</span>'}</div></div>`:''}
  <div class="kv"><span>Último backup exportado neste aparelho</span><span>${lb?new Date(lb).toLocaleDateString('pt-BR'):'<span class="c-warn">nunca</span>'}</span></div>
  ${o&&o.repair?`<p class="${o.repair.ok?'c-ok':'c-warn'}" style="margin:8px 0 0">${o.repair.ok?'Arquivos baixados e conferidos de novo.':'Não deu para reparar agora: '+esc(o.repair.msg||'sem resposta')+'. Com internet, tente de novo.'}</p>`:''}
  <div class="row" style="margin-top:10px">${typeof KV!=='undefined'&&KV.ok?'<button class="btn sm" data-a="snapNow">Guardar cópia agora</button>':''}<button class="btn sm" data-a="offDiag"${o&&o.busy?' disabled':''}>${o?'Verificar de novo':'Verificar agora'}</button>${st&&st!=='ok'&&st!=='busy'&&o.d&&!o.d.none?`<button class="btn sm" data-a="offRepair">Baixar de novo e conferir</button>`:''}</div></div>`;}
/* cópia automática: 15 s depois de abrir e ao ir para segundo plano, no máximo uma por dia */
if(APP_MODE==='app'&&typeof KV!=='undefined'){const auto=async()=>{try{if(!KV.ok)return;const L=await kvSnapList();if(L.length&&L[0].id===today())return;await kvSnapTake({v:VERSION,date:today()});}catch(e){}};
 setTimeout(auto,15000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')auto();});}
