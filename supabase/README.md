# Banco da equipe (Supabase)

- `schema.sql` — estado do banco em produção em 17/10/2026, reconstruído do catálogo. Documento de referência: não rode no projeto da equipe.
- `migrations/` — mudanças numeradas. Cada `NNN.sql` tem um `NNN.down.sql` que desfaz.

## Estado em produção (projeto `zmnocgqkvzjjtddnzzhn`)

| Migração | Situação |
|---|---|
| 001 · segurança e versão | **Aplicada em 17/10/2026 22:05** (SQL Editor). Conferida: `ver` ativa, convites exigem e-mail confirmado, 0 markup fora de `fin` (2 valores movidos), gatilho ligado |
| 002 · permissões de funções | **Aplicada em 17/10/2026 22:10** (SQL Editor). Conferida: anônimo sem EXECUTE nas 6 funções SECURITY DEFINER, logado mantém; search_path fixo nas 2 de gatilho. Security Advisor: restam só o aviso intencional (logado executa SECURITY DEFINER) e a proteção contra senhas vazadas (painel) |

## Migração 001 (v18): o que muda

| # | Problema no banco atual | O que a migração faz |
|---|---|---|
| 1 | Convite podia ser reivindicado por conta com e-mail **não confirmado** (só não acontece hoje se a confirmação de e-mail estiver ligada no Auth) | `claim_invites` e `create_workspace` exigem e-mail confirmado |
| 2 | Gravação com relógio mais antigo era **descartada em silêncio**: o app recebia "ok" e a edição sumia | Versão por registro (`ver`); conflito responde **409**, e o app guarda a edição na quarentena |
| 3 | O **markup** (preço) ia dentro das receitas, execuções e lotes, que Chef e Sous leem | Markup passa a viver em `fin` (só Maestro). O banco retira o markup mesmo se um app antigo enviar |
| 4 | O Sous podia **alterar uma baixa de estoque** já registrada | Baixas (movimentos) só podem ser alteradas pelo Maestro |

Prova: `tests/db/policies.sql` tem 29 verificações. O esquema atual falha em 8 e o migrado passa em todas. `tests/integration/` roda o código real do app contra PostgREST 12.2.3, em dois aparelhos, e confirma que o app v17 continua sincronizando com o banco migrado.

## Como aplicar (15 minutos)

**Ordem segura:**

1. **Faça o backup** no app: entre como Maestro e use *Gestão → Conta e sincronização → Exportar backup*.
2. **Ensaie num projeto de teste**, recomendado e gratuito:
   1. Crie um projeto novo em supabase.com.
   2. No SQL Editor, rode `schema.sql`.
   3. Rode `migrations/20261018_001_v18_seguranca_versao.sql`.
   4. Deve aparecer "Success. No rows returned".
3. **Aplique no projeto da equipe:**
   1. Abra o SQL Editor e crie uma *New query*.
   2. Cole todo o arquivo `migrations/20261018_001_v18_seguranca_versao.sql` e clique em **Run**.
   3. É uma única transação: se der erro, nada muda.
4. **Confira** com esta consulta (deve retornar `true | true | 0`):
   ```sql
   select exists(select 1 from information_schema.columns where table_name='records' and column_name='ver'),
          (select prosrc like '%email_confirmed_at%' from pg_proc where proname='claim_invites'),
          (select count(*) from records where col<>'fin' and (data #> '{st,proc,markup}' is not null or data #> '{proc,markup}' is not null));
   ```
5. **Publique o app** (merge da branch). A ordem entre banco e app não importa: o app novo funciona com o banco antigo, e o antigo funciona com o banco novo.
6. **Abra o app** uma vez em cada aparelho com internet para ele carregar a versão nova.

**Para desfazer:** rode `migrations/20261018_001_v18_seguranca_versao.down.sql` do mesmo jeito. O markup volta para as receitas, e versão e conflitos deixam de existir.

## Migração 002 (v18): avisos do Security Advisor

Responde a 2 dos 4 avisos do assistente de segurança do Supabase (todos anteriores à v18):
- **Function Search Path Mutable** (2 funções de gatilho) → `search_path` fixo.
- **Anônimo executa funções SECURITY DEFINER** (`can_read`, `can_write`, `my_role`) → execução só para usuário logado. O app só chama funções depois do login, e as regras de segurança valem só para logados.
- **Usuário logado executa SECURITY DEFINER**: é intencional (é assim que o app entra na equipe e que a RLS funciona). Fica como está.
- **Proteção contra senhas vazadas**: é configuração do painel, não SQL (*Authentication → Providers/Passwords → Leaked password protection*). Pode depender do plano.

Teste: `tests/db/policies.sql` (31/31 com 001+002) e PostgREST real: logado chama `claim_invites`/`has_workspace` (200); anônimo recebe 401.

## Conferências que valem a pena

- **Auth → Sign In / Providers → Email → "Confirm email"** deve estar **ligado**.
- **Restrições não exportadas na primeira consulta.** Esta consulta lista as restrições; mande o resultado para completar o `schema.sql`:
  ```sql
  select conrelid::regclass, conname, pg_get_constraintdef(oid) from pg_constraint
  where connamespace = 'public'::regnamespace and contype in ('f','c') order by 1,2;
  ```

## Limites conhecidos

- **Revogação offline.** Um aparelho sem internet continua com o acesso que tinha até reconectar. O servidor recusa as gravações dele assim que ele volta (RLS), e elas vão para a quarentena.
- **Duas baixas do mesmo resto de estoque.** Se dois aparelhos offline baixam a mesma sobra para lotes diferentes, as duas baixas são aceitas. O saldo fica em zero (nunca negativo), mas o consumo registrado excede o que havia. Esse caso aparece no estoque como baixa maior que a entrada.
