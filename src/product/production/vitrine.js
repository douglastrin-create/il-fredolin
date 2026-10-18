/* ---------- VITRINE ---------- */
function vitrineAnalysis(items,temp){return items.map(it=>{const st={tipo:it.tipo,vit:temp,recipe:it.recipe,proc:it.proc||PROC0,brix:{},costs:{}};const m=analyze(st);const F=diagnose(st,m);return{it,st,m,sc:score(st,m,F).total,dev:m.serveT-temp};});}
function bestVitrineTemp(rows){const v=rows.map(r=>r.m.serveT).filter(x=>isFinite(x)).sort((a,b)=>a-b);if(!v.length)return -13;const med=v[Math.floor(v.length/2)];return Math.round(med*2)/2;}

