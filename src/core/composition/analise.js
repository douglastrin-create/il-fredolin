/* ---------- ANÁLISE ---------- */
/* ===================== ANÁLISE ===================== */
function analyzeRaw(st){
 const P0=PROF[st.tipo]||PROF.crema, pr=Object.assign({},PROC0,st.proc||{});
 const A={tot:0};MASS.forEach(f=>A[f]=0);
 Object.assign(A,{sat:0,tr:0,msnf:0,na:0,hfB:0,hfS:0,hfN:0,pac:0,pod:0,addSug:0,gsSug:0,fruitG:0,acidFruitG:0,dairyG:0,eggFresh:0,eggPast:0,yolk:0,cost:0,keys:{},al:new Set(),br:new Set(),cocoaG:0,nutG:0,lines:[],fatT:{},inf:[]});
 (st.recipe||[]).forEach(r=>{const ing=ING_BY[r.id];if(!ing)return;const g=Math.max(0,+r.g||0);if(!g)return;if(r.inf){A.inf.push({ing,g});return;}const c=compOf(ing,st.brix);
  A.tot+=g;MASS.forEach(f=>A[f]+=g*(c[f]||0)/100);
  const fatG=g*(c.fat||0)/100;A.sat+=fatG*(ing.sat!=null?ing.sat:.2);A.tr+=fatG*(ing.tr||0);if(fatG>0){const ft=fatTypes(ing);for(const k in ft)A.fatT[k]=(A.fatT[k]||0)+fatG*ft[k];}
  A.msnf+=ing.msnf!=null?g*ing.msnf/100:(ing.dairy?g*((c.lac||0)+(c.prot||0)+(c.ash||0))/100:0);
  A.na+=g*(ing.na||0)/100;A.hfB+=g*(ing.hfB||0)/100;A.hfS+=g*(ing.hfS||0)/100;A.hfN+=g*(ing.hfN||0)/100;
  let pac=0,pod=0;for(const f in PACK)pac+=(c[f]||0)*PACK[f]/100;for(const f in PODK)pod+=(c[f]||0)*PODK[f]/100;
  if(c.gs){pac+=c.gs*1.9*(ing.de||20)/100;pod+=c.gs*.9*(ing.de||20)/100;A.gsSug+=g*c.gs/100*gsSugarFrac(ing.de||20);}
  A.pac+=g*pac/100;A.pod+=g*pod/100;
  if(ing.added)A.addSug+=g*((c.suc||0)+(c.glu||0)+(c.fru||0)+(c.tre||0)+(c.iso||0)+(c.gs||0)*gsSugarFrac(ing.de||20))/100;
  if(ing.cat==='Frutas'){A.fruitG+=g;if(ing.acid)A.acidFruitG+=g;}
  if(ing.dairy)A.dairyG+=g;if(ing.egg==='fresh')A.eggFresh+=g;if(ing.egg==='past')A.eggPast+=g;if(ing.yolk)A.yolk+=g;
  if(ing.cat==='Cacau'&&(ing.hfS||0)>20)A.cocoaG+=g*(ing.hfS||0)/100;
  if(ing.cat==='Oleaginosas')A.nutG+=g;
  if(ing.parts){for(const k in ing.parts)A.keys[k]=(A.keys[k]||0)+g*ing.parts[k]/100;}
  if(ing.animal)A.animal=1;
  if(ing.key&&!ing.parts)A.keys[ing.key]=(A.keys[ing.key]||0)+g*((c.stab||0)+(c.emul||0)+(ing.key==='starch'?c.oth||0:0))/100;
  (ing.al||[]).forEach(a=>A.al.add(a));if(ing.br)A.br.add(ing.br);
  const own=st.costs?parseFloat(st.costs[ing.id]):NaN;const unit=isFinite(own)&&own>=0?own:INVCOST[ing.id]!=null?INVCOST[ing.id]:ing.cost||0;A.cost+=g/1000*unit;
  A.lines.push({ing,g,c,unit});
 });
 /* infusões: os sólidos coados levam mistura retida e deixam parte dos solúveis */
 A.infRet=0;A.infExt=0;
 if(A.inf.length&&A.tot>0){let ret=0;const ext=[];
  A.inf.forEach(({ing,g})=>{const p=infParams(ing),c=ing.c;ret+=g*p.ret;const dry=Math.max(0,100-(c.w||0));ext.push({ing,g,ex:g*dry/100*p.ext,fat:p.fat||0});
   (ing.al||[]).forEach(a=>A.al.add(a));if(ing.br)A.br.add(ing.br);const own=st.costs?parseFloat(st.costs[ing.id]):NaN;A.cost+=g/1000*(isFinite(own)&&own>=0?own:INVCOST[ing.id]!=null?INVCOST[ing.id]:ing.cost||0);});
  ret=Math.min(ret,A.tot*.5);A.infRet=ret;scaleMix(A,(A.tot-ret)/A.tot);
  ext.forEach(e=>{const fg=e.ex*e.fat;A.tot+=e.ex;A.oth+=e.ex-fg;A.fat+=fg;A.infExt+=e.ex;if(fg>0){const ft=fatTypes(e.ing);const k=Object.keys(ft)[0]||'milk';A.fatT[k]=(A.fatT[k]||0)+fg;}});}
 /* perda de água no cozimento (creme inglês, reduções, frutas cozidas) */
 A.lossG=0;{const lp=+pr.lossPct||0;if(lp>0&&A.tot>0){const lg=Math.min(A.w*.9,A.tot*lp/100);A.w-=lg;A.tot-=lg;A.lossG=lg;}}
 const T=A.tot||1,pc=v=>v/T*100,W=A.w;
 /* faixas ajustadas: cacau e oleaginosas carregam sólidos insolúveis que não pesam como açúcar/leite */
 const cocoaPct=A.cocoaG/T*100,nutPct=A.nutG/T*100;
 const P=Object.assign({},P0);const solAdj=Math.min(5,cocoaPct*.8+nutPct*.35),podAdj=Math.min(4,cocoaPct*.8);
 P.sol=[P0.sol[0],P0.sol[1]+solAdj];P.pod=[P0.pod[0]+podAdj*.5,P0.pod[1]+podAdj];P.adj=solAdj>.3||podAdj>.3;
 /* preferência da casa (painel cego): desloca as faixas de doçura e de água congelada */
 const pf=CAL.on&&CAL.pref&&CAL.pref.n?CAL.pref:null;if(pf){P.pod=[P.pod[0]+pf.pod,P.pod[1]+pf.pod];P.fz=[P0.fz[0]+pf.fz,P0.fz[1]+pf.fz];P.pref=pf;}
 const m={A,P,pr,tot:A.tot,empty:A.tot<=0,tipo:st.tipo};
 m.wat=pc(W);m.sol=Math.max(0,pc(A.tot-W-A.alc));m.fat=pc(A.fat);m.prot=pc(A.prot);m.lac=pc(A.lac);m.msnf=pc(A.msnf);
 m.swtG=A.suc+A.glu+A.fru+A.gs+A.tre+A.alu+A.iso+A.ery+A.sor+A.xyl+A.mlt+A.gly;m.swt=pc(m.swtG);
 m.stab=pc(A.stab);m.emul=pc(A.emul);m.alc=pc(A.alc);m.salt=pc(A.salt);m.acd=pc(A.acd);m.fib=pc(A.fib+A.inu+A.fos);m.fruit=pc(A.fruitG);
 m.lacW=W>0?A.lac/W*100:0;m.msnfW=W>0?A.msnf/W*100:0;
 m.pacKg=A.pac/T*1000;m.podKg=A.pod/T*1000;m.pod=A.pod/T*100;
 m.hfAbs=HFK.B*A.hfB+HFK.S*A.hfS+HFK.N*A.hfN;m.hfKg=m.hfAbs/T*1000;
 m.pacEffKg=m.pacKg-m.hfKg;
 m.SE=W>0?Math.max(0,(A.pac-m.hfAbs))/W*100:0;m.SEraw=W>0?A.pac/W*100:0;
 m.S=m.wat>0?2.37*m.msnf/m.wat:0;
 m.fp=-(fpdSE(m.SE)+m.S);m.fpRaw=-(fpdSE(m.SEraw)+m.S);
 const vit=+st.vit;m.vit=vit;
 const tS=CAL.on?CAL.tShift:0;m.tShift=tS;
 m.fz=t=>frozenPct(t+tS,m.SE,m.S);
 m.fzVit=m.fz(vit);m.fzDraw=m.fz(pr.drawT);m.fzStore=m.fz(pr.storeT);
 const fzMid=(P.fz[0]+P.fz[1])/2;m.fzMid=fzMid;
 m.serveT=W>0?tempForFrozen(fzMid,m.SE,m.S)-tS:0;m.serveRange=[tempForFrozen(P.fz[0],m.SE,m.S)-tS,tempForFrozen(P.fz[1],m.SE,m.S)-tS];
 m.SEreq=seRequired(vit+tS,fzMid,m.S);
 m.pacNeedAbs=m.SEreq*W/100+m.hfAbs;m.pacNeedKg=m.pacNeedAbs/T*1000;m.dPacKg=m.pacNeedKg-m.pacKg;m.dPacAbs=m.pacNeedAbs-A.pac;
 m.corvittoRef=23*Math.abs(vit);
 /* açúcares: distribuição */
 m.dexShare=m.swtG>0?A.glu/m.swtG*100:0;m.fruShare=m.swtG>0?A.fru/m.swtG*100:0;
 m.polyol=pc(A.ery+A.sor+A.xyl+A.mlt+A.gly);
 m.brixMix=pc(A.suc+A.glu+A.fru+A.lac+A.gs+A.tre+A.alu+A.iso+A.ery+A.sor+A.xyl+A.mlt+A.gly+A.inu+A.fos+A.salt+A.acd);
 m.brixAcid=m.acd>0?m.brixMix/m.acd:null;
 /* estabilizantes */
 m.keyPct={};for(const k in A.keys)m.keyPct[k]=pc(A.keys[k]);
 m.hydro=pc(A.stab);m.yolkPct=pc(A.yolk);
 m.hasEmul=m.emul>.05||m.yolkPct>=2;
 /* overrun */
 const mach=MACH[pr.machine]||MACH.horiz;let ov=mach.ov;
 if(tbase(st.tipo)==='sorbetto')ov*=.7;
 ov+=clamp((m.fat-8)*.8,-5,3);if(m.fat>12)ov-=(m.fat-12)*1.5;
 ov+=clamp((m.prot-3.5)*2,-5,4);
 if(m.emul>.05)ov+=Math.min(3,m.emul*10);if(m.yolkPct>=2)ov+=1.5;
 const sr=P.stab;if(m.hydro>=sr[0]&&m.hydro<=sr[1])ov+=1.5;else if(m.hydro>sr[1]*1.5)ov-=3;else if(m.hydro<sr[0]*.5)ov-=2;
 if(m.sol<P.sol[0]-2)ov-=4;if(m.sol>P.sol[1]+1)ov-=(m.sol-P.sol[1]);
 ov+=pr.pastT>=80?2:pr.pastT>=72?1:0;ov+=pr.matH>=2?Math.min(3,pr.matH*.35):-2;
 if(pr.drawMin<6)ov-=5;else if(pr.drawMin>15)ov-=2;
 m.visc=mixViscosity(m,A);ov+=m.visc<25?-3:m.visc>800?-Math.log(m.visc/800)*6:m.visc>=50&&m.visc<=400?1.5:0;
 m.ovModel=clamp(ov,5,mach.max);m.ovBias=calOv(pr.machine);m.ov=clamp(m.ovModel+m.ovBias,5,mach.max+8);m.mach=mach;m.ovSrc='máquina';
 /* v18.3 · fora da mantecadora (soft, parado, moldado, raspado) o ar vem do processo da família, não da máquina;
    a calibração pelos lotes é separada por família */
 if(P.proc&&P.proc!=='batch'){m.ovModel=Math.round((P.ov[0]+P.ov[1])/2);m.ovBias=calOv('fam:'+st.tipo);m.ov=clamp(m.ovModel+m.ovBias,0,P.ov[1]+30);m.ovSrc='processo';}
 m.rhoMix=1/((m.wat/100)/1+(m.fat/100)/.93+((100-m.wat-m.fat)/100)/1.59);
 m.gPerL=m.rhoMix*1000/(1+m.ov/100);
 /* gordura sólida por temperatura (SFC) e desestabilização parcial da gordura */
 m.fatTypes={};for(const k in A.fatT)if(A.fat>0)m.fatTypes[k]=A.fatT[k]/A.fat*100;
 m.sfcAt=t=>{if(!(A.fat>0))return 0;let x=0;for(const k in A.fatT)x+=A.fatT[k]*sfcOf(k,t);return x/A.fat;};
 m.sfcVit=m.sfcAt(vit);m.sfcDraw=m.sfcAt(pr.drawT);m.sfcMouth=m.sfcAt(35);m.solidFatVit=m.fat*m.sfcVit/100;
 {let d=0;if(m.fat>1.5){d=8+2.4*(m.fat-4)+30*Math.min(1,(m.keyPct.mono||0)/.2)+8*Math.min(1,(m.keyPct.lec||0)/.3)+5*Math.min(1,m.yolkPct/4)
   -1.8*(m.prot-3.5)+1.4*(-9-pr.drawT)+.6*(pr.drawMin-10)+.2*(m.ov-30);
   if(m.sfcDraw>85)d*=.75;else if(m.sfcDraw<20)d*=1.25;d=clamp(d,0,90);}
  m.destab=d;m.oilOff=m.fat>4&&m.sfcDraw<20;}
 /* cristalização (heurística) */
 let ci=100;const cn=[];
 if(m.fzDraw<35){ci-=22;cn.push('pouca água congelada na saída');}else if(m.fzDraw<45){ci-=10;cn.push('saída da mantecadora um pouco quente');}
 if(pr.drawMin>15){ci-=8;cn.push('mantecação longa');}
 if(pr.blastT>-25){ci-=15;cn.push('abatedor pouco frio');}if(pr.hardMin>90){ci-=10;cn.push('abatimento lento');}
 if(m.hydro<P.stab[0]*.6&&!(m.sol>=P.sol[1]))	{ci-=10;cn.push('pouco estabilizante');}
 if(m.sol<P.sol[0]){ci-=Math.min(15,(P.sol[0]-m.sol)*3);cn.push('sólidos baixos');}
 const shock=Math.abs(pr.storeT-vit);if(shock>6){ci-=Math.min(12,(shock-6)*2);cn.push('choque térmico armazenamento↔vitrine');}
 m.ci=Math.round(clamp(ci,0,100));m.ciNotes=cn;m.crystal=Math.round(28+(100-m.ci)*.6);
 /* em casa, com o endurecimento calculado (conjunto de equipamentos): o cristal médio vem do quanto da água ainda congela
    fora da máquina e do tempo real até o centro chegar a −18 °C (crescimento ~logarítmico no tempo; 60 min = abatedor) */
 if(pr.hardAuto){let d=24+clamp((45-m.fzDraw)*.3,0,10)+clamp(6*Math.log2(Math.max(1,+pr.hardMin)/60),0,18)+(pr.drawMin>15?2:0);const cn2=[];
  if(m.fzDraw<35)cn2.push('só '+f0(m.fzDraw)+'% da água congela na mantecadora');if(+pr.hardMin>90)cn2.push('endurecimento de '+f1(+pr.hardMin/60)+' h no freezer');
  if(m.hydro<P.stab[0]*.6&&!(m.sol>=P.sol[1])){d+=6;cn2.push('pouco estabilizante');}
  if(m.sol<P.sol[0]){d+=Math.min(9,(P.sol[0]-m.sol)*1.8);cn2.push('sólidos baixos');}
  if(pr.serveFrom!=='pote'&&shock>6){d+=Math.min(7,(shock-6)*1.2);cn2.push('choque térmico armazenamento↔vitrine');}
  m.crystal=Math.round(d);m.ci=Math.round(clamp(100-(d-28)/.6,0,100));m.ciNotes=cn2;}
 /* derretimento */
 let mr=50;mr+=m.hydro>=P.stab[0]?15:-10;mr+=m.hasEmul?8:0;mr+=clamp((m.ov-20)*.6,-8,10);mr+=clamp((m.sol-34)*1.5,-10,10);mr-=clamp((m.fzMid-m.fzVit)*1.5,-10,15);
 m.melt=clamp(mr,0,100);
 /* nutrição por 100 g */
 const n={};n.fat=pc(A.fat);n.sat=pc(A.sat);n.trans=pc(A.tr);n.prot=pc(A.prot);
 n.sug=pc(A.suc+A.glu+A.fru+A.lac+A.tre+A.iso+A.gsSug);n.alu=pc(A.alu);n.add=pc(A.addSug);
 n.pol=pc(A.ery+A.sor+A.xyl+A.mlt+A.gly);n.fib=pc(A.fib+A.inu+A.fos);
 n.carb=pc(A.suc+A.glu+A.fru+A.lac+A.gs+A.tre+A.alu+A.iso+A.ery+A.sor+A.xyl+A.mlt+A.gly+A.oth+A.acd);
 n.na=(A.na+A.salt*393)/T*100;
 n.kcal=(4*(A.prot+A.suc+A.glu+A.fru+A.lac+A.gs+A.tre+A.iso+A.oth)+.4*A.alu+9*A.fat+2.4*(A.sor+A.xyl+A.mlt+A.gly)+2*(A.fib+A.inu+A.fos)+7*A.alc+3*A.acd)/T*100;
 n.kj=n.kcal*4.184;n.lacMg=pc(A.lac)*1000;m.nut=n;
 chemistry(m,st);
 m.costKg=A.tot?A.cost/A.tot*1000:0;m.costL=m.costKg*m.gPerL/1000;m.costPortion=m.costKg*(pr.portion||90)/1000;
 return m;
}

/* análise com memória: a chave inclui a versão do banco de ingredientes, da calibração e do estoque */
const _MEMO=new Map();
function analyze(st){let key;try{key=JSON.stringify([st.tipo,st.vit,st.recipe,st.proc,st.brix,st.costs,CAL.on?CAL.ver:-1,ING_VER,INVVER,DEX_FORM()]);}catch(e){return analyzeRaw(st);}
 const hit=_MEMO.get(key);if(hit)return hit;const m=analyzeRaw(st);_MEMO.set(key,m);if(_MEMO.size>400)_MEMO.delete(_MEMO.keys().next().value);return m;}

