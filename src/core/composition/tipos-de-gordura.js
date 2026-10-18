/* ==== 30-engine.js ==== */
/* ===================== IL FREDOLIN · MOTOR ===================== */
const ING_BY={};ING.forEach(i=>ING_BY[i.id]=i);
let ING_VER=0;
/* estado do motor que depende do usuário: calibração (lotes) e custo médio do estoque */
const CAL={on:true,tShift:0,qShift:0,ov:{},meltBias:0,kMult:1,hMult:1,n:0,ver:0,res:{},pref:{pod:0,fz:0,n:0}};
let INVCOST={},INVVER=0;

/* ---------- tipo de gordura de cada ingrediente (para a curva de gordura sólida) ---------- */
const COCO_IDS=new Set(['cococreme','cocoleite','cocooleo','cocopure','cocoralado']),HARD_IDS=new Set(['karite','margarina','foiegras','fracionada','palma']),OIL_IDS=new Set(['azeite','girassolao']);
const _FT=new Map();
function fatTypes(ing){const hit=_FT.get(ing);if(hit)return hit;const f=(ing.c&&ing.c.fat)||0;let o={};
 if(f<=0)o={};else if(COCO_IDS.has(ing.id))o={coco:1};else if(HARD_IDS.has(ing.id))o={palm:1};else if(OIL_IDS.has(ing.id))o={oil:1};else if(ing.yolk||ing.egg)o={egg:1};
 else{let r=f;const add=(k,g)=>{if(g>0){o[k]=(o[k]||0)+g/f;r-=g;}};
  if(ing.hfB)add(ing.cat==='Cacau'||ing.id==='mcacau'?'cocoa':'coco',Math.min(r,ing.hfB));if(ing.hfN)add('nut',Math.min(r,ing.hfN));
  if(r>1e-9)add(ing.dairy||ing.msnf||ing.cat==='Lácteos'||ing.cat==='Cacau'||ing.cat==='Açúcares'?'milk':ing.cat==='Oleaginosas'?'nut':ing.cat==='Ovos'?'egg':ing.cat==='Gastronômicos'?'palm':'oil',r);}
 _FT.set(ing,o);return o;}
const sfcOf=(type,T)=>{const y=SFC[type]||SFC.milk;if(T<=SFC_T[0])return y[0];for(let i=1;i<SFC_T.length;i++)if(T<=SFC_T[i]){const a=SFC_T[i-1],b=SFC_T[i];return y[i-1]+(y[i]-y[i-1])*(T-a)/(b-a);}return y[y.length-1];};
const infParams=ing=>Object.assign({},INF0,INF[ing.id]||{},ing.inf||{});
/* encolhe tudo o que já foi somado na mistura (fração f): usado quando sólidos coados levam parte da mistura */
const A_EXTRA=['sat','tr','msnf','na','hfB','hfS','hfN','pac','pod','addSug','gsSug','fruitG','acidFruitG','dairyG','eggFresh','eggPast','yolk','cocoaG','nutG'];
function scaleMix(A,f){A.tot*=f;MASS.forEach(k=>A[k]*=f);A_EXTRA.forEach(k=>A[k]*=f);for(const k in A.keys)A.keys[k]*=f;for(const k in A.fatT)A.fatT[k]*=f;}

/* faixa para texto: 16–20 ou 17,9–23,8 (vírgula, sem casas inúteis) */
const fRs=v=>v!==0&&Math.abs(v)<1?f2(v).replace(/0$/,''):fT(v);const fRg=r=>Math.max(Math.abs(r[0]),Math.abs(r[1]))<1?fRs(r[0])+'–'+fRs(r[1]):fT(r[0])+'–'+fT(r[1]);
