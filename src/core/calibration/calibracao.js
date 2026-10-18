/* ---------- CALIBRAÇÃO PELA PRODUÇÃO ---------- */
function calOv(machine){return (CAL.on&&CAL.ov[machine])?CAL.ov[machine]:0;}
/* ajuste bayesiano simples: média dos resíduos encolhida em direção a zero (prior de 3 lotes) */
function fitCalibration(lots){
 const prev=CAL.on;CAL.on=false;const ovR={},fzR=[],mR=[],kR=[],pS=[],pF=[],qR=[],hR=[];let phN=0;const res=[];
 (lots||[]).forEach(L=>{if(!L.recipe||!L.recipe.length)return;const st={tipo:L.tipo,vit:L.meas&&L.meas.texTemp!=null&&L.meas.texTemp!==''?+L.meas.texTemp:L.vit,recipe:L.recipe,proc:L.proc||{},brix:L.brix||{},costs:{}};const m=analyzeRaw(st);const me=L.meas||{};const r={id:L.id,code:L.code};
  const ov=measuredOverrun(me);if(ov!=null){const PF=PROF[L.tipo]||{};const mc=PF.proc&&PF.proc!=='batch'?'fam:'+L.tipo:(L.proc&&L.proc.machine)||'horiz';(ovR[mc]=ovR[mc]||[]).push(ov-m.ovModel);r.ov=[m.ovModel,ov];}
  if(me.tex!=null&&me.tex!==''){const tt=st.vit;const pred=(frozenPct(tt,m.SE,m.S)-m.fzMid)/3.5;fzR.push(-.8*(+me.tex-pred));r.tex=[Math.round(pred*10)/10,+me.tex];}
  if(me.melt10!=null&&me.melt10!==''){const pm=meltModel(m);mR.push(+me.melt10-pm);r.melt=[pm,+me.melt10];}
  if(me.icyDay!=null&&me.icyDay!==''&&+me.icyDay>0){const K=kinetics(m,st).Kvit;const implied=(Math.pow(50,3)-Math.pow(m.crystal,3))/(+me.icyDay);if(implied>0)kR.push(Math.log(implied/K));r.icy=+me.icyDay;}
  if(me.brix!=null&&me.brix!=='')r.brix=[m.brixMix,+me.brix];
  if(me.ph!=null&&me.ph!==''&&isFinite(+me.ph)){r.ph=[Math.round(m.ph*100)/100,+me.ph];phN++;}
  /* v18.2 · núcleo medido após N minutos no freezer → coeficiente de troca de calor */
  if(me.coreT!=null&&me.coreT!==''&&isFinite(+me.coreT)&&me.coreMin!=null&&me.coreMin!==''&&isFinite(+me.coreMin)){
   const pr=Object.assign({},PROC0,L.proc||{});if(me.drawT!=null&&me.drawT!==''&&isFinite(+me.drawT))pr.drawT=+me.drawT;const ml=+pr.poteMl||500;
   const hk=hash53(JSON.stringify([L.recipe,L.tipo,pr.drawT,pr.storeT,pr.blastT,pr.turboMin,ml,+me.coreT,+me.coreMin,L.brix,H_FREEZER,ING_VER]));
   /* precisão de um termômetro de espeto: ±0,5 °C. Se esse erro muda o h em mais de 60% (núcleo ainda no patamar de
      congelamento, ou quase em equilíbrio), a medição não informa e fica de fora, com o motivo registrado */
   let F=_HFIT.get(hk);if(F===undefined){const c=+me.coreT,t=+me.coreMin;F={h:fitH(m,pr,ml,t,c,10),lo:fitH(m,pr,ml,t,c+.5,7),hi:fitH(m,pr,ml,t,c-.5,7)};
    _HFIT.set(hk,F);_HFIT_dirty=true;if(_HFIT.size>300)_HFIT.delete(_HFIT.keys().next().value);}
   const ok=F.h!=null&&F.lo!=null&&F.hi!=null&&F.hi/F.lo<=1.6;
   const pred=coreAt(m,pr,ml,H_FREEZER,+me.coreMin);
   r.core=[pred!=null?Math.round(pred*10)/10:null,+me.coreT,F.h!=null?Math.round(F.h*10)/10:null,+me.coreMin,ok?'':F.h==null?'fora do alcance do modelo ou em equilíbrio':'pouco informativa: núcleo ainda no patamar de congelamento'];
   if(ok)hR.push(Math.log(F.h/H_FREEZER));}
  /* quenelle: temperatura do teste e resultado (−1 rachou/duro · 0 lisa · +1 mole/desabou) → desloca o alvo de água congelada */
  if(me.qT!=null&&me.qT!==''&&me.qRes!=null&&me.qRes!==''&&isFinite(+me.qT)){const q=quenelleModel(m);if(q){const fz=m.fz(+me.qT),res=+me.qRes;
   const y=res===0?fz-q.fq:res<0?Math.min(0,fz-q.fBr):Math.max(0,fz-q.fSl);qR.push(y);r.q=[Math.round(q.T*10)/10,+me.qT,res];}}
  /* painel cego: escala do ponto ideal (−2 falta · 0 ideal · +2 sobra) vira preferência da casa */
  const pn=(L.panel||[]).filter(x=>x&&!x.ex);const jm=k=>{const v=pn.map(x=>x[k]).filter(v=>v!==''&&v!=null&&isFinite(+v)).map(Number);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;};
  const js=jm('jDoce'),jd=jm('jDuro');if(js!=null){pS.push(-1.2*js);r.jDoce=js;}if(jd!=null){pF.push(-3*jd);r.jDuro=jd;}if(pn.length)r.panel=pn.length;
  res.push(r);});
 const shrink=(a,k=3)=>a.length?a.reduce((x,y)=>x+y,0)/(a.length+k):0;
 CAL.ov={};for(const mc in ovR)CAL.ov[mc]=Math.round(shrink(ovR[mc])*10)/10;
 CAL.tShift=Math.round(shrink(fzR)*100)/100;CAL.qShift=Math.round(shrink(qR)*10)/10;CAL.meltBias=Math.round(shrink(mR)*10)/10;CAL.kMult=Math.exp(shrink(kR,2));CAL.hMult=Math.exp(shrink(hR,2));hfitSave();
 CAL.pref={pod:Math.round(shrink(pS)*2)/2,fz:Math.round(shrink(pF)),n:Math.max(pS.length,pF.length)};if(!CAL.pref.pod&&!CAL.pref.fz)CAL.pref.n=0;
 CAL.n=res.length;CAL.res=res;CAL.counts={ov:Object.values(ovR).reduce((a,b)=>a+b.length,0),tex:fzR.length,melt:mR.length,icy:kR.length,panel:Math.max(pS.length,pF.length),q:qR.length,ph:phN,core:hR.length};CAL.on=prev;CAL.ver++;return CAL;}
function measuredOverrun(me){if(me.ov!=null&&me.ov!=='')return +me.ov;if(+me.cupMix>0&&+me.cupGel>0)return(+me.cupMix-+me.cupGel)/(+me.cupGel)*100;return null;}

