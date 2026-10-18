/* ---------- TEXTURA NA COLHER E PONTO DE QUENELLE (v17.9) ----------
   Fração de gelo em VOLUME do gelato pronto (gelo + matriz + ar): a dureza acompanha o volume de gelo (Muse & Hartel 2004),
   e o ar dilui esse volume. Por isso dois gelatos com o mesmo % de água congelada não têm a mesma dureza: o sorbet
   (mais água, menos ar) tem ~0,50 de gelo em volume no ponto, a crema ~0,38.
   Quenelle: a massa precisa ser plástica (moldar sem rachar), coesa (não esfarelar) e segurar a forma no prato.
   O alvo parte do ponto de servir da receita (fzMid) e fica mais macio: −3 pontos de água congelada, mais o excesso de
   gelo em volume acima de uma crema de referência (0,39), mais a falta de coesão. A janela (racha ↔ desaba) depende
   da coesão e da resistência ao derretimento. Os coeficientes são o ponto de partida; os testes de quenelle registrados
   nos lotes ajustam o alvo (calibração bayesiana, como as demais). */
function icePhaseVol(m,T){const W=m.wat||0,ice=W*m.fz(T)/100;const vMix=W+(m.fat||0)/.93+Math.max(0,(m.sol||0)-(m.fat||0))/1.55+(m.alc||0)/.79;const vP=vMix+ice*(1/.917-1)+vMix*(m.ov||0)/100;return vP>0?ice/.917/vP:0;}
function tempAtFz(m,f){let lo=-45,hi=-.05;if(m.fz(hi)>=f)return hi;if(m.fz(lo)<f)return lo;for(let k=0;k<44;k++){const mid=(lo+hi)/2;if(m.fz(mid)>=f)lo=mid;else hi=mid;}return(lo+hi)/2;}
const QREF=.39;
/* v18.10 · risco de esfarelar vem do banco de defeitos (produto), injetado por defeitos.js; sem ele, 0 */
var QN_CRUMB=null;
function quenelleModel(m){if(!m||m.empty||!(m.wat>0))return null;if(m._qn)return m._qn;const P=m.P;
 const phiServe=icePhaseVol(m,m.serveT);
 /* coesão (0–1): rede de gordura parcialmente coalescida, viscosidade da fase sérica, estabilizante na faixa; esfarelado tira */
 const fatOK=m.fat>4?clamp((m.destab||0)/20,0,1):.6;const v=m.visc||0;const viscOK=v<25?.3:v<50?.3+.7*(v-25)/25:v<=400?1:v<=800?1-.4*(v-400)/400:.5;
 const stabOK=m.hydro>=P.stab[0]&&m.hydro<=P.stab[1]*1.2?1:m.hydro<P.stab[0]?.55:.75;
 let crumb=0;try{crumb=QN_CRUMB?QN_CRUMB(m):0;}catch(e){}
 const C=clamp((.4*fatOK+.35*viscOK+.25*stabOK)*(1-.5*crumb),0,1);
 const H=clamp(((m.melt||0)-40)/50,0,1);
 const cal=CAL.on&&CAL.qShift?CAL.qShift:0;
 const fq=clamp(m.fzMid-3-40*Math.max(-.05,phiServe-QREF)-2*(1-C)+cal,40,85);
 const fBr=fq+2.5*(.5+.5*C),fSl=fq-4*(.6+.4*H);
 const T=tempAtFz(m,fq),Tbr=tempAtFz(m,fBr),Tsl=tempAtFz(m,fSl);
 const smooth=m.crystal<=35?'lisa e brilhante':m.crystal<=45?'lisa':'áspera (cristais de '+m.crystal+' µm)';
 const sheen=m.crystal<=35&&(m.fat>=6||m.hydro>=P.stab[0])?'brilho acetinado':m.crystal<=45?'superfície fosca':'superfície opaca e áspera';
 const notes=[];if(C<.55)notes.push('Coesão baixa: tende a rachar ou esfarelar na colher. Mais proteína, estabilizante na dose ou maturação mais longa.');
 if(H<.35)notes.push('Derrete rápido no prato: monte e sirva em até 1–2 min, prato frio.');
 if(m.crystal>45)notes.push('Cristais grandes deixam a quenelle áspera: endureça mais rápido e evite oscilação no freezer.');
 if(phiServe>.46)notes.push('Muito gelo em volume (pouco ar, muita água): típico de sorbet; tempere mais que uma crema.');
 const r={T,Tbr,Tsl,fq,fBr,fSl,C,H,phi:phiServe,phiQ:icePhaseVol(m,T),smooth,sheen,notes,cal,width:Tsl-Tbr};m._qn=r;return r;}
