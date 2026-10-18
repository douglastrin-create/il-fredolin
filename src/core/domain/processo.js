/* ---------- PROCESSO PADRÃO ---------- */
const PROC0={pastT:85,pastHold:30,pastHoldU:'s',coolMin:60,matH:8,matT:4,machine:'horiz',load:1000,preChill:1,drawT:-9,drawMin:10,blastT:-35,hardMin:40,storeT:-20,storeFluct:1,serveFrom:'vitrine',poteMl:500,ambT:23,waitMin:10,hardAuto:0,turboMin:0,equip:'',lossPct:0,fruitStage:'depois',alcStage:'depois',portion:90,labelPortion:60,markup:3.5};
/* limites físicos/práticos de cada campo numérico do processo (entrada fora disso é trazida para o limite) */
/* conjuntos de equipamentos: um toque aplica todo o processo (fontes: manual Maqp1 Maestro Gelatiere 2025;
   Panasonic NR-BB53GV3WB, etiqueta e SAC Panasonic: freezer em Médio entre −17 e −22 °C, Turbo por até 150 min) */
const EQUIP={casa_mg_pan:{n:'Casa · Maestro Gelatiere + Panasonic NR-BB53',
 machine:'Maqp1 Maestro Gelatiere: tanque de 3 L (encher de ¼ a ⅔ ≈ 0,75 a 2 L), retirada de 1 L por ciclo de ~15 min (≈ 1,1 kg de calda), saída a −4 °C ou mais frio no centro da massa',
 fridge:'Panasonic NR-BB53GV3WB frost free: 305 L de refrigerador (Mín/Méd/Máx) e 120 L de freezer embaixo (Mín/Méd/Máx, Médio entre −17 e −22 °C, Turbo até 150 min), degelo automático',
 proc:{machine:'maqp1',load:1100,preChill:0,drawT:-4,drawMin:15,matT:4,matH:12,coolMin:45,serveFrom:'pote',storeT:-19.5,storeFluct:2,blastT:-24,hardAuto:1,turboMin:120,poteMl:250,ambT:24,waitMin:10,equip:'casa_mg_pan'},
 batch:1100}};
const PROC_LIM={load:[200,3000],preChill:[0,1],turboMin:[0,150],lossPct:[0,60],poteMl:[100,5000],ambT:[5,40],waitMin:[0,60],pastT:[60,95],pastHold:[0,3600],coolMin:[5,480],matH:[0,96],matT:[0,10],drawT:[-16,-3],drawMin:[2,40],blastT:[-45,-10],hardMin:[5,480],storeT:[-35,-8],storeFluct:[0,10],portion:[20,500],labelPortion:[10,500],markup:[1,15]};
const MACH={maqp1:{n:'Maqp1 Maestro Gelatiere (350 W, tanque 3 L, retirada 1 L/ciclo)',ov:25,max:35,batch:1100,batchMax:2000,drawT:-4,drawMin:15,load:1100},horiz:{n:'Mantecadora horizontal (batch, tipo Labo)',ov:26,max:42},vert:{n:'Mantecadora vertical (Bravo / Trittico)',ov:20,max:32},dom:{n:'Sorveteira doméstica',ov:15,max:25},paco:{n:'Pacojet (pacotização)',ov:10,max:20}};
/* Fator de dureza: forma de Corvitto (manteiga de cacau, sólidos de cacau, gordura de oleaginosas),
   coeficientes recalibrados para que o Helado de chocolate e o Helado de nata do Recetario de Corvitto
   sirvam à mesma temperatura (−18 °C), como no livro. */
const HFK={B:.6,S:1.2,N:.9};

