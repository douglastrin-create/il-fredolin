/* ---------- QUÍMICA: pH, Tg′, cinética, sensorial ---------- */
/* doçura percebida cai ~2,5% por grau abaixo de −12 °C (e sobe acima); limitada a 0,5–1,2 fora da faixa medida */
const podTempFactor=T=>clamp(1+.025*(T+12),.5,1.2);
function chemistry(m,st){const A=m.A,T=A.tot||1;
 /* Tg' da fase concentrada (média ponderada dos solutos; proteínas e gomas ≈ −10 °C) */
 let sw=0,sx=0;for(const k in TGP){const g=A[k]||0;sw+=g;sx+=g*TGP[k];}
 if(A.gs>0){m.A.lines.forEach(l=>{if(l.c.gs){const de=l.ing.de||20;const g=l.g*l.c.gs/100;sw+=g;sx+=g*(-6-.55*de);}});}
 const pg=A.prot+A.stab;sw+=pg*.4;sx+=pg*.4*-10;m.tg=sw?sx/sw:-32;
 m.dTgVit=m.vit-m.tg;m.dTgStore=m.pr.storeT-m.tg;
 /* pH: fonte ácida dominante diluída × tampão das proteínas do leite */
 let dom=null;m.A.lines.forEach(l=>{if(l.ing.ph!=null&&(l.c.acd||0)>0){const ag=l.g*l.c.acd/100;if(!dom||ag>dom.ag)dom={ag,l};}});
 const base=m.msnf>.5?6.65:m.A.cocoaG>0?6.4:6.8;let ph=base;
 if(dom){const wf=dom.l.g*(dom.l.c.w||0)/100;const phAcid=dom.l.ing.ph+.5*Math.log10(Math.max(1,(A.w||1)/Math.max(1,wf)));
  const meq=A.acd*12,beta=.45*A.msnf+.05*A.fruitG+.3*(A.prot-A.msnf*.38>0?A.prot-A.msnf*.38:0);
  const phBuf=beta>0?base-meq/beta:-99;ph=m.msnf>.5?Math.max(phAcid,Math.min(base,phBuf)):phAcid;ph=Math.min(base,ph);}
 m.ph=ph;m.ta=A.acd/T*100;
 /* sensorial */
 m.podPerc=m.pod*podTempFactor(m.vit);
 m.aroma=clamp(100-Math.max(0,m.fat-6)*4-Math.max(0,m.hydro-.3)*45-Math.max(0,m.ov-30)*.4-Math.max(0,m.prot-4.5)*3,0,100);
 /* aroma na temperatura de serviço: volatilidade cai com o frio; aromas lipossolúveis ficam presos na gordura */
 {const tf=clamp(1+.035*(m.vit+12),.55,1.15);let lipo=0,fl=0;A.lines.forEach(l=>{const c=l.ing.cat;if(c==='Frutas'||c==='Cacau'||c==='Oleaginosas'||c==='Bebidas e aromas'&&l.ing.id!=='agua'){fl+=l.g;if(c!=='Frutas')lipo+=l.g;}});
  const lipoShare=fl?lipo/fl:0;m.aromaTemp=tf;m.aromaVit=clamp(m.aroma*tf-lipoShare*Math.max(0,m.fat-8)*2,0,100);m.flavorDose=1/tf;m.lipoShare=lipoShare;}
 m.melt10=clamp(meltModel(m)+(CAL.on?CAL.meltBias:0),3,95);
 const k=kinetics(m,st);m.kin=k;m.d0=m.crystal;
 /* freezer: dureza ao retirar e aclimatação (cuba de 5 L, ≈6 min por °C de diferença) */
 m.temperMin=m.pr.serveFrom==='freezer'?0:Math.max(0,(m.vit-m.pr.storeT))*6;
 /* no modo pote o tempo de espera só é simulado quando alguém lê (evita simular em cada passo do balanceador) */
 if(m.pr.serveFrom==='pote'){const t0=m.temperMin;let v;Object.defineProperty(m,'temperMin',{configurable:true,enumerable:true,get(){if(v===undefined){const pt=poteModel(m,m.pr);v=pt&&pt.tReady!=null?pt.tReady:t0;}return v;}});}
 m.storeHard=m.fzStore>84?'muito duro':m.fzStore>78?'firme':m.fzStore>=m.P.fz[0]?'espatulável':'mole';
 m.shelfVit=m.crystal>=50?0:(Math.pow(50,3)-Math.pow(m.crystal,3))/k.Kvit;m.shelfStore=m.crystal>=50?0:(Math.pow(50,3)-Math.pow(m.crystal,3))/k.Kstore;
 /* granita: cristais grandes são o objetivo; o horizonte de textura por crescimento de cristais não se aplica */
 if(m.P.crystal==='coarse'){m.shelfVit=60;m.shelfStore=90;m.ciNotes=['granita: cristais grandes e soltos são o objetivo'];}
}

