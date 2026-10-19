/* ===================== REOLOGIA DA CALDA (v18.16 · §18) =====================
   O motor prevê uma viscosidade da calda a 4 °C (Krieger–Dougherty sobre a fase sérica; heurístico nos coeficientes).
   Comportamento não newtoniano e tensão de escoamento não são previstos: dependem de hidrocoloides e proteínas de um
   jeito que o app não tem dados para modelar. O que o app faz é AJUSTAR modelos às suas leituras de viscosímetro:
     lei de potência        η = K·γ̇^(n−1)            (n < 1: pseudoplástico; n ≈ 1: newtoniano)
     Herschel–Bulkley       τ = τ0 + K·γ̇^n           (com 4+ leituras; τ0 > 0: tensão de escoamento aparente)
   Leituras no lote: "taxa:viscosidade" separados por ponto e vírgula (s⁻¹ e mPa·s), ex.: "10:850; 50:420; 100:300".
   Viscoelasticidade e tribologia (atrito e lubrificação na boca) exigem reômetro oscilatório e tribômetro: ficam
   registradas como fora do alcance do app; a cremosidade percebida é conferida pelo painel (ponte física × percepção). */
function parseRheo(s){return String(s||'').split(/[;\n]+/).map(x=>x.trim()).filter(Boolean).map(x=>{const p=x.replace(/,/g,'.').split(/[:=\s]+/).map(Number);return p.length>=2&&p[0]>0&&p[1]>0?[p[0],p[1]]:null;}).filter(Boolean).sort((a,b)=>a[0]-b[0]).slice(0,20);}
function linfit(x,y){const n=x.length,mean=v=>v.reduce((a,b)=>a+b,0)/v.length,mx=mean(x),my=mean(y);let sxy=0,sxx=0,syy=0;for(let i=0;i<n;i++){sxy+=(x[i]-mx)*(y[i]-my);sxx+=(x[i]-mx)**2;syy+=(y[i]-my)**2;}
 const b=sxx>0?sxy/sxx:0,a=my-b*mx;const sse=x.reduce((s,xi,i)=>s+(y[i]-a-b*xi)**2,0);return{a,b,r2:syy>0?1-sse/syy:1,sse};}
function rheoFit(pts){if(!pts||pts.length<2)return null;const lg=pts.map(p=>Math.log10(p[0])),le=pts.map(p=>Math.log10(p[1]));const L=linfit(lg,le);
 const n=L.b+1,K=Math.pow(10,L.a);/* K em mPa·sⁿ; η(γ̇) = K·γ̇^(n−1) */
 const out={pts,n,K,r2:L.r2,at:g=>K*Math.pow(g,n-1),kind:n<.9?'pseudoplástico (afina com o cisalhamento)':n>1.1?'dilatante (engrossa com o cisalhamento)':'praticamente newtoniano'};
 if(pts.length>=4){const tau=pts.map(p=>p[0]*p[1]/1000);/* Pa */const tmin=Math.min(...tau);let best=null;
  for(let i=0;i<200;i++){const t0=tmin*.98*i/199;const y=tau.map(t=>Math.log10(t-t0));const f=linfit(lg,y);const sse=tau.reduce((s,t,j)=>s+(t-t0-Math.pow(10,f.a+f.b*lg[j]))**2,0);if(!best||sse<best.sse)best={t0,nH:f.b,KH:Math.pow(10,f.a),sse};}
  const st=tau.reduce((a,b)=>a+b,0)/tau.length;const sst=tau.reduce((s,t)=>s+(t-st)**2,0);out.hb={tau0:best.t0,n:best.nH,K:best.KH,r2:sst>0?1-best.sse/sst:1};}
 return out;}
/* viscosidade aparente medida a 50 s⁻¹ (pela lei de potência ajustada), para comparar com o motor */
const RHEO_REF_RATE=50;
function rheoMeasured(me){const pts=parseRheo(me&&me.rheo);if(pts.length<2)return null;const T=me.rheoT!=null&&me.rheoT!==''?+me.rheoT:null;const f=rheoFit(pts);return{fit:f,T,eta50:f.at(RHEO_REF_RATE)};}
