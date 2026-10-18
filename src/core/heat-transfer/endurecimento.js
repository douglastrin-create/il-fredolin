/* ---------- ENDURECIMENTO NO FREEZER ----------
   O gelato sai da mantecadora (drawT) e endurece no freezer: ar forçado do frost free (h ≈ 14 W/m²K), com o Turbo
   (blastT) nos primeiros turboMin minutos e depois a temperatura normal do freezer. Pronto = centro a −18 °C
   (ou 1,5 °C acima do freezer, se ele for mais quente). Pote pré-resfriado não aquece o gelato na entrada. */
let HARD_N=10;
/* coeficiente de troca do freezer frost free (W/m²K): estimativa de literatura; os lotes com núcleo medido o calibram (CAL.hMult) */
const H_FREEZER=14;
/* v18.2 · temperatura do núcleo após tMin minutos no freezer, para um h dado (mesma física do endurecimento) */
function coreAt(m,pr,ml,h,tMin){const store=+pr.storeT,turbo=Math.min(+pr.blastT,store),tb=clamp(+pr.turboMin||0,0,150)*60;let core=null;
 heatSim(m,{ml,N:8,T0:Math.min(+pr.drawT,m.fp-.2),Tamb:t=>t<tb?turbo:store,h,tMax:tMin*60+90,step:60,dtMax:30,watch:s=>{core=s.core;return s.t>=tMin;}});return core;}
/* h que reproduz o núcleo medido. null quando a medição não informa: equilíbrio com o freezer, menos de 5 min,
   ou fora do alcance físico (nem h = 3 nem h = 80 W/m²K chegam ao valor medido). Busca por bisseção em log h. */
function fitH(m,pr,ml,tMin,coreMeas,iters){if(!(tMin>=5)||!isFinite(coreMeas))return null;const store=+pr.storeT;
 if(Math.abs(coreMeas-store)<1.5)return null;
 const g=lh=>coreAt(m,pr,ml,Math.exp(lh),tMin)-coreMeas;let lo=Math.log(3),hi=Math.log(80);const glo=g(lo),ghi=g(hi);
 if(!(glo>0&&ghi<0))return null;for(let k=0;k<(iters||10);k++){const mid=(lo+hi)/2;if(g(mid)>0)lo=mid;else hi=mid;}return Math.exp((lo+hi)/2);}
/* cache dos ajustes por lote, guardado no aparelho: cada medição é calculada uma vez, não a cada abertura do app.
   Chave = hash (cyrb53) do que entra no cálculo; ~40 bytes por entrada, até 300 entradas. */
const hash53=(str,seed=0)=>{let h1=0xdeadbeef^seed,h2=0x41c6ce57^seed;for(let i=0;i<str.length;i++){const ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677);}
 h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return(4294967296*(2097151&h2)+(h1>>>0)).toString(36);};
const HFIT_KEY='fredolin_hfit_v1';
const _HFIT=(()=>{try{return new Map(JSON.parse((typeof localStorage!=='undefined'&&localStorage.getItem(HFIT_KEY))||'[]'));}catch(e){return new Map();}})();
let _HFIT_dirty=false;
function hfitSave(){if(!_HFIT_dirty)return;_HFIT_dirty=false;try{if(typeof localStorage!=='undefined')localStorage.setItem(HFIT_KEY,JSON.stringify([..._HFIT].slice(-300)));}catch(e){}}
function hardenModel(m,prIn,ml){if(m.empty||!(m.wat>0))return null;const pr=Object.assign({},PROC0,prIn||m.pr);ml=ml||pr.poteMl;
 const hM=CAL.on&&CAL.hMult>0?CAL.hMult:1;const key=['h',ml,pr.drawT,pr.storeT,pr.blastT,pr.turboMin,hM].join('|');m._hard=m._hard||{};if(m._hard[key])return m._hard[key];
 const store=+pr.storeT,turbo=Math.min(+pr.blastT,store),tb=clamp(+pr.turboMin||0,0,150)*60;const target=Math.max(-18,store+1.5);
 let tDone=null,tFirm=null;const firmT=Math.max(-12,store+3);
 const sim=heatSim(m,{ml,N:HARD_N,T0:Math.min(+pr.drawT,m.fp-.2),Tamb:t=>t<tb?turbo:store,h:H_FREEZER*hM,tMax:12*3600,step:60,dtMax:30,
  watch:s=>{if(tFirm==null&&s.scoop<=firmT)tFirm=s.t;if(tDone==null&&s.core<=target){tDone=s.t;return true;}return false;}});
 const res={ml,target,tDone,tFirm,massG:sim.massG,curve:sim.curve};m._hard[key]=res;return res;}
/* temperatura em que a camada de servir estará após a espera: é a "vitrine" efetiva no modo pote */
function poteServeTemp(st){const m=analyze(st);const P=poteModel(m,st.proc);return P?Math.round(P.atWait.scoop*10)/10:+st.vit;}
/* no modo pote cada variante tem a sua própria temperatura de colher (a receita muda a curva de aquecimento) */
function stReal(st){return st&&st.proc&&st.proc.serveFrom==='pote'?{...st,vit:poteServeTemp(st)}:st;}
/* balanceia para servir no ponto depois da espera escolhida (a própria receita muda a curva: itera) */
function balancePote(st){let s2={...st,vit:poteServeTemp(st)},b=null;
 for(let i=0;i<4;i++){b=balance(s2);if(!b.ok)return b;const v=poteServeTemp({...s2,recipe:b.newRecipe});if(Math.abs(v-s2.vit)<.05)break;s2={...s2,vit:v};}
 const fin={...st,recipe:b.newRecipe,vit:poteServeTemp({...st,recipe:b.newRecipe})};b.m1=analyze(fin);b.poteVit=fin.vit;return b;}

