/* ===================== RESFRIAMENTO DA CALDA E OSCILAÇÃO NO FREEZER (v18.13 · §16) =====================
   Calda líquida num recipiente: modelo de capacitância concentrada (Newton). A calda é tratada como homogênea:
   a convecção natural dentro do líquido mistura o conteúdo, e a resistência que manda está fora (ar) ou na parede.
   1/U = 1/h_fora + L/k_parede + 1/h_dentro;  τ = m·c_p / Σ(U·A);  T(t) = T_eq + (T0 − T_eq)·e^(−t/τ).
   Coeficientes de convecção escolhidos dentro das faixas típicas (Incropera, Fundamentals of Heat and Mass Transfer,
   tabela 1.1: convecção natural em gases 2–25 W/m²K, em líquidos 50–1000) e condutividade das paredes pelas tabelas
   do apêndice A. São estimativas: a medição da calda ("6,5@90") calibra τ. */
/* constante de tempo do pote na geladeira (h): massa × cp / (h × área), convecção natural. Mesma conta desde a v17.2
   (página Maturação): não mudar sem atualizar a maturação. */
function potTau(m){const kg=Math.max(.05,(m.tot||1000)/1000),V=kg/((m.rhoMix||1.08)*1000);const A=6*Math.pow(V,2/3)*.85;return kg*3300/(9*A)/3600;}
/* calibração pela medição da calda: "6,5@90" = 6,5 °C depois de 90 min na geladeira */
function probeFit(ms,Tf){const p=String(ms.probe||'').split('@');if(p.length!==2)return null;const Tm=+p[0].replace(',','.'),min=+p[1].replace(',','.');
 if(!isFinite(Tm)||!isFinite(min)||min<=0)return null;const r=(Tm-Tf)/(ms.entryT-Tf);if(!(r>0&&r<1))return null;return-min/60/Math.log(r);}
/* paredes: espessura típica (m) e condutividade (W/m·K, Incropera apêndice A, ~300 K) */
const COOL_VESSEL={inox:{n:'Inox (1 mm)',L:.001,k:14.9},aluminio:{n:'Alumínio (1 mm)',L:.001,k:237},plastico:{n:'Plástico PP (2 mm)',L:.002,k:.2},vidro:{n:'Vidro (4 mm)',L:.004,k:1.4}};
/* modos de resfriar: h do lado de fora (W/m²K), fração da área nesse meio e temperatura do meio.
   banho: água com gelo em volta (parede lateral e fundo = 5/6 da área do cilindro H = D), topo no ar da cozinha.
   bancada: ar parado da cozinha. geladeira: ar da geladeira (mesmo h = 9 da página Maturação). */
const COOL_MODE={banho:{n:'Banho de água com gelo',h:250,sub:5/6,Tm:0},bancada:{n:'Bancada (ar da cozinha)',h:9,sub:1,Tm:null},geladeira:{n:'Direto na geladeira',h:9,sub:1,Tm:null}};
const COOL_HIN=150;  /* convecção natural da calda dentro do recipiente (líquido parado), W/m²K, estimativa */
/* recipiente cilíndrico cheio, altura = diâmetro: V = 2πr³, área total 6πr² */
function coolGeom(kg,rho){const V=kg/(rho*1000),r=Math.cbrt(V/(2*Math.PI));return{V,r,A:6*Math.PI*r*r};}
function coolU(h,vessel){const v=COOL_VESSEL[vessel];return 1/(1/h+(v?v.L/v.k:0)+1/COOL_HIN);}
/* um trecho de resfriamento: devolve T_eq e τ (h) para a calda no meio informado */
function coolStage(kg,rho,o){const g=coolGeom(kg,rho),C=kg*3300;const M=COOL_MODE[o.mode]||COOL_MODE.geladeira;
 const Tm=M.Tm==null?o.Tair:M.Tm;const ua1=coolU(M.h,o.vessel)*g.A*M.sub,ua2=M.sub<1?coolU(9,o.vessel)*g.A*(1-M.sub):0;
 const Teq=(ua1*Tm+ua2*o.Tamb)/(ua1+ua2);return{Teq,tau:C/(ua1+ua2)/3600,UA:ua1+ua2,A:g.A,r:g.r};}
const coolAt=(S0,T0,h)=>S0.Teq+(T0-S0.Teq)*Math.exp(-h/S0.tau);
/* horas para ir de T0 a T (null se não chega: T fora do caminho até o equilíbrio) */
function coolTimeTo(S0,T0,T){if((T-S0.Teq)*(T0-S0.Teq)<=0||Math.abs(T-S0.Teq)>=Math.abs(T0-S0.Teq))return T===T0?0:null;return S0.tau*Math.log((T0-S0.Teq)/(T-S0.Teq));}

/* ---------- OSCILAÇÃO DO FREEZER: quanto chega ao pote ----------
   Ar do freezer = storeT + A·sen(2πt/P). Para oscilações pequenas (±1–3 °C) as propriedades podem ser tomadas na
   temperatura do freezer, inclusive a capacidade aparente (gelo que derrete e recongela), e a condução na esfera
   equivalente ao pote tem solução exata em regime periódico (Carslaw & Jaeger, condução em esfera com troca
   convectiva na superfície):  Θ(r) = B·senh(qr)/r,  q = √(iω/α),  com −k·Θ'(R) = h·(Θ(R) − A).
   storeResponse usa essa solução (microssegundos). storeResponseSim resolve o mesmo problema pela simulação
   não linear (heatSim) e serve para conferir a linearização nos testes. A forma real da oscilação (ciclo do
   compressor, degelo, porta) não é senoidal; a resposta por período mostra quais oscilações o pote filtra. */
const cx=(re,im)=>({re,im}),cAdd=(a,b)=>cx(a.re+b.re,a.im+b.im),cSub=(a,b)=>cx(a.re-b.re,a.im-b.im),cMul=(a,b)=>cx(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re),
 cDiv=(a,b)=>{const d=b.re*b.re+b.im*b.im;return cx((a.re*b.re+a.im*b.im)/d,(a.im*b.re-a.re*b.im)/d);},cSc=(a,k)=>cx(a.re*k,a.im*k),cAbs=a=>Math.hypot(a.re,a.im),
 cSinh=z=>cx(Math.sinh(z.re)*Math.cos(z.im),Math.cosh(z.re)*Math.sin(z.im)),cCosh=z=>cx(Math.cosh(z.re)*Math.cos(z.im),Math.sinh(z.re)*Math.sin(z.im));
/* propriedades na temperatura T (mesmas fórmulas da tabela do heatSim) */
function thermProps(m,T){const w=m.wat/100,eps=clamp(m.ov/(100+m.ov),0,.6),d=.25;const ph=x=>x>=m.fp?0:m.fz(x)/100;const p=ph(T),dph=(ph(T-d)-ph(T+d))/(2*d);
 return{rho:clamp(m.gPerL||800,350,1150),c:1000*(1.75+2.4*w*(1-p))+334000*w*Math.max(0,dph),k:(.45+1.7*p*w)*(1-eps)/(1+eps/2)};}
function storeResponse(m,pr,P_h,A){if(m.empty||!(m.wat>0))return null;A=A==null?Math.max(.5,+pr.storeFluct||1):A;
 const hM=CAL.on&&CAL.hMult>0?CAL.hMult:1,h=H_FREEZER*hM,V=clamp(+pr.poteMl||500,100,5000)/1e6,R=Math.cbrt(V/(2*Math.PI));
 const pp=thermProps(m,+pr.storeT),al=pp.k/(pp.rho*pp.c),om=2*Math.PI/(P_h*3600),s=Math.sqrt(om/(2*al)),q=cx(s,s);
 const qR=cSc(q,R),sh=cSinh(qR),ch=cCosh(qR);
 /* B = h·A / ( h·senh(qR)/R + k·(q·cosh(qR)/R − senh(qR)/R²) ) */
 const den=cAdd(cSc(sh,h/R),cSc(cSub(cSc(cMul(q,ch),1/R),cSc(sh,1/(R*R))),pp.k));const B=cDiv(cx(h*A,0),den);
 const core=cAbs(cMul(B,q));
 /* média na camada de servir (casca externa de 1,5 cm): 4π·B·[r·cosh(qr)/q − senh(qr)/q²] entre R−e e R, ÷ volume */
 const e=Math.min(POTE_SCOOP,R),r0=R-e;const F=r=>{const z=cSc(q,r);return cSub(cDiv(cSc(cCosh(z),r),q),cDiv(cSinh(z),cMul(q,q)));};
 const Vs=4/3*Math.PI*(R*R*R-r0*r0*r0);const scoop=cAbs(cSc(cMul(B,cSub(F(R),F(r0))),4*Math.PI/Vs));
 const surf=cAbs(cDiv(cMul(B,sh),cx(R,0)));
 return{P:P_h,A,scoop,core,surf,alpha:al,R};}
function storeResponseSim(m,pr,P_h,A){const store=+pr.storeT,P=P_h*3600;const hM=CAL.on&&CAL.hMult>0?CAL.hMult:1;
 const w={s:[Infinity,-Infinity],c:[Infinity,-Infinity]};
 heatSim(m,{ml:pr.poteMl,N:12,T0:store,Tamb:t=>store+A*Math.sin(2*Math.PI*t/P),h:H_FREEZER*hM,tMax:4*P,step:P/48,dtMax:Math.min(30,P/400),
  watch:s=>{if(s.t*60>=3*P){w.s[0]=Math.min(w.s[0],s.scoop);w.s[1]=Math.max(w.s[1],s.scoop);w.c[0]=Math.min(w.c[0],s.core);w.c[1]=Math.max(w.c[1],s.core);}return false;}});
 return{P:P_h,A,scoop:(w.s[1]-w.s[0])/2,core:(w.c[1]-w.c[0])/2};}
