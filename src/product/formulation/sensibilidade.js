/* ===================== SENSIBILIDADE (LAB) ===================== */
function sweep(st,id,lo,hi,n){const r=(st.recipe||[]).find(x=>x.id===id);if(!r)return[];const base=+r.g;const out=[];
 for(let i=0;i<n;i++){const k=lo+(hi-lo)*i/(n-1);const g=Math.max(0,Math.round(base*(1+k/100)*10)/10);const s2=stReal({...st,recipe:st.recipe.map(x=>x.id===id?{...x,g}:x)});const m=analyze(s2);const F=diagnose(s2,m);out.push({k,g,fz:m.fzVit,pod:m.pod,sol:m.sol,sc:score(s2,m,F).total,serve:m.serveT,fat:m.fat});}
 return out;}


