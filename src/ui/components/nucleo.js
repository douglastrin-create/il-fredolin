/* ==== 40-ui-core.js ==== */
/* ===================== IL FREDOLIN · INTERFACE: NÚCLEO ===================== */
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* v18 · natureza de cada resultado (mesmas classes de docs/model-registry.json): evita que uma regra prática
   apareça com a autoridade de uma medição. "calibrável" = os lotes medidos corrigem o valor. */
const MODEL_NAT={ph:['heurístico','Estimado pela fonte ácida dominante e pelo tampão do leite; não resolve o equilíbrio ácido-base. Meça com pHmetro.'],
 viscosity:['heurístico','Base de literatura (Krieger–Dougherty), mas os coeficientes da fase sérica e dos hidrocoloides não foram medidos. Meça com viscosímetro ou copo Ford.'],
 overrun:['heurístico','Soma de efeitos do processo limitada pela máquina; os lotes com overrun medido corrigem o valor.'],
 'ice-crystal-size':['heurístico','Índice de risco convertido em µm; não é medição microscópica.'],
 'texture-stability':['heurístico','Crescimento de cristais com taxa ainda não calibrada. Não é validade sanitária.'],
 'tg-prime':['semiempírico','Média ponderada dos Tg′ dos solutos.'],
 quenelle:['heurístico','A fração de gelo vem da curva de congelamento; a coesão e a janela racha/desaba são regras práticas ajustadas pelos testes registrados.'],
 'ice-volume':['semiempírico','Volume de gelo calculado pela curva de congelamento e pelo ar previsto; a relação com a dureza segue a literatura (Muse & Hartel).'],
 melt:['heurístico','Regra prática a partir de sólidos, gordura e estabilizantes; os lotes com derretimento medido corrigem o valor.'],
 'sensory-temperature':['heurístico','Queda de ~2,5% da doçura percebida por °C abaixo de −12 °C: coeficiente sem painel sensorial próprio.'],
 'stabilizer-function':['heurístico','Notas de 0 a 5 por componente (prática de formulação, sem medição) somadas pela dose; sinergias não entram na conta, só como descrição com fonte. Os lotes medidos mostram o resultado real.']};
const natTag=id=>{const n=MODEL_NAT[id];if(!n)return'';const cal=id==='overrun'&&typeof CAL!=='undefined'&&CAL.on&&CAL.counts&&CAL.counts.ov?' · calibrado por '+CAL.counts.ov+' lote(s)':'';
 return` <span class="chip nat" role="link" tabindex="0" data-a="sciOpen" data-v="${esc(id)}" style="cursor:pointer" title="${esc(n[1])} Toque para ver a ficha do modelo." aria-label="${esc(n[0]+cal+'. '+n[1])}">${esc(n[0]+cal)}</span>`;};
const norm=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
