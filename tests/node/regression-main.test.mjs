/* Evidência do defeito corrigido: o mesmo cenário contra o index.html da main (v17.12.1, commit 52f99f0).
   Este teste DOCUMENTA a perda: ele passa quando a versão antiga perde os dados. Remover após o merge. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { loadSync, httpErr } from './harness.mjs';

let old = null;
try { old = execSync('git show 52f99f0:index.html', { encoding: 'utf8', maxBuffer: 8e6, stdio: ['ignore', 'pipe', 'ignore'] }); } catch {}

test('v17.12.1: erro 503 no envio individual descarta a alteração em silêncio', { skip: !old && 'histórico do git indisponível' }, async () => {
  const S = loadSync(old); const B = S.SUPA_BACKEND;
  B.outbox = [{ col: 'lib', id: 'a', data: {}, updated_at: 1 }, { col: 'lib', id: 'b', data: {}, updated_at: 2 }];
  B.send = async batch => { if (batch.length > 1) throw httpErr(403); if (batch[0].id === 'b') throw httpErr(503); };
  await B.flush();
  assert.equal(B.outbox.length, 0, 'a fila foi esvaziada');
  assert.equal(B.pending(), 0, 'e o aviso de saída mostra zero pendências: "b" foi perdida');
});
