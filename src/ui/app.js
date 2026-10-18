/* ==== 70-app.js ==== */
/* ===================== IL FREDOLIN · APLICAÇÃO (render, ações, eventos) ===================== */
const VIEW={execucao:pgExecucao,equipe:pgEquipe,bancada:pgBancada,creator:pgCreator,laudo:pgLaudo,congelamento:pgCongel,quimica:pgQuimica,vitrine:pgVitrine,
 lotes:pgLotesQual,planejamento:pgPlanEst,estoque:pgEstoque,processo:pgProcesso,brix:pgBrix,defeitos:pgDefeitos,producao:pgProducao,
 ingredientes:pgIngredientes,rotulo:pgRotulo,custos:pgCustos,biblioteca:pgBiblioteca,dados:pgDados,
 componentes:pgComponentes,linha:pgProducaoViva,degustacao:pgDegustacao,sazonal:pgSazonal};


/* ---------- v17.7 · páginas-eixo: cada tarefa num lugar só ---------- */
/* Produção ao vivo também é onde se escolhe a receita aprovada (antes: página "Em execução") */
function pgProducaoViva(m){const h=pgLinha(m);const act=flowLots().some(L=>FLOW_ACTIVE.includes(L.flow.stage));const k=h.lastIndexOf('</div>');
 const sec=`<details class="card dcard" id="execSec"${dOpen('execSec',!act||ROLE==='sous')}><summary><h2 style="margin:0">Receitas aprovadas</h2><span class="chip">${EXEC.length}</span></summary>
  <p class="note" style="margin:8px 0 12px">${ROLE==='sous'?'As receitas liberadas para produção. Toque em Produzir para abrir a ficha com a pesagem, o processo e o cronômetro.':'A versão aprovada de cada receita é a que a equipe produz, sem custos e sem edição. Aprove na Bancada.'}</p>${execList()}</details>`;
 return h.slice(0,k)+sec+h.slice(k);}
function hubPage(pg,title,lead,secs,def,render){const t=subOf(pg,def);const E=embedPg(render(t));
 return`<div class="pg"><div class="pghead"><div><h1>${title}</h1><p class="lead">${E.lead||lead}</p></div>${segHTML(pg,secs,t,title)}</div>${E.body}</div>`;}
function pgLotesQual(m){const secs=[['lotes','Lotes e calibração'],['painel','Painel cego']];if(ROLE!=='sous')secs.push(['doe','Experimentos']);
 return hubPage('lotes','Lotes e qualidade','',secs,'lotes',t=>t==='painel'?pgDegustacao():t==='doe'&&ROLE!=='sous'?pgDoe(m):pgLotes(m));}
function pgPlanEst(m){return hubPage('planejamento','Planejamento e estoque','',[['plano','Plano de produção'],['estoque','Estoque']],'plano',t=>t==='estoque'?pgEstoque():pgPlanejamento());}
/* ---------- RENDER: um quadro por vez (várias mudanças no mesmo quadro geram um único desenho) ---------- */
let GSIM=null,NSIM=null;
function renderNow(){
 normalizeState();pageResolve();navApply();
 if(APP_MODE==='app'&&AUTH.state!=='ready'){$('#hdr').innerHTML=brandHTML();$('#nav').innerHTML='';$('#main').innerHTML=AUTH.view();document.body.classList.add('auth');return;}
 document.body.classList.remove('auth');
 if(!can.page(S.page))S.page=homePage();
 const a=document.activeElement,id=a&&a.id;let s1=null,s2=null,val=null;try{s1=a.selectionStart;s2=a.selectionEnd;}catch(e){}if(a&&a.tagName==='INPUT')val=a.value;
 const m=analyze(S),F=diagnose(S,m),sc=score(S,m,F);
 if(PAGE_FAM[S.page])S.famLast[PAGE_FAM[S.page]]=S.page;
 $('#hdr').innerHTML=hdr(m,sc,F);$('#nav').innerHTML=navHTML(F);$('#main').innerHTML=tabsHTML()+(VIEW[S.page]||pgBancada)(m,F,sc);
 $('#pal').innerHTML=palHTML();{const mi=document.getElementById('mini');if(mi){mi.innerHTML=miniHTML(m,sc);miniWire();}}document.body.classList[U.pal?'add':'remove']('pal-open');
 /* animação só quando a página muda (não a cada tecla) */
 if(renderNow.page!==S.page){renderNow.page=S.page;const pg=document.querySelector&&document.querySelector('#main .pg');if(pg&&pg.classList)pg.classList.add('enter');}
 if(id){const el=document.getElementById(id);if(el){if(val!=null&&el.tagName==='INPUT'&&el.value!==val)el.value=val;el.focus({preventScroll:true});try{if(s1!=null)el.setSelectionRange(s1,s2);}catch(e){}}}
 const gh=document.getElementById('gsimHost'),nh=document.getElementById('nsimHost');
 if(gh){if(!GSIM)GSIM=new GelSim();GSIM.mount(gh);GSIM.set(U.gp);}
 if(nh&&U.np){if(!NSIM)NSIM=new NeuSim();NSIM.mount(nh);NSIM.set(U.np);}
 setsAfterRender();const js=JSON.stringify(S);if(js!==renderNow.saved){renderNow.saved=js;try{localStorage.setItem(KEY,js);}catch(e){}}
}
let _rq=false;
function render(){if(typeof requestAnimationFrame!=='function'){renderNow();return;}if(_rq)return;_rq=true;requestAnimationFrame(()=>{_rq=false;renderNow();});}
/* processo indicado pelo autor: o que é da receita (quando entram álcool e fruta) é aplicado; calor e maturação pertencem ao set
   de equipamentos e só aparecem como referência no método do autor */
const MASTER_PROC_KEYS=['alcStage','fruitStage'];
function masterProc(p){S.proc.alcStage='depois';S.proc.fruitStage='depois';if(!p||!p.proc)return'';const ch=[];MASTER_PROC_KEYS.forEach(k=>{const v=p.proc[k];if(v!=='antes'&&v!=='depois')return;if(S.proc[k]!==v){S.proc[k]=v;ch.push(k);}});
 return ch.filter(k=>S.proc[k]==='antes').map(k=>k==='alcStage'?(S.proc.alcStage==='antes'?'álcool antes do calor':'álcool na mistura fria'):(S.proc.fruitStage==='antes'?'fruta antes do calor':'fruta na mistura fria')).join(', ');}
let tt;function toast(t,undo){const e=$('#toast');toast.lastT=t;toast.at=Date.now();e.innerHTML='<span>'+esc(t)+'</span>'+(undo?'<button data-a="undo">Desfazer</button>':'');e.hidden=false;clearTimeout(tt);tt=setTimeout(()=>e.hidden=true,undo?5000:2200);}
/* mostra o último aviso com o botão Desfazer (ou um aviso genérico, se a ação não avisou nada) */
function toastUndo(){toast(Date.now()-(toast.at||0)<400&&toast.lastT?toast.lastT:'Receita alterada',true);}
function addSel(){const id=U.sel||((()=>{const q=norm(U.q.trim());const r=q&&ING.find(i=>norm(i.n+' '+i.cat).includes(q));return r&&r.id;})());if(!id)return;
 const g=+U.addG>0?+U.addG:100;const ex=S.recipe.find(r=>r.id===id);if(ex)ex.g=Math.round((+ex.g+g)*10)/10;else S.recipe.push({id,g});
 U.q='';U.sel=null;U.bal=null;render();toast(ING_BY[id].n+' adicionado');}
const addVariantGo=(name,recipe)=>{addVariant(name,recipe);S.page='creator';S.creatorTab='gelato';S.crSub='comparar';render();};
/* vitrine da loja: compartilhada pela equipe */
function saveVit(){LS.set(K10.vit,S.vitrine);STORE.put('vit',{id:'main',temp:S.vitrine.temp,items:S.vitrine.items});}
function saveLot(L){clearTimeout(saveLot.t);STORE.put('lots',L);}
/* medições do lote são gravadas sozinhas 1,2 s depois da última tecla (nada se perde se a página fechar) */
function saveLotSoon(L){clearTimeout(saveLot.t);saveLot.t=setTimeout(()=>STORE.put('lots',L),1200);}
let agingT=null;

/* ---------- AÇÕES (data-a) ---------- */
const ACT={
 maqUse:()=>{const M=maqPlan(analyze(S),S.proc);if(!M)return;S.proc.drawT=Math.round(M.t35*2)/2;const t=(maqEnergy(analyze(S),M.load,M.Tin,S.proc.drawT)+(M.preChill?0:MAQ_STEEL*Math.max(0,(+S.proc.ambT||24)-S.proc.drawT)))/(M.Q/1000)/60;S.proc.drawMin=Math.round(clamp(t,2,40));render();toast('Saída '+fT(S.proc.drawT)+' °C · ~'+S.proc.drawMin+' min');},
 appReload:()=>{try{location.reload();}catch(e){}},
 sub:v=>{const[p,k]=String(v).split(':');U.sub=U.sub||{};U.sub[p]=k;render();scrollTopAll();},
 go:v=>{S.page=v;U.copy=null;U.recent=[v,...(U.recent||[]).filter(x=>x!==v)].slice(0,6);render();scrollTopAll();},
 add:addSel,
 rm:v=>{S.recipe=S.recipe.filter(r=>r.id!==v);U.bal=null;render();},
 norm:()=>{const t=S.recipe.reduce((s,r)=>s+(+r.g||0),0);if(!t)return;S.recipe.forEach(r=>r.g=Math.round(r.g*1000/t*10)/10);render();toast('Receita normalizada para 1000 g');},
 scale:()=>{const t=S.recipe.reduce((s,r)=>s+(+r.g||0),0),n=+U.scaleG;if(!t||!(n>0))return;S.recipe.forEach(r=>r.g=Math.round(r.g*n/t*10)/10);U.scaleG='';render();toast('Lote escalado para '+f0(n)+' g');},
 bal:()=>{U.bal=balanceBest(S);render();},
 balApply:()=>{if(U.bal&&U.bal.ok){S.recipe=U.bal.newRecipe;U.bal=null;render();toast(S.proc.serveFrom==='pote'?'Açúcares rebalanceados para '+f0(+S.proc.waitMin)+' min de espera':'Açúcares rebalanceados');}},
 balClose:()=>{U.bal=null;render();},
 defect:v=>{S.defect=v;render();},
 defMode:v=>{if(v==='risco'){U.sub=U.sub||{};U.sub.laudo='resumo';S.page='laudo';render();return;}U.defMode=v;U.sub=U.sub||{};U.sub.defeitos=v;render();},
 defSym:v=>{const a=U.defSym||[];U.defSym=a.includes(v)?a.filter(x=>x!==v):a.concat(v);U.defPick=null;render();},
 defClr:()=>{U.defSym=[];U.defPick=null;render();},
 defOpen:v=>{U.defPick=v;render();},
 defOpenB:v=>{U.defMode='banco';U.sub=U.sub||{};U.sub.defeitos='banco';S.page='defeitos';U.defCat='';S.defect=v;scrollTopAll();render();},
 defCat:v=>{U.defCat=v;const L=DEFECTS.filter(x=>!v||x.cat===v);if(L.length&&!L.some(x=>x.id===S.defect))S.defect=L[0].id;render();},
 brixReset:v=>{delete S.brix[v];render();},
 load:v=>{const l=LIB.find(x=>x.id==v);if(!l)return;Object.assign(S,JSON.parse(JSON.stringify(l.st)));S.proc=Object.assign({},PROC0,S.proc);S.libId=String(l.id);S.execId=null;S.page='bancada';U.bal=null;render();toast(l.name+' aberta');},
 del:v=>{U.del=String(v);render();},delNo:()=>{U.del=null;render();},
 chk:v=>{U.checks[v]=!U.checks[v];render();},unchk:()=>{U.checks={};render();},
 copy:()=>{const m=analyze(S);const tgt=+U.prodG>0?+U.prodG:Math.round(m.tot);const t=fichaText(m,tgt);
  const done=()=>toast('Ficha copiada');const fail=()=>{U.copy=t;render();const a=$('#copyArea');a&&(a.focus(),a.select());};
  try{navigator.clipboard.writeText(t).then(done,fail);}catch(e){fail();}},
 save:()=>{const name=(S.name||'Receita').trim();const st=JSON.parse(JSON.stringify({name,tipo:S.tipo,vit:S.vit,recipe:S.recipe,proc:S.proc,brix:S.brix,costs:S.costs}));const ex=LIB.find(l=>l.name===name);const rec={id:ex?ex.id:String(Date.now()),name,date:new Date().toLocaleDateString('pt-BR'),st,author:ME.email||'',note:(U.saveNote||'').trim()};
  /* versão anterior vai para o histórico (até 30), com data e nota */
  if(ex){const same=JSON.stringify(ex.st)===JSON.stringify(st);rec.hist=(ex.hist||[]).slice();if(!same)rec.hist.push({date:ex.date+(ex.updatedAt?' '+new Date(ex.updatedAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):''),note:ex.note||'',st:ex.st});rec.hist=rec.hist.slice(-30);}
  STORE.put('lib',rec);S.libId=String(rec.id);U.saveNote='';render();toast(ex?'Receita atualizada · versão anterior guardada':'Receita salva');},
 delYes:v=>{STORE.del('lib',v);U.del=null;render();toast('Receita excluída');},
 /* bases: carregam a receita mantendo processo, freezer, vitrine, lab e custos do usuário */
 preset:v=>{const p=PRESETS[+v];loadRecipe(p.name,p.tipo,p.vit,recFromPairs(p.recipe));render();toast(p.name+' carregada');},
 /* aplica uma opção estruturada do laudo ("id:Δg;id:Δg") */
 dexForm:v=>{S.dexForm=v==='anid'?'anid':'mono';U.bal=null;render();},
 dexConv:v=>{const[fr,to]=String(v).split(':');const ok=x=>x==='dextrose'||x==='dextrosem';if(!ok(fr)||!ok(to)||fr===to)return;const r=S.recipe.find(x=>x.id===fr);if(!r)return;
  const g2=Math.round(+r.g*ING_BY[fr].c.glu/ING_BY[to].c.glu*10)/10;const o=S.recipe.find(x=>x.id===to);if(o){o.g=Math.round((+o.g+g2)*10)/10;S.recipe=S.recipe.filter(x=>x!==r);}else{r.id=to;r.g=g2;}
  S.dexForm=to==='dextrose'?'anid':'mono';U.bal=null;render();},
 applyAct:v=>{String(v).split(';').forEach(op=>{const[id,d]=op.split(':');if(!ING_BY[id])return;const r=S.recipe.find(x=>x.id===id);if(r)r.g=Math.max(0,Math.round((+r.g+ +d)*10)/10);else if(+d>0)S.recipe.push({id,g:Math.round(+d*10)/10});});S.recipe=S.recipe.filter(r=>+r.g>0);U.bal=null;render();toast('Ajuste aplicado');},
 genAddFx:()=>{S.lab.gen.fixed.push({id:'morango',g:100});U.gen=U.genFr=null;render();},
 genRmFx:v=>{S.lab.gen.fixed.splice(+v,1);U.gen=U.genFr=null;render();},
 genDefaults:()=>{Object.assign(S.lab.gen,genDef(S.lab.gen.tipo));U.gen=U.genFr=null;render();},
 genRun:()=>{const g=S.lab.gen;let r=generate({...g,vit:S.vit,proc:S.proc});
  /* modo pote: a receita gerada muda a curva do pote; refaz com a temperatura real da colher */
  if(r.ok&&S.proc.serveFrom==='pote')for(let i=0;i<3;i++){const v=poteServeTemp({tipo:g.tipo,vit:S.vit,recipe:r.recipe,proc:S.proc,brix:S.brix,costs:S.costs});const r2=generate({...g,vit:v,proc:S.proc});if(!r2.ok)break;r=r2;if(Math.abs(poteServeTemp({tipo:g.tipo,vit:v,recipe:r.recipe,proc:S.proc,brix:S.brix,costs:S.costs})-v)<.05)break;}
  U.gen=r;render();},
 frCrit:k=>{const g=S.lab.gen,c=g.crit;const i=c.indexOf(k);if(i>=0)c.splice(i,1);else c.push(k);U.genFr=null;render();},
 frAll:()=>{U.genFrAll=!U.genFrAll;render();},
 frRun:()=>{const g=S.lab.gen,cr=frontCrits(g);if(cr.length<2)return;U.genFr={busy:true};U.genFrAll=false;render();
  setTimeout(()=>{U.genFr=genFrontier({...g,vit:S.vit,proc:S.proc,costs:can.cost()?S.costs:undefined},cr);render();},30);},
 frPick:v=>{const o=U.genFr&&U.genFr.front&&U.genFr.front[+v];if(!o)return;const t=o.tgt;Object.assign(S.lab.gen,{pod:t.pod,fat:t.fat,msnf:t.msnf,sol:t.sol});ACT.genRun();toast('Alternativa '+(+v+1)+' gerada: metas atualizadas');},
 genToBench:()=>{if(!U.gen||!U.gen.ok)return;const fx=S.lab.gen.fixed.map(f=>ING_BY[f.id]?ING_BY[f.id].n:'').filter(Boolean);loadRecipe('Lab · '+(fx[0]||PROF[S.lab.gen.tipo].n),S.lab.gen.tipo,S.vit,U.gen.recipe);render();toast('Receita levada para a bancada');},
 varAdd:()=>{addVariant('Variação '+(S.lab.variants.length+1),S.recipe);render();},
 varRm:v=>{S.lab.variants.splice(+v,1);render();},
 varToBench:v=>{const x=S.lab.variants[+v];if(!x)return;S.recipe=JSON.parse(JSON.stringify(x.recipe));S.name=x.name;S.page='bancada';render();toast(x.name+' na bancada');},
 sensRun:()=>{const s=S.lab.sens;U.sens=sweep(S,s.id,+s.lo,+s.hi,11);render();},
 sensApply:v=>{const r=S.recipe.find(x=>x.id===S.lab.sens.id);if(r){r.g=+v;U.sens=null;render();toast('Aplicado na bancada');}},
 nkbSel:v=>{U.nkbSel=v;render();},
 nxCmpT:v=>{const c=U.nxCmp||[];const i=c.indexOf(v);if(i>=0)c.splice(i,1);else if(c.length<4)c.push(v);U.nxCmp=c;render();},
 nxCmpUse:v=>{U.nxCmpDairy=v==='1';render();},
 nxLoad:v=>{const n=NEUTRO_PRESETS.find(x=>x.id===v)||NXLIB.find(x=>x.id===v);if(!n)return;const own=NXLIB.some(x=>x.id===v);S.nxEdit={id:own?n.id:null,name:own?n.name:n.name+' (cópia)',dose:n.dose,dairy:n.dairy!=null?n.dairy:S.nxEdit.dairy,parts:{...n.parts},from:own?null:v};U.nxTest=null;render();},
 nxNew:()=>{S.nxEdit={id:null,name:'Meu neutro',dose:5,dairy:true,parts:{lbg:40,guar:30,carr:5,dex:425}};U.nxTest=null;render();},
 nxRm:v=>{delete S.nxEdit.parts[v];U.nxTest=null;render();},
 nxTest:()=>{const tmp=registerNeutro({...S.nxEdit,id:'nx_tmp'});const a=analyze(S),Fa=diagnose(S,a);const s2=stReal(withBlend(S,tmp.id,+S.nxEdit.dose));const b=analyze(s2),Fb=diagnose(s2,b);U.nxTest={a:{m:a,sc:score(S,a,Fa).total},b:{m:b,sc:score(s2,b,Fb).total},F:Fb};render();},
 nxApply:()=>{ACT.nxSave();const s2=withBlend(S,S.nxEdit.id,+S.nxEdit.dose);S.recipe=s2.recipe;U.nxTest=null;S.page='bancada';render();toast('Neutro aplicado na receita');},
 libTab:v=>{S.libTab=v;render();},libAuthor:v=>{S.libAuthor=v;U.libN=0;render();},libMore:()=>{U.libN=(U.libN||LIB_PAGE)+LIB_PAGE;render();},
 master:v=>{const p=MASTERS[+v];loadRecipe(p.name+' · '+p.a,p.tipo,p.vit,recFromPairs(p.recipe));const ap=masterProc(p);render();toast(p.name+' carregada'+(ap?' · processo do autor: '+ap:''));},
 genToVar:()=>{if(!U.gen||!U.gen.ok)return;addVariant('Gerada '+(S.lab.variants.length+1),U.gen.recipe);S.crSub='comparar';render();},
 nxSave:()=>{const E=S.nxEdit;if(!Object.keys(E.parts).length)return;if(!E.id||!NXLIB.some(n=>n.id===E.id))E.id='nx_u'+Date.now();const rec={id:E.id,name:E.name||'Meu neutro',dose:+E.dose,parts:{...E.parts},src:'Meu neutro'};STORE.put('nx',rec);render();toast('Neutro salvo');},
 nxDel:()=>{STORE.del('nx',S.nxEdit.id);S.nxEdit.id=null;render();toast('Neutro excluído');},
 masterVar:v=>{const p=MASTERS[+v];addVariantGo(p.name,recFromPairs(p.recipe));},
 libVar:v=>{const l=LIB.find(x=>x.id==v);if(l)addVariantGo(l.name,l.st.recipe);},
 crTab:v=>{S.creatorTab=v;render();},crSub:v=>{S.crSub=v;render();},
 crAdd:v=>{const ex=S.recipe.find(r=>r.id===v);const g=ING_BY[v].cat==='Estabilizantes'||ING_BY[v].cat==='Meus neutros'?4:ING_BY[v].cat==='Bebidas e aromas'?5:50;if(ex)ex.g=Math.round((+ex.g+g)*10)/10;else S.recipe.push({id:v,g});U.cq='';U.bal=null;render();},
 crStep:v=>{const[id,d]=v.split('|');const r=S.recipe.find(x=>x.id===id);if(r){r.g=Math.max(0,Math.round((+r.g+ +d)*10)/10);U.bal=null;render();}},
 nxStep:v=>{const[k,d]=v.split('|');S.nxEdit.parts[k]=Math.max(0,(+S.nxEdit.parts[k]||0)+ +d);U.nxTest=null;render();},
 age:()=>{if(U.aging){clearInterval(agingT);U.aging=false;render();return;}U.aging=true;if((+U.days||0)>=14)U.days=0;agingT=setInterval(()=>{U.days=(+U.days||0)+1;if(U.days>=14){clearInterval(agingT);U.aging=false;}render();},550);render();},
 lotNew:()=>{const L=newLotFromBench();if(!L)return;saveLot(L);U.lotOpen=L.id;S.page='lotes';render();toast('Lote '+L.code+' registrado');},
 lotOpen:v=>{U.lotOpen=U.lotOpen===v?null:v;render();},
 lotSave:()=>{const L=LOTS.find(l=>l.id===U.lotOpen);if(L){saveLot(L);render();toast('Lote salvo · calibração atualizada');}},
 lotDel:()=>{STORE.del('lots',U.lotOpen);U.lotOpen=null;render();toast('Lote excluído');},
 lotBench:()=>{const L=LOTS.find(l=>l.id===U.lotOpen);if(!L)return;S.name=L.name;S.tipo=L.tipo;S.vit=L.vit;S.recipe=JSON.parse(JSON.stringify(L.recipe));S.page='bancada';render();},
 lotConsume:()=>{const L=LOTS.find(l=>l.id===U.lotOpen);if(!L)return;const miss=[];L.trace=L.trace||{};
  let dup=0;const movs=[];
  L.recipe.forEach(r=>{const R=consumeFIFO(INV,r.id,+r.g,L.id);if(R.already){dup++;return;}if(R.movs.length&&!L.trace[r.id])L.trace[r.id]=R.firstLot;movs.push(...R.movs);if(R.rest>.5)miss.push(ING_BY[r.id]?ING_BY[r.id].n:r.id);});
  movs.forEach(mv=>STORE.put('inv',Object.assign(mv,{date:today(),by:ME.email||''})));saveLot(L);render();
  toast(dup&&!movs.length?'Este lote já foi baixado: nada foi descontado de novo':(miss.length?'Baixado; faltou estoque de '+miss.length+' item(ns)':'Estoque baixado (FEFO)')+(dup?' · '+dup+' item(ns) já baixado(s) antes':''));},
 ingNew:()=>{U.ingEdit={id:null,n:'',c:{w:0},x:{cost:0,al:[]}};render();},
 ingDup:v=>{const i=ING_BY[v];U.ingEdit={id:null,n:i.n+' (meu)',c:JSON.parse(JSON.stringify(i.c)),x:{cost:i.cost||0,lab:i.lab||'',brix:i.brix,ph:i.ph,de:i.de,na:i.na,sat:i.sat,hfB:i.hfB,hfS:i.hfS,hfN:i.hfN,al:[...(i.al||[])],dairy:i.dairy,added:i.added,acid:i.acid,msnf:i.msnf,br:i.br}};render();scrollTopAll();},
 ingEdit:v=>{const c=CUST.find(x=>x.id===v);if(c){U.ingEdit=JSON.parse(JSON.stringify(c));render();scrollTopAll();}},
 ingCancel:()=>{U.ingEdit=null;render();},
 ingSave:()=>{const E=U.ingEdit;if(!E||!E.n.trim())return;if(!E.id)E.id='ui_'+Date.now();const clean={};for(const k in E.c)if(+E.c[k]>0)clean[k]=+E.c[k];E.c=clean;const x={};for(const k in E.x){const v=E.x[k];if(v===''||v==null)continue;x[k]=typeof v==='string'&&k!=='lab'&&k!=='br'&&!isNaN(+v)?+v:v;}E.x=x;
  STORE.put('ings',E);registerCustom(E);U.ingEdit=null;render();toast('Ingrediente salvo');},
 ingDel:v=>{STORE.del('ings',v);render();},
 vitT:v=>{S.vitrine.temp=clamp(Math.round((S.vitrine.temp+ +v)*2)/2,-24,-6);U.vitBal=null;saveVit();render();},
 vitBest:()=>{S.vitrine.temp=bestVitrineTemp(vitrineAnalysis(S.vitrine.items,S.vitrine.temp));saveVit();render();},
 vitRm:v=>{S.vitrine.items.splice(+v,1);U.vitBal=null;saveVit();render();},
 vitOpen:v=>{const it=S.vitrine.items[+v];loadRecipe(it.name,it.tipo,S.vitrine.temp,it.recipe);render();},
 vitHarm:v=>{const it=S.vitrine.items[+v];U.vitBal={i:+v,r:balance({tipo:it.tipo,vit:S.vitrine.temp,recipe:it.recipe,proc:S.proc,brix:{},costs:{}})};render();},
 vitApply:()=>{const b=U.vitBal;if(!b||!b.r.ok)return;S.vitrine.items[b.i].recipe=b.r.newRecipe;U.vitBal=null;saveVit();render();toast('Sabor harmonizado');},
 planAdd:()=>{S.plan.push({key:'cur',kg:2});render();},planRm:v=>{S.plan.splice(+v,1);render();},
 planCopy:()=>{const cap=+S.planCap||(MACH[S.proc.machine]||{}).batch||5000;const res=planNeeds(S.plan,p=>srcByKey(p.key),cap);const by=invRecompute(INV);const t=['IL FREDOLIN — LISTA DE COMPRAS',...Object.entries(res.need).map(([id,g])=>{const s=Math.max(0,g-((by[id]||{q:0}).q));return s>0?`[ ] ${(s/1000).toFixed(2)} kg  ${ING_BY[id]?ING_BY[id].n:id}`:null;}).filter(Boolean)].join('\n');
  try{navigator.clipboard.writeText(t).then(()=>toast('Lista copiada'),()=>{U.planCopy=t;render();});}catch(e){U.planCopy=t;render();}},
 invAdd:()=>{const N=U.invNew||{};if(!(+N.kg>0)||!N.ingId)return;const e={id:'E'+Date.now(),ingId:N.ingId,qty:+N.kg*1000,costKg:+N.costKg||0,lot:N.lot||'',exp:N.exp||'',date:today()};STORE.put('inv',e);U.invNew={ingId:N.ingId,kg:'',costKg:'',lot:'',exp:''};render();toast('Entrada registrada');},
 invDel:v=>{STORE.del('inv',v);render();},
 impGo:()=>{if(!can.cost())return denied();applyImport();},impNo:()=>{U.imp=null;render();},impDel:()=>{if(U.imp){U.imp.withDel=!U.imp.withDel;render();}},
 expJson:async()=>{const cols={};BACKUP_COLS.forEach(c=>cols[c]=COLS[c].get());const data=JSON.stringify(Object.assign(backupPayload(cols,STORE.tomb,{v:VERSION,date:today(),exportedAt:new Date().toISOString()}),{vitrine:S.vitrine}),null,1);await saveFile('il_fredolin_backup_'+today()+'.json',data);},
 expCsv:async()=>{const h=['lote','data','receita','overrun_prev','overrun_med','brix_prev','brix_med','derretimento_prev','derretimento_med','textura','pasteurizacao','resfriamento_min','maturacao_h'];const rows=LOTS.map(L=>{const me=L.meas||{};return[L.code,L.date,L.name,lotPred(L,'ov',f1),measuredOverrun(me)!=null?f1(measuredOverrun(me)):'',lotPred(L,'brix',f1),me.brix||'',lotPred(L,'melt10',f0),me.melt10||'',me.tex!=null?me.tex:'',me.pastT||'',me.coolMin||'',me.matH||''].map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(';');});await saveFile('il_fredolin_lotes_'+today()+'.csv','﻿'+[h.join(';'),...rows].join('\n'));},
 frz:v=>{S.proc.storeT=clamp(Math.round((+S.proc.storeT+ +v)*2)/2,-35,-8);if(S.proc.serveFrom==='freezer')S.vit=S.proc.storeT;U.bal=null;render();},
 vit:v=>{S.vit=clamp(Math.round((+S.vit+ +v)*2)/2,-35,-6);if(S.proc.serveFrom==='freezer')S.proc.storeT=S.vit;U.bal=null;render();},
 pick:v=>{U.sel=v;U.q=ING_BY[v].n;renderNow();const g=$('#addG');g&&g.focus();g&&g.select();},
 testRun:()=>{U.test=runTests({ui:true});render();},
 ...EXEC_ACT,
 ...DOE_ACT,
 ...TEAM_ACT,
 ...V13_ACT,
 ...AT_ACT,
 ...MAT_ACT,
 ...FLOW_ACT,
 ...SET_ACT,
 ...SHELL_ACT
};

/* ---------- ENTRADAS (data-i, a cada tecla) ---------- */
/* número digitado → valor seguro: vazio/ inválido vira o padrão; fora da faixa vai para o limite */
const num=(v,lo,hi,dflt)=>v===''||v==null||!isFinite(+v)?dflt:clamp(+v,lo,hi);
const GEN_LIM={batch:[200,20000],fat:[0,30],msnf:[0,15],pod:[0,40],sol:[10,60],stabGkg:[0,30]};
setsWrap(ACT);
const INP={
 costCap:v=>{const n=parseFloat(String(v).replace(',','.'));S.costCap=isFinite(n)&&n>0?n:'';render();},
 name:v=>{S.name=v;render();},
 q:v=>{U.q=v;U.sel=null;render();},
 addG:v=>{U.addG=v;},scaleG:v=>{U.scaleG=v;},prodG:v=>{U.prodG=v;render();},
 g:(v,t)=>{const r=S.recipe.find(x=>x.id===t.dataset.id);if(r){r.g=num(v,0,1e5,0);U.bal=null;render();}},
 brix:(v,t)=>{if(v===''||!isFinite(+v))delete S.brix[t.dataset.id];else S.brix[t.dataset.id]=String(clamp(+v,1,85));render();},
 cost:(v,t)=>{if(v===''||!isFinite(+v))delete S.costs[t.dataset.id];else S.costs[t.dataset.id]=String(Math.max(0,+v));render();},
 proc:(v,t)=>{if(v===''||!isFinite(+v))return;const k=t.dataset.k,lim=PROC_LIM[k];S.proc[k]=lim?clamp(+v,lim[0],lim[1]):+v;if(k==='storeT'&&S.proc.serveFrom==='freezer')S.vit=S.proc.storeT;U.bal=null;render();},
 gen:(v,t)=>{if(v===''||!isFinite(+v))return;const k=t.dataset.k,lim=GEN_LIM[k];S.lab.gen[k]=lim?clamp(+v,lim[0],lim[1]):+v;U.gen=U.genFr=null;render();},
 genfg:(v,t)=>{S.lab.gen.fixed[+t.dataset.k].g=num(v,0,+S.lab.gen.batch||1000,0);U.gen=U.genFr=null;render();},
 varName:(v,t)=>{S.lab.variants[+t.dataset.k].name=v;render();},
 varG:(v,t)=>{const V=S.lab.variants[+t.dataset.k];const id=t.dataset.id;const g=num(v,0,1e5,0);const r=V.recipe.find(x=>x.id===id);if(r)r.g=g;else V.recipe.push({id,g});V.recipe=V.recipe.filter(x=>x.g>0||x.id===id);render();},
 sens:(v,t)=>{if(v===''||!isFinite(+v))return;const s=S.lab.sens,k=t.dataset.k;s[k]=k==='lo'?clamp(+v,-95,-1):clamp(+v,1,300);U.sens=null;render();},
 nxName:v=>{S.nxEdit.name=v;render();},
 nxDose:v=>{if(v===''||!isFinite(+v))return;S.nxEdit.dose=clamp(+v,0,50);U.nxTest=null;render();},
 nxG:(v,t)=>{S.nxEdit.parts[t.dataset.k]=num(v,0,1e4,0);U.nxTest=null;render();},
 libQ:v=>{U.libQ=v;U.libN=0;render();},
 cq:v=>{U.cq=v;render();},days:v=>{U.days=num(v,0,14,0);render();},
 lot:(v,t)=>{const L=LOTS.find(l=>l.id===U.lotOpen);if(!L)return;setPath(L,t.dataset.k,v===''?'':(t.type==='number'?+v:v));
  /* v18.2 · núcleo digitado num lote da Produção ao vivo: os minutos no freezer saem da hora em que o pote entrou nele */
  if(t.dataset.k==='meas.coreT'&&v!==''){const me=L.meas=L.meas||{},at=flowHardAt(L);if((me.coreMin==null||me.coreMin==='')&&at)me.coreMin=Math.max(0,Math.round((Date.now()-at)/60000));}
  saveLotSoon(L);render();},
 lotTxt:v=>{const L=LOTS.find(l=>l.id===U.lotOpen);if(L){L.notes=v;saveLotSoon(L);}},
 ingQ:v=>{U.ingQ=v;render();},
 ing:(v,t)=>{const E=U.ingEdit;if(!E)return;const[p,k]=t.dataset.k.split('.');(p==='c'?E.c:E.x)[k]=v===''?'':(t.type==='number'?(p==='c'?num(v,0,100,0):num(v,...(({ph:[2,7.5],sat:[0,1],de:[1,100],brix:[0,90],na:[0,40000],cost:[0,1e6]})[k]||[-1e6,1e6]),0)):v);render();},
 ingName:v=>{if(U.ingEdit){U.ingEdit.n=v;render();}},
 planCap:v=>{S.planCap=v===''?'':num(v,100,1e5,'');render();},planKg:(v,t)=>{S.plan[+t.dataset.k].kg=num(v,0,1e4,0);render();},
 invNew:(v,t)=>{U.invNew=U.invNew||{ingId:'leite',kg:'',costKg:'',lot:'',exp:''};U.invNew[t.dataset.k]=v;},
 ...DOE_INP,
 ...TEAM_INP,
 ...V13_INP,
 ...AT_INP,
 ...MAT_INP,
 ...FLOW_INP,
 ...SET_INP,
 ...SHELL_INP
};

/* ---------- MUDANÇAS (data-c, selects/checkboxes/arquivo) ---------- */
const CHG={
 compBal:t=>{S.compBal=!!t.checked;},
 defChk:t=>{U.defChk=U.defChk||{};U.defChk[t.dataset.v]=t.checked;},
 tipo:t=>{S.tipo=t.value;U.bal=null;const P=PROF[t.value];if(P&&P.serveT!=null){S.vit=P.serveT;if(P.proc==='soft'||P.serveCtx==='palito'||P.serveCtx==='fatia')S.proc.serveFrom='vitrine';}},
 proc:t=>{const k=t.dataset.k;S.proc[k]=t.value;if(k==='pastHoldU'&&t.value==='min'&&S.proc.pastHold>60)S.proc.pastHold=30;},
 gen:t=>{const k=t.dataset.k;S.lab.gen[k]=t.value;if(k==='tipo')Object.assign(S.lab.gen,genDef(t.value));U.gen=U.genFr=null;},
 genfx:t=>{S.lab.gen.fixed[+t.dataset.k].id=t.value;U.gen=U.genFr=null;},
 varNew:t=>{if(!t.value)return false;S.lab.variants.forEach(V=>{if(!V.recipe.some(r=>r.id===t.value))V.recipe.push({id:t.value,g:0});});},
 sens:t=>{S.lab.sens.id=t.value;U.sens=null;},
 nxDairy:t=>{S.nxEdit.dairy=t.value==='1';},
 nxAdd:t=>{if(!t.value)return false;S.nxEdit.parts[t.value]=10;U.nxTest=null;},
 calOn:t=>{CAL.on=t.checked;CAL.ver++;LS.set(K10.cal,{on:CAL.on});},
 lot:t=>{const L=LOTS.find(l=>l.id===U.lotOpen);if(L){setPath(L,t.dataset.k,t.value===''?'':+t.value);
  /* gelo nas checagens D+1/3/7: o primeiro dia com gelo vira o "dia em que percebeu gelo" da calibração */
  const mk=/^meas\.ice(\d)$/.exec(t.dataset.k);if(mk){const me=L.meas=L.meas||{};const first=[1,3,7].find(d=>+me['ice'+d]>0);if(first&&(me.icyDay==null||me.icyDay===''||me._icyAuto)){me.icyDay=first;me._icyAuto=1;}else if(!first&&me._icyAuto){me.icyDay='';delete me._icyAuto;}}
  saveLotSoon(L);}},
 ingCat:t=>{U.ingCat=t.value;},
 ingAl:t=>{if(!U.ingEdit)return false;const a=U.ingEdit.x.al=U.ingEdit.x.al||[];const k=t.dataset.k;if(t.checked&&!a.includes(k))a.push(k);if(!t.checked)U.ingEdit.x.al=a.filter(x=>x!==k);},
 ingFlag:t=>{if(!U.ingEdit)return false;U.ingEdit.x[t.dataset.k]=t.checked?1:0;},
 vitAdd:t=>{if(!t.value)return false;const s=srcByKey(t.value);if(s){S.vitrine.items.push({name:s.name.replace(/^Receita da bancada · /,''),tipo:s.tipo,recipe:JSON.parse(JSON.stringify(s.recipe))});saveVit();}},
 planSrc:t=>{S.plan[+t.dataset.k].key=t.value;},
 invNew:t=>{U.invNew=U.invNew||{kg:'',costKg:'',lot:'',exp:''};U.invNew.ingId=t.value;},
 ...DOE_CHG,
 ...TEAM_CHG,
 ...V13_CHG,
 ...MAT_CHG
};
/* importar = ler, planejar e mostrar o plano; nada é gravado antes de "Restaurar" */
function importBackup(file){const fr=new FileReader();fr.onload=()=>{try{const d=JSON.parse(fr.result);const cols={};BACKUP_COLS.forEach(c=>cols[c]=COLS[c].get());
  U.imp={name:file.name,plan:planImport(d,cols,STORE.tomb),withDel:false};render();}catch(err){U.imp=null;toast('Arquivo inválido: não é um backup do Il Fredolin.');}};fr.readAsText(file);}
function applyImport(){const I=U.imp;if(!I)return;let n=0;
 BACKUP_COLS.forEach(c=>{const P=I.plan.cols[c];[...P.add,...P.upd,...(I.withDel?P.del:[])].forEach(r=>{const x=Object.assign({},r);delete x.base;STORE.put(c,x);n++;});});
 const v=VITS.find(x=>x.id==='main');if(v){S.vitrine={temp:v.temp,items:v.items||[]};LS.set(K10.vit,S.vitrine);}
 U.imp=null;render();toast(n+' item(ns) restaurado(s)');}
function importCard(){const I=U.imp;if(!I)return'';const P=I.plan,t=P.total;
 const rows=BACKUP_COLS.filter(c=>{const x=P.cols[c];return x.add.length||x.upd.length||x.keep||x.del.length;}).map(c=>{const x=P.cols[c];
  return`<div class="kv"><span>${BACKUP_N[c]}</span><span>${x.add.length} novos · ${x.upd.length} atualizados · ${x.keep} mantidos${x.del.length?' · '+x.del.length+' apagados aqui':''}</span></div>`;}).join('');
 return`<div class="card"><h2>Restaurar ${esc(I.name)}</h2><p class="note">Backup ${esc(P.version)} de ${esc(P.date)}. Registros iguais ou mais novos neste aparelho são <b>mantidos</b>: o backup só completa o que falta ou está mais antigo.</p>${rows||'<p class="muted">Nada no arquivo.</p>'}
 ${t.del?`<label class="row" style="gap:8px;margin-top:8px"><input type="checkbox" data-a="impDel" ${I.withDel?'checked':''}> Trazer de volta também ${t.del} item(ns) apagado(s) depois deste backup</label>`:''}
 <div class="row" style="margin-top:10px"><button class="btn pri" data-a="impGo" ${t.add+t.upd+(I.withDel?t.del:0)?'':'disabled'}>Restaurar ${t.add+t.upd+(I.withDel?t.del:0)} item(ns)</button><button class="btn" data-a="impNo">Cancelar</button></div></div>`;}

/* ---------- EVENTOS: um ouvinte por tipo ---------- */
/* toda ação passa pela checagem do perfil (o servidor também recusa o que o perfil não pode) */
const denied=()=>toast('Seu perfil não tem acesso a esta função.');
/* ações que não mexem na receita não entram no desfazer */
const NO_UNDO=new Set(['doeGen','doeCancel','doeLots','impNo','impDel','rejDrop','rejDropNo','rejExport','appReload','go','sub','defMode','defSym','defClr','defOpen','defCat','fam','palOpen','palClose','palRun','undo','copy','chk','unchk','libTab','libAuthor','libMore','libTipo','libVitF','simOpen','simClose','cmpToggle','cmpClear','histOpen','lotOpen','crTab','crSub','atGoal','setSw','navTog','toTop','flowOpen','flowView','flowNotify','flowNext','flowBack','flowDisc','flowColor','flowStart','flowLot','procGo','procPlay','atSel','atPick','atCard','atExplore','nxGoal','sazM','del','delNo','meltTimer','panelSet','panelStart','panelNext','panelCancel','panelReveal','panelReset','testRun','syncNow','age','pick']);
function runAct(k,v,t){if(NO_UNDO.has(k))return ACT[k](v,t);const before=undoSnap();undoMark();const r=ACT[k](v,t);
 if(r&&typeof r.then==='function')return r;if(undoSnap()===before)undoSettle();else if(UNDO_TOAST.has(k))toastUndo();return r;}
document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.tagName==='DETAILS'&&d.id){U.dopen=U.dopen||{};U.dopen[d.id]=d.open;}},true);
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t)return;e.preventDefault();const k=t.dataset.a;if(!ACT[k])return;if(!can.act(k))return denied();runAct(k,t.dataset.v,t);});
/* régua do termômetro: tocar ou arrastar muda a vitrine */
document.addEventListener('pointerdown',e=>{const r=e.target.closest&&e.target.closest('[data-rail]');if(!r||ROLE==='sous')return;e.preventDefault();railStart(r,e);});
document.addEventListener('pointermove',railMove);document.addEventListener('pointerup',railEnd);document.addEventListener('pointercancel',railEnd);
const UNDO_INP=new Set(['name','g','brix','proc','comp','compG']);
document.addEventListener('input',e=>{const t=e.target;if(!t.dataset||!t.dataset.i||!INP[t.dataset.i])return;if(!can.inp(t.dataset.i,t))return denied();if(UNDO_INP.has(t.dataset.i))undoMark(t.dataset.i+':'+(t.dataset.id||t.dataset.k||''));INP[t.dataset.i](t.value,t);});
document.addEventListener('change',e=>{const t=e.target;if(t.id==='impFile'&&t.files&&t.files[0]){if(!can.cost())return denied();importBackup(t.files[0]);return;}
 const c=t.dataset&&t.dataset.c;if(!c||!CHG[c])return;if(!can.chg(c))return denied();if(['tipo','proc','comp','compIng'].includes(c))undoMark();if(CHG[c](t)!==false)render();});
document.addEventListener('keydown',e=>{
 if(e.target&&e.target.dataset&&e.target.dataset.rail&&ROLE!=='sous'&&railKey(e))return;
 const mod=e.metaKey||e.ctrlKey,k=(e.key||'').toLowerCase(),inField=/^(INPUT|TEXTAREA|SELECT)$/.test((e.target&&e.target.tagName)||'')&&e.target.id!=='palQ';
 if(mod&&e.key==='\\'){e.preventDefault();SHELL_ACT.navTog();return;}
 if(mod&&!e.shiftKey&&!e.altKey&&/^[1-5]$/.test(e.key)&&ROLE!=='sous'){const f=FAMILIES.filter(x=>famPages(x[0]).length)[+e.key-1];if(f){e.preventDefault();ACT.fam(f[0]);return;}}
 if(mod&&k==='k'&&!(APP_MODE==='app'&&AUTH.state!=='ready')){e.preventDefault();U.pal?ACT.palClose():ACT.palOpen();return;}
 if(U.pal){const n=palItems(U.pal.q||'').length;
  if(e.key==='Escape'){e.preventDefault();ACT.palClose();return;}
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();U.pal.sel=((U.pal.sel||0)+(e.key==='ArrowDown'?1:-1)+n)%Math.max(1,n);render();setTimeout(()=>{const el=document.getElementById('pal-'+U.pal.sel);el&&el.scrollIntoView&&el.scrollIntoView({block:'nearest'});},0);return;}
  if(e.key==='Enter'){e.preventDefault();palRun(U.pal.sel||0);return;}
  return;}
 if(mod&&k==='s'&&can.act('save')&&ROLE!=='sous'){e.preventDefault();ACT.save();return;}
 if(mod&&k==='z'&&!e.shiftKey&&!inField&&can.act('undo')){e.preventDefault();ACT.undo();return;}if(e.key==='Enter'&&e.target.dataset&&e.target.dataset.i==='auth'){e.preventDefault();ACT.authGo();return;}if(e.key==='Enter'&&e.target.id==='q'){e.preventDefault();addSel();}if(e.key==='Enter'&&e.target.id==='addG'){e.preventDefault();addSel();}if(e.key==='Enter'&&e.target.id==='scaleG'){e.preventDefault();ACT.scale();}});

/* ---------- BOOT ---------- */
if(APP_MODE==='app')AUTH.boot();else{renderNow();STORE.init();}

