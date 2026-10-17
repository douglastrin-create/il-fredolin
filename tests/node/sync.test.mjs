/* Sincronização com o Supabase (62-supabase): fila offline, recusas do servidor e quarentena.
   O SB.req real é substituído por um servidor simulado; o resto é o código publicado. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSync, httpErr, offlineErr } from './harness.mjs';

const rows = ids => ids.map((id, i) => ({ col: 'lib', id, data: { name: id }, updated_at: 1000 + i }));
/** servidor simulado: lote com algum id "ruim" é recusado; envio individual responde conforme o mapa */
function server(S, perId) {
  const sent = [];
  S.SUPA_BACKEND.send = async batch => {
    if (batch.length > 1) { const bad = batch.find(r => perId[r.id]); if (bad) throw perId[bad.id](); }
    else if (perId[batch[0].id]) throw perId[batch[0].id]();
    sent.push(...batch.map(r => r.id));
  };
  return sent;
}

test('recusa por permissão (403) vai para a quarentena, não some', async () => {
  const S = loadSync(); const B = S.SUPA_BACKEND;
  B.outbox = rows(['a', 'b', 'c']);
  const sent = server(S, { b: () => httpErr(403, 'permission denied') });
  await B.flush();
  assert.deepEqual(sent, ['a', 'c']);
  assert.equal(B.outbox.length, 0);
  assert.equal(B.rejected.length, 1); assert.equal(B.rejected[0].row.id, 'b'); assert.equal(B.rejected[0].status, 403);
  assert.equal(B.pending(), 1, 'pendências incluem a quarentena (o aviso de saída aparece)');
  assert.equal(JSON.parse(S.storage.getItem('fredolin_app_rejected')).length, 1, 'quarentena persiste no aparelho');
});

test('falha passageira (5xx) no envio individual mantém tudo na fila', async () => {
  const S = loadSync(); const B = S.SUPA_BACKEND;
  B.outbox = rows(['a', 'b', 'c']);
  server(S, { b: () => httpErr(400, 'bad'), c: () => httpErr(503, 'unavailable') });
  await assert.rejects(B.flush());
  assert.ok(B.outbox.some(r => r.id === 'c'), 'c continua na fila');
  assert.equal(B.outbox.length + B.rejected.length >= 2, true);
});

test('sessão vencida (401) não é tratada como recusa definitiva', async () => {
  const S = loadSync(); const B = S.SUPA_BACKEND;
  B.outbox = rows(['a', 'b']);
  server(S, { a: () => httpErr(401, 'JWT expired') });
  await assert.rejects(B.flush());
  assert.equal(B.outbox.length, 2); assert.equal(B.rejected.length, 0);
});

test('sem rede: nada sai da fila', async () => {
  const S = loadSync(); const B = S.SUPA_BACKEND;
  B.outbox = rows(['a']); server(S, { a: () => offlineErr() });
  await assert.rejects(B.flush()); assert.equal(B.outbox.length, 1);
});

test('edição nova substitui a versão da quarentena; reenviar e descartar funcionam', async () => {
  const S = loadSync(); const B = S.SUPA_BACKEND;
  B.outbox = rows(['a', 'b']); server(S, { a: () => httpErr(422, 'invalid') , b: () => httpErr(403) });
  await B.flush(); assert.equal(B.rejected.length, 2);
  B.kick = () => {};
  B.push('lib', { id: 'a', name: 'nova', updatedAt: 5000 });
  assert.equal(B.rejected.length, 1, 'versão antiga de "a" saiu da quarentena');
  assert.ok(B.outbox.some(r => r.id === 'a'));
  assert.equal(B.retryRejected(), 1); assert.equal(B.rejected.length, 0); assert.ok(B.outbox.some(r => r.id === 'b'));
  B.quarantine(B.outbox[0], httpErr(403)); assert.equal(B.dropRejected(), 1);
});

test('troca de perfil preserva fila e quarentena; sair da conta limpa', () => {
  const S = loadSync(); const B = S.SUPA_BACKEND;
  B.outbox = rows(['a']); B.quarantine(rows(['b'])[0], httpErr(403));
  B.reset(true); assert.equal(B.pending(), 2);
  B.reset(); assert.equal(B.pending(), 0);
});

test('cota cheia do aparelho: LS.set devolve false e registra a falha (antes era silencioso)', () => {
  const S = loadSync(undefined, { quotaBytes: 200 });
  assert.equal(S.LS.set('pequeno', { a: 1 }), true);
  assert.equal(S.LS.set('grande', 'x'.repeat(500)), false);
  assert.ok(S.LS.bad.grande);
  assert.equal(S.LS.set('grande', 'ok'), true); assert.equal(S.LS.bad.grande, undefined);
});
