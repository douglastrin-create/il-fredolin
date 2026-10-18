# Arquitetura do Il Fredolin (v18.6–v18.7)

## Ideia em uma frase

O código-fonte vive em `src/`, em 57 módulos separados por camada. `tools/build.mjs` monta o `index.html` publicado.

Em produção nada mudou:
- o app continua um arquivo só, que funciona offline;
- o GitHub Pages continua sem etapa de build;
- o Web Worker é extraído do mesmo trecho.

Na primeira montagem, o `index.html` gerado foi **idêntico byte a byte** ao da v18.5 (sha `78fdf962b04e`).

A especificação (§50) pede reestruturação progressiva, não reescrita. Por isso a separação foi feita **nos limites que o código já tinha**: os marcadores `/* ==== NN-nome.js ==== */` e os cabeçalhos de seção. Nenhuma linha foi movida de lugar na ordem de execução.

## Service worker (v18.7)

O `sw.js` da raiz também é **gerado**: `src/sw/sw.js` é o modelo, e o build preenche o SHA-256 do `index.html` montado e a `VERSION`. Cada publicação muda o `sw.js`; o navegador instala a versão nova só se a página baixada tiver exatamente esse hash, guarda tudo (8 arquivos) e só então apaga o cache anterior. Ver §5-K do relatório de auditoria.

## Como editar

1. Edite o módulo em `src/`. Não edite o `index.html`.
2. Rode `node tools/build.mjs` para gerar o `index.html`.
3. Rode os testes: `node --test tests/node/*.test.mjs`. O E2E fica em `tests/e2e/`.
4. O CI recusa a alteração em dois casos:
   - `index.html` diferente da montagem de `src/` (`node tools/build.mjs --check`);
   - dependência nova entre camadas (`node tools/layers.mjs`).

**A ordem dos módulos importa.** Ela está em `src/build.json`. Todos compartilham um escopo global e cada módulo usa o que os anteriores definem.

## Camadas

| Camada | Pasta | Conteúdo | Linhas |
|---|---|---|---|
| Núcleo científico | `src/core/` | Banco de ingredientes, perfis e processo-padrão, curvas de congelamento, composição e análise, incerteza, transferência de calor, quenelle, calibração, química, balanceador, gerador e design inverso, estabilização, medição e DoE | ~1.440 |
| Produto | `src/product/` | Bases e mestres, laudo e defeitos, sensibilidade, máquina, vitrine, estoque | ~670 |
| Dados | `src/data/` | Armazenamento local e coleções, backup, sincronização Supabase, entrada e equipe | ~330 |
| Segurança | `src/security/` | Perfis Maestro, Chef e Sous e o que cada um aciona | ~35 |
| Interface | `src/ui/` | Estado da tela, componentes, shell, páginas, PWA | ~3.140 |
| Testes no app | `src/tests/` | Valores GOLDEN e autoteste do motor | ~70 |
| Moldura | `src/shell/` | HTML, CSS e fechamento do script | ~500 |

O trecho que roda no **Web Worker** vai de `core/util.js` até antes de `tests/golden.js` (marcadores 01-util → 33-golden). Nele só podem entrar módulos de `core/` e `product/`, e isso é testado.

### Regras de dependência (`tools/layers.mjs`)

| Camada | Não pode usar nomes de |
|---|---|
| core | product, data, security, ui |
| product | data, security, ui |
| data | ui |
| security | ui |

O verificador lê as declarações de topo de cada módulo e procura nomes de camadas proibidas. Ele ignora comentários, textos e variáveis locais com o mesmo nome. Exemplo: `S` é o soluto na curva de congelamento e também é o estado da tela.

**Dívidas registradas** (`tools/layers-known.json`, 23 usos):
- `core/composition/dextrose.js` lê a preferência de dextrose da tela (`S.dexForm`, com guarda). O certo é receber como parâmetro.
- `core/microstructure/quenelle.js` consulta o banco de defeitos.
- `core/optimization/gerador.js` usa as metas padrão (`GEN_DEF`), que estão junto das bases.
- A sincronização (`data/local/store.js`, `data/sync/*`) chama `render()`, lê o estado da tela e abre as telas de conflito e de recusa.

Dependência nova falha o CI. Dívida resolvida também falha até sair da lista, para a lista nunca ficar velha.

### O que mudou de lugar ao separar

Tudo foi cortado em limites de linha, então o arquivo montado continua idêntico.

| Item | Antes | Agora | Por quê |
|---|---|---|---|
| Perfis de tipo e processo-padrão | Dados gerais | `core/domain/` | O motor precisa deles |
| `DEX_FORM`/`dexPref` | Início do laudo | `core/composition/dextrose.js` | Usados pela análise |
| Armazenamento local e coleções | Núcleo da interface | `data/local/colecoes.js` | São dados, não tela |
| Tela da equipe | Módulo de entrada | `ui/pages/equipe.js` | É tela |
| Sensibilidade "e se" | Motor | `product/formulation/` | Usa laudo e índice |

## Camada de compatibilidade

Os nomes globais continuam os mesmos. Alguns exemplos:
- `analyze`, `diagnose`, `generate`, `PROF`, `ING_BY`;
- `S`, `U`, `LOTS`, `STORE`, `SUPA_BACKEND`.

Os marcadores `/* ==== NN-nome.js ==== */` continuam no arquivo montado. São 27, um por módulo original, e `workerSrc()` e o harness de testes dependem deles.

Os testes Node e E2E continuam lendo o `index.html` montado. Testam, portanto, exatamente o que vai para produção.

## Contratos de dados

Testados em `tests/node/contracts.test.mjs`. Mudou um contrato? Mude este documento e o teste juntos.

### Entrada do motor

| Campo | Tipo e unidade |
|---|---|
| Linha de receita | `{id, g}`: `id` existe em `ING_BY`; `g` são gramas ≥ 0 |
| Estado de análise | `{tipo, vit, recipe, proc, brix, costs}` |
| `tipo` | chave de `PROF` |
| `vit` | °C, temperatura da vitrine ou de serviço |
| `proc` | ver `PROC0` em `core/domain/processo.js` |
| `brix` | °Bx medido por fruta |
| `costs` | R$/kg por ingrediente |

Principais campos de `PROC0`:

| Campo | Unidade |
|---|---|
| `pastT`, `matT`, `drawT`, `storeT`, `ambT` | °C |
| `pastHold` | s ou min, conforme `pastHoldU` |
| `matH` | h |
| `coolMin`, `drawMin`, `hardMin`, `waitMin` | min |
| `load` | g |
| `poteMl` | mL |
| `portion` | g |

### Saída do motor (`analyze`)

| Grandeza | Unidade |
|---|---|
| `sol`, `fat`, `msnf`, `wat` | g por 100 g de mistura |
| `pod` | doçura em % de sacarose equivalente |
| `fzVit`, `fzMid` | % da água congelada |
| `serveT` | °C |
| `ov` | % de overrun |
| `melt10` | % derretido em 10 min a 20 °C |
| `ci` | índice 0–100 |
| `visc` | mPa·s a 4 °C |
| `costKg` | R$/kg |
| `nut` | por 100 g (kcal, g) |

`diagnose` devolve achados `{sev: crit | warn | info | ok, area, title, why, fix}`.

### Formatos persistidos e versões

| Formato | Versão | Onde |
|---|---|---|
| App | `VERSION = 'v18.7'` | `ui/shell.js` (mostrado no rodapé) |
| Backup (JSON) | `{app: 'Il Fredolin', schema: 2, …coleções, tomb}` | `data/local/backup.js` |
| Registro na nuvem | linha `records {workspace_id, col, id, data, deleted, updated_at, ver, base_ver, force}` | `supabase/migrations/*`, `data/sync/supabase.js` |
| Registro de modelos | `il-fredolin/model-registry@1` | `docs/model-registry.json` |
| Montagem | `il-fredolin/build@1` | `src/build.json` |
| Cache offline | `il-fredolin-<12 primeiros do SHA-256 do index.html>` | `sw.js` (gerado de `src/sw/sw.js`) |
| Dívidas de camada | `il-fredolin/layers-known@1` | `tools/layers-known.json` |
| Chaves locais | `fredolin_v9_*`, `fredolin_v10_*`, `fredolin_v11_*`, mantidas desde a v9 para não perder dados | `data/local/colecoes.js` |

## Próximos passos da modularização (progressivos)

1. **Pagar as dívidas, uma por vez, com teste:**
   - `DEX_FORM` passa a receber a preferência por parâmetro;
   - a sincronização passa a emitir um evento ("dados mudaram"), e a interface decide quando chamar `render()`.
2. **Dividir os módulos grandes de interface** nos limites de página: `ui/pages/paginas.js` (705 linhas), `atelie.js` e `v13.js`.
3. **Só depois, se valer a pena,** usar módulos ES de verdade (`import`/`export`) no núcleo. Isso pede um empacotador e muda o Web Worker, então só faz sentido com ganho claro.
