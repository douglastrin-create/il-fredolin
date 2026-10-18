/* ==== 34b-doe.js ==== */
/* ===================== IL FREDOLIN · PLANEJAMENTO DE EXPERIMENTOS (v18.1) =====================
   Especificação §28: fatorial 2^k (k = 1–3) com réplicas, pontos centrais e ordem aleatória reproduzível.
   Fatores de ingrediente respeitam a soma da mistura: o peso total do lote fica constante e a diferença sai de um
   ingrediente de compensação (normalmente leite ou água); se ele ficaria negativo, a corrida é marcada inviável.
   A análise (doeAnalyze) ajusta efeitos principais e interações por mínimos quadrados nos níveis codificados;
   com graus de liberdade (réplicas/centros) dá erro-padrão e p bilateral (t de Student); pontos centrais testam
   curvatura. Correlação não é causalidade: só vale para os fatores e a faixa testados. */
function mulberry32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function doeDesign(spec){const F=(spec.factors||[]).slice(0,3);const k=F.length;if(!k)throw new Error('escolha de 1 a 3 fatores');
 F.forEach(f=>{if(!(isFinite(+f.lo)&&isFinite(+f.hi))||+f.lo===+f.hi)throw new Error('faixa inválida em '+(f.label||f.id));});
 const reps=clamp(Math.round(+spec.reps||1),1,3),centers=clamp(Math.round(+spec.centers||0),0,4);
 const runs=[];let std=0;
 for(let r=0;r<reps;r++)for(let i=0;i<(1<<k);i++){const coded=F.map((_,j)=>(i>>j)&1?1:-1);runs.push({std:++std,rep:r+1,coded});}
 for(let c=0;c<centers;c++)runs.push({std:++std,rep:c+1,coded:F.map(()=>0),center:true});
 runs.forEach(R=>{R.values={};F.forEach((f,j)=>{const lo=+f.lo,hi=+f.hi;R.values[f.id]=Math.round(((lo+hi)/2+R.coded[j]*(hi-lo)/2)*100)/100;});});
 const rnd=mulberry32((+spec.seed||1)>>>0);const order=runs.map((_,i)=>i);for(let i=order.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 order.forEach((ri,o)=>{runs[ri].order=o+1;});runs.sort((a,b)=>a.order-b.order);
 return{factors:F,reps,centers,seed:+spec.seed||1,runs,k};}
/* receita de uma corrida: ingredientes com compensação para manter o peso total; parâmetros de processo direto */
function doeRecipe(st,factors,values,filler){const rec=(st.recipe||[]).map(r=>Object.assign({},r));const proc=Object.assign({},st.proc||{});let delta=0;
 factors.forEach(f=>{const v=+values[f.id];if(f.kind==='proc'){proc[f.key]=v;return;}const r=rec.find(x=>x.id===f.key);
  if(r){delta+=v-(+r.g||0);r.g=v;}else{rec.push({id:f.key,g:v});delta+=v;}});
 let ok=true;if(delta&&filler){const fr=rec.find(x=>x.id===filler);if(!fr||(+fr.g-delta)<0)ok=false;else fr.g=Math.round((+fr.g-delta)*10)/10;}
 return{st:Object.assign({},st,{recipe:rec.filter(r=>+r.g>0),proc}),ok};}
/* t de Student: p bilateral via função beta incompleta regularizada (Numerical Recipes, frações contínuas) */
function lgam(x){const c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,.1208650973866179e-2,-.5395239384953e-5];let y=x,t=x+5.5;t-=(x+.5)*Math.log(t);let s=1.000000000190015;for(const q of c)s+=q/++y;return-t+Math.log(2.5066282746310005*s/x);}
function betacf(a,b,x){let qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap;if(Math.abs(d)<1e-30)d=1e-30;d=1/d;let h=d;
 for(let m=1;m<=200;m++){const m2=2*m;let aa=m*(b-m)*x/((qam+m2)*(a+m2));d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;h*=d*c;
  aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<3e-12)break;}return h;}
function ibeta(a,b,x){if(x<=0)return 0;if(x>=1)return 1;const bt=Math.exp(lgam(a+b)-lgam(a)-lgam(b)+a*Math.log(x)+b*Math.log(1-x));
 return x<(a+1)/(a+b+2)?bt*betacf(a,b,x)/a:1-bt*betacf(b,a,1-x)/b;}
const tP2=(t,df)=>df>0?ibeta(df/2,.5,df/(df+t*t)):NaN;
/* mínimos quadrados por equações normais com eliminação de Gauss (matrizes ≤ 8×8, níveis codificados) */
function solveLS(X,y){const p=X[0].length,A=[];for(let i=0;i<p;i++){A.push(new Array(p+1).fill(0));for(let j=0;j<p;j++)for(let r=0;r<X.length;r++)A[i][j]+=X[r][i]*X[r][j];for(let r=0;r<X.length;r++)A[i][p]+=X[r][i]*y[r];}
 const inv=[];for(let i=0;i<p;i++){inv.push(new Array(p).fill(0));inv[i][i]=1;}
 for(let c=0;c<p;c++){let piv=c;for(let r=c+1;r<p;r++)if(Math.abs(A[r][c])>Math.abs(A[piv][c]))piv=r;if(Math.abs(A[piv][c])<1e-10)return null;
  [A[c],A[piv]]=[A[piv],A[c]];[inv[c],inv[piv]]=[inv[piv],inv[c]];const d=A[c][c];for(let j=0;j<=p;j++)A[c][j]/=d;for(let j=0;j<p;j++)inv[c][j]/=d;
  for(let r=0;r<p;r++)if(r!==c){const f=A[r][c];if(!f)continue;for(let j=0;j<=p;j++)A[r][j]-=f*A[c][j];for(let j=0;j<p;j++)inv[r][j]-=f*inv[c][j];}}
 return{b:A.map(r=>r[p]),inv};}
function doeAnalyze(design,ys){const F=design.factors,k=F.length;
 const pts=design.runs.map((R,i)=>({R,y:ys[i]})).filter(p=>p.y!=null&&p.y!==''&&isFinite(+p.y)).map(p=>({R:p.R,y:+p.y}));
 const fact=pts.filter(p=>!p.R.center),cen=pts.filter(p=>p.R.center);
 const terms=[{n:'média',f:()=>1}];F.forEach((f,j)=>terms.push({n:f.label,f:c=>c[j],main:true}));
 for(let a=0;a<k;a++)for(let b=a+1;b<k;b++)terms.push({n:F[a].label+' × '+F[b].label,f:c=>c[a]*c[b]});
 if(k===3)terms.push({n:F[0].label+' × '+F[1].label+' × '+F[2].label,f:c=>c[0]*c[1]*c[2]});
 /* usa só termos estimáveis: com poucas corridas medidas, interações de ordem alta saem do modelo */
 let use=terms.slice();const data=fact.concat(cen);
 /* pontos centrais ganham um termo próprio de curvatura: sem ele a curvatura iria para o resíduo e inflaria o erro */
 const curvT=cen.length&&fact.length?{n:'curvatura',f:c=>c.every(x=>x===0)?1:0,curv:true}:null;
 while(use.length+(curvT?1:0)>data.length&&use.length>1)use.pop();
 if(curvT)use.push(curvT);
 if(data.length<2||!fact.length)return{ok:false,msg:'meça pelo menos duas corridas do fatorial',n:data.length,need:design.runs.length};
 const X=data.map(p=>use.map(t=>t.f(p.R.coded))),y=data.map(p=>p.y);const L=solveLS(X,y);
 if(!L)return{ok:false,msg:'as corridas medidas não permitem separar os efeitos (meça os cantos que faltam)',n:data.length,need:design.runs.length};
 const fit=X.map(r=>r.reduce((a,x,i)=>a+x*L.b[i],0)),sse=y.reduce((a,v,i)=>a+(v-fit[i])**2,0),df=data.length-use.length;
 const s2=df>0?sse/df:NaN;
 const coef=(i)=>{const b=L.b[i],se=df>0?Math.sqrt(s2*L.inv[i][i]):NaN,tv=se>0?b/se:NaN;return{b,se:isFinite(se)?se:null,p:isFinite(tv)?tP2(Math.abs(tv),df):null};};
 const eff=[];let curv=null;
 use.forEach((t,i)=>{if(!i)return;const c=coef(i);
  /* efeito = diferença entre o nível alto e o baixo (2 × coeficiente); curvatura = centro − previsão linear no centro */
  if(t.curv)curv={diff:c.b,se:c.se,p:c.p};else eff.push({n:t.n,main:!!t.main,effect:2*c.b,se:c.se!=null?2*c.se:null,p:c.p});});
 return{ok:true,n:data.length,need:design.runs.length,df,sd:isFinite(s2)?Math.sqrt(s2):null,mean:L.b[0],effects:eff.sort((a,b)=>Math.abs(b.effect)-Math.abs(a.effect)),curvature:curv,dropped:terms.length-use.filter(t=>!t.curv).length};}

