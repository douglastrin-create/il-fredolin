/* ---------- PERFIS (faixas-alvo por tipo) ---------- */
const PROF={
 crema:{n:'Crema (base láctea)',sol:[36,42],fat:[6,10],msnf:[8,11],swt:[16,22],pod:[16,20],prot:[3.5,5.5],stab:[.2,.5],fz:[68,74],ov:[25,40],draw:[-11,-7],frt:null},
 frutta:{n:'Frutta (fruta com leite)',sol:[32,40],fat:[2,7],msnf:[4,9],swt:[20,26],pod:[19,24],prot:[1.5,4.5],stab:[.3,.6],fz:[68,74],ov:[20,35],draw:[-11,-7],frt:[25,50]},
 sorbetto:{n:'Sorbetto (sem lácteos)',sol:[28,35],fat:[0,1],msnf:[0,.5],swt:[24,31],pod:[22,28],prot:[0,1.5],stab:[.3,.7],fz:[68,74],ov:[15,30],draw:[-11,-8],frt:[25,60]},
 vegan:{n:'Vegano (base vegetal)',sol:[34,42],fat:[5,11],msnf:[0,0],swt:[18,24],pod:[16,21],prot:[1,4],stab:[.3,.6],fz:[68,74],ov:[20,35],draw:[-11,-7],frt:null},
 gastro:{n:'Gastronômico (salgado)',sol:[30,42],fat:[5,14],msnf:[5,11],swt:[4,14],pod:[3,10],prot:[2,8],stab:[.2,.6],fz:[66,74],ov:[20,35],draw:[-11,-7],frt:null},
 semacucar:{n:'Sem açúcar / low-carb',sol:[30,40],fat:[6,12],msnf:[6,11],swt:[12,22],pod:[14,19],prot:[3,8],stab:[.3,.6],fz:[68,74],ov:[20,35],draw:[-11,-7],frt:null}
};
/* ---------- v18.3 · FAMÍLIAS DE PRODUTO (especificação §20–21) ----------
   Cada perfil diz: família, comportamento-base nas regras do motor (like), processo (batch = mantecadora;
   soft = servido direto da máquina; still = congelado parado após aerar fora da máquina; molded = forma/palito sem ar;
   scraped = raspado), contexto e temperatura de serviço, objetivo de cristal (fine/coarse) e a ORIGEM de cada faixa.
   conf:'fonte' = faixas de composição com referência citada; conf:'prática' = valores de prática a confirmar medindo. */
const FAM_N={italiana:'Italiana',internacional:'Internacional',tradicional:'Tradicional e regional',vegetal:'Vegetal',gastronomica:'Gastronômica'};
Object.assign(PROF.crema,{fam:'italiana'});Object.assign(PROF.frutta,{fam:'italiana'});Object.assign(PROF.sorbetto,{fam:'italiana'});
Object.assign(PROF.vegan,{fam:'vegetal'});Object.assign(PROF.gastro,{fam:'gastronomica'});Object.assign(PROF.semacucar,{fam:'italiana'});
const SRC_GOFF='Goff, Ice Cream Technology e-book (Univ. de Guelph): "Suggested mixes for ice cream" e "Formulation considerations"';
Object.assign(PROF,{
 granita:{n:'Granita (raspada)',fam:'italiana',like:'sorbetto',proc:'scraped',crystal:'coarse',serveT:-8,serveCtx:'raspada',
  sol:[17,28],fat:[0,1],msnf:[0,.5],swt:[15,25],pod:[15,25],prot:[0,1],stab:[0,.3],fz:[50,68],ov:[0,10],draw:[-10,-6],frt:[0,50],
  conf:'prática',src:['Sem fonte primária de composição: faixas de prática siciliana (xarope 15–25% de açúcar), menos sólidos que um sorbetto para cristais grandes e soltos']},
 semifreddo:{n:'Semifreddo',fam:'italiana',like:'crema',proc:'still',serveT:-13,serveCtx:'fatia',
  sol:[38,50],fat:[14,26],msnf:[4,9],swt:[17,26],pod:[17,25],prot:[2.5,6],stab:[0,.4],fz:[50,66],ov:[80,150],draw:[-14,-10],frt:null,
  conf:'prática',src:['Sem fonte primária: creme batido + pâte à bombe/merengue congelados em forma; o ar vem do batimento, não da mantecadora']},
 americano:{n:'Ice cream americano (premium)',fam:'internacional',like:'crema',proc:'batch',serveT:-15,serveCtx:'vitrine',
  sol:[36,42],fat:[10,16],msnf:[9,11],swt:[13,18],pod:[14,19],prot:[3.2,4.2],stab:[.1,.35],fz:[68,76],ov:[60,90],draw:[-7,-5],frt:null,
  conf:'fonte',src:[SRC_GOFF+': misturas hard-frozen com 10–16% de gordura, 9,5–11% de MSNF, 36,5–41,4% de sólidos; overrun premium 60–90%','21 CFR 135.110: sorvete ≥ 10% de gordura láctea']},
 philadelphia:{n:'Philadelphia (sem ovo)',fam:'internacional',like:'crema',proc:'batch',serveT:-15,serveCtx:'vitrine',yolkMax:.3,
  sol:[36,42],fat:[10,16],msnf:[9,11],swt:[13,18],pod:[14,19],prot:[3.2,4.2],stab:[.1,.35],fz:[68,76],ov:[40,90],draw:[-7,-5],frt:null,
  conf:'fonte',src:[SRC_GOFF,'Estilo sem gema: limite de gema fresca de 0,3% (traço)']},
 custard:{n:'French / frozen custard',fam:'internacional',like:'crema',proc:'batch',serveT:-12,serveCtx:'vitrine',yolkSolMin:1.4,
  sol:[37,44],fat:[10,16],msnf:[8.5,11],swt:[13,18],pod:[14,19],prot:[3.5,5],stab:[0,.3],fz:[66,74],ov:[20,45],draw:[-8,-5],frt:null,
  conf:'fonte',src:['21 CFR 135.110: frozen custard com 1,4% de sólidos de gema (mínimo 1,12% com sabores volumosos)',SRC_GOFF+' (gordura e MSNF)','Overrun baixo: prática']},
 soft:{n:'Soft serve',fam:'internacional',like:'crema',proc:'soft',serveT:-6.5,serveCtx:'máquina',
  sol:[32,37],fat:[3,10],msnf:[10,13],swt:[12,16],pod:[13,18],prot:[3.5,5],stab:[.15,.4],fz:[35,55],ov:[30,45],draw:[-8,-5],frt:null,
  conf:'fonte',src:[SRC_GOFF+': soft serve 10% gordura, 12–12,5% MSNF, 36% sólidos','SDSU Extension, "Soft serve frozen desserts and frozen yogurts": gordura 4–5%, ~33% de sólidos, overrun 30–35%','Temperatura de extração e fração congelada: prática, a confirmar medindo']},
 froyo:{n:'Frozen yogurt',fam:'internacional',like:'crema',proc:'soft',serveT:-6.5,serveCtx:'máquina',yogMin:15,
  sol:[27,35],fat:[0,4],msnf:[11,15],swt:[13,18],pod:[13,19],prot:[4,6],stab:[.2,.5],fz:[35,55],ov:[30,45],draw:[-8,-5],frt:null,
  conf:'fonte',src:[SRC_GOFF+': frozen yogurt 2% gordura, 14% MSNF, 15% açúcar, 0,35% estabilizante','SDSU Extension: gordura típica 0,5–3%; sem padrão legal de teor de iogurte (de cultura sem incubação a 15–20% de iogurte)']},
 kulfi:{n:'Kulfi',fam:'tradicional',like:'crema',proc:'molded',serveT:-12,serveCtx:'palito',
  sol:[38,47],fat:[9,14],msnf:[10,15],swt:[14,20],pod:[14,20],prot:[3.5,5.5],stab:[0,.6],fz:[58,72],ov:[0,10],draw:[-14,-10],frt:null,
  conf:'fonte',src:['Formulação controle de "Preparation of Kulfi with incorporation of pineapple pulp" (The Pharma Innovation / phytojournal, 2021): leite evaporado a 75% do volume, creme, leite em pó, 15% de açúcar, 0,5% de estabilizante → ≈ 12,8% gordura, 11,9% MSNF, 42,6% sólidos (calculado aqui)','Moldado e congelado parado (sem ar). As tabelas de composição do artigo foram descartadas por inconsistência (sólidos totais de 5%)']},
 dondurma:{n:'Dondurma (sorvete turco)',fam:'tradicional',like:'crema',proc:'batch',serveT:-12,serveCtx:'vitrine',
  sol:[32,40],fat:[3,9],msnf:[7,11],swt:[16,23],pod:[16,22],prot:[3,5],stab:[.5,1.5],fz:[64,74],ov:[5,25],draw:[-9,-6],frt:null,
  conf:'prática',src:['Sem fonte primária de composição: leite (tradicionalmente de cabra), açúcar, salep (glucomanano) e almécega; elástico e denso, sovado durante a mantecação']},
 paleta_fruta:{n:'Paleta / picolé de fruta',fam:'tradicional',like:'sorbetto',proc:'molded',serveT:-15,serveCtx:'palito',
  sol:[22,32],fat:[0,1],msnf:[0,.5],swt:[16,25],pod:[16,25],prot:[0,1.5],stab:[.1,.5],fz:[70,84],ov:[0,10],draw:[-30,-18],frt:[30,70],
  conf:'prática',src:['Sem fonte primária: moldado, sem ar, mordido ainda duro (fração congelada maior que a de vitrine)']},
 paleta_creme:{n:'Paleta / picolé cremoso',fam:'tradicional',like:'crema',proc:'molded',serveT:-15,serveCtx:'palito',
  sol:[30,40],fat:[4,12],msnf:[7,11],swt:[15,22],pod:[15,22],prot:[2.5,4.5],stab:[.15,.5],fz:[70,82],ov:[0,15],draw:[-30,-18],frt:null,
  conf:'prática',src:['Sem fonte primária: base de gelato em forma, sem ar, servida dura']}
});
/* comportamento-base de um tipo nas regras do motor (os tipos originais são eles mesmos) */
const tbase=t=>PROF[t]&&PROF[t].like||t;
const STAB_RNG={agar:[.05,.2],alg:[.1,.3],psy:[.1,.5],konj:[.1,.5],tara:[.05,.2],pect:[.05,.2],citf:[.15,.6],gel:[.1,.3],acacia:[.2,1],neutro:[.25,.6],lbg:[.1,.3],guar:[.05,.2],xan:[.03,.15],carr:[.01,.03],cmc:[.1,.3],starch:[.5,3],lec:[.2,.5],mono:[.1,.3]};
const STAB_N={agar:'Ágar-ágar',alg:'Alginato',psy:'Psyllium',konj:'Glucomanano',tara:'Goma tara',pect:'Pectina',citf:'Fibra de citros',gel:'Gelatina',acacia:'Goma acácia',neutro:'Neutro',lbg:'Goma jataí (LBG)',guar:'Goma guar',xan:'Goma xantana',carr:'Carragena',cmc:'CMC',starch:'Amido',lec:'Lecitina',mono:'Mono e diglicerídeos'};

