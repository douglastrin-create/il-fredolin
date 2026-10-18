/* ---------- MAESTRO GELATIERE (Maqp1): carga × tempo, saída por receita, pré-resfriamento (v17.10) ----------
   Energia a retirar por ciclo: calor sensível da calda até o ponto de congelamento + do gelado até a saída
   + calor latente do gelo formado (334 kJ/kg). A capacidade líquida da máquina (W) sai do ciclo que você usa
   (carga e minutos do Processo; de fábrica: 1 L de retirada ≈ 1,1 kg em ~15 min). Sem pré-resfriar, a máquina
   ainda gasta energia esfriando o tanque de inox (~1,2 kg de aço, estimativa). Alvo de saída: 35% da água
   congelada no centro (cada grau abaixo do ponto de congelamento vale ~12–15 pontos de gelo nesse trecho).
   Referências de gelateria: saída a −10/−11 °C com ~75% da água congelada nas mantecadoras profissionais
   (Corvitto, p. 107); a Maestro trabalha bem mais quente, então o endurecimento rápido faz o resto. */
const MAQ_STEEL=.6;  /* kJ/K equivalentes do tanque + batedor (1,2 kg de inox × 0,5 kJ/kg·K) */
function maqEnergy(m,loadG,Tin,Tdraw){const kg=(loadG||0)/1000;const fp=m.fp,W=(m.wat||0)/100;const ice=W*m.fz(Tdraw)/100;
 return kg*(3.3*Math.max(0,Tin-fp)+2.6*Math.max(0,fp-Tdraw)+334*ice);}
function maqPlan(m,prIn){if(!m||m.empty||!(m.wat>0))return null;const pr=Object.assign({},PROC0,prIn||m.pr);const mach=MACH[pr.machine]||{};
 const load=clamp(+pr.load||mach.load||1000,200,3000),Tin=clamp(+pr.matT||4,-1,12),min=clamp(+pr.drawMin||15,2,60),Td=+pr.drawT||-4;
 const chillE=pre=>pre?0:MAQ_STEEL*(Math.max(0,(+pr.ambT||24)-Td));
 const Q=(maqEnergy(m,load,Tin,Td)+chillE(+pr.preChill))/(min*60);  /* kW */
 const t35=tempAtFz(m,35),t30=tempAtFz(m,30);
 const time=(g,T,pre,tin)=>(maqEnergy(m,g,tin==null?Tin:tin,T)+chillE(pre==null?+pr.preChill:pre))/Q/60;
 const loads=[800,1100,1500,2000].map(g=>({g,tDraw:time(g,Td),t35:time(g,t35)}));
 let best=800;loads.forEach(l=>{if(l.t35<=18)best=l.g;});
 const savePre=+pr.preChill?0:time(load,Td)-time(load,Td,1),saveCold=time(load,Td)-time(load,Td,null,1);
 return{load,Q:Q*1000,fp:m.fp,t35,t30,fz35:35,fzNow:m.fz(Td),Td,min,loads,best,wall:m.fp-12,savePre,saveCold,Tin,preChill:+pr.preChill,
  ovMax:mach.max||35,yieldMl:load/(m.gPerL||900)*1000};}
/* só o minuto em que a camada de servir chega ao ponto (para listas: para a simulação ali) */
function poteReady(m,pr){if(m.empty||!(m.wat>0))return null;const T0=Math.min(+pr.storeT,-1);if(T0>=m.serveT)return 0;let tr=null;
 heatSim(m,{ml:pr.poteMl,T0,Tamb:()=>+pr.ambT||23,h:10,tMax:40*60,step:60,watch:s=>{if(s.scoop>=m.serveT){tr=s.t;return true;}return false;}});return tr;}
