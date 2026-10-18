/* ==== 34-medir.js ==== */
/* ===================== IL FREDOLIN · O QUE MEDIR (v18.1) =====================
   Especificação §30: indicar quais medições mais melhorariam as previsões DESTA receita. A ordem combina:
   (1) a natureza do modelo que a medição corrige (heurístico pesa mais que mecanístico; ver MODEL_NAT e
       docs/model-registry.json), (2) quanto ele já foi corrigido por lotes medidos (calibração), (3) o efeito
       calculado na receita quando o motor permite calcular (ex.: °C de incerteza vinda do Brix das frutas) e
       (4) o custo de medir (casa → barato → laboratório). É uma ordem de prioridade transparente, não uma
       medida de informação formal: os números de efeito aparecem para o usuário julgar. */
const MEAS_W={H:.7,SE:.42,M:.21,D:.14};   /* valor de medir quando o motor NÃO consegue calcular o efeito */
const MEAS_ACC={casa:1,barato:.8,lab:.3};
function measurePlan(st,m,cal,unc){if(!m||m.empty||!(m.wat>0))return[];cal=cal||{};const cnt=cal.counts||{};
 const part=n=>{const p=unc&&unc.parts?unc.parts.find(x=>x.n===n):null;return p?Math.abs(p.d):0;};
 /* valor: efeito calculado (eff, em °C na temperatura de serviço; 0,5 °C ≈ diferença perceptível de dureza) ou,
    sem efeito calculável, a natureza do modelo. Divide pelo que os lotes já calibraram e multiplica pela acessibilidade. */
 const out=[];const add=o=>{o.n=+o.n||0;const v=o.eff!=null?clamp(o.eff/.5,0,1):o.val!=null?o.val:MEAS_W[o.cls];o.quant=o.eff!=null;
  o.score=Math.round(100*v*MEAS_ACC[o.acc]/(1+o.n));out.push(o);};
 /* 1. Brix de cada fruta: a maior fonte de incerteza do congelamento quando há fruta sem Brix medido */
 const fr=(st.recipe||[]).filter(r=>{const i=ING_BY[r.id];return i&&i.cat==='Frutas'&&i.brix&&+r.g>0;});
 const frMiss=fr.filter(r=>{const b=(st.brix||{})[r.id];return b==null||b===''||!isFinite(+b);});
 if(fr.length){const d=part('Frutas (Brix)');add({id:'brixFruta',what:'Brix de cada fruta',field:'Bancada → Calibração Brix',
  why:frMiss.length?frMiss.length+' fruta(s) com Brix de tabela. O açúcar da fruta varia com variedade e maturação.':'Brix já medido nesta receita.',
  impact:d>0?'±'+f1(d)+' °C na temperatura de serviço':'',cls:'SE',acc:'barato',eff:frMiss.length?d:0,n:frMiss.length?0:9,
  equip:'Refratômetro 0–32 °Bx',how:'Esprema e filtre um pouco da fruta já preparada, uma gota no prisma, leia a 20 °C.'});}
 /* 2. Overrun pelo copo: o modelo de ar incorporado é heurístico */
 {const n=cnt.ov||0;add({id:'overrun',what:'Overrun pelo copo',field:'Lote → Copo com mistura / Copo com gelato',
  why:'O ar incorporado é estimado por regras do processo'+(n?'; já corrigido por '+n+' lote(s).':' e ainda não foi medido.'),
  impact:'previsto '+f0(m.ov)+'%: muda densidade ('+f0(m.gPerL)+' g/L), dureza e rendimento',cls:'H',acc:'casa',n,
  equip:'Balança 0,1 g e um copo',how:'Pese o copo cheio de mistura e o mesmo copo cheio de gelato recém-tirado, rasado. Overrun = (mistura − gelato) / gelato.'});}
 /* 3. Textura na temperatura de serviço: corrige o deslocamento da curva de congelamento */
 {const n=cnt.tex||0;const sd=unc?unc.sd:.4;
  /* medir textura corrige o erro do MODELO (parcela que não vem das entradas); a variação das frutas se corrige medindo o Brix */
  const sdModel=unc&&unc.parts?Math.sqrt(Math.max(0,sd*sd-unc.parts.reduce((a,p)=>a+p.d*p.d,0))):sd;add({id:'textura',what:'Textura na temperatura de serviço',field:'Lote → Textura na vitrine (com a temperatura)',
  why:'Ajusta o ponto de serviço previsto pela curva de congelamento'+(n?'; já corrigido por '+n+' lote(s).':'.'),
  impact:'incerteza atual ±'+f1(1.65*sd)+' °C (90%) na temperatura de serviço',cls:'SE',acc:'barato',eff:sdModel,n,
  equip:'Termômetro de espeto',how:'Meça a temperatura no centro da cuba e dê a nota de textura da escala do app na mesma hora.'});}
 /* 4. Derretimento */
 {const n=cnt.melt||0;add({id:'derretimento',what:'Derretimento em 10 min a 20 °C',field:'Lote → Derretimento',
  why:'A resistência ao derretimento é estimada por regra prática'+(n?'; já corrigida por '+n+' lote(s).':'.'),
  impact:'previsto '+f0(m.melt10)+'% derretido',cls:'H',acc:'casa',n,
  equip:'Balança, peneira e cronômetro',how:'Uma bola de ~50 g sobre peneira a 20 °C; pese o que escorreu em 10 min.'});}
 /* 5. Gelo D+1/3/7: taxa de crescimento de cristais (estabilidade da textura) */
 {const n=cnt.icy||0;add({id:'gelo',what:'Gelo perceptível em D+1, D+3 e D+7',field:'Lote → Gelo D+1 · D+3 · D+7',
  why:'A taxa de crescimento dos cristais não está calibrada; é ela que define a "estabilidade da textura"'+(n?' (já há '+n+' lote(s)).':'.'),
  impact:'estimativa atual '+(m.shelfVit>60?'60+':f1(m.shelfVit))+' dias na vitrine',cls:'H',acc:'casa',n,
  equip:'Nenhum (prova cega)',how:'Guarde uma porção do lote e prove nos dias indicados; marque quando a areia de gelo aparecer.'});}
 /* 6. Quenelle */
 {const n=cnt.q||0;add({id:'quenelle',what:'Teste de quenelle',field:'Lote → Quenelle (temperatura e resultado)',
  why:'O ponto de quenelle combina física do gelo com uma coesão estimada'+(n?'; já corrigido por '+n+' teste(s).':'.'),
  impact:(()=>{const q=quenelleModel(m);return q?'previsto a '+f1(q.T)+' °C':'';})(),cls:'SE',acc:'barato',n,
  equip:'Termômetro de espeto e duas colheres',how:'Molde uma quenelle, anote a temperatura e se rachou, ficou lisa ou desabou.'});}
 /* 7. pH quando há fonte ácida relevante */
 if((m.A&&m.A.acd>0)||m.ph<6){add({id:'ph',what:'pH da mistura',field:'Lote → pH medido',
  why:'O pH é estimado só pela fonte ácida dominante; não resolve o equilíbrio ácido-base.',
  impact:'estimado '+f1(m.ph),cls:'H',acc:'barato',val:m.ph<5.5?.7:.35,n:cnt.ph||0,
  equip:'pHmetro de bancada calibrado (pH 4 e 7)',how:'Meça a mistura fria (4–10 °C) após maturar; anote a temperatura junto.'});}
 /* 8. Brix da mistura: confere a dosagem real */
 add({id:'brixMistura',what:'Brix da mistura',field:'Lote → Brix da mistura',
  why:'Confere se a composição pesada é a que o motor calculou (erros de pesagem, fruta diferente).',
  impact:'previsto '+f1(m.brixMix)+' °Bx',cls:'D',acc:'barato',val:.3,n:0,
  equip:'Refratômetro',how:'Uma gota da mistura maturada no prisma.'});
 /* 9. Núcleo no endurecimento (registrado; calibração do coeficiente térmico ainda não implementada) */
 {const n=cnt.core||0;add({id:'nucleo',what:'Temperatura do núcleo durante o endurecimento',field:'Lote → Núcleo após abatimento + minutos no freezer',
  why:'O modelo térmico é verificado, mas a troca de calor do seu freezer é uma estimativa de literatura'+(n?'; já calibrada por '+n+' lote(s).':'. Cada medição a calibra.'),
  impact:'',cls:'SE',acc:'barato',n,equip:'Termômetro de espeto',how:'Meça o centro do pote quando já estiver bem abaixo da temperatura de saída (em geral 60–150 min no freezer). Medições cedo demais, com o núcleo parado no ponto de congelamento, não informam e são descartadas.'});}
 /* 10. Laboratório */
 add({id:'viscosidade',what:'Viscosidade da mistura',field:'(sem campo: anote no lote)',why:'Os coeficientes dos estabilizantes não foram medidos.',
  impact:'estimada '+f0(m.visc)+' mPa·s a 4 °C',cls:'H',acc:'lab',n:0,equip:'Viscosímetro rotacional (laboratório)',how:'Mistura a 4 °C, após maturar.'});
 add({id:'cristais',what:'Tamanho dos cristais de gelo',field:'(sem campo)',why:'O tamanho em µm é um índice heurístico.',
  impact:'índice '+m.crystal+' µm',cls:'H',acc:'lab',n:0,equip:'Microscópio com estágio refrigerado (laboratório)',how:'Serviço de laboratório de alimentos.'});
 return out.filter(o=>o.score>0).sort((a,b)=>b.score-a.score);}

