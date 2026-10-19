/* ===================== ANÁLISE SENSORIAL (v18.15 · §24, §25) =====================
   Métodos escolhidos pelo objetivo do experimento, todos com amostras codificadas e ordem balanceada:
     triângulo  — "as duas versões são diferentes?" (discriminação; ISO 4120). Binomial exato, chance 1/3.
     perfil     — "quanto de cada atributo?" (escala estruturada 0–10 com âncoras). ANOVA amostra × avaliador.
     ponto ideal + hedônica — "gostam? o que ajustar?" (JAR −2…+2 e 1–9). Análise de penalidade.
     ordenação  — "qual tem mais X / qual preferem?" Teste de Friedman.
     TDS        — "como o sabor evolui na boca?" (dominância temporal; Pineau et al., 2009).
   Nada aqui calcula sensação a partir da receita: só analisa julgamentos humanos registrados nos lotes.
   As funções de distribuição usam ibeta/lgam de core/experiments/doe.js. */
/* léxico (§24): o que avaliar, âncoras da escala e a grandeza física que pode explicar o atributo (hipótese, não lei).
   inst(m, me): valor instrumental do lote — medido (me) quando existe, senão previsto pelo motor (m). */
const SENS_ATTR=[
 {id:'doce',n:'Doçura',k:'gosto',lo:'nada doce',hi:'extremamente doce',def:'Intensidade do gosto doce, logo após a colherada.',
  inst:{n:'Doçura prevista na temperatura de serviço (POD corrigido)',u:'%',f:(m,me)=>[m.podPerc,'previsto']}},
 {id:'acido',n:'Acidez',k:'gosto',lo:'nada ácido',hi:'muito ácido',def:'Intensidade do gosto ácido.',
  inst:{n:'pH da mistura (mais baixo = mais ácido)',u:'',f:(m,me)=>me.ph!=null&&me.ph!==''?[+me.ph,'medido']:[m.ph,'previsto'],sign:-1}},
 {id:'amargo',n:'Amargor',k:'gosto',lo:'nada amargo',hi:'muito amargo',def:'Intensidade do gosto amargo (cacau, café, casca).',inst:null},
 {id:'sal',n:'Salinidade',k:'gosto',lo:'nada salgado',hi:'muito salgado',def:'Intensidade do gosto salgado.',
  inst:{n:'Sal na mistura',u:'g/100 g',f:(m,me)=>[m.salt,'previsto']}},
 {id:'aroma',n:'Intensidade aromática',k:'aroma',lo:'sem aroma',hi:'aroma muito intenso',def:'Força do aroma por via retronasal (com a boca fechada, depois de engolir).',
  inst:{n:'Aroma liberado na temperatura de serviço (índice do motor)',u:'0–100',f:(m,me)=>[m.aromaVit,'previsto']}},
 {id:'pers',n:'Persistência',k:'tempo',lo:'some na hora',hi:'dura muito',def:'Quanto tempo o sabor fica depois de engolir.',inst:null},
 {id:'crem',n:'Cremosidade',k:'textura',lo:'nada cremoso',hi:'muito cremoso',def:'Sensação lisa e envolvente ao espalhar na língua.',
  inst:{n:'Gordura',u:'%',f:(m,me)=>[m.fat,'previsto']}},
 {id:'corpo',n:'Corpo',k:'textura',lo:'aguado, ralo',hi:'muito encorpado',def:'Sensação de densidade e consistência na boca.',
  inst:{n:'Sólidos totais',u:'%',f:(m,me)=>[m.sol,'previsto']}},
 {id:'frio',n:'Sensação de frio',k:'textura',lo:'pouco frio',hi:'gelado demais',def:'Quanto o gelato parece gelado ao entrar na boca.',
  inst:{n:'Água congelada na temperatura avaliada',u:'%',f:(m,me)=>[m.fzVit,'previsto']}},
 {id:'elast',n:'Elasticidade',k:'textura',lo:'quebradiço',hi:'muito elástico, puxa',def:'Quanto a massa estica e volta ao ser puxada pela colher.',
  inst:{n:'Hidrocoloides',u:'%',f:(m,me)=>[m.hydro,'previsto']}},
 {id:'gran',n:'Granulosidade',k:'textura',lo:'totalmente liso',hi:'muito granuloso',def:'Cristais ou areia perceptíveis (gelo grosso ou lactose cristalizada).',
  inst:{n:'Cristal de gelo previsto (índice do motor em µm)',u:'µm',f:(m,me)=>[m.crystal,'previsto']}},
 {id:'derr',n:'Derretimento na boca',k:'textura',lo:'derrete devagar',hi:'derrete muito rápido',def:'Velocidade com que derrete na boca.',
  inst:{n:'Derretido em 10 min a 20 °C',u:'%',f:(m,me)=>me.melt10!=null&&me.melt10!==''?[+me.melt10,'medido']:[m.melt10,'previsto']}},
 {id:'liber',n:'Liberação temporal do sabor',k:'tempo',lo:'—',hi:'—',def:'Medida pela dominância temporal (TDS), não por escala.',inst:null,tds:true},
 {id:'resid',n:'Residual de gordura',k:'textura',lo:'boca limpa',hi:'película de gordura',def:'Película gordurosa que fica na boca depois de engolir.',
  inst:{n:'Gordura',u:'%',f:(m,me)=>[m.fat,'previsto']}}];
const SENS_BY=Object.fromEntries(SENS_ATTR.map(a=>[a.id,a]));
const SENS_METHODS={
 tri:{n:'Triângulo',q:'As duas versões são diferentes?',lots:[2,2],how:'Cada provador recebe 3 copos (2 iguais e 1 diferente) e aponta o diferente. Responde só se há diferença perceptível, não qual é melhor.'},
 qda:{n:'Perfil por escala',q:'Quanto de cada atributo cada versão tem?',lots:[2,6],how:'Escala de 0 a 10 com âncoras para os atributos escolhidos. Melhor com provadores treinados nas mesmas referências.'},
 jar:{n:'Ponto ideal e aceitação',q:'Gostam? O que ajustar?',lots:[2,6],how:'Doçura, dureza e cremosidade no ponto ideal (−2 a +2) e quanto gostou (1 a 9). Mostra quanto cada desvio custa na nota. É a preferência deste painel, não uma verdade universal.'},
 rank:{n:'Ordenação',q:'Em que ordem ficam as amostras?',lots:[3,6],how:'O provador ordena todas as amostras por um critério (por exemplo, doçura ou preferência). Rápido, mas não diz o tamanho da diferença.'},
 tds:{n:'Dominância temporal (TDS)',q:'Como o sabor evolui na boca?',lots:[1,6],how:'Ao provar, o provador toca o atributo que domina a sensação naquele instante, até o sabor acabar. Mostra a sequência de sensações no tempo.'}};
/* ---------- estatística ---------- */
const sMean=v=>v.reduce((a,b)=>a+b,0)/v.length;
const sSd=v=>{if(v.length<2)return null;const m=sMean(v);return Math.sqrt(v.reduce((a,b)=>a+(b-m)*(b-m),0)/(v.length-1));};
/* t crítico bilateral (ex.: alpha = 0,05 → 95%) por bisseção sobre o p do t de Student */
function tCrit(df,alpha){alpha=alpha||.05;if(!(df>0))return NaN;let lo=0,hi=1000;for(let i=0;i<80;i++){const mid=(lo+hi)/2;if(tP2(mid,df)>alpha)lo=mid;else hi=mid;}return(lo+hi)/2;}
function ciMean(v,alpha){v=v.filter(x=>x!=null&&isFinite(x));const n=v.length;if(!n)return null;const m=sMean(v),sd=sSd(v);
 if(n<2)return{n,m,sd:null,lo:null,hi:null};const h=tCrit(n-1,alpha)*sd/Math.sqrt(n);return{n,m,sd,lo:m-h,hi:m+h};}
/* binomial: P(X ≥ k) exato */
function binomUpper(n,k,p){let s=0;for(let i=Math.max(0,k);i<=n;i++)s+=Math.exp(lgam(n+1)-lgam(i+1)-lgam(n-i+1)+i*Math.log(p)+(n-i)*Math.log(1-p));return Math.min(1,s);}
function triMin(n,alpha){alpha=alpha||.05;for(let k=0;k<=n;k++)if(binomUpper(n,k,1/3)<=alpha)return k;return null;}
/* F de Fisher: P(F > f) */
const fP=(f,d1,d2)=>!(f>0)?1:ibeta(d2/2,d1/2,d2/(d2+d1*f));
/* gama incompleta regularizada superior Q(a,x) (série e frações contínuas, Numerical Recipes) → qui-quadrado */
function gammaQ(a,x){if(x<=0)return 1;const gl=lgam(a);
 if(x<a+1){let ap=a,sum=1/a,del=sum;for(let n=0;n<500;n++){ap++;del*=x/ap;sum+=del;if(Math.abs(del)<Math.abs(sum)*1e-14)break;}return 1-sum*Math.exp(-x+a*Math.log(x)-gl);}
 let b=x+1-a,c=1/1e-300,d=1/b,h=d;for(let i=1;i<500;i++){const an=-i*(i-a);b+=2;d=an*d+b;if(Math.abs(d)<1e-300)d=1e-300;c=b+an/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<1e-14)break;}
 return Math.exp(-x+a*Math.log(x)-gl)*h;}
const chiP=(x,df)=>gammaQ(df/2,x/2);
/* ---------- triângulo ---------- */
function triAnalyze(evals){const n=evals.length,k=evals.filter(e=>e.ok).length;if(!n)return{n:0};
 const p=binomUpper(n,k,1/3),min=triMin(n),pc=k/n,pd=Math.max(0,1.5*pc-.5);
 return{n,k,p,min,pc,pd,diff:p<=.05,
  verdict:p<=.05?'diferença percebida':'diferença não detectada',
  note:p<=.05?`${k} de ${n} acertaram o copo diferente; ao acaso seriam ${f1(n/3)}. Chance de isso acontecer sem diferença real: ${p<.001?'< 0,1':f1(p*100)}%.`
   :`${k} de ${n} acertaram (eram necessários ${min==null?'mais provadores':min}). Não detectar diferença não prova que as versões são iguais: com poucos provadores, só diferenças grandes aparecem.`};}
/* ---------- perfil por escala: ANOVA de dois fatores sem interação (amostra × avaliador, blocos completos) ----------
   Y: {avaliador: {amostra: nota}}. Avaliador que não provou todas as amostras fica de fora da ANOVA. */
function anova2(Y,samples){const ts=Object.keys(Y).filter(t=>samples.every(s=>Y[t][s]!=null&&isFinite(Y[t][s])));const a=samples.length,b=ts.length;
 if(a<2||b<2)return{a,b,ok:false};const g=sMean(ts.flatMap(t=>samples.map(s=>Y[t][s])));
 const ms=samples.map(s=>sMean(ts.map(t=>Y[t][s]))),mt=ts.map(t=>sMean(samples.map(s=>Y[t][s])));
 let sst=0;ts.forEach(t=>samples.forEach(s=>{sst+=(Y[t][s]-g)**2;}));const ssa=b*ms.reduce((x,m)=>x+(m-g)**2,0),ssb=a*mt.reduce((x,m)=>x+(m-g)**2,0),sse=Math.max(0,sst-ssa-ssb);
 const dfa=a-1,dfb=b-1,dfe=dfa*dfb,mse=sse/dfe,Fa=mse>0?ssa/dfa/mse:(ssa>0?Infinity:0),Fb=mse>0?ssb/dfb/mse:(ssb>0?Infinity:0);
 const pa=mse>0?fP(Fa,dfa,dfe):(ssa>0?0:1),pb=mse>0?fP(Fb,dfb,dfe):(ssb>0?0:1);
 const tc=tCrit(dfe),se=Math.sqrt(mse/b),lsd=tc*Math.sqrt(2*mse/b);
 const varT=Math.max(0,(ssb/dfb-mse)/a);
 return{ok:true,a,b,tasters:ts,means:samples.map((s,i)=>({s,m:ms[i],lo:ms[i]-tc*se,hi:ms[i]+tc*se})),Fa,pa,Fb,pb,mse,dfe,lsd,
  /* LSD protegido de Fisher: só compara pares se o F das amostras for significativo */
  pairs:pa<=.05?samples.flatMap((s,i)=>samples.slice(i+1).map((s2,j)=>({a:s,b:s2,d:ms[i]-ms[i+1+j],sig:Math.abs(ms[i]-ms[i+1+j])>lsd}))):[],
  tasterShare:varT/(varT+mse||1),resSd:Math.sqrt(mse)};}
/* ---------- ordenação: Friedman ----------  R: {avaliador: {amostra: posição 1..k}} */
function friedman(R,samples){const ts=Object.keys(R).filter(t=>samples.every(s=>R[t][s]>0));const n=ts.length,k=samples.length;if(n<2||k<3)return{n,k,ok:false};
 const sums=samples.map(s=>ts.reduce((a,t)=>a+R[t][s],0));const chi=12/(n*k*(k+1))*sums.reduce((a,x)=>a+x*x,0)-3*n*(k+1);const p=chiP(chi,k-1);
 /* diferença mínima entre somas de postos (comparações múltiplas, aproximação normal, alfa 5% bilateral) */
 const dmin=1.96*Math.sqrt(n*k*(k+1)/6);
 return{ok:true,n,k,sums:samples.map((s,i)=>({s,sum:sums[i],mean:sums[i]/n})),chi,p,dmin};}
/* ---------- ponto ideal + hedônica: análise de penalidade ----------
   Para cada atributo JAR: quem achou "pouco" (−2/−1), "ideal" (0) e "demais" (+1/+2); queda média de aceitação de cada
   grupo em relação ao grupo ideal. Prática comum: só olhar grupos com ≥ 20% das respostas. */
function penalty(evals,key){const e=evals.filter(x=>x[key]!=null&&x[key]!==''&&x.hed!=null&&x.hed!=='');const n=e.length;if(n<3)return null;
 const g=f=>e.filter(x=>f(+x[key])).map(x=>+x.hed);const ideal=g(v=>v===0),lo=g(v=>v<0),hi=g(v=>v>0);const mI=ideal.length?sMean(ideal):null;
 const grp=(v,lab)=>({lab,pct:v.length/n*100,n:v.length,drop:mI!=null&&v.length?mI-sMean(v):null,relevant:v.length/n>=.2});
 return{n,ideal:grp(ideal,'ideal'),lo:grp(lo,'pouco'),hi:grp(hi,'demais')};}
/* ---------- TDS: curvas de dominância ----------
   Cada avaliação: {seq:[[s, atributo], ...], end:s}. Tempo padronizado 0–1 por avaliação (do primeiro toque ao fim).
   Chance P0 = 1/(nº de atributos); significância Ps = P0 + 1,645·√(P0(1−P0)/n) (Pineau et al., 2009). */
function tdsCurves(evals,attrs,bins){bins=bins||40;const ev=evals.filter(e=>e&&e.seq&&e.seq.length&&e.end>e.seq[0][0]);const n=ev.length,k=attrs.length;if(!n||!k)return{n,ok:false};
 const cur={};attrs.forEach(a=>cur[a]=new Array(bins).fill(0));
 ev.forEach(e=>{const t0=e.seq[0][0],T=e.end-t0;for(let b=0;b<bins;b++){const t=t0+(b+.5)/bins*T;let dom=null;for(const[s,a]of e.seq){if(s<=t)dom=a;else break;}if(dom&&cur[dom])cur[dom][b]++;}});
 const P0=1/k,Ps=P0+1.645*Math.sqrt(P0*(1-P0)/n);
 const out=attrs.map(a=>({a,rate:cur[a].map(c=>c/n),maxRate:Math.max(...cur[a])/n}));
 return{ok:true,n,bins,P0,Ps,curves:out,durMean:sMean(ev.map(e=>e.end-e.seq[0][0]))};}
