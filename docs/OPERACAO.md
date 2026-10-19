# Operação do Il Fredolin (v18.17)

Como montar, testar, publicar, reverter e diagnosticar o app. O código-fonte vive em `src/`; o `index.html` e o `sw.js` publicados são gerados.

## 1. Fluxo de uma versão

1. **Branch isolada:** todo trabalho vai para `audit/next-gen-v18`. A `main` só recebe avanço rápido (*fast-forward*) de commits que já passaram no CI.
2. **Montar:** `node tools/build.mjs`, que gera `index.html` e `sw.js` com o SHA-256 da página e a `VERSION`.
3. **Testar localmente:**
   - `node --test tests/node/*.test.mjs` (motor, sincronização, arquitetura, estatística, registro e fichas);
   - `node tools/layers.mjs` (nenhuma dependência proibida entre camadas);
   - E2E (precisa de Playwright): `tests/e2e/smoke.mjs`, `experiments.mjs`, `pwa.mjs`, `storage.mjs` e `reversao.mjs`, com o argumento `chromium` ou `webkit`;
   - banco (precisa de Postgres 16): `tests/db/run.sh baseline|migrated`, `tests/db/roundtrip.sh`, `tests/integration/run.sh`.
4. **CI** (`.github/workflows/testes.yml`, em toda branch que não seja a `main`):
   - **motor-e-sincronizacao:** montagem confere, camadas, Node;
   - **navegador:** Chromium e WebKit, incluindo PWA, armazenamento e reversão; a bateria de desempenho roda como informação e não reprova;
   - **banco:** políticas, migração e reversão, integração real com PostgREST 12.2.3.

   Falhas aparecem como anotações `::error` no próprio check.
5. **Publicar** (só com autorização explícita): `git push origin origin/audit/next-gen-v18:refs/heads/main`. O GitHub Pages implanta sozinho. Confira se o workflow "pages build and deployment" terminou com sucesso no mesmo commit.
6. **Registrar:** seção nova em `docs/AUDITORIA-v18.md` e cópia no projeto do claude.ai.

## 2. Reversão

**App (GitHub Pages).** O histórico da `main` é linear. Para voltar a uma versão:
- **Recomendado, não destrutivo:** `git revert` dos commits a desfazer, numa branch; CI; avanço rápido da `main`.
- **Emergência:** reconstruir o `index.html` e o `sw.js` de um commit antigo, num commit novo (`git checkout <commit> -- index.html sw.js`, conferir com `node tools/build.mjs --check` só se o `src/` também voltar), e publicar. Nunca reescrever o histórico da `main` com `--force`.

**Dados no aparelho.**
- Desde a v18.9, toda gravação vai para o IndexedDB **e** para o localStorage com as mesmas chaves (`fredolin_v9_*`, `fredolin_v10_*`, `fredolin_v11_*`). Uma versão antiga lê o localStorage como sempre leu.
- Conferido em `tests/e2e/reversao.mjs`: dados gravados pela versão atual abrem na v18.8 (antes do IndexedDB) e na v17.12.1 (antes da série v18). Voltar para a atual não perde os campos que a antiga não conhecia.
- Campos novos são sempre aditivos (o app antigo os ignora).

**Service worker.**
- Cada versão tem um cache próprio (`il-fredolin-<sha12>`). A limpeza só apaga caches **mais antigos** que o seu (pela data guardada em `__sw_meta`).
- Reverter publica uma versão "nova" no tempo, que instala, confere o hash e assume.
- O autorreparo recompõe o cache se ele sumir.

**Banco (Supabase).** As migrações 001 e 002 têm reversão (`supabase/migrations/*.down.sql`). `tests/db/roundtrip.sh` confere que migrar e desfazer devolve esquema e dados idênticos. A série v18.1–v18.17 não mudou o banco.

**Backup.**
- O app guarda uma cópia automática por dia (7 dias) no aparelho.
- O backup exportado (JSON, schema 2) é a cópia fora do aparelho, e a restauração mostra o plano antes de gravar.

## 3. Diagnóstico

| Sintoma | Onde olhar |
|---|---|
| App não abre offline | Conta e sincronização → Funcionamento offline (arquivos guardados, SHA-256, versões no aparelho) → "Baixar de novo e conferir" |
| Alteração não chega à equipe | Conta e sincronização → fila e quarentena (Tentar de novo / Exportar / Descartar) |
| "Memória do aparelho cheia" | Mesmo cartão: estado do IndexedDB e do espelho; exporte um backup |
| Resultado do motor estranho | Ciência do motor: ficha do modelo, validação com os seus lotes; "Ficha do gráfico" abaixo de cada gráfico |
| Lentidão | Ciência do motor → Desempenho deste aparelho (mede as 12 operações e compara com o orçamento) |

## 4. Ferramentas

| Comando | O que faz |
|---|---|
| `node tools/build.mjs [--check]` | Monta (ou confere) `index.html` e `sw.js` |
| `node tools/layers.mjs` | Regras de dependência entre camadas |
| `node tools/bench.mjs [--json]` | Bateria de desempenho no Node |
| `node tests/e2e/bench.mjs` | Bateria nos navegadores (Chromium normal e com CPU lenta, WebKit) |
| `node tools/wasm-proto/compare.mjs` | JavaScript × protótipo WebAssembly do núcleo térmico |
| `node tools/comparar-versoes.mjs <commit>` | Comportamento do motor: versão antiga × atual |
| `node tools/preservacao.mjs <commit>` | Páginas, ações, campos e chaves locais preservados |
| `node tools/validacao.mjs` | Previsões condicionais dos casos de referência (`docs/validacao/PREVISOES.md`) |

## 5. Regras que não mudam

- Nada é publicado na `main` sem autorização explícita.
- Nenhuma chave privilegiada no código; só a chave pública do Supabase em `config.js`.
- O processamento científico roda no aparelho; o Supabase só sincroniza.
- Nenhuma medição é inventada; campo sem fonte aparece como "sem fonte" ou "não estabelecido".
