/* ==== 20-physics.js ==== */
/* ===================== IL FREDOLIN · FÍSICA ===================== */
/* ---------- CURVA DE DEPRESSÃO DO PONTO DE CONGELAMENTO (v17.9) ----------
   Até 180 g de equivalente de sacarose por 100 g de água: tabela completa de Goff–Hartel (passo de 3 g, Univ. de Guelph).
   Acima disso (freezer, abatedor, fase concentrada): atividade de água pela equação de Norrish para sacarose (K = −6,47)
   e equação de Clausius–Clapeyron integrada (ΔHf 6008 J/mol), emendada à tabela em 180 g. Confere com o Tm′ da sacarose
   (≈ −35 °C a 80% m/m). Antes (até v17.8) a curva era estendida em linha reta acima de 180 g e subestimava a depressão
   no freezer (−20 °C: ~4 °C a menos na fase concentrada).
   Sais do leite pelo termo de Leighton: 2,37 × MSNF / água.
   Concentração máxima por congelamento (Cg′ ≈ 80% m/m em sacarose = 400 g/100 g de água): abaixo disso a fase restante
   vitrifica e a água que sobra não congela (água não congelável). */
const FPT=[[0,0],[3,.18],[6,.35],[9,.53],[12,.72],[15,.90],[18,1.10],[21,1.29],[24,1.47],[27,1.67],[30,1.86],[33,2.03],[36,2.21],[39,2.40],[42,2.60],[45,2.78],[48,2.99],[51,3.20],[54,3.42],[57,3.63],[60,3.85],[63,4.10],[66,4.33],[69,4.54],[72,4.77],[75,5.00],[78,5.26],[81,5.53],[84,5.77],[87,5.99],[90,6.23],[93,6.50],[96,6.80],[99,7.04],[102,7.32],[105,7.56],[108,7.80],[111,8.04],[114,8.33],[117,8.62],[120,8.92],[123,9.19],[126,9.45],[129,9.71],[132,9.96],[135,10.22],[138,10.47],[141,10.72],[144,10.97],[147,11.19],[150,11.41],[153,11.63],[156,11.88],[159,12.14],[162,12.40],[165,12.67],[168,12.88],[171,13.08],[174,13.28],[177,13.48],[180,13.68]];
const SE_CG=400;
function fpdNorrish(se){const ns=se/342.3,nw=100/18.015,xs=ns/(ns+nw);const l=Math.log(1-xs)-6.47*xs*xs;return 273.15-1/(1/273.15-8.314*l/6008);}
const _NOR180=13.68/fpdNorrish(180);
function fpdSE(se){if(se<=0)return 0;if(se<=180){const i=Math.min(FPT.length-1,Math.max(1,Math.ceil(se/3)));const[a,fa]=FPT[i-1],[b,fb]=FPT[i];return fa+(fb-fa)*(se-a)/(b-a);}return fpdNorrish(se)*_NOR180;}
function seFromFpd(d){if(d<=0)return 0;let lo=0,hi=2000;for(let k=0;k<60;k++){const mid=(lo+hi)/2;if(fpdSE(mid)<d)lo=mid;else hi=mid;}return(lo+hi)/2;}
/* fração máxima da água que pode congelar (o resto fica na fase vítrea) */
const fzMaxFrac=SE=>SE>0?clamp(1-SE/SE_CG,0,.995):.995;
/* fração da água total congelada (%) a T (°C) */
function frozenPct(T,SE,S){if(T>=0)return 0;const target=-T;const g=f=>fpdSE(SE/(1-f))+S/(1-f)-target;if(g(0)>=0)return 0;const fm=fzMaxFrac(SE);if(g(fm)<=0)return fm*100;let lo=0,hi=fm;for(let k=0;k<50;k++){const mid=(lo+hi)/2;if(g(mid)>0)hi=mid;else lo=mid;}return lo*100;}
function tempForFrozen(pct,SE,S){const u=1-pct/100;return -(fpdSE(SE/u)+S/u);}
function seRequired(T,pct,S){const u=1-pct/100;const d=-T-S/u;return Math.max(0,seFromFpd(d)*u);}

function compOf(ing,brixMap){const c=Object.assign({},ing.c);const b=brixMap&&brixMap[ing.id];
 if(ing.brix&&b!=null&&b!==''&&isFinite(+b)){const d=+b-ing.brix;const s=(c.suc||0)+(c.glu||0)+(c.fru||0);
  if(s>0){const k=Math.max(0,(s+.9*d)/s);c.suc=(c.suc||0)*k;c.glu=(c.glu||0)*k;c.fru=(c.fru||0)*k;}
  c.oth=Math.max(0,(c.oth||0)+.1*d);c.w=Math.max(0,(c.w||0)-d);}
 return c;}
const gsSugarFrac=de=>Math.max(0,Math.min(1,(de-10)*1.15/100));

/* ---------- viscosidade da mistura a 4 °C (mPa·s) ----------
   fase sérica (soluto/água, Arrhenius de concentração) × proteínas × Krieger-Dougherty (gordura e insolúveis)
   × contribuição exponencial dos hidrocoloides (concentração × viscosidade intrínseca relativa). */
function mixViscosity(m,A){const T=A.tot||1;const W=A.w||1;
 const sol=A.suc+A.glu+A.fru+A.lac+A.gs*1.6+A.tre+A.alu+A.iso+A.ery+A.sor+A.xyl+A.mlt+A.gly+A.inu*1.5+A.fos+A.salt+A.acd;
 let eta=1.57*Math.exp(.027*Math.min(400,sol/W*100));
 eta*=1+.3*(A.prot/T*100);
 const rho=1/((A.w/T)+(A.fat/T)/.93+((T-A.w-A.fat)/T)/1.59);
 const phi=clamp((A.fat/.92+(A.fib+A.hfS*.5)/1.45)/T*rho,0,.55);eta*=Math.pow(1-phi/.64,-1.6);
 let h=0;for(const k in m.keyPct)if(VISK[k])h+=VISK[k]*m.keyPct[k];h+=.2*(A.inu/T*100);
 return clamp(eta*Math.exp(h),1,8000);}

/* ---------- transição vítrea e cinética de recristalização ---------- */
function wlfLog(dT){return dT<=0?0:-17.44*dT/(51.6+dT);}
function kinetics(m,st){const tS=m.tShift||0;const Kref=wlfLog(19);const f=T=>clamp(Math.pow(10,Kref-wlfLog(T+tS-m.tg)),.002,8);
 const P=m.P,lo=P.stab[0],hiS=P.stab[1];const fStab=m.hydro<.02?2.6:m.hydro<lo?1+(lo-m.hydro)/lo*1.6:m.hydro>hiS*1.4?.85:1;
 const shock=Math.abs(m.pr.storeT-m.vit),fShock=1+Math.max(0,shock-2)/6,km=CAL.on?CAL.kMult:1;
 const fl=1+.6*Math.max(0,+m.pr.storeFluct||0),fromFz=m.pr.serveFrom==='freezer'||m.pr.serveFrom==='pote';
 const base=9000*fStab*km;return{fStab,fShock:fromFz?fl:fShock,fFluct:fl,km,fKinVit:f(m.vit),fKinStore:f(m.pr.storeT),Kvit:base*(fromFz?fl:fShock)*f(m.vit),Kstore:base*fl*f(m.pr.storeT)};}
function meltModel(m){return clamp(55-(m.melt-50)*.9,3,95);}

