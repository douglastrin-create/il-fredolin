/* ==== 52-execucao.js ==== */
/* ===================== IL FREDOLIN · RECEITAS EM EXECUÇÃO E APROVAÇÃO =====================
   Fluxo: o Chef ou o Maestro cria e testa no laboratório → aprova → a receita vira uma versão "em execução"
   (congelada: ingredientes, processo e vitrine) → o Sous Chef produz exatamente aquela versão.
   Reaprovar a mesma receita gera a versão seguinte (v2, v3…); os lotes guardam a versão produzida. */
const fmtDate=d=>{try{return new Date(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});}catch(e){return'';}};
const execOfBench=()=>EXEC.find(e=>e.id===S.execId)||(S.libId?EXEC.find(e=>e.src===S.libId):null);
/* cartão de aprovação (Bancada e Laudo) */
function approveCard(m,F,sc){if(!can.approve()||m.empty)return'';
 const ex=execOfBench(),crit=F.filter(f=>f.sev==='crit').length;
 const same=ex&&JSON.stringify(ex.recipe)===JSON.stringify(S.recipe)&&ex.tipo===S.tipo&&JSON.stringify(ex.proc)===JSON.stringify(S.proc);
 return`<div class="card approve"><div class="row"><div style="flex:1;min-width:220px"><h2 style="margin:0 0 4px">Execução</h2>
  <p class="t2" style="margin:0;font-size:13px">${ex?`Em execução como <b>${esc(ex.name)}</b> v${ex.v} · aprovada por ${esc(ex.by||'—')} em ${fmtDate(ex.at)}.${same?' Esta é a versão em produção.':' A bancada tem alterações em relação à versão em produção.'}`:'Esta receita ainda não está em execução. Ao aprovar, o Sous Chef passa a vê-la e produzi-la exatamente como está.'}</p>
  ${crit&&!same?`<p class="c-crit" style="margin:6px 0 0;font-size:12.5px">O laudo aponta ${crit} erro(s) crítico(s). Revise antes de aprovar.</p>`:''}</div>
  ${same?'':`<button class="btn ${crit?'del':'okb'}" data-a="approve">${ex?'Aprovar v'+(ex.v+1):'Aprovar para execução'}${crit?' mesmo assim':''}</button>`}</div></div>`;}

/* lista de receitas em execução (página própria e aba da Biblioteca) */
function execList(){if(!EXEC.length)return`<div class="card"><p class="muted" style="margin:0">${ROLE==='sous'?'Nenhuma receita em execução ainda. O Chef ou o Maestro aprova as receitas que entram em produção.':'Nenhuma receita em execução. Monte e teste uma receita na Bancada ou no Creator e toque em "Aprovar para execução".'}</p></div>`;
 const lotsOf=id=>LOTS.filter(l=>l.exec&&l.exec.id===id).length;
 return`<div class="g2">${[...EXEC].sort((a,b)=>String(a.name).localeCompare(String(b.name))).map(e=>{const st={tipo:e.tipo,vit:e.vit,recipe:e.recipe,proc:Object.assign({},PROC0,e.proc||{}),brix:e.brix||{},costs:{}};const mm=analyze(st);const tot=mm.tot;
  const al=[...mm.A.al].map(a=>BRAL[a]).filter(Boolean);
  return`<div class="card flat exec"><div class="row"><div style="flex:1;min-width:0"><h3>${esc(e.name)} <span class="chip">v${e.v}</span></h3>
   <div class="muted" style="font-size:12px">${esc(PROF[e.tipo]?PROF[e.tipo].n:e.tipo)} · ${f0(tot)} g · vitrine ${fT(e.vit)} °C · aprovada por ${esc(e.by||'—')} em ${fmtDate(e.at)}</div></div></div>
   <p class="note" style="margin:8px 0">${e.recipe.length} ingredientes · ${lotsOf(e.id)} lote(s) produzido(s)${al.length?' · <span class="c-crit">contém '+esc(al.join(', ').toLowerCase())+'</span>':''}</p>
   <div class="row"><button class="btn sm pri" data-a="execRun" data-v="${esc(e.id)}">Produzir</button>${can.approve()?`<button class="btn sm" data-a="execBench" data-v="${esc(e.id)}">Abrir na bancada</button>${U.retire===e.id?`<span class="c-crit" style="font-size:12.5px">Retirar?</span><button class="btn del" data-a="execRetireYes" data-v="${esc(e.id)}">Retirar</button><button class="btn sm" data-a="execRetireNo">Cancelar</button>`:`<button class="btn del" data-a="execRetire" data-v="${esc(e.id)}" aria-label="Retirar ${esc(e.name)} de execução">Retirar</button>`}`:''}</div></div>`;}).join('')}</div>`;}

function pgExecucao(){
 return`<div class="pg"><div><h1>${ROLE==='sous'?'Receitas Il Fredolin':'Em execução'}</h1><p class="lead">${ROLE==='sous'?'As receitas aprovadas para produção. Toque em "Produzir" para abrir a ficha com a pesagem, o processo e o registro do lote.':'As receitas aprovadas que a equipe está produzindo. É esta a biblioteca que o Sous Chef enxerga: sem custos e sem edição.'}</p></div>
 ${execList()}</div>`;}

/* ações */
const EXEC_ACT={
 approve:()=>{const m=analyze(S),F=diagnose(S,m),sc=score(S,m,F);if(m.empty)return;const prev=execOfBench();
  const id=prev?prev.id:'x'+Date.now().toString(36);
  const rec={id,name:(S.name||'Receita').trim(),tipo:S.tipo,vit:S.vit,recipe:plain(S.recipe),proc:plain(S.proc),brix:plain(S.brix||{}),v:prev?(+prev.v||1)+1:1,by:ME.email||ROLE_N[ROLE],at:new Date().toISOString(),src:S.libId||null,score:sc.total};
  STORE.put('exec',rec);S.execId=id;render();toast(rec.name+' v'+rec.v+' em execução');},
 execRetire:v=>{U.retire=v;render();},execRetireNo:()=>{U.retire=null;render();},
 execRetireYes:v=>{const e=EXEC.find(x=>x.id===v);STORE.del('exec',v);U.retire=null;render();toast((e?e.name:'Receita')+' retirada de execução');},
 /* produzir: carrega a versão aprovada (sem edição para o Sous Chef) e abre a ficha de produção */
 execRun:v=>{const e=EXEC.find(x=>x.id===v);if(!e)return;S.name=e.name;S.tipo=e.tipo;S.vit=e.vit;S.recipe=plain(e.recipe);S.proc=Object.assign({},PROC0,plain(e.proc||{}));S.brix=plain(e.brix||{});S.execId=e.id;S.libId=e.src||null;U.checks={};U.prodG='';S.page='producao';render();},
 execBench:v=>{EXEC_ACT.execRun(v);S.page='bancada';render();},
 syncNow:()=>{if(STORE.backend&&STORE.backend.sync)STORE.backend.sync();else STORE.init();}
};

