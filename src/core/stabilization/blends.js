/* ---------- NEUTROS, GERADOR E SENSIBILIDADE ---------- */
function blendShares(parts){const t=Object.values(parts).reduce((a,b)=>a+(+b||0),0)||1;const o={};for(const k in parts)if(+parts[k]>0)o[k]=+parts[k]/t*100;return o;}
function blendIngredient(nx){const sh=blendShares(nx.parts);const c={};let cost=0,animal=0;const parts={};
 for(const k in sh){const nc=NCOMP[k];if(!nc)continue;for(const f in nc.c)c[f]=(c[f]||0)+nc.c[f]*sh[k]/100;cost+=nc.cost*sh[k]/100;if(nc.animal)animal=1;if(nc.dose&&k!=='inu')parts[k]=sh[k]*(nc.c.stab||nc.c.emul||nc.c.fib||100)/100;}
 return I(nx.id,'Neutro · '+nx.name,'Meus neutros',c,{parts,key:'blend',de:19,animal,cost:Math.round(cost),lab:'estabilizantes ('+Object.keys(sh).map(k=>NCOMP[k]?NCOMP[k].n.toLowerCase():k).join(', ')+')',blend:nx});}
/* registra/atualiza um neutro como ingrediente; ING_VER invalida a memória de cálculo */
function registerNeutro(nx){const ing=blendIngredient(nx);const i=ING.findIndex(x=>x.id===ing.id);if(i>=0)ING[i]=ing;else ING.push(ing);ING_BY[ing.id]=ing;ING_VER++;return ing;}
NEUTRO_PRESETS.forEach(registerNeutro);

/* análise de um blend na dose (g por kg de mistura), opcionalmente dentro de uma receita */
function analyzeBlend(nx,dairy){
 const sh=blendShares(nx.parts),dose=(+nx.dose||0)/10; // % da mistura
 const eff={},prof={};NFUN.forEach(([k])=>prof[k]=0);let hyd=20,hydro=0,cost=0;const notes=[];
 for(const k in sh){const nc=NCOMP[k];if(!nc)continue;const e=sh[k]/100*dose;eff[k]=e;cost+=nc.cost*sh[k]/100;
  if(nc.c.stab)hydro+=e*nc.c.stab/100;if(k==='starch')hydro+=e*.1; /* amido: ~10× a dose de goma para o mesmo efeito na água livre */if(sh[k]>=1)hyd=Math.max(hyd,nc.hyd);
  if(nc.dose){const mid=(nc.dose[0]+nc.dose[1])/2,load=e/mid;for(const f in nc.f)prof[f]+=load*nc.f[f];}}
 const P={};NFUN.forEach(([k])=>P[k]=Math.round(prof[k]>0?100*(1-Math.exp(-prof[k]/8)):0));
 const has=k=>(eff[k]||0)>0;const pr=k=>NCOMP[k]&&NCOMP[k].dose;
 for(const k in eff){const r=pr(k);if(!r)continue;const e=eff[k];
  if(e>r[1]*1.15)notes.push({sev:'warn',t:NCOMP[k].n+' acima da dose ('+f2(e)+'% da mistura; faixa '+fRg(r)+'%)',fix:k==='xan'?'Xantana em excesso dá textura elástica e gomosa.':k==='inu'?'Na porção de 90 g isso dá '+f1(e*.9)+' g de inulina. Estudo com adultos saudáveis: até 10 g/dia de inulina nativa foram bem tolerados (Bonnema et al., 2010); conte a inulina de todo o dia.':'Reduza a proporção no blend ou a dose.'});
  else if(e<r[0]*.5&&k!=='acacia'&&k!=='inu')notes.push({sev:'info',t:NCOMP[k].n+' em dose quase simbólica ('+f2(e)+'%)',fix:'Abaixo de '+fT(r[0])+'% o efeito isolado é pequeno; faz sentido apenas como sinergia.'});}
 if(hydro<.15)notes.push({sev:'warn',t:'Hidrocoloides totais baixos ('+f2(hydro)+'% da mistura)',fix:'Gelato artesanal costuma usar 0,2–0,5%. Aumente a dose ou a proporção de gomas.'});
 else if(hydro>.7)notes.push({sev:'warn',t:'Hidrocoloides totais altos ('+f2(hydro)+'%)',fix:'Acima de ~0,6% a textura fica pesada e gomosa e o sabor abafado.'});
 else notes.push({sev:'ok',t:'Hidrocoloides totais na faixa ('+f2(hydro)+'% da mistura)',fix:''});
 if(dairy&&(has('lbg')||has('guar')||has('tara'))&&!has('carr'))notes.push({sev:has('citf')||has('cmc')?'info':'warn',t:'Galactomananas sem carragena em base láctea',fix:'Jataí, guar e tara competem com as caseínas e podem separar soro na mistura maturada. Adicione carragena a 0,01–0,02% da mistura (≈'+f1(dose>0?.015/dose*100:0)+'% do blend).'+(has('citf')||has('cmc')?' A fibra de citros/CMC já reduz esse risco.':'')});
 /* sinergias documentadas (NSYN, com fonte); as duas seguintes são prática de formulação, sem fonte registrada */
 blendSyn(Object.keys(eff),dairy).filter(x=>x.b!=='leite').forEach(x=>notes.push({sev:'info',t:'Sinergia documentada: '+NCOMP[x.a].n+' + '+NCOMP[x.b].n,fix:x.t+' Fonte: '+x.src.map(r=>NREF[r].c).join('; ')+'.'+(x.a==='lbg'&&x.b==='xan'?' Mantenha a xantana baixa para não ficar "puxa-puxa".':'')}));
 if(has('lbg')&&has('guar'))notes.push({sev:'ok',t:'Jataí + guar: dupla clássica',fix:'O guar dá viscosidade a frio e a jataí controla os cristais após 85 °C. (Prática de formulação; sem fonte registrada para a combinação.)'});
 if(has('tara')&&has('lbg'))notes.push({sev:'ok',t:'Tara complementa a jataí',fix:'Tara tem comportamento intermediário entre guar e jataí e hidrata parcialmente a frio (Colony Gums, ficha técnica).'});
 if(has('starch'))notes.push({sev:'info',t:'Estabilização por amido (técnica siciliana)',fix:'Cozinhe a 85–90 °C por 1–2 min para gelatinizar; acima de ~3% da mistura a textura vira pudim. Não use em frutas cruas.'});
 if(has('konj')&&(eff.konj||0)>.3)notes.push({sev:'info',t:'Glucomanano alto: textura elástica',fix:'Acima de ~0,3% o gelato estica e quase não derrete (estilo dondurma). Para vitrine italiana, fique em 0,1–0,2% e combine com jataí.'});
 if(has('gel'))notes.push({sev:'info',t:'Contém gelatina animal',fix:'Não serve para receitas veganas; hidrate acima de 60 °C.'});
 if(has('inu')&&sh.inu>40)notes.push({sev:'info',t:'Blend com base de inulina ('+f0(sh.inu)+'%)',fix:'A inulina funciona como veículo funcional: dá corpo, conta como fibra e adiciona PAC/POD baixos. A dose do neutro precisa ser alta ('+f0(nx.dose)+' g/kg) para as gomas chegarem à faixa.'});
 if(has('acacia'))notes.push({sev:'ok',t:'Goma acácia como emulsificante natural',fix:'Baixa viscosidade; ajuda a manter gordura e aromas dispersos e retarda cristais de açúcar.'});
 if(hyd>=80)notes.push({sev:'info',t:'Exige pasteurização a '+hyd+' °C ou mais',fix:'Abaixo disso os componentes de hidratação a quente trabalham parcialmente.'});
 else notes.push({sev:'ok',t:'Hidrata a frio',fix:'Pode ser usado em bases a frio (frutas cruas), com mistura em alta rotação.'});
 if(!has('lec')&&!has('mono')&&!has('acacia')&&dairy)notes.push({sev:'info',t:'Sem emulsificante no blend',fix:'Em bases com 8%+ de gordura, emulsificantes deixam a textura mais seca e o derretimento mais lento (ou use gema na receita).'});
 return{sh,eff,P,hyd,hydro,dose,notes,costKg:cost,costPerKgMix:cost*nx.dose/1000};
}
/* sinergias e interações documentadas presentes num conjunto de componentes (qualitativas; sem coeficiente) */
function blendSyn(keys,dairy){const K=new Set(keys);return NSYN.filter(x=>K.has(x.a)&&(x.b==='leite'?!!dairy:K.has(x.b)));}
/* componentes que não são de origem natural (o laboratório não exige sintéticos) */
const blendNonNat=parts=>Object.keys(parts||{}).filter(k=>+parts[k]>0&&NKB[k]&&!['natural','fermentação'].includes(NKB[k].nat));
/* resultados observados nos lotes que usaram o blend (comparação observacional: os lotes diferem em outras coisas) */
function blendObserved(id,lots){const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;const num=v=>v!=null&&v!==''&&isFinite(+v)?+v:null;
 const L=(lots||[]).filter(l=>l&&!l.deleted&&Array.isArray(l.recipe)&&l.recipe.some(r=>r.id===id&&+r.g>0));
 const melt=[],dMelt=[],ov=[],icy=[],sens={gelo:[],corpo:[],cremoso:[],derr:[]};
 L.forEach(l=>{const me=l.meas||{};const m=num(me.melt10);if(m!=null){melt.push(m);const p=l.pred&&num(l.pred.melt10);if(p!=null)dMelt.push(m-p);}
  const o=measuredOverrun(me);if(o!=null&&isFinite(o))ov.push(o);
  const d=num(me.icyDay);if(d!=null)icy.push(d);const se=l.sens||{};for(const k in sens){const v=num(se[k]);if(v!=null)sens[k].push(v);}});
 const S={};for(const k in sens)S[k]={n:sens[k].length,v:mean(sens[k])};
 return{n:L.length,melt:{n:melt.length,v:mean(melt),bias:mean(dMelt),nb:dMelt.length},ov:{n:ov.length,v:mean(ov)},icy:{n:icy.length,v:mean(icy)},sens:S,ids:L.map(l=>l.id)};}
/* troca o estabilizante da receita pelo blend na dose indicada */
function withBlend(st,ingId,doseGkg){const isStab=r=>{const i=ING_BY[r.id];return i&&(i.cat==='Estabilizantes'||i.cat==='Meus neutros')&&i.key!=='starch';};
 const base=(st.recipe||[]).filter(r=>!isStab(r));const tot=base.reduce((a,r)=>a+(+r.g||0),0);const g=Math.round(tot*doseGkg/(1000-doseGkg)*10)/10;
 return{...st,recipe:base.concat([{id:ingId,g}])};}

