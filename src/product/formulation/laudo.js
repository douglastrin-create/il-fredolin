/* laudo e índice ficam guardados no próprio resultado da análise (que já é memorizado pelo conteúdo da receita) */
function diagnose(st,m){return m._F||(m._F=Object.freeze(diagnoseCore(st,m)));}
function diagnoseCore(st,m){
 const F=[],P=m.P,pr=m.pr,T=m.tot;
 const add=(sev,area,title,why,fix)=>F.push({sev,area,title,why,fix});
 if(m.empty)return F;
 /* ---- 1. Equilíbrio térmico ---- */
 const dz=m.fzVit-m.fzMid;
 if(m.wat<20){add('crit','Térmico','Receita com pouca água','Com '+f1(m.wat)+'% de água a mistura não forma estrutura de gelato.','Adicione a base líquida (leite, água ou polpa) antes de avaliar o restante.');}
 else if(Math.abs(dz)<=3){add('ok','Térmico','Equilíbrio de congelamento correto','A '+fT(m.vit)+' °C, '+f0(m.fzVit)+'% da água está congelada (alvo '+fRg(P.fz)+'%). Textura espatulável, que se serve com bola ou espátula sem quebrar.','');}
 else{
  const hard=dz>0;const dAbs=m.dPacAbs;
  /* PAC é g×coeficiente/100. A dextrose usada é a que já está na receita; se não houver, a forma preferida (S.dexForm:
     monoidratada por padrão, a do mercado; 91% de glicose → PAC 173/g; anidra 99,5% → 189/g). Trocar 1 g de sacarose por
     dextrose soma (k−1); acrescentar soma k; trocar 1 g de sacarose por maltodextrina DE 19 (≈36) tira 0,64.
     As gramagens são calculadas uma vez (com o ajuste fino do modo pote) e o texto e os botões saem dos mesmos números. */
  const gfmt=x=>x<1?'menos de 1':f0(Math.max(1,x));
  const suc=findInRecipe(st,['sacarose']),dex=findInRecipe(st,['dextrose','dextrosem']);
  const did=dex?dex.id:(DEX_FORM()==='anid'?'dextrose':'dextrosem');const kD=((ING_BY[did]&&ING_BY[did].c.glu)||99.5)/100*1.9;
  const dName=did==='dextrosem'?'dextrose monoidratada':'dextrose anidra';
  const A0=Math.abs(dAbs),swapDex=A0/(kD-1),addDex=A0/kD,swapMalto=A0/.64,sid=suc?suc.id:'sacarose';
  const acts=[];const r1=x=>Math.round(x*10)/10;
  if(hard){const sg=suc?+suc.g:0;
   if(sg>=swapDex)acts.push({k:'swapSD',ops:[[sid,-r1(swapDex)],[did,r1(swapDex)]]});
   else if(sg>0){const rest=(A0-sg*(kD-1))/kD;acts.push({k:'allSD',rest,ops:[[sid,-sg],[did,r1(sg+rest)]]});}
   acts.push({k:'addD',ops:[[did,r1(addDex)]]});}
  else{const dg=dex?+dex.g:0;
   if(dex&&dg>=swapDex)acts.push({k:'swapDS',ops:[[dex.id,-r1(swapDex)],[sid,r1(swapDex)]]});
   else if(dex&&dg>0&&(A0-dg*(kD-1))/.64<=(suc?+suc.g:0)+dg){const rest=(A0-dg*(kD-1))/.64;acts.push({k:'allDSM',rest,ops:[[dex.id,-dg],[sid,r1(dg-rest)],['malto',r1(rest)]]});}
   if(suc&&+suc.g>=swapMalto)acts.push({k:'swapSM',ops:[[suc.id,-r1(swapMalto)],['malto',r1(swapMalto)]]});}
  /* modo pote: cada ação muda a curva de aquecimento; ajusta a gramagem até a colher ficar no ponto de verdade */
  let poteTxt=null;
  if(m.pr.serveFrom==='pote'){acts.forEach(ac=>{
    /* mk(k) monta as operações com a parte variável multiplicada por k */
    const o0=ac.ops.map(o=>o.slice());let mk;
    if(ac.k==='allSD'){const sg=-o0[0][1];mk=k=>[[o0[0][0],-sg],[o0[1][0],r1(sg+ac.rest*k)]];}
    else if(ac.k==='allDSM'){const dg=-o0[0][1];mk=k=>[[o0[0][0],-dg],[o0[1][0],r1(dg-ac.rest*k)],['malto',r1(ac.rest*k)]];}
    else{const mags=o0.map(o=>Math.abs(o[1]));if(!(o0.length===1||(o0.length===2&&Math.abs(mags[0]-mags[1])<.05)))return;mk=k=>o0.map(([id,d])=>[id,Math.sign(d)*Math.round(mags[0]*k*10)/10]);}
    const lim=ac.k==='allSD'?Infinity:ac.k==='allDSM'?(dex?+dex.g:0)/ac.rest:ac.k==='swapSD'||ac.k==='swapSM'?(suc?+suc.g:0)/Math.abs(o0[0][1]):ac.k==='swapDS'?(dex?+dex.g:0)/Math.abs(o0[0][1]):Infinity;
    const errAt=k=>{const rec=(st.recipe||[]).map(r=>({...r}));mk(k).forEach(([id,d])=>{const r=rec.find(x=>x.id===id);if(r)r.g=Math.max(0,+r.g+d);else if(d>0)rec.push({id,g:d});});const s2=stReal({...st,recipe:rec});const mm=analyze(s2);return mm.fzVit-mm.fzMid;};
    let k0=1,e0=errAt(1);if(Math.abs(e0)<.15)return;let k1=Math.min(1.15,lim),e1=errAt(k1);
    for(let i=0;i<5&&Math.abs(e1)>.15&&Math.abs(e1-e0)>1e-6;i++){const k2=clamp(k1-e1*(k1-k0)/(e1-e0),.3,Math.min(3,lim));k0=k1;e0=e1;k1=k2;e1=errAt(k1);}
    if(Math.abs(e1)<Math.abs(errAt(1))){ac.ops=mk(k1);if(ac.rest!=null)ac.rest=ac.rest*k1;}});
   const pt=poteModel(m,m.pr);if(pt){const tw=pt.timeTo(m.serveT);poteTxt=tw==null?' Sem mexer na receita, ela não chega ao ponto em 40 min fora do freezer.':' Sem mexer na receita: '+(hard?'espere ':'sirva com ')+f0(tw)+' min fora do freezer.';}}
  /* texto e títulos a partir das gramagens finais */
  const gOf=ac=>Math.abs(ac.ops[0][1]);const mono=did==='dextrosem';
  const desc=ac=>ac.k==='swapSD'?'troque '+gfmt(gOf(ac))+' g de sacarose pelo mesmo peso de '+dName+(mono?' (quase os mesmos sólidos; reduz um pouco a doçura)':' (mantém os sólidos, reduz um pouco a doçura)')
   :ac.k==='allSD'?'troque toda a sacarose ('+f0(gOf(ac))+' g) por '+dName+' e acrescente mais '+gfmt(ac.rest)+' g'
   :ac.k==='addD'?'acrescente '+gfmt(gOf(ac))+' g de '+dName+' (sobe sólidos e doçura)'
   :ac.k==='swapDS'?'troque '+gfmt(gOf(ac))+' g de '+dName+' por sacarose'
   :ac.k==='allDSM'?'troque toda a '+dName+' ('+f0(gOf(ac))+' g) por sacarose e mais '+gfmt(ac.rest)+' g de sacarose por maltodextrina DE 19'
   :'troque '+gfmt(gOf(ac))+' g de sacarose por maltodextrina DE 19 (mantém sólidos e corpo, reduz doçura)';
  const dShort=mono?'dextrose mono':'dextrose anidra';
  acts.forEach(ac=>{ac.t=ac.k==='swapSD'?'Trocar '+gfmt(gOf(ac))+' g de sacarose por '+dShort:ac.k==='allSD'?'Trocar toda a sacarose por '+dShort+' (+'+gfmt(ac.rest)+' g)':ac.k==='addD'?'Acrescentar '+gfmt(gOf(ac))+' g de '+dShort
   :ac.k==='swapDS'?'Trocar '+gfmt(gOf(ac))+' g de '+dName+' por sacarose':ac.k==='allDSM'?'Trocar a '+dName+' por sacarose e '+gfmt(ac.rest)+' g de sacarose por maltodextrina':'Trocar '+gfmt(gOf(ac))+' g de sacarose por maltodextrina';});
  let fix;
  if(hard)fix='Faltam ≈ '+f0(Math.abs(m.dPacKg))+' de PAC por kg ('+f0(A0)+' no lote de '+f0(T)+' g). Opções: '+(acts.length?acts.map(desc).join('; ou '):'não há sacarose para trocar')+'.'+(poteTxt||' Para servir sem mexer na receita, use a vitrine a '+f1(m.serveT)+' °C.');
  else fix='Sobram ≈ '+f0(Math.abs(m.dPacKg))+' de PAC por kg ('+f0(A0)+' no lote de '+f0(T)+' g). Opções: '+(acts.length?acts.map(desc).join('; ou '):'reduza os açúcares ou a parte que mais baixa o congelamento (álcool, sal, frutose)')+'.'+(poteTxt||' Ou sirva mais frio: '+f1(m.serveT)+' °C.');
  /* escolha da forma: aparece sempre que a solução mexe em dextrose; se a receita usa a forma diferente da sua, oferece converter
     (mesma glicose: g × glicose_de / glicose_para; o PAC não muda, só entra um pouco mais de água) */
  const pf=DEX_FORM()==='anid'?'dextrose':'dextrosem';
  const dexPick=acts.some(ac=>ac.ops.some(o=>o[0]===did))?{pref:pf,conv:dex&&dex.id!==pf&&ING_BY[pf]?{from:dex.id,to:pf,g:+dex.g,g2:Math.round(+dex.g*ING_BY[dex.id].c.glu/ING_BY[pf].c.glu*10)/10}:null}:null;
  if(m.alc>2&&!hard)fix+=' O álcool ('+f1(m.alc)+'%) é o principal responsável — reduza a dose ou adicione no momento de servir.';
  add(Math.abs(dz)>8?'crit':'warn','Térmico',(m.pr.serveFrom==='pote'?(hard?'Gelato duro na hora de servir':'Gelato mole na hora de servir'):hard?'Gelato duro na vitrine':'Gelato mole na vitrine'),(m.pr.serveFrom==='pote'?'Depois de '+fT(+m.pr.waitMin)+' min fora do freezer a colher pega o gelato a ':'A ')+fT(m.vit)+' °C, '+f1(m.fzVit)+'% da água congela (alvo '+fRg(P.fz)+'%). '+(hard?'Fica duro, difícil de espatular, e o sabor aparece menos.':'Escorre na espátula, perde forma e derrete rápido na casquinha.'),fix);F[F.length-1].acts=acts;if(dexPick)F[F.length-1].dexPick=dexPick;
 }
 if(m.hfKg>25){add(m.hfKg>110?'warn':'info','Térmico','Fator de dureza (HF) de '+f0(m.hfKg)+' por kg','Manteiga de cacau, sólidos de cacau e gordura de oleaginosas endurecem o gelato além do que o PAC indica. O motor já desconta esse efeito: PAC efetivo '+f0(m.pacEffKg)+' por kg.','Compense com açúcares de PAC alto (dextrose, invertido) — o cálculo térmico acima já inclui o HF.');}
 /* ---- 2. Doçura ---- */
 if(m.pod<P.pod[0]-.5)add(m.pod<P.pod[0]-3?'warn':'info','Doçura','Doçura baixa (POD '+f1(m.pod)+'%)','Abaixo do alvo de '+fRg(P.pod)+'%. O frio reduz a percepção de doce; o sabor fica apagado.','Troque parte da dextrose por sacarose ou adicione um pouco de sacarose; o balanceador calcula a combinação exata sem desequilibrar o congelamento.');
 else if(m.pod>P.pod[1]+.5)add(m.pod>P.pod[1]+3?'warn':'info','Doçura','Doçura alta (POD '+f1(m.pod)+'%)','Acima do alvo de '+fRg(P.pod)+'%. Doçura em excesso cansa o paladar e mascara o ingrediente principal.','Substitua parte da sacarose por dextrose (menos doce, mesmo efeito anticongelante) ou por maltodextrina DE 19 (quase sem doçura). Use o balanceador.');
 else add('ok','Doçura','Doçura no ponto (POD '+f1(m.pod)+'%)','Dentro de '+fRg(P.pod)+'% para '+P.n.toLowerCase()+'.','');
 if(m.dexShare>45)add('warn','Doçura','Dextrose domina os açúcares ('+f0(m.dexShare)+'%)','Muita dextrose deixa o gelato pegajoso, com doçura curta e textura que "afunda" na vitrine.','Referência prática (não é limite de norma): manter a dextrose em até ~35–40% dos açúcares. Para completar o PAC, açúcar invertido; para baixar doçura sem perder corpo, trealose ou maltodextrina.');
 if(m.fruShare>25)add('warn','Doçura','Frutose acima de 25% dos açúcares','A frutose tem doçura forte e PAC alto; em excesso o gelato fica mole e com doçura enjoativa.','Troque parte da frutose por sacarose.');
 /* ---- 3. Sólidos ---- */
 if(m.sol<P.sol[0])add(m.sol<P.sol[0]-4?'crit':'warn','Sólidos','Sólidos totais baixos ('+f1(m.sol)+'%)','Alvo '+fRg(P.sol)+'%. Água livre em excesso forma cristais grandes: textura gelada e granulosa.',tbase(st.tipo)==='sorbetto'?'Aumente a fruta, troque parte da água por polpa ou adicione '+gq((P.sol[0]-m.sol)/100*T*1.1)+' g de maltodextrina/inulina.':'Adicione '+gq((P.sol[0]-m.sol)/100*T*1.08)+' g de leite em pó desnatado (se a lactose permitir) ou maltodextrina DE 19.');
 else if(m.sol>P.sol[1])add(m.sol>P.sol[1]+3?'crit':'warn','Sólidos','Sólidos totais altos ('+f1(m.sol)+'%)','Alvo '+fRg(P.sol)+'%. Fica pesado, pastoso, gruda no palato e pode cristalizar lactose.','Substitua '+gq((m.sol-P.sol[1])/100*T*1.1)+' g de sólidos (pó, açúcar ou pasta) por líquido da base.');
 else add('ok','Sólidos','Sólidos totais equilibrados ('+f1(m.sol)+'%)','Na faixa '+fRg(P.sol)+'%: corpo, cremosidade e cristais pequenos.','');
 /* ---- 4. Estrutura ---- */
 if(tbase(st.tipo)!=='sorbetto'){
  if(m.fat<P.fat[0])add('warn','Estrutura','Gordura baixa ('+f1(m.fat)+'%)','Alvo '+fRg(P.fat)+'%. Menos gordura = menos cremosidade, menos corpo e derretimento aquoso.',tbase(st.tipo)==='vegan'?'Use creme de coco ou pasta de oleaginosa.':'Troque '+gq((P.fat[0]+.5-m.fat)/100*T/.315)+' g de leite integral por creme 35%.');
  else if(m.fat>P.fat[1])add(m.fat>P.fat[1]+3?'crit':'warn','Estrutura','Gordura alta ('+f1(m.fat)+'%)','Alvo '+fRg(P.fat)+'%. Excesso de gordura mascara o sabor, satura o paladar e pode amanteigar na mantecação.','Troque '+gq((m.fat-P.fat[1]+.5)/100*T/.315)+' g de creme 35% por leite integral'+(m.hasEmul?'':', e use emulsificante (gema ou lecitina) para estabilizar a emulsão')+'.');
  else add('ok','Estrutura','Gordura adequada ('+f1(m.fat)+'%)','Dentro de '+fRg(P.fat)+'%.','');
  if(m.prot<P.prot[0]-.3)add('info','Estrutura','Proteína baixa ('+f1(m.prot)+'%)','As proteínas seguram ar e água; abaixo de '+fT(P.prot[0])+'% o gelato fica com menos corpo e menor overrun.',tbase(st.tipo)==='vegan'?'Adicione 1–2% de proteína de ervilha ou use bebida de soja.':'Adicione leite em pó desnatado ou WPC 80.');
  if(m.prot>P.prot[1]+1)add('warn','Estrutura','Proteína alta ('+f1(m.prot)+'%)','Excesso de proteína deixa textura borrachuda e sabor de leite cozido.','Reduza leite em pó / WPC.');
 }else{
  if(m.fat>1)add('info','Estrutura','Gordura em sorbetto ('+f1(m.fat)+'%)','Vem da fruta ou de oleaginosas; tudo bem se for intencional.','');
  if(m.msnf>.5)add('warn','Ingredientes','Lácteos em sorbetto','Há '+f1(m.msnf)+'% de sólidos lácteos: o produto deixa de ser sorbetto e passa a declarar leite.','Mude o tipo para Frutta ou remova os lácteos.');
 }
 /* ---- 5. Lactose / arenosidade ---- */
 if(m.lac>0){
  if(m.lacW>10.5)add('crit','Lactose','Risco alto de arenosidade (lactose '+f1(m.lacW)+'% da água)','Acima de ~10% a lactose supersatura na água não congelada e cristaliza com o tempo: grãos que não derretem na língua.','Reduza '+f0((m.lacW-9)/100*m.A.w/.525)+' g de leite em pó desnatado e substitua por maltodextrina DE 19 ou proteína do soro WPC.');
  else if(m.lacW>9)add('warn','Lactose','Lactose no limite ('+f1(m.lacW)+'% da água)','Entre 9 e 10,5% o risco aparece em armazenamento longo ou com variações de temperatura.','Produza para venda em até 3 dias ou reduza um pouco o leite em pó.');
  else add('ok','Lactose','Lactose segura ('+f1(m.lacW)+'% da água)','Abaixo de 9%: sem risco de arenosidade.','');
  if(tbase(st.tipo)==='crema'||tbase(st.tipo)==='frutta'||tbase(st.tipo)==='gastro'){
   if(m.msnf<P.msnf[0])add('info','Lactose','MSNF baixo ('+f1(m.msnf)+'%)','Alvo '+fRg(P.msnf)+'%. Os sólidos do leite dão corpo e sabor lácteo.',m.lacW<8?'Adicione '+gq((P.msnf[0]-m.msnf)/100*T/.94)+' g de leite em pó desnatado.':'A lactose já está alta; aumente MSNF com WPC 80.');
   else if(m.msnf>P.msnf[1])add('warn','Lactose','MSNF alto ('+f1(m.msnf)+'%)','Acima de '+fT(P.msnf[1])+'% o sabor fica de leite em pó e o risco de arenosidade cresce.','Reduza o leite em pó.');
  }
 }
 if(tbase(st.tipo)==='vegan'&&m.A.al.has('leite'))add('crit','Ingredientes','Ingrediente de origem láctea em receita vegana','A receita contém leite ou derivado.','Remova os lácteos ou mude o tipo.');
 if(tbase(st.tipo)==='vegan'&&m.A.animal)add('crit','Ingredientes','Gelatina animal em receita vegana','O estabilizante contém gelatina.','Troque por um neutro vegetal (jataí, guar, tara, fibra de citros).');
 if(tbase(st.tipo)==='vegan'&&m.A.al.has('ovo'))add('crit','Ingredientes','Ovo em receita vegana','','Remova ovos.');
 /* ---- v18.3 · regras próprias de cada família ---- */
 {const ys=m.A.lines.reduce((a,l)=>a+(l.ing.yolk?l.g*(100-((l.c&&l.c.w)||0))/100:0),0)/T*100;m.yolkSol=ys;
  if(P.yolkSolMin&&ys<P.yolkSolMin)add('warn','Composição','Pouca gema para '+P.n.toLowerCase(),'O frozen custard americano exige '+f1(P.yolkSolMin)+'% de sólidos de gema (21 CFR 135.110); esta receita tem '+f2(ys)+'%.','Gema fresca tem ≈ 47,5% de sólidos: ≈ '+f1(P.yolkSolMin/.475)+'% de gema na mistura dá '+f1(P.yolkSolMin)+'% de sólidos.');
  else if(P.yolkSolMin)add('ok','Composição','Gema dentro da definição de custard ('+f2(ys)+'% de sólidos)','','');
  if(P.yolkMax!=null&&m.yolkPct>P.yolkMax)add('warn','Composição','Gema em estilo Philadelphia','O estilo Philadelphia é a base de creme e leite sem ovo; esta receita tem '+f1(m.yolkPct)+'% de gema.','Retire a gema ou mude para French / frozen custard.');}
 if(st.tipo==='froyo'&&!m.A.lines.some(l=>/iogurt|yogurt|kefir|coalhad|cultura/i.test(l.ing.id+' '+(l.ing.n||''))))add('warn','Composição','Frozen yogurt sem iogurte','Não há padrão legal de teor de iogurte, mas o produto precisa de iogurte ou cultura (de cultura sem incubação a 15–20% de iogurte na mistura).','Inclua iogurte natural ou cultura láctea.');
 if(P.proc==='still')add('info','Processo','Congelado parado: o ar vem do batimento','Esta família não passa pela mantecadora. O overrun do laudo ('+f0(m.ov)+'%) é o típico da família, não uma previsão da máquina.','Bata o creme e a base com ovos separadamente e incorpore com cuidado; congele na forma.');
 if(P.proc==='molded')add('info','Processo','Moldado: quase sem ar','Produto em forma ou palito, congelado parado. O overrun do laudo é o da família.','Desenforme com a forma rapidamente aquecida; mantenha a −18 °C ou abaixo.');
 if(P.proc==='scraped')add('info','Processo','Granita: cristais grandes são o objetivo','Os avisos de cristal do gelato não se aplicam. A textura vem de raspar ou mexer durante o congelamento.','Raspe a cada 20–30 min no freezer, ou use granitore.');
 if(P.proc==='soft')add('info','Processo','Servido direto da máquina','Avaliado na temperatura de extração ('+fT(st.vit)+' °C). A fração congelada alvo é menor que a do gelato de vitrine.','');
 if(P.conf==='prática')add('info','Referência','Faixas de prática nesta família','As faixas de '+P.n.toLowerCase()+' não têm fonte primária de composição. Use os lotes medidos para ajustá-las.','');
 /* ---- 6. Estabilização ---- */
 const kp=m.keyPct;const hasStab=m.hydro>.02||kp.starch>.3;
 if(!hasStab&&tbase(st.tipo)!=='gastro'&&P.stab[0]>0)add(m.sol<P.sol[1]?'warn':'info','Estabilização','Sem estabilizante','Sem hidrocoloides a água livre migra e recristaliza: o gelato fica cristalino em 1–2 dias e derrete rápido.','Adicione neutro a '+f1(P.stab[0]+.1)+'% ('+f0((P.stab[0]+.1)/100*T)+' g) ou uma mistura de goma jataí + guar.');
 else if(m.hydro>0&&m.hydro<P.stab[0]*.8&&!kp.starch)add('info','Estabilização','Estabilizante abaixo do usual ('+f2(m.hydro)+'%)','Faixa usual '+fRg(P.stab)+'% para este tipo.','Aumente para '+f0((P.stab[0]+.05)/100*T)+' g.');
 else if(m.hydro>P.stab[1]*1.25)add('warn','Estabilização','Excesso de estabilizante ('+f2(m.hydro)+'%)','Acima de '+fT(P.stab[1])+'% a textura fica elástica, gomosa e o sabor fica abafado.','Reduza para ~'+f0(P.stab[1]/100*T)+' g.');
 else if(m.hydro>0)add('ok','Estabilização','Estabilização correta ('+f2(m.hydro)+'%)','Dentro da faixa usual para este tipo.','');
 for(const k in kp){const r=STAB_RNG[k];if(!r||k==='neutro')continue;const v=kp[k];
  if(v>r[1]*1.2)add('warn','Estabilização',STAB_N[k]+' acima da dose ('+f2(v)+'%)','Dose usual '+fRg(r)+'% da mistura.'+(k==='xan'?' Xantana em excesso dá textura elástica, "puxa-puxa".':k==='starch'?' Amido em excesso deixa textura de pudim e sabor farinhento.':k==='mono'?' Mono e diglicerídeos em excesso desestabilizam demais a gordura: textura seca e amanteigada.':''),'Reduza para '+f0(r[1]/100*T)+' g.');}
 if(kp.guar>.03&&!kp.carr&&m.A.dairyG>0)add('info','Estabilização','Guar em base láctea sem carragena','Guar (e jataí) com proteínas do leite podem separar soro na mistura maturada.','Adicione 0,01–0,02% de carragena ('+f1(.015/100*T)+' g) para estabilizar as proteínas.');
 if((kp.lbg>.02||kp.carr>.005)&&pr.pastT<80)add('warn','Estabilização','Goma jataí/carragena sem hidratar','Esses hidrocoloides só se hidratam por completo acima de 80–85 °C. Pasteurizando a '+fT(pr.pastT)+' °C eles trabalham pela metade.','Pasteurize a 85 °C ou troque por guar/xantana (hidratam a frio).');
 /* fibra fermentável por porção (Bonnema et al., 2010: bem tolerados até 10 g/dia de inulina nativa e 5 g/dia de oligofrutose) */
 {const por=+pr.portion||90,gi=(m.A.inu||0)/T*por,gf=(m.A.fos||0)/T*por;
  if(gi>10||gf>5)add('warn','Nutrição','Muita fibra fermentável por porção ('+(gi>10?f1(gi)+' g de inulina':f1(gf)+' g de oligofrutose')+' em '+f0(por)+' g)','Em adultos saudáveis, até 10 g/dia de inulina nativa e 5 g/dia de oligofrutose foram bem tolerados; acima disso aumentam gases e inchaço (Bonnema et al., 2010). Uma porção já passa do limite de um dia.','Reduza a inulina/FOS e complete o corpo com sólidos lácteos, alulose ou polióis.');
  else if(gi>5||gf>2.5)add('info','Nutrição','Fibra fermentável: '+(gi>5?f1(gi)+' g de inulina':f1(gf)+' g de oligofrutose')+' por porção de '+f0(por)+' g','É metade ou mais do que adultos saudáveis toleraram bem por dia (10 g de inulina nativa, 5 g de oligofrutose; Bonnema et al., 2010).','');}
 if(kp.starch>.3&&pr.pastT<85)add('warn','Estabilização','Amido sem gelatinizar','O amido de milho precisa de 85–90 °C para engrossar completamente.','Leve a 85–90 °C por 1–2 minutos (técnica siciliana).');
 if(m.fat>8&&!m.hasEmul&&tbase(st.tipo)!=='sorbetto')add('info','Estabilização','Sem emulsificante com '+f1(m.fat)+'% de gordura','Emulsificantes controlam a desestabilização parcial da gordura: textura mais seca e cremosa, derretimento mais lento.','Use 2–4% de gema ou 0,2–0,3% de lecitina ('+f1(.25/100*T)+' g).');
 /* ---- 7. Ingredientes específicos ---- */
 if(kp.lec>.6)add('warn','Ingredientes','Lecitina em excesso','Acima de 0,5% aparece sabor de feijão/gordura.','Reduza para '+f1(.4/100*T)+' g.');
 if(m.A.ery/T*100>6)add('warn','Ingredientes','Eritritol acima de 6%','O eritritol tem baixa solubilidade a frio: recristaliza (textura arenosa) e dá sensação refrescante de menta.','Limite a ~5% e complete com alulose, inulina ou maltitol.');
 if((m.A.sor+m.A.xyl+m.A.mlt)/T*100>6)add('warn','Ingredientes','Polióis laxativos acima de 6%','Sorbitol, xilitol e maltitol têm efeito laxativo dose-dependente; uma porção de gelato com mais de 6% já pode incomodar. A advertência de rótulo é obrigatória na UE acima de 10% de polióis adicionados (Reg. 1169/2011, anexo III) — no Brasil, confira a regra vigente da ANVISA para o seu produto.','Reduza e combine com eritritol ou fibras.');
 if(m.A.gly/T*100>2)add('warn','Ingredientes','Glicerol acima de 2%','Dá sabor amargo/quente e textura escorregadia.','Use no máximo 1–1,5%.');
 if((m.A.inu+m.A.fos)/T*100>5)add('warn','Ingredientes','Fibras solúveis acima de 5%','Inulina/FOS em excesso deixam a textura gomosa (prática de formulação). A tolerância intestinal está no aviso de fibra por porção.','Reduza para 3–4% e complete o corpo com fibra de milho ou polidextrose.');
 if(m.alc>3.5)add('crit','Ingredientes','Álcool acima de 3,5% ('+f1(m.alc)+'% etanol)','O etanol tem o PAC mais alto da receita (740): o gelato não firma na vitrine.','Reduza o destilado ou sirva como "affogato" sobre o gelato.');
 else if(m.alc>2)add('warn','Ingredientes','Álcool relevante ('+f1(m.alc)+'% etanol)','Cada 1% de etanol amolece muito; já está considerado no PAC.','Adicione após a pasteurização para não evaporar o aroma.');
 if(m.salt>.9&&tbase(st.tipo)==='gastro')add('warn','Sabor','Sal alto mesmo para salgado ('+f2(m.salt)+'%)','No frio o sal é menos percebido, mas acima de ~0,9% ele domina quando o gelato é servido como prato; gelatos salgados de alta cozinha ficam em 0,3–0,8%. Como guarnição em porção pequena, mais sal pode ser intencional.','Baixe o sal e use glicose ou trealose para o PAC.')
 if(m.salt>.4&&tbase(st.tipo)!=='gastro')add('warn','Sabor','Sal alto para doce ('+f2(m.salt)+'%)','Acima de ~0,3% o sal aparece como salgado.','Use 0,05–0,15% para realçar sabor.');
 else if(m.salt<.02&&tbase(st.tipo)!=='sorbetto'&&tbase(st.tipo)!=='gastro')add('info','Sabor','Sem sal','Uma pitada de sal (0,05–0,1%) realça laticínios, chocolate, caramelo e oleaginosas sem ser percebida.','Adicione '+f1(.08/100*T)+' g de sal.');
 if(m.A.cocoaG/T*100>5.5)add('info','Ingredientes','Cacau intenso ('+f1(m.A.cocoaG/T*100)+'% de sólidos de cacau)','Muito cacau absorve água: textura seca e adstringente se não houver água e açúcar suficientes.','Hidrate o cacau em água/leite quente e mantenha os sólidos totais dentro da faixa.');
 /* frutas */
 if(P.frt){if(m.fruit<P.frt[0])add('warn','Ingredientes','Pouca fruta ('+f0(m.fruit)+'%)','Para '+P.n.toLowerCase()+' o usual é '+fRg(P.frt)+'% (cítricos ficam no limite inferior: 20–30%).','Aumente a polpa e reduza água.');
  else add('ok','Ingredientes','Teor de fruta adequado ('+f0(m.fruit)+'%)','','');}
 if(m.brixAcid!=null&&m.acd>.15&&(tbase(st.tipo)==='sorbetto'||tbase(st.tipo)==='frutta')){const r=m.brixAcid;
  if(r<20)add('warn','Sabor','Muito ácido (relação Brix/acidez '+f0(r)+')','Abaixo de 20 a acidez domina.','Aumente a fruta doce ou a sacarose; ou reduza o limão.');
  else if(r>60)add('info','Sabor','Pouco ácido (relação Brix/acidez '+f0(r)+')','Acima de 60 o sabor fica plano e doce demais.','Acrescente 1–2% de suco de limão para dar frescor.');
  else add('ok','Sabor','Relação Brix/acidez equilibrada ('+f0(r)+')','Entre 20 e 60: fruta viva e refrescante.','');}
 /* ---- 8. Processo ---- */
 const ph=pr.pastHoldU==='min'?pr.pastHold*60:pr.pastHold;
 if(pr.pastT<63)add('crit','Segurança','Pasteurização insuficiente ('+fT(pr.pastT)+' °C)','Abaixo de 63 °C não há redução segura de patógenos.','Pasteurize a 85 °C (alta) ou 65 °C por 30 min (baixa).');
 else if(pr.pastT<72&&ph<1800)add('crit','Segurança','Tempo curto para pasteurização baixa','A '+fT(pr.pastT)+' °C são necessários 30 minutos.','Mantenha 30 min ou suba para 85 °C.');
 else if(pr.pastT<80&&ph<15)add('warn','Segurança','Retenção curta','A '+fT(pr.pastT)+' °C mantenha ao menos 15 s.','');
 else add('ok','Processo','Pasteurização segura ('+fT(pr.pastT)+' °C)',pr.pastT>=80?'Alta temperatura desnatura parte das proteínas do soro, que passam a reter mais água e ar: mais corpo e overrun.':'Baixa temperatura preserva aromas delicados, com um pouco menos de corpo.','');
 {const cp=(st.recipe||[]).filter(r=>r.id==='cacau'||r.id==='cacau10').reduce((a,r)=>a+(+r.g||0),0);if(cp>0&&pr.pastT<88)add('info','Processo','Cacau em pó pede mais calor','A fibra do cacau em pó se dissolve melhor acima da pasteurização comum: Dondoli junta o cacau a 85 °C e sobe a mistura a 90 °C.','Leve a mistura a ~90 °C depois de juntar o cacau.');}
 if(pr.pastT>92)add('info','Processo','Pasteurização muito quente','Acima de 90 °C aparece sabor de leite cozido.','Use 85 °C.');
 if(m.A.eggFresh>0&&pr.pastT<80)add(pr.pastT<72?'crit':'warn','Segurança','Ovo cru com '+fT(pr.pastT)+' °C','Gema fresca exige 82–85 °C (ponto de nappe) para segurança contra Salmonella.','Leve a 82–85 °C ou use gema pasteurizada.');
 if(pr.coolMin>120)add('warn','Segurança','Resfriamento lento ('+fT(pr.coolMin)+' min)','A mistura deve sair de 60 °C para menos de 10 °C em até 2 h.','Use banho de gelo ou pasteurizador com resfriamento.');
 if(pr.matT>6)add('crit','Segurança','Maturação acima de 6 °C','Multiplicação bacteriana na mistura.','Mature entre 2 e 4 °C.');
 else if(pr.matT>4.5)add('warn','Processo','Maturação a '+fT(pr.matT)+' °C','Ideal 2–4 °C para cristalizar a gordura e segurar a mistura.','');
 if(pr.matH>96)add('crit','Segurança','Mistura pasteurizada há mais de 4 dias','Dondoli dá até 4 dias para a mistura pasteurizada e resfriada rápido; depois disso, pasteurizar de novo.','Use em até 72 h ou repasteurize (pode ser a temperatura mais baixa, para não cansar o sabor).');
 else if(pr.matH>72)add('warn','Segurança','Maturação acima de 72 h','No limite do prazo da mistura pasteurizada (Dondoli: até 4 dias com resfriamento rápido; Corvitto matura no máximo 36 h).','Mantecar logo ou repasteurizar.');
 else if(pr.matH<4&&tbase(st.tipo)!=='sorbetto')add('warn','Processo','Maturação curta ('+fT(pr.matH)+' h)','Abaixo de 4–6 h estabilizantes não hidratam e a gordura não cristaliza: menos corpo e overrun. Corvitto recomenda 6–12 h.','Mature por no mínimo 6 h.');
 else if(pr.matH>=4)add('ok','Processo','Maturação adequada ('+fT(pr.matH)+' h a '+fT(pr.matT)+' °C)','Estabilizantes hidratados e gordura parcialmente cristalizada.','');
 if(m.A.acidFruitG>0&&m.A.dairyG>0&&pr.fruitStage==='antes')add('crit','Processo','Fruta ácida pasteurizada com leite','O ácido coagula a caseína no calor (talha) e o aroma fresco da fruta se perde.','Adicione a fruta à mistura fria, após a maturação, antes de mantecar.');
 if(m.A.alc>0&&pr.alcStage==='antes')add('warn','Processo','Álcool adicionado antes do calor','Parte do álcool evapora: pelas tabelas de retenção do USDA, fica ~85% quando a bebida só ferve e sai do fogo e ~40% depois de 15 min de fervura. O cálculo usa o álcool todo, então o gelato real sai mais duro que o previsto.','Se a intenção é o sabor cozido (zabaione), confira o ponto na primeira produção; se não, adicione o destilado na mistura fria ou na metade da mantecação.');
 const dr=P.draw;
 if(pr.drawT>dr[1]&&pr.machine==='maqp1')add('info','Processo','Saída da Maestro Gelatiere a '+fT(pr.drawT)+' °C','O manual da Maqp1 pede retirar a −4 °C no centro da massa: só '+f0(m.fzDraw)+'% da água sai congelada e o resto congela no freezer. Quanto mais rápido o endurecimento, menores os cristais.','Gele os potes antes, use potes de até 500 mL, ligue o Turbo do freezer 30 min antes e não empilhe os potes.');
 else if(pr.drawT>dr[1])add('warn','Processo','Saída da mantecadora quente ('+fT(pr.drawT)+' °C)','Só '+f0(m.fzDraw)+'% da água congela na máquina; o resto congela devagar no freezer formando cristais grandes.','Mantecar até '+dr[1]+' a '+fT(dr[0])+' °C.');
 else if(pr.drawT<dr[0]-1)add('info','Processo','Saída muito fria ('+fT(pr.drawT)+' °C)','Difícil de extrair, risco de amanteigar.','Saia entre '+dr[0]+' e '+fT(dr[1])+' °C.');
 else add('ok','Processo','Saída da mantecadora ideal ('+fT(pr.drawT)+' °C)',f0(m.fzDraw)+'% da água sai congelada em cristais pequenos.','');
 if(m.fat>11&&pr.drawMin>12)add('warn','Processo','Risco de amanteigar','Gordura alta com mantecação longa forma grumos de manteiga.','Reduza o tempo ou a gordura.');
 if(pr.hardAuto&&pr.serveFrom==='pote'){const hm=hardenModel(m,pr);if(hm&&hm.tDone!=null){const h5=f1(hm.tDone/60),big=+pr.poteMl>500;
  add(hm.tDone>300?'warn':'info','Processo','Endurecimento no freezer: centro a '+fT(hm.target)+' °C em '+h5+' h','Pote de '+f0(+pr.poteMl)+' mL saindo a '+fT(pr.drawT)+' °C'+(+pr.turboMin>0?', com Turbo ('+fT(pr.blastT)+' °C) por '+f0(+pr.turboMin)+' min':'')+' e freezer a '+fT(pr.storeT)+' °C. A camada de servir firma em '+f0(hm.tFirm||0)+' min. Sem abatedor, o endurecimento lento faz cristais maiores que no profissional (60–90 min).',big?'Divida em potes de 500 mL ou menos: o centro chega a −18 °C bem antes.':'Para provar no mesmo dia, espere ao menos '+h5+' h; o ideal é servir no dia seguinte.');}}
 else if(pr.blastT>-25||pr.hardMin>240)add('warn','Processo','Abatimento lento','Quanto mais rápido o núcleo chega a −18 °C, menores ficam os cristais. Em abatedor a −35/−40 °C com cubas rasas isso leva 60–90 min; acima de ~4 h (menos de ~1–2 °C/h no núcleo) o cristal cresce de forma perceptível.','Abatedor a −35/−40 °C, cubas rasas, sem empilhar.');
 else if(pr.hardMin>90)add('info','Processo','Abatimento pode ser mais rápido','Endurecer em '+f1(pr.hardMin/60)+' h funciona, mas 60–90 min em abatedor a −35/−40 °C dá cristais menores e textura mais lisa.','Cubas rasas e abatedor bem frio encurtam o tempo.');
 {const cap=m.mach.batchMax||m.mach.batch;if(cap&&T>cap)add('warn','Processo','Lote acima da capacidade da máquina','A '+m.mach.n+' processa até '+cap+' g por ciclo; o lote tem '+f0(T)+' g.','Divida em '+Math.ceil(T/(m.mach.batch||cap))+' ciclos de ~'+f0(T/Math.ceil(T/(m.mach.batch||cap)))+' g.');
  else if(m.mach.batchMax&&m.mach.batch&&T>m.mach.batch*1.15)add('info','Processo','Ciclo mais longo que o de referência','Com '+f0(T)+' g por ciclo a '+m.mach.n.split(' (')[0]+' leva mais tempo para congelar (veja Processo › Maestro nesta receita): cristais um pouco maiores.','Para o melhor resultado, ciclos de até ~'+m.mach.batch+' g.');}
 const shock=Math.abs(pr.storeT-m.vit);
 if(pr.storeT>-15)add('crit','Processo','Freezer quente ('+fT(pr.storeT)+' °C)','Acima de −15 °C só '+f0(m.fzStore)+'% da água fica congelada: os cristais crescem rápido e a lactose cristaliza. É comum em freezers domésticos cheios ou com porta muito aberta.','Regule para −18/−22 °C e confira com termômetro no centro de uma cuba.');
 else if(pr.storeT>-18)add('warn','Processo','Freezer acima de −18 °C ('+fT(pr.storeT)+' °C)','Recristalização acelerada no armazenamento.','Regule para −18/−22 °C.');
 if((+pr.storeFluct||0)>=2)add('warn','Processo','Oscilação do freezer de ±'+fT(pr.storeFluct)+' °C','A cada ciclo o gelo da superfície dos cristais derrete e recongela nos maiores: é o principal motor de cristais grandes no armazenamento.','Evite abrir a porta com frequência, não armazene perto da porta, use freezer horizontal ou deixe a cuba com tampa e filme em contato.');
 if(shock>8)add('info','Processo','Diferença grande entre armazenamento e vitrine ('+f0(shock)+' °C)','Cada transferência derrete e recongela a superfície: cristais crescem.','Leve a cuba para a vitrine 30–60 min antes, de forma gradual.');
 if(Math.abs(m.vit-m.serveT)>1.5&&m.wat>20)add('info','Térmico','Temperatura ideal de serviço desta receita: '+f1(m.serveT)+' °C','Faixa recomendada '+f1(m.serveRange[1])+' a '+f1(m.serveRange[0])+' °C.','Ajuste a vitrine ou rebalanceie os açúcares.');
 if(m.ov<P.ov[0]-3)add('info','Processo','Overrun previsto baixo ('+f0(m.ov)+'%)','Gelato denso; bom para pistache e chocolate, pesado para cremes leves.','Mais proteína, emulsificante, maturação de 6 h+ e pasteurização a 85 °C aumentam o ar.');
 if(m.ov>P.ov[1]+3)add('info','Processo','Overrun previsto alto ('+f0(m.ov)+'%)','Mais ar = menos sabor por colherada e risco de encolhimento.','');
 /* ---- 8. Viscosidade, pH e transição vítrea ---- */
 if(m.visc<25)add('warn','Estrutura','Mistura rala ('+f0(m.visc)+' mPa·s a 4 °C)','Abaixo de ~25 mPa·s a mistura não segura ar e a água migra: overrun baixo e cristais maiores.','Aumente estabilizante ou sólidos (leite em pó, maltodextrina).');
 else if(m.visc>800)add('warn','Estrutura','Mistura muito viscosa ('+f0(m.visc)+' mPa·s a 4 °C)','Acima de ~800 mPa·s a mantecadora incorpora pouco ar e a textura fica pastosa.','Reduza gomas ou sólidos insolúveis.');
 else add('ok','Estrutura','Viscosidade da mistura adequada ('+f0(m.visc)+' mPa·s a 4 °C)','Na faixa que favorece incorporação de ar e cristais finos.','');
 if(m.msnf>.5&&m.ph<5.2){if(m.pr.fruitStage==='antes')add('crit','Química','pH '+f1(m.ph)+' com leite aquecido','Abaixo de pH 5,2 as caseínas coagulam no calor: a mistura talha.','Adicione a fruta à mistura fria (abaixo de 7 °C) após a maturação.');
  else if(m.ph<4.6)add('info','Química','pH '+f1(m.ph)+' perto do ponto isoelétrico da caseína','Mesmo a frio a caseína agrega levemente: textura mais densa e sabor de iogurte.','Normal para gelatos de iogurte; em frutas, reduza o suco ácido ou aumente sólidos lácteos.');}
 else if(m.msnf>.5&&m.ph<5.6&&m.prot>2&&m.pr.fruitStage==='antes')add('warn','Química','pH '+f1(m.ph)+' na zona de risco com leite aquecido','Entre pH 5,2 e 5,6 a caseína aquecida a 85 °C pode flocular (textura granulosa), sobretudo com proteína alta e retenção longa.','Adicione a fruta na mistura fria após a maturação, ou aumente o leite em pó para tamponar.');
 /* ---- 9. Gordura: sólida por temperatura e desestabilização ---- */
 const hardShare=((m.fatTypes.cocoa||0)+(m.fatTypes.palm||0)+(m.fatTypes.coco||0))/100;
 if(m.fat>3&&m.sfcMouth>9&&hardShare>.4)add('warn','Gordura','Sensação cerosa na boca ('+f0(m.sfcMouth)+'% da gordura sólida a 35 °C)','Gorduras duras (manteiga de cacau, karité, gordura animal) ainda sólidas na temperatura da boca deixam película cerosa e abafam o sabor.','Troque parte por gordura do leite ou óleo; em chocolate, use mais cacau em pó e menos cobertura.');
 if(m.fat>4&&tbase(st.tipo)!=='sorbetto'){
  if(m.destab>55)add('warn','Gordura','Risco de amanteigar (desestabilização ≈'+f0(m.destab)+'%)','Gordura demais coalescida na mantecadora vira grânulos de manteiga: textura gordurosa e seca na boca.','Reduza mono e diglicerídeos/lecitina, extraia menos frio (−8/−9 °C) e encurte a mantecação.');
  else if(m.destab<12&&m.fat>6)add('info','Gordura','Pouca desestabilização da gordura (≈'+f0(m.destab)+'%)','Sem coalescência parcial a rede de gordura não sustenta o ar: derretimento rápido e textura úmida.','Use 2–4% de gema ou 0,1–0,2% de mono e diglicerídeos; extraia a −9/−10 °C.');
  else add('ok','Gordura','Desestabilização da gordura na faixa (≈'+f0(m.destab)+'%)','Coalescência parcial entre 12 e 55%: textura seca e cremosa, derretimento lento.','');
  if(m.oilOff)add('info','Gordura','Gordura quase toda líquida na saída ('+f0(m.sfcDraw)+'% sólida a '+fT(m.pr.drawT)+' °C)','Óleos líquidos não formam a rede de glóbulos parcialmente sólidos: o gelato pode "suar" óleo e derrete sem forma.','Combine com gordura do leite, de coco ou manteiga de cacau, e use emulsificante.');}
 /* ---- 10. Aroma na temperatura de serviço ---- */
 if(m.vit<=-14&&m.aromaTemp<.95&&(m.fruit>5||m.lipoShare>0))add('info','Sensorial','Aroma mais fraco a '+fT(m.vit)+' °C (≈'+f0((1-m.aromaTemp)*100)+'% menos volátil)','No frio os aromas evaporam menos e a língua percebe menos doçura e sabor.','Para a mesma intensidade de −12 °C, aumente fruta, pasta ou infusão em ≈'+f0((m.flavorDose-1)*100)+'%, ou sirva mais quente.');
 /* ---- 12. Do freezer ao pote (em casa, sem vitrine) ---- */
 if(m.pr.serveFrom==='pote'){const pt=poteModel(m,m.pr);if(pt){const ml=f0(+m.pr.poteMl||500),fzT=fT(+m.pr.storeT),amb=fT(+m.pr.ambT);
  const ctx='Pote de '+ml+' mL saindo do freezer a '+fzT+' °C numa cozinha a '+amb+' °C';
  if(pt.tReady==null)add('warn','Serviço','Não chega ao ponto em 40 min fora do freezer',ctx+': a camada de servir não alcança '+fT(m.serveT)+' °C. A receita está dura demais para servir de casa.','Use "Balancear açúcares" no modo pote com a espera desejada, ou tire o pote para a geladeira 30–40 min antes.');
  else if(pt.tReady>20)add('warn','Serviço','Espera longa: '+f0(pt.tReady)+' min fora do freezer',ctx+': a camada de servir leva '+f0(pt.tReady)+' min para chegar a '+fT(m.serveT)+' °C (o centro ainda estará a '+fT(pt.at(pt.tReady).core)+' °C).','Balanceie para a espera que você quer (ex.: 8–10 min): o motor sobe o anticongelante com dextrose sem passar da doçura.');
  else if(pt.tReady<2)add('info','Serviço','Sai do freezer quase no ponto','A '+fzT+' °C o gelato já está macio ('+f0(m.fzStore)+'% da água congelada). Prático, mas derrete rápido com o pote aberto e cristaliza mais no freezer.','Se preferir mais estrutura, balanceie para 5–8 min de espera.');
  else add('ok','Serviço','Pronto para servir em '+f0(pt.tReady)+' min fora do freezer',ctx+': a camada de servir chega a '+fT(m.serveT)+' °C em '+f0(pt.tReady)+' min; o centro fica a '+fT(pt.at(pt.tReady).core)+' °C e a superfície a '+fT(pt.at(pt.tReady).surf)+' °C.','');}}
 /* ---- 11. Infusões e perda no cozimento ---- */
 if(m.A.infRet>0)add('info','Processo','Infusão: '+f0(m.A.infRet)+' g de mistura retidos nos sólidos coados','A conta já desconta o líquido que fica na fava, folha ou especiaria e soma ≈'+f1(m.A.infExt)+' g de solúveis extraídos.','Pese a mistura depois de coar; se quiser o peso original, complete com o líquido da base (leite ou água) antes de pasteurizar.');
 if(m.A.lossG>0)add('info','Processo','Perda no cozimento: '+f0(m.A.lossG)+' g de água evaporada','Sólidos, açúcares e gordura ficam mais concentrados na mistura final; a análise já usa a massa depois do cozimento.','Confirme pesando a panela antes e depois; ajuste o campo "Perda no cozimento" com o valor real.');
 if(m.dTgStore>16)add('warn','Processo','Armazenamento longe da transição vítrea','Tg′ da mistura '+f1(m.tg)+' °C; a '+fT(m.pr.storeT)+' °C a fase concentrada está '+f0(m.dTgStore)+' °C acima: recristalização mais rápida (cinética WLF).','Armazene mais frio (−22/−25 °C) ou aumente açúcares de Tg′ alto (sacarose, maltodextrina) em relação a frutose/polióis.');
 return F;
}
function score(st,m,F){if(F===m._F)return m._sc||(m._sc=scoreCore(st,m,F));return scoreCore(st,m,F);}
function scoreCore(st,m,F){
 if(m.empty)return{total:0,parts:[]};const P=m.P;
 const parts=[
  ['Congelamento',22,rangeScore(m.fzVit,P.fz,10)],
  ['Doçura',12,rangeScore(m.pod,P.pod,5)],
  ['Sólidos',14,rangeScore(m.sol,P.sol,6)],
  ['Estrutura',10,tbase(st.tipo)==='sorbetto'?rangeScore(m.fat,P.fat,3):(rangeScore(m.fat,P.fat,4)*.6+rangeScore(m.prot,P.prot,2.5)*.4)],
  ['Lactose',12,m.lac>0?clamp(1-(m.lacW-9)/3,0,1):1],
  ['Estabilização',10,(m.hydro>.02||m.keyPct.starch>.3)?rangeScore(m.hydro,P.stab,P.stab[1]):.3],
  ['Processo',12,(P.crystal==='coarse'?1:m.ci/100)*.6+clamp(1-Math.max(0,4-m.pr.matH)/4,0,1)*.4],
  ['Segurança',8,F.some(f=>f.sev==='crit'&&f.area==='Segurança')?0:1]
 ];
 let t=parts.reduce((s,p)=>s+p[1]*p[2],0);
 const crit=F.filter(f=>f.sev==='crit').length;if(crit)t=Math.min(t,62-crit*4);
 return{total:Math.round(clamp(t,0,100)),parts};
}

