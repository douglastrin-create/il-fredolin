/* ---------- LAUDO ---------- */
function findInRecipe(st,ids){for(const id of ids){const r=(st.recipe||[]).find(x=>x.id===id&&+x.g>0);if(r)return r;}return null;}
