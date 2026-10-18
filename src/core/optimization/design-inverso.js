/* ===================== DESIGN INVERSO · ALTERNATIVAS E COMPROMISSOS (v18.4) =====================
   O gerador devolve uma receita para um conjunto de metas. Aqui as metas variam dentro da faixa da família
   (grade de POD × gordura × MSNF, ou × sólidos nas bases sem leite), cada ponto vira uma receita pelo mesmo
   generate(), e só ficam as receitas que nenhuma outra supera em todos os critérios escolhidos (fronteira de Pareto).
   Todas as opções respeitam o congelamento da família na vitrine e as faixas do perfil; nenhuma é "a melhor":
   cada uma troca um critério por outro. Critérios D = contas de composição; H = modelos heurísticos (ver natTag). */
const FRONT_CRIT={
 cost:{n:'Menor custo',u:'R$/kg',dir:-1,eps:.05,d:2,nat:'D',v:m=>m.costKg,maestro:1},
 sug:{n:'Menos açúcar',u:'g/100 g',dir:-1,eps:.15,d:1,nat:'D',v:m=>m.nut.sug},
 kcal:{n:'Menos calorias',u:'kcal/100 g',dir:-1,eps:1,d:0,nat:'D',v:m=>m.nut.kcal},
 sol:{n:'Mais corpo (sólidos)',u:'%',dir:1,eps:.15,d:1,nat:'D',v:m=>m.sol},
 fat:{n:'Mais gordura (cremosidade)',u:'%',dir:1,eps:.15,d:1,nat:'D',v:m=>m.fat},
 melt:{n:'Derrete mais devagar',u:'% em 10 min',dir:-1,eps:1,d:0,nat:'H',v:m=>m.melt10},
 ci:{n:'Cristais mais finos',u:'/100',dir:1,eps:1,d:0,nat:'H',v:m=>m.ci}};
const frontLv=(r,n)=>n<2?[(r[0]+r[1])/2]:Array.from({length:n},(_,i)=>Math.round((r[0]+(r[1]-r[0])*i/(n-1))*10)/10);
/* a domina b: não é pior em nenhum critério (tolerância eps) e é melhor em pelo menos um */
function paretoFront(opts,crits){const better=(a,b,k)=>{const c=FRONT_CRIT[k];return(a.v[k]-b.v[k])*c.dir>c.eps;};
 const worse=(a,b,k)=>better(b,a,k);
 const nd=opts.filter(a=>!opts.some(b=>b!==a&&crits.every(k=>!worse(b,a,k))&&crits.some(k=>better(b,a,k))));
 /* opções iguais dentro da tolerância em todos os critérios: fica a primeira */
 return nd.filter((a,i)=>!nd.slice(0,i).some(b=>crits.every(k=>Math.abs(a.v[k]-b.v[k])<=FRONT_CRIT[k].eps)));}
function genFrontier(o,crits){
 crits=(crits||[]).filter(k=>FRONT_CRIT[k]);if(crits.length<2)return{ok:false,msg:'Escolha pelo menos dois critérios.'};
 const P=PROF[o.tipo]||PROF.crema,ids=genVars(o.tipo),dairy=ids.includes('lpd'),hasFat=ids.some(id=>ING_BY[id]&&contrib(id).fat>.05);
 const st=genSolTgt(o.tipo),pods=frontLv(P.pod,5),fats=hasFat?frontLv(P.fat,4):[o.fat],msnfs=dairy&&!st?frontLv(P.msnf,3):[o.msnf],sols=st?frontLv(P.sol,3):[o.sol];
 const inR=(v,r,t)=>v>=r[0]-t&&v<=r[1]+t,seen=new Set(),opts=[];let tried=0;
 for(const pod of pods)for(const fat of fats)for(const msnf of msnfs)for(const sol of sols){tried++;
  const r=generate({...o,pod,fat,msnf,sol});if(!r.ok)continue;
  const m=o.costs?analyze({tipo:o.tipo,vit:o.vit,recipe:r.recipe,proc:o.proc||{},brix:{},costs:o.costs}):r.m;
  if(!inR(m.pod,P.pod,.5)||!inR(m.sol,P.sol,.8)||(hasFat&&!inR(m.fat,P.fat,.5))||(dairy&&!inR(m.msnf,P.msnf,.5)))continue;
  const key=r.recipe.map(x=>x.id+Math.round(x.g/5)).sort().join('|');if(seen.has(key))continue;seen.add(key);
  const v={};for(const k in FRONT_CRIT)v[k]=FRONT_CRIT[k].v(m);opts.push({recipe:r.recipe,m,v,tgt:{pod,fat,msnf,sol}});}
 if(!opts.length){const g0=generate(o);return{ok:false,msg:'Nenhuma combinação de metas dentro da faixa de '+P.n+' ficou viável com esses ingredientes fixos a '+f1(+o.vit)+' °C.'+(g0.ok?'':' '+g0.msg),tried};}
 const front=paretoFront(opts,crits),k0=crits[0];
 front.sort((a,b)=>(a.v[k0]-b.v[k0])*-FRONT_CRIT[k0].dir);
 const best={};crits.forEach(k=>{best[k]=front.reduce((a,b)=>(b.v[k]-a.v[k])*FRONT_CRIT[k].dir>0?b:a);});
 front.forEach(f=>{f.best=crits.filter(k=>best[k]===f);});
 return{ok:true,front,feasible:opts.length,tried,crits};}
