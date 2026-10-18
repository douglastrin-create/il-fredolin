/* ==== 58-maturacao.js ==== */
/* ===================== MATURAÇÃO · MODELO CINÉTICO E PROBABILÍSTICO =====================
   Por receita, a cada alteração: quanto tempo maturar, a partir de quando não compensa esperar e o máximo
   antes de a espera prejudicar o gelato. Processos simulados hora a hora na temperatura real da geladeira:
   1. resfriamento da calda dentro do pote (lei de Newton; o pote leva horas para chegar à temperatura do ar)
   2. cristalização da gordura por tipo (Avrami n=2; equilíbrio pelo SFC; emulsificantes e gema aceleram a nucleação)
   3. troca de proteína por emulsificante na superfície das gotas (acompanha a gordura cristalizada)
   4. hidratação de cada hidrocoloide e das proteínas do leite; rede da gelatina
   5. extração de infusões (baunilha, especiarias, ervas, café) e amalgamação dos aromas
   Prejuízos: multiplicação microbiana (modelo de Ratkowsky para Listeria, Tmin −1,5 °C: 72 h-equivalentes a 4 °C),
   separação de soro (galactomananas sem carragena), retrogradação do amido, nata subindo, extração excessiva de
   ervas, enzimas e oxidação de fruta fresca na calda, leve queda de viscosidade depois de ~24 h.
   Incerteza: 240 simulações de Monte Carlo variando temperatura da geladeira, velocidades de cristalização e
   hidratação, resfriamento do pote e crescimento microbiano → faixas P10–P90.
   Referências: Goff & Hartel (Ice Cream; Univ. Guelph — ≥ 4 h, ideal de um dia para o outro, ≤ 5 °C);
   Dogan & Kayacier (viscosidade máxima por volta de 24 h); tese Unibo (gordura cristaliza em 4–5 h; 4–12 h);
   escola italiana 6–12 h a 4–5 °C; Corvitto 12 h; manuais APPCC: mistura pasteurizada em até 72 h a ≤ 4 °C. */

/* Panasonic NR-BB53GV3WB · refrigerador com controle Mín/Méd/Máx. Temperaturas típicas de cada posição
   (estimativa até você medir; o valor medido substitui). */
const FRIDGE={min:{n:'Mín',T:6.5},med:{n:'Méd',T:4.5},max:{n:'Máx',T:2.5}};
/* set Professionale: a temperatura é o setpoint do processo (Maturação °C); o maturador agita e troca calor pela parede */
const MAT_PRO={maturador:{n:'Maturador com agitação',sd:.3,tau:.25},camara:{n:'Câmara fria',sd:.7,tau:null},geladeira:{n:'Geladeira comercial',sd:1,tau:null}};
const FRIDGE_POS={porta:{n:'Porta',d:2.5},sup:{n:'Prateleira de cima',d:.8},meio:{n:'Prateleira do meio',d:0},inf:{n:'Prateleira de baixo, no fundo',d:-.7}};
const MAT0={fridge:'med',pos:'meio',reads:'',entryT:10,probe:'',fruitIn:0};
function matState(){const x=Object.assign({},MAT0,S.mat||{});if(!FRIDGE[x.fridge]&&!MAT_PRO[x.fridge])x.fridge='med';if(!FRIDGE_POS[x.pos])x.pos='meio';x.entryT=clamp(+x.entryT||10,0,40);
 x.reads=String(x.reads||'').slice(0,200);x.probe=String(x.probe||'').slice(0,40);x.fruitIn=x.fruitIn?1:0;return x;}
const parseReads=s=>String(s||'').split(/[;\s]+/).filter(v=>v.trim()!=='').map(v=>+v.replace(',','.')).filter(v=>isFinite(v)&&v>-5&&v<20).slice(0,30);
/* temperatura do ar onde a calda fica: medida (média e desvio) ou estimada pelo ajuste + posição */
function fridgeT(ms){const r=parseReads(ms.reads);
 if(r.length){const mu=r.reduce((a,b)=>a+b,0)/r.length;const sd=r.length>1?Math.sqrt(r.reduce((a,b)=>a+(b-mu)*(b-mu),0)/(r.length-1)):.6;return{mu,sd:Math.max(.3,sd),src:'medida',n:r.length};}
 if(MAT_PRO[ms.fridge]){const sp=+((S&&S.proc&&S.proc.matT)||4);return{mu:sp+(ms.fridge==='maturador'?0:FRIDGE_POS[ms.pos].d),sd:MAT_PRO[ms.fridge].sd,src:'setpoint',n:0};}
 return{mu:FRIDGE[ms.fridge].T+FRIDGE_POS[ms.pos].d,sd:1,src:'estimada',n:0};}
/* constante de tempo do pote (h): massa × cp / (h × área), convecção natural na geladeira */
function potTau(m){const kg=Math.max(.05,(m.tot||1000)/1000),V=kg/((m.rhoMix||1.08)*1000);const A=6*Math.pow(V,2/3)*.85;return kg*3300/(9*A)/3600;}
/* calibração pela medição da calda: "6,5@90" = 6,5 °C depois de 90 min na geladeira */
function probeFit(ms,Tf){const p=String(ms.probe||'').split('@');if(p.length!==2)return null;const Tm=+p[0].replace(',','.'),min=+p[1].replace(',','.');
 if(!isFinite(Tm)||!isFinite(min)||min<=0)return null;const r=(Tm-Tf)/(ms.entryT-Tf);if(!(r>0&&r<1))return null;return-min/60/Math.log(r);}
const MAT_FAT_T50={milk:1.3,egg:1.1,coco:.5,palm:1,cocoa:3,nut:.6,oil:.4};
const MAT_INF={fava:8,especiaria:6,ervas:4,cocoralado:6,alfarroba:5,cacau:2,tamara:4,matcha:.5};
const MAT_PROT={abacaxi:1,mamao:1,figo:.8};const MAT_OX={banana:1,maca:.8,macasuco:.8,pera:.8,abacate:1,pessego:.6,damasco:.5};
const sig=x=>1/(1+Math.exp(-x));
/* contexto da receita: pesos de cada processo (o que esta receita tem para ganhar ou perder maturando) */
function matCtx(st,m){const A=m.A,fat=m.fat||0,ids=new Set((st.recipe||[]).map(r=>r.id));const keys=recipeHydKeys(st);
 const fatT={};let fatEq=0;for(const k in (A.fatT||{}))if(A.fatT[k]>0){fatT[k]=A.fatT[k]/A.fat;}
 const emulAcc=1-.35*Math.min(1,(m.keyPct.mono||0)/.2)-.15*Math.min(1,(m.keyPct.lec||0)/.3)-.12*Math.min(1,(m.yolkPct||0)/4);
 const dairy=(m.msnf||0)>1;const has=k=>(keys[k]||0)>0;
 const floc=dairy&&(has('lbg')||has('guar')||has('tara'))&&!has('carr')&&!has('cmc')&&!(has('citf')&&keys.citf>.1*Object.values(keys).reduce((a,b)=>a+b,0));
 const inf=[...ids].filter(id=>MAT_INF[id]);const fr=st.mat&&st.mat.fruitIn;
 const prot=fr&&dairy?[...ids].filter(id=>MAT_PROT[id]):[];const ox=fr?[...ids].filter(id=>MAT_OX[id]):[];
 const hy=Object.keys(keys).length?hydRun(keys,{...m.pr,matH:0}):null;
 return{fat,fatT,emulAcc,hasEmul:!!m.hasEmul,keys,h0:hy?hy.h:{},hydro:m.hydro||0,msnf:m.msnf||0,dairy,floc,starch:(m.keyPct.starch||0)>.3||has('starch'),gel:has('gel'),inf,prot,ox,fruitIn:!!fr,
  w:{fat:fat>1?clamp(fat/8,0,1.3)*1.2:0,emul:fat>1?clamp(fat/8,0,1)*(m.hasEmul?.8:.35):0,hyd:clamp((m.hydro||0)/.3,0,1.2)*(Object.keys(keys).length?1:0),prot:clamp((m.msnf||0)/10,0,1)*.4,gel:has('gel')?.6:0,inf:inf.length?.5:0,mel:.25}};}
/* uma simulação (parâmetros p) na grade de tempo; devolve curvas e tempos-chave */
const MAT_GRID=(()=>{const g=[];for(let t=0;t<=24;t+=.25)g.push(t);for(let t=25;t<=96;t+=1)g.push(t);return g;})();
function matRun(C,p){const G=MAT_GRID,n=G.length;const Tf=p.Tf,tau=p.tau,T0=p.T0;
 const B=new Float64Array(n),H=new Float64Array(n),comp={fat:[],emul:[],hyd:[],aroma:[],T:[],dose:[]};
 let teF=0,dose=0,X={},Xeq={};for(const k in C.fatT){X[k]=0;}let h={...C.h0},gelP=0,prevT=T0,aIn=0,mel=0,prevt=0,protP=.6; /* proteínas já bem hidratadas na pasteurização */
 for(let i=0;i<n;i++){const t=G[i],dt=t-prevt;prevt=t;const T=Tf+(T0-Tf)*Math.exp(-t/tau);
  if(dt>0){const Tm=(T+prevT)/2;prevT=T;
   /* microbiano (h-equivalentes a 4 °C) */dose+=dt*(Tm>-1.5?Math.pow((Tm+1.5)/5.5,2):0)*p.micro;
   /* gordura: tempo efetivo de cristalização abaixo de 15 °C */if(Tm<15)teF+=dt*Math.exp(-(Tm-4)/5)/(C.emulAcc*p.fatK);
   for(const k in C.fatT){const t50=MAT_FAT_T50[k]||1.2;const eq=sfcOf(k,Tm)/100;X[k]=Math.max(X[k],eq*(1-Math.exp(-Math.LN2*Math.pow(teF/t50,2))));Xeq[k]=sfcOf(k,Tf)/100;}
   for(const k in h){const hm=hydMax(k,Tm);if(hm>h[k])h[k]+=(hm-h[k])*(1-Math.exp(-dt*3600/(hydTau(k,Tm)*p.hydK)));}
   if(C.gel)gelP+=(1-gelP)*(1-Math.exp(-dt/(6*Math.exp((Tm-4)/4)*p.hydK)));
   protP+=(1-protP)*(1-Math.exp(-dt/1));const tI=(C.inf.length?C.inf.reduce((a,id)=>a+MAT_INF[id],0)/C.inf.length:4)*Math.exp(-(Tm-4)/15);aIn+=(1-aIn)*(1-Math.exp(-dt/tI));mel+=(1-mel)*(1-Math.exp(-dt/4));}
  let fx=0,fe=0;for(const k in C.fatT){fx+=C.fatT[k]*X[k];fe+=C.fatT[k]*(Xeq[k]||sfcOf(k,Tf)/100);}const F=fe>.005?clamp(fx/fe,0,1):1;
  const E=clamp(1-Math.exp(-teF/(C.hasEmul?2:3)),0,1)*F;
  let hw=0,hs=0;for(const k in C.keys){hw+=C.keys[k];hs+=C.keys[k]*h[k];}const Hy=hw?clamp(hs/hw,0,1):1;
  const w=C.w;const bw=w.fat+w.emul+w.hyd+w.prot+w.gel+w.inf+w.mel;
  B[i]=(w.fat*F+w.emul*E+w.hyd*Hy+w.prot*protP+w.gel*gelP+w.inf*aIn+w.mel*mel)/bw;
  /* prejuízos (fração do benefício total) */
  let hz=.18*sig((dose-48)/6)+.6*sig((dose-72)/3);
  if(C.floc)hz+=.22*sig((t-16)/4);if(C.starch)hz+=.25*sig((t-14)/5);if(C.fat>8)hz+=.06*sig((t-20)/5);
  if(C.inf.includes('ervas'))hz+=.25*sig((t-10)/3);if(C.inf.includes('especiaria'))hz+=.12*sig((t-20)/5);
  if(C.prot.length)hz+=.6*(1-Math.exp(-t/2));if(C.ox.length)hz+=.25*(1-Math.exp(-t/6));if(C.fruitIn)hz+=.12*(1-Math.exp(-t/14));
  hz+=.05*sig((t-30)/8);H[i]=hz;
  comp.fat.push(F);comp.emul.push(E);comp.hyd.push(Hy);comp.aroma.push(C.inf.length?aIn:mel);comp.T.push(T);comp.dose.push(dose);}
 const Q=Array.from(B,(b,i)=>b-H[i]);
 const first=f=>{for(let i=0;i<n;i++)if(f(i))return G[i];return null;};
 const t80=first(i=>B[i]>=.8),t95=first(i=>B[i]>=.95);
 let qi=0;for(let i=1;i<n;i++)if(Q[i]>Q[qi])qi=i;const qmax=Q[qi];
 const tIdeal=first(i=>Q[i]>=qmax-.01);
 const iI=G.indexOf(tIdeal);let tPlat=null;for(let i=Math.max(1,iI);i<n;i++){const g=(B[i]-B[i-1])/((G[i]-G[i-1])||1);if(g<.003){tPlat=G[i];break;}}
 const tSafe=first(i=>comp.dose[i]>=72);const tDec=first(i=>G[i]>tIdeal&&Q[i]<qmax-.05);
 const tMax=tSafe!=null&&(tDec==null||tSafe<=tDec)?tSafe:tDec;
 const t5=first(i=>comp.T[i]<=5);
 return{G,B,H,Q,comp,t80,t95,tIdeal,tPlat:tPlat!=null?Math.max(tPlat,tIdeal):tIdeal,tSafe,tDec,tMax,maxWhy:tMax==null?null:tMax===tSafe?'segurança':'qualidade',t5,qmax};}
function matPct(a,q){const v=a.filter(x=>x!=null&&isFinite(x)).sort((x,y)=>x-y);if(!v.length)return null;const i=(v.length-1)*q,lo=Math.floor(i),hi=Math.ceil(i);return v[lo]+(v[hi]-v[lo])*(i-lo);}
/* modelo completo com incerteza (cache por receita + geladeira) */
let _MAT={key:null,res:null};
function matModel(st,m,N){if(!m||m.empty)return null;const ms=matState();const key=JSON.stringify([st.tipo,st.recipe,st.proc,ms,ING_VER,N]);if(_MAT.key===key)return _MAT.res;
 const C=matCtx({...st,mat:ms},m);const FT=fridgeT(ms);const tau0=MAT_PRO[ms.fridge]&&MAT_PRO[ms.fridge].tau?MAT_PRO[ms.fridge].tau:potTau(m);const fit=probeFit(ms,FT.mu);const tau=fit!=null?clamp(fit,.2,12):tau0;
 const base=matRun(C,{Tf:FT.mu,tau,T0:ms.entryT,fatK:1,hydK:1,micro:1});
 const rnd=atRng(7+(m.tot|0)+Math.round(FT.mu*10));const gauss=()=>{let u=0;for(let i=0;i<6;i++)u+=rnd();return(u-3)*Math.SQRT2;};
 const runs=[];N=N||120;
 for(let k=0;k<N;k++){const Tf=FT.mu+gauss()*FT.sd;runs.push(matRun(C,{Tf,tau:tau*Math.exp(gauss()*(fit!=null?.08:.2)),T0:ms.entryT+gauss()*(fit!=null?.3:1.2),fatK:Math.exp(gauss()*.3),hydK:Math.exp(gauss()*.3),micro:Math.exp(gauss()*.3)}));}
 const G=base.G;const ready=G.map((t,i)=>runs.filter(r=>r.B[i]-r.H[i]>=r.qmax-.01||r.B[i]>=.95).length/N);
 const band=G.map((t,i)=>{const v=runs.map(r=>r.B[i]);return[matPct(v,.1),matPct(v,.9)];});
 const P=f=>[matPct(runs.map(f),.1),matPct(runs.map(f),.5),matPct(runs.map(f),.9)];
 const res={ms,C,FT,tau,tau0,fit,base,ready,band,N,t80:P(r=>r.t80),tIdeal:P(r=>r.tIdeal),tPlat:P(r=>r.tPlat),tMax:P(r=>r.tMax),tSafe:P(r=>r.tSafe),t5:P(r=>r.t5),
  pAt:t=>{const i=G.findIndex(x=>x>=t);return i<0?ready[ready.length-1]:ready[i];}};
 _MAT={key,res};return res;}
/* linha do tempo: o que acontece em cada período, com os números desta receita */
function matTimeline(R,m){const b=R.base,C=R.C,G=b.G,ev=[];const at=(arr,t)=>{const i=G.findIndex(x=>x>=t);return arr[i<0?arr.length-1:i];};
 const tFat=f=>{const i=b.comp.fat.findIndex(x=>x>=f);return i<0?null:G[i];};const tHyd=f=>{const i=b.comp.hyd.findIndex(x=>x>=f);return i<0?null:G[i];};
 ev.push([0,'Entrada na geladeira','A calda entra a '+fT(R.ms.entryT)+' °C. Dentro do pote ('+f1((m.tot||0)/1000/(m.rhoMix||1.08))+' L) ela leva ~'+fT(Math.round(R.tau*10)/10)+' h para percorrer 63% do caminho até a temperatura do ar ('+fT(Math.round(R.FT.mu*10)/10)+' °C, '+R.FT.src+').']);
 if(b.t5!=null&&b.t5>0)ev.push([b.t5,'Calda abaixo de 5 °C','Daqui em diante a multiplicação bacteriana fica lenta. Quanto mais fria a calda entra (banho de gelo até 4–6 °C), mais cedo a maturação útil começa.']);
 if(C.fat>1){const sfc=m.sfcAt?m.sfcAt(R.FT.mu):0;const t50=tFat(.5),t90=tFat(.9);
  if(t50!=null)ev.push([t50,'Metade da gordura cristalizável já sólida','Gordura '+f0(sfc)+'% sólida no equilíbrio a '+fT(Math.round(R.FT.mu*10)/10)+' °C. Os cristais começam a furar a membrana das gotas: é o que depois prende o ar na mantecação.']);
  if(t90!=null)ev.push([t90,'Gordura 90% cristalizada',C.hasEmul?'Com emulsificante (gema, mono-diglicerídeos ou lecitina) as proteínas saem da superfície das gotas e a gordura fica pronta para coalescer parcialmente.':'Sem emulsificante a troca de proteína na superfície é lenta: o ganho de corpo e overrun é menor.']);}
 const keys=Object.keys(C.keys);if(keys.length){const t90=tHyd(.9);const lbg=keys.filter(k=>NCOMP[k]&&NCOMP[k].hyd>20);
  const hz=t90==null||t90<.3;ev.push([hz?0:t90,hz?'Estabilizantes já hidratados':'Rede de estabilizantes hidratada',hz?'Com a pasteurização a '+fT(+m.pr.pastT)+' °C o neutro ('+keys.map(k=>NCOMP[k].n.split(' (')[0].toLowerCase()).join(', ')+') chega hidratado: a maturação não precisa esperar por ele.'+(C.gel?' A gelatina ainda forma a rede devagar (horas).':''):(lbg.length?'Os de hidratação a quente ('+lbg.map(k=>NCOMP[k].n.split(' (')[0].toLowerCase()).join(', ')+') já trabalharam na pasteurização; ':'')+'no frio terminam de absorver água e a viscosidade sobe.'+(C.gel?' A gelatina forma a rede devagar (horas).':'')]);}
 if(C.inf.length)ev.push([Math.min(12,(C.inf.reduce((a,id)=>a+MAT_INF[id],0)/C.inf.length)*1.5),'Infusão extraída','Aromas de '+C.inf.map(id=>ING_BY[id].n.split(' (')[0].toLowerCase()).join(', ')+' passam para a gordura e a água.'+(C.inf.includes('ervas')?' Ervas frescas depois de ~10 h ficam amargas e "verdes": coe antes.':'')]);
 ev.push([R.tIdeal[1],'Ponto ideal','Ganho de estrutura e sabor praticamente completo (P10–P90: '+fT(R.tIdeal[0])+'–'+fT(R.tIdeal[2])+' h).']);
 if(R.tPlat[1]>R.tIdeal[1]+.4)ev.push([R.tPlat[1],'Não compensa mais esperar','Cada hora a mais rende menos de 0,3% de melhora.']);
 if(C.floc)ev.push([16,'Risco de soro separado','Galactomananas sem carragena em base láctea: o soro começa a separar. Mexa bem antes de mantecar ou inclua carragena no neutro.']);
 if(C.starch)ev.push([14,'Amido retrograda no frio','A 4 °C o amido gelatinizado recristaliza: a calda fica pastosa e o gelato perde brilho. Não estique a maturação.']);
 if(C.fat>8)ev.push([20,'Nata sobe','Em calda artesanal sem homogeneizador a gordura sobe: mexa antes de mantecar.']);
 if(C.prot.length)ev.push([1,'Enzimas da fruta atacando o leite',C.prot.map(id=>ING_BY[id].n.split(' (')[0]).join(', ')+' fresco tem protease: em poucas horas quebra as proteínas (amargor, perde corpo). Junte na hora de mantecar.']);
 if(C.ox.length)ev.push([3,'Fruta oxidando',C.ox.map(id=>ING_BY[id].n.split(' (')[0]).join(', ')+' escurece e perde frescor na calda. Junte na mantecação.']);
 ev.push([24,'Viscosidade estabilizada','A literatura mede o máximo de viscosidade perto de 24 h; depois fica estável ou cai um pouco.']);
 if(R.tSafe[1]!=null)ev.push([R.tSafe[1],'Limite sanitário','Equivale a 72 h a 4 °C (limite usual para mistura pasteurizada). A '+fT(Math.round(R.FT.mu*10)/10)+' °C a calda chega lá em '+fT(Math.round(R.tSafe[1]))+' h.']);
 return ev.filter(e=>e[0]!=null).sort((a,b)=>a[0]-b[0]);}
function matChart(R){const W=640,H=200,L=34,Rr=10,T=14,B=28;const tEnd=Math.min(96,Math.max(24,Math.ceil(((R.tMax[1]||48)+6)/6)*6));const G=R.base.G;
 const sx=t=>L+t/tEnd*(W-L-Rr),sy=v=>T+(1-clamp(v,0,1))*(H-T-B);const idx=G.map((t,i)=>i).filter(i=>G[i]<=tEnd);
 let g='';for(let t=0;t<=tEnd;t+=tEnd>48?12:6)g+=`<line x1="${sx(t)}" x2="${sx(t)}" y1="${T}" y2="${H-B}" stroke="var(--line)" stroke-dasharray="2 4"/><text x="${sx(t)}" y="${H-12}" text-anchor="middle" font-size="9.5" fill="var(--t3)">${t} h</text>`;
 [0,.5,1].forEach(v=>g+=`<text x="${L-4}" y="${sy(v)+3}" text-anchor="end" font-size="9" fill="var(--t3)">${f0(v*100)}</text>`);
 const ok=R.tIdeal[0],ok2=R.tPlat[2]||R.tIdeal[2];g+=`<rect x="${sx(ok)}" y="${T}" width="${Math.max(2,sx(Math.min(tEnd,ok2))-sx(ok))}" height="${H-T-B}" fill="rgba(110,231,183,.08)"/>`;
 if(R.tMax[1]!=null&&R.tMax[1]<tEnd)g+=`<rect x="${sx(R.tMax[0]||R.tMax[1])}" y="${T}" width="${sx(tEnd)-sx(R.tMax[0]||R.tMax[1])}" height="${H-T-B}" fill="rgba(251,113,133,.07)"/>`;
 g+=`<polygon points="${idx.map(i=>sx(G[i]).toFixed(1)+','+sy(R.band[i][1]).toFixed(1)).join(' ')} ${idx.slice().reverse().map(i=>sx(G[i]).toFixed(1)+','+sy(R.band[i][0]).toFixed(1)).join(' ')}" fill="rgba(125,211,252,.13)"/>`;
 const line=(arr,col,w,dash)=>`<polyline points="${idx.map(i=>sx(G[i]).toFixed(1)+','+sy(arr[i]).toFixed(1)).join(' ')}" fill="none" stroke="${col}" stroke-width="${w}"${dash?` stroke-dasharray="${dash}"`:''}/>`;
 const c=R.base.comp;if(R.C.fat>1)g+=line(c.fat,'#f6c90e',1.2,'3 3');if(Object.keys(R.C.keys).length)g+=line(c.hyd,'#a78bfa',1.2,'3 3');g+=line(c.aroma,'#fb923c',1.1,'2 3');
 g+=line(Array.from(R.base.B),'var(--ice)',2.4);g+=line(Array.from(R.base.H),'var(--crit)',1.8);g+=line(R.ready,'var(--ok)',1.6,'6 3');
 [[R.tIdeal[1],'ideal','var(--ok)'],[R.tMax[1],'máx.','var(--crit)']].forEach(([t,l,col])=>{if(t!=null&&t<=tEnd)g+=`<line x1="${sx(t)}" x2="${sx(t)}" y1="${T}" y2="${H-B}" stroke="${col}" stroke-width="1.4"/><text x="${sx(t)+3}" y="${T+9}" font-size="9.5" fill="${col}">${l} ${fT(Math.round(t*10)/10)} h</text>`;});
 return`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="Curvas de maturação">${g}</svg>
  <div class="row" style="gap:12px;font-size:11.5px;margin-top:4px;flex-wrap:wrap"><span><b style="color:var(--ice)">━</b> ganho total (faixa P10–P90)</span><span><b style="color:var(--crit)">━</b> prejuízo</span><span><b style="color:var(--ok)">╍</b> chance de estar no ponto</span>${R.C.fat>1?'<span><b style="color:#f6c90e">┅</b> gordura</span>':''}${Object.keys(R.C.keys).length?'<span><b style="color:#a78bfa">┅</b> estabilizantes</span>':''}<span><b style="color:#fb923c">┅</b> aroma</span></div>`;}
const MAT_SCHOOLS=[['Goff & Hartel (Univ. Guelph)','mínimo 4 h; de um dia para o outro dá o melhor resultado; ≤ 5 °C'],['Escola italiana (manuais e tese Unibo)','4–12 h a 4–5 °C; gordura cristaliza em 4–5 h'],['Angelo Corvitto','12 h'],['Indústria (APPCC)','3–24 h; usar a mistura pasteurizada em até 72 h'],['Dogan & Kayacier','viscosidade máxima por volta de 24 h']];
function matCard(st,m,compact){if(m.empty)return'';const R=matModel(st,m);if(!R)return'';const ms=R.ms,FT=R.FT;const rg=a=>a[1]==null?'—':fT(Math.round(a[1]*2)/2)+' h <small class="muted">('+fT(Math.round(a[0]*2)/2)+'–'+fT(Math.round(a[2]*2)/2)+')</small>';
 const cur=+st.proc.matH,pCur=R.pAt(cur);const ev=matTimeline(R,m);
 const big=(lab,v,cls,sub)=>`<div class="matbig"><span class="lbl">${lab}</span><b class="${cls||''}">${v}</b>${sub?`<small>${sub}</small>`:''}</div>`;
 if(compact)return`<div class="card"><h2>Maturação desta receita</h2><p class="note" style="margin:0">Ideal <b>${fT(Math.round(R.tIdeal[1]*2)/2)} h</b> a ${fT(Math.round(FT.mu*10)/10)} °C (faixa ${fT(Math.round(R.tIdeal[0]*2)/2)}–${fT(Math.round(R.tIdeal[2]*2)/2)} h) · máximo ${R.tMax[1]!=null?fT(Math.round(R.tMax[1]))+' h':'—'}. Com ${fT(cur)} h: ${f0(pCur*100)}% de chance de estar no ponto.</p></div>`;
 return`<div class="card matcard"><div class="row"><h2 style="margin:0">Maturação calculada para esta receita</h2><span class="sp"></span><button class="btn sm okb" data-a="matApply">Usar no processo (${fT(Math.round(R.tIdeal[1]*2)/2)} h a ${fT(Math.round(FT.mu*10)/10)} °C)</button></div>
  <p class="note">Simulação hora a hora de cristalização da gordura, troca de proteína por emulsificante, hidratação de cada componente do neutro, extração de aromas e prejuízos (bactérias, soro, amido, enzimas), repetida ${R.N} vezes com a incerteza da geladeira e dos ingredientes. Faixas: P10–P90.</p>
  <div class="matgrid">${big('Mínimo útil',rg(R.t80),'','80% do ganho')}${big('Ponto ideal',rg(R.tIdeal),'c-ok','máximo de qualidade')}${big('Não compensa passar de',rg(R.tPlat),'','ganho < 0,3%/h')}${big('Máximo',rg(R.tMax),'c-crit',R.base.maxWhy==='segurança'?'limite sanitário':'a qualidade começa a cair')}</div>
  ${R.tMax[1]!=null&&R.t80[1]!=null&&R.tMax[1]<R.t80[1]?`<div class="fix" style="margin-top:8px;padding:8px 10px;border:1px solid rgba(251,113,133,.4);border-radius:8px"><b class="c-crit">Não deixe esta calda maturar como está.</b> ${R.C.prot.length?'A fruta fresca com protease estraga as proteínas do leite em poucas horas: junte-a na mantecação e o tempo de maturação volta ao normal.':'Algum componente prejudica antes de a estrutura ficar pronta: veja a linha do tempo.'}</div>`:''}
  <p class="note" style="margin:8px 0">Com o tempo atual do processo (${fT(cur)} h): <b class="${pCur>=.8?'c-ok':pCur>=.5?'c-warn':'c-crit'}">${f0(pCur*100)}% de chance de estar no ponto</b>.${cur>(R.tMax[0]||1e9)?' <b class="c-crit">Acima do máximo.</b>':''}</p>
  ${matChart(R)}
  <div class="g2" style="gap:18px;margin-top:14px"><div><span class="lbl">Linha do tempo</span><ol class="mattl">${ev.map(([t,tt,d])=>`<li><span class="mono">${t<1?f0(t*60)+' min':fT(Math.round(t*10)/10)+' h'}</span><div><b>${esc(tt)}</b><p>${esc(d)}</p></div></li>`).join('')}</ol></div>
   <div>${S.set==='pro'?`<span class="lbl">Maturação no laboratório (set Professionale)</span>
    <div class="chips" style="margin:6px 0 8px" role="group" aria-label="Equipamento de maturação">${Object.entries(MAT_PRO).map(([k,f])=>`<button data-a="matFridge" data-v="${k}" aria-pressed="${ms.fridge===k}">${f.n}</button>`).join('')}</div><p class="note" style="margin:0 0 8px">Setpoint: ${fT(+S.proc.matT)} °C (campo "Temperatura" da maturação).</p>`:`<span class="lbl">Sua geladeira (Panasonic NR-BB53)</span>
    <div class="chips" style="margin:6px 0 8px" role="group" aria-label="Ajuste do refrigerador">${Object.entries(FRIDGE).map(([k,f])=>`<button data-a="matFridge" data-v="${k}" aria-pressed="${ms.fridge===k}">${f.n} · ~${fT(f.T)} °C</button>`).join('')}</div>`}
    <div class="form" style="grid-template-columns:repeat(2,minmax(0,1fr))">
     <label class="field"><span class="lbl">Onde fica a calda</span><select id="mat-pos" data-c="matPos">${Object.entries(FRIDGE_POS).map(([k,p])=>`<option value="${k}"${ms.pos===k?' selected':''}>${p.n}</option>`).join('')}</select></label>
     <label class="field"><span class="lbl">Calda entra a (°C)</span><input type="number" id="mat-entry" data-i="mat" data-k="entryT" value="${ms.entryT}" step=".5"></label>
     <label class="field" style="grid-column:1/-1"><span class="lbl">Leituras do termômetro (°C)</span><input type="text" id="mat-reads" data-i="mat" data-k="reads" value="${esc(ms.reads)}" placeholder="ex.: 4,2; 3,8; 4,6" inputmode="decimal"><span class="hint">Copo de água na prateleira da calda, leia depois de 12–24 h em horários diferentes. ${FT.src==='medida'?'Usando '+FT.n+' leitura(s): média '+fT(Math.round(FT.mu*10)/10)+' ± '+fT(Math.round(FT.sd*10)/10)+' °C.':'Sem leituras: estimativa '+fT(Math.round(FT.mu*10)/10)+' ± 1 °C.'}</span></label>
     <label class="field" style="grid-column:1/-1"><span class="lbl">Medição da calda (opcional)</span><input type="text" id="mat-probe" data-i="mat" data-k="probe" value="${esc(ms.probe)}" placeholder="°C@min, ex.: 6,5@90"><span class="hint">${R.fit!=null?'Calibrado: o seu pote esfria com constante de '+fT(Math.round(R.fit*10)/10)+' h (o modelo previa '+fT(Math.round(R.tau0*10)/10)+' h).':'Termômetro no centro da calda depois de X minutos na geladeira: calibra o resfriamento do seu pote.'}</span></label>
     <label class="field" style="grid-column:1/-1"><span class="lbl">Fruta fresca</span><select id="mat-fruit" data-c="matFruit"><option value="0"${!ms.fruitIn?' selected':''}>Entra na mantecação</option><option value="1"${ms.fruitIn?' selected':''}>Matura junto com a calda</option></select></label></div>
    <span class="lbl" style="display:block;margin-top:12px">O que dizem as escolas</span>${MAT_SCHOOLS.map(([a,b])=>`<div class="kv"><span>${a}</span><span style="font-size:12px;text-align:right">${b}</span></div>`).join('')}
    <div class="kv"><span><b>Esta receita</b></span><span style="font-size:12px;text-align:right"><b class="c-ok">${fT(Math.round(R.tIdeal[1]*2)/2)} h</b> a ${fT(Math.round(FT.mu*10)/10)} °C</span></div>
    <p class="note">As escolas divergem porque as receitas divergem: o tempo longo serve à gordura do leite sem emulsificante, à gelatina e às infusões; com gomas hidratadas a 85 °C, gema ou mono-diglicerídeos e calda que entra bem fria, poucas horas já entregam quase tudo. O modelo calcula isso para a sua receita.</p></div></div></div>`;}
const MAT_ACT={
 matFridge:v=>{if(!FRIDGE[v]&&!MAT_PRO[v])return;S.mat={...matState(),fridge:v};render();},
 matApply:()=>{const m=analyze(S);const R=matModel(S,m);if(!R)return;S.proc.matH=Math.round(R.tIdeal[1]*2)/2;S.proc.matT=Math.round(R.FT.mu*10)/10;render();toast('Processo: maturar '+fT(S.proc.matH)+' h a '+fT(S.proc.matT)+' °C');}};
const MAT_INP={mat:(v,t)=>{const k=t.dataset.k;const ms=matState();if(k==='entryT'){if(v===''||!isFinite(+v))return;ms.entryT=clamp(+v,0,40);}else if(k==='reads')ms.reads=String(v).slice(0,200);else if(k==='probe')ms.probe=String(v).slice(0,40);else return;S.mat=ms;render();}};
const MAT_CHG={matPos:t=>{const ms=matState();if(FRIDGE_POS[t.value])ms.pos=t.value;S.mat=ms;},matFruit:t=>{const ms=matState();ms.fruitIn=t.value==='1'?1:0;S.mat=ms;}};

