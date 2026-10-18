/* ---------- BASES DE REFERÊNCIA ---------- */
/* Destrosio/dextrosa nos livros (Dondoli, Corvitto, Preti, Migoya…) vem sem a forma; o produto vendido para gelataria é o
   monoidratado, então a receita do mestre é lida como monoidratada nas mesmas gramas. Só fica anidra se a fonte disser (dexForm:'anid'). */
function masterDexFix(list){(list||[]).forEach(r=>{if(!r||r.dexForm==='anid'||!Array.isArray(r.recipe))return;r.recipe=r.recipe.map(x=>Array.isArray(x)?(x[0]==='dextrose'?['dextrosem',x[1]]:x):(x&&x.id==='dextrose'?{...x,id:'dextrosem'}:x));});return list;}
const PRESETS=[
 {name:'Fiordilatte',tipo:'crema',vit:-13,recipe:[['leite',620],['creme35',150],['lpd',40],['sacarose',145],['dextrosem',41.5],['neutro',4],['sal',.8]]},
 {name:'Crema all\'uovo',tipo:'crema',vit:-13,recipe:[['leite',600],['creme35',130],['gemap',70],['lpd',32],['sacarose',130],['dextrosem',45.9],['neutro',3],['fava',2],['sal',.8]]},
 {name:'Cioccolato fondente',tipo:'crema',vit:-13,recipe:[['leite',640],['creme35',30],['cacau',50],['choc70',45],['lpd',22],['sacarose',110],['dextrosem',65.6],['invertido',35],['neutro',4],['sal',1]]},
 {name:'Pistacchio',tipo:'crema',vit:-13,recipe:[['leite',650],['creme35',20],['pistache',100],['lpd',28],['sacarose',125],['dextrosem',60.1],['lecitina',2],['neutro',4],['sal',1]]},
 {name:'Nocciola',tipo:'crema',vit:-13,recipe:[['leite',655],['avela',100],['lpd',28],['sacarose',125],['dextrosem',65.6],['lecitina',2],['neutro',4],['sal',1]]},
 {name:'Sorbetto al limone',tipo:'sorbetto',vit:-13,recipe:[['agua',465],['limao',250],['sacarose',200],['dextrosem',54.7],['invertido',30],['neutro',5]]},
 {name:'Sorbetto di fragola',tipo:'sorbetto',vit:-13,recipe:[['morango',520],['agua',200],['sacarose',190],['dextrosem',60.1],['limao',25],['neutro',5]]},
 {name:'Cocco vegano',tipo:'vegan',vit:-13,recipe:[['agua',430],['cococreme',260],['sacarose',140],['dextrosem',92.9],['malto',30],['inulina',30],['ervilha',12],['neutro',5],['sal',.8]]}
];

const GEN_DEF={crema:{fat:8,msnf:9.5,pod:18,sol:38},frutta:{fat:3,msnf:6,pod:21,sol:35},gastro:{fat:9,msnf:9,pod:6,sol:34},semacucar:{fat:9,msnf:9,pod:16,sol:34},sorbetto:{fat:0,msnf:0,pod:25,sol:31},vegan:{fat:8,msnf:0,pod:18.5,sol:37}};

