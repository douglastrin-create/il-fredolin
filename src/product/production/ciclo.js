/* ===================== GÊMEO DO CICLO PRODUTIVO (v18.13 · §16, §33, §34) =====================
   Liga as etapas com a saída de uma como entrada da outra:
   preparação → tratamento térmico → resfriamento → maturação → mantecação → endurecimento → armazenamento
   → temperagem → serviço.
   Cada etapa diz o que é: simulada (com qual modelo), só balanço de energia ou tempo informado. Onde não há modelo
   do tempo, a tela não desenha curva (§33: não representar interpolação como física).
   Níveis de fidelidade (§34): exploratório, mecanístico, calibrado por dados, sincronizado com medições.
   Nenhuma etapa é "sincronizada": isso exige medições contínuas do lote real, que o app ainda não recebe.
   Tudo é função pura do estado: ao reabrir o app o ciclo é recalculado, sem nada rodando em segundo plano. */
const TWIN_FID={exp:'exploratório',mec:'mecanístico',cal:'calibrado por dados',sync:'sincronizado com medições',none:'não simulado'};
/* env (da tela): fridge = temperatura do ar da geladeira (°C) e origem; tauFit = τ da calda na geladeira (h) e de
   onde veio (tauSrc: 'medido' pela calda ou 'equipamento', ex.: maturador com agitação) */
function cycleTwin(m,prIn,env){if(!m||m.empty||!(m.wat>0))return null;env=env||{};
 const pr=Object.assign({},PROC0,prIn||m.pr);
 const kg=Math.max(.05,(m.tot||1000)/1000),rho=m.rhoMix||1.08;const fridge=env.fridge!=null?+env.fridge:+pr.matT;
 const st=[];const add=o=>{st.push(o);return o;};
 /* 1 · preparação e tratamento térmico: só balanço de energia (o tempo depende do fogão, que o app não conhece) */
 const pastT=+pr.pastT,holdS=pr.pastHoldU==='min'?+pr.pastHold*60:+pr.pastHold,prepT=+pr.prepT;
 add({k:'past',n:'Tratamento térmico',fid:'none',T0:prepT,T1:pastT,min:holdS/60,
  E:kg*3.3*Math.max(0,pastT-prepT),
  note:'Energia para aquecer de '+fT(prepT)+' a '+fT(pastT)+' °C; tempo de aquecimento não simulado (depende do fogão). Patamar de '+(holdS>=60?Math.round(holdS/60)+' min':holdS+' s')+' informado. O app não conclui segurança microbiológica a partir disto.'});
 /* 2 · resfriamento (modo escolhido, durante coolMin) e 3 · maturação (geladeira, matH) */
 const cool=coolStage(kg,rho,{mode:pr.coolMode,vessel:pr.coolVessel,Tair:pr.coolMode==='geladeira'?fridge:+pr.ambT,Tamb:+pr.ambT});
 const coolH=Math.max(0,+pr.coolMin||0)/60,matH=Math.max(0,+pr.matH||0);
 /* na geladeira: τ medido (calibração pela calda) quando há; senão o mesmo modelo, com o recipiente */
 const fr0=coolStage(kg,rho,{mode:'geladeira',vessel:pr.coolVessel,Tair:fridge,Tamb:fridge});
 const fr=env.tauFit>0?{...fr0,tau:env.tauFit}:fr0;
 const Tcool=pr.coolMode==='geladeira'?coolAt(fr,pastT,coolH):coolAt(cool,pastT,coolH);
 const coolS=pr.coolMode==='geladeira'?fr:cool;
 /* 60 → 10 °C: no resfriamento e, se não chegou, continuando na geladeira */
 const t60=coolTimeTo(coolS,pastT,Math.min(60,pastT));let t10=coolTimeTo(coolS,pastT,10);
 if(t10==null||t10>coolH){const r=coolTimeTo(fr,Tcool,10);t10=Tcool<=10?t10:(r==null?null:coolH+r);}
 const curveC=[];for(let i=0;i<=24;i++){const h=coolH*i/24;curveC.push({h,T:coolAt(coolS,pastT,h)});}
 add({k:'cool',n:'Resfriamento',fid:pr.coolMode==='geladeira'&&env.tauSrc==='medido'?'cal':'mec',T0:pastT,T1:Tcool,min:coolH*60,tau:coolS.tau,
  mode:pr.coolMode,vessel:pr.coolVessel,t60_10:t60!=null&&t10!=null?(t10-t60)*60:null,curve:curveC,
  ice:pr.coolMode==='banho'?kg*3.3*Math.max(0,pastT-Tcool)/334:null,
  note:(COOL_MODE[pr.coolMode]||{}).n+' em '+((COOL_VESSEL[pr.coolVessel]||{}).n||'recipiente')+'; calda homogênea (modelo de Newton). Sem mexer, o centro fica atrás da média.'+(pr.coolMode==='banho'?' Supõe gelo sobrando no banho o tempo todo: só para a calda derreter ≈ '+fT(kg*3.3*Math.max(0,pastT-Tcool)/334)+' kg de gelo.':'')});
 const thr=Math.max(+pr.matT,fridge)+1;const tThr=Tcool<=thr?0:coolTimeTo(fr,Tcool,thr);const Tin=coolAt(fr,Tcool,matH);
 const curveM=[];for(let i=0;i<=24;i++){const h=matH*i/24;curveM.push({h,T:coolAt(fr,Tcool,h)});}
 add({k:'mat',n:'Maturação',fid:env.tauSrc==='medido'?'cal':'mec',T0:Tcool,T1:Tin,min:matH*60,tau:fr.tau,fridge,fridgeSrc:env.fridgeSrc||'processo',
  hEff:tThr==null?0:Math.max(0,matH-tThr),thr,curve:curveM,
  note:'Geladeira a '+fT(fridge)+' °C ('+(env.fridgeSrc||'temperatura de maturação do processo')+(env.tauSrc==='medido'?'; resfriamento calibrado pela calda medida':env.tauSrc==='equipamento'?'; troca de calor do equipamento':'')+'). Horas efetivas = tempo com a calda a ≤ '+fT(thr)+' °C.'});
 /* 4 · mantecação: energia do ciclo com a calda na temperatura real de entrada; capacidade da máquina do ciclo informado */
 const plan=maqPlan(m,pr);let tDraw=null;
 if(plan){const chill=+pr.preChill?0:MAQ_STEEL*Math.max(0,(+pr.ambT||24)-plan.Td);tDraw=(maqEnergy(m,plan.load,Tin,plan.Td)+chill)/(plan.Q/1000)/60;}
 add({k:'maq',n:'Mantecação',fid:'mec',T0:Tin,T1:plan?plan.Td:+pr.drawT,min:tDraw,minDecl:+pr.drawMin,load:plan&&plan.load,fzDraw:plan&&plan.fzNow,
  note:'Balanço de energia (sensível + latente). A potência da máquina sai do ciclo que você informou ('+(plan?f0(plan.load):'?')+' g em '+fT(+pr.drawMin)+' min com a calda a '+fT(+pr.matT)+' °C). Curva de temperatura dentro da máquina não simulada.'});
 /* 5 · endurecimento */
 const H=hardenModel(m,pr);const hCal=CAL.on&&CAL.counts&&CAL.counts.core>0&&CAL.hMult!==1;
 add({k:'hard',n:'Endurecimento',fid:hCal?'cal':'mec',T0:Math.min(+pr.drawT,m.fp-.2),T1:H&&H.target,min:H&&H.tDone,tFirm:H&&H.tFirm,curve:H?H.curve.map(c=>({h:c.t/60,T:c.core,S:c.scoop})):[],
  note:'Condução no pote de '+f0(+pr.poteMl)+' mL com calor latente; pronto = centro a '+(H?fT(H.target):'?')+' °C.'+(hCal?' Troca de calor calibrada pelo núcleo medido em '+CAL.counts.core+' lote(s).':' Troca de calor do freezer estimada (14 W/m²K).')});
 /* 6 · armazenamento: resposta à oscilação do ar por período */
 const A=Math.max(.5,+pr.storeFluct||1);const resp=[.5,3,24].map(P=>storeResponse(m,pr,P,A));
 add({k:'store',n:'Armazenamento',fid:hCal?'cal':'mec',T0:+pr.storeT,T1:+pr.storeT,min:null,A,resp,
  note:'Ar do freezer a '+fT(+pr.storeT)+' ± '+fT(A)+' °C. Mostra quanto de uma oscilação com cada período chega à camada de servir e ao centro.'});
 /* 7 · temperagem e 8 · serviço */
 let P=null;if(pr.serveFrom==='pote')P=poteModel(m,pr);
 if(P)add({k:'temp',n:'Temperagem',fid:'mec',T0:P.T0,T1:P.atWait.scoop,min:P.wait,tReady:P.tReady,curve:P.curve.map(c=>({h:c.t/60,T:c.core,S:c.scoop})),
  note:'Pote de '+f0(+pr.poteMl)+' mL na cozinha a '+fT(+pr.ambT)+' °C (troca de calor estimada, 10 W/m²K, não calibrada).'});
 else add({k:'temp',n:'Temperagem',fid:'none',T0:+pr.storeT,T1:pr.serveFrom==='freezer'?+pr.storeT:+m.vit,min:null,
  note:pr.serveFrom==='freezer'?'Servido direto do freezer.':'Vitrine a '+fT(+m.vit)+' °C: aclimatação não simulada.'});
 const Tserve=P?P.atWait.scoop:pr.serveFrom==='freezer'?+pr.storeT:+m.vit;
 add({k:'serve',n:'Serviço',fid:'exp',T0:Tserve,T1:Tserve,min:null,ideal:m.serveT,melt10:m.melt10,
  note:'Ponto ideal da receita '+fT(m.serveT)+' °C (curva de congelamento). Derretido em 10 min: estimativa heurística.'});
 const tot=[coolH*60,matH*60,tDraw,H&&H.tDone,P&&P.tReady].reduce((a,b)=>a+(b>0?b:0),0);
 return{stages:st,kg,rho,fridge,Tin,Tserve,ideal:m.serveT,totMin:tot,
  sync:false,syncNote:'Nenhuma etapa sincronizada: o app não recebe medições contínuas do lote. Medições pontuais (calda, núcleo do pote) calibram etapas.'};}
/* resumo comparável de dois cenários (mesmas linhas, valores numéricos) */
function twinRows(T){if(!T)return[];const g=k=>T.stages.find(s=>s.k===k)||{};const c=g('cool'),ma=g('mat'),q=g('maq'),h=g('hard'),s=g('store'),t=g('temp');
 const r24=(s.resp||[]).find(x=>x&&x.P===24),r3=(s.resp||[]).find(x=>x&&x.P===3);
 return[['Calda ao sair do resfriamento','°C',c.T1,1],['De 60 a 10 °C','min',c.t60_10,0],['Maturação efetiva (calda ≤ '+(Math.round((ma.thr||0)*10)/10)+' °C)','h',ma.hEff,1],
  ['Calda ao entrar na máquina','°C',T.Tin,1],['Mantecação','min',q.min,0],['Endurecimento até o centro pronto','min',h.min,0],
  ['Oscilação de 3 h na camada de servir','± °C',r3&&r3.scoop,2],['Oscilação de 24 h na camada de servir','± °C',r24&&r24.scoop,2],
  ['Espera até o ponto','min',t.tReady,0],['Camada de servir no serviço','°C',T.Tserve,1],['Da panela à colher (sem o armazenamento)','h',T.totMin/60,1]];}
