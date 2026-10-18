
/* ---------- estado da tela (S, persistido) e efêmero (U) ---------- */
function fromPreset(p){return{name:p.name,tipo:p.tipo,vit:p.vit,recipe:p.recipe.map(([id,g])=>({id,g})),proc:Object.assign({},PROC0),brix:{},costs:{},page:'bancada',defect:'duro'};}
let S=LS.get(KEY)||fromPreset(PRESETS[0]);
/* garante todos os campos do estado; roda no boot e antes de cada render (estados antigos ou importados) */
function normalizeState(){
 try{if(!S.sets||!S.sets.art||!S.sets.pro)setsInit();}catch(e){}
 {const pr0=S.proc||{};S.proc=Object.assign({},PROC0,pr0,pr0.load==null&&pr0.machine==='maqp1'?{load:1100,preChill:0}:{});}for(const k in PROC_LIM){const v=+S.proc[k];S.proc[k]=isFinite(v)?clamp(v,PROC_LIM[k][0],PROC_LIM[k][1]):PROC0[k];}if(!isFinite(+S.vit))S.vit=-13;if(S.dexForm!=='anid')S.dexForm='mono';S.brix=S.brix||{};S.costs=S.costs||{};S.page=S.page||'bancada';S.defect=S.defect||'duro';
 if(!Array.isArray(S.recipe)||S.recipe.some(r=>!r||!SAFE_ID.test(String(r.id))||typeof r.g!=='number'||!isFinite(r.g)))S.recipe=cleanRecipe(S.recipe);
 /* ingrediente repetido na receita vira uma linha só (somando as gramas) */
 if(new Set(S.recipe.map(r=>r.id)).size!==S.recipe.length){const by=new Map();S.recipe.forEach(r=>{const e=by.get(r.id);if(e)e.g=Math.round((+e.g+ +r.g)*10)/10;else by.set(r.id,{id:r.id,g:+r.g});});S.recipe=[...by.values()];}
 S.lab=S.lab||{};S.lab.variants=S.lab.variants||[];
 S.lab.gen=S.lab.gen||{tipo:S.tipo,batch:1000,fixed:[{id:'pistache',g:100}],...genDef(S.tipo),stabId:'nx_fredolin',stabGkg:25};
 if(!Array.isArray(S.lab.gen.crit))S.lab.gen.crit=['sug','sol','melt'];
 S.lab.sens=S.lab.sens||{id:'',lo:-50,hi:50};
 S.nxEdit=S.nxEdit||{id:null,name:'Neutro Il Fredolin',dose:25,dairy:true,parts:{...NEUTRO_PRESETS.find(n=>n.id==='nx_fredolin').parts},from:'nx_fredolin'};
 S.libTab=S.libTab||'mestres';S.libAuthor=S.libAuthor||'Todos';
 S.vitrine=S.vitrine||{temp:-13,items:[]};S.plan=S.plan||[];if(!S.famLast||typeof S.famLast!=='object')S.famLast={};if(!Array.isArray(S.comps))S.comps=[];
 S.creatorTab=S.creatorTab||'gelato';if(!['atelie','gerar','comparar','sens'].includes(S.crSub))S.crSub='atelie';
 /* páginas antigas do Lab de P&D e do Lab de neutros vivem no Creator */
 if(S.page==='lab'){S.page='creator';S.creatorTab='gelato';}if(S.page==='neutros'){S.page='creator';S.creatorTab='neutros';}
 if(S.proc.serveFrom==='freezer')S.vit=+S.proc.storeT;
 /* em casa (freezer → pote): a temperatura de servir é a da camada da colher depois da espera */
 /* conjunto com endurecimento calculado: o tempo até −18 °C no centro vem da simulação do pote no freezer */
 if(S.proc.hardAuto&&Array.isArray(S.recipe)&&S.recipe.length){try{const hm=hardenModel(analyze(S),S.proc);if(hm&&hm.tDone!=null){const v=clamp(Math.round(hm.tDone/5)*5,5,480);if(v!==S.proc.hardMin)S.proc.hardMin=v;}}catch(e){}}
 if(S.proc.serveFrom==='pote'&&Array.isArray(S.recipe)&&S.recipe.length){try{S.vit=poteServeTemp(S);}catch(e){}}
}
{const v=VITS.find(x=>x.id==='main')||VITS.find(x=>!x.kind)||LS.get(K10.vit);if(v)S.vitrine={temp:v.temp,items:v.items||[]};}
normalizeState();
const U={q:'',sel:null,addG:100,scaleG:'',prodG:'',checks:{},bal:null,del:null,copy:null,gen:null,libQ:'',sens:null,nxTest:null,cq:'',days:0,aging:false,gp:null,np:null,trail:[],test:null};

/* páginas e grupos: ver 45-shell.js (FAMILIES) */
const SEVN={crit:'Crítico',warn:'Atenção',info:'Observação',ok:'Acerto'};
const scoreCls=s=>s>=85?'ok':s>=65?'warn':'crit';

