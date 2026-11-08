import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const migration = readFileSync(new URL('../supabase/migrations/20261108172231_cancelaciones_por_unidad.sql', import.meta.url), 'utf8');
let actor;
before(async () => {
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;');
  // Realtime publications are infrastructure; all business tables use the repository schema.
  const schema = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8').replace(/DO \$\$[\s\S]*?\$\$;/, '');
  await db.exec(schema);
  await db.exec(migration);
  actor = (await db.query('SELECT id FROM usuarios LIMIT 1')).rows[0].id;
});
after(async () => { await db.close(); });

async function fixture() {
  const source = randomUUID(), target = randomUUID(), order = randomUUID(), item = randomUUID();
  await db.query("INSERT INTO menu_items(id,nombre,precio,categoria,estacion,descripcion) VALUES ($1,'Churrasco',30000,'Platos','PARRILLA','[STOCK:10] Original'),($2,'Pollo',20000,'Platos','ASADO','[STOCK:5] Reemplazo')", [source, target]);
  const mesa = (await db.query("INSERT INTO mesas(id,numero,zona,capacidad) SELECT coalesce(max(id),0)+1,coalesce(max(id),0)+1,'Primer Piso',4 FROM mesas RETURNING id")).rows[0].id;
  await db.query('INSERT INTO ordenes(id,mesa_id,mesero_id) VALUES ($1,$2,$3)', [order, mesa, actor]);
  await db.query("INSERT INTO items_orden(id,orden_id,menu_item_id,nombre,cantidad,precio_unitario,estacion,estado,created_at) VALUES ($1,$2,$3,'Churrasco',3,30000,'PARRILLA','EN PREPARACION','2026-11-07T18:10:12Z')", [item, order, source]);
  return { source, target, order, item };
}
async function cancel(f, quantity, { request = randomUUID(), user = actor, replacement = null, reason = 'El cliente solo quiere uno' } = {}) {
  const { rows } = await db.query('SELECT public.cancelar_item_orden($1,$2,$3,$4,$5,$6,$7) AS result', [f.order, f.item, quantity, user, request, reason, replacement]);
  return rows[0].result;
}
async function description(id) { return (await db.query('SELECT descripcion FROM menu_items WHERE id=$1', [id])).rows[0].descripcion; }

test('cancel 2 of 3: bill retains one, original preparation status and request time survive reload', async () => {
  const f = await fixture();
  const result = await cancel(f, 2);
  const active = result.items.find(item => item.id === f.item);
  assert.equal(active.cantidad, 1);
  assert.equal(active.estado, 'EN PREPARACION');
  assert.equal(result.canceledItem.cantidad, 2);
  assert.equal(result.canceledItem.estado, 'CANCELADO');
  assert.equal(Date.parse(result.canceledItem.created_at), Date.parse(active.created_at));
  assert.equal(result.canceledItem.canceled_by, actor);
  assert.equal(result.canceledItem.cancellation_reason, 'El cliente solo quiere uno');
  assert.ok(Math.abs(Date.parse(result.canceledItem.canceled_at) - Date.now()) < 10000);
  const bill = await db.query("SELECT sum(cantidad*precio_unitario)::integer AS total FROM items_orden WHERE orden_id=$1 AND estado <> 'CANCELADO'", [f.order]);
  assert.equal(bill.rows[0].total, 30000);
  assert.equal(await description(f.source), '[STOCK:12] Original');
  const audit = (await db.query('SELECT * FROM modificaciones_comanda WHERE orden_id=$1', [f.order])).rows[0];
  assert.equal(audit.items_afectados[0].cantidad, 2);
  assert.equal(audit.items_afectados[0].cantidadRestante, 1);
  assert.equal(new Date(audit.fecha).getTime(), Date.parse(result.canceledItem.canceled_at));
});

test('full cancellation and a repeated confirmation restore stock exactly once', async () => {
  const f = await fixture(), request = randomUUID();
  const first = await cancel(f, 3, { request });
  const second = await cancel(f, 3, { request });
  assert.equal(first.canceledItem.id, f.item);
  assert.equal(second.canceledItem.id, first.canceledItem.id);
  assert.equal(second.items.length, 1);
  assert.equal(await description(f.source), '[STOCK:13] Original');
  assert.equal((await db.query('SELECT count(*)::integer AS n FROM modificaciones_comanda WHERE orden_id=$1', [f.order])).rows[0].n, 1);
});

test('a stale kitchen action cannot reactivate canceled units', async () => {
  const f = await fixture();
  await cancel(f, 3);
  await assert.rejects(db.query("UPDATE items_orden SET estado='LISTO' WHERE id=$1", [f.item]), /no puede reactivarse/);
  assert.equal((await db.query('SELECT estado FROM items_orden WHERE id=$1', [f.item])).rows[0].estado, 'CANCELADO');
  assert.equal(await description(f.source), '[STOCK:13] Original');
});

test('replacement uses only the canceled units and updates both stocks in the same transaction', async () => {
  const f = await fixture();
  const result = await cancel(f, 2, { replacement: f.target });
  assert.equal(result.replacementItem.cantidad, 2);
  assert.equal(result.replacementItem.menu_item_id, f.target);
  assert.equal(result.items.find(item => item.id === f.item).cantidad, 1);
  assert.equal(await description(f.source), '[STOCK:12] Original');
  assert.equal(await description(f.target), '[STOCK:3] Reemplazo');
});

test('invalid, excessive or stale quantities cannot modify an order', async () => {
  const f = await fixture();
  for (const quantity of [0, -1, 4, null]) await assert.rejects(cancel(f, quantity));
  await cancel(f, 2);
  await assert.rejects(cancel(f, 2), /supera las unidades/);
  assert.equal(await description(f.source), '[STOCK:12] Original');
});

test('audit failure rolls back cancellation, replacement and stock together', async () => {
  const f = await fixture();
  await db.exec("CREATE FUNCTION fail_test_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.observaciones = 'FAIL_TEST' THEN RAISE EXCEPTION 'simulated audit failure'; END IF; RETURN NEW; END; $$; CREATE TRIGGER fail_test_audit BEFORE INSERT ON modificaciones_comanda FOR EACH ROW EXECUTE FUNCTION fail_test_audit();");
  try {
    await assert.rejects(cancel(f, 2, { replacement: f.target, reason: 'FAIL_TEST' }), /simulated audit failure/);
    const items = (await db.query('SELECT * FROM items_orden WHERE orden_id=$1', [f.order])).rows;
    assert.equal(items.length, 1);
    assert.equal(items[0].cantidad, 3);
    assert.equal(items[0].estado, 'EN PREPARACION');
    assert.equal(await description(f.source), '[STOCK:10] Original');
    assert.equal(await description(f.target), '[STOCK:5] Reemplazo');
  } finally { await db.exec('DROP TRIGGER fail_test_audit ON modificaciones_comanda; DROP FUNCTION fail_test_audit();'); }
});

test('paid orders, unknown actors and insufficient replacement stock are rejected without side effects', async () => {
  const f = await fixture();
  await assert.rejects(cancel(f, 1, { user: randomUUID() }), /usuario activo/);
  await db.query("UPDATE menu_items SET descripcion='[STOCK:1] Reemplazo' WHERE id=$1", [f.target]);
  await assert.rejects(cancel(f, 2, { replacement: f.target }), /suficientes unidades/);
  await db.query("UPDATE ordenes SET estado='CERRADA' WHERE id=$1", [f.order]);
  await assert.rejects(cancel(f, 1), /pagado o anulado/);
  assert.equal(await description(f.source), '[STOCK:10] Original');
});

test('fully annulled orders receive a server timestamp without changing creation time', async () => {
  const f = await fixture();
  await db.query("UPDATE ordenes SET created_at='2026-11-01T10:00:00Z',updated_at='2026-11-01T10:00:00Z' WHERE id=$1", [f.order]);
  await db.query("UPDATE ordenes SET estado='ANULADA' WHERE id=$1", [f.order]);
  const row = (await db.query('SELECT created_at,updated_at FROM ordenes WHERE id=$1', [f.order])).rows[0];
  assert.equal(new Date(row.created_at).toISOString(), '2026-11-01T10:00:00.000Z');
  assert.ok(Math.abs(new Date(row.updated_at).getTime() - Date.now()) < 10000);
});

test('cancellation RPC respects the caller table permissions', async () => {
  const f = await fixture();
  await db.exec('SET ROLE anon;');
  try {
    await assert.rejects(cancel(f, 1), /permission denied/);
  } finally { await db.exec('RESET ROLE;'); }
  assert.equal(await description(f.source), '[STOCK:10] Original');
});

test('migration recovers recorded legacy cancellation times and leaves unknown times empty', async () => {
  const f = await fixture(), old = '2026-10-18T20:12:34.123Z';
  await db.query("UPDATE items_orden SET estado='CANCELADO' WHERE id=$1", [f.item]);
  await db.query("INSERT INTO modificaciones_comanda(orden_id,usuario_id,tipo,items_afectados,observaciones,fecha) VALUES ($1,$2,'CANCELACION',$3,'Registro anterior',$4)", [f.order, actor, JSON.stringify([{ id: f.item }]), old]);
  const unknown = await fixture();
  await db.query("UPDATE items_orden SET estado='CANCELADO' WHERE id=$1", [unknown.item]);
  await db.exec(migration);
  const knownRow = (await db.query('SELECT * FROM items_orden WHERE id=$1', [f.item])).rows[0];
  assert.equal(new Date(knownRow.canceled_at).getTime(), Date.parse(old));
  assert.equal(knownRow.canceled_by, actor);
  assert.equal((await db.query('SELECT canceled_at FROM items_orden WHERE id=$1', [unknown.item])).rows[0].canceled_at, null);
});
