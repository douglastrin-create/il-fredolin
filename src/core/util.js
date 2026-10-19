/* ==== 01-util.js ==== */
/* ===================== IL FREDOLIN · UTILITÁRIOS ===================== */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rangeScore(v,r,tol){if(!r)return 1;const[lo,hi]=r;if(v>=lo&&v<=hi)return 1;const d=v<lo?lo-v:v-hi;return Math.max(0,1-d/tol);}
/* números em pt-BR; "-0" e "-0,0" (arredondamento de valores minúsculos negativos) viram zero */
const nz=(v,d)=>{const k=Math.pow(10,d),r=Math.round(+v*k)/k;return r===0?0:r;};
/* formatadores criados uma vez (toLocaleString cria um novo a cada chamada e pesa em telas com centenas de números) */
const _NF=(()=>{try{return[0,1,2].map(d=>new Intl.NumberFormat('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}));}catch(e){return null;}})();
const f0=v=>_NF?_NF[0].format(nz(v,0)):nz(v,0).toLocaleString('pt-BR'),f1=v=>_NF?_NF[1].format(nz(v,1)):nz(v,1).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1}),f2=v=>_NF?_NF[2].format(nz(v,2)):nz(v,2).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
/* rampas 0→1 usadas pelo diagnóstico de defeitos */
const hi=(v,a,b)=>v<=a?0:v>=b?1:(v-a)/(b-a),lo=(v,a,b)=>v>=a?0:v<=b?1:(a-v)/(a-b);
/* gramas sugeridas: nunca "0 g" */
const gq=x=>x<1?'menos de 1':f0(x);
/* temperatura em texto corrido: −14,5 / −13 (sem ',0') */
const fT=v=>f1(v).replace(/,0$/,'');
/* gerador pseudoaleatório com semente (mulberry32): mesma sequência no Node, na página e no Web Worker */
function mulberry32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
