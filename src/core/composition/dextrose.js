
/* forma da dextrose para sugestões quando a receita não tem nenhuma (preferência do usuário; monoidratada é a do mercado) */
var DEX_OVR=null;
/* dextrose para sugestões: a que já está na receita; senão a forma preferida */
const dexPref=st=>{const r=(st&&st.recipe)||[];return r.some(x=>x.id==='dextrosem')?'dextrosem':r.some(x=>x.id==='dextrose')?'dextrose':(DEX_FORM()==='anid'?'dextrose':'dextrosem');};
/* v18.10 · a preferência vem da tela por injeção (DEX_PREF); o núcleo não lê o estado da tela. No Web Worker fica 'mono'. */
var DEX_PREF=()=>'mono';
function DEX_FORM(){if(DEX_OVR)return DEX_OVR;try{return DEX_PREF()||'mono';}catch(e){return'mono';}}
