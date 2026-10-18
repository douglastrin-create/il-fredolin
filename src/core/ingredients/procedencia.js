/* ---------- PROCEDÊNCIA DA COMPOSIÇÃO (v18.11 · §14, §22) ----------
   Cada ingrediente tem uma classe de procedência, derivada do que o banco registra (nada é inventado):
   definição (substância pura, ≥ 95% de um componente) · tabela (TACO/USDA citada) · ficha (ficha típica ou de
   fabricante citada) · seu cadastro · calculado (neutros) · sem fonte (valor estimado).
   ING_REF guarda os números da referência conferida, para o teste exigir a concordância (≤ 1 g/100 g por componente,
   exceto o que o rótulo ajusta). A incerteza da composição depende da classe (ver UNC_G em incerteza.js). */
const PROV_N={definicao:'definição',tabela:'tabela',ficha:'ficha técnica',usuario:'seu cadastro',calculado:'calculado',sem:'sem fonte'};
const PROV_D={definicao:'substância de composição definida (pureza ≥ 95%)',tabela:'tabela de composição citada (TACO ou USDA)',ficha:'ficha técnica típica ou de fabricante citada',
 usuario:'cadastrado por você a partir da ficha do fornecedor',calculado:'mistura calculada dos componentes',sem:'composição sem fonte registrada: valor estimado'};
/* referências conferidas em 18/10/2026 (USDA SR Legacy, por 100 g) */
const ING_REF={
 leite:{src:'USDA SR Legacy FDC 172217 (leite integral 3,25%); gordura ajustada ao rótulo de 3,5%',ref:{w:88.1,prot:3.15,fat:3.27,lac:4.78,ash:.67},adj:['fat','w']},
 creme35:{src:'USDA SR Legacy FDC 170859 (creme de leite 36,1%); gordura ajustada ao rótulo de 35% (a água compensa)',ref:{w:57.7,prot:2.84,fat:36.1,lac:2.84,ash:.53},adj:['fat','w']},
 lpd:{src:'USDA SR Legacy FDC 170877 (leite em pó desnatado), aproximado; proteína do banco 35 g contra 36,2 g da USDA (diferença registrada, valor do banco mantido)',ref:{w:3.16,prot:36.2,fat:.77,lac:52.0,ash:7.93},adj:[],dev:{prot:35}}};
/* hidratos de composição fixa pela estequiometria */
const DEF_HYD={dextrosem:'dextrose monoidratada: C6H12O6·H2O = 90,9% glicose + 9,1% água de cristalização'};
function ingProv(i){if(!i)return'sem';if(DEF_HYD[i.id])return'definicao';if(i.custom)return'usuario';if(i.blend||i.cat==='Meus neutros')return'calculado';if(ING_REF[i.id])return'tabela';
 const f=String(i.fonte||'');if(/TACO|USDA|tabela/i.test(f))return'tabela';if(f)return'ficha';
 const c=i.c||{};if((+c.w||0)>=99)return'definicao';let mx=0;for(const k in c)if(k!=='w'&&(+c[k]||0)>mx)mx=+c[k];return mx>=95?'definicao':'sem';}
const ingSrc=i=>i&&ING_REF[i.id]?ING_REF[i.id].src:i&&DEF_HYD[i.id]?DEF_HYD[i.id]:(i&&i.fonte)||'';
/* participação de cada procedência na massa da receita */
function recipeProv(st){const sh={};let tot=0;const sem=[];
 (st.recipe||[]).forEach(r=>{const i=ING_BY[r.id];const g=+r.g||0;if(!i||!(g>0))return;const p=ingProv(i);sh[p]=(sh[p]||0)+g;tot+=g;if(p==='sem')sem.push({id:r.id,g});});
 const pct={};for(const k in sh)pct[k]=tot?sh[k]/tot*100:0;sem.sort((a,b)=>b.g-a.g);
 return{pct,tot,sem,known:tot?100-(pct.sem||0):0};}
