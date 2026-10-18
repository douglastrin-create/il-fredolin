/* ==== 66-team.js ==== */
/* ===================== IL FREDOLIN · ENTRADA E EQUIPE (aplicativo) =====================
   Telas de configuração, entrada, criação de conta, senha esquecida e primeiro acesso;
   página Equipe (convites e perfis, só Maestro). No artefato nada disto aparece. */
const jwtOf=t=>{try{return JSON.parse(decodeURIComponent(escape(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))));}catch(e){return{};}};
const AUTH={state:'boot',mode:'login',f:{email:'',pw:'',pw2:'',name:'Il Fredolin',url:CFG.url,key:CFG.key},err:'',msg:'',busy:false,recovery:false,
 uid(){return SB.sess?(SB.sess.user&&SB.sess.user.id)||jwtOf(SB.sess.access_token).sub||null:null;},
 email(){return SB.sess?String((SB.sess.user&&SB.sess.user.email)||jwtOf(SB.sess.access_token).email||'').toLowerCase():'';},
 async boot(){
  /* links que chegam por e-mail (confirmação de conta, nova senha) trazem a sessão no endereço */
  const h=new URLSearchParams((location.hash||'').replace(/^#/,''));
  if(h.get('access_token')){SB.setSess({access_token:h.get('access_token'),refresh_token:h.get('refresh_token'),expires_in:+h.get('expires_in')||3600,user:null});this.recovery=h.get('type')==='recovery';}
  if(h.get('error_description'))this.err=h.get('error_description').replace(/\+/g,' ');
  if(h.get('access_token')||h.get('error')){try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}}
  if(!SB.configured()){this.state='setup';return APPEV.emit('changed',{now:true});}
  if(!SB.sess){this.state='login';return APPEV.emit('changed',{now:true});}
  if(this.recovery){this.state='newpass';return APPEV.emit('changed',{now:true});}
  const me=LS.get(MEKEY);
  /* já entrou neste aparelho: abre na hora, mesmo sem internet, e confere o perfil em segundo plano */
  if(me&&me.uid===this.uid()&&me.ws){this.enter(me);this.recheck();return;}
  this.state='loading';APPEV.emit('changed',{now:true});await this.membership();},
 async membership(){try{const rows=await SB.rpc('claim_invites');
   if(rows&&rows.length){const r=rows[0];this.enter({uid:this.uid(),email:this.email(),ws:r.workspace_id,wsName:r.workspace_name,role:r.role});return;}
   this.state=(await SB.rpc('has_workspace'))?'noinvite':'create';APPEV.emit('changed',{now:true});}
  catch(e){this.err=e.message;this.state=e.offline?'offline':'login';APPEV.emit('changed',{now:true});}},
 async recheck(){try{const rows=await SB.rpc('claim_invites');
   if(!rows||!rows.length){await this.signOut('Seu acesso à equipe foi removido pelo Maestro.');return;}
   const r=rows[0];if(r.role!==ME.role||r.workspace_id!==ME.ws){this.enter(Object.assign({},ME,{role:r.role,ws:r.workspace_id,wsName:r.workspace_name}));toast('Seu perfil agora é '+ROLE_N[r.role]+'.');}}
  catch(e){}},
 /* entra no espaço: troca de pessoa no aparelho apaga os dados locais; troca de perfil refaz a sincronização */
 enter(me){const owner=LS.get(OWNKEY);
  if(owner!==me.uid){STORE.wipe();SUPA_BACKEND.reset();setMasters([]);APPEV.emit('session',{reset:true});LS.set(OWNKEY,me.uid);}
  else if(ME.uid===me.uid&&ME.role!==me.role){STORE.wipe();setMasters([]);SUPA_BACKEND.reset(true);}
  ME=me;ROLE=me.role;LS.set(MEKEY,me);this.state='ready';this.err='';this.msg='';
  APPEV.emit('session',{enter:true});STORE.init();},
 lost(){if(this.state==='ready'){this.state='login';this.err='Sua sessão expirou. Entre de novo; seus dados continuam neste aparelho.';APPEV.emit('changed',{now:true});}},
 async signOut(msg){try{await SUPA_BACKEND.sync();}catch(e){}await SB.signOut();STORE.wipe();SUPA_BACKEND.reset();setMasters([]);
  LS.set(MEKEY,null);LS.set(OWNKEY,null);ME={uid:null,email:'',ws:null,wsName:'',role:'maestro'};ROLE='maestro';APPEV.emit('session',{reset:true,logout:true});
  this.state='login';this.mode='login';this.err=msg||'';this.msg='';this.f.pw='';APPEV.emit('changed',{now:true});},
 async go(){const f=this.f,email=f.email.trim().toLowerCase();this.err='';this.msg='';
  const need=(c,m)=>{if(!c){this.err=m;APPEV.emit('changed',{now:true});}return!c;};
  this.busy=true;APPEV.emit('changed',{now:true});
  try{
   if(this.state==='setup'){if(need(/^https:\/\/.+/.test(f.url.trim())&&f.key.trim().length>20,'Cole a URL (https://…supabase.co) e a chave anon do seu projeto.'))return;
    LS.set('fredolin_app_cfg',{url:f.url.trim(),key:f.key.trim()});location.reload();return;}
   if(this.state==='newpass'){if(need(f.pw.length>=6&&f.pw===f.pw2,'A senha precisa ter 6+ caracteres e as duas precisam ser iguais.'))return;
    await SB.setPassword(f.pw);this.recovery=false;toast('Senha alterada');this.state='loading';await this.membership();return;}
   if(this.state==='create'){await SB.rpc('create_workspace',{p_name:f.name||'Il Fredolin'});await this.membership();return;}
   if(need(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email),'Digite um e-mail válido.'))return;
   if(this.mode==='recover'){await SB.recover(email);this.msg='Se houver uma conta com '+email+', enviamos um link para criar uma nova senha. Abra o e-mail neste aparelho.';return;}
   if(need(f.pw.length>=6,'A senha precisa ter pelo menos 6 caracteres.'))return;
   if(this.mode==='signup'){if(need(f.pw===f.pw2,'As duas senhas precisam ser iguais.'))return;
    const has=await SB.signUp(email,f.pw);if(!has){this.mode='login';this.msg='Conta criada. Enviamos um link de confirmação para '+email+': toque nele e depois entre aqui com a sua senha.';return;}
    this.state='loading';await this.membership();return;}
   await SB.signIn(email,f.pw);f.pw='';this.state='loading';APPEV.emit('changed',{now:true});await this.membership();}
  catch(e){this.err=e.message;}
  finally{this.busy=false;APPEV.emit('changed',{now:true});}},
};

