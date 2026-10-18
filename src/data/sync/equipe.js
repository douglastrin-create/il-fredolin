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
  if(!SB.configured()){this.state='setup';return renderNow();}
  if(!SB.sess){this.state='login';return renderNow();}
  if(this.recovery){this.state='newpass';return renderNow();}
  const me=LS.get(MEKEY);
  /* já entrou neste aparelho: abre na hora, mesmo sem internet, e confere o perfil em segundo plano */
  if(me&&me.uid===this.uid()&&me.ws){this.enter(me);this.recheck();return;}
  this.state='loading';renderNow();await this.membership();},
 async membership(){try{const rows=await SB.rpc('claim_invites');
   if(rows&&rows.length){const r=rows[0];this.enter({uid:this.uid(),email:this.email(),ws:r.workspace_id,wsName:r.workspace_name,role:r.role});return;}
   this.state=(await SB.rpc('has_workspace'))?'noinvite':'create';renderNow();}
  catch(e){this.err=e.message;this.state=e.offline?'offline':'login';renderNow();}},
 async recheck(){try{const rows=await SB.rpc('claim_invites');
   if(!rows||!rows.length){await this.signOut('Seu acesso à equipe foi removido pelo Maestro.');return;}
   const r=rows[0];if(r.role!==ME.role||r.workspace_id!==ME.ws){this.enter(Object.assign({},ME,{role:r.role,ws:r.workspace_id,wsName:r.workspace_name}));toast('Seu perfil agora é '+ROLE_N[r.role]+'.');}}
  catch(e){}},
 /* entra no espaço: troca de pessoa no aparelho apaga os dados locais; troca de perfil refaz a sincronização */
 enter(me){const owner=LS.get(OWNKEY);
  if(owner!==me.uid){STORE.wipe();SUPA_BACKEND.reset();setMasters([]);S=fromPreset(PRESETS[0]);LS.set(OWNKEY,me.uid);}
  else if(ME.uid===me.uid&&ME.role!==me.role){STORE.wipe();setMasters([]);SUPA_BACKEND.reset(true);}
  ME=me;ROLE=me.role;LS.set(MEKEY,me);this.state='ready';this.err='';this.msg='';
  if(!can.page(S.page))S.page=homePage();renderNow();STORE.init();},
 lost(){if(this.state==='ready'){this.state='login';this.err='Sua sessão expirou. Entre de novo; seus dados continuam neste aparelho.';renderNow();}},
 async signOut(msg){try{await SUPA_BACKEND.sync();}catch(e){}await SB.signOut();STORE.wipe();SUPA_BACKEND.reset();setMasters([]);
  LS.set(MEKEY,null);LS.set(OWNKEY,null);ME={uid:null,email:'',ws:null,wsName:'',role:'maestro'};ROLE='maestro';S=fromPreset(PRESETS[0]);
  U.team=null;U.logoutAsk=false;this.state='login';this.mode='login';this.err=msg||'';this.msg='';this.f.pw='';renderNow();},
 async go(){const f=this.f,email=f.email.trim().toLowerCase();this.err='';this.msg='';
  const need=(c,m)=>{if(!c){this.err=m;renderNow();}return!c;};
  this.busy=true;renderNow();
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
   await SB.signIn(email,f.pw);f.pw='';this.state='loading';renderNow();await this.membership();}
  catch(e){this.err=e.message;}
  finally{this.busy=false;renderNow();}},
 view(){const f=this.f,st=this.state,m=this.mode,busy=this.busy;
  const inp=(k,label,type,extra)=>`<label class="field"><span class="lbl">${label}</span><input type="${type}" id="au-${k}" data-i="auth" data-k="${k}" value="${esc(f[k])}" ${extra||''}></label>`;
  const box=(title,lead,body)=>`<div class="authbox"><div class="authhex"></div><h1>${title}</h1>${lead?`<p class="lead">${lead}</p>`:''}${this.err?`<p class="autherr" role="alert">${esc(this.err)}</p>`:''}${this.msg?`<p class="authmsg">${esc(this.msg)}</p>`:''}${body}</div>`;
  const btn=(label,act,cls)=>`<button class="btn ${cls||'pri'} wide" data-a="${act}"${busy?' disabled':''}>${busy&&act==='authGo'?'Aguarde…':label}</button>`;
  if(st==='boot'||st==='loading')return box('Il Fredolin','Abrindo seu laboratório…','');
  if(st==='setup')return box('Configurar o aplicativo','Cole os dados do seu projeto Supabase (Project Settings → API). O ideal é deixá-los no arquivo config.js do site, assim a equipe não precisa digitar nada.',
   inp('url','Project URL','url','placeholder="https://xxxx.supabase.co" autocomplete="off"')+inp('key','Chave anon (public)','text','autocomplete="off"')+btn('Salvar e continuar','authGo'));
  if(st==='offline')return box('Sem conexão','O primeiro acesso precisa de internet para confirmar seu perfil. Depois disso o app funciona sem conexão.',btn('Tentar de novo','authRetry'));
  if(st==='newpass')return box('Nova senha','Crie a nova senha da sua conta.',inp('pw','Nova senha','password','autocomplete="new-password"')+inp('pw2','Repita a senha','password','autocomplete="new-password"')+btn('Salvar senha','authGo'));
  if(st==='create')return box('Bem-vindo ao Il Fredolin','Você é a primeira pessoa a entrar: crie o espaço da sua produção e torne-se o <b>Maestro</b>. Depois convide o Chef e o Sous Chef pela página Equipe.',inp('name','Nome do espaço','text','maxlength="40"')+btn('Criar o espaço e entrar como Maestro','authGo')+`<button class="btn sm wide ghost" data-a="logout">Sair</button>`);
  if(st==='noinvite')return box('Aguardando convite','A conta <b>'+esc(this.email())+'</b> ainda não faz parte da equipe. Peça ao Maestro para convidar exatamente este e-mail na página Equipe e toque em "Verificar de novo".',btn('Verificar de novo','authRetry')+`<button class="btn sm wide ghost" data-a="logout">Entrar com outra conta</button>`);
  const tabs=`<div class="chips authtabs">${[['login','Entrar'],['signup','Primeiro acesso'],['recover','Esqueci a senha']].map(([k,n])=>`<button data-a="authMode" data-v="${k}" aria-pressed="${m===k}">${n}</button>`).join('')}</div>`;
  if(m==='recover')return box('Esqueci a senha','Enviaremos um link para criar uma nova senha.',tabs+inp('email','E-mail','email','autocomplete="email" autocapitalize="off"')+btn('Enviar link','authGo'));
  if(m==='signup')return box('Primeiro acesso','Use o e-mail em que o Maestro enviou o convite e crie sua senha.',tabs+inp('email','E-mail','email','autocomplete="email" autocapitalize="off"')+inp('pw','Crie uma senha','password','autocomplete="new-password"')+inp('pw2','Repita a senha','password','autocomplete="new-password"')+btn('Criar conta','authGo'));
  return box('Il Fredolin','Laboratório de gelato da equipe.',tabs+inp('email','E-mail','email','autocomplete="username" autocapitalize="off"')+inp('pw','Senha','password','autocomplete="current-password"')+btn('Entrar','authGo'));}
};

/* ---------- Equipe (Maestro) ---------- */
async function loadTeam(){if(!ME.ws)return;  /* v18.0.1: espaço ainda não conhecido (início da sessão) → não consulta workspace_id=null */
 U.teamBusy=true;try{U.team=await SB.get('members?select=email,name,role,user_id,created_at&workspace_id=eq.'+ME.ws+'&order=created_at.asc');U.teamErr='';}catch(e){U.teamErr=e.message;}U.teamBusy=false;render();}
