/* ==== 56-atelie.js ==== */
/* ===================== CREATOR · LABORATÓRIO (v17) =====================
   1. Processo: história térmica da calda até a boca, etapa por etapa, com a microestrutura calculada
      pelo motor em cada temperatura (curva de congelamento, overrun, desestabilização da gordura,
      gordura sólida por SFC, cristal na saída e no endurecimento, mobilidade molecular por WLF).
   2. Cinética de hidratação dos hidrocoloides (temperatura × tempo, componente por componente).
   3. Ateliê criativo: harmonização por famílias de compostos aromáticos, explorador de variações
      balanceadas pelo motor e cartas de método criativo. */

/* ---------- 1. HIDRATAÇÃO: fração hidratada por temperatura e tempo ----------
   Gomas de hidratação a frio (guar, xantana, CMC, fibra de citros…) chegam perto de 100% em qualquer
   temperatura acima de ~15 °C, mais devagar no frio (Q10 ≈ 2). As de hidratação a quente (jataí, tara,
   carragena, pectina, amido, gelatina, konjac) têm uma fração solúvel a frio (c0) e o restante só
   dissolve perto da sua temperatura (curva logística). Hidratação não volta atrás ao resfriar. */
const HYD_C0={lbg:.25,tara:.45,carr:.3,pect:.35,gel:.15,starch:0,konj:.55,mono:.1};
function hydMax(k,T){const nc=NCOMP[k];if(!nc)return 1;const Th=nc.hyd;if(Th<=20)return clamp(.9+.1*T/20,.85,1);
 const c0=HYD_C0[k]!=null?HYD_C0[k]:.2;return c0+(1-c0)/(1+Math.exp(-(T-(Th-8))/2.5));}
function hydTau(k,T){const nc=NCOMP[k];const Th=nc?Math.max(20,nc.hyd):20;const t90=(Th<=20?600:90)*Math.pow(2,(Th-T)/10);return clamp(t90,20,6*3600)/Math.LN10;}
const holdS=pr=>Math.max(0,(+pr.pastHold||0)*(pr.pastHoldU==='min'?60:1));
/* simula aquecimento (2 °C/min a partir de 25 °C), patamar, resfriamento e maturação */
function hydRun(keys,prIn){const pr=Object.assign({},PROC0,prIn||{});
 const past=+pr.pastT,matT=+pr.matT,T0=25;const ramp=past>T0?(past-T0)/2*60:0,cool=Math.max(0,+pr.coolMin||0)*60,mat=Math.max(0,+pr.matH||0)*3600;
 const ph=[{n:'Aquecimento',d:ramp,T:f=>T0+(past-T0)*f},{n:'Patamar',d:holdS(pr),T:()=>past},{n:'Resfriamento',d:cool,T:f=>matT+(past-matT)*Math.exp(-4*f)},{n:'Maturação',d:mat,T:()=>matT}];
 const h={};for(const k in keys)h[k]=0;const samp=[{i:0,f:0,T:T0,h:{...h}}];const ends=[];
 ph.forEach((p,i)=>{const N=24;for(let s=1;s<=N;s++){const f=s/N,T=p.T(f),dt=p.d/N;
   for(const k in h){const hm=hydMax(k,T);if(hm>h[k]&&dt>0)h[k]+=(hm-h[k])*(1-Math.exp(-dt/hydTau(k,T)));}
   samp.push({i,f,T,h:{...h}});}ends.push({...h});});
 let w=0,hw=0;for(const k in keys){w+=keys[k];hw+=keys[k]*h[k];}
 return{h,samp,ph,ends,frac:w?hw/w:1,ramp,past};}
/* menor temperatura de pasteurização (no patamar atual) que hidrata ≥ 95% de cada componente */
function hydMinT(keys,pr){for(let T=40;T<=95;T++){const r=hydRun(keys,{...pr,pastT:T});if(Object.values(r.h).every(x=>x>=.95))return T;}return null;}
/* componentes de estabilização de uma receita (pela chave do ingrediente ou pelo blend) */
const NEUTRO_STD={lbg:.5,guar:.35,carr:.15};
function recipeHydKeys(st){const o={};const add=(k,w)=>{if(NCOMP[k]&&NCOMP[k].dose&&w>0)o[k]=(o[k]||0)+w;};
 (st.recipe||[]).forEach(r=>{const i=ING_BY[r.id];if(!i||!(+r.g>0))return;
  if(i.blend&&i.blend.parts){const sh=blendShares(i.blend.parts);for(const k in sh)add(k,+r.g*sh[k]/100);}
  else if(i.key==='neutro'){const f=i.id==='neutrod'?.5:1;for(const k in NEUTRO_STD)add(k,+r.g*f*NEUTRO_STD[k]);}
  else if(i.key&&NCOMP[i.key])add(i.key,+r.g);});
 return o;}

/* ---------- 2. PROCESSO: estado físico em cada etapa ---------- */
const PSTG=[['mix','Mistura'],['past','Pasteurização'],['mat','Maturação'],['mant','Mantecação'],['hard','Endurecimento'],['serv','Serviço'],['boca','Na boca']];
const PROC_SERV=5;
/* mobilidade molecular relativa a 45 °C: WLF a partir de Tg′ e Stokes-Einstein (D ∝ T/η) */
function mobility(m,T){const L=x=>{const d=x-m.tg;return d<=0?0:17.44*d/(51.6+d);};return Math.pow(10,L(T)-L(45))*(T+273.15)/318.15;}
/* viscosidade da calda acima de 0 °C (Andrade, B ≈ 2400 K, a partir do valor do motor a 4 °C) */
const viscAt=(m,T)=>(m.visc||30)*Math.exp(2400*(1/(T+273.15)-1/277.15));
function procCtx(st,m){const pr=m.pr;const pote=pr.serveFrom==='pote';const H=pote?hardenModel(m,pr):null;
 const keys=recipeHydKeys(st);const hy=Object.keys(keys).length?hydRun(keys,pr):null;
 const hAt=i=>{if(!hy)return 1;const e=hy.ends[i];let w=0,hw=0;for(const k in keys){w+=keys[k];hw+=keys[k]*e[k];}return w?hw/w:1;};
 const hMix=hy?(()=>{const s=hy.samp.find(x=>x.T>=45)||hy.samp[0];let w=0,hw=0;for(const k in keys){w+=keys[k];hw+=keys[k]*s.h[k];}return w?hw/w:1;})():1;
 return{pr,pote,H,keys,hy,hyd:[hMix,hAt(1),hAt(3)],dDraw:24+clamp((45-m.fzDraw)*.3,0,10)};}
function procSnap(st,m,u,C){C=C||procCtx(st,m);const pr=C.pr;const i=clamp(Math.floor(u),0,6),f=i===6&&u>=7?1:clamp(u-i,0,1),k=PSTG[i][0];
 const past=+pr.pastT,matT=+pr.matT,drawT=+pr.drawT,vit=+st.vit,fp=Math.min(-.5,m.fp||-2.5);
 const o={i,k,f,stage:PSTG[i][1],ov:0,destab:0,d:C.dDraw,shear:0,hyd:1,sfcK:1};
 if(k==='mix'){o.T=20+25*f;o.hyd=C.hyd[0]*f;o.t='dispersão a '+f0(o.T)+' °C';}
 else if(k==='past'){o.T=f<.7?45+(past-45)*f/.7:past;o.hyd=C.hyd[0]+(C.hyd[1]-C.hyd[0])*clamp(f/.85,0,1);o.t=f<.7?'aquecendo':'patamar '+fT(past)+' °C';}
 else if(k==='mat'){o.T=f<.25?matT+(past-matT)*Math.exp(-4*f/.25):matT;o.hyd=C.hyd[1]+(C.hyd[2]-C.hyd[1])*f;o.sfcK=f<.25?0:1-Math.exp(-(f-.25)/.75*(+pr.matH||0)*60/45);o.t=f<.25?'resfriando':'maturando · '+fT((+pr.matH||0)*(f-.25)/.75)+' h';}
 else if(k==='mant'){o.T=f<.3?matT+(fp-matT)*f/.3:fp+(drawT-fp)*Math.pow((f-.3)/.7,1.3);const e=(1-Math.exp(-4*f))/(1-Math.exp(-4));o.ov=m.ov*e;o.destab=m.destab*f*f;o.shear=1;o.d=C.dDraw*(.75+.25*f);o.t=f<.3?'resfriando até o ponto de congelamento':'gelo nucleando na parede do cilindro';}
 else if(k==='hard'){o.ov=m.ov;o.destab=m.destab;
  if(C.H&&C.H.tDone){const tm=f*C.H.tDone,cv=C.H.curve;let p=cv[cv.length-1];for(let j=1;j<cv.length;j++)if(cv[j].t>=tm){const a=cv[j-1],b=cv[j],g=(tm-a.t)/((b.t-a.t)||1);p={core:a.core+(b.core-a.core)*g};break;}o.T=p.core;}
  else{const tg=-18;o.T=drawT+(tg-drawT)*(1-Math.exp(-3*f))/(1-Math.exp(-3));}
  o.d=C.dDraw+(m.crystal-C.dDraw)*Math.sqrt(f);o.t='congelando a água restante';}
 else if(k==='serv'){o.T=vit;o.ov=m.ov;o.destab=m.destab;o.d=m.crystal;o.t=C.pote?'colher após '+f0(+pr.waitMin)+' min fora do freezer':'vitrine';}
 else{o.T=vit+(37-vit)*f;o.ov=m.ov*(1-.55*f);o.destab=m.destab;o.d=m.crystal*(1-.6*f);o.t=f<.5?'gelo fundindo na língua':'gordura derretendo · aroma liberado';}
 if(i>=3&&k!=='mant')o.hyd=C.hyd[2];if(k==='mant')o.hyd=C.hyd[2];
 o.fz=o.T<0?m.fz(o.T):0;
 o.sfc=m.sfcAt?m.sfcAt(o.T)*(k==='mat'?o.sfcK:k==='mix'||k==='past'?1:1):0;
 o.mob=mobility(m,o.T);o.visc=o.T>0?viscAt(m,o.T):null;
 return o;}
/* microestrutura na etapa: no Serviço é exatamente o modelo da vitrine; nas outras, o estado do processo */
function microAt(st,m,F,sc,days,u,C){const base=microModel(st,m,F,sc,days);if(u==null)u=PROC_SERV;C=C||procCtx(st,m);const s=procSnap(st,m,u,C);
 const o=Object.assign({},base);o.snap=s;o.stage=s.k;o.T=s.T;o.shear=s.shear;o.amp=clamp(Math.pow(s.mob,.11),.06,1.2);o.hydNet=s.hyd;o.net=base.net*clamp(s.hyd,0,1);
 o.fatSolid=clamp(s.sfc/100,0,1);
 if(s.k==='serv')return o;
 const phiAir=s.ov/(100+s.ov),iceVol=(m.wat/100)*(s.fz/100)/.917;o.phiAir=phiAir;o.phiIce=clamp(iceVol*m.rhoMix*(1-phiAir),0,.75);
 o.d=s.d;o.airD=AIR_D*(s.k==='mant'?.7+.3*s.f:s.k==='boca'?1+.8*s.f:1);o.destab=s.destab/100;
 o.butter=base.butter&&(s.k==='hard'||s.k==='boca'||(s.k==='mant'&&s.f>.7));o.nLac=s.k==='hard'?Math.round(base.nLac*.3):0;
 o.soft=s.k==='boca';o.hard=false;o.big=o.d>45;o.perfect=false;o.imbalance=0;o.bubbleStable=s.k==='boca'?false:base.bubbleStable;
 return o;}
/* texto do que acontece fisicamente, com os números do motor */
function procDesc(st,m,s,C){const pr=C.pr;const r=[];
 if(s.k==='mix')r.push('Os sólidos se dispersam na fase aquosa. Gordura em gotas líquidas ('+f0(s.sfc)+'% sólida a '+f0(s.T)+' °C); gomas de hidratação a frio já começam a prender água.');
 if(s.k==='past'){r.push('A '+fT(+pr.pastT)+' °C as gomas de hidratação a quente se desenrolam: rede '+f0(C.hyd[1]*100)+'% hidratada ao fim do patamar.');if(+pr.pastT>=72)r.push('As proteínas do soro começam a desnaturar e passam a reter mais água.');r.push('Gordura toda líquida.');}
 if(s.k==='mat'&&typeof matModel==='function'){const R=matModel(st,m);if(R)r.push('Maturação calculada para esta receita: ideal '+fT(Math.round(R.tIdeal[1]*2)/2)+' h a '+fT(Math.round(R.FT.mu*10)/10)+' °C (faixa '+fT(Math.round(R.tIdeal[0]*2)/2)+'–'+fT(Math.round(R.tIdeal[2]*2)/2)+' h); máximo '+(R.tMax[1]!=null?fT(Math.round(R.tMax[1]))+' h':'—')+'.');}
 if(s.k==='mat')r.push('No frio, a gordura cristaliza ('+f0(m.sfcAt?m.sfcAt(+pr.matT):0)+'% sólida a '+fT(+pr.matT)+' °C, alcançada em ~'+f0(Math.min(+pr.matH||0,2.5))+' h), as proteínas migram para a superfície das gotas e a viscosidade sobe para ≈'+f0(viscAt(m,+pr.matT))+' mPa·s. É isso que prepara a gordura para segurar o ar.');
 if(s.k==='mant')r.push('A calda atinge o ponto de congelamento ('+fT(m.fp)+' °C) e o gelo nucleia na parede fria do cilindro; a pá raspa os cristais para o centro. O ar entra até '+f0(m.ov)+'% de overrun e a agitação desestabiliza '+f0(m.destab)+'% da gordura, que forma a rede ao redor das bolhas. Na saída a '+fT(+pr.drawT)+' °C: '+f0(m.fzDraw)+'% da água congelada, cristais ≈'+f0(C.dDraw)+' µm.');
 if(s.k==='hard')r.push('Sem agitação, a água restante congela sobre os cristais existentes (eles crescem em vez de nuclear): '+f0(m.fz(-18))+'% congelada a −18 °C, cristal médio ≈'+f0(m.crystal)+' µm.'+(C.H&&C.H.tDone?' No pote de '+f0(+pr.poteMl)+' mL o centro chega a '+fT(C.H.target)+' °C em '+fT(C.H.tDone/60)+' h.':''));
 if(s.k==='serv')r.push('A '+fT(+st.vit)+' °C: '+f0(m.fzVit)+'% da água congelada, fase não congelada com '+f0(m.SE/(1-m.fzVit/100))+' de sólidos equivalentes. Mobilidade molecular ≈10^'+f1(Math.log10(Math.max(1e-12,s.mob)))+' da calda a 45 °C: é ela que governa a velocidade do crescimento dos cristais.');
 if(s.k==='boca')r.push('Na língua o gelo funde, a gordura sólida derrete ('+f0(m.sfcAt?m.sfcAt(35):0)+'% sólida a 35 °C) e as bolhas colapsam. Cristais abaixo de 50 µm não são percebidos; a gordura coalescida dá a sensação de creme e libera os aromas lipossolúveis.');
 return r.join(' ');}
function procDur(st,m,i,C){const pr=C.pr;
 return['~10 min',fT(+pr.pastT)+' °C · '+fT(holdS(pr))+' s',fT(+pr.matT)+' °C · '+fT(+pr.matH)+' h',f0(+pr.drawMin)+' min → '+fT(+pr.drawT)+'°',
  C.H&&C.H.tDone?fT(Math.round(C.H.tDone/6)/10)+' h':f0(+pr.hardMin)+' min',fT(+st.vit)+' °C','37 °C'][i];}
/* faixa da história térmica: temperatura × etapa, com cursor */
function procStrip(st,m,u,C){const W=640,H=132,L=34,R=8,T=18,B=30;const t0=-26,t1=Math.max(90,+C.pr.pastT+4);const n=7,sw=(W-L-R)/n;
 const sx=v=>L+v*sw,sy=v=>T+(1-(clamp(v,t0,t1)-t0)/(t1-t0))*(H-T-B);
 let g='';for(let i=0;i<n;i++){const on=Math.floor(u)===i;g+=`<rect x="${sx(i)+1}" y="${T}" width="${sw-2}" height="${H-T-B}" rx="6" fill="${on?'rgba(125,211,252,.10)':'rgba(255,255,255,.02)'}" data-a="procGo" data-v="${i}" style="cursor:pointer"/>`;
  g+=`<text x="${sx(i)+sw/2}" y="12" text-anchor="middle" font-size="10.5" fill="${on?'var(--ice)':'var(--t2)'}">${PSTG[i][1]}</text><text x="${sx(i)+sw/2}" y="${H-16}" text-anchor="middle" font-size="9" fill="var(--t3)">${esc(procDur(st,m,i,C))}</text>`;}
 [0,-18,+C.pr.pastT].forEach(v=>{g+=`<line x1="${L}" x2="${W-R}" y1="${sy(v)}" y2="${sy(v)}" stroke="var(--line2)" stroke-dasharray="2 4"/><text x="${L-4}" y="${sy(v)+3}" text-anchor="end" font-size="9" fill="var(--t3)">${f0(v)}°</text>`;});
 const pts=[];for(let i=0;i<n;i++)for(let s=0;s<=12;s++){const p=procSnap(st,m,i+s/12,C);pts.push(sx(i+s/12).toFixed(1)+','+sy(p.T).toFixed(1));}
 g+=`<polyline points="${pts.join(' ')}" fill="none" stroke="url(#thg)" stroke-width="2.2" stroke-linejoin="round"/>`;
 const cur=procSnap(st,m,u,C);g+=`<g id="procCur" transform="translate(${sx(u).toFixed(1)},0)"><line x1="0" x2="0" y1="${T}" y2="${H-B}" stroke="var(--ice)" stroke-width="1.2"/><circle id="procDot" cx="0" cy="${sy(cur.T).toFixed(1)}" r="4.5" fill="var(--ice)"/></g>`;
 return`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="História térmica do processo"><defs><linearGradient id="thg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fb923c"/><stop offset=".55" stop-color="#e6ecf4"/><stop offset="1" stop-color="#7dd3fc"/></linearGradient></defs>${g}</svg>`;}
function procHUD(s){return[s.stage+' · '+fT(s.T)+' °C · '+s.t,(s.fz>0?'gelo '+f0(s.fz)+'% da água · ':'')+(s.ov>0?'ar '+f0(s.ov)+'% · ':'')+(s.fz>0?'cristal '+f0(s.d)+' µm':s.visc?'calda ≈'+f0(s.visc)+' mPa·s':''),
 'gordura sólida '+f0(s.sfc)+'%'+(s.destab>0?' · desestabilizada '+f0(s.destab)+'%':'')+' · rede '+f0(s.hyd*100)+'% hidratada'];}

/* ---------- 3. AROMA: famílias de compostos por ingrediente (0–3) ----------
   Perfil aproximado pela literatura de química do sabor (compostos de impacto de cada matéria-prima),
   não é uma análise de cromatografia. Ordem das famílias em AFAM. */
const AFAM=[['lact','Lácteo · lactonas','δ-decalactona, diacetil'],['frut','Frutado · ésteres','acetato de isoamila, butirato de etila'],['citr','Cítrico','limoneno, citral'],['flor','Floral','linalol, geraniol, β-ionona'],['verd','Verde · herbáceo','hexanal, (Z)-3-hexenol'],['torr','Torrado','pirazinas, guaiacol'],['cara','Caramelo','furaneol, maltol, sotolon'],['baun','Baunilha · fenólico','vanilina, cumarina'],['espe','Especiado','eugenol, cinamaldeído'],['sulf','Sulfurado · umami','metional, tióis, glutamato'],['ferm','Fermentado · queijo','ácido butírico, metilcetonas'],['noz','Amendoado','benzaldeído']];
const AROMA_S={leite:'200000000000',leite15:'200000000000',cabra:'200000000020',ovelha:'200000000020',lpd:'200000100000',lpi:'200000100000',evaporado:'200000200000',cond:'300000200000',doceleite:'200001300000',
 creme35:'300000000000',creme45:'300000000000',creme40:'300000000000',creme20:'300000000000',manteiga:'300000100010',mascarpone:'300000000000',ricota:'200000000010',iogurte:'200000000020',grego:'200000000020',iogurte0:'200000000020',
 creamcheese:'200000000020',cremefr:'200000000020',burrata:'300000000000',stracchino:'200000000010',gorgonzola:'110000000131',roquefort:'110000000131',parmigiano:'110001100232',queijoovelha:'110000000231',
 gema:'200000000100',gemap:'200000000100',
 mascavo:'000001310000',demerara:'000000210000',mel:'010200210000',caramelo:'100001300000',toffee:'200001300001',agave:'000110100000',garapa:'000010100000',
 morango:'130110200000',framboesa:'020310100000',limao:'003110000000',laranja:'013100000000',sanguinea:'023100000000',manga:'121110001100',maracuja:'031100000200',banana:'030000011000',
 abacaxi:'031000200100',pessego:'320100000001',mirtilo:'020110001000',cereja:'020100010002',caqui:'110000100000',goiaba:'031020001200',cupuacu:'130000100110',acai:'100011001010',
 figo:'110000200001',pompelmo:'003010000100',cristal:'003000100000',butia:'131100000000',jabuticaba:'020010001010',cambuci:'022020000000',uvaia:'021100000000',cocopure:'300000010001',
 abacate:'100020000001',amora:'020110000010',cassis:'020110000300',groselha:'021010000000',damasco:'220200000001',lima:'003020000000',tangerina:'013100000000',tangerinaconc:'013100100000',
 melancia:'010020000000',melao:'020020000100',pera:'030010000000',maca:'020020000000',macasuco:'020020000000',marmelo:'020200100000',tamara:'010000300000',geleialaranja:'012000200000',
 frutaliof:'020200100000',mojitopure:'002030000000',acerola:'021010000000',caju:'020010001100',graviola:'131000000100',caja:'021010000100',pitanga:'010120002000',umbu:'022010000000',
 carambola:'021020000000',pitaya:'010010000000',lichia:'021300000000',mamao:'010100000110',cacaupolpa:'032100000000',bacuri:'120200000000',mangaba:'120000000010',uva:'030200000000',seriguela:'021000000000',
 pistache:'000012000003',pistachea:'000012100003',avela:'000003100003',amendoa:'000001010003',amendoim:'000003000102',macadamia:'100001000002',tahine:'000003000102',cocoralado:'200001000002',torrone:'000102200003',
 cacau:'010003101010',cacau10:'000003101010',choc70:'010003211010',choc64:'010003211010',choc55:'110003210010',choc80:'010003101010',massacacau:'010003101010',chocleite:'200002210000',chocbranco:'300000120000',gianduia:'100003200003',
 cococreme:'300000000001',cocoleite:'300000000001',cocooleo:'200000000001',azeite:'010030001001',aveia:'000001100001',amendoab:'000000000002',soja:'000011000001',
 rum:'010000211000',limoncello:'003000000000',vinsanto:'010000200002',vinho:'020000001010',espresso:'000003200110',cafesol:'000003200110',extratocafe:'000003200110',baunilhaext:'000100130000',fava:'000100130000',
 matcha:'000031000100',ervas:'001130001000',especiaria:'001100003000',espumante:'020000000010',cerveja:'000003200010',tonica:'002000000000',cointreau:'003000000000',licorfruta:'020000000000',baileys:'200000110000',
 vinhodoce:'020100100000',eiswein:'030100100000',
 salmao:'000001000210',tomate:'010020000100',alho:'000000000300',orapronobis:'000030000000',cenoura:'000110001000',pepino:'000030000000',milho:'100002100100',cogumelo:'000000000220',alhonegro:'000001300110',
 azuki:'000001100001',alfarroba:'000001200000',biscoito:'200001110000',foiegras:'200000000100',camarao:'000001000200',ouricomar:'000000000310',ostra:'000010000200',balsamico:'010000200020'};
/* bases neutras não entram como sugestão (não criam sabor novo) */
const ABASE=new Set(['leite','leite15','leite0','lpd','lpi','evaporado','creme35','creme45','creme40','creme20','gemap','cocooleo','cocoleite','amendoab','soja','aveia','agua']);
/* >>> BR aromas */ Object.assign(AROMA_S,{"abiu": "110100000000", "acerolapc": "021010000000", "ameixa": "020110000010", "atemoia": "131100000000", "bananaprata": "030000011000", "bananananica": "030000011000", "cajamanga": "021010000100", "cajapc": "021010000100", "cajupc": "020010001100", "cupuacupc": "130000100110", "graviolapc": "131000000100", "jaca": "131000010000", "jamelao": "020010001010", "kiwi": "021020000000", "laranjapera": "013100000000", "limaocravo": "003110000100", "limaogalego": "003110000000", "mexerica": "013100000000", "nespera": "121100000000", "pinha": "131100000000", "roma": "021110000010", "tamarindo": "021000300010", "mamaopapaia": "010100000110", "mangapc": "121110001100", "maracujapc": "031100000200", "pitangapc": "010120002000", "umbupc": "022010000000", "uvaitalia": "030200000000", "uvasuco": "030200000010", "pequi": "110001000202", "goiabada": "031020101200", "bananada": "030000211000", "doceabobora": "010000201100", "rapadura": "000001310000", "melado": "000001310000", "cocadabranca": "200001100002", "requeijao": "200000000020", "minasfrescal": "200000000020", "leitefermentado": "110000000020", "manteigasal": "300000100010", "achocolatado": "100002210000", "cocofresco": "200001000002", "castanhapara": "100001000003", "castanhacaju": "100002000003", "nozes": "000002000013", "cafecoado": "000003200110", "chamate": "000031100000", "acucarcoco": "000001300001", "leitezero": "200000000000", "cremeuht17": "300000000000", "nata": "300000000000", "kefir": "110000000030", "ghee": "200001100010", "choc85": "010003101010", "chocruby": "121100100000", "chocblond": "200001300000", "fracionada": "100002210000", "nibs": "010003101012", "cacaunat": "010003101010", "baru": "000003000103", "pecan": "000002100013", "pracaju": "000002300003", "pravela": "000003300003", "pacoca": "000003100102", "bebcaju": "000001000002", "bebcoco": "200000000001", "cremecaju": "100002000003", "cachaca": "010010101000", "licorcafe": "000003200110", "amaretto": "000100100003", "cremecacau": "010002210000", "porto": "020000200012", "gengibre": "002000003000", "cumaru": "000100031003", "hibisco": "021100000000", "brigadeiro": "200002310000", "beijinho": "300001100002", "biscoitorecheado": "100002210000"}); /* <<< BR aromas */
const AROMA={};for(const k in AROMA_S)AROMA[k]=AROMA_S[k].split('').map(Number);
/* impacto aromático por grama (extratos e especiarias são muito mais potentes que leite ou fruta) */
const AIMP_ID={baunilhaext:40,fava:60,especiaria:60,ervas:25,matcha:12,espresso:3,cafesol:20,extratocafe:15,alho:30,cacau:3,cacau10:3,massacacau:2.5,balsamico:6,alhonegro:5,gorgonzola:3,roquefort:3,parmigiano:3,ouricomar:4,salmao:3,cristal:3,frutaliof:4,rum:4,cointreau:4,limoncello:2,azeite:4,tahine:2};
const AIMP_CAT={'Lácteos':.12,'Ovos':.2,'Açúcares':.6,'Frutas':1,'Oleaginosas':1.6,'Cacau':1.8,'Vegetais e gorduras':.5,'Bebidas e aromas':1.5,'Gastronômicos':1.6};
const aImp=i=>AIMP_ID[i.id]!=null?AIMP_ID[i.id]:AIMP_CAT[i.cat]||0;
/* dose de teste (g por kg de calda) de um ingrediente novo */
const ADOSE_ID={baunilhaext:4,fava:1.5,especiaria:1.5,ervas:6,matcha:12,sal:2,alho:3,espresso:120,cafesol:10,extratocafe:15,rum:25,limoncello:40,cointreau:25,cacau:30,cacau10:30,balsamico:15,alhonegro:30,tonica:100,cerveja:120,vinho:120,espumante:120,eiswein:100,vinhodoce:100,vinsanto:80,
 gorgonzola:50,roquefort:40,parmigiano:40,salmao:30,ouricomar:25,ostra:30,camarao:50,foiegras:60,azeite:40,tahine:60,gema:40,cristal:30,geleialaranja:60,tamara:60,frutaliof:20,toffee:40,caramelo:60,doceleite:120,mascavo:40,mel:40,biscoito:50,torrone:60};
const ADOSE_CAT={'Frutas':150,'Oleaginosas':70,'Cacau':45,'Lácteos':80,'Açúcares':40,'Bebidas e aromas':30,'Gastronômicos':40,'Vegetais e gorduras':40,'Ovos':40};
const aDose=i=>ADOSE_ID[i.id]||ADOSE_CAT[i.cat]||30;
/* perfil aromático da receita: soma ponderada por massa × impacto, com compressão psicofísica (log) */
function aromaProfile(recipe,flavorOnly){const raw=AFAM.map(()=>0);let any=0;
 const use=(recipe||[]).filter(r=>!flavorOnly||!ABASE.has(r.id));const L=use.some(r=>AROMA[r.id]&&aImp(ING_BY[r.id]||{})>0)?use:(recipe||[]);
 L.forEach(r=>{const i=ING_BY[r.id],v=AROMA[r.id];if(!i||!v||!(+r.g>0))return;const w=+r.g*aImp(i);v.forEach((x,k)=>{raw[k]+=x*w;});any+=w;});
 if(!any)return null;const tot=(recipe||[]).reduce((a,r)=>a+(+r.g||0),0)||1;const p=raw.map(x=>Math.pow(x/tot,.6)); /* lei de Stevens (expoente ≈ 0,6 para odor) */const mx=Math.max(...p)||1;return p.map(x=>x/mx);}
const vNorm=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);};
const vCos=(a,b)=>{const x=vNorm(a),y=vNorm(b);return x.reduce((s,v,k)=>s+v*y[k],0);};
/* gosto básico (não aroma): ácido, amargo, salgado, gordura, doce — o equilíbrio que o chef busca */
const ABITTER={cacau:1,cacau10:.8,massacacau:1,choc80:.9,choc70:.75,choc64:.6,choc55:.45,espresso:1,cafesol:1,extratocafe:1,matcha:.8,pompelmo:.7,tonica:.8,cerveja:.7,alhonegro:.3,balsamico:.2,azeite:.3,ervas:.3,especiaria:.4,cristal:.3};
function tasteOf(i){const c=i.c||{};const sug=(c.suc||0)+(c.glu||0)+(c.fru||0)+(c.lac||0)+(c.gs||0)*.5;return[clamp((c.acd||0)/3,0,1),ABITTER[i.id]||0,clamp((c.salt||0)/1.5,0,1),clamp((c.fat||0)/40,0,1),clamp(sug/60,0,1)];}
function recipeTaste(recipe){const tot=(recipe||[]).reduce((a,r)=>a+(+r.g||0),0)||1;const t=[0,0,0,0,0];
 (recipe||[]).forEach(r=>{const i=ING_BY[r.id];if(!i)return;const c=i.c||{},g=+r.g/tot;t[0]+=g*(c.acd||0);t[1]+=g*(ABITTER[r.id]||0);t[2]+=g*(c.salt||0);t[3]+=g*(c.fat||0);t[4]+=g*((c.suc||0)+(c.glu||0)+(c.fru||0)+(c.lac||0)+(c.gs||0)*.5+(c.alu||0)*.7+(c.ery||0)*.7);});
 return[clamp(t[0]/.8,0,1),clamp(t[1]/.06,0,1),clamp(t[2]/.3,0,1),clamp(t[3]/12,0,1),clamp(t[4]/20,0,1)];}
/* complemento de gosto: ácido corta gordura e doce, gordura arredonda ácido e amargo, sal levanta doce e gordura */
function tasteComp(c,R){return clamp(Math.max(c[0]*((R[3]+R[4])/2)*(1-R[0]),c[3]*Math.max(R[0],R[1]),c[2]*((R[4]+R[3])/2)*(1-R[2])*1.2,c[1]*R[4]*(1-R[1])*.9,c[4]*Math.max(R[0],R[1])*.6),0,1);}
/* ingredientes quase iguais contam uma vez por lista (o chef quer caminhos diferentes, não 4 chocolates) */
const AGRP={};[['cacau','cacau10','massacacau','choc80','choc70','choc64','choc55'],['espresso','cafesol','extratocafe'],['limao','lima'],['tangerina','tangerinaconc'],['laranja','sanguinea'],['pistache','pistachea'],['iogurte','grego','iogurte0'],['cococreme','cocoleite','cocopure','cocoralado'],['vinhodoce','eiswein','vinsanto'],['gorgonzola','roquefort'],['maca','macasuco'],['mascavo','demerara','garapa'],['amendoim','tahine'],['gema','gemap'],['creamcheese','cremefr','mascarpone'],['frutaliof','framboesa']].forEach(g=>g.forEach(id=>AGRP[id]=g[0]));
const ACAT_W={'Açúcares':.8,'Bebidas e aromas':.95};
/* acentos de gosto: entram pelo gosto básico, mesmo sem ponte aromática (sal no caramelo, ácido no creme) */
const AACC=['sal','citrico','balsamico','limao','especiaria','ervas','cacau','espresso','pompelmo','cristal','iogurte','tonica'];
/* ---------- TRADIÇÃO + ANALOGIA ----------
   Grafo de combinações consagradas (PAIRS, simétrico). Ingrediente fora do grafo herda as combinações do
   vizinho aromático mais parecido (analogia: tangerina ≈ laranja → combina com chocolate). */
let _PG=null;
function pairGraph(){if(_PG)return _PG;const G={};const add=(a,b,lab)=>{if(!a||!b||a===b)return;(G[a]=G[a]||{})[b]=1;};
 for(const a in PAIRS)PAIRS[a].forEach(([b])=>{if(b){add(a,b);add(b,a);}});
 for(const id in AGRP){const g=AGRP[id];if(G[g]&&!G[id])G[id]=Object.assign({},G[g]);if(G[id]&&!G[g])G[g]=Object.assign({},G[id]);}
 _PG=G;return G;}
function tradScores(recipe){const G=pairGraph();const flav=(recipe||[]).filter(r=>AROMA[r.id]&&!ABASE.has(r.id)&&ING_BY[r.id]&&aImp(ING_BY[r.id])>=.5);const out={};
 flav.forEach(r=>{const x=r.id;let srcs=[];if(G[x])srcs.push([x,1]);
  else{const vx=AROMA[x];const cand=Object.keys(G).filter(a=>AROMA[a]&&a!==x).map(a=>[a,vCos(vx,AROMA[a])*(ING_BY[a]&&ING_BY[x]&&ING_BY[a].cat===ING_BY[x].cat?1:.85)]).sort((p,q)=>q[1]-p[1]).slice(0,2).filter(p=>p[1]>=.75);srcs=cand;}
  srcs.forEach(([a,w])=>{for(const c in G[a]){const sc=w;if(!out[c]||out[c].s<sc)out[c]={s:sc,from:x,via:a===x?null:a};}});});
 return out;}
function aromaPairs(recipe,limit){const R=aromaProfile(recipe,true);if(!R)return null;const inRec=new Set((recipe||[]).map(r=>r.id));const lim=limit||6;const RT=recipeTaste(recipe);
 const fam=v=>v.map((x,k)=>[x,k]);const out=[];const grpIn=new Set([...inRec].map(id=>AGRP[id]).filter(Boolean));
 for(const id in AROMA){if(inRec.has(id)||!ING_BY[id]||ABASE.has(id)||(AGRP[id]&&grpIn.has(AGRP[id])))continue;const v=AROMA[id];const c=v.map(x=>x/3);const cs=c.reduce((a,b)=>a+b,0)||1;
  const cos=vCos(R,c),ov=c.reduce((a,x,k)=>a+Math.min(x,R[k]),0)/cs;const w=ACAT_W[ING_BY[id].cat]||1;const sim=(.55*cos+.45*ov)*w;
  const shared=fam(c).filter(([x,k])=>x>=.33&&R[k]>=.3).sort((a,b)=>b[0]*R[b[1]]-a[0]*R[a[1]]).map(([,k])=>k);
  const fresh=fam(c).filter(([x,k])=>x>=.6&&R[k]<.5).sort((a,b)=>(b[0]-R[b[1]])-(a[0]-R[a[1]])).map(([,k])=>k);
  const lift=c.reduce((a,x,k)=>a+Math.max(0,x-R[k]),0)/cs;
  const bridge=shared.length?Math.max(...shared.map(k=>Math.min(c[k],R[k]))):0;const comp=tasteComp(tasteOf(ING_BY[id]),RT);
  const contrast=bridge>=.25&&fresh.length?(bridge*.45+lift*.35+comp*.2)*w:0;
  out.push({id,sim,shared,fresh,bridge,comp,contrast});}
 const div=(L,cap)=>{const c={},g=new Set(),r=[];for(const x of L){const k=ING_BY[x.id].cat,gr=AGRP[x.id]||x.id;if((c[k]||0)>=(cap||3)||g.has(gr))continue;c[k]=(c[k]||0)+1;g.add(gr);r.push(x);if(r.length>=lim)break;}return r;};
 const T=tradScores(recipe);const trad=div(Object.keys(T).filter(id=>ING_BY[id]&&!inRec.has(id)&&!ABASE.has(id)&&!(AGRP[id]&&grpIn.has(AGRP[id]))).map(id=>({id,...T[id]})).sort((a,b)=>b.s-a.s),5).map(x=>({...x,sim:x.s}));
 const inT=new Set(trad.map(x=>AGRP[x.id]||x.id));
 const harm=div(out.filter(x=>x.shared.length&&!inT.has(AGRP[x.id]||x.id)).sort((a,b)=>b.sim-a.sim));
 const cont=div(out.filter(x=>x.contrast>0&&!harm.includes(x)&&!inT.has(AGRP[x.id]||x.id)).sort((a,b)=>b.contrast-a.contrast));
 const acc=AACC.filter(id=>ING_BY[id]&&!inRec.has(id)&&!(AGRP[id]&&grpIn.has(AGRP[id]))).map(id=>({id,comp:tasteComp(tasteOf(ING_BY[id]),RT),taste:tasteOf(ING_BY[id])})).filter(x=>x.comp>=.3).sort((a,b)=>b.comp-a.comp).slice(0,4);
 return{R,RT,harm,cont,acc,trad};}
function aromaWheel(R,C){const S0=220,c=S0/2,r0=78;const n=AFAM.length;const pt=(k,v)=>{const a=-Math.PI/2+k/n*2*Math.PI;return[c+Math.cos(a)*r0*v,c+Math.sin(a)*r0*v];};
 let g='';[.33,.66,1].forEach(v=>{g+=`<polygon points="${AFAM.map((_,k)=>pt(k,v).map(x=>x.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="var(--line)" stroke-width="1"/>`;});
 AFAM.forEach((f,k)=>{const[x,y]=pt(k,1.18);const[x2,y2]=pt(k,1);g+=`<line x1="${c}" y1="${c}" x2="${x2}" y2="${y2}" stroke="var(--line)"/><text x="${x}" y="${y+3}" text-anchor="middle" font-size="8.6" fill="${R&&R[k]>.5?'var(--t1)':'var(--t3)'}">${f[1].split(' · ')[0]}</text>`;});
 if(R)g+=`<polygon points="${R.map((v,k)=>pt(k,Math.max(.03,v)).map(x=>x.toFixed(1)).join(',')).join(' ')}" fill="rgba(125,211,252,.22)" stroke="var(--ice)" stroke-width="1.6"/>`;
 if(C)g+=`<polygon points="${C.map((v,k)=>pt(k,Math.max(.03,v)).map(x=>x.toFixed(1)).join(',')).join(' ')}" fill="rgba(251,146,60,.12)" stroke="#fb923c" stroke-width="1.6" stroke-dasharray="4 3"/>`;
 return`<svg viewBox="-14 -6 ${S0+28} ${S0+12}" style="width:100%;max-width:300px;height:auto;display:block;margin:auto" role="img" aria-label="Roda aromática da receita">${g}</svg>`;}


/* ---------- BALANCEADOR DO LABORATÓRIO ----------
   Para o que o balanceador clássico não cobre (gastronômico salgado, sem açúcar, álcool alto, sólidos fora
   da faixa): escolhe as alavancas pelo tipo da receita e minimiza, no motor completo, o desvio de
   congelamento, doçura e sólidos + alertas estruturais, com a menor mudança possível na receita.
   Busca por padrões com passo adaptativo (movimentos simples e trocas entre pares). */
const LAB_POLY=['eritritol','alulose','xilitol','maltitol','sorbitol','inulina','fibramilho','fos'];
function labLevers(st){const rec=st.recipe||[];const has=id=>rec.some(r=>r.id===id);const tot=rec.reduce((a,r)=>a+(+r.g||0),0)||1;const L=[];
 const add=(id,kind,lo,hi,sc)=>{if(ING_BY[id]&&!L.some(l=>l.id===id))L.push({id,kind,lo:lo||0,hi:hi!=null?hi:tot*.45,sc:sc||1});};
 const dairy=rec.some(r=>ING_BY[r.id]&&ING_BY[r.id].cat==='Lácteos');
 if(tbase(st.tipo)==='semacucar'){['eritritol','alulose','fibramilho'].forEach(id=>add(id,'sug'));rec.forEach(r=>{if(LAB_POLY.includes(r.id))add(r.id,'sug');});add(has('stevia')?'stevia':'sucralose','hi',0,tot*.0006,.004);}
 else if(tbase(st.tipo)==='gastro'){[dexPref(st),'trealose','glicose38'].forEach(id=>add(id,'sug'));if(has('sacarose'))add('sacarose','sug');add('sal','salt',0,tot*.008,.08);}
 else{add('sacarose','sug');add(dexPref(st),'sug');add('glicose38','sug');}
 rec.forEach(r=>{if(BAL_SUG.has(r.id)&&tbase(st.tipo)!=='semacucar')add(r.id,'sug');});
 if(dairy&&tbase(st.tipo)!=='vegan')add('lpd','sol',0,tot*.08);else if(tbase(st.tipo)!=='semacucar')add('malto','sol',0,tot*.12);
 rec.forEach(r=>{const i=ING_BY[r.id];if(i&&(i.c.alc||0)>0)add(r.id,'alc',+r.g*.55,+r.g);});
 const BASEL=['agua','leite','leite15','leite0','aveia','amendoab','soja','arrozb','cocoleite','aguacoco'];const liq=rec.filter(r=>{const i=ING_BY[r.id];return i&&!L.some(l=>l.id===r.id)&&(i.c.w||0)>=85&&!(i.c.alc>0);}).sort((a,b)=>(BASEL.includes(b.id)-BASEL.includes(a.id))||b.g-a.g)[0];
 const lid=liq?liq.id:(dairy?'leite':'agua');const lg=liq?+liq.g:0;add(lid,'liq',lg*.6,lg+tot*.3);
 /* teto de custo: o creme (o lácteo mais caro por kg) pode ceder até 25% para o leite, dentro da faixa de gordura */
 if(+st.costCap>0){const cr=rec.filter(r=>/^creme(20|35|40|45)$/.test(r.id)).sort((a,b)=>b.g-a.g)[0];if(cr&&L.length<8)L.splice(Math.min(L.length,7),0,{id:cr.id,kind:'fat',lo:+cr.g*.75,hi:+cr.g,sc:1});}
 return L.slice(0,8);}
function labLoss(m,F,x0,x,tot,L){const P=m.P;const d=(v,r)=>v<r[0]?r[0]-v:v>r[1]?v-r[1]:0;const mid=r=>(r[0]+r[1])/2;
 let l=Math.pow((m.fzVit-m.fzMid)/1.2,2)+1.6*Math.pow(d(m.pod,P.pod),2)+.25*Math.pow((m.pod-mid(P.pod))/(P.pod[1]-P.pod[0]||1),2)+Math.pow(d(m.sol,P.sol)/1.2,2);
 F.forEach(f=>{if(f.sev==='crit')l+=25;else if(f.sev==='warn'&&['Térmico','Doçura','Sólidos','Lactose'].includes(f.area))l+=2.5;});
 L.forEach((v,i)=>{const dx=Math.abs(x[i]-x0[i])/tot*100;l+=dx*(v.kind==='liq'?.35:v.kind==='alc'?.6:v.kind==='sol'?.25:v.kind==='salt'?1.5:v.kind==='hi'?40:v.kind==='fat'?.3:.08);if(v.kind==='fat')l+=4*Math.pow(d(m.fat,P.fat),2);if(x0[i]>0&&x[i]<.3&&v.kind!=='liq')l+=4;});
 return l;}
function balanceLab(st,maxE){maxE=maxE||900;const rec=(st.recipe||[]).filter(r=>ING_BY[r.id]&&+r.g>0);if(rec.length<2)return{ok:false,msg:'Monte a receita primeiro.'};
 const L=labLevers(st);const tot=rec.reduce((a,r)=>a+ +r.g,0);const ids=new Set(L.map(l=>l.id));const base=rec.filter(r=>!ids.has(r.id));
 const x0=L.map(l=>{const r=rec.find(q=>q.id===l.id);return r?+r.g:0;});
 const build=x=>base.concat(L.map((l,i)=>({id:l.id,g:l.sc<.05?Math.round(x[i]*1000)/1000:Math.round(x[i]*10)/10})).filter((r,i)=>r.g>=(L[i]&&L[i].sc<1?.001:.3)));
 /* na busca, o modo pote vira vitrine na mesma temperatura (mesmo congelamento; sem as simulações térmicas do pote, que não mudam com os açúcares) */
 const stF=st.proc&&(st.proc.serveFrom==='pote'||st.proc.hardAuto)?{...st,proc:{...st.proc,serveFrom:'vitrine',hardAuto:0}}:st;
 let evals=0;const f=x=>{evals++;const s2={...stF,recipe:build(x)};const m=analyze(s2);if(m.empty)return 1e9;const cap=+st.costCap||0;return labLoss(m,diagnose(s2,m),x0,x,tot,L)+(cap>0&&m.costKg>cap?Math.pow((m.costKg-cap)/cap*80,2):0);};
 let x=x0.slice(),best=f(x);const l0=best;let step=tot*.04;
 while(step>tot*.0006&&evals<maxE){let imp=false;
  for(let i=0;i<L.length;i++)for(const dir of[1,-1]){const y=x.slice();y[i]=clamp(y[i]+dir*step*L[i].sc,L[i].lo,L[i].hi);if(y[i]===x[i])continue;const v=f(y);if(v<best-1e-6){best=v;x=y;imp=true;}}
  if(!imp)for(let i=0;i<L.length;i++)for(let j=0;j<L.length;j++){if(i===j)continue;const y=x.slice();y[i]=clamp(y[i]+step*L[i].sc,L[i].lo,L[i].hi);y[j]=clamp(y[j]-step*L[j].sc,L[j].lo,L[j].hi);const v=f(y);if(v<best-1e-6){best=v;x=y;imp=true;}}
  if(!imp)step/=2;}
 /* limpeza: resíduos de alavanca (< 0,3% do lote) somem se não pioram a receita */
 L.forEach((l,i)=>{if(x[i]>0&&x[i]<tot*.003&&l.lo===0&&l.sc>=.05){const y=x.slice();y[i]=0;const v=f(y);if(v<=best+.3){x=y;best=Math.min(best,v);}}});
 const newRecipe=build(x);const m1=analyze({...st,recipe:newRecipe});const F1=diagnose({...st,recipe:newRecipe},m1);
 const prop=L.map((l,i)=>({id:l.id,g:x[i]})).filter((p,i)=>Math.abs(x[i]-x0[i])>=.3);const cur=prop.map(p=>x0[L.findIndex(l=>l.id===p.id)]);
 if(!prop.length)return{ok:false,msg:'A receita já está no melhor ponto que as alavancas disponíveis alcançam.',lab:1};
 return{ok:best<l0-.05,mode:'lab',lab:1,prop,cur,newRecipe,m1,loss:best,loss0:l0,evals,crit:F1.filter(q=>q.sev==='crit').length,msg:best<l0-.05?'':'Nenhuma combinação melhora a receita.'};}
/* Testar um sabor do ateliê como um gelatiere faria: o sabor entra na dose sugerida; se for líquido (café, suco, infusão),
   ocupa o lugar da mesma quantidade de água do líquido-base (água, leite…), para não diluir gordura e sólidos;
   depois o balanceador completo acerta açúcares e sólidos, e o lote volta ao peso original. */
const AT_LIQ=['agua','leite','leite15','leite0','aveia','amendoab','soja','arrozb','cocoleite','aguacoco'];
function atAddBalanced(st,id){const i=ING_BY[id];if(!i)return null;const orig=st.recipe||[];const rec=orig.map(r=>({...r}));const T0=rec.reduce((a,r)=>a+(+r.g||0),0)||1000;
 const g=Math.round(aDose(i)*T0/1000*10)/10;const ex=rec.find(r=>r.id===id);if(ex)ex.g=Math.round((+ex.g+g)*10)/10;else rec.push({id,g});const wI=(i.c.w||0)/100;let swap=false;
 if(wI>=.6&&!(i.c.alc>0)){const car=rec.filter(r=>r.id!==id&&AT_LIQ.includes(r.id)).sort((a,b)=>AT_LIQ.indexOf(a.id)-AT_LIQ.indexOf(b.id))[0];
  if(car){const wC=(ING_BY[car.id].c.w||0)/100||1;const d=Math.min(+car.g*.5,g*wI/wC);if(d>=.5){car.g=Math.round((+car.g-d)*10)/10;swap=true;}}}
 let out=rec,bal=null;try{const b=balanceBest({...st,recipe:rec});if(b&&b.ok){out=b.newRecipe;bal=true;}else bal=(b&&b.msg)||'nenhum ajuste melhora';}catch(e){bal='não foi possível calcular';}
 const T1=out.reduce((a,r)=>a+(+r.g||0),0);if(T1>0&&Math.abs(T1-T0)>.5){const k=T0/T1;out=out.map(r=>({...r,g:Math.round(+r.g*k*10)/10}));}
 const gO=(R,x)=>{const q=R.find(r=>r.id===x);return q?+q.g:0;};const nm2=x=>ING_BY[x].n.split(' (')[0].replace(/ \d.*$/,'').toLowerCase();
 const ch=[...new Set([...orig,...out].map(r=>r.id))].filter(x=>x!==id&&Math.abs(gO(orig,x)-gO(out,x))>=.5).sort((x,y)=>Math.abs(gO(out,y)-gO(orig,y))-Math.abs(gO(out,x)-gO(orig,x)));
 const msg=i.n+' +'+fT(Math.round(gO(out,id)-gO(orig,id)))+' g'+(ch.length?' · '+ch.slice(0,4).map(x=>nm2(x)+' '+(gO(out,x)>gO(orig,x)?'+':'−')+fT(Math.round(Math.abs(gO(out,x)-gO(orig,x))))+' g').join(', '):'')+
  (bal===true?' · rebalanceada':' · sem rebalanceamento ('+bal+')')+', lote mantido em '+fT(Math.round(T0))+' g';
 return{recipe:out,msg,swap,balanced:bal===true};}
/* índice contínuo para comparar criações finas (o índice oficial satura em 100) */
function fineScore(st,m,F){if(m.empty)return 0;const sc=score(st,m,F);let q=sc.parts.reduce((s,p)=>s+p[1]*p[2],0);const crit=F.filter(f=>f.sev==='crit').length;if(crit)q=Math.min(q,62-crit*4);
 q-=Math.abs(m.fzVit-m.fzMid)*.25+(m.P.crystal==='coarse'?0:Math.max(0,m.crystal-30)*.12+Math.max(0,7-Math.min(m.shelfVit,30))*.25)+F.filter(f=>f.sev==='warn').length*.6;return Math.round(q*10)/10;}
/* o melhor entre o balanceador clássico e o do laboratório (pelo índice contínuo) */
function balanceBest(st,maxE){const pote=st.proc&&st.proc.serveFrom==='pote';let a=null;try{a=pote?balancePote(st):balance(st);}catch(e){a=null;}
 const ev=r=>{const s2=stReal({...st,recipe:r});const m=analyze(s2);return fineScore(s2,m,diagnose(s2,m));};
 const qa=a&&a.ok?ev(a.newRecipe):-1e9;
 const capOK=r=>!(+st.costCap>0)||(r&&r.length&&analyze(stReal({...st,recipe:r})).costKg<=+st.costCap*1.005);
 if(a&&a.ok&&qa>=90&&capOK(a.newRecipe))return a;
 let b=balanceLab(pote?{...st,vit:poteServeTemp(st)}:st,maxE);
 if(pote&&b.ok){const v=poteServeTemp({...st,recipe:b.newRecipe});const b2=balanceLab({...st,vit:v,recipe:b.newRecipe},maxE);if(b2.ok)b=b2;b.ok=true;}
 if(b.ok){const g=(R,id)=>{const r=(R||[]).find(q=>q.id===id);return r?+r.g:0;};const ids=[...new Set([...(st.recipe||[]),...b.newRecipe].map(r=>r.id))].filter(id=>Math.abs(g(st.recipe,id)-g(b.newRecipe,id))>=.3);
  b.prop=ids.map(id=>({id,g:g(b.newRecipe,id)}));b.cur=ids.map(id=>g(st.recipe,id));}
 if(b.ok){b.m1=analyze(stReal({...st,recipe:b.newRecipe}));const qb=ev(b.newRecipe);b.q=qb;
  const F1=diagnose(stReal({...st,recipe:b.newRecipe}),b.m1);const cr=F1.filter(f=>f.sev==='crit').length;
  b.note='Balanceador do laboratório'+(a&&!a.ok?' (o clássico não cobre este caso)':'')+': ajustou '+b.prop.map(p=>ING_BY[p.id].n.split(' (')[0].toLowerCase()).join(', ')+'.'+(cr?' Melhor compromisso possível; ainda resta '+cr+' alerta crítico — veja o laudo.':'');
  if(pote)b.poteVit=poteServeTemp({...st,recipe:b.newRecipe});
  if(qb>qa+.3||(+st.costCap>0&&!(a&&a.ok&&capOK(a.newRecipe))&&capOK(b.newRecipe)))return b;}
 return a&&a.ok?a:b.ok?b:(a||b);}


/* ---------- PERFIL SENSORIAL PREVISTO (0–100) ----------
   Traduz o motor em eixos de prova: doçura percebida na temperatura de serviço (a percepção cai ~1,5% por °C
   abaixo de −12), firmeza à colher (água congelada), cremosidade (gordura, sólidos e cristal), resistência ao
   derretimento, aroma liberado (volatilidade na temperatura), acidez e sal. É previsão: valide no Painel cego. */
const SENS_AX=[['doce','Doçura','Doçura percebida'],['firme','Firmeza','Firmeza à colher'],['creme','Cremosidade','Cremosidade'],['derr','Derretimento','Resistência ao derretimento'],['aroma','Aroma','Aroma liberado no frio'],['acido','Acidez','Acidez'],['sal','Salgado','Salgado']];
function sensProfile(m){if(!m||m.empty)return null;const v=+m.vit;
 return{doce:clamp(m.pod*(1+.015*(v+12))/30*100,0,100),firme:clamp((m.fzVit-58)/24*100,0,100),creme:clamp(m.fat*3.2+(m.sol-26)*2.6+(45-m.crystal)*1.3,0,100),
  derr:clamp(m.melt||0,0,100),aroma:clamp((m.aromaTemp||0)*100-(m.fzVit-70)*1.5,0,100),acido:clamp((m.acd||0)/1.4*100,0,100),sal:clamp((m.salt||0)/.8*100,0,100)};}
function sensRadar(a,b){const S0=230,c=S0/2,r0=80,n=SENS_AX.length;const pt=(k,v)=>{const g=-Math.PI/2+k/n*2*Math.PI;return[c+Math.cos(g)*r0*v,c+Math.sin(g)*r0*v];};
 let g='';[.25,.5,.75,1].forEach(v=>{g+=`<polygon points="${SENS_AX.map((_,k)=>pt(k,v).map(x=>x.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="var(--line)"/>`;});
 SENS_AX.forEach(([k,n2],i)=>{const[x,y]=pt(i,1.2);g+=`<text x="${x}" y="${y+3}" text-anchor="middle" font-size="9" fill="var(--t2)">${n2}</text>`;});
 const poly=(p,st)=>`<polygon points="${SENS_AX.map(([k],i)=>pt(i,Math.max(.02,p[k]/100)).map(x=>x.toFixed(1)).join(',')).join(' ')}" ${st}/>`;
 if(a)g+=poly(a,'fill="rgba(125,211,252,.2)" stroke="var(--ice)" stroke-width="1.6"');if(b)g+=poly(b,'fill="rgba(251,146,60,.12)" stroke="#fb923c" stroke-width="1.6" stroke-dasharray="4 3"');
 return`<svg viewBox="-24 -8 ${S0+48} ${S0+16}" style="width:100%;max-width:300px;height:auto;display:block;margin:auto" role="img" aria-label="Índices do motor ligados à percepção">${g}</svg>`;}

/* ---------- 4. EXPLORADOR DE VARIAÇÕES ----------
   Gera variações por operadores de criação (troca de açúcares, gordura, proteína, laticínio fermentado,
   acento aromático, minimalismo, sal), balanceia cada uma no motor e avalia com o índice completo. */
function atRng(seed){let s=(seed>>>0)||1;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
const SUG_SWAP=['dextrose','trealose','invertido','mel','mascavo','glicose38','isomaltulose','alulose'];
function recShares(rec){const t=rec.reduce((a,r)=>a+(+r.g||0),0)||1;const o={};rec.forEach(r=>o[r.id]=(o[r.id]||0)+(+r.g||0)/t);return o;}
function novelty(a,b){const x=recShares(a),y=recShares(b);let d=0;new Set([...Object.keys(x),...Object.keys(y)]).forEach(k=>d+=Math.abs((x[k]||0)-(y[k]||0)));return d/2;}
function exploreGelato(st,n,seed){
 const R=(st.recipe||[]).filter(r=>ING_BY[r.id]&&+r.g>0).map(r=>({id:r.id,g:+r.g}));if(R.length<2)return null;
 const tot=R.reduce((a,r)=>a+r.g,0);const s0=stReal(st),m0=analyze(s0),F0=diagnose(s0,m0);const base0={sol:m0.sol,P:m0.P};
 const rnd=atRng(seed);const pick=a=>a[Math.floor(rnd()*a.length)];const nm=id=>ING_BY[id]?ING_BY[id].n.split(' (')[0]:id;
 const AP=aromaPairs(R,8);const accents=AP?[...AP.trad.slice(0,4).map(x=>[x.id,'consagrada']),...AP.harm.slice(0,3).map(x=>[x.id,'ponte']),...AP.cont.slice(0,3).map(x=>[x.id,'contraste']),...AP.acc.slice(0,2).map(x=>[x.id,'acento'])]:[];
 const find=(rec,f)=>rec.filter(r=>ING_BY[r.id]&&f(ING_BY[r.id],r));
 const ops=[
  rec=>{const s=find(rec,(i,r)=>r.id==='sacarose')[0]||find(rec,i=>i.cat==='Açúcares').sort((a,b)=>b.g-a.g)[0];if(!s)return null;const to=pick(SUG_SWAP.filter(x=>x!==s.id&&ING_BY[x]));const p=.25+rnd()*.25;const g=s.g*p;s.g-=g;const ex=rec.find(r=>r.id===to);if(ex)ex.g+=g;else rec.push({id:to,g});return f0(p*100)+'% da '+nm(s.id).toLowerCase()+' → '+nm(to).toLowerCase();},
  rec=>{const c=find(rec,i=>/^creme/.test(i.id))[0],l=find(rec,i=>/^leite/.test(i.id))[0];if(!c||!l)return null;const up=rnd()<.5;const d=c.g*(up?.3:.25);if(!up&&c.g-d<1)return null;c.g+=up?d:-d;l.g=Math.max(0,l.g+(up?-d:d));return'gordura '+(up?'+':'−')+' (creme '+(up?'+30':'−25')+'%)';},
  rec=>{const p=rec.find(r=>r.id==='lpd');if(p){const up=rnd()<.5;p.g*=up?1.35:.65;return'leite em pó '+(up?'+35':'−35')+'%';}if(!find(rec,i=>i.cat==='Lácteos').length)return null;rec.push({id:'lpd',g:tot*.02});return'+ leite em pó 2% (corpo)';},
  rec=>{const c=find(rec,i=>/^creme/.test(i.id))[0];if(!c)return null;const to=pick(['mascarpone','cremefr','grego','ricota','iogurte']);if(!ING_BY[to])return null;const g=c.g*.4;c.g-=g;const ex=rec.find(r=>r.id===to);if(ex)ex.g+=g;else rec.push({id:to,g});return'40% do creme → '+nm(to).toLowerCase();},
  rec=>{if(!accents.length)return null;const[id,kind]=pick(accents);if(rec.some(r=>r.id===id))return null;rec.push({id,g:aDose(ING_BY[id])*tot/1000});return'+ '+nm(id).toLowerCase()+' ('+kind+')';},
  rec=>{if(rec.length<=4)return null;const c=rec.filter(r=>{const i=ING_BY[r.id];return i&&!['Estabilizantes','Açúcares','Meus neutros'].includes(i.cat)&&!/^leite$|^agua$/.test(r.id)&&r.g<tot*.04;}).sort((a,b)=>a.g-b.g)[0];if(!c)return null;rec.splice(rec.indexOf(c),1);return'− '+nm(c.id).toLowerCase()+' (minimalismo)';},
  rec=>{if(rec.some(r=>r.id==='sal')||!ING_BY.sal)return null;rec.push({id:'sal',g:tot*.0015});return'+ sal 0,15% (realça o sabor)';},
  rec=>{const a=find(rec,i=>(i.c.alc||0)>0)[0];if(!a)return null;a.g*=.7;return nm(a.id).toLowerCase()+' −30% (álcool)';},
  rec=>{if(base0.sol<=base0.P.sol[1])return null;const w=find(rec,i=>(i.c.w||0)>=85&&!(i.c.alc>0)).sort((a,b)=>b.g-a.g)[0];if(!w)return null;w.g+=tot*.08;return nm(w.id).toLowerCase()+' +8% (sólidos altos)';},
  rec=>{if(base0.sol>=base0.P.sol[0])return null;const id=find(rec,i=>i.cat==='Lácteos').length&&tbase(st.tipo)!=='vegan'?'lpd':'fibramilho';if(!ING_BY[id])return null;const ex=rec.find(r=>r.id===id);if(ex)ex.g+=tot*.03;else rec.push({id,g:tot*.03});return'+ '+nm(id).toLowerCase()+' 3% (sólidos baixos)';},
  rec=>{if(tbase(st.tipo)==='sorbetto'||tbase(st.tipo)==='vegan')return null;const id=pick(['gema','mascarpone','creamcheese']);if(!ING_BY[id]||rec.some(r=>r.id===id))return null;rec.push({id,g:tot*(id==='gema'?.04:.06)});return'+ '+nm(id).toLowerCase()+' (corpo e emulsão)';}];
 const out=[],seen=new Set();
 for(let tries=0;tries<n*5&&out.length<n;tries++){
  const rec=R.map(r=>({...r}));const labs=[];const k=rnd()<.45?2:1;
  for(let j=0;j<k;j++){const l=pick(ops)(rec);if(l&&!labs.includes(l))labs.push(l);}
  if(!labs.length)continue;const key=labs.slice().sort().join('|');if(seen.has(key))continue;seen.add(key);
  rec.forEach(r=>r.g=Math.round(r.g*10)/10);const rc=rec.filter(r=>r.g>0);
  let fin=rc,ok=false,how='';try{const b=balanceBest({...st,recipe:rc},260);if(b&&b.ok){fin=b.newRecipe;ok=true;how=b.lab?'lab':'clássico';}}catch(e){}
  const s3=stReal({...st,recipe:fin});const m=analyze(s3);if(m.empty)continue;const F=diagnose(s3,m),sc=score(s3,m,F).total;
  out.push({labs,recipe:fin,ok,how,sc,sens:sensProfile(m),q:fineScore(s3,m,F),crit:F.filter(f=>f.sev==='crit').map(f=>f.title),pod:m.pod,sol:m.sol,fat:m.fat,fz:m.fzVit,d:m.crystal,shelf:m.shelfVit,melt:m.melt,cost:m.costKg,nov:novelty(R,fin),prof:aromaProfile(fin)});}
 const base={sc:score(s0,m0,F0).total,q:fineScore(s0,m0,F0),pod:m0.pod,sol:m0.sol,fat:m0.fat,fz:m0.fzVit,d:m0.crystal,shelf:m0.shelfVit,melt:m0.melt,cost:m0.costKg};
 const goal=EXP_GOALS[st._goal]?st._goal:'equil';out.forEach(x=>x.rank=EXP_GOALS[goal].f(x,base));
 return{seed,goal,base,list:out.sort((a,b)=>b.rank-a.rank)};}
/* objetivo da rodada: muda só a ordem (todas as variações continuam balanceadas e avaliadas) */
const EXP_GOALS={
 equil:{n:'Equilíbrio',f:(x,b)=>x.q+x.nov*4},
 doce:{n:'Menos doce',f:(x,b)=>x.q*.6-(x.pod-b.pod)*4},
 creme:{n:'Mais cremoso',f:(x,b)=>x.q*.6+(x.fat-b.fat)*2.5+(x.sol-b.sol)*1.2-Math.max(0,x.d-30)},
 vida:{n:'Vida longa',f:(x,b)=>x.q*.6+(Math.min(x.shelf,30)-Math.min(b.shelf,30))*1.5-x.d*.3},
 custo:{n:'Menor custo',cost:1,f:(x,b)=>x.q*.6+(b.cost-x.cost)*6},
 ousado:{n:'Ousadia',f:(x,b)=>x.q*.5+x.nov*60}};
function exploreMap(E,sel){const W=360,H=236,L=36,R=10,T=22,B=30;const all=[E.base,...E.list];
 const xs=all.map(x=>x.fat),ys=all.map(x=>x.sol);let x0=Math.min(...xs)-.8,x1=Math.max(...xs)+.8,y0=Math.min(...ys)-.8,y1=Math.max(...ys)+.8;
 const sx=v=>L+(v-x0)/(x1-x0)*(W-L-R),sy=v=>T+(1-(v-y0)/(y1-y0))*(H-T-B);
 let g='';for(let k=0;k<=4;k++){const v=x0+(x1-x0)*k/4,w=y0+(y1-y0)*k/4;g+=`<text x="${sx(v)}" y="${H-12}" text-anchor="middle" font-size="9" fill="var(--t3)">${f1(v)}</text><text x="${L-4}" y="${sy(w)+3}" text-anchor="end" font-size="9" fill="var(--t3)">${f1(w)}</text><line x1="${L}" x2="${W-R}" y1="${sy(w)}" y2="${sy(w)}" stroke="var(--line)" stroke-dasharray="2 4"/>`;}
 g+=`<text x="${W-R}" y="${H-1}" text-anchor="end" font-size="9" fill="var(--t3)">gordura % →</text><text x="4" y="10" font-size="9" fill="var(--t3)">sólidos % ↑</text>`;
 E.list.forEach((x,i)=>{const col=x.q>=93?'var(--ok)':x.q>=80?'var(--warn)':'var(--crit)';const r=4+x.nov*28;
  g+=`<circle cx="${sx(x.fat).toFixed(1)}" cy="${sy(x.sol).toFixed(1)}" r="${clamp(r,4,12).toFixed(1)}" fill="${col}" fill-opacity="${i===sel?.9:.35}" stroke="${col}" stroke-width="${i===sel?2.5:1}" data-a="atPick" data-v="${i}" style="cursor:pointer"><title>${esc(x.labs.join(' · '))} · índice ${x.sc} (fino ${f1(x.q)})</title></circle>`;});
 g+=`<circle cx="${sx(E.base.fat)}" cy="${sy(E.base.sol)}" r="7" fill="none" stroke="var(--t1)" stroke-width="2"/><text x="${sx(E.base.fat)+10}" y="${sy(E.base.sol)+3}" font-size="9.5" fill="var(--t1)">atual</text>`;
 return`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="Mapa das variações: gordura × sólidos; cor = índice, tamanho = ousadia">${g}</svg>`;}

/* ---------- 5. CARTAS DE MÉTODO CRIATIVO ---------- */
const ACARDS=[
 ['Terroir de 100 km','Faça o sabor só com o que nasce perto de você. Troque a fruta importada por uma nativa (cambuci, uvaia, butiá, jabuticaba) e deixe o motor ajustar o açúcar à acidez dela.','Sazonal'],
 ['Mudança de contexto','Leve um sabor salgado à vitrine: tomate, milho assado, parmigiano, azeite. O motor trata o sal e a gordura extra como trata qualquer sólido.','Gastronômicos'],
 ['Sal como lente','0,1–0,3% de sal realça a doçura percebida e abre o aroma. Teste em caramelo, chocolate e pistache, e compare às cegas no Painel.','Degustação'],
 ['Ácido como espinha','Um sorbetto sem acidez fica plano. Busque uma acidez perceptível com fruta ácida ou cítrico; o açúcar precisa subir junto (veja POD).','Frutas'],
 ['Gordura aromática','Troque parte do creme por uma gordura que carrega aroma: azeite, manteiga noisette, tahine, manteiga de cacau. Olhe o SFC: ele muda o corpo no frio.','Vegetais e gorduras'],
 ['Infusão a frio','Ervas, café ou chá em infusão durante a maturação (12 h a 4 °C) extraem aroma sem amargor. Coe antes de mantecar.','Maturação'],
 ['Desconstrução','Pegue uma sobremesa clássica (tiramisù, torta de limão, pão de mel) e separe as camadas em base, variegato e crocante. A base precisa se sustentar sozinha.','Clássicos'],
 ['Minimalismo','No máximo três ingredientes de sabor além de açúcares e neutro. Use o Explorador: a opção "minimalismo" mostra o que o motor ainda segura sem cada um.','Explorador'],
 ['Ponte aromática','Una dois ingredientes improváveis por uma família de compostos em comum (lactonas no pêssego e no creme, pirazinas no café e no gergelim). Use o Mapa aromático.','Aroma'],
 ['Fermentação','Iogurte, kefir, crème fraîche ou queijo de ovelha trazem ácidos e metilcetonas que dão profundidade. Cuidado com a lactose: o motor avisa.','Lácteos'],
 ['Caramelização controlada','Leve parte do açúcar a caramelo seco: perde poder adoçante e ganha amargor e sotolon. Use o ingrediente Caramelo e rebalanceie.','Açúcares'],
 ['Amargo nobre','Café, cacau 100%, toranja ou chicória. Equilibre o amargor com gordura e com açúcares de menor doçura (glicose, trealose), não com mais sacarose.','Amargos'],
 ['Doçura discreta','Baixe o POD em 3–4 pontos trocando sacarose por glicose ou trealose, e deixe o ingrediente principal falar mais alto.','Açúcares'],
 ['Umami no doce','Missô, parmigiano, cogumelo ou alho negro em dose de tempero (1–3%) aprofundam caramelo e chocolate.','Gastronômicos'],
 ['Cor como pista falsa','Uma cor que engana a expectativa (pitaya, matcha, ora-pro-nóbis) muda o que o cliente sente antes de provar.','Visual'],
 ['Memória afetiva','Um sabor de infância (curau, quindim, paçoca, doce de leite de corte) traduzido para a técnica italiana: mesma estrutura, outra lembrança.','Clássicos'],
 ['Temperatura como ingrediente','O mesmo gelato a −11 °C e a −14 °C são dois produtos. Mude a temperatura de serviço no termômetro e veja como os aromas e a dureza respondem.','Térmico'],
 ['Textura dupla','Um variegato com PAC mais alto que a base fica macio no freezer; um crocante envolto em gordura fica seco. Contraste é tão importante quanto sabor.','Textura']];

/* ---------- 6. NEUTRO POR OBJETIVO ---------- */
const NX_GOALS={
 vitrine:{n:'Vitrine longa',tgt:{anti:[75,94],corpo:[60,85],derr:[55,85],visc:[50,85]}},
 empratado:{n:'Derretimento lento',tgt:{derr:[82,98],corpo:[65,90],anti:[60,92]}},
 frio:{n:'Base a frio',cold:1,tgt:{anti:[60,90],corpo:[55,85],visc:[45,82]}},
 limpo:{n:'Rótulo limpo',pool:['lbg','guar','tara','citf','inu','acacia','pect','starch'],tgt:{anti:[60,90],corpo:[60,85],derr:[50,85]}},
 vegano:{n:'Vegano / sorbetto',dairy:0,noAnimal:1,tgt:{anti:[65,92],corpo:[55,85],derr:[50,85]}}};
function nxDesign(goal,dairy,prIn){const G=NX_GOALS[goal];if(!G)return null;const pr=Object.assign({},PROC0,prIn||{});if(G.cold)pr.pastT=20;
 const dy=G.dairy!=null?!!G.dairy:!!dairy;
 const pool=(G.pool||Object.keys(NCOMP).filter(k=>NCOMP[k].dose&&!['mono','inu'].includes(k)&&(k!=='konj'||goal==='empratado'))).filter(k=>NCOMP[k]&&!(G.noAnimal&&NCOMP[k].animal)&&!(!dy&&k==='carr'));
 const rnd=atRng([...goal].reduce((a,c)=>a*31+c.charCodeAt(0),7)+(dy?1:0)+(+pr.pastT));
 const evalB=(parts,dose)=>{const b=analyzeBlend({parts,dose},dy);let pen=0;
  for(const f in G.tgt){const[a,z]=G.tgt[f],v=b.P[f];if(v<a)pen+=(a-v)*(a-v)/40;else if(v>z)pen+=(v-z)*(v-z)/40;}
  const nw=b.notes.filter(x=>x.sev==='warn').length;pen+=nw*8;if(b.hydro<.2)pen+=(.2-b.hydro)*400;if(b.hydro>.4)pen+=(b.hydro-.4)*200;
  if(dy&&!G.tgt.siner&&b.P.siner<35)pen+=(35-b.P.siner)*(35-b.P.siner)/40;
  for(const k in b.eff){const r=NCOMP[k]&&NCOMP[k].dose;if(!r)continue;const mid=(r[0]+r[1])/2;if(b.eff[k]>mid)pen+=Math.pow((b.eff[k]-mid)/(r[1]-r[0]),2)*4;}
  const keys={};for(const k in parts)if(k!=='dex'&&NCOMP[k].dose)keys[k]=+parts[k];const hy=hydRun(keys,pr);Object.values(hy.h).forEach(h=>{if(h<.9)pen+=(.9-h)*120;});
  pen+=Object.keys(keys).length*3+Math.max(0,dose-8)*2;return{pen,b,hy,nw};};
 const rand=()=>{const n=2+Math.floor(rnd()*3);const ks=[];while(ks.length<n&&ks.length<pool.length){const k=pool[Math.floor(rnd()*pool.length)];if(!ks.includes(k))ks.push(k);}
  const parts={};let A=0;ks.forEach(k=>{const g=Math.round(5+rnd()*(k==='starch'?300:k==='citf'||k==='acacia'?120:70));parts[k]=g;A+=g;});parts.dex=Math.max(0,500-A);return{parts,dose:Math.round((3+rnd()*6)*2)/2};};
 let pop=[];for(let i=0;i<900;i++){const c=rand();pop.push({...c,...evalB(c.parts,c.dose)});}
 pop.sort((a,b)=>a.pen-b.pen);
 /* refino local dos melhores */
 pop=pop.slice(0,12).map(c=>{let best=c;for(let it=0;it<70;it++){const p={...best.parts};const ks=Object.keys(p).filter(k=>k!=='dex');const k=ks[Math.floor(rnd()*ks.length)];
   p[k]=Math.max(1,Math.round(p[k]*(.75+rnd()*.5)));let A=0;ks.forEach(x=>A+=p[x]);p.dex=Math.max(0,500-A);const dose=clamp(Math.round((best.dose+(rnd()-.5))*2)/2,2,12);
   const e=evalB(p,dose);if(e.pen<best.pen)best={parts:p,dose,...e};}return best;}).sort((a,b)=>a.pen-b.pen);
 const res=[],sigs=new Set();for(const c of [...pop.filter(c=>!c.nw),...pop.filter(c=>c.nw)]){const sig=Object.keys(c.parts).filter(k=>k!=='dex').sort().join('+');if(sigs.has(sig))continue;sigs.add(sig);res.push(c);if(res.length>=3)break;}
 return{goal,dairy:dy,pastT:pr.pastT,list:res.map(c=>({parts:c.parts,dose:c.dose,P:c.b.P,hydro:c.b.hydro,pen:c.pen,h:c.hy.h,warns:c.b.notes.filter(n=>n.sev==='warn').map(n=>n.t)}))};}

/* ===================== INTERFACE ===================== */
function crProcess(st,m,u,C){const s=procSnap(st,m,u,C);
 return`<div class="procbar"><div class="chips" role="group" aria-label="Etapas do processo">${PSTG.map(([k,n],i)=>`<button data-a="procGo" data-v="${i}" aria-pressed="${Math.floor(u)===i}">${n}</button>`).join('')}</div>
  <div class="procrow"><button class="btn sm" data-a="procPlay" aria-label="${U.procPlay?'Pausar':'Reproduzir o processo'}">${U.procPlay?'❚❚ Pausar':'▶ Processo'}</button><input type="range" id="procU" data-i="procU" min="0" max="6.99" step=".01" value="${u}" aria-label="Posição no processo"></div>
  ${procStrip(st,m,u,C)}
  <p class="note" id="procTxt" style="margin:6px 0 0">${esc(procDesc(st,m,s,C))}</p></div>`;}
function labAtelie(m,F,sc){
 if(m.empty)return'<div class="card"><p class="muted">Monte uma receita para abrir o ateliê.</p></div>';
 const AP=aromaPairs(S.recipe,5);const selV=U.atSel&&AROMA[U.atSel]?AROMA[U.atSel].map(x=>x/3):null;const nm=id=>esc(ING_BY[id].n);
 const fams=ks=>ks.map(k=>AFAM[k][1].split(' · ')[0].toLowerCase()).join(', ');
 const TST=['ácido corta gordura e doce','amargo equilibra o doce','sal levanta doce e gordura','gordura arredonda ácido e amargo','doce suaviza ácido e amargo'];
 const why=(x,kind)=>kind==='h'?'partilham '+fams(x.shared.slice(0,3)):kind==='c'?'ponte: '+fams(x.shared.slice(0,2))+' · traz '+fams(x.fresh.slice(0,2)):kind==='t'?(x.via?'por analogia: '+nm(x.from).toLowerCase()+' ≈ '+nm(x.via).toLowerCase():'clássico com '+nm(x.from).toLowerCase()):TST[x.taste.indexOf(Math.max(...x.taste))];
 const item=(x,kind)=>`<div class="atitem${U.atSel===x.id?' on':''}"><button class="atname" data-a="atSel" data-v="${x.id}"><b>${nm(x.id)}</b><small>${why(x,kind)}</small></button><span class="mono atpct">${f0((kind==='h'?x.sim:kind==='c'?x.contrast:kind==='t'?x.sim:x.comp)*100)}</span><button class="btn sm" data-a="atTry" data-v="${x.id}" title="Adiciona ${f0(aDose(ING_BY[x.id]))} g/kg (se for líquido, no lugar da água da base), rebalanceia e mantém o peso do lote">Testar</button></div>`;
 const top=AP?AP.R.map((v,k)=>[v,k]).sort((a,b)=>b[0]-a[0]).slice(0,3).map(([,k])=>AFAM[k]):[];
 const E=U.atEx&&U.atEx.sig===JSON.stringify(S.recipe)+S.tipo+S.vit?U.atEx:null;const pk=E&&E.list[U.atPick]?E.list[U.atPick]:null;
 const card=ACARDS[(+U.atCard||0)%ACARDS.length];
 const dl=(a,b,d,inv)=>{const x=b-a;const good=inv?x<0:x>0;return Math.abs(x)<(d?.05:.5)?'':`<span class="${good?'c-ok':'c-warn'}" style="font-size:11px"> ${x>0?'+':''}${d?f2(x):f1(x)}</span>`;};
 return`<div class="g2 atgrid">
  <div class="card"><h2>Mapa aromático</h2><p class="note" style="margin-top:0">Quatro caminhos: combinações consagradas pela tradição (e, para o que a tradição não cobre, por analogia com o ingrediente aromaticamente mais parecido), pontes por compostos compartilhados, contrastes que trazem uma família nova mantendo uma ponte, e acentos de gosto (ácido, amargo, sal, gordura) que equilibram a receita.</p>
   ${AP?`<div class="atwheel">${aromaWheel(AP.R,selV)}<div class="atleg"><span class="lbl">Assinatura da receita</span>${top.map(f=>`<div class="kv"><span>${f[1]}</span><span class="muted" style="font-size:11px">${f[2]}</span></div>`).join('')}${U.atSel&&ING_BY[U.atSel]?`<p class="note" style="margin:8px 0 0"><span style="color:#fb923c">- - -</span> ${nm(U.atSel)}</p>`:''}</div></div>
   <div class="g2" style="gap:14px;margin-top:10px"><div><span class="lbl">Consagradas e por analogia</span>${AP.trad.length?AP.trad.slice(0,6).map(x=>item(x,'t')).join(''):'<p class="muted" style="font-size:12.5px">Sem referência na tradição para estes sabores.</p>'}
    ${AP.acc.length?`<span class="lbl" style="display:block;margin-top:12px">Acentos de gosto</span>${AP.acc.map(x=>item(x,'a')).join('')}`:''}</div>
    <div><span class="lbl">Pontes aromáticas</span>${AP.harm.map(x=>item(x,'h')).join('')}<span class="lbl" style="display:block;margin-top:12px">Contrastes com ponte</span>${AP.cont.length?AP.cont.map(x=>item(x,'c')).join(''):'<p class="muted" style="font-size:12.5px">Sem contraste com ponte para esta receita.</p>'}</div></div>`
   :'<p class="muted">A receita ainda não tem ingredientes de sabor com perfil aromático. Adicione uma fruta, um cacau, uma oleaginosa ou um aroma.</p>'}
   <p class="note" style="margin-bottom:0">Perfil por famílias de compostos de impacto descritas na literatura de química do sabor (intensidade 0–3, ponderada pela dose). Não substitui a prova: use como bússola, não como veredito.</p></div>
  <div class="card"><div class="row"><h2 style="margin:0">Explorador de variações</h2><span class="sp"></span><button class="btn sm pri" data-a="atExplore">${E?'Nova rodada':'Explorar 24 variações'}</button></div>
   <p class="note">Cada ponto é uma receita nova criada por operadores de criação (açúcares, gordura, proteína, laticínio fermentado, acento aromático, minimalismo, sal), <b>balanceada pelo motor</b> (clássico ou, quando ele não cobre o caso, o balanceador do laboratório) e avaliada com o índice completo${S.proc.serveFrom==='pote'?' no modo pote':''}. O mapa mostra a textura (gordura × sólidos; a doçura fica no alvo porque cada variação é rebalanceada). Cor: índice fino (contínuo, não satura em 100). Tamanho: ousadia (distância da receita atual).</p>
   <div class="chips" style="margin:2px 0 8px" role="group" aria-label="Objetivo da rodada">${Object.entries(EXP_GOALS).filter(([k,g])=>!g.cost||can.cost()).map(([k,g])=>`<button data-a="atGoal" data-v="${k}" aria-pressed="${(U.atGoal||'equil')===k}">${g.n}</button>`).join('')}</div>
   ${E?`${E.list.length?exploreMap(E,+U.atPick):'<p class="muted">Nenhuma variação viável nesta rodada.</p>'}
    ${pk?`<div class="card flat" style="margin-top:10px"><b style="color:var(--t1)">${esc(pk.labs.join(' · '))}</b>${pk.ok?` <span class="muted" style="font-size:11.5px">· balanceador ${pk.how}</span>`:' <span class="c-warn" style="font-size:12px">(não balanceou por completo)</span>'}
     <div class="kv"><span>Índice · fino</span><span class="mono">${pk.sc} · ${f1(pk.q)}${dl(E.base.q,pk.q)}</span></div>${pk.crit.length?`<div class="kv"><span class="c-crit">Crítico</span><span style="font-size:12px">${esc(pk.crit.join(' · '))}</span></div>`:''}<div class="kv"><span>Doçura POD</span><span class="mono">${f1(pk.pod)}%${dl(E.base.pod,pk.pod)}</span></div>
     <div class="kv"><span>Sólidos · gordura</span><span class="mono">${f1(pk.sol)} · ${f1(pk.fat)}%</span></div><div class="kv"><span>Cristal · vida na vitrine</span><span class="mono">${f0(pk.d)} µm · ${pk.shelf>30?'30+':f0(pk.shelf)} d</span></div>
     <div class="kv"><span>Ousadia</span><span class="mono">${f0(pk.nov*100)}%</span></div>${$cost(`<div class="kv"><span>Custo</span><span class="mono">R$ ${f2(pk.cost)}/kg${dl(E.base.cost,pk.cost,1,1)}</span></div>`)}
     <div class="row" style="margin-top:8px"><button class="btn sm okb" data-a="atAdopt" data-v="${U.atPick}">Levar para a bancada</button><button class="btn sm" data-a="atToLab" data-v="${U.atPick}">Comparar</button></div></div>`:''}
    <div class="atlist">${E.list.slice(0,8).map((x,i)=>`<button data-a="atPick" data-v="${i}" aria-pressed="${+U.atPick===i}"><span class="mono ${x.q>=93?'c-ok':x.q>=80?'c-warn':'c-crit'}">${f1(x.q)}</span> ${esc(x.labs.join(' · '))}</button>`).join('')}</div>`
   :'<p class="muted" style="font-size:12.5px">Toque em Explorar para gerar as variações da receita atual.</p>'}</div></div>
 ${(()=>{const sA=sensProfile(analyze(stReal(S)));const sB=pk&&pk.sens;if(!sA)return'';
  return`<div class="card"><h2>Índices do motor ligados à percepção</h2><div class="atwheel">${sensRadar(sA,sB)}<div>${SENS_AX.map(([k,n0,n])=>`<div class="kv"><span>${n}</span><span class="mono">${f0(sA[k])}${sB?` <span style="color:#fb923c">→ ${f0(sB[k])}</span>`:''}</span></div>`).join('')}
   <p class="note" style="margin:8px 0 0">Azul: receita atual a ${fT(S.proc.serveFrom==='pote'?poteServeTemp(S):S.vit)} °C${sB?'. Laranja: variação selecionada no explorador':''}. Previsão a partir do motor (doçura corrigida pela temperatura, firmeza pela água congelada, cremosidade por gordura, sólidos e cristal, aroma pela volatilidade no frio). <b>Não é avaliação sensorial</b>: são índices físicos do motor, em escala 0–100, que só apontam para onde a percepção pode ir. Quem diz como o gelato é percebido é o Painel cego.</p></div></div></div>`;})()}
 <div class="card atcard"><div class="row"><span class="lbl" style="margin:0">Carta de método · ${esc(card[2])}</span><span class="sp"></span><button class="btn sm" data-a="atCard">Tirar outra carta</button></div><h3>${esc(card[0])}</h3><p>${esc(card[1])}</p></div>`;}
function hydCard(E,pr){const keys={};const sh=blendShares(E.parts);for(const k in sh)if(NCOMP[k]&&NCOMP[k].dose)keys[k]=sh[k];if(!Object.keys(keys).length)return'';
 const hy=hydRun(keys,pr);const W=600,H=170,L=32,R=8,T=14,B=34;const n=4,sw=(W-L-R)/n;const sx=(i,f)=>L+(i+f)*sw,sy=v=>T+(1-v)*(H-T-B);
 let g='';hy.ph.forEach((p,i)=>{g+=`<rect x="${sx(i,0)+1}" y="${T}" width="${sw-2}" height="${H-T-B}" rx="5" fill="rgba(255,255,255,.02)"/><text x="${sx(i,.5)}" y="${H-18}" text-anchor="middle" font-size="9.5" fill="var(--t2)">${p.n}</text><text x="${sx(i,.5)}" y="${H-6}" text-anchor="middle" font-size="9" fill="var(--t3)">${i===0?f0(p.d/60)+' min → '+fT(+pr.pastT)+' °C':i===1?fT(p.d)+' s':i===2?f0(p.d/60)+' min → '+fT(+pr.matT)+' °C':fT(p.d/3600)+' h'}</text>`;});
 [0,.5,.9,1].forEach(v=>g+=`<line x1="${L}" x2="${W-R}" y1="${sy(v)}" y2="${sy(v)}" stroke="var(--line)" stroke-dasharray="${v===.9?'4 3':'2 4'}"/><text x="${L-4}" y="${sy(v)+3}" text-anchor="end" font-size="9" fill="var(--t3)">${f0(v*100)}</text>`);
 for(const k in keys){const col=NSTYLE[k]?NSTYLE[k].col:'#e6ecf4';g+=`<polyline points="${hy.samp.map(s=>sx(s.i,s.f).toFixed(1)+','+sy(s.h[k]).toFixed(1)).join(' ')}" fill="none" stroke="${col}" stroke-width="1.8"/>`;}
 const minT=hydMinT(keys,pr);const bad=Object.keys(keys).filter(k=>hy.h[k]<.9);
 return`<div class="card"><h2>Cinética de hidratação</h2><p class="note" style="margin-top:0">Fração hidratada de cada componente ao longo do processo (aquecimento a 2 °C/min, patamar, resfriamento e maturação), pela temperatura e pelo tempo. A linha tracejada marca 90%.</p>
  <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="Curvas de hidratação dos hidrocoloides">${g}</svg>
  <div class="pills" style="margin-top:8px">${Object.keys(keys).map(k=>`<div class="pill2 ${hy.h[k]>=.9?'ok':hy.h[k]>=.7?'warn':'crit'}"><span class="dot"></span><span class="n"><span style="color:${NSTYLE[k]?NSTYLE[k].col:'var(--t2)'}">■</span> ${esc(NCOMP[k].n)}</span><span class="v">${f0(hy.h[k]*100)}% hidratada</span></div>`).join('')}</div>
  <p class="note" style="margin-bottom:0">${bad.length?'<b class="c-warn">'+esc(bad.map(k=>NCOMP[k].n).join(', '))+'</b> não chega a 90% com '+fT(+pr.pastT)+' °C. ':'Todos os componentes hidratam com este processo. '}${minT!=null?'Temperatura mínima para hidratar ≥95% de todos com o patamar atual ('+fT(holdS(pr))+' s): <b>'+minT+' °C</b>.':'Nem a 95 °C este patamar hidrata tudo: alongue o patamar.'}</p></div>`;}
function nxDesignCard(E){const D=U.nxDes;
 return`<div class="card"><h2>Desenhar neutro por objetivo</h2><p class="note" style="margin-top:0">O motor busca combinações de componentes e doses (900 candidatas + refino local) que entregam o perfil funcional do objetivo, com hidratação completa no seu processo e sem alertas do avaliador.</p>
  <div class="chips">${Object.entries(NX_GOALS).map(([k,g])=>`<button data-a="nxGoal" data-v="${k}" aria-pressed="${!!(D&&D.goal===k)}">${g.n}</button>`).join('')}</div>
  ${D?`<div class="g3" style="margin-top:10px">${D.list.map((c,i)=>`<div class="card flat"><b style="color:var(--t1)">Proposta ${i+1}</b><div class="muted" style="font-size:12px">${f1(c.dose)} g/kg · ${f2(c.hydro)}% de hidrocoloides</div>
    <p class="note" style="margin:6px 0">${Object.keys(c.parts).filter(k=>k!=='dex'&&c.parts[k]>0).map(k=>`<span style="color:${NSTYLE[k]?NSTYLE[k].col:'var(--t2)'}">■</span> ${esc(NCOMP[k].n)} ${c.parts[k]} g`).join('<br>')}${c.parts.dex?'<br>Dextrose (veículo) '+c.parts.dex+' g':''}</p>
    ${NFUN.filter(([k])=>k!=='emul').map(([k,n])=>`<div class="row" style="justify-content:space-between;font-size:11.5px"><span class="t2">${n}</span><span class="mono">${c.P[k]}</span></div>`).join('')}
    ${c.warns.length?`<p class="c-warn" style="font-size:11.5px;margin:6px 0 0">${esc(c.warns.join(' · '))}</p>`:''}<button class="btn sm" style="margin-top:8px" data-a="nxDesUse" data-v="${i}">Abrir no editor</button></div>`).join('')}</div>`:''}</div>`;}

/* ---------- reprodução do processo sem redesenhar a página ---------- */
let procT=null;
function procTick(){if(S.page!=='creator'||S.creatorTab!=='gelato'){procStop();return;}const c=U._cr;if(!c||!GSIM)return;const{m,F,sc,C}=c;const u=+U.procU;
 GSIM.set(microAt(S,m,F,sc,+U.days||0,u,C));
 const el=document.getElementById('procU');if(el)el.value=u;
 const s=procSnap(S,m,u,C);const cur=document.getElementById('procCur');
 if(cur){const W=640,L=34,R=8,sw=(W-L-R)/7;cur.setAttribute('transform','translate('+(L+u*sw).toFixed(1)+',0)');const t0=-26,t1=Math.max(90,+C.pr.pastT+4),T=18,H=132,B=30;const dot=document.getElementById('procDot');if(dot)dot.setAttribute('cy',(T+(1-(clamp(s.T,t0,t1)-t0)/(t1-t0))*(H-T-B)).toFixed(1));}
 const tx=document.getElementById('procTxt');if(tx)tx.textContent=procDesc(S,m,s,C);
 document.querySelectorAll('.procbar .chips button').forEach((b,i)=>b.setAttribute('aria-pressed',String(Math.floor(u)===i)));}
function procStop(){if(procT){clearInterval(procT);procT=null;}U.procPlay=false;}
const AT_ACT={
 procGo:v=>{procStop();U.procU=clamp(+v||0,0,6);render();},
 procPlay:()=>{if(U.procPlay){procStop();render();return;}if((+U.procU||0)>=6.9||Math.floor(+U.procU)===PROC_SERV)U.procU=0;U.procPlay=true;render();
  if(typeof setInterval!=='function')return;procT=setInterval(()=>{U.procU=Math.round(((+U.procU||0)+.025)*1000)/1000;if(U.procU>=6.99){U.procU=6.99;procStop();render();return;}procTick();},90);},
 atSel:v=>{U.atSel=U.atSel===v?null:v;render();},
 atTry:v=>{const r=atAddBalanced(S,v);if(!r)return;S.recipe=r.recipe;U.atSel=v;U.bal=null;render();toast(r.msg,true);},
 atExplore:()=>{const seed=((U.atEx&&U.atEx.seed)||0)+1;const r=exploreGelato({...S,_goal:U.atGoal||'equil'},24,seed);U.atEx=r?{...r,sig:JSON.stringify(S.recipe)+S.tipo+S.vit}:null;U.atPick=0;render();if(!r)toast('Monte uma receita com ao menos 2 ingredientes');},
 atGoal:v=>{if(!EXP_GOALS[v])return;U.atGoal=v;const E=U.atEx;if(E&&E.list.length){const g=EXP_GOALS[v];E.list.forEach(x=>x.rank=g.f(x,E.base));E.list.sort((a,b)=>b.rank-a.rank);E.goal=v;}U.atPick=0;render();},
 atPick:v=>{U.atPick=+v||0;render();},
 atAdopt:v=>{const x=U.atEx&&U.atEx.list[+v];if(!x)return;S.recipe=JSON.parse(JSON.stringify(x.recipe));U.atEx=null;U.bal=null;render();toast('Variação na bancada: '+x.labs.join(' · '));},
 atToLab:v=>{const x=U.atEx&&U.atEx.list[+v];if(!x)return;addVariant(x.labs.join(' · ').slice(0,30),x.recipe);S.crSub='comparar';render();},
 atCard:()=>{U.atCard=((+U.atCard||0)+1+Math.floor(Math.random()*(ACARDS.length-1)))%ACARDS.length;render();},
 nxGoal:v=>{if(!NX_GOALS[v])return;U.nxDes=nxDesign(v,S.nxEdit.dairy,S.proc);render();},
 nxDesUse:v=>{const D=U.nxDes,c=D&&D.list[+v];if(!c)return;S.nxEdit={id:null,name:('Desenhado · '+NX_GOALS[D.goal].n).slice(0,40),dose:c.dose,dairy:D.dairy,parts:{...c.parts}};U.nxTest=null;render();toast('Proposta aberta no editor');}
};
const AT_INP={procU:v=>{procStop();U.procU=clamp(+v||0,0,6.99);render();}};

