/* ---------- DO FREEZER AO POTE ----------
   O pote sai do freezer e esquenta de fora para dentro. Modelo de condução 1-D numa esfera com a mesma relação
   volume/área de um pote cilíndrico (altura = diâmetro), com capacidade térmica aparente (o gelo que derrete absorve
   334 J/g), condutividade que cai com o ar incorporado (Maxwell-Eucken) e troca com o ar da cozinha (h ≈ 10 W/m²K,
   convecção natural + radiação). "Ponto de servir" = camada de onde a colher tira (1,5 cm externos) na temperatura
   de serviço ideal da receita. */
const POTE_SCOOP=.015;
/* simulação de condução 1-D (esfera equivalente ao pote) com capacidade térmica aparente; serve para aquecer
   (pote saindo do freezer) e para esfriar (gelato recém-mantecado endurecendo no freezer) */
function heatSim(m,o){const V=clamp(+o.ml||500,100,5000)/1e6,r=Math.cbrt(V/(2*Math.PI)),rho=clamp(m.gPerL||800,350,1150),w=m.wat/100,eps=clamp(m.ov/(100+m.ov),0,.6);
 const TL=-45,TS=.25,NT=Math.round((10-TL)/TS)+1;let tab=m._ptab;
 /* tabela de propriedades por temperatura: uma vez por receita, compartilhada pelo pote e pelo endurecimento */
 if(!tab||tab.eps!==eps){const phi=new Float64Array(NT+2);for(let j=-1;j<=NT;j++){const T=TL+j*TS;phi[j+1]=T>=m.fp?0:m.fz(T)/100;}
  const cap=new Float64Array(NT),kk=new Float64Array(NT);for(let j=0;j<NT;j++){const ph=phi[j+1],dph=(phi[j]-phi[j+2])/(2*TS);cap[j]=1000*(1.75+2.4*w*(1-ph))+334000*w*Math.max(0,dph);const km=.45+1.7*ph*w;kk[j]=km*(1-eps)/(1+eps/2);}
  tab=m._ptab={eps,cap,kk};}
 const cap=tab.cap,kk=tab.kk,NT1=NT-1;
 /* v18.14: vetores tipados e nenhum objeto criado por passo (mesmas contas e mesma ordem: resultado idêntico ao da
    v18.13, conferido em tests/node/perf.test.mjs). A camada de servir só é somada quando alguém a lê. */
 const N=o.N||16,dr=r/N,Tn=new Float64Array(N).fill(o.T0),vol=new Float64Array(N),area=new Float64Array(N),q=new Float64Array(N),ji=new Int32Array(N);
 for(let i=0;i<N;i++){vol[i]=4/3*Math.PI*(Math.pow((i+1)*dr,3)-Math.pow(i*dr,3));area[i]=4*Math.PI*Math.pow((i+1)*dr,2);}
 let s0=N,scoopV=0;for(let i=0;i<N;i++)if((i+1)*dr>r-POTE_SCOOP+1e-9){if(i<s0)s0=i;scoopV+=vol[i];}
 const scoopT=()=>{let a=0;for(let i=s0;i<N;i++)a+=Tn[i]*vol[i];return a/scoopV;};const h=o.h,watch=o.watch,stp=o.step||15,Tamb=o.Tamb;
 const curve=[{t:0,scoop:o.T0,core:o.T0,surf:o.T0}];let t=0,next=stp;const tMax=o.tMax,dtMax0=o.dtMax||6;const W={t:0,scoop:0,core:0,surf:0};
 const rN=dr/2,aN=area[N-1],hA=1/(h*aN);
 while(t<tMax){const Ta=Tamb(t);let dtMax=dtMax0;
  for(let i=0;i<N;i++){let j=Math.round((Tn[i]-TL)/TS);ji[i]=j<0?0:j>NT1?NT1:j;}
  for(let i=0;i<N;i++){const kc=kk[ji[i]];const C=rho*cap[ji[i]]*vol[i];let G=0;
   if(i<N-1)G+=(kc+kk[ji[i+1]])/2*area[i]/dr;if(i>0)G+=(kc+kk[ji[i-1]])/2*area[i-1]/dr;
   if(i===N-1)G+=1/(rN/(kc*aN)+hA);const lim=.45*C/G;if(lim<dtMax)dtMax=lim;}
  const dt=Math.max(.05,dtMax);
  for(let i=0;i<N;i++){let f=0;const kc=kk[ji[i]];
   if(i<N-1)f+=(kc+kk[ji[i+1]])/2*area[i]/dr*(Tn[i+1]-Tn[i]);
   if(i>0)f+=(kc+kk[ji[i-1]])/2*area[i-1]/dr*(Tn[i-1]-Tn[i]);
   if(i===N-1)f+=(Ta-Tn[i])/(rN/(kc*aN)+hA);q[i]=f;}
  for(let i=0;i<N;i++)Tn[i]+=q[i]*dt/(rho*cap[ji[i]]*vol[i]);t+=dt;
  const rec=t>=next;if(!watch&&!rec)continue;
  W.t=t/60;W.scoop=scoopT();W.core=Tn[0];W.surf=Tn[N-1];if(watch&&watch(W))break;
  if(rec){const c={t:W.t,scoop:W.scoop,core:W.core,surf:W.surf};if(o.field)c.f=Array.from(Tn);curve.push(c);next+=stp;}}
 if(o.field)curve[0].f=new Array(N).fill(o.T0);
 return{r,massG:rho*V*1000,curve,N,dr};}
function poteModel(m,prIn){if(m.empty||!(m.wat>0))return null;const pr=Object.assign({},PROC0,prIn||m.pr);
 const key=[pr.poteMl,pr.ambT,pr.storeT,pr.waitMin].join('|');if(m._pote&&m._pote.key===key)return m._pote;
 const Tamb=+pr.ambT||23,T0=Math.min(+pr.storeT,-1);let tReady=T0>=m.serveT?0:null;
 const wEnd=Math.max(20,(+pr.waitMin||0)+8);
 const sim=heatSim(m,{ml:pr.poteMl,N:12,T0,Tamb:()=>Tamb,h:10,tMax:60*Math.max(30,Math.min(90,(+pr.waitMin||0)+40)),watch:s=>{if(tReady==null&&s.scoop>=m.serveT)tReady=s.t;return tReady!=null&&s.t>Math.max(wEnd,tReady+12);}});
 const curve=sim.curve;
 const at=min=>{if(min<=0)return curve[0];for(let j=1;j<curve.length;j++)if(curve[j].t>=min){const a=curve[j-1],b=curve[j],f=(min-a.t)/((b.t-a.t)||1);return{t:min,scoop:a.scoop+(b.scoop-a.scoop)*f,core:a.core+(b.core-a.core)*f,surf:a.surf+(b.surf-a.surf)*f};}return curve[curve.length-1];};
 const timeTo=T=>{if(curve[0].scoop>=T)return 0;for(let j=1;j<curve.length;j++)if(curve[j].scoop>=T){const a=curve[j-1],b=curve[j];return a.t+(b.t-a.t)*(T-a.scoop)/((b.scoop-a.scoop)||1);}return null;};
 const wait=clamp(+pr.waitMin||0,0,60);const res={key,r:sim.r,massG:sim.massG,T0,Tamb,tReady,wait,atWait:at(wait),curve,at,timeTo};m._pote=res;return res;}
