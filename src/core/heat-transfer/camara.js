/* ===================== CÂMARA TÉRMICA (v18.17 · §37) =====================
   Campo de temperatura dentro do pote (da superfície ao centro) ao longo do tempo, pelo mesmo modelo de condução
   1-D com calor latente do endurecimento e da temperagem (heatSim, verificado contra o método da entalpia e por
   convergência de malha). Nada é interpolado à mão: cada cor do mapa é um valor calculado.
   Cenários:
     endurecimento — sai da produtora (drawT) para o freezer (Turbo nos primeiros minutos, depois storeT);
     temperagem    — sai do freezer (storeT) para a cozinha (ambT).
   Recipiente: a parede soma a resistência L/k à troca com o ar (1/h_ef = 1/h + L/k), com as paredes da tabela do
   resfriamento (Incropera, apêndice A). "Sem parede" é o modelo que o resto do app usa. */
const CHAMBER_N=14;
function chamberRun(m,sc){if(!m||m.empty||!(m.wat>0))return null;const pr=Object.assign({},PROC0,sc.proc||m.pr);const ml=+sc.ml||+pr.poteMl;
 const wall=sc.vessel&&COOL_VESSEL[sc.vessel]?COOL_VESSEL[sc.vessel].L/COOL_VESSEL[sc.vessel].k:0;const hM=CAL.on&&CAL.hMult>0?CAL.hMult:1;
 let T0,Tamb,h,tMax,lab;
 if(sc.mode==='temper'){T0=Math.min(+pr.storeT,-1);const Ta=sc.Tamb!=null?+sc.Tamb:+pr.ambT;Tamb=()=>Ta;h=10;tMax=(+sc.min||40)*60;lab='Temperagem: do freezer ('+pr.storeT+' °C) para '+Ta+' °C';}
 else{T0=Math.min(+pr.drawT,m.fp-.2);const store=sc.Tamb!=null?+sc.Tamb:+pr.storeT,turbo=Math.min(+pr.blastT,store),tb=clamp(+pr.turboMin||0,0,150)*60;Tamb=t=>t<tb?turbo:store;h=H_FREEZER*hM;tMax=(+sc.min||240)*60;lab='Endurecimento: da produtora ('+fT(T0)+' °C) para o freezer ('+store+' °C'+(tb?', Turbo '+turbo+' °C nos primeiros '+Math.round(tb/60)+' min':'')+')';}
 const hEff=1/(1/h+wall);const step=Math.max(15,tMax/120);
 const S=heatSim(m,{ml,N:CHAMBER_N,T0,Tamb,h:hEff,tMax,step,dtMax:sc.mode==='temper'?6:30,field:true});
 const rad=Array.from({length:S.N},(_,i)=>(i+.5)*S.dr*1000);/* mm, centro da célula a partir do centro */
 return{mode:sc.mode,lab,ml,vessel:sc.vessel||'',h,hEff,R:S.r*1000,rad,times:S.curve.map(c=>c.t),field:S.curve.map(c=>c.f),scoop:S.curve.map(c=>c.scoop),core:S.curve.map(c=>c.core),T0,fp:m.fp,serveT:m.serveT};}
