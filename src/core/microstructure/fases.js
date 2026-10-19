/* ===================== MICROESTRUTURA: FASES, MATRIZ, CRISTAIS (v18.16 · §17) =====================
   O que é balanço (determinístico) e o que é hipótese fica separado:
   - Frações de volume de gelo, ar, gordura e matriz não congelada em cada temperatura: balanço de massa e volume
     a partir da curva de congelamento, do overrun e da composição (verificável: somam 1).
   - Concentração de solutos na matriz não congelada (crioconcentração): solutos ÷ (solutos + água não congelada).
   - Viscosidade da matriz por WLF com as constantes universais (−17,44; 51,6) e η = 10¹² Pa·s em Tg′ (Williams,
     Landel e Ferry, 1955): semiempírica, ordem de grandeza.
   - Gordura sólida pela curva de gordura sólida de cada tipo de gordura (já usada no motor).
   - Distribuição de tamanho dos cristais: HIPOTÉTICA. A média vem do índice de cristal do motor (heurístico) ou da
     sua medição ao microscópio; a forma (gama, com coeficiente de variação suposto) não vem de medição.
   - Bolhas de ar: só a fração de volume. O tamanho não é estimado (não há dado de referência no app); mede-se por
     microscopia (Chang e Hartel, 2002).
   Referências de tamanho (para comparação, não para cálculo): cristais de 20–35 µm na saída da produtora e 35–45 µm
   depois do endurecimento; abaixo de ~50 µm a textura é lisa (Hartel, AIChE CEP 2019; Marshall et al., 2003;
   Drewett e Hartel, 2007). Glóbulos de gordura ≈ 1 µm após homogeneização; aglomerados parcialmente coalescidos
   3–100 µm; micelas de caseína 0,3–0,4 µm (Goff e Hartel, 2013; Bolliger et al., 2000). */
const MICRO_REF={iceDraw:[20,35],iceHard:[35,45],iceSmooth:50,fatGlob:1,fatClust:[3,100],casein:[.3,.4],
 src:'Hartel, "Engineering Frozen Desserts", AIChE CEP (2019); Goff e Hartel, Ice Cream, 7ª ed. (2013); Marshall et al. (2003); Drewett e Hartel (2007)'};
const RHO_ICE=.917,RHO_FAT=.93;
/* estado das fases a T (°C) para 100 g de mistura */
function phaseAt(m,T){if(!m||m.empty||!(m.wat>0))return null;const W=m.wat,F=m.fat,S=Math.max(0,100-W-F);
 const fz=T>=m.fp?0:clamp(m.fz(T)/100,0,1),ice=W*fz,wl=W-ice;
 const sfc=m.sfcAt?m.sfcAt(T)/100:0,fatS=F*sfc,fatL=F-fatS;
 /* volume (cm³ por 100 g): gelo, gordura, matriz (água líquida + sólidos não gordurosos; densidade da solução pela regra das misturas) */
 const vIce=ice/RHO_ICE,vFat=F/RHO_FAT,vMat=wl/1+S/1.59,vPhase=vIce+vFat+vMat;const ovr=Math.max(0,m.ov||0)/100;const vAir=(m.rhoMix?100/m.rhoMix:vPhase)*ovr;
 const vTot=vPhase+vAir;const conc=S/(S+wl)*100,conc0=S/(S+W)*100;
 const dTg=T-(m.tg!=null?m.tg:-32);const logEta=dTg<=0?12:12-17.44*dTg/(51.6+dTg);
 return{T,fz:fz*100,ice,wl,fatS,fatL,sfc:sfc*100,vol:{ice:vIce/vTot,air:vAir/vTot,fat:vFat/vTot,mat:vMat/vTot},conc,conc0,cf:conc/conc0,dTg,logEtaMat:logEta};}
/* perfil de −30 a −4 °C (para o gráfico) */
function phaseProfile(m,lo,hi,step){lo=lo==null?-30:lo;hi=hi==null?-4:hi;step=step||1;const out=[];for(let T=lo;T<=hi+1e-9;T+=step){const p=phaseAt(m,T);if(p)out.push(p);}return out;}
/* ---------- distribuição de tamanho dos cristais (hipotética) ----------
   Gama com média μ e coeficiente de variação cv: forma k = 1/cv², escala θ = μ·cv². Fração acima de 50 µm pela
   função gama incompleta. Envelhecimento: a média cresce como no motor (d³ = d0³ + K·t, amadurecimento de Ostwald)
   e a forma é mantida (autossimilaridade, hipótese). */
const CRYST_CV=[.35,.6];
function gammaPdf(x,k,th){return x<=0?0:Math.exp((k-1)*Math.log(x)-x/th-lgam(k)-k*Math.log(th));}
function crystalDist(mean,cv,xmax){const k=1/(cv*cv),th=mean*cv*cv;xmax=xmax||Math.max(120,mean*3);const pts=[];for(let i=0;i<=60;i++){const x=xmax*i/60;pts.push([x,gammaPdf(x,k,th)]);}
 return{mean,cv,k,th,pts,above50:gammaQ(k,MICRO_REF.iceSmooth/th)*100};}
/* média ao longo da armazenagem, com a cinética do motor (K em µm³/dia) */
function crystalAging(m,days,Kday){const d0=m.crystal,K=Kday!=null?Kday:(m.kin&&m.kin.Kstore)||0;return days.map(d=>({d,mean:Math.cbrt(Math.pow(d0,3)+K*d)}));}
