/* ==== 57-v13.js ==== */
/* ===================== IL FREDOLIN · v13: COMPONENTES, DEGUSTAÇÃO, BIBLIOTECA, ESTAÇÃO ===================== */

/* ---------- dados: frutas da estação (Sudeste, pico de oferta) e combinações clássicas ---------- */
/* meses de maior oferta e menor preço no atacado de São Paulo (referência CEAGESP/Embrapa; variam por região e ano).
   bx = Brix típico da fruta madura (°Bx); conferir sempre no refratômetro e lançar em "Calibração Brix". */
const SAZON=[
 ['morango',[6,7,8,9,10],'7–9'],['abacaxi',[11,12,1,2],'12–14'],['manga',[10,11,12,1],'14–18'],['maracuja',[12,1,2,3,4],'13–15'],
 ['goiaba',[1,2,3,4],'9–11'],['caju',[9,10,11,12],'10–12'],['acerola',[11,12,1,2,3,4],'6–8'],['caja',[2,3,4,5],'9–11'],
 ['umbu',[1,2,3],'9–11'],['pitanga',[10,11,12,1],'8–10'],['jabuticaba',[9,10,11],'14–16'],['graviola',[2,3,4,5],'13–15'],
 ['cupuacu',[1,2,3,4],'11–13'],['acai',[8,9,10,11,12],'3–5'],['banana',[1,2,3,4,5,6,7,8,9,10,11,12],'20–23'],['mamao',[1,2,3,4,5,6,7,8,9,10,11,12],'10–12'],
 ['limao',[1,2,3,4],'7–9'],['laranja',[6,7,8,9],'10–12'],['tangerina',[4,5,6,7],'10–12'],['caqui',[3,4,5],'16–20'],
 ['uva',[12,1,2,3],'15–18'],['pessego',[10,11,12],'10–12'],['figo',[1,2,3,4],'16–20'],['melancia',[11,12,1,2,3],'8–10'],
 ['melao',[8,9,10,11,12,1],'9–12'],['abacate',[2,3,4,5,6,7],'—'],['lichia',[11,12,1],'16–19'],['pitaya',[12,1,2,3,4],'11–14'],
 ['carambola',[1,2,3,4,9,10],'6–8'],['mirtilo',[10,11,12,1],'11–14'],['framboesa',[11,12,1,2,3],'9–11'],['amora',[10,11,12,1],'8–10'],
 ['cambuci',[1,2,3],'6–8'],['uvaia',[10,11,12,1],'8–10'],['butia',[1,2,3],'12–14'],['seriguela',[12,1,2,3],'16–20'],
 ['mangaba',[11,12,1,2,3],'12–16'],['bacuri',[1,2,3,4],'15–17'],['cacaupolpa',[5,6,7,8,10,11],'15–18'],['maca',[2,3,4,5],'11–13'],
 ['pera',[1,2,3],'12–14'],['cereja',[12,1],'16–20']];
const MESES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
/* combinações consagradas da gelateria e da confeitaria (tradição italiana e francesa; The Flavor Bible, Page & Dornenburg).
   [id do ingrediente, rótulo] — sem id no banco aparece só como sugestão de texto */
const PAIRS={
 morango:[['balsamico','vinagre balsâmico'],['ervas','manjericão'],['fava','baunilha'],['iogurte','iogurte'],['especiaria','pimenta-do-reino'],['mascarpone','mascarpone'],['espumante','espumante']],
 framboesa:[['choc70','chocolate amargo'],['chocbranco','chocolate branco'],['pistache','pistache'],['lichia','lichia'],['ervas','hortelã'],['amendoa','amêndoa']],
 limao:[['ervas','manjericão'],['especiaria','gengibre'],['mirtilo','mirtilo'],['framboesa','framboesa'],['iogurte','iogurte'],['matcha','matcha']],
 maracuja:[['choc70','chocolate amargo'],['chocbranco','chocolate branco'],['cocoralado','coco'],['manga','manga'],['fava','baunilha'],['especiaria','pimenta']],
 manga:[['maracuja','maracujá'],['lima','limão'],['cocoralado','coco'],['especiaria','cardamomo'],['iogurte','iogurte'],['framboesa','framboesa']],
 banana:[['doceleite','doce de leite'],['choc70','chocolate'],['rum','rum'],['espresso','café'],['amendoim','amendoim'],['especiaria','canela']],
 abacaxi:[['ervas','hortelã'],['cocoralado','coco'],['especiaria','gengibre'],['rum','rum'],['limao','limão']],
 goiaba:[['creamcheese','queijo (romeu e julieta)'],['ricota','ricota'],['especiaria','canela'],['limao','limão']],
 caju:[[null,'castanha-de-caju'],['limao','limão'],['especiaria','pimenta'],['doceleite','doce de leite']],
 acerola:[['laranja','laranja'],['morango','morango'],['ervas','hortelã'],['chocbranco','chocolate branco']],
 cupuacu:[['choc70','chocolate'],['cocoralado','coco'],[null,'castanha-do-pará'],['doceleite','doce de leite'],['fava','baunilha']],
 acai:[['banana','banana'],['morango','morango'],['cocoralado','coco'],[null,'guaraná']],
 jabuticaba:[['vinho','vinho tinto'],['especiaria','cravo'],['chocbranco','chocolate branco'],['creme35','creme']],
 graviola:[['cocoralado','coco'],['limao','limão'],['fava','baunilha'],['maracuja','maracujá']],
 cambuci:[[null,'cachaça'],['chocbranco','chocolate branco'],['limao','limão']],
 pistache:[['framboesa','framboesa'],['cereja','cereja'],['laranja','laranja'],['choc70','chocolate amargo'],['chocbranco','chocolate branco'],['fava','baunilha']],
 avela:[['choc70','chocolate'],['espresso','café'],['laranja','laranja'],['doceleite','doce de leite'],['sal','flor de sal']],
 amendoa:[['cereja','cereja'],['damasco','damasco'],['laranja','laranja'],['fava','baunilha'],['choc70','chocolate']],
 amendoim:[['chocleite','chocolate ao leite'],['banana','banana'],['sal','sal'],['doceleite','doce de leite'],['morango','geleia de morango']],
 choc70:[['laranja','laranja'],['framboesa','framboesa'],['espresso','café'],['avela','avelã'],['sal','flor de sal'],['especiaria','pimenta / canela'],['rum','rum'],['maracuja','maracujá']],
 cacau:[['laranja','laranja'],['espresso','café'],['avela','avelã'],['sal','flor de sal'],['especiaria','canela']],
 chocbranco:[['maracuja','maracujá'],['framboesa','framboesa'],['matcha','matcha'],['limao','limão'],['pistache','pistache'],['cocoralado','coco']],
 espresso:[['choc70','chocolate'],['avela','avelã'],['doceleite','doce de leite'],['especiaria','cardamomo'],['mascarpone','mascarpone']],
 matcha:[['chocbranco','chocolate branco'],['limao','limão'],['azuki','azuki'],['framboesa','framboesa'],['cocoralado','coco']],
 fava:[['morango','morango'],['cereja','cereja'],['espresso','café'],['rum','rum'],['choc70','chocolate']],
 mascarpone:[['espresso','café (tiramisù)'],['figo','figo'],['morango','morango'],['cereja','cereja'],['balsamico','balsâmico']],
 ricota:[['figo','figo'],['laranja','laranja cristalizada'],['pistache','pistache'],['mel','mel']],
 iogurte:[['mirtilo','mirtilo'],['morango','morango'],['figo','figo'],['limao','limão'],['mel','mel']],
 gorgonzola:[['pera','pera'],['figo','figo'],[null,'nozes'],['mel','mel']],
 figo:[['mascarpone','mascarpone'],['gorgonzola','gorgonzola'],['especiaria','canela'],['vinho','vinho'],['amendoa','amêndoa']],
 cereja:[['choc70','chocolate'],['amendoa','amêndoa'],['pistache','pistache'],['fava','baunilha'],['ricota','ricota']],
 mirtilo:[['limao','limão'],['iogurte','iogurte'],['ervas','lavanda'],['creamcheese','cream cheese']],
 laranja:[['choc70','chocolate'],['amendoa','amêndoa'],['pistache','pistache'],['ricota','ricota'],['especiaria','canela']],
 cocoralado:[['manga','manga'],['maracuja','maracujá'],['abacaxi','abacaxi'],['choc70','chocolate'],['limao','limão']],
 doceleite:[['banana','banana'],['espresso','café'],['choc70','chocolate'],['amendoim','amendoim'],['sal','flor de sal']],
 milho:[['cocoralado','coco'],['especiaria','canela'],['doceleite','doce de leite'],['parmigiano','queijo']],
 pitaya:[['limao','limão'],['cocoralado','coco'],['framboesa','framboesa']],
 lichia:[['framboesa','framboesa'],[null,'pétala de rosa'],['limao','limão'],['cocoralado','coco']],
 melancia:[['ervas','hortelã'],['limao','limão'],['especiaria','pimenta']],
 pessego:[['amendoa','amêndoa'],['fava','baunilha'],['espumante','espumante (Bellini)'],['framboesa','framboesa (Melba)']],
 caqui:[['especiaria','canela'],['laranja','laranja'],['mascarpone','mascarpone']],
 tomate:[['ervas','manjericão'],['azeite','azeite'],['morango','morango'],['sal','sal']],
 azeite:[['limao','limão'],['laranja','laranja'],['choc70','chocolate'],['sal','flor de sal']],
 pera:[['gorgonzola','gorgonzola'],['choc70','chocolate (belle Hélène)'],['especiaria','gengibre / canela'],['vinho','vinho tinto'],['parmigiano','parmigiano'],['fava','baunilha']],
 maca:[['especiaria','canela'],['caramelo','caramelo'],['ervas','sálvia'],['creamcheese','cream cheese'],['amendoa','amêndoa']],
 abacate:[['limao','limão'],['choc70','chocolate'],['cocoralado','coco'],['mel','mel'],['lima','lima']],
 cenoura:[['laranja','laranja'],['especiaria','gengibre / cardamomo'],['creamcheese','cream cheese'],['cocoralado','coco']],
 tahine:[['mel','mel'],['choc70','chocolate'],['tamara','tâmara'],['banana','banana'],['sal','sal']],
 mel:[['ricota','ricota'],['gorgonzola','gorgonzola'],['figo','figo'],['iogurte','iogurte'],['pistache','pistache'],['ervas','lavanda / tomilho']],
 parmigiano:[['pera','pera'],['balsamico','balsâmico'],['figo','figo'],['mel','mel'],['tomate','tomate']],
 cogumelo:[['mascavo','açúcar mascavo'],['choc70','chocolate'],['parmigiano','parmigiano'],['avela','avelã'],['ervas','tomilho']],
 alhonegro:[['choc70','chocolate'],['balsamico','balsâmico'],['espresso','café'],['caramelo','caramelo']],
 ostra:[['pepino','pepino'],['lima','limão'],['espumante','espumante'],['ervas','endro'],['maca','maçã verde']],
 queijoovelha:[['mel','mel'],['figo','figo'],['marmelo','marmelo'],['pera','pera']],
 foiegras:[['figo','figo'],['vinhodoce','vinho doce'],['marmelo','marmelo'],['especiaria','pimenta']],
 cassis:[['choc70','chocolate'],['chocbranco','chocolate branco'],['iogurte','iogurte'],['ervas','folha de cassis / menta']],
 damasco:[['amendoa','amêndoa'],['pistache','pistache'],['fava','baunilha'],['mel','mel'],['especiaria','cardamomo']],
 butia:[['cocoralado','coco'],['chocbranco','chocolate branco'],['limao','limão']],
 uvaia:[['limao','limão'],['chocbranco','chocolate branco'],['ervas','hortelã']],
 cacaupolpa:[['choc70','chocolate'],['maracuja','maracujá'],['cocoralado','coco'],['lima','lima']],
 caramelo:[['sal','flor de sal'],['maca','maçã'],['banana','banana'],['espresso','café'],['amendoim','amendoim']],
 cerveja:[['choc70','chocolate'],['espresso','café'],['caramelo','caramelo'],['fava','baunilha']],
 balsamico:[['morango','morango'],['parmigiano','parmigiano'],['figo','figo'],['mascarpone','mascarpone']],
 espumante:[['pessego','pêssego (Bellini)'],['morango','morango'],['framboesa','framboesa'],['limao','limão']],
 rum:[['banana','banana'],['fava','baunilha'],['abacaxi','abacaxi'],['choc70','chocolate'],[null,'passas']],
 vinho:[['pera','pera'],['figo','figo'],['jabuticaba','jabuticaba'],['especiaria','canela / cravo'],['cereja','cereja']]};
PAIRS.choc55=PAIRS.choc64=PAIRS.choc80=PAIRS.choc70;PAIRS.cafesol=PAIRS.espresso;PAIRS.lima=PAIRS.limao;PAIRS.pistachea=PAIRS.pistache;PAIRS.cococreme=PAIRS.cocoralado;

/* ingredientes "de sabor" da receita (fora a base: lácteos, açúcares, estabilizantes, água) */
function pairChips(){const ids=(S.recipe||[]).map(r=>r.id).filter(id=>PAIRS[id]);if(!ids.length)return'';const have=new Set(S.recipe.map(r=>r.id));
 const seen=new Set();const out=[];ids.forEach(id=>PAIRS[id].forEach(([pid,lab])=>{const k=pid||lab;if(seen.has(k)||(pid&&have.has(pid)))return;seen.add(k);out.push([pid,lab,id]);}));
 if(!out.length)return'';
 return`<div style="margin-top:12px"><span class="lbl">Combina com</span><div class="chips" style="margin-top:6px">${out.slice(0,12).map(([pid,lab,src])=>pid&&ING_BY[pid]&&can.edit()?`<button data-a="crAdd" data-v="${pid}" title="Clássico com ${esc(ING_BY[src].n)} · toque para adicionar">+ ${esc(lab)}</button>`:`<span class="chip" title="Clássico com ${esc(ING_BY[src].n)}">${esc(lab)}</span>`).join('')}</div></div>`;}

/* ingredientes que fazem sentido infusionar e coar, além dos que têm parâmetros próprios em INF */
const INF_EXTRA=new Set(['alho','cogumelo','orapronobis','biscoito','alhonegro','cacau10']);

/* ---------- COMPONENTES: variegato, crocante, pedaços de fruta ---------- */
const COMP_KINDS={variegato:'Variegato / calda',crocante:'Crocante',fruta:'Pedaços de fruta'};
const compSt=c=>({tipo:'sorbetto',vit:S.vit,recipe:(c.recipe||[]).filter(r=>ING_BY[r.id]),proc:Object.assign({},S.proc,{lossPct:+c.loss||0}),brix:S.brix,costs:S.costs});
/* açúcar que a fruta precisa absorver (calda/confitagem) para não virar gelo dentro de uma base que congela fzBase% */
function candySugar(c,fzBase){const base=compSt(c);let lo=0,hi=200;const fzAt=g=>analyze(Object.assign({},base,{recipe:[...base.recipe,{id:'sacarose',g}]})).fzVit;
 const tot=base.recipe.reduce((s,r)=>s+(+r.g||0),0);if(!tot||fzAt(0)<=fzBase+5)return 0;if(fzAt(hi*tot/100)>fzBase+5)return null;
 for(let i=0;i<14;i++){const mid=(lo+hi)/2;if(fzAt(mid*tot/100)>fzBase+5)lo=mid;else hi=mid;}return hi;}
function compAnalysis(m){const comps=S.comps||[];const res=comps.map(c=>{const st=compSt(c);const cm=analyze(st);const out={c,m:cm,notes:[]};if(cm.empty)return out;
  const add=(sev,t)=>out.notes.push([sev,t]);
  if(c.kind==='variegato'){
   if(cm.fzVit>35)add('warn','A '+fT(S.vit)+' °C '+f0(cm.fzVit)+'% da água do variegato congela: fica duro e "vítreo" no meio do gelato. Suba açúcares (dextrose ou xarope de glicose) até ficar abaixo de 35%.');
   else add('ok','Fica macio na vitrine ('+f0(cm.fzVit)+'% da água congelada).');
   if(cm.fzVit<12&&cm.stab<.3)add('info','Quase não congela: tende a escorrer e "sangrar" na cuba. Engrosse com 1–2% de amido ou 0,3% de pectina.');
   if(cm.wat>52)add('warn','Água alta ('+f0(cm.wat)+'%): migra para a base e cria uma faixa de gelo ao redor do veio. Reduza (cozinhe até Brix ≥ 50) ou troque parte do líquido por gordura (pasta, chocolate).');}
  else if(c.kind==='crocante'){
   if(cm.wat>4)add('crit','Água '+f1(cm.wat)+'%: acima de 4% o crocante amolece em poucas horas no frio. Seque no forno ou troque por ingredientes secos.');
   else add('ok','Água '+f1(cm.wat)+'% (crocante até 4%).');
   /* barreira = gordura de cobertura (manteiga de cacau, coco) que forma película contínua; gordura dentro da massa do biscoito não protege */
   const cocoaFat=(cm.fatTypes.cocoa||0)+(cm.fatTypes.coco||0);
   if(cm.fat<25||cocoaFat<30)add('warn','Sem barreira de gordura sólida: a umidade da base ('+f0(m.wat)+'% de água) migra para o crocante em 1–3 dias. Banhe em chocolate ou manteiga de cacau (película fina) antes de incorporar.');
   else add('ok','Gordura sólida protege da umidade ('+f0(cm.fat)+'% de gordura, '+f0(cocoaFat)+'% dela dura).');}
  else{
   const d=cm.fzVit-m.fzVit;
   if(d>12){const sg=candySugar(c,m.fzVit);add('warn','Os pedaços congelam bem mais que a base ('+f0(cm.fzVit)+'% contra '+f0(m.fzVit)+'%): ficam duros como gelo.'+(sg!=null?' Confite em calda até absorver ≈'+f0(sg)+' g de açúcar por 100 g de fruta (ou use dextrose para menos doçura).':' Mesmo confitando não iguala: use a fruta em variegato.'));}
   else add('ok','Pedaços com dureza parecida com a da base ('+f0(cm.fzVit)+'% contra '+f0(m.fzVit)+'% de água congelada).');}
  return out;});
 /* produto final: base + componentes, por peso */
 const pTot=comps.reduce((s,c)=>s+clamp(+c.pct||0,0,60),0);const fb=Math.max(0,1-pTot/100);
 const mix=(fn)=>fb*fn(m)+res.reduce((s,r)=>s+(r.m.empty?0:clamp(+r.c.pct||0,0,60)/100*fn(r.m)),0);
 const al=new Set(m.A.al);res.forEach(r=>{if(!r.m.empty)r.m.A.al.forEach(a=>al.add(a));});
 return{res,pTot,fb,tot:{fat:mix(x=>x.fat),swt:mix(x=>x.swt),prot:mix(x=>x.prot),sol:mix(x=>x.sol),kcal:mix(x=>x.nut.kcal),sat:mix(x=>x.nut.sat),add:mix(x=>x.nut.add),costKg:mix(x=>x.costKg||0)},al};}
/* v17.8 · ponto de servir do produto montado (base + variegato/calda + pedaços).
   A colherada é dura pelo gelo: soma-se o gelo de cada fase pela sua própria curva de congelamento, ponderado pela água que ela traz.
   Crocantes quase não têm água: não mudam esse gelo, mas endurecem a colherada (aviso qualitativo). Alvo: o mesmo % de água congelada
   que a base sozinha tem no seu ponto ideal. Modelo de fases separadas (sem migração de água/açúcar entre elas, que acontece com os dias). */
function compServe(m){if(!m||m.empty)return null;const C=(S.comps||[]).filter(c=>(+c.pct||0)>0&&(c.recipe||[]).length);if(!C.length)return null;
 const pT=C.reduce((s,c)=>s+clamp(+c.pct||0,0,60),0);const ph=[{n:'Base',kind:'base',w:Math.max(0,1-pT/100),m}];
 C.forEach(c=>{const cm=analyze(compSt(c));if(!cm.empty)ph.push({n:c.name||COMP_KINDS[c.kind],kind:c.kind,w:clamp(+c.pct||0,0,60)/100,m:cm});});
 const F=T=>{let a=0,b=0;ph.forEach(p=>{const wat=p.w*(p.m.wat/100);a+=wat*p.m.fz(T);b+=wat;});return b>0?a/b:0;};
 const ref=m.fz(m.serveT);let lo=-40,hi=-1;if(F(hi)>ref)return{ph,T:hi,d:hi-m.serveT,ref,F,pT};if(F(lo)<ref)return{ph,T:lo,d:lo-m.serveT,ref,F,pT};
 for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(F(mid)>ref)lo=mid;else hi=mid;}const T=(lo+hi)/2;
 const croc=C.filter(c=>c.kind==='crocante').reduce((s,c)=>s+clamp(+c.pct||0,0,60),0);
 return{ph,T,d:T-m.serveT,ref,F,pT,croc,fzVit:F(+S.vit)};}
function compServeCard(m,compact){const R=compServe(m);if(!R)return'';const pote=S.proc.serveFrom==='pote';const sh=R.d;
 const lbl=Math.abs(sh)<.15?'igual ao da base':(sh>0?'mais quente':'mais frio');
 return`<div class="card${compact?' flat':''}"><h2>Ponto de servir do produto montado</h2>
  <div class="row" style="gap:18px;align-items:baseline;flex-wrap:wrap"><div><span class="lbl">Base sozinha</span><div class="big mono" style="font-size:22px">${f1(m.serveT)} °C</div></div><div><span class="lbl">Com ${f0(R.pT)}% de componentes</span><div class="big mono c-ice" style="font-size:22px">${f1(R.T)} °C</div></div><div><span class="lbl">Diferença</span><div class="big mono ${Math.abs(sh)>=.5?'c-warn':'c-ok'}" style="font-size:22px">${sh>=0?'+':''}${f1(sh)} °C</div><small class="muted">${lbl}</small></div></div>
  ${compact?'':`<div class="tw" style="margin-top:10px"><table class="tbl"><thead><tr><th>Fase</th><th class="r">% do produto</th><th class="r">Água</th><th class="r">Congelada a ${fT(+S.vit)}°</th></tr></thead><tbody>${R.ph.map(p=>`<tr><td>${esc(p.n)}</td><td class="r mono">${f0(p.w*100)}%</td><td class="r mono">${f0(p.m.wat)}%</td><td class="r mono">${p.m.wat<5?'—':f0(p.m.fz(+S.vit))+'%'}</td></tr>`).join('')}</tbody></table></div>`}
  ${pote?'':`<label class="row" style="gap:8px;margin-top:12px;font-size:13.5px"><input type="checkbox" id="compBal" data-c="compBal"${S.compBal?' checked':''}> Balancear a base para o produto montado</label>
  <p class="note" style="margin:4px 0 0">${S.compBal?'Ligado: o balanceamento ajusta a base para o conjunto ficar no ponto a '+fT(+S.vit)+' °C (a base sozinha fica '+(sh<0?'mais dura':'mais macia')+').':'Desligado: a base continua balanceada sozinha. Alternativa: servir com a vitrine a '+f1(+S.vit+sh)+' °C.'}</p>`}
  <p class="note" style="margin:8px 0 0">${pote?'Servindo do pote, o balanceamento segue o tempo de espera; use esta diferença como referência.':''}${R.croc>0?' Crocantes ('+f0(R.croc)+'%) não mudam o gelo, mas deixam a colherada mais resistente: na dúvida, sirva alguns décimos mais quente e confirme no teste de textura do lote.':''} Estimativa por fases separadas; com os dias a água e o açúcar migram entre elas.</p></div>`;}
/* atalho na Bancada: componentes do produto e o efeito no ponto de servir */
function compBenchCard(m){if(m.empty||!can.edit())return'';const C=(S.comps||[]);const R=compServe(m);
 return`<div class="card"><div class="row"><h2 style="margin:0">Componentes do produto</h2><span class="sp"></span>${C.length?'<button class="btn sm" data-a="go" data-v="componentes">Editar</button>':''}</div>
  ${C.length?`<div class="chips" style="margin:10px 0 0">${C.map(c=>`<span class="tag">${esc(c.name)} · ${f0(+c.pct||0)}%</span>`).join('')}</div>
   ${R?`<p class="t2" style="margin:10px 0 0">Ponto de servir do produto montado: <b class="mono c-ice">${f1(R.T)} °C</b> (base sozinha ${f1(m.serveT)} °C, ${R.d>=0?'+':''}${f1(R.d)} °C).${S.compBal&&S.proc.serveFrom!=='pote'?' O balanceamento já mira o produto montado.':''}</p>`:''}`
  :`<p class="note" style="margin:6px 0 10px">Variegato/calda, crocante ou pedaços de fruta mudam a dureza da colherada e o ponto de servir. Inclua para o app balancear o produto montado.</p>
   <div class="row" style="gap:6px"><button class="btn sm" data-a="compAdd" data-v="variegato">+ Variegato / calda</button><button class="btn sm" data-a="compAdd" data-v="crocante">+ Crocante</button><button class="btn sm" data-a="compAdd" data-v="fruta">+ Pedaços de fruta</button></div>`}</div>`;}
function pgComponentes(m){
 const C=S.comps||[];const R=m.empty?null:compAnalysis(m);
 const sev=s=>({crit:'c-crit',warn:'c-warn',info:'c-ice',ok:'c-ok'})[s];
 return`<div class="pg"><div><h1>Componentes</h1><p class="lead">Variegatos, crocantes e pedaços de fruta são balanceados à parte: cada um precisa ficar macio, seco ou na mesma dureza da base. Informe quanto cada um representa do produto final.</p></div>
 ${C.map((c,k)=>{const r=R&&R.res[k];const cm=r&&r.m;return`<div class="card"><div class="cphead"><input type="text" id="cp-n${k}" data-i="comp" data-k="${k}" data-f="name" value="${esc(c.name)}" style="font-weight:600" aria-label="Nome do componente"><button class="btn del" data-a="compRm" data-v="${k}" aria-label="Remover componente">✕</button></div>
  <div class="cpmeta"><select id="cp-k${k}" data-c="comp" data-k="${k}" data-f="kind" aria-label="Tipo">${Object.entries(COMP_KINDS).map(([v,n])=>`<option value="${v}"${v===c.kind?' selected':''}>${n}</option>`).join('')}</select>
   <label class="cpnum"><input type="number" inputmode="decimal" id="cp-p${k}" data-i="comp" data-k="${k}" data-f="pct" value="${c.pct}" min="0" max="60" step="1" aria-label="Porcentagem do produto final"><span>% do produto</span></label>
   ${c.kind==='variegato'?`<label class="cpnum"><input type="number" inputmode="decimal" id="cp-l${k}" data-i="comp" data-k="${k}" data-f="loss" value="${c.loss||0}" min="0" max="60" step="1" aria-label="Perda no cozimento"><span>% perda no cozimento</span></label>`:''}</div>
  <div class="cplist">${(c.recipe||[]).map((x,j)=>`<div class="cpi"><select id="cp-i${k}-${j}" data-c="compIng" data-k="${k}" data-j="${j}" aria-label="Ingrediente">${ingOpts(x.id)}</select><label class="cpg"><input type="number" inputmode="decimal" id="cp-g${k}-${j}" data-i="compG" data-k="${k}" data-j="${j}" value="${x.g}" min="0" step="1" aria-label="Gramas"><span>g</span></label><button class="btn del" data-a="compIngRm" data-v="${k}|${j}" aria-label="Remover">✕</button></div>`).join('')}
   <div><button class="btn sm" data-a="compIngAdd" data-v="${k}">+ Ingrediente</button></div></div>
  ${cm&&!cm.empty?`<div class="row note" style="gap:14px;margin:12px 0 4px">${[['Água',f1(cm.wat)+'%'],['Gordura',f1(cm.fat)+'%'],['Açúcares',f1(cm.swt)+'%'],['Congelada a '+fT(S.vit)+'°',f0(cm.fzVit)+'%'],['Brix',f0(cm.brixMix)]].map(([a,b])=>`<span>${a} <b class="mono" style="color:var(--t1)">${b}</b></span>`).join('')}</div>${r.notes.map(([s,t])=>`<p class="${sev(s)}" style="margin:6px 0 0;font-size:13.5px">${esc(t)}</p>`).join('')}`:''}</div>`;}).join('')}
 ${m.empty?'':compServeCard(m)}
 <div class="row"><button class="btn pri" data-a="compAdd" data-v="variegato">+ Variegato</button><button class="btn" data-a="compAdd" data-v="crocante">+ Crocante</button><button class="btn" data-a="compAdd" data-v="fruta">+ Pedaços de fruta</button></div>
 ${R&&C.length?`<div class="card"><h2>Produto final (base ${f0(R.fb*100)}% + componentes ${f0(R.pTot)}%)</h2>
  <div class="tw"><table class="tbl"><thead><tr><th>Por 100 g</th><th class="r">Base</th><th class="r">Produto final</th></tr></thead><tbody>
  ${[['Gordura (g)',m.fat,R.tot.fat,1],['Gordura saturada (g)',m.nut.sat,R.tot.sat,1],['Açúcares e polióis (g)',m.swt,R.tot.swt,1],['Açúcares adicionados (g)',m.nut.add,R.tot.add,1],['Proteína (g)',m.prot,R.tot.prot,1],['Sólidos (g)',m.sol,R.tot.sol,1],['Energia (kcal)',m.nut.kcal,R.tot.kcal,0],...(can.cost()?[['Custo (R$/kg)',m.costKg||0,R.tot.costKg,2]]:[])].map(([n,a,b,d])=>`<tr><td>${n}</td><td class="r mono">${d===2?f2(a):d?f1(a):f0(a)}</td><td class="r mono c-ice">${d===2?f2(b):d?f1(b):f0(b)}</td></tr>`).join('')}</tbody></table></div>
  <p class="note">Alérgenos do produto final: ${R.al.size?[...R.al].map(a=>BRAL[a]||a).join(', '):'nenhum da lista'}. ${R.pTot>35?'<span class="c-warn">Acima de 35% de componentes a base perde estrutura na cuba.</span>':''}</p></div>`:''}
 ${C.length?'':'<div class="card flat"><p class="note" style="margin:0">Exemplos: stracciatella (crocante: chocolate 70% + 10% manteiga de cacau, 8–12%), variegato de frutas vermelhas (calda a Brix 60, 10–15%), pedaços de manga confitados (8–12%).</p></div>'}
 </div>`;}

/* ---------- GORDURA E AROMA (cartões da Química) ---------- */
function fatCard(m){if(!(m.fat>.5))return'';
 const T0=-20,T1=40,W=600,H=190,L=40,R=12,Tp=12,B=28,sx=t=>L+(t-T0)/(T1-T0)*(W-L-R),sy=v=>Tp+(100-v)/100*(H-Tp-B);let g='';
 for(let p=0;p<=100;p+=25)g+=`<line x1="${L}" x2="${W-R}" y1="${sy(p)}" y2="${sy(p)}" stroke="var(--line)"/><text x="${L-6}" y="${sy(p)+4}" text-anchor="end" fill="var(--t3)" font-size="10">${p}%</text>`;
 for(let t=T0;t<=T1;t+=10)g+=`<text x="${sx(t)}" y="${H-10}" text-anchor="middle" fill="var(--t3)" font-size="10">${t}°</text>`;
 const pts=[];for(let t=T0;t<=T1;t+=1)pts.push(sx(t).toFixed(1)+','+sy(m.sfcAt(t)).toFixed(1));g+=`<path d="M${pts.join('L')}" fill="none" stroke="var(--gold)" stroke-width="2.4"/>`;
 [[m.vit,'vitrine','var(--ice)'],[m.pr.drawT,'saída','var(--t2)'],[35,'boca','var(--crit)']].forEach(([t,n,c],i)=>{const r=sx(t)>W-110;g+=`<line x1="${sx(t)}" x2="${sx(t)}" y1="${Tp}" y2="${H-B}" stroke="${c}" stroke-dasharray="3 3"/><text x="${r?sx(t)-4:sx(t)+4}" y="${H-B-6-i*13}" text-anchor="${r?'end':'start'}" fill="${c}" font-size="10">${n} ${f0(m.sfcAt(t))}%</text>`;});
 const ds=m.destab,dc=ds>55?'c-warn':ds<12?'c-ice':'c-ok';
 return`<div class="card"><h2>Gordura: parte sólida e desestabilização</h2>
  <div class="tw"><svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:460px;height:auto" role="img" aria-label="Gordura sólida por temperatura">${g}</svg></div>
  <div class="g3" style="margin-top:8px;gap:12px">
   <div><span class="lbl">Tipos de gordura</span><div class="note" style="margin-top:4px">${Object.entries(m.fatTypes).filter(([,v])=>v>=1).sort((a,b)=>b[1]-a[1]).map(([k,v])=>esc(SFC_N[k]||k)+' '+f0(v)+'%').join(' · ')}</div></div>
   <div><span class="lbl">Desestabilização parcial</span><div class="big ${dc}">${f0(ds)}<small class="muted" style="font-size:14px">%</small></div>${rbar(ds,[12,55],0,90)}</div>
   <div><span class="lbl">Sólida na boca (35 °C)</span><div class="big ${m.sfcMouth>9?'c-warn':''}">${f0(m.sfcMouth)}<small class="muted" style="font-size:14px">%</small></div><p class="note" style="margin:2px 0 0">Acima de ~9% a gordura dura deixa película cerosa.</p></div></div>
  <p class="note">Curva de gordura sólida por tipo (leite, cacau, coco, oleaginosas, óleos, gordura dura) ponderada pela receita. Na saída da máquina, glóbulos parcialmente cristalizados se chocam e se unem (coalescência parcial) e formam a rede que segura o ar: 15–50% dá textura seca, cremosa e derretimento lento; acima de ~55% começa a amanteigar. Emulsificantes, gema e saída mais fria aumentam; proteína alta reduz.</p></div>`;}
function aromaRows(m){return`<div class="kv"><span>Volatilidade do aroma a ${fT(m.vit)} °C</span><span class="${m.aromaTemp<.9?'c-warn':'c-ok'}">${f0(m.aromaTemp*100)}% de −12 °C</span></div>
 <div class="kv"><span>Dose de sabor para igualar −12 °C</span><span>${m.flavorDose>1.02?'×'+f2(m.flavorDose):'igual'}</span></div>
 <div class="kv"><span>Aroma efetivo na vitrine</span><span class="${m.aromaVit>=65?'c-ok':m.aromaVit>=45?'c-warn':'c-crit'}">${f0(m.aromaVit)}/100</span></div>
 ${m.lipoShare>0?`<div class="kv"><span>Sabor lipossolúvel (cacau, oleaginosas)</span><span>${f0(m.lipoShare*100)}% do sabor</span></div>`:''}`;}
function uncLine(m){const u=uncertainty(S);if(!u)return'';return`${f1(u.lo)} a ${f1(u.hi)} °C`;}
function uncCard(m){const u=uncertainty(S);if(!u)return'';const pv=recipeProv(S);
 return`<div class="kv"><span>Faixa provável (90%)</span><span>${f1(u.hi)} a ${f1(u.lo)} °C</span></div><div class="kv"><span>Água congelada na vitrine</span><span>${f0(u.fzHi)}–${f0(u.fzLo)}%</span></div>
 <p class="note" style="margin:6px 0 0">Variação natural dos ingredientes: ${u.parts.length?u.parts.map(p=>esc(p.n)+' ±'+f1(Math.abs(p.d)*1.65)+' °C').join(' · '):'só a do modelo'}. ${u.parts.some(p=>p.n.startsWith('Frutas'))?'Medir o Brix da fruta estreita a faixa.':''}</p>
 <p class="note" style="margin:6px 0 0">Composição: <b>${f0(pv.known)}%</b> da massa vem de ingredientes com fonte, definição ou cadastro seu${pv.sem.length?'; sem fonte (estimados, ±10% nos sólidos): '+pv.sem.map(s=>esc(ING_BY[s.id]?ING_BY[s.id].n:s.id)).join(', '):''}.</p>`;}

/* ---------- PROTOCOLO DE MEDIÇÃO DO LOTE ---------- */
const MELT_MS=600000;let meltTick=null;
function lotT0(L){const t=+String(L.id).slice(1);return isFinite(t)&&t>1e12?t:Date.now();}
function protocol(L){const me=L.meas||{};const has=k=>me[k]!==''&&me[k]!=null;const days=(Date.now()-lotT0(L))/864e5;const pn=(L.panel||[]).length;
 const ice=d=>has('ice'+d)?(+me['ice'+d]>0?'gelo':'ok'):days>=d?'pendente':'em '+f0(Math.ceil(d-days))+' d';
 return[['Brix da mistura (após maturar)',has('brix')],['Overrun pelo copo',has('cupMix')&&has('cupGel')||has('ov')],['Núcleo após abatimento',has('coreT')],['Derretimento 10 min a 20 °C',has('melt10')],
  ['Textura na vitrine',has('tex')&&has('texTemp')],['Gelo D+1 · D+3 · D+7',has('ice1')&&has('ice3')&&has('ice7'),[1,3,7].map(d=>'D+'+d+' '+ice(d)).join(' · ')],['Painel cego (3+ provadores)',pn>=3,pn+' avaliação(ões)']];}
function protocolCard(L){const P=protocol(L);const ok=P.filter(p=>p[1]).length;const me=L.meas||{};const run=U.melt&&U.melt.lot===L.id;const left=run?Math.max(0,U.melt.end-Date.now()):0;
 const iceSel=d=>`<label class="field"><span class="lbl">Gelo D+${d}</span><select id="lot-ice${d}" data-c="lot" data-k="meas.ice${d}"><option value=""${me['ice'+d]==null||me['ice'+d]===''?' selected':''}>—</option>${[[0,'sem gelo'],[1,'leve'],[2,'nítido']].map(([v,n])=>`<option value="${v}"${String(me['ice'+d])===String(v)?' selected':''}>${n}</option>`).join('')}</select></label>`;
 return`<div class="card flat" style="margin:12px 0"><div class="row"><h3 style="margin:0">Protocolo de medição</h3><span class="sp"></span><span class="chip ${ok>=6?'ok':ok>=3?'warn':'info'}">${ok}/${P.length} · ${ok>=4?'pronto para calibrar':'faltam medições'}</span></div>
  <div class="pills" style="margin:10px 0">${P.map(([n,d,x])=>`<div class="pill2 ${d?'ok':'info'}"><span class="dot"></span><span class="n">${n}</span><span class="v">${d?'feito':''}${x?(d?' · ':'')+esc(x):''}</span></div>`).join('')}</div>
  <div class="row"><button class="btn sm ${run?'':'pri'}" data-a="meltTimer" data-v="${L.id}">${run?'Parar cronômetro':'Iniciar derretimento (10 min)'}</button>${run?`<span class="mono c-ice" style="font-size:18px">${String(Math.floor(left/60000)).padStart(2,'0')}:${String(Math.floor(left/1000)%60).padStart(2,'0')}</span><span class="note">pese o que escorreu quando zerar</span>`:''}</div>
  <div class="form" style="margin-top:10px">${iceSel(1)}${iceSel(3)}${iceSel(7)}<label class="field"><span class="lbl">Núcleo após abatimento (°C)</span><input type="number" id="lot-meas-coreT" data-i="lot" data-k="meas.coreT" value="${has0(me.coreT)}" step=".5"><span class="hint">${(()=>{const rc=(CAL.res||[]).find(x=>x.id===L.id);if(!rc||!rc.core)return'termômetro de espeto no centro do pote';const c=rc.core;return(c[0]!=null?'previsto '+fT(c[0])+' °C (freezer de literatura)':'')+(c[4]?' · '+c[4]:' · seu freezer: '+f0(c[2])+' W/m²K');})()}</span></label><label class="field"><span class="lbl">Minutos no freezer (na medição)</span><input type="number" id="lot-meas-coreMin" data-i="lot" data-k="meas.coreMin" value="${has0(me.coreMin)}" step="1"><span class="hint">${flowHardAt(L)?'preenchido pela Produção ao vivo; corrija se mediu depois':'desde que o pote entrou no freezer; calibra o tempo de endurecimento. Meça quando o centro já estiver bem abaixo da saída (em geral 60–150 min)'}</span></label></div></div>`;}
const has0=v=>v!=null&&v!==''?esc(v):'';

/* ---------- PAINEL CEGO ---------- */
const PANELKEY='fredolin_v13_panel';
const JAR=[[-2,'muito pouco'],[-1,'pouco'],[0,'ideal'],[1,'muito'],[2,'demais']];
const PANEL_Q=[['jDoce','Doçura','jar'],['jDuro','Dureza na colher','jar'],['jCrem','Cremosidade','jar'],['hed','Gostei (1–9)','hed'],['int','Intensidade do sabor (1–5)','s5'],['pers','Persistência (1–5)','s5']];
function panelState(){if(!U.panel)U.panel=LS.get(PANELKEY)||{lots:[],codes:{},order:[],taster:'',i:-1,cur:{},reveal:false};return U.panel;}
const savePanel=()=>LS.set(PANELKEY,U.panel);
function shuffle(a,seed){const r=[...a];let s=seed||1;for(let i=r.length-1;i>0;i--){s=(s*9301+49297)%233280;const j=Math.floor(s/233280*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;}
function panelStats(L){const pn=(L.panel||[]);const st={};PANEL_Q.forEach(([k])=>{const v=pn.map(x=>x[k]).filter(v=>v!==''&&v!=null).map(Number);st[k]=v.length?{m:v.reduce((a,b)=>a+b,0)/v.length,sd:v.length>1?Math.sqrt(v.reduce((a,b)=>a+b*b,0)/v.length-Math.pow(v.reduce((a,b)=>a+b,0)/v.length,2)):0,n:v.length}:null;});return st;}
function pgDegustacao(){const P=panelState();const lots=P.lots.map(id=>LOTS.find(l=>l.id===id)).filter(Boolean);
 const pick=`<div class="card"><h2>1 · Amostras da sessão</h2><p class="note" style="margin-top:0">Escolha de 2 a 6 lotes. Cada um recebe um código de 3 dígitos e a ordem muda a cada provador, para que nome e posição não influenciem.</p>
  ${LOTS.length?`<div style="display:flex;flex-direction:column;gap:6px">${LOTS.slice(0,24).map(L=>`<label class="row" style="gap:8px;font-size:13.5px"><input type="checkbox" data-c="panelLot" data-k="${L.id}" id="pl-${L.id}"${P.lots.includes(L.id)?' checked':''}${P.i>=0?' disabled':''}> <span class="mono">${esc(L.code)}</span> ${esc(L.name)} <span class="muted">${esc(L.date)}</span></label>`).join('')}</div>`:'<p class="muted">Registre lotes em "Lotes e calibração" primeiro.</p>'}</div>`;
 if(P.i<0)return`<div class="pg"><div><h1>Painel cego</h1><p class="lead">Degustação às cegas por atributo, presa ao lote e à receita. As notas de doçura e dureza na escala do ponto ideal ensinam ao motor o gosto da casa.</p></div>${pick}
  <div class="card"><h2>2 · Provador</h2><div class="row"><input type="text" id="panelTaster" data-i="panelTaster" value="${esc(P.taster)}" placeholder="Nome ou iniciais" style="max-width:240px" aria-label="Provador"><button class="btn pri" data-a="panelStart"${lots.length>=2?'':' disabled'}>Começar a provar</button></div><p class="note">Sirva todas as amostras na mesma temperatura (a da vitrine), 30 g por copo, com água entre elas.</p></div>
  ${lots.length?panelResults(lots,P):''}</div>`;
 const order=P.order;const L=LOTS.find(l=>l.id===order[P.i]);const code=P.codes[order[P.i]];const cur=P.cur;
 const q=([k,n,t])=>`<div class="field"><span class="lbl">${n}</span><div class="chips" role="group" aria-label="${n}">${(t==='jar'?JAR:t==='hed'?[1,2,3,4,5,6,7,8,9].map(v=>[v,String(v)]):[1,2,3,4,5].map(v=>[v,String(v)])).map(([v,l])=>`<button data-a="panelSet" data-v="${k}|${v}" aria-pressed="${String(cur[k])===String(v)}">${t==='jar'?(v>0?'+':'')+v+' '+l:l}</button>`).join('')}</div></div>`;
 return`<div class="pg"><div><h1>Painel cego</h1><p class="lead">Provador: <b>${esc(P.taster||'sem nome')}</b> · amostra ${P.i+1} de ${order.length}</p></div>
  <div class="card"><div class="row"><h2 style="margin:0">Amostra <span class="mono c-ice" style="font-size:22px">${esc(code)}</span></h2><span class="sp"></span><button class="btn sm" data-a="panelCancel">Cancelar provador</button></div>
  <div style="display:flex;flex-direction:column;gap:14px;margin-top:12px">${PANEL_Q.map(q).join('')}
   <label class="field"><span class="lbl">Comentário</span><input type="text" id="panelNote" data-i="panelNote" value="${esc(cur.note||'')}" placeholder="gelado, arenoso, aroma fraco…"></label></div>
  <div class="row" style="margin-top:14px"><span class="sp"></span><button class="btn pri" data-a="panelNext"${cur.hed?'':' disabled'}>${P.i+1<order.length?'Próxima amostra':'Concluir provador'}</button></div></div>
  ${L?'':'<p class="c-warn">Lote não encontrado.</p>'}</div>`;}
function panelResults(lots,P){const rows=lots.map(L=>({L,st:panelStats(L)}));const any=rows.some(r=>r.st.hed);if(!any)return'';
 const fmt=s=>s?f1(s.m)+'<small class="muted"> ±'+f1(s.sd)+'</small>':'—';const best=rows.filter(r=>r.st.hed).sort((a,b)=>b.st.hed.m-a.st.hed.m)[0];
 return`<div class="card"><div class="row"><h2 style="margin:0">Resultados</h2><span class="sp"></span><button class="btn sm" data-a="panelReveal">${P.reveal?'Ocultar nomes':'Revelar amostras'}</button><button class="btn sm" data-a="panelReset">Nova sessão</button></div>
  <div class="tw" style="margin-top:10px"><table class="tbl"><thead><tr><th>Amostra</th><th class="r">Provadores</th><th class="r">Gostei (1–9)</th><th class="r">Doçura</th><th class="r">Dureza</th><th class="r">Cremosidade</th><th class="r">Intensidade</th><th class="r">Persistência</th></tr></thead><tbody>
  ${rows.map(({L,st})=>`<tr${best&&best.L===L?' style="background:var(--ok-a)"':''}><td><span class="mono c-ice">${esc(P.codes[L.id]||'')}</span>${P.reveal?' · '+esc(L.name)+' <span class="muted">'+esc(L.code)+'</span>':''}</td><td class="r mono">${(L.panel||[]).length}</td>${['hed','jDoce','jDuro','jCrem','int','pers'].map(k=>`<td class="r mono">${fmt(st[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
  <p class="note">Doçura, dureza e cremosidade: 0 é o ponto ideal; positivo = sobra, negativo = falta. ${CAL.pref&&CAL.pref.n?'Preferência da casa aprendida ('+CAL.pref.n+' lote(s)): doçura '+(CAL.pref.pod>0?'+':'')+f1(CAL.pref.pod)+' pp de POD, água congelada '+(CAL.pref.fz>0?'+':'')+f0(CAL.pref.fz)+' pp. Aplicada nas faixas do laudo com "Aplicar calibração" ligado.':'Com 3+ provadores por lote o motor começa a ajustar as faixas de doçura e dureza para o gosto da casa.'}</p></div>`;}

/* ---------- BIBLIOTECA: índice dos mestres (Web Worker), busca por ingrediente, parecidas, comparação, versões ---------- */
const MIDX={key:null,list:null,busy:false,worker:null,failed:false};
const VIT_F=[['Todas',()=>true],['Vitrine −11 a −14 °C',v=>v>-14.5],['−15 a −17 °C',v=>v<=-14.5&&v>-17.5],['Freezer −18 °C ou menos',v=>v<=-17.5]];
function masterSearchText(p){return norm(p.name+' '+p.a+' '+(p.src||'')+' '+p.recipe.map(([id])=>ING_BY[id]?ING_BY[id].n+' '+(ING_BY[id].lab||''):id).join(' '));}
const _MST=new WeakMap();const mText=p=>{let t=_MST.get(p);if(!t){t=masterSearchText(p);_MST.set(p,t);}return t;};
function idxKey(){return MASTERS.length+'|'+ING_VER+'|'+(CAL.on?CAL.ver:-1)+'|'+JSON.stringify(S.proc)+'|'+INVVER;}
/* métricas de uma receita, iguais às do cartão: usada pelo worker e pela via síncrona */
/* índice do cartão = a receita na vitrine do próprio mestre; o modo Casa entra só como "no ponto em X min" */
const vitProc=proc=>proc&&(proc.serveFrom!=='vitrine'||proc.hardAuto)?Object.assign({},proc,{serveFrom:'vitrine',hardAuto:0,equip:''}):proc;
function recMetrics(p,proc){const st={tipo:p.tipo,vit:p.vit,recipe:p.recipe.map(([id,g])=>({id,g})),proc:vitProc(proc),brix:{},costs:{}};const mm=analyze(st);const F=diagnose(st,mm);
 const tot=mm.tot||1;const ids={};p.recipe.forEach(([id,g])=>ids[id]=(ids[id]||0)+g/tot);
 return{sol:mm.sol,fat:mm.fat,msnf:mm.msnf,pod:mm.pod,pac:mm.pacKg,swt:mm.swt,fruit:mm.fruit,serveT:mm.serveT,sc:score(st,mm,F).total,ids,cocoa:mm.A.cocoaG/tot*100,nut:mm.A.nutG/tot*100,home:proc&&proc.serveFrom==='pote'?(()=>{const t=poteReady(analyze({...st,proc}),proc);return t==null?-1:t;})():null};}
function workerSrc(){const sc=[...document.scripts].map(s=>s.textContent).find(t=>t.includes('/* ==== 01-util.js ==== */'));if(!sc)return null;
 const a=sc.indexOf('/* ==== 01-util.js ==== */'),b=sc.indexOf('/* ==== 33-golden.js ==== */');if(a<0||b<0)return null;
 return sc.slice(a,b)+'\n'+'const vitProc='+vitProc.toString()+';\n'+recMetrics.toString()+`
self.onmessage=e=>{const d=e.data;try{
 MASTERS.splice(0,MASTERS.length,...d.masters);(d.cust||[]).forEach(ci=>{const ing=I(ci.id,ci.n,'Meus ingredientes',ci.c,Object.assign({},ci.x||{},{custom:1}));ING.push(ing);ING_BY[ci.id]=ing;});
 (d.nx||[]).forEach(n=>{try{registerNeutro(n);}catch(x){}});Object.assign(INVCOST,d.invcost||{});fitCalibration(d.lots||[]);CAL.on=d.calOn;
 const out=[];for(let k=0;k<d.masters.length;k++){out.push(recMetrics(d.masters[k],d.proc));if(k%40===39)self.postMessage({progress:k+1});}
 self.postMessage({key:d.key,list:out});}catch(err){self.postMessage({error:String(err&&err.message||err)});}};`;}
function masterIndex(){const key=idxKey();if(MIDX.key===key&&MIDX.list)return MIDX.list;if(MIDX.busy===key)return null;
 MIDX.busy=key;const proc=Object.assign({},S.proc);
 const sync=()=>{/* sem worker: calcula em fatias para não travar a tela */let k=0;const out=[];const step=()=>{if(MIDX.busy!==key)return;const t0=Date.now();while(k<MASTERS.length&&Date.now()-t0<25){out.push(recMetrics(MASTERS[k],proc));k++;}
  if(k<MASTERS.length){MIDX.prog=k;setTimeout(step,0);}else{MIDX.key=key;MIDX.list=out;MIDX.busy=false;render();}};
  if(typeof requestAnimationFrame!=='function'||typeof setTimeout!=='function'){while(k<MASTERS.length){out.push(recMetrics(MASTERS[k],proc));k++;}MIDX.key=key;MIDX.list=out;MIDX.busy=false;return;}step();};
 let w=null;if(!MIDX.failed&&typeof Worker==='function'&&typeof Blob==='function'){try{const src=workerSrc();if(src){if(MIDX.worker)MIDX.worker.terminate();w=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));MIDX.worker=w;}}catch(e){w=null;MIDX.failed=true;}}
 if(!w){sync();return MIDX.list&&MIDX.key===key?MIDX.list:null;}
 w.onmessage=e=>{const d=e.data;if(d.progress){MIDX.prog=d.progress;return;}if(d.error||d.key!==key){if(d.error){MIDX.failed=true;MIDX.busy=false;masterIndex();}return;}MIDX.key=key;MIDX.list=d.list;MIDX.busy=false;w.terminate();MIDX.worker=null;render();};
 w.onerror=()=>{MIDX.failed=true;MIDX.busy=false;try{w.terminate();}catch(e){}masterIndex();};
 w.postMessage({key,masters:MASTERS,proc,cust:CUST,nx:NXLIB,lots:LOTS,calOn:CAL.on,invcost:INVCOST});return null;}
/* distância entre receitas: composição (peso 0,6) + ingredientes em comum (peso 0,4) */
function recDist(a,b){const f=[['fat',8],['msnf',8],['swt',20],['sol',30],['pod',15],['fruit',40],['cocoa',8],['nut',8]];let d=0;f.forEach(([k,s])=>{const x=(a[k]-b[k])/s;d+=x*x;});d=Math.sqrt(d/f.length);
 const ks=new Set([...Object.keys(a.ids),...Object.keys(b.ids)]);let mn=0,mx=0;ks.forEach(k=>{mn+=Math.min(a.ids[k]||0,b.ids[k]||0);mx+=Math.max(a.ids[k]||0,b.ids[k]||0);});const jac=mx?mn/mx:0;
 return .6*Math.min(1,d)+.4*(1-jac);}
function similarTo(ref,idx,n=6,skip){return idx.map((x,k)=>({k,d:recDist(ref,x)})).filter(x=>x.k!==skip).sort((a,b)=>a.d-b.d).slice(0,n);}
function benchMetrics(){return recMetrics({tipo:S.tipo,vit:S.vit,recipe:S.recipe.map(r=>[r.id,+r.g])},S.proc);}
/* receitas comparáveis: m:índice (mestres), l:id (minhas), b (bancada) */
function cmpSrc(key){if(key==='b')return{name:'Bancada · '+(S.name||'atual'),tipo:S.tipo,vit:S.vit,recipe:S.recipe.map(r=>[r.id,+r.g])};const[t,v]=[key[0],key.slice(2)];
 if(t==='m'){const p=MASTERS[+v];return p&&{name:p.name+' · '+p.a,tipo:p.tipo,vit:p.vit,recipe:p.recipe};}
 const l=LIB.find(x=>String(x.id)===v);return l&&{name:l.name,tipo:l.st.tipo,vit:l.st.vit,recipe:l.st.recipe.map(r=>[r.id,+r.g])};}
function compareCard(){const C=(U.cmp||[]).map(k=>({k,s:cmpSrc(k)})).filter(x=>x.s);if(!C.length)return'';
 if(C.length<2)return`<div class="card flat"><div class="row"><span class="t2">Comparar: <b>${esc(C[0].s.name)}</b> · escolha a segunda receita (botão ⇄) ou</span><button class="btn sm" data-a="cmpToggle" data-v="b">usar a bancada</button><span class="sp"></span><button class="btn sm" data-a="cmpClear">Limpar</button></div></div>`;
 const M=C.map(x=>{const st={tipo:x.s.tipo,vit:x.s.vit,recipe:x.s.recipe.map(([id,g])=>({id,g})),proc:S.proc,brix:{},costs:{}};const mm=analyze(st);return{mm,sc:score(st,mm,diagnose(st,mm)).total};});
 const ids=[...new Set(C.flatMap(x=>x.s.recipe.map(r=>r[0])))];const per=(x,id,mm)=>{const g=x.s.recipe.filter(r=>r[0]===id).reduce((s,r)=>s+r[1],0);return g/(mm.tot||1)*1000;};
 const met=[['Índice',x=>x.sc,0],['Serviço ideal (°C)',x=>x.mm.serveT,1],['Sólidos (%)',x=>x.mm.sol,1],['Gordura (%)',x=>x.mm.fat,1],['MSNF (%)',x=>x.mm.msnf,1],['Doçura POD (%)',x=>x.mm.pod,1],['PAC (/kg)',x=>x.mm.pacKg,0],['Overrun (%)',x=>x.mm.ov,0],['Desestabilização (%)',x=>x.mm.destab,0]];
 return`<div class="card"><div class="row"><h2 style="margin:0">Lado a lado</h2><span class="sp"></span><button class="btn sm" data-a="cmpToLab">Levar ao Creator</button><button class="btn sm" data-a="cmpClear">Limpar</button></div>
  <div class="tw" style="margin-top:10px"><table class="tbl"><thead><tr><th>g por kg de mistura</th>${C.map(x=>`<th class="r">${esc(x.s.name)}</th>`).join('')}<th class="r">Diferença</th></tr></thead><tbody>
  ${ids.map(id=>{const a=per(C[0],id,M[0].mm),b=per(C[1],id,M[1].mm);return`<tr><td>${esc(ING_BY[id]?ING_BY[id].n:id)}</td><td class="r mono">${a?f0(a):'—'}</td><td class="r mono">${b?f0(b):'—'}</td><td class="r mono ${Math.abs(b-a)>=5?'c-ice':'muted'}">${b-a>=0?'+':''}${f0(b-a)}</td></tr>`;}).join('')}
  ${met.map(([n,fn,d])=>{const a=fn(M[0]),b=fn(M[1]);return`<tr><td class="t2">${n}</td><td class="r mono">${d?f1(a):f0(a)}</td><td class="r mono">${d?f1(b):f0(b)}</td><td class="r mono muted">${b-a>=0?'+':''}${d?f1(b-a):f0(b-a)}</td></tr>`;}).join('')}</tbody></table></div></div>`;}
function similarCard(idx){if(!U.simOf)return'';const ref=U.simOf==='b'?benchMetrics():idx&&idx[+U.simOf.slice(2)];if(!idx)return`<div class="card flat"><p class="note" style="margin:0">Calculando o índice dos ${MASTERS.length} mestres${MIDX.prog?' ('+MIDX.prog+')':''}…</p></div>`;if(!ref)return'';
 const L=similarTo(ref,idx,6,U.simOf==='b'?-1:+U.simOf.slice(2));const nm=U.simOf==='b'?'a bancada':MASTERS[+U.simOf.slice(2)].name;
 return`<div class="card"><div class="row"><h2 style="margin:0">Parecidas com ${esc(nm)}</h2><span class="sp"></span><button class="btn sm" data-a="simClose">Fechar</button></div>
  ${L.map(({k,d})=>{const p=MASTERS[k],x=idx[k];return`<div class="kv" style="align-items:center"><span><b style="color:var(--t1)">${esc(p.name)}</b> <span class="muted" style="font-size:12px">${esc(p.a)} · ${f0((1-d)*100)}% parecida · gordura ${f1(x.fat)}% · POD ${f1(x.pod)}% · serviço ${f1(x.serveT)} °C</span></span><span class="row" style="justify-content:flex-end"><button class="btn sm pri" data-a="master" data-v="${k}">Carregar</button><button class="btn sm" data-a="cmpToggle" data-v="m:${k}">⇄</button></span></div>`;}).join('')}</div>`;}
/* versões de uma receita salva */
function recDiff(a,b){const by=r=>{const o={};(r||[]).forEach(x=>o[x.id]=(o[x.id]||0)+ +x.g);return o;};const A=by(a),B=by(b);const ks=new Set([...Object.keys(A),...Object.keys(B)]);const out=[];
 ks.forEach(k=>{const d=(B[k]||0)-(A[k]||0);if(Math.abs(d)>=.05)out.push([k,A[k]||0,B[k]||0,d]);});return out;}
function histHTML(l){const H=l.hist||[];if(!H.length)return'<p class="note" style="margin:6px 0">Sem versões anteriores. Cada "Salvar" guarda a versão anterior aqui (até 30).</p>';
 return H.slice().reverse().map((h,ri)=>{const k=H.length-1-ri;const next=k+1<H.length?H[k+1].st:l.st;const df=recDiff(h.st.recipe,next.recipe);
  return`<div class="card flat" style="margin:6px 0;padding:10px 12px"><div class="row"><span class="mono" style="font-size:12px">${esc(h.date||'')}</span>${h.note?`<span class="t2" style="font-size:13px">${esc(h.note)}</span>`:''}<span class="sp"></span><button class="btn sm" data-a="histLoad" data-v="${l.id}|${k}">Abrir na bancada</button></div>
   <p class="note" style="margin:6px 0 0">${df.length?'Depois desta versão: '+df.map(([id,a,b,d])=>esc(ING_BY[id]?ING_BY[id].n:id)+' '+(a?f1(a):'0')+' → '+(b?f1(b):'0')+' g').join(' · '):'Nenhuma mudança de ingredientes (só processo ou nome).'}</p></div>`;}).join('');}


/* ---------- FRUTAS DA ESTAÇÃO ---------- */
function pgSazonal(){const mo=new Date().getMonth()+1;const sel=+U.sazM||mo;const L=SAZON.filter(([id])=>ING_BY[id]);
 const inS=L.filter(x=>x[1].includes(sel)),soon=L.filter(x=>!x[1].includes(sel)&&x[1].includes(sel%12+1));
 const card=([id,ms,bx])=>{const i=ING_BY[id];return`<div class="card flat"><div class="row"><h3 style="margin:0">${esc(i.n.replace(/ \(polpa\)/,''))}</h3><span class="sp"></span>${$cost(`<span class="chip">R$ ${f0(INVCOST[id]!=null?INVCOST[id]:i.cost||0)}/kg</span>`)}</div>
  <p class="note" style="margin:6px 0">Brix típico ${bx} °Bx${i.brix?' · banco usa '+i.brix:''} · safra ${ms.length===12?'o ano todo':ms.map(m=>MESES[m-1]).join(', ')}</p>
  ${PAIRS[id]?`<p class="note" style="margin:0 0 8px">Combina com ${PAIRS[id].slice(0,5).map(p=>esc(p[1])).join(', ')}</p>`:''}
  ${can.edit()?`<button class="btn sm" data-a="crAdd" data-v="${id}">Adicionar à bancada</button>`:''}</div>`;};
 return`<div class="pg"><div><h1>Frutas da estação</h1><p class="lead">Na safra a fruta chega mais madura, com Brix mais alto e preço menor. Calendário de referência do atacado de São Paulo; confirme com seu fornecedor e meça o Brix de cada lote.</p></div>
 <div class="chips">${MESES.map((n,k)=>`<button data-a="sazM" data-v="${k+1}" aria-pressed="${sel===k+1}">${n}${k+1===mo?' ·':''}</button>`).join('')}</div>
 <div class="card"><h2>Em safra em ${MESES[sel-1]} (${inS.length})</h2><div class="g3">${inS.map(card).join('')||'<p class="muted">—</p>'}</div></div>
 ${soon.length?`<div class="card"><h2>Chegando em ${MESES[sel%12]}</h2><div class="g3">${soon.map(card).join('')}</div></div>`:''}
 <div class="card"><h2>Calendário</h2><div class="tw"><table class="tbl"><thead><tr><th>Fruta</th>${MESES.map((n,k)=>`<th class="r" style="padding:4px;${k+1===sel?'color:var(--ice)':''}">${n}</th>`).join('')}<th class="r">°Bx</th></tr></thead><tbody>
  ${L.map(([id,ms,bx])=>`<tr><td>${esc(ING_BY[id].n.replace(/ \(polpa\)/,''))}</td>${MESES.map((n,k)=>`<td style="padding:3px"><div style="height:12px;border-radius:3px;background:${ms.includes(k+1)?'var(--ok)':'var(--line)'};opacity:${ms.includes(k+1)?(k+1===sel?1:.7):.5}"></div></td>`).join('')}<td class="r mono">${bx}</td></tr>`).join('')}</tbody></table></div>
  <p class="note">Fora da safra o preço no atacado costuma subir de 40% a 100% e a fruta chega com Brix mais baixo: aumente a dextrose ou use polpa congelada da safra.</p></div></div>`;}

/* ---------- AÇÕES, ENTRADAS E MUDANÇAS DESTE MÓDULO ---------- */
const V13_ACT={
 liveApply:()=>{const r=LIVE.res;if(!r||r==='pending'||!r.ok||LIVE.key!==liveKey())return;S.recipe=JSON.parse(JSON.stringify(r.newRecipe));U.bal=null;render();toast('Melhor balanceamento aplicado');},
 applyEquip:v=>{const E=EQUIP[v];if(!E)return;Object.assign(S.proc,E.proc);U.bal=null;render();toast('Conjunto aplicado: '+E.n);},
 compAdd:v=>{(S.comps=S.comps||[]).push({name:COMP_KINDS[v]||'Componente',kind:v,pct:10,recipe:v==='crocante'?[{id:'choc70',g:90},{id:'mcacau',g:10}]:v==='fruta'?[{id:'manga',g:100}]:[{id:'framboesa',g:60},{id:'sacarose',g:30},{id:'dextrose',g:10}],loss:v==='variegato'?10:0});if(S.page!=='componentes'){S.page='componentes';scrollTopAll();}render();},
 compRm:v=>{S.comps.splice(+v,1);render();},
 compIngAdd:v=>{S.comps[+v].recipe.push({id:'sacarose',g:10});render();},
 compIngRm:v=>{const[k,j]=v.split('|');S.comps[+k].recipe.splice(+j,1);render();},
 infToggle:v=>{const r=S.recipe.find(x=>x.id===v);if(!r)return;if(r.inf)delete r.inf;else r.inf=1;U.bal=null;render();toast(r.inf?'Infusionado e coado: só o que ele solta entra na mistura':'Volta a entrar inteiro na mistura');},
 meltTimer:v=>{if(U.melt&&U.melt.lot===v){U.melt=null;clearInterval(meltTick);render();return;}U.melt={lot:v,end:Date.now()+MELT_MS};clearInterval(meltTick);
  meltTick=setInterval(()=>{if(!U.melt){clearInterval(meltTick);return;}if(Date.now()>=U.melt.end){clearInterval(meltTick);U.melt=null;toast('10 minutos: pese o derretido');try{navigator.vibrate&&navigator.vibrate([300,150,300]);}catch(e){}}render();},1000);render();},
 panelStart:()=>{const P=panelState();if(P.lots.length<2)return;if(!Object.keys(P.codes).length||P.lots.some(id=>!P.codes[id])){const used=new Set();P.lots.forEach(id=>{let c;do{c=String(100+Math.floor(Math.random()*900));}while(used.has(c));used.add(c);P.codes[id]=c;});}
  P.order=shuffle(P.lots,Date.now()%233280);P.i=0;P.cur={};savePanel();render();},
 panelSet:v=>{const[k,x]=v.split('|');const P=panelState();P.cur[k]=+x;savePanel();render();},
 panelNext:()=>{const P=panelState();const L=LOTS.find(l=>l.id===P.order[P.i]);if(L){(L.panel=L.panel||[]).push(Object.assign({t:P.taster||'',code:P.codes[L.id],date:today()},P.cur));saveLot(L);}
  P.i++;P.cur={};if(P.i>=P.order.length){P.i=-1;P.taster='';toast('Avaliações salvas nos lotes');}savePanel();render();},
 panelCancel:()=>{const P=panelState();P.i=-1;P.cur={};savePanel();render();},
 panelReveal:()=>{const P=panelState();P.reveal=!P.reveal;savePanel();render();},
 panelReset:()=>{U.panel={lots:[],codes:{},order:[],taster:'',i:-1,cur:{},reveal:false};savePanel();render();},
 libTipo:v=>{U.libTipo=v;U.libN=0;render();},libVitF:v=>{U.libVitF=+v;U.libN=0;render();},
 simOpen:v=>{U.simOf=v;masterIndex();render();},simClose:()=>{U.simOf=null;render();},
 cmpToggle:v=>{const c=U.cmp=U.cmp||[];const i=c.indexOf(v);if(i>=0)c.splice(i,1);else{c.push(v);if(c.length>2)c.shift();}render();if(c.length===2)scrollTopAll();},
 cmpClear:()=>{U.cmp=[];render();},
 cmpToLab:()=>{(U.cmp||[]).map(cmpSrc).filter(Boolean).forEach(s=>addVariant(s.name.slice(0,40),recFromPairs(s.recipe)));U.cmp=[];S.page='creator';S.creatorTab='gelato';S.crSub='comparar';render();},
 histOpen:v=>{U.hist=U.hist===v?null:v;render();},
 histLoad:v=>{const[id,k]=v.split('|');const l=LIB.find(x=>String(x.id)===id);const h=l&&l.hist&&l.hist[+k];if(!h)return;Object.assign(S,JSON.parse(JSON.stringify(h.st)));S.name=l.name;S.proc=Object.assign({},PROC0,S.proc);S.libId=String(l.id);S.execId=null;S.page='bancada';U.bal=null;render();toast('Versão de '+(h.date||'')+' na bancada · salve para restaurar');},
 sazM:v=>{U.sazM=+v;render();}
};
const V13_INP={
 comp:(v,t)=>{const c=S.comps[+t.dataset.k];if(!c)return;const f=t.dataset.f;c[f]=f==='name'?v:num(v,0,60,0);render();},
 compG:(v,t)=>{const c=S.comps[+t.dataset.k];if(c&&c.recipe[+t.dataset.j]){c.recipe[+t.dataset.j].g=num(v,0,1e5,0);render();}},
 panelTaster:v=>{panelState().taster=v;savePanel();},
 panelNote:v=>{panelState().cur.note=v;savePanel();},
 saveNote:v=>{U.saveNote=v;}
};
const V13_CHG={
 equipSel:t=>{const E=EQUIP[t.value];if(E){Object.assign(S.proc,E.proc);U.bal=null;toast('Conjunto aplicado: '+E.n);}else S.proc.equip='';},
 comp:t=>{const c=S.comps[+t.dataset.k];if(c)c[t.dataset.f]=t.value;},
 compIng:t=>{const c=S.comps[+t.dataset.k];if(c&&c.recipe[+t.dataset.j])c.recipe[+t.dataset.j].id=t.value;},
 panelLot:t=>{const P=panelState();const id=t.dataset.k;P.lots=P.lots.filter(x=>x!==id);if(t.checked&&P.lots.length<6)P.lots.push(id);P.codes={};savePanel();},
 libTipoSel:t=>{U.libTipo=t.value;U.libN=0;}
};

/* ---------- DO FREEZER AO POTE: curva de aquecimento e quando servir ---------- */
function poteCard(m,compact){if(m.empty)return'';const P=poteModel(m,S.proc);if(!P)return'';const wait=+S.proc.waitMin||0;
 const ready=P.tReady;const tMax=Math.max(20,Math.min(60,Math.ceil(((ready==null?40:ready)+6)/5)*5,Math.ceil((wait+6)/5)*5));
 const W=640,H=compact?170:220,L=40,R=14,Tp=14,B=28;const lo=Math.floor(Math.min(P.T0,m.serveT-2)-1),hi=Math.ceil(Math.max(m.serveT+2,Math.min(0,P.at(tMax).surf))+1);
 const sx=t=>L+t/tMax*(W-L-R),sy=T=>Tp+(hi-T)/(hi-lo)*(H-Tp-B);let g='';
 for(let T=Math.ceil(lo/2)*2;T<=hi;T+=2)g+=`<line x1="${L}" x2="${W-R}" y1="${sy(T)}" y2="${sy(T)}" stroke="var(--line)"/><text x="${L-6}" y="${sy(T)+4}" text-anchor="end" fill="var(--t3)" font-size="10">${T}°</text>`;
 for(let t=0;t<=tMax;t+=5)g+=`<text x="${sx(t)}" y="${H-8}" text-anchor="middle" fill="var(--t3)" font-size="10">${t} min</text>`;
 const sr=m.serveRange;g+=`<rect x="${L}" y="${sy(sr[0])}" width="${W-L-R}" height="${Math.max(2,sy(sr[1])-sy(sr[0]))}" fill="rgba(110,231,183,.12)"/>`;
 const line=(k,col,wd,dash)=>`<path d="${P.curve.filter(c=>c.t<=tMax).map((c,i)=>(i?'L':'M')+sx(c.t).toFixed(1)+','+sy(c[k]).toFixed(1)).join('')}" fill="none" stroke="${col}" stroke-width="${wd}"${dash?` stroke-dasharray="${dash}"`:''}/>`;
 g+=line('surf','var(--gold)',1.4,'2 3')+line('core','var(--info)',1.6,'5 4')+line('scoop','var(--ice)',2.6);
 g+=`<line x1="${sx(wait)}" x2="${sx(wait)}" y1="${Tp}" y2="${H-B}" stroke="var(--t2)" stroke-dasharray="3 3"/><text x="${sx(wait)+5}" y="${Tp+10}" fill="var(--t2)" font-size="10">espera ${wait} min</text>`;
 if(ready!=null&&ready<=tMax)g+=`<circle cx="${sx(ready)}" cy="${sy(m.serveT)}" r="5" fill="var(--ok)"/>`;
 const aw=P.atWait,dev=aw.scoop-m.serveT,stc=Math.abs(dev)<=1.5?'c-ok':Math.abs(dev)<=3?'c-warn':'c-crit';
 return`<div class="card"><div class="row"><h2 style="margin:0">Do freezer ao pote</h2><span class="sp"></span>${can.edit()?`<button class="btn sm pri" data-a="palBal">Balancear para ${f0(wait)} min</button>`:''}</div>
  <div class="row" style="gap:22px;margin:8px 0 6px;align-items:flex-end">
   <div><div class="lbl">Pronto para servir</div><div class="big ${ready==null?'c-crit':'c-ok'}">${ready==null?'40+':f0(ready)}<small class="muted" style="font-size:14px"> min</small></div></div>
   <div><div class="lbl">Na colher após ${f0(wait)} min</div><div class="big ${stc}">${f1(aw.scoop)}<small class="muted" style="font-size:14px"> °C</small></div></div>
   ${compact?'':`<div><div class="lbl">Centro / superfície</div><div class="big" style="font-size:22px">${f1(aw.core)} / ${f1(aw.surf)}<small class="muted" style="font-size:13px"> °C</small></div></div>`}
   <div class="note" style="flex:1;min-width:200px;margin:0">Pote de ${f0(+S.proc.poteMl)} mL a ${fT(+S.proc.storeT)} °C numa cozinha a ${fT(+S.proc.ambT)} °C. Ideal desta receita: ${f1(m.serveT)} °C na camada de onde a colher tira (1,5 cm de fora).</div></div>
  <div class="tw"><svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:420px;height:auto" role="img" aria-label="Aquecimento do pote fora do freezer">${g}</svg></div>
  <div class="row note" style="gap:14px;margin-top:4px"><span><span class="c-ice">━</span> camada de servir</span><span><span class="c-info">┅</span> centro</span><span><span class="c-gold">┄</span> superfície</span><span><span class="c-ok">■</span> faixa de serviço</span></div>
  ${compact?'':`<p class="note">Calor entra pela superfície e o gelo absorve 334 J/g ao amolecer, por isso o centro demora muito mais. Pote maior, freezer mais frio ou cozinha fria aumentam a espera. Para servir em menos tempo sem mudar o freezer, balanceie para a espera desejada: o motor sobe a dextrose e ajusta a sacarose para manter a doçura.</p>`}</div>`;}

/* ---------- CONJUNTO DE EQUIPAMENTOS: roteiro calculado para casa (Maestro Gelatiere + freezer Panasonic) ---------- */
function equipYield(m,batch){const ml=batch/(m.gPerL||800)*1000;return Math.round(ml/10)*10;}
function equipSteps(m){const E=EQUIP[S.proc.equip];if(!E||m.empty)return null;const p=m.pr,batch=+p.load||E.batch||1100;const MP=maqPlan(m,p);
 const P=poteModel(m,p),H=hardenModel(m,p),H1=hardenModel(m,p,1000),Hs=hardenModel(m,p,250);const hr=x=>x==null?'—':f1(x/60)+' h';
 const yl=equipYield(m,batch),npot=Math.max(1,Math.round(yl/(+p.poteMl||500)));
 return[
  ['Aquecer e pasteurizar',`Misture os pós a seco e adicione aos líquidos a 40 °C. Leve a ${fT(p.pastT)} °C por ${fT(p.pastHold)} ${p.pastHoldU==='min'?'min':'s'}${m.A.eggFresh>0?' (gema fresca: 82–85 °C, ponto de nappe)':''}.`],
  ['Esfriar rápido',`Panela em banho de água com gelo, mexendo, até ficar abaixo de 10 °C (meta: 4 °C em até ${fT(p.coolMin)} min). Calda quente na geladeira esquenta tudo à volta e demora horas para esfriar.`],
  ['Maturar na geladeira Panasonic',`Pote fechado, ao fundo e longe da porta, com o refrigerador em <b>Máx</b> durante a maturação. Confira com termômetro: a calda deve ficar entre 2 e 4 °C (alvo ${fT(p.matT)} °C). Tempo: <b>${fT(p.matH)} h</b> (mínimo 6 h; até 72 h). Volte o refrigerador para Méd depois.`],
  ['Preparar o freezer',`30 min antes de mantecar, ative o <b>Turbo</b> do freezer (aperte o botão do freezer até acenderem os três indicadores; ele dura 150 min e volta sozinho ao normal). Ponha ${npot>1?npot+' potes':'o pote'} de ${f0(+p.poteMl)} mL vazio${npot>1?'s':''} para gelar.`],
  ['Mantecar na Maestro Gelatiere',`${+p.preChill?'Ligue o batedor e a refrigeração com a cuba vazia e tampada por 5–8 min (pré-resfriamento; confirme com a Maqp1 se o seu modelo permite).':'Como no manual: ligue o batedor <b>antes</b> de pôr a calda e só depois a refrigeração.'} Coloque <b>${f0(batch)} g</b> de calda <b>direto da geladeira (2–4 °C)</b> (entre ¼ e ⅔ do tanque de 3 L), tampa fechada, por cerca de <b>${fT(p.drawMin)} min</b>, até <b>${fT(p.drawT)} °C no centro da massa</b> (termômetro culinário, não o da máquina)${MP&&p.drawT>MP.t35+.2?'; se a máquina continuar descendo, vale ir até '+f1(MP.t35)+' °C (35% da água em gelo nesta receita)':''}. Rende cerca de ${f0(yl)} mL com ${f0(m.ov)}% de ar.${m.ov>30?' Com mais de 30% de ar o manual pede menos calda: use '+f0(Math.round(batch*1.30/(1+m.ov/100)/10)*10)+' g.':''} Não desligue o batedor com produto na cuba; se desligar, espere 10 min para religar.`],
  ['Envasar',`Rápido, nos potes gelados, sem bolhas; filme encostado na superfície e tampa. ${+p.poteMl>500?'Potes menores endurecem bem mais rápido.':''}`],
  ['Endurecer no freezer',`Na parte de baixo, sem empilhar e longe da porta. A camada de servir firma em ${H&&H.tFirm!=null?f0(H.tFirm)+' min':'—'}; o centro chega a ${fT(H?H.target:-18)} °C em <b>${hr(H&&H.tDone)}</b> (pote de 250 mL: ${hr(Hs&&Hs.tDone)}; de 1 L: ${hr(H1&&H1.tDone)}). Depois do Turbo, freezer em <b>Médio</b> (−17 a −22 °C).`],
  ['Servir',P?`Tire o pote e espere <b>${f0(+p.waitMin)} min</b> numa cozinha a ${fT(+p.ambT)} °C: a camada da colher chega a ${f1(P.atWait.scoop)} °C (ideal desta receita: ${f1(m.serveT)} °C${P.tReady!=null?'; no ponto em '+f0(P.tReady)+' min':''}). Volte o pote ao freezer logo depois.`:'—']];}
function equipCard(m){const cur=S.proc.equip||'';const E=EQUIP[cur];
 return`<div class="card"><div class="row"><h2 style="margin:0">Conjunto de equipamentos</h2><span class="sp"></span>
  <select id="equipSel" data-c="equipSel" style="max-width:340px" aria-label="Conjunto de equipamentos"><option value=""${cur?'':' selected'}>Personalizado (ajuste cada campo)</option>${Object.entries(EQUIP).map(([k,e])=>`<option value="${k}"${k===cur?' selected':''}>${esc(e.n)}</option>`).join('')}</select></div>
  ${E?`<p class="note" style="margin:10px 0 4px">${esc(E.machine)}.<br>${esc(E.fridge)}.</p>
  <div class="row" style="margin-top:8px">${can.edit()?`<button class="btn sm pri" data-a="palBal">Balancear para este conjunto</button>`:''}<button class="btn sm" data-a="go" data-v="producao">Abrir roteiro na ficha</button></div>`
  :`<p class="note" style="margin:10px 0 0">Escolha um conjunto para preencher maturação, mantecação, endurecimento, freezer e serviço de uma vez, com o roteiro calculado para a receita.</p>`}</div>
 ${E&&!m.empty?`<div class="card"><h2>Roteiro desta receita</h2><ol class="steps">${equipSteps(m).map(([t,x])=>`<li><span><b style="color:var(--t1)">${t}.</b> ${x}</span></li>`).join('')}</ol>
  <p class="note">Temperaturas do freezer Panasonic são faixas do fabricante; meça a sua com um termômetro num copo de água com sal deixado 12 h no freezer e ajuste o campo Freezer. O app recalcula tudo.</p></div>`:''}`;}

/* ---------- MELHOR BALANCEAMENTO AO VIVO ----------
   Recalcula a proposta de açúcares meio segundo depois da última mudança (sem pesar na digitação) para o modo atual:
   vitrine, freezer ou em casa (espera no pote). */
const LIVE={key:null,res:null,pending:null,t:0};
function liveKey(){try{return JSON.stringify([S.tipo,S.vit,S.recipe,S.proc,S.brix,S.comps||[],!!S.compBal,can.cost()?+S.costCap||0:0,S.costs||{},CAL.on?CAL.ver:-1,ING_VER,S.dexForm]);}catch(e){return null;}}
function liveRun(){try{let st=can.cost()&&+S.costCap>0?{...S,costCap:+S.costCap}:S;if(S.compBal&&S.proc.serveFrom!=='pote'){const R=compServe(analyze(S));if(R&&Math.abs(R.d)>=.1){st={...st,vit:Math.round((+S.vit-R.d)*10)/10};const r=balanceBest(st);if(r)r.compShift=R.d;return r;}}return balanceBest(st);}catch(e){return{ok:false,msg:'Não foi possível calcular agora.'};}}
function liveBalance(){if(!(S.recipe||[]).length)return null;const key=liveKey();if(!key)return null;
 if(LIVE.key===key)return LIVE.res;
 if(typeof requestAnimationFrame!=='function'){LIVE.res=liveRun();LIVE.key=key;return LIVE.res;}
 if(LIVE.pending!==key){LIVE.pending=key;clearTimeout(LIVE.t);LIVE.t=setTimeout(()=>{if(LIVE.pending!==key||liveKey()!==key)return;LIVE.res=liveRun();LIVE.key=key;LIVE.pending=null;render();},450);}
 return'pending';}
function liveBalCard(m){if(m.empty||!can.edit())return'';const r=liveBalance();if(!r)return'';const pote=S.proc.serveFrom==='pote';
 const alvo=pote?'servir em '+f0(+S.proc.waitMin)+' min fora do freezer':S.proc.serveFrom==='freezer'?'servir a '+fT(S.vit)+' °C direto do freezer':'a vitrine a '+fT(S.vit)+' °C';
 if(r==='pending')return`<div class="card"><h2>Melhor balanceamento agora</h2><p class="note" style="margin:0">Calculando para ${alvo}…</p></div>`;
 if(!r.ok)return`<div class="card"><h2>Melhor balanceamento agora</h2><p class="c-warn" style="margin:0;font-size:13.5px">${esc(r.msg)}</p></div>`;
 const ch=r.prop.map((p,k)=>({id:p.id,a:r.cur[k],b:p.g})).filter(x=>Math.abs(x.b-x.a)>=1);const m1=r.m1;
 const capRow=(m1x)=>$cost(`<div class="row" style="gap:8px;margin-top:10px;font-size:13px;align-items:center"><span class="muted">Teto de custo</span><input type="number" inputmode="decimal" id="costCap" data-i="costCap" value="${+S.costCap>0?esc(String(S.costCap)):''}" placeholder="R$/kg" min="0" step="0.5" style="width:96px"><span class="muted">R$/kg · hoje R$ ${f2(m.costKg||0)}${m1x?' → R$ '+f2(m1x.costKg||0):''}${+S.costCap>0&&m1x&&m1x.costKg>+S.costCap*1.005?' <span class="c-warn">(acima do teto: não há combinação de açúcares que caiba sem piorar a receita)</span>':''}</span></div>`);
 if(!ch.length)return`<div class="card"><h2>Melhor balanceamento agora</h2><p class="c-ok" style="margin:0">Os açúcares já estão no melhor ponto para ${alvo}${+S.costCap>0?' dentro do teto de custo':''}.</p>${capRow(null)}</div>`;
 return`<div class="card"><div class="row"><h2 style="margin:0">Melhor balanceamento agora</h2><span class="sp"></span><button class="btn sm okb" data-a="liveApply">Aplicar</button></div>
  <p class="note" style="margin:6px 0 8px">Para ${alvo}${r.compShift!=null?' com o produto montado (componentes: base mira '+fT(Math.round((+S.vit-r.compShift)*10)/10)+' °C)':''}, mantendo o resto da receita:</p>
  ${ch.map(x=>`<div class="kv"><span>${esc(ING_BY[x.id]?ING_BY[x.id].n:x.id)}</span><span>${f0(x.a)} → <b class="c-ice">${f0(x.b)} g</b> <span class="muted">(${x.b-x.a>=0?'+':''}${f0(x.b-x.a)})</span></span></div>`).join('')}
  <p class="note" style="margin:8px 0 0">Resultado: ${f0(m1.fzVit)}% congelada · doçura ${f1(m1.pod)}% · sólidos ${f1(m1.sol)}%${pote&&r.poteVit!=null?' · colher a '+f1(r.poteVit)+' °C':''}.${r.note?' '+esc(r.note):''}</p>${capRow(m1)}</div>`;}

