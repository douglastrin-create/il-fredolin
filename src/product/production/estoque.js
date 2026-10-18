/* ---------- PLANEJAMENTO E ESTOQUE ---------- */
/* saldo por ingrediente (puro: pode ser chamado no render) */
/* v18 · ESTOQUE POR MOVIMENTOS. Até a v17.12 a baixa reduzia o saldo (qty) dentro do registro da entrada e regravava
   o registro inteiro: duas baixas em aparelhos diferentes se sobrescreviam (vence o último) e baixar o mesmo lote duas
   vezes descontava duas vezes. Agora a entrada guarda a quantidade recebida e cada baixa é um registro próprio
   {kind:'mov'} com id determinístico (lote + ingrediente + entrada): só é inserido, nunca alterado, então baixas
   concorrentes se somam e repetir a baixa de um lote não desconta de novo. Saldo = entrada − soma dos movimentos.
   Entradas antigas já trazem o saldo descontado e continuam valendo como estão. */
const isMov=e=>!!e&&e.kind==='mov';
function invLeft(inv){const used={};(inv||[]).forEach(e=>{if(isMov(e))used[e.entry]=(used[e.entry]||0)+(+e.g||0);});
 const left=new Map();(inv||[]).forEach(e=>{if(!isMov(e))left.set(String(e.id),Math.max(0,(+e.qty||0)-(used[e.id]||0)));});return left;}
/* entradas com o saldo atual em qty (cópias: só para leitura) */
function invEntries(inv){const L=invLeft(inv);return(inv||[]).filter(e=>!isMov(e)).map(e=>Object.assign({},e,{qty:L.get(String(e.id))}));}
function invStock(inv){const by={};invEntries(inv).forEach(e=>{if(+e.qty<=0)return;const b=by[e.ingId]=by[e.ingId]||{q:0,c:0};b.q+=+e.qty;b.c+=+e.qty*(+e.costKg||0);});return by;}
/* custo médio ponderado do estoque → custos das receitas; só invalida a memória de cálculo se mudou */
function invRecompute(inv){const by=invStock(inv);const nc={};for(const k in by)if(by[k].q>0&&by[k].c>0)nc[k]=by[k].c/by[k].q;
 if(JSON.stringify(nc)!==JSON.stringify(INVCOST)){INVCOST=nc;INVVER++;}return by;}
function planNeeds(plan,getRec,cap){const need={},runs=[];(plan||[]).forEach(p=>{const r=getRec(p);if(!r||!(+p.kg>0))return;const tot=r.recipe.reduce((a,x)=>a+(+x.g||0),0)||1;const g=+p.kg*1000;const f=g/tot;
  r.recipe.forEach(x=>{need[x.id]=(need[x.id]||0)+x.g*f;});runs.push({name:r.name,g,cycles:cap?Math.ceil(g/cap):1,perCycle:cap?g/Math.ceil(g/cap):g});});return{need,runs};}
/* baixa FEFO de g gramas do ingrediente id para o lote lotId: devolve os movimentos a gravar (não altera nada).
   Se o lote já tem baixa desse ingrediente, não desconta de novo (already). */
function consumeFIFO(inv,id,g,lotId){const tag=String(lotId||'x');
 if((inv||[]).some(e=>isMov(e)&&e.ingId===id&&String(e.lot)===tag))return{rest:0,movs:[],already:true,firstLot:''};
 let rest=+g||0;const movs=[];let firstLot='';
 invEntries(inv).filter(e=>e.ingId===id&&+e.qty>0).sort((a,b)=>String(a.exp||'9999').localeCompare(String(b.exp||'9999'))).forEach(e=>{if(rest<=0)return;const t=Math.min(+e.qty,rest);
  if(!movs.length)firstLot=e.lot||'';movs.push({id:('M-'+tag+'-'+id+'-'+e.id).slice(0,120),kind:'mov',entry:String(e.id),ingId:id,g:Math.round(t*10)/10,lot:tag});rest-=t;});
 return{rest,movs,already:false,firstLot};}

