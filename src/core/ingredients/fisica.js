/* ---------- GORDURA SÓLIDA (SFC) ----------
   % da gordura que está sólida em cada temperatura, por tipo de gordura. Valores típicos de literatura (curvas
   de RMN de gordura láctea anidra, manteiga de cacau, óleo de coco, estearina tipo karité, óleos de oleaginosas,
   óleos líquidos e lipídios da gema). Usados na dureza percebida, na sensação na boca (33 °C) e na desestabilização. */
const SFC_T=[-20,-10,0,10,20,25,30,35,40];
const SFC={milk:[78,72,62,48,26,16,8,3,0],cocoa:[95,93,90,86,78,70,45,8,0],coco:[94,92,88,70,35,8,0,0,0],
 palm:[85,80,72,60,42,30,18,8,2],nut:[30,10,4,2,1,0,0,0,0],oil:[15,5,1,0,0,0,0,0,0],egg:[60,45,30,18,8,4,2,0,0]};
const SFC_N={milk:'gordura do leite',cocoa:'manteiga de cacau',coco:'gordura de coco',palm:'gordura dura (karité, margarina, animal)',nut:'óleo de oleaginosas',oil:'óleo líquido',egg:'gordura da gema'};
/* ---------- INFUSÕES ----------
   Ingrediente marcado "infusionar e coar" não entra inteiro: os sólidos coados levam mistura retida (ret, g por g)
   e deixam na mistura uma fração dos seus sólidos solúveis (ext). fat = parte do extraído que é gordura. */
const INF0={ret:1.8,ext:.05,fat:0};
const INF={ervas:{ret:1.5,ext:.04},especiaria:{ret:2.5,ext:.06},fava:{ret:1,ext:.05},cocoralado:{ret:1.2,ext:.25,fat:.6},
 alfarroba:{ret:2,ext:.2},cafesol:{ret:0,ext:1},matcha:{ret:1.2,ext:.3},cacau:{ret:1.5,ext:.15,fat:.2},tamara:{ret:1,ext:.3}};

/* ---------- PROPRIEDADES FÍSICAS ---------- */
/* viscosidade intrínseca relativa de cada hidrocoloide (mPa·s por % na mistura, escala log) */
const VISK={konj:10,lbg:8,guar:9,tara:8,xan:11,carr:4,cmc:7,pect:3,citf:4,gel:3,acacia:.5,starch:1.2,neutro:5.5};
/* Tg′ (°C) de cada soluto da fase concentrada */
const TGP={suc:-32,glu:-43,fru:-42,lac:-28,tre:-30,alu:-40,iso:-34,ery:-50,sor:-44,xyl:-47,mlt:-34,gly:-65,inu:-20,fos:-30,salt:-21,acd:-50,alc:-100};

