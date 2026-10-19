# Il Fredolin · Relatório final da série v18 (Fase 10 e entregáveis do §XXI)

**Referência inicial:** `main` em `52f99f0` (v17.12.1, 15/10/2026). **Estado auditado:** v18.17 (`27831e3`, publicada em 19/10/2026). O commit deste relatório só acrescenta testes, ferramentas e documentos: o app publicado não muda.
Tudo foi feito na branch `audit/next-gen-v18`. A `main` recebeu só avanço rápido, sempre com autorização explícita e com o CI verde nos três jobs.

## 1. Resumo

- **20 versões publicadas** (v18.0 → v18.17, em 26 commits), cada uma com auditoria, implementação, testes, CI e relatório (`docs/AUDITORIA-v18.md` §5-B a §5-U).
- **Comportamento preservado:** os 208 valores do motor comparados (8 bases × 2 processos × 13 grandezas) são **idênticos** aos da v17.12.1. Os testes internos dão 24/24 nas duas versões. Nenhuma página, ação, campo ou chave guardada se perdeu. As mudanças de resultado são só as intencionais e documentadas (seção 3).
- **Ciência verificável:** 25 modelos registrados com equação, parâmetros e fonte, hipóteses, validade, verificação e validação. Marcações de classe (um modelo pode ter duas): 12 heurístico, 8 semiempírico, 8 calibrável, 4 mecanístico, 4 determinístico. **Nenhum validado**: falta medição real (seção 6).
- **Evidência automática:** 115 testes Node em 21 arquivos; 79 + 15 + 14 + 5 verificações ponta a ponta mais a fumaça de 26 páginas, em Chromium e WebKit; 31/31 políticas do banco; migração e reversão do banco; integração real com PostgREST em dois aparelhos.

## 2. Execução da Fase 10

| Item da Fase 10 | Resultado | Evidência |
|---|---|---|
| Executar testes completos | Node **115/115**. E2E: fumaça (26 páginas, 24/24 internos, 0 erros), experimentos **79 ✓**, PWA **15 ✓**, armazenamento **14 ✓**, reversão **5 ✓**. Banco migrado **31/31**; banco antigo com as 10 falhas esperadas, que a migração corrige; migrar → desfazer idêntico; integração 1 + 6 | Execução local de 19/10/2026; CI do commit deste relatório (Chromium e WebKit) |
| Comparar comportamento antigo e novo | 208/208 valores idênticos; mudanças intencionais listadas na seção 3 | `node tools/comparar-versoes.mjs 52f99f0` → `docs/bench/comparacao-v17.12.1.json` |
| Validar preservação das funcionalidades | Páginas 24 → 26, ações 154 → 193, alterações 27 → 34, campos 42 → 45, chaves locais 22 → 28; **0 perdidas** | `node tools/preservacao.mjs 52f99f0` (sai com erro se algo se perder) |
| Avaliar segurança | Seção 4 | — |
| Executar benchmarks | Node, Chromium (normal e com CPU 4× e 6× mais lenta), WebKit (CI) e **iPhone real** | `docs/ARQUITETURA-COMPUTACAO.md`, `docs/bench/*.json` |
| Testar migração e reversão | Service worker publicado → atual (offline); localStorage → IndexedDB; banco migrar/desfazer; **app atual → v18.8 e v17.12.1 com os mesmos dados** | `pwa.mjs`, `storage.mjs`, `tests/db/roundtrip.sh`, `tests/e2e/reversao.mjs` (novo, no CI) |
| Gerar documentação | Seção 5 | — |
| Preparar publicação pelo GitHub Pages | Build gerado e conferido no CI; avanço rápido da `main` só com autorização | `docs/OPERACAO.md` |

**Dois defeitos de teste encontrados nesta fase e corrigidos** (não eram defeitos do app):
1. A migração do service worker comparava a `main` com ela mesma depois da publicação. Agora usa a última versão publicada diferente da atual.
2. O teste de reversão não abria a sessão. Sem login o app não grava a bancada, e o teste acusava perda inexistente.

## 3. Mudanças de resultado intencionais (rastreáveis)

| Onde | Antes → agora | Por quê | Versão |
|---|---|---|---|
| Faixa de incerteza (±°C, 90%) | Fior di latte 0,80 → 0,66; Cioccolato 0,84 → 0,92; Cocco 0,69 → 0,79; demais semelhantes | A perturbação mudava a **massa** dos ingredientes, não a composição; ingrediente sem fonte passou a alargar a faixa | v18.11 (§5-O) |
| Gerador "sem açúcar" | Eritritol 91 g e inulina livres → eritritol fixo 45 g, alulose e fibra, sólidos como meta | Excesso de inulina por porção e eritritol acima do limite do próprio laudo | v18.5 (§5-I) |
| Gerador dos tipos originais (crema, sorbetto) | **Idêntico** com as mesmas metas | As mudanças por família da v18.4 não afetaram os tipos originais | — |
| Rótulos de vida útil | "Validade prevista" → "Estabilidade da textura (estimativa)" | Prazo sanitário não se deduz de modelo físico | v18.0 |
| Perfil sensorial do Ateliê | "Perfil sensorial previsto" → "Índices do motor ligados à percepção" | §24: perfil calculado não substitui prova | v18.15 |

## 4. Segurança

| Verificação | Resultado |
|---|---|
| Chaves no código | Só a chave pública (*publishable*) do Supabase em `config.js`. Nenhuma `service_role`/`secret` no repositório |
| Permissões no banco | RLS nas 4 tabelas; 31/31 verificações no esquema migrado (convites só com e-mail confirmado, versão por registro, markup só para o Maestro, movimentos de estoque imutáveis para Sous, funções internas sem acesso anônimo, `search_path` fixo) |
| Perfis no app | Página e ação por perfil (`security/papeis.js`); o servidor é quem garante |
| Injeção de HTML | Busca por interpolação sem escape: nomes digitados (lote, receita, ingrediente próprio, provador) passam por `esc()` ou vão para texto puro. É uma busca por padrão, não uma prova formal |
| Código executado dinamicamente | Um ponto só: a medição de desempenho baixa o protótipo `tools/wasm-proto/compare.js` **do próprio site** e o executa dentro do Web Worker, só quando o usuário pede |
| Dados e processamento | Cálculo científico 100% no aparelho; o Supabase só sincroniza registros |
| Política de conteúdo (CSP) | **Não configurada.** O GitHub Pages não envia cabeçalhos próprios; uma CSP por `<meta>` precisaria acomodar o Web Worker por Blob e os estilos inline. Fica como item aberto |
| Supabase Security Advisor | 2 avisos restantes após a migração 002 (1 intencional, 1 de painel), registrados em §5-D |

## 5. Entregáveis obrigatórios (§XXI)

| # | Entregável | Onde |
|---|---|---|
| 1 | Auditoria completa do código real | `docs/AUDITORIA-v18.md` §1–§3 e a auditoria no início de cada §5-B…§5-U |
| 2 | Inventário de funcionalidades | §1 da auditoria; `tools/preservacao.mjs` (lista automática de páginas, ações, campos e chaves) |
| 3 | Mapa de dependências | `docs/ARQUITETURA.md` (camadas e regras); `tools/layers.mjs` (0 dependências proibidas, no CI) |
| 4 | Diagnóstico científico dos motores | Auditoria §3; `docs/model-registry.json`; página Ciência do motor |
| 5 | Classificação de validade dos modelos | Registro (classes D/M/SE/H/C; V nunca); selos de natureza na interface |
| 6 | Comparação das arquiteturas computacionais | `docs/ARQUITETURA-COMPUTACAO.md` §2 (12 critérios, medidos) |
| 7 | Arquitetura selecionada e justificativa | Mesmo documento: Alternativa A, gatilhos para reabrir, medição no iPhone |
| 8 | Especificação matemática | Campo `equation` de cada um dos 25 modelos; tabela de métodos numéricos e tolerâncias (`ARQUITETURA-COMPUTACAO.md` §4) |
| 9 | Modelos de dados e contratos | `docs/ARQUITETURA.md` (contratos do motor e formatos persistidos); `contracts.test.mjs` |
| 10 | Estratégia de migração | Armazenamento (§5-M), service worker (§5-K), banco (`supabase/README.md`, migrações com reversão) |
| 11 | Estratégia de sincronização offline | §2 e §5-C da auditoria (fila, quarentena, versão por registro, conflitos visíveis); `sync.test.mjs`; integração |
| 12 | Matriz de compatibilidade funcional | Seção 7 deste relatório |
| 13 | Planejamento de validação experimental | `docs/validacao/PLANO.md`; casos de referência (`casos.json`, `PREVISOES.md`) |
| 14 | Testes automatizados | `tests/node` (21 arquivos), `tests/e2e` (6 suítes), `tests/db`, `tests/integration`; CI em 3 jobs |
| 15 | Benchmarks | `tools/bench.mjs`, `tests/e2e/bench.mjs`, medição no aparelho; `docs/bench/` |
| 16 | Relatórios das mudanças | `docs/AUDITORIA-v18.md` §5-B…§5-U (uma seção por versão, com commit, módulos, testes e resultado) |
| 17 | Registro dos modelos e versões | `docs/model-registry.json` (@2, 25 modelos, campo `version`), embutido no app |
| 18 | Documentação de operação | `docs/OPERACAO.md` |
| 19 | Estratégia de reversão | `docs/OPERACAO.md` §2; `tests/e2e/reversao.mjs`; `tests/db/roundtrip.sh` |
| 20 | Limitações e capacidades comprovadas | Seção 6 deste relatório |

## 6. O que está comprovado e o que não está

**Comprovado por teste automático (repetível no CI):**
- **Preservação:** motor idêntico ao da v17.12.1 nas 8 bases, sem perder páginas, ações ou dados.
- **Matemática:**
  - curva de congelamento monotônica, invertível e contínua;
  - condução de calor que conserva energia e converge com a malha;
  - solução periódica exata do freezer igual à simulação (≤ 0,007 °C);
  - volumes das fases somando 100%;
  - estatística sensorial igual ao scipy;
  - ajustes reológicos recuperando parâmetros plantados;
  - Monte Carlo reproduzível e coerente com a faixa linear.
- **Dados:**
  - fila de sincronização que não perde em silêncio;
  - conflitos visíveis;
  - estoque por movimentos (nada desconta duas vezes);
  - IndexedDB com espelho, migração e cópias diárias;
  - backup com plano antes de gravar;
  - reversão do app e do banco.
- **Offline:** instalação conferida por SHA-256, cópia protegida, autorreparo; o app abre sem rede (Chromium; no WebKit, a parte offline é simulada online).
- **Desempenho:** no iPhone real, as operações diárias ficam abaixo de ~0,5 ms (limite superior, ver seção 6 de `ARQUITETURA-COMPUTACAO.md`) e as pesadas abaixo de 12 ms.

**Não comprovado (depende de medição real ou não foi feito):**
- **Validade científica de qualquer modelo.** Não há nenhum lote medido; todas as grandezas da validação estão "sem dados". As previsões são condicionais à receita e ao processo.
- Coeficientes heurísticos (overrun, derretimento, cristal, pH, quenelle, doçura × temperatura) sem painel ou medição própria.
- Coeficientes de troca de calor (freezer, cozinha, banho, geladeira) estimados dentro de faixas de livro, só calibráveis com medição.
- Forma da distribuição de cristais e tamanho das bolhas: não há dado. O app mostra hipótese ou não estima.
- Comportamento real no Safari do iPhone fora do que o WebKit do CI e a medição de desempenho cobrem; o offline real foi verificado em Chromium.

## 7. Matriz de compatibilidade

| Função | Chromium (CI) | WebKit / Safari (CI) | iPhone real | Offline |
|---|---|---|---|---|
| 26 páginas abrem sem erro | ✓ | ✓ | uso diário | ✓ |
| Motor científico (24/24 internos) | ✓ | ✓ | ✓ (medição de desempenho) | ✓ |
| Service worker: instalação, atualização, migração | ✓ | ✓ (online) | — | ✓ Chromium; WebKit simulado online |
| IndexedDB + espelho, cota cheia, sem IndexedDB | ✓ | ✓ | — | ✓ |
| Reversão para v18.8 e v17.12.1 | ✓ | ✓ | — | — |
| Web Worker (Monte Carlo, medição) | ✓ | ✓ | ✓ (abriu em 56 ms) | ✓ |
| Sincronização (PostgREST real) | ✓ (Node) | — | uso diário | fila offline ✓ |
| Laboratório visual (SVG e canvas 2D) | ✓ | ✓ | — | ✓ (sem biblioteca externa) |

## 8. Cobertura da especificação

Legenda: **feito** = implementado e testado; **parcial** = parte implementada, o resto declarado; **não feito** = decidido não fazer ou deixado para depois, com motivo.

| § | Tema | Status | Evidência / observação |
|---|---|---|---|
| 1–3 | Atuação, objetivo, repositório | feito | Branch isolada; `main` só por avanço rápido autorizado |
| 4 | Diagnóstico preliminar | feito | Auditoria §1–§3. A suspeita sobre o `heatSim` (cilindro × esfera) **não se confirmou** (§3.1) |
| 5 | Preservação funcional | feito | `comparar-versoes`, `preservacao`, GOLDEN 24/24 |
| 6 | Infraestrutura | feito | GitHub Pages + Supabase mantidos |
| 7 | Local-first / offline | feito | Cálculo no aparelho; service worker; IndexedDB |
| 8 | Auditar antes de substituir | feito | Auditoria no início de cada §5 |
| 9 | Classificação dos modelos | feito | Registro + selos; "ilustrativa" no microscópio |
| 10 | Problemas científicos prioritários | feito | Curva (§3), `heatSim` (§3.1), viscosidade/overrun/pH/cristal (registro), vida útil (rótulos), calibração identificada como encolhimento normal–normal (não bayesiana formal), incerteza (§5-O, §5-P) |
| 11–13 | Arquitetura, métodos numéricos, execução adaptativa | feito | `ARQUITETURA-COMPUTACAO.md`; Web Worker com progresso e cancelamento |
| 14 | Formulação unificada | feito | Procedência, balanço de massa, PAC/POD preservados (§5-O) |
| 15 | Termodinâmica de alta fidelidade | parcial | Crioconcentração da matriz e WLF (§5-T); **atividade de água e mistura não ideal não modeladas** |
| 16 | Engenharia térmica | feito | Ciclo completo (§5-Q), câmara térmica (§5-U); aquecimento só por balanço de energia |
| 17 | Microestrutura | parcial | Fases e matriz por balanço; cristais hipotéticos; **sem nucleação/crescimento mecanístico, bolhas ou rede de gordura** |
| 18 | Reologia e tribologia | parcial | Ajuste de medições; **sem previsão não newtoniana; viscoelasticidade e tribologia fora** |
| 19 | Ciência das interfaces | parcial | Sinergias rastreáveis com fonte (§5-I); **sem modelo de interfaces** |
| 20–21 | Plataforma multifamília e modelos especializados | feito / parcial | 17 tipos com processo, faixas e fonte (§5-G); **famílias autorais não** |
| 22 | Laboratório de ingredientes | parcial | Procedência, 3 bases conferidas com a USDA; **183 ingredientes sem fonte** |
| 23 | Estabilização | feito | §5-I |
| 24–25 | Sensorial e física × percepção | feito | §5-S (sem avaliações reais ainda) |
| 26 | Formulação inversa | parcial | Gerador por alvo e alternativas; **objetivos sensoriais calibrados não** |
| 27 | Otimização multiobjetivo robusta | parcial | Pareto, sensibilidade; **otimização sob incerteza e bayesiana não** (sem dados) |
| 28 | DoE | feito | §5-E |
| 29 | Aprendizado experimental | parcial | Calibração, deixa-um-fora, resíduos, "O que medir" com justificativa; **inferência bayesiana completa e active learning não** |
| 30 | Dados ausentes | feito | "O que medir", procedência "sem fonte", sugestão de ficha |
| 31 | Gêmeo da formulação | parcial | O laudo integra todos os modelos sem duplicar lógica; não é uma entidade persistida separada |
| 32 | Gêmeo dos equipamentos | parcial | Maestro por energia com capacidade do seu ciclo; h do freezer calibrável; **variação entre ciclos não** |
| 33–34 | Gêmeo do ciclo e níveis de fidelidade | feito | §5-Q |
| 35 | Linguagem visual | parcial | Instrumentos novos no padrão sóbrio; **redesenho completo não feito (decisão a tomar com o Maestro)** |
| 36–39 | Microscópio, câmara térmica, instrumentos, ficha em cada gráfico | feito | §5-U; teste falha gráfico sem ficha |
| 40–41 | Três jornadas, simplicidade progressiva | não feito | A navegação atual (Formular/Analisar/Produzir/Acervo/Gestão) e os sets Artigianale/Professionale foram mantidos; reorganizar é decisão de produto |
| 42–45 | Armazenamento, sincronização, segurança, PWA | feito | §5-M, §2/§5-C, §5-C/§5-D, §5-K |
| 46–48 | Ciência verificável, três níveis, validação por família | feito | §5-L |
| 49 | Testes comparativos reais | parcial | 16 casos com previsões condicionais; **sem medição real; cardamomo pendente** (não está no banco) |
| 50–51 | Modularização e regressão | feito | §5-J, §5-N; comparação antigo × novo |
| 52–53 | Evitar complexidade; ordem de prioridade | seguido | WebAssembly e bibliotecas gráficas medidos e rejeitados; integridade de dados primeiro (v18.0) |

## 9. Próximos passos, em ordem

1. **Medições reais**, seguindo `docs/validacao/PLANO.md`. É o que transforma previsões condicionais em modelos avaliados. As cinco primeiras usam termômetro, balança e refratômetro.
2. **Fichas técnicas dos ingredientes mais usados sem fonte:** morango, cacau, chocolate 70%, pastas de oleaginosas, gema, creme de coco, açúcar invertido, limão.
3. **Política de conteúdo (CSP)** compatível com o Web Worker e o GitHub Pages.
4. **Decisões de produto com o Maestro:** reorganização em jornadas (§40) e redesenho visual (§35).
5. **Ciência que espera dados:** atividade de água, mistura não ideal, inferência bayesiana e otimização sob incerteza. Só fazem sentido com medições que permitam identificar os parâmetros.
