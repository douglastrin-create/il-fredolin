/* ==== 39-roles.js ==== */
/* ===================== IL FREDOLIN · PERFIS DA EQUIPE =====================
   Maestro  acesso total (equipe, custos, preços, aprovação)
   Chef     laboratório de criação: receitas, neutros, ingredientes; aprova receitas para execução; sem custos
   Sous Chef execução: só as receitas aprovadas (biblioteca Il Fredolin), ficha de produção e registro de lotes
   No artefato (uso individual) o perfil é sempre Maestro. A mesma regra vale no banco (RLS) — aqui ela só
   esconde o que o perfil não usa e bloqueia o clique; quem garante de verdade é o servidor. */
let ROLE='maestro';
let ME={uid:null,email:'',ws:null,wsName:'',role:'maestro'};
const ROLE_N={maestro:'Maestro',chef:'Chef',sous:'Sous Chef'};
/* m = Maestro · c = Chef · s = Sous Chef */
const PAGE_ROLES={bancada:'mc',creator:'mc',laudo:'mc',congelamento:'mc',quimica:'mc',vitrine:'mc',
 linha:'mcs',execucao:'mcs',lotes:'mcs',planejamento:'mc',estoque:'mc',processo:'mc',brix:'mc',defeitos:'mcs',producao:'mcs',
 ingredientes:'mc',rotulo:'mcs',custos:'m',biblioteca:'mc',equipe:'m',dados:'mcs',
 componentes:'mc',degustacao:'mcs',sazonal:'mc'};
/* o Sous Chef só pode estas ações; o Chef pode tudo menos estas */
const SOUS_ACT=new Set(['go','sub','defMode','defSym','defClr','defOpen','defOpenB','defCat','navTog','toTop','flowStart','flowNext','flowBack','flowDisc','flowOpen','flowColor','flowView','flowLot','flowNotify','chk','unchk','copy','lotNew','lotOpen','lotSave','lotConsume','defect','execRun','logout','logoutYes','logoutNo','syncNow','testRun','delNo','authMode','authGo',
 'meltTimer','fam','palOpen','palClose','palRun','panelStart','panelSet','panelNext','panelCancel','panelReveal','panelReset']);
const SOUS_INP=new Set(['flowLabel','flowMeas','prodG','lot','lotTxt','auth','panelTaster','panelNote','palQ']),SOUS_CHG=new Set(['defChk','lot','panelLot']);
const CHEF_DENY_ACT=new Set(['expJson','expCsv','impGo','impDel','memInvite','memDel','memDelYes','teamReload']),CHEF_DENY_INP=new Set(['cost','costCap']),CHEF_DENY_CHG=new Set(['memRole']);
/* telas de entrada e saída funcionam para qualquer perfil (inclusive antes de saber o perfil) */
const ALWAYS_ACT=new Set(['offDiag','offRepair','appReload','authGo','authMode','authRetry','logout','logoutYes','logoutNo','syncNow','rejRetry','rejExport','rejDrop','rejDropYes','rejDropNo']);
const can={
 page:k=>(PAGE_ROLES[k]||'m').includes(ROLE[0]),
 cost:()=>ROLE==='maestro',
 edit:()=>ROLE!=='sous',
 approve:()=>ROLE==='maestro'||ROLE==='chef',
 act:k=>ALWAYS_ACT.has(k)||ROLE==='maestro'||(ROLE==='chef'?!CHEF_DENY_ACT.has(k):SOUS_ACT.has(k)),
 inp:(k,t)=>k==='auth'||ROLE==='maestro'||(ROLE==='chef'?!CHEF_DENY_INP.has(k)&&!(k==='proc'&&t&&t.dataset.k==='markup'):SOUS_INP.has(k)),
 chg:k=>ROLE==='maestro'||(ROLE==='chef'?!CHEF_DENY_CHG.has(k):SOUS_CHG.has(k))
};
const homePage=()=>ROLE==='sous'?'linha':'bancada';
/* trecho de interface que só o Maestro vê (custos, preços, margens) */
const $cost=h=>can.cost()?h:'';

