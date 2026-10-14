# Il Fredolin · aplicativo da equipe

Passo a passo para colocar o app no ar, instalar no iPhone e no Mac e convidar a equipe.
Tempo total: 20 a 30 minutos, uma única vez. Tudo no plano gratuito.

---

## 1. Banco de dados (Supabase)

1. Entre em **supabase.com** → **New project**.
   - Nome: `il-fredolin` · Região: **South America (São Paulo)** · crie e guarde a senha do banco.
2. Quando o projeto terminar de criar: menu **SQL Editor** → **New query**.
   - Abra o arquivo `supabase/schema.sql` deste pacote, copie **tudo**, cole e clique em **Run**. Deve aparecer "Success".
   - Nova query de novo: cole todo o `supabase/biblioteca_mestres.sql` e **Run** (são as receitas dos mestres; ficam só no banco, visíveis apenas para Maestro e Chef).
3. Menu **Project Settings → API** (ou **Data API / API Keys**). Anote:
   - **Project URL** (algo como `https://abcdefgh.supabase.co`)
   - **anon public** key (começa com `eyJ…`) — ou, em projetos novos, a **publishable key** (`sb_publishable_…`).
   Essas duas informações podem ficar públicas: quem protege os dados são as regras do banco.

> Não use a chave **service_role / secret** em lugar nenhum do app.

## 2. Site do app (GitHub Pages)

1. Em **github.com** → **New repository** → nome `il-fredolin` → **Public** → Create.
2. **Add file → Upload files**: arraste **todo o conteúdo** deste pacote (index.html, config.js, sw.js, manifest.webmanifest, a pasta `icons`, o arquivo `.nojekyll`). A pasta `supabase` pode ir junto, não atrapalha.
3. No repositório, abra **config.js** → ícone de lápis → cole a URL e a chave do passo 1.3:
   ```js
   window.FREDOLIN_CONFIG={
     url:'https://abcdefgh.supabase.co',
     key:'eyJ...'
   };
   ```
   **Commit changes**.
4. **Settings → Pages** → Source: **Deploy from a branch** → Branch **main** / **(root)** → Save.
   Em 1–2 minutos o endereço aparece no topo: `https://SEU-USUARIO.github.io/il-fredolin/`.

## 3. Ligar o endereço ao banco

No Supabase: **Authentication → URL Configuration**
- **Site URL**: `https://SEU-USUARIO.github.io/il-fredolin/`
- **Redirect URLs** → Add: o mesmo endereço.

Assim os links de confirmação de conta e de nova senha abrem direto no app.

## 4. Primeiro acesso (você vira o Maestro)

1. No iPhone, abra o endereço no **Safari**.
2. Toque em **Primeiro acesso**, use o seu e-mail e crie a senha.
3. Abra o e-mail de confirmação **no iPhone** e toque no link. Volte ao app e **Entrar**.
4. Como é a primeira conta, o app oferece **Criar o espaço Il Fredolin** → você entra como **Maestro**.
5. Para trazer o que já existe no artefato: no artefato, **Dados e sincronização → Exportar backup**; no app, **Conta e sincronização → Importar backup**. Tudo sobe para a nuvem da equipe.

## 5. Instalar com o ícone do hexágono

- **iPhone/iPad**: no Safari, **Compartilhar** (quadrado com seta) → **Adicionar à Tela de Início** → nome **Il Fredolin** → Adicionar. Abre em tela cheia, sem barra do Safari.
- **Mac** (Safari 17+): menu **Arquivo → Adicionar ao Dock**. O app ganha janela própria e ícone no Dock.

Depois do primeiro acesso o app funciona **sem internet**; as alterações ficam na fila e sobem quando a conexão volta.

## 6. Convidar a equipe

**Equipe** (só o Maestro vê) → e-mail + perfil → **Convidar**.
A pessoa abre o mesmo endereço, toca em **Primeiro acesso** com **esse e-mail**, confirma pelo link e entra direto no perfil.

| Perfil | O que faz |
|---|---|
| **Maestro** | Tudo: laboratório, aprovação, custos, preços, estoque, backup, equipe |
| **Chef** | Laboratório (Bancada, Creator, neutros, ingredientes, biblioteca dos mestres); aprova receitas para execução. Não vê custos nem a equipe |
| **Sous Chef** | Só as receitas aprovadas (biblioteca Il Fredolin), ficha de produção, alérgenos e defeitos; registra lotes e baixa estoque. Não edita receitas |

Mudar o perfil de alguém ou remover o acesso vale na hora (o aparelho da pessoa se ajusta sozinho).
Em aparelhos compartilhados da produção, use **Sair**: os dados daquele aparelho são apagados (continuam na nuvem).

## 7. Atualizações

Quando houver versão nova, basta substituir `index.html` e `sw.js` no repositório (Upload files → substituir). Na próxima vez que alguém abrir o app com internet, ele já carrega a versão nova.
Se você conectar este repositório ao Claude, as atualizações podem ser publicadas direto por lá.

## Bom saber

- **Plano gratuito do Supabase**: sobra para a equipe. O projeto **pausa após 7 dias sem nenhum uso**; com uso diário isso não acontece (se pausar, é só reativar no painel).
- **E-mails de confirmação**: o envio gratuito do Supabase tem limite de poucos e-mails por hora. Para a equipe basta; se precisar de mais, dá para configurar um SMTP próprio em Authentication → Emails.
- **O que é público**: o site (motor de cálculo e interface) pode ser aberto por quem tiver o endereço, mas **não mostra dado nenhum** sem login e convite. Receitas, lotes, estoque, custos e a biblioteca dos mestres ficam no banco, protegidos por perfil.
- **Backup**: de tempos em tempos, **Conta e sincronização → Exportar backup** (Maestro).
