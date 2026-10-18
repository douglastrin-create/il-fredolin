/* ---------- COMPONENTES DE NEUTRO ---------- */
/* Funções (0–5): visc = viscosidade da mistura · anti = anti-recristalização · corpo = corpo/cremosidade
   derr = resistência ao derretimento · siner = proteção contra sinérese/separação de soro · emul = emulsificação */
const NCOMP={
 lbg:{n:'Goma jataí (LBG)',c:{stab:92,w:8},hyd:85,dose:[.1,.3],f:{visc:3,anti:5,corpo:4,derr:4,siner:-1,emul:0},cost:220},
 guar:{n:'Goma guar',c:{stab:90,w:10},hyd:20,dose:[.05,.2],f:{visc:5,anti:3,corpo:3,derr:3,siner:-1,emul:0},cost:90},
 tara:{n:'Goma tara',c:{stab:90,w:10},hyd:80,dose:[.05,.2],f:{visc:4,anti:4,corpo:4,derr:4,siner:-.5,emul:0},cost:200},
 xan:{n:'Goma xantana',c:{stab:92,w:8},hyd:20,dose:[.02,.1],f:{visc:5,anti:3,corpo:2,derr:4,siner:1,emul:0},cost:120},
 carr:{n:'Carragena kappa/iota',c:{stab:90,w:10},hyd:70,dose:[.01,.03],f:{visc:2,anti:2,corpo:2,derr:3,siner:5,emul:0},cost:180},
 cmc:{n:'CMC',c:{stab:92,w:8},hyd:20,dose:[.1,.3],f:{visc:4,anti:4,corpo:3,derr:3,siner:0,emul:0},cost:80},
 pect:{n:'Pectina',c:{stab:90,w:10},hyd:80,dose:[.05,.2],f:{visc:2,anti:2,corpo:2,derr:3,siner:1,emul:0},cost:180},
 citf:{n:'Fibra de citros',c:{stab:85,w:8,oth:7},hyd:20,dose:[.15,.6],f:{visc:3,anti:3,corpo:4,derr:4,siner:2,emul:1},cost:120},
 gel:{n:'Gelatina',c:{stab:88,w:12},hyd:60,dose:[.1,.3],f:{visc:2,anti:4,corpo:3,derr:3,siner:1,emul:0},animal:1,cost:90},
 acacia:{n:'Goma acácia',c:{fib:87,w:10,ash:3},hyd:20,dose:[.2,1],f:{visc:1,anti:2,corpo:2,derr:1,siner:0,emul:3},cost:85},
 inu:{n:'Inulina',c:{inu:92,w:5,oth:3},hyd:20,dose:[1,4],f:{visc:1,anti:2,corpo:3,derr:1,siner:0,emul:0},cost:45},
 lec:{n:'Lecitina',c:{emul:97,w:1,oth:2},hyd:20,dose:[.2,.5],f:{visc:0,anti:0,corpo:1,derr:2,siner:0,emul:5},cost:90},
 starch:{n:'Amido de milho (maisena)',c:{w:12,oth:88},hyd:85,dose:[1,3],f:{visc:3,anti:3,corpo:4,derr:2,siner:2,emul:0},cost:10},
 konj:{n:'Glucomanano (konjac / salep)',c:{stab:90,w:10},hyd:60,dose:[.1,.5],f:{visc:5,anti:4,corpo:5,derr:5,siner:1,emul:0},cost:150},
 mono:{n:'Mono e diglicerídeos',c:{emul:100},hyd:60,dose:[.1,.3],f:{visc:0,anti:1,corpo:2,derr:3,siner:0,emul:5},cost:60},
 dex:{n:'Dextrose (veículo)',c:{glu:99.5,w:.5},hyd:20,dose:null,f:{},cost:16},
 malto:{n:'Maltodextrina DE 19 (veículo)',c:{gs:95,w:5},hyd:20,dose:null,f:{},cost:14},
 sac:{n:'Sacarose (veículo)',c:{suc:99.9,w:.1},hyd:20,dose:null,f:{},cost:5}
};
const NFUN=[['visc','Viscosidade da mistura'],['anti','Anti-recristalização'],['corpo','Corpo e cremosidade'],['derr','Resistência ao derretimento'],['siner','Proteção contra soro'],['emul','Emulsificação']];
/* Blends de "Partir de" no Creator. Só fórmulas publicadas por mestres, tradições documentadas ou centros acadêmicos;
   kind: mestre | tradicao | academia | casa. best = onde rende mais; note = por quê / cuidados; ref = fonte. */
const NEUTRO_PRESETS=[
 {id:'nx_dondoli',name:'Addensanti Dondoli',src:'Sergio Dondoli · Corso di Gelateria',kind:'mestre',dairy:true,dose:5,parts:{citf:500,guar:200,lbg:300},
  best:'Sorbetti e gelati di frutta; também cremas leves de vitrine.',note:'Fibra de citros + guar + jataí: a fibra retém água e segura o derretimento sem pesar; é o neutro de todas as receitas do curso de Dondoli (San Gimignano). Pasteurize a 85 °C para a jataí trabalhar inteira.',ref:'S. Dondoli, Corso di Gelateria Artigianale'},
 {id:'nx_migoya',name:'Stabilizer-Emulsifier Mix Migoya',src:'F. Migoya · Frozen Desserts, p. 371',kind:'mestre',dairy:true,dose:3.6,parts:{xan:200,lbg:250,guar:250,mono:200},
  best:'Cremas com gordura (fiordilatte, chocolate, frutos secos) servidas a −11/−13 °C.',note:'Galactomananas + xantana para corpo e derretimento lento; mono e diglicerídeos dão textura seca e cremosa. Livro-texto do The Culinary Institute of America.',ref:'F. Migoya, Frozen Desserts (CIA, 2008)'},
 {id:'nx_migoyas',name:'Sorbet Stabilizer Mix Migoya',src:'F. Migoya · Frozen Desserts, p. 390',kind:'mestre',dairy:false,dose:3.6,parts:{gel:275,cmc:175,lbg:250,guar:250},
  best:'Sorbetti de fruta (não vegano: contém gelatina).',note:'Gelatina + CMC dão corpo e brilho a misturas sem proteína; jataí e guar seguram os cristais na vitrine.',ref:'F. Migoya, Frozen Desserts (CIA, 2008)'},
 {id:'nx_goff',name:'Clássico acadêmico: jataí + guar + carragena',src:'Goff & Hartel · Ice Cream (2013) · University of Guelph',kind:'academia',dairy:true,dose:2.5,parts:{lbg:650,guar:275,carr:75},
  best:'Gelati a base de leite (fiordilatte, crema, cioccolato) em vitrine com variação de temperatura.',note:'A jataí é a goma mais eficaz contra a recristalização no choque térmico (Sutton & Wilcox 1998; Donhowe & Hartel, Wisconsin 1996); o guar dá viscosidade a frio; a carragena a 0,01–0,015% da mistura impede a separação de soro que jataí e guar provocam com as caseínas (Thaiudom & Goff, Guelph 2003). Dose do blend 0,2–0,3%.',ref:'H.D. Goff & R.W. Hartel, Ice Cream, 7ª ed. (Springer, 2013)'},
 {id:'nx_carrube',name:'Farina di semi di carrube (jataí pura)',src:'Tradição italiana · Grom · S. Orsoni (Arte Heladero)',kind:'tradicao',dairy:false,dose:3,parts:{lbg:1000},
  best:'Sorbetti e gelati di frutta; cremas simples quando se quer rótulo de um só espessante.',note:'O espessante natural mais antigo da gelateria italiana; a Grom (Turim) usa apenas E410. Precisa de 85 °C. Em base láctea pode separar soro na maturação: com leite, prefira o clássico com carragena ou some fibra de citros.',ref:'Il Fatto Alimentare (Grom, G. Martinetti); Arte Heladero, AH 159'},
 {id:'nx_giapo',name:'Blend natural Giapo',src:'Giapo · Auckland · Arte Heladero, AH 167',kind:'mestre',dairy:true,dose:3.2,parts:{lbg:330,guar:170,xan:170,acacia:165,lec:165},
  best:'Cremas ricas (baunilha, chocolate branco, frutos secos) e gelatos de vitrine longa.',note:'Cinco componentes vegetais: jataí e guar para cristais e corpo, xantana para derretimento lento, goma acácia e lecitina de soja como emulsificantes naturais. Proporção da receita de baunilha de Giapo (12 g em ≈3,7 kg de mistura).',ref:'Arte Heladero, recetario de heladería artesana, AH 167'},
 {id:'nx_sicilia',name:'Amido: crema rinforzata siciliana',src:'Tradição siciliana (gelato sem ovos)',kind:'tradicao',dairy:true,dose:25,parts:{starch:1000},
  best:'Gelati di latte sem ovos: pistacchio, mandorla, nocciola, cioccolato e cremas para brioche; também a base de Jeni\'s (EUA, ~1% de amido + cream cheese).',note:'Leite, açúcar e amido cozidos a 85–90 °C por 1–2 min. Textura densa e fresca, sabor limpo do leite. Não serve para frutas cruas nem sorbetti (o amido precisa cozinhar e turva a fruta). Acima de ~3% vira pudim.',ref:'Tradição do Sul da Itália; D. Lebovitz (pistacchio siciliano); J. Britton Bauer, Jeni\'s Splendid Ice Creams'},
 {id:'nx_salep',name:'Glucomanano estilo salep (dondurma)',src:'Tradição de Kahramanmaraş · Ankara University',kind:'tradicao',dairy:true,dose:4,parts:{konj:1000},
  best:'Gelato elástico estilo dondurma turco (leite de cabra, mastic). Não indicado para vitrine italiana.',note:'O salep (tubérculo de orquídea) estabiliza pelo glucomanano: textura elástica que estica e quase não derrete. O teor de glucomanano decide a separação de fases, a dureza e o derretimento (Turkmen et al., Ankara 2021). Salep selvagem é protegido: o konjac é o substituto usado na prática.',ref:'N. Turkmen et al., J. Food Processing and Preservation 45 (2021)'},
 {id:'nx_fredolin',name:'Neutro Il Fredolin',src:'Sua formulação',kind:'casa',dairy:true,dose:25,parts:{inu:350,acacia:100,lbg:30,guar:12,tara:8},
  best:'Base da casa para cremas.',note:'Inulina como veículo funcional (corpo e fibra) com jataí, guar, tara e goma acácia.',ref:'Il Fredolin'}
];
/* Estudos promissores (não entram como blend pronto: ainda sem uso consolidado na gelateria) */
const NEUTRO_STUDIES=[
 {n:'Goma de semente de manjericão (Ocimum basilicum)',where:'University of Guelph (Canadá), M. BahramParvar & H.D. Goff, 2013',res:'A 0,1–0,2% reduziu o crescimento dos cristais de gelo em ≈30–40% frente a um estabilizante comercial de CMC + guar no ciclo térmico, e deixou o derretimento mais lento.',best:'Cremas de vitrine com variação de temperatura.'},
 {n:'Fibras vegetais (inclusive de citros)',where:'University of Nottingham (Reino Unido), M. Neville, T. Foster & S. Harding, 2017',res:'Controlam a recristalização na medida da água que retêm e atrasam a primeira gota no derretimento; fibras pouco refinadas deixam sensação pulverulenta. Com guar, controle ótimo, mas textura excessiva.',best:'Sorbetti e frutta, combinadas com pouca goma.'},
 {n:'Mucilagem de chia',where:'Universidade Estadual de Maringá (2017) e Massey University (Nova Zelândia, 2024)',res:'Substitui parte da gordura e do estabilizante: mais overrun e menos firmeza; com jataí alta, derretimento mais lento. Aceitação sensorial boa, ainda com variação de extração.',best:'Gelatos leves e veganos.'},
 {n:'Salep de diferentes orquídeas',where:'Ankara University (Turquia), Turkmen et al., 2021',res:'O teor de glucomanano explica dureza, separação de fases e derretimento; algumas espécies servem melhor ao dondurma, outras não devem ser colhidas.',best:'Gelatos elásticos de leite.'}
];

/* ---------- LABORATÓRIO DE ESTABILIZAÇÃO (v18.5): FICHA TÉCNICA DOS COMPONENTES ----------
   Só entra aqui o que uma fonte consultada afirma. Campo sem fonte fica null e a tela mostra "sem dado registrado".
   "Inferência do app" marca conclusões tiradas pelo app a partir da fonte (não afirmadas por ela).
   As notas de 0–5 de NCOMP.f e as doses de NCOMP.dose são PRÁTICA do app (sem medição) e aparecem assim na tela.
   Fabricante = ficha técnica comercial (útil, mas não revisada por pares). */
const NREF={
 guelph:{c:'Goff, H.D. — Ice Cream Technology e-book, Univ. de Guelph, cap. "Stabilizers"',u:'https://books.lib.uoguelph.ca/icecreamtechnologyebook/chapter/stabilizers/',t:'academia'},
 guelphE:{c:'Goff, H.D. — Ice Cream Technology e-book, Univ. de Guelph, cap. "Emulsifiers"',u:'https://books.lib.uoguelph.ca/icecreamtechnologyebook/chapter/emulsifiers/',t:'academia'},
 bahram13:{c:'Bahram Parvar, Razavi, Mazaheri Tehrani & Alipour (2013) J. Agr. Sci. Tech. 15:757–769',u:'https://jast.modares.ac.ir/article_15242_3721e4fa10597f0aa6ab442e95508de1.pdf',t:'artigo'},
 patel:{c:'Patel, D. — Stabilizers, thickeners and gelling agents for the food industry (INFLIBNET, CC BY-NC)',u:'https://ebooks.inflibnet.ac.in/ftp03/chapter/stabilizers-thickeners-and-gelling-agents-for-the-food-industry/',t:'didático'},
 goyc95:{c:'Goycoolea, Richardson, Morris & Gidley (1995) — xantana com jataí ou konjac: ligação heterotípica',u:'https://digitum.um.es/digitum/bitstream/10201/139110/4/Free%20stoichiometry-and-conformation-of-xanthan-in-synergistic-gelation-with-locust-bean-gum-or-konjac.pdf',t:'artigo'},
 colony:{c:'Colony Gums — ficha técnica da goma tara',u:'https://www.colonygums.com/uploads/COGU-103_E_DATASHEET_TARA_SHORT.pdf',t:'fabricante'},
 sosa:{c:'Sosa Ingredients — O que são as pectinas',u:'https://www.sosa.cat/en/que-son-las-pectinas/',t:'fabricante'},
 jrs:{c:'JRS — Vitacel citrus fiber',u:'https://www.jrs.eu/en/food-ingredients/products/vitacel-citrus-fiber.php',t:'fabricante'},
 bonnema10:{c:'Bonnema, Kolberg, Thomas & Slavin (2010) J. Am. Diet. Assoc. 110(6):865–868',u:'https://experts.umn.edu/en/publications/gastrointestinal-tolerance-of-chicory-inulin-products/',t:'artigo'},
 supply:{c:'SupplySide — Getting to the root of tapioca starch',u:'https://www.supplysidesj.com/market-trends-analysis/getting-to-the-root-of-tapioca-starch',t:'revista técnica'},
 srijun06:{c:'Srijunthongsiri & Pongsawatmanit (2006) Kasetsart J. (Nat. Sci.) 40:203–208',u:'https://www.thaiscience.info/journals/Article/TKJN/10471357.pdf',t:'artigo'},
 neville17:{c:'Neville, Foster & Harding (2017), Univ. de Nottingham — fibras vegetais em sorvete',u:null,t:'artigo'},
 turkmen21:{c:'Turkmen et al. (2021), Ankara University — salep e glucomanano',u:null,t:'artigo'}
};
/* f(t,src) = fato com fonte; ori = origem; hyd = hidratação; gel = gelificação; leite/acido/calcio = compatibilidade;
   lim = limitações de processo; ef = efeitos estruturais; nat = natural | fermentação | modificado | processado | animal */
const nkf=(t,...src)=>({t,src});
const NKB={
 lbg:{ori:'Endosperma da semente da alfarrobeira (jataí)',nat:'natural',
  hyd:nkf('Parcialmente solúvel a frio; só hidrata por completo acima de 85 °C.','patel'),
  gel:nkf('Não gelifica sozinha. Com xantana forma gel elástico quando aquecida acima de ~60 °C e resfriada; misturar só a frio atrapalha a rede.','goyc95'),
  leite:nkf('Galactomananas tendem a separar soro com as proteínas do leite; a carragena (0,01–0,02% da mistura) é usada para prevenir.','guelph','bahram13'),
  acido:nkf('Estável de pH 3 a 11.','patel'),calcio:null,
  lim:nkf('Abaixo de 85 °C parte da goma fica sem função (o app calcula a fração hidratada pela pasteurização).','patel'),
  ef:nkf('Aumenta a viscosidade da fase não congelada; com isso retarda o crescimento dos cristais e protege no choque térmico.','guelph'),
  extra:nkf('Proporção manose:galactose ≈ 4:1 (≈ 3,5 em outra medição): menos galactose, mais sinergia.','patel','goyc95')},
 guar:{ori:'Endosperma da semente de guar (leguminosa)',nat:'natural',
  hyd:nkf('Mais solúvel a frio que a jataí; serve a pasteurização rápida. Melhor hidratação em pH 7,5–9.','guelph','patel'),
  gel:nkf('Não gelifica. Usada com xantana em sobremesas congeladas pela viscosidade; gel com xantana não relatado.','patel','goyc95'),
  leite:nkf('Como as demais gomas primárias, tende a separar soro em base láctea sem carragena.','guelph'),acido:null,calcio:null,lim:null,
  ef:nkf('Viscosidade alta a frio; mesmo papel geral de retardar cristais pela viscosidade.','guelph'),
  extra:nkf('Manose:galactose ≈ 2:1 (≈ 1,55 em outra medição): muito substituída, pouca sinergia.','patel','goyc95')},
 tara:{ori:'Semente de Caesalpinia spinosa (Peru)',nat:'natural',
  hyd:nkf('Só funcionalidade parcial a frio; a função completa exige calor no processo.','colony'),
  gel:nkf('Gel elástico com xantana ou carragena; viscosidade somada com guar e CMC.','colony'),
  leite:null,acido:nkf('Solução quase neutra (pH 5–7).','colony'),calcio:null,
  lim:nkf('Em geral usa-se menos tara que jataí para o mesmo efeito; a dose precisa ser testada.','colony'),
  ef:null,extra:nkf('Manose:galactose ≈ 3:1, entre guar e jataí.','colony')},
 xan:{ori:'Exopolissacarídeo de fermentação por Xanthomonas campestris',nat:'fermentação',
  hyd:null,
  gel:nkf('Não gelifica sozinha; gel com jataí ou konjac após aquecer acima de ~60 °C e resfriar.','goyc95'),
  leite:null,acido:nkf('Estável de pH 2 a 12; a função depende da força iônica.','patel'),calcio:null,
  lim:nkf('Pseudoplástica: a viscosidade cai com o cisalhamento.','patel'),
  ef:nkf('Com amido de mandioca reduziu a retrogradação e a água separada em ciclos de congela-descongela.','srijun06'),extra:null},
 carr:{ori:'Algas vermelhas',nat:'natural',
  hyd:nkf('Todas as carragenas dissolvem em água quente; a iota é mais solúvel que a kappa.','patel'),
  gel:nkf('Kappa e iota gelificam ao esfriar; a textura depende do cátion (K⁺, Ca²⁺). O gel é termorreversível e funde 5–20 °C acima da temperatura de gelificação.','patel'),
  leite:nkf('Coloide secundário: não é usada sozinha; previne a separação de soro que as outras gomas provocam com as proteínas do leite. Estudo com 0,01–0,02% da mistura: menos firmeza e mais lisura, sem efeito significativo em overrun e viscosidade.','guelph','bahram13'),
  acido:null,calcio:nkf('Gel depende do cátion presente (Ca²⁺ para iota, K⁺ para kappa).','patel'),lim:null,ef:null,extra:null},
 cmc:{ori:'Celulose de polpa vegetal modificada quimicamente',nat:'modificado',
  hyd:nkf('Solúvel em água fria ou quente.','patel'),gel:nkf('Não gelifica no aquecimento.','patel'),
  leite:null,acido:null,calcio:null,lim:nkf('Dispersões afinam com o cisalhamento e com o aumento de temperatura.','patel'),ef:null,extra:null},
 pect:{ori:'Casca de citros, polpa de maçã ou de beterraba',nat:'natural',
  hyd:nkf('A função gelificante ativa a partir de 80–85 °C; dispersar com açúcar (1:5) para não empelotar. Cálcio alto dificulta a dissolução.','sosa'),
  gel:nkf('Alta metoxila (HM) só gelifica com sólidos solúveis ≥ 60 °Bx e pH 2–3,5. Baixa metoxila (LM) gelifica com íons cálcio, em Brix baixo e ampla faixa de pH.','sosa'),
  leite:null,acido:nkf('HM exige pH 2–3,5 para gelificar.','sosa'),calcio:nkf('LM depende de cálcio; excesso de cálcio desfaz o gel.','sosa'),
  lim:nkf('Inferência do app: uma calda de sorbetto (≈ 28–35 °Bx) fica longe dos 60 °Bx, então a pectina HM só engrossa, não forma gel. O app não distingue HM de LM.','sosa'),
  ef:null,extra:null},
 citf:{ori:'Fibra da casca de citros',nat:'natural',
  hyd:nkf('A ativação por cisalhamento alto aumenta a absorção de água (mixer potente ou homogeneizador).','jrs'),
  gel:null,leite:null,acido:null,calcio:null,
  lim:nkf('Fibras pouco refinadas deixam sensação pulverulenta.','neville17'),
  ef:nkf('Controla a recristalização na medida da água que retém e atrasa a primeira gota no derretimento.','neville17'),extra:null},
 gel:{ori:'Colágeno animal (pele ou ossos)',nat:'animal',
  hyd:nkf('Hidrata em água morna ou quente; forma solução pouco viscosa.','patel'),
  gel:nkf('Gelifica ao esfriar em gel elástico, sem sinérese.','patel'),leite:null,acido:null,calcio:null,
  lim:nkf('Pode não impedir os efeitos do choque térmico; foi substituída na indústria por polissacarídeos vegetais, mais eficazes e baratos.','patel','guelph'),
  ef:null,extra:null},
 acacia:{ori:'Exsudado da acácia (África)',nat:'natural',
  hyd:nkf('Dissolve até 50% em água.','patel'),gel:null,leite:null,acido:null,calcio:null,lim:null,
  ef:nkf('Viscosidade baixa em comparação com outras gomas.','patel'),extra:null},
 inu:{ori:'Raiz de chicória (ou agave)',nat:'natural',hyd:null,gel:null,leite:null,acido:null,calcio:null,
  lim:nkf('Adultos saudáveis toleraram bem até 10 g/dia de inulina nativa e até 5 g/dia de oligofrutose; 10 g/dia de oligofrutose aumentou os sintomas (gases, inchaço).','bonnema10'),
  ef:null,extra:null},
 starch:{ori:'Milho (o app trata todo amido como amido de milho)',nat:'natural',
  hyd:nkf('Amido de milho gelatiniza 10–15 °C acima do de mandioca (≈ 59 °C).','supply'),
  gel:nkf('Amido nativo dá pasta fraca e borrachuda no calor e gel indesejável ao esfriar; o pré-gelatinizado engrossa a frio.','patel'),
  leite:null,acido:null,calcio:null,
  lim:nkf('Amido de mandioca forma pasta (não gel firme), tem ≈ 17% de amilose contra ≈ 25% do milho e é translúcido e neutro. A pasta de mandioca separa água no congela-descongela; a xantana reduz essa separação.','supply','srijun06'),
  ef:null,extra:null},
 konj:{ori:'Tubérculo de konjac (substituto do salep)',nat:'natural',hyd:null,
  gel:nkf('Gel sinérgico com xantana após aquecer e resfriar.','goyc95'),leite:null,acido:null,calcio:null,lim:null,
  ef:nkf('O teor de glucomanano do salep explica dureza, separação de fases e derretimento do dondurma.','turkmen21'),extra:null},
 lec:{ori:'Soja ou girassol',nat:'natural',hyd:null,gel:null,leite:null,acido:null,calcio:null,lim:null,ef:null,extra:null},
 mono:{ori:'Hidrólise parcial de gorduras ou óleos (E471)',nat:'processado',hyd:null,gel:null,leite:null,acido:null,calcio:null,
  lim:nkf('Estabilizantes e emulsificantes somados ficam abaixo de 0,5% do sorvete. Estudo de 2013 usou 0,15% de E471.','guelphE','bahram13'),
  ef:nkf('Desloca proteína da superfície da gordura e enfraquece a membrana do glóbulo: textura lisa e seca, bom derretimento.','guelphE'),extra:null}
};
/* sinergias e interações documentadas: só qualitativas, cada uma com fonte. Não há coeficiente numérico no app. */
const NSYN=[
 {a:'lbg',b:'xan',t:'Gel elástico: aquecer acima de ~60 °C e resfriar; misturar só a frio atrapalha a rede.',src:['goyc95']},
 {a:'konj',b:'xan',t:'Gel elástico, mesma condição de aquecimento.',src:['goyc95']},
 {a:'tara',b:'xan',t:'Gel elástico.',src:['colony']},
 {a:'tara',b:'carr',t:'Gel elástico.',src:['colony']},
 {a:'tara',b:'guar',t:'Viscosidade somada.',src:['colony']},
 {a:'tara',b:'cmc',t:'Viscosidade somada.',src:['colony']},
 {a:'guar',b:'xan',t:'Usadas juntas em sobremesas congeladas pela viscosidade; gel não relatado.',src:['patel']},
 {a:'xan',b:'starch',t:'Reduz retrogradação e separação de água do amido (estudo com mandioca).',src:['srijun06']},
 {a:'carr',b:'leite',t:'Previne a separação de soro causada pelas outras gomas com as proteínas do leite.',src:['guelph','bahram13']}
];
const NSHORT={lbg:'jataí',guar:'guar',tara:'tara',xan:'xantana',konj:'konjac',carr:'carragena',cmc:'CMC',starch:'amido'};
const NNAT={natural:'natural',fermentação:'natural (fermentação)',modificado:'modificado quimicamente',processado:'processado (E471)',animal:'animal'};
/* temas de §23 sem componente próprio no app: o que se sabe e o que falta */
const NKB_TOPICS=[
 {n:'Proteínas funcionais',t:'Entram pela receita (leite em pó, WPC, gema), não pelo neutro: o motor conta no MSNF e na proteína, mas não tem modelo funcional próprio para espuma ou emulsão de proteína.',src:[]},
 {n:'Gema como emulsificante',t:'Foi o emulsificante original do sorvete.',src:['guelphE']},
 {n:'Polissorbato 80',t:'Éster de sorbitano com ácido oleico; emulsificante sintético. Não está no banco do app (o laboratório não exige sintéticos).',src:['guelphE']},
 {n:'Fibras solúveis além da inulina (polidextrose, fibra solúvel de milho)',t:'Estão no banco como ingredientes de receita (composição de ficha típica, sem fonte primária) e o gerador do sem açúcar usa a fibra de milho. Não são componentes de neutro, e a tolerância intestinal delas não tem fonte registrada no app.',src:[]},
 {n:'Maturação',t:'O app modela a hidratação das gomas na maturação (curva por temperatura e tempo). No estudo de 2013 as misturas maturaram uma noite a 4 °C. Tempo mínimo com fonte: sem dado registrado.',src:['bahram13']}
];
