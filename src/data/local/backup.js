/* ==== 60b-backup.js ==== */
/* ===================== IL FREDOLIN · BACKUP E RESTAURAÇÃO (v18) =====================
   Antes: o backup levava só a vitrine principal (sem o set Professionale nem as lápides) e a importação gravava
   cada item como "agora", de modo que um backup antigo virava a versão mais nova e sobrescrevia na nuvem o que a
   equipe tinha editado depois. Agora a restauração é planejada antes (função pura, testada) e nunca troca um
   registro deste aparelho que seja igual ou mais novo que o do arquivo. Itens apagados só voltam se o usuário pedir. */
const BACKUP_COLS=['lib','exec','lots','ings','nx','inv','vit'];
const BACKUP_N={lib:'receitas',exec:'em execução',lots:'lotes',ings:'ingredientes',nx:'neutros',inv:'estoque',vit:'vitrine e sets'};
function backupPayload(cols,tomb,meta){const o=Object.assign({app:'Il Fredolin',schema:2},meta||{});
 BACKUP_COLS.forEach(c=>{o[c==='vit'?'vits':c]=cols[c]||[];});o.tomb=tomb||{};return o;}
/* plano de importação: para cada coleção, o que entra (novo), o que atualiza (o daqui é mais antigo),
   o que fica como está (o daqui é igual ou mais novo) e o que foi apagado aqui depois */
function planImport(d,cols,tomb){if(!d||typeof d!=='object')throw new Error('arquivo inválido');
 const src={lib:d.lib,exec:d.exec,lots:d.lots,ings:d.ings,nx:d.nx,inv:d.inv,vit:Array.isArray(d.vits)?d.vits:d.vitrine?[{id:'main',temp:d.vitrine.temp,items:d.vitrine.items||[]}]:[]};
 const plan={cols:{},total:{add:0,upd:0,keep:0,del:0},version:d.v||'',date:d.date||''};
 BACKUP_COLS.forEach(c=>{const loc=new Map((cols[c]||[]).map(r=>[String(r.id),r]));const tb=(tomb||{})[c]||{};const P={add:[],upd:[],keep:0,del:[]};
  safeList(src[c]).forEach(r=>{if(r.deleted)return;const id=String(r.id),l=loc.get(id),ts=+r.updatedAt||0;
   if(l){if((+l.updatedAt||0)<ts)P.upd.push(r);else P.keep++;}
   else if(tb[id]!=null&&tb[id]>=ts)P.del.push(r);else P.add.push(r);});
  plan.cols[c]=P;plan.total.add+=P.add.length;plan.total.upd+=P.upd.length;plan.total.keep+=P.keep;plan.total.del+=P.del.length;});
 return plan;}
