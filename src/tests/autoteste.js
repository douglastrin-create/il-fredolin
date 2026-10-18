/* ==== 35-tests.js ==== */
/* ===================== IL FREDOLIN · BATERIA DE TESTES =====================
   Roda igual no Node (antes de publicar) e dentro do app (Dados e sincronização → Testes do motor).
   Usa todas as receitas dos mestres e as bases como referência fixa. A calibração pelos lotes do usuário
   fica desligada durante os testes, para que o resultado dependa só do motor. */
const TEST_VITS=[-11,-14.5,-18];
const GOLD_KEYS=['sol','fat','pod','pacKg','fzVit','serveT','ov','visc','ph','shelfVit'];
function testRecipes(){const out=[];
 MASTERS.forEach((p,k)=>out.push({key:'mas'+k,name:p.a+' · '+p.name,tipo:p.tipo,vit:p.vit,recipe:p.recipe.map(([id,g])=>({id,g}))}));
 PRESETS.forEach((p,k)=>out.push({key:'pre'+k,name:'Base · '+p.name,tipo:p.tipo,vit:p.vit,recipe:p.recipe.map(([id,g])=>({id,g}))}));
 return out;}
const stTest=(r,vit,proc)=>({tipo:r.tipo,vit:vit!=null?vit:r.vit,recipe:r.recipe,proc:Object.assign({},PROC0,proc||{}),brix:{},costs:{}});
function applyOps(recipe,ops){const rec=recipe.map(x=>({...x}));ops.forEach(([id,d])=>{const r=rec.find(x=>x.id===id);if(r)r.g=+r.g+d;else rec.push({id,g:d});});return rec.filter(r=>r.g>1e-9);}
function badNums(m){const bad=[];for(const k in m){const v=m[k];if(typeof v==='number'&&!isFinite(v))bad.push(k);}for(const k in m.nut)if(!isFinite(m.nut[k]))bad.push('nut.'+k);return bad;}
const badText=s=>/NaN|undefined|Infinity|\[object/.test(s);

function runTests(opt){opt=opt||{};const t0=(typeof performance!=='undefined'?performance:Date).now();
 const list=[];const T=(group,name,fn)=>{let ok,detail;try{const r=fn();ok=r===true||(r&&r.ok);detail=r&&r.detail||'';}catch(e){ok=false;detail='erro: '+(e&&e.message||e);}list.push({group,name,ok,detail});};
 const calPrev=CAL.on;CAL.on=false;
 try{
 const recs=testRecipes();
 /* ---- 1. banco de ingredientes ---- */
 T('Dados','Composição de cada ingrediente do banco soma 98–100,6%',()=>{const bad=ING.filter(i=>{if(i.custom)return false;const t=MASS.reduce((a,f)=>a+(i.c[f]||0),0);return t<98||t>100.6;});return{ok:!bad.length,detail:bad.length?bad.map(i=>i.id).join(', '):ING.length+' ingredientes'};});
 T('Dados','Ids únicos e receitas só com ingredientes do banco',()=>{const ids=new Set();const dup=[];ING.forEach(i=>{if(ids.has(i.id))dup.push(i.id);ids.add(i.id);});const miss=[];recs.forEach(r=>r.recipe.forEach(x=>{if(!ING_BY[x.id])miss.push(r.name+': '+x.id);}));return{ok:!dup.length&&!miss.length,detail:[...dup,...miss].join('; ')||recs.length+' receitas'};});
 T('Dados','pH só em faixa física (2–7,5)',()=>{const bad=ING.filter(i=>i.ph!=null&&(i.ph<2||i.ph>7.5));return{ok:!bad.length,detail:bad.map(i=>i.id).join(', ')};});
 /* ---- 2. física ---- */
 T('Física','Curva Goff–Hartel crescente e invertível',()=>{let prev=-1;for(let se=0;se<=300;se+=5){const d=fpdSE(se);if(d<prev)return{ok:false,detail:'decresce em SE '+se};prev=d;if(se>0&&Math.abs(seFromFpd(d)-se)>.01)return{ok:false,detail:'inversa falha em SE '+se};}return true;});
 T('Física','Âncora: sacarose 64% (180 g/100 g de água) a −13,7 °C (Goff–Hartel)',()=>{const d=fpdSE(180);return{ok:Math.abs(d-13.68)<.02,detail:'FPD '+f2(d)+' °C'};});
 T('Física','Âncora: sacarose 80% (Cg′) perto do Tm′ de −32 a −36 °C',()=>{const d=fpdSE(400);return{ok:d>32&&d<36,detail:'FPD '+f1(d)+' °C'};});
 T('Física','Água não congelável: fração congelada para no limite do Cg′',()=>{const SE=60;const f=frozenPct(-60,SE,0);return{ok:Math.abs(f-(1-SE/SE_CG)*100)<.5,detail:f1(f)+'%'};});
 T('Física','Âncora: sacarose 10% em água congela a ≈ −0,6 °C',()=>{const se=10/90*100;const d=fpdSE(se);return{ok:d>.55&&d<.75,detail:'FPD '+f2(d)+' °C'};});
 T('Física','Âncora: leite integral congela a ≈ −0,52 °C',()=>{const m=analyzeRaw(stTest({tipo:'crema',recipe:[{id:'leite',g:1000}]},-13));return{ok:m.fp<-.45&&m.fp>-.62,detail:'ponto de congelamento '+f2(m.fp)+' °C'};});
 T('Física','Fração congelada cresce com o frio e inverte tempForFrozen',()=>{const SE=60,Sx=.8;let prev=-1;for(let t=-1;t>=-30;t-=.5){const f=frozenPct(t,SE,Sx);if(f<prev-1e-9)return{ok:false,detail:'não monotônica em '+t};prev=f;}for(const p of [40,55,68,74,85]){const t=tempForFrozen(p,SE,Sx);const back=frozenPct(t,SE,Sx);if(Math.abs(back-p)>.05)return{ok:false,detail:p+'% → '+t.toFixed(2)+' °C → '+back.toFixed(2)+'%'};}return true;});
 T('Física','Âncora Corvitto: fiordilatte serve entre −14 e −10 °C',()=>{const r=recs.find(x=>x.key==='pre0');const m=analyzeRaw(stTest(r));return{ok:m.serveT<-10&&m.serveT>-14,detail:'serviço '+f1(m.serveT)+' °C, PAC '+f0(m.pacKg)+'/kg'};});
 T('Física','Mais dextrose → mais mole; mais creme → mais gordura',()=>{const r=recs.find(x=>x.key==='pre0');const base=analyzeRaw(stTest(r));const dx=analyzeRaw(stTest({...r,recipe:applyOps(r.recipe,[['dextrose',30]])}));const cr=analyzeRaw(stTest({...r,recipe:applyOps(r.recipe,[['creme35',80]])}));return{ok:dx.fzVit<base.fzVit&&cr.fat>base.fat&&dx.SE>base.SE,detail:'congelada '+f1(base.fzVit)+' → '+f1(dx.fzVit)+'%'};});
 /* ---- 3. todas as receitas em três vitrines e no modo freezer ---- */
 T('Receitas',MASTERS.length+' mestres + '+PRESETS.length+' bases sem valores inválidos em 4 condições',()=>{const bad=[];let n=0;recs.forEach(r=>{[...TEST_VITS.map(v=>[v,{}]),[-18,{serveFrom:'freezer',storeT:-18,storeFluct:3}]].forEach(([v,pr])=>{const st=stTest(r,v,pr);const m=analyze(st);n++;const b=badNums(m);if(b.length)bad.push(r.name+' '+v+': '+b.join(','));});});return{ok:!bad.length,detail:bad.slice(0,3).join('; ')||n+' análises'};});
 T('Receitas','Laudo, índice e defeitos com texto válido',()=>{const bad=[];recs.forEach(r=>TEST_VITS.forEach(v=>{const st=stTest(r,v);const m=analyze(st);const F=diagnose(st,m);const sc=score(st,m,F);if(!(sc.total>=0&&sc.total<=100))bad.push(r.name+': índice '+sc.total);F.forEach(f=>{if(badText(f.title+f.why+f.fix))bad.push(r.name+': '+f.title);});DEFECTS.forEach(d=>rankDefect(d,m).forEach(x=>{if(badText(x.txt+x.fix))bad.push(r.name+': defeito '+d.id);}));}));return{ok:!bad.length,detail:bad.slice(0,3).join('; ')};});
 T('Receitas','Nenhuma sugestão de "0 g" ou gramas negativas',()=>{const bad=[];recs.forEach(r=>TEST_VITS.forEach(v=>{const st=stTest(r,v);const m=analyze(st);diagnose(st,m).forEach(f=>{const s=(f.fix||'')+(f.acts||[]).map(a=>a.t).join(' ');if(/(^|[^\d,])0 g\b|−\d+ g de|-\d+ g de/.test(s))bad.push(r.name+' '+v+': '+f.title);});}));return{ok:!bad.length,detail:bad.slice(0,3).join('; ')};});
 /* ---- 4. as soluções do laudo funcionam ---- */
 T('Soluções','Texto da solução e botões mostram as mesmas gramas (vitrine e pote, dextrose mono e anidra)',()=>{let n=0;const bad=[];
  try{['mono','anid'].forEach(df=>{DEX_OVR=df;recs.forEach(r=>[-14.5,-18].forEach(v=>['vitrine','pote'].forEach(sf=>{const st=stReal(stTest(r,v,{serveFrom:sf}));const m=analyze(st);diagnose(st,m).filter(f=>f.acts&&f.acts.length).forEach(f=>f.acts.forEach(a=>{n++;(a.t.match(/(\d+|menos de 1) g/g)||[]).forEach(x=>{if(f.fix.indexOf(x)<0)bad.push(r.name+' '+v+' '+sf+': "'+a.t+'" ≠ texto');});
    const ing=a.ops.map(o=>o[0]).find(id=>id==='dextrose'||id==='dextrosem');if(ing){const nm=ing==='dextrosem'?'mono':'anidra';if(a.t.indexOf(nm)<0||f.fix.indexOf(nm)<0)bad.push(r.name+': nome da dextrose não bate com o ingrediente');
     if(!r.recipe.some(x=>x.id==='dextrose'||x.id==='dextrosem')&&ing!==(df==='anid'?'dextrose':'dextrosem'))bad.push(r.name+': ignorou a preferência de dextrose');}}));})));});}
  finally{DEX_OVR=null;}
  return{ok:!bad.length,detail:bad.slice(0,3).join('; ')||n+' botões conferidos com o texto'};});
 T('Soluções','Ajustes térmicos também resolvem no modo pote e com dextrose monoidratada',()=>{let n=0;const bad=[];
  try{DEX_OVR='mono';recs.forEach(r=>[-14.5,-18].forEach(v=>['vitrine','pote'].forEach(sf=>{const s0=stTest(r,v,{serveFrom:sf}),st=stReal(s0);const m=analyze(st);diagnose(st,m).filter(f=>f.acts).forEach(f=>f.acts.forEach(a=>{n++;const m2=analyze(stReal({...s0,recipe:applyOps(s0.recipe,a.ops)}));const dz=m2.fzVit-m2.fzMid;if(Math.abs(dz)>3.2)bad.push(r.name+' '+v+' '+sf+' · '+a.t+' → '+f1(m2.fzVit)+'%');}));})));}
  finally{DEX_OVR=null;}
  return{ok:!bad.length,detail:bad.slice(0,3).join('; ')||n+' ajustes verificados'};});
 T('Soluções','Cada ajuste térmico sugerido leva à faixa de congelamento',()=>{let n=0;const bad=[];recs.forEach(r=>TEST_VITS.forEach(v=>{const st=stTest(r,v);const m=analyze(st);diagnose(st,m).filter(f=>f.acts).forEach(f=>f.acts.forEach(a=>{n++;const m2=analyze({...st,recipe:applyOps(st.recipe,a.ops)});const dz=m2.fzVit-m2.fzMid;if(Math.abs(dz)>3.2)bad.push(r.name+' '+v+' °C · '+a.t+' → '+f1(m2.fzVit)+'%');if(a.ops.some(([id,d])=>{const x=st.recipe.find(y=>y.id===id);return d<0&&(!x||+x.g+d<-1e-6);}))bad.push(r.name+': retira mais do que existe');}));}));return{ok:!bad.length,detail:bad.slice(0,3).join('; ')||n+' ajustes verificados'};});
 T('Soluções','Balanceador de açúcares não piora o congelamento',()=>{let n=0;const bad=[];recs.forEach(r=>TEST_VITS.forEach(v=>{const st=stTest(r,v);const b=balance(st);if(!b.ok)return;n++;const m0=analyze(st),m1=analyze({...st,recipe:b.newRecipe});const d0=Math.abs(m0.fzVit-m0.fzMid),d1=Math.abs(m1.fzVit-m1.fzMid);if(d1>Math.max(3,d0)+.3)bad.push(r.name+' '+v+': '+f1(d0)+' → '+f1(d1));if(b.newRecipe.some(x=>!(x.g>=0)))bad.push(r.name+': grama negativa');}));return{ok:!bad.length,detail:bad.slice(0,3).join('; ')||n+' balanceamentos'};});
 T('Soluções','Gerador por alvo: congelamento e sólidos na faixa em todos os tipos e famílias',()=>{const fx={sorbetto:[{id:'manga',g:450}],frutta:[{id:'morango',g:350}],gastro:[{id:'gorgonzola',g:80}],granita:[{id:'limao',g:200}],semifreddo:[{id:'morango',g:150}],paleta_fruta:[{id:'morango',g:400}],froyo:[{id:'morango',g:150}],semacucar:[{id:'cacau',g:40}]};const bad=[];Object.keys(PROF).forEach(t=>{const P=PROF[t],sb=P.like==='sorbetto';(P.proc&&P.proc!=='batch'?[P.serveT]:[-11,-14.5]).forEach(v=>{const g=generate({tipo:t,batch:1000,fixed:fx[t]||[{id:'pistache',g:100}],...genDef(t),stabId:sb?'neutro':'nx_fredolin',stabGkg:sb?4:25,vit:v});if(!g.ok){bad.push(t+' '+v+': '+g.msg);return;}const dz=g.m.fzVit-g.m.fzMid;if(Math.abs(dz)>3.2)bad.push(t+' '+v+': '+f1(g.m.fzVit)+'%');const rs=g.m.P.sol;if(g.m.sol<rs[0]-1.5||g.m.sol>rs[1]+1.5)bad.push(t+' '+v+': sólidos '+f1(g.m.sol)+'%');});});return{ok:!bad.length,detail:bad.join('; ')};});
 /* ---- 5. regressão contra a referência ---- */
 if(typeof GOLDEN!=='undefined')T('Regressão','Métricas das receitas iguais à referência',()=>{const bad=[];let n=0;recs.forEach(r=>{const g=GOLDEN[r.key];if(!g)return;const st=stTest(r);const m=analyze(st);const sc=score(st,m,diagnose(st,m)).total;GOLD_KEYS.forEach((k,i)=>{n++;const a=g[i],b=m[k];if(Math.abs(a-b)>1e-4*Math.max(1,Math.abs(a)))bad.push(r.name+' '+k+' '+a+' → '+(+b).toFixed(4));});n++;if(g[GOLD_KEYS.length]!==sc)bad.push(r.name+' índice '+g[GOLD_KEYS.length]+' → '+sc);});return{ok:!bad.length,detail:bad.slice(0,3).join('; ')||n+' valores conferidos'};});
 /* ---- 6. memória de cálculo e neutros ---- */
 T('Motor','Neutro editado invalida a memória de cálculo',()=>{const r=recs.find(x=>x.key==='pre0');const nx={id:'nx_selftest',name:'teste',dose:5,parts:{lbg:40,guar:30,dex:430}};registerNeutro(nx);const st={...stTest(r),recipe:[...r.recipe.filter(x=>x.id!=='nx_fredolin'&&x.id!=='neutro'),{id:'nx_selftest',g:5}]};const a=analyze(st).visc;registerNeutro({...nx,parts:{xan:200,dex:300}});const b=analyze(st).visc;const k=ING.findIndex(i=>i.id==='nx_selftest');if(k>=0)ING.splice(k,1);delete ING_BY.nx_selftest;ING_VER++;return{ok:Math.abs(a-b)>1e-6,detail:'viscosidade '+f1(a)+' → '+f1(b)+' mPa·s'};});
 T('Motor','Calibração: 1 lote medido desloca pouco (prior de 3 lotes)',()=>{const keep=JSON.stringify(CAL);const r=recs.find(x=>x.key==='pre0');const c=fitCalibration([{id:1,tipo:'crema',vit:-13,recipe:r.recipe,proc:{machine:'maqp1'},meas:{ov:40,melt10:60}}]);const ov=c.ov.maqp1;Object.assign(CAL,JSON.parse(keep));CAL.on=false;CAL.ver++;return{ok:ov>0&&ov<15,detail:'viés de overrun '+ov+' pontos'};});
 T('Dados','Caminho da nuvem com número ímpar de segmentos',()=>{const p='data/users/u_x/fredolin/lib'.split('/');return{ok:p.length%2===1,detail:p.length+' segmentos'};});
 /* ---- 7. interface (todas as páginas, quando houver DOM) ---- */
 if(opt.ui&&typeof VIEW!=='undefined'){T('Interface','Todas as páginas desenham sem erro nem texto inválido',()=>{const bad=[];const st=S;const m=analyze(st),F=diagnose(st,m),sc=score(st,m,F);Object.keys(VIEW).forEach(k=>{try{const h=VIEW[k](m,F,sc);if(badText(h.replace(/<input[^>]*value=""[^>]*>/g,'')))bad.push(k+': texto inválido');}catch(e){bad.push(k+': '+e.message);}});return{ok:!bad.length,detail:bad.join('; ')||Object.keys(VIEW).length+' páginas'};});}
 }finally{CAL.on=calPrev;}
 const ms=Math.round((typeof performance!=='undefined'?performance:Date).now()-t0);
 return{list,pass:list.filter(x=>x.ok).length,fail:list.filter(x=>!x.ok).length,ms,date:new Date().toISOString()};}

