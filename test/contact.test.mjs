import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { handleContact } from '../cloudflare/worker.js';

const origin = 'https://www.northwrightsoftware.com';
const env = { TURNSTILE_SITE_KEY: 'public-test-key', TURNSTILE_SECRET_KEY: 'private-test-key', RESEND_API_KEY: 'private-resend-key' };
const valid = { name: 'Test Person', email: 'person@example.com', company: 'Example', product: 'CleanFeed', message: 'A test inquiry.', token: 'test-token', website: '', requestId: '7ab37f3a-ea1c-4c3b-b1eb-964e6dc29664' };
function request(fields = valid, options = {}) {
  return new Request(`${origin}/api/contact`, { method: 'POST', headers: { origin, 'Content-Type': 'application/json', ...options.headers }, body: JSON.stringify(fields) });
}
function service({ turnstile = { success: true, hostname: 'www.northwrightsoftware.com', action: 'contact' }, status = 200, receipt = { id: 'email-id' } } = {}) {
  const calls = [];
  return { calls, fetch: async (url, options) => {
    calls.push({ url, options });
    return url.includes('siteverify') ? Response.json(turnstile) : Response.json(receipt, { status });
  } };
}
test('valid inquiry sends to the fixed recipient with reply-to and waits for acceptance', async () => {
  const mock = service();
  const response = await handleContact(request({ ...valid, to: 'attacker@example.com', from: 'spoof@example.com' }), env, mock.fetch);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(mock.calls.length, 2);
  const email = JSON.parse(mock.calls[1].options.body);
  assert.deepEqual(email.to, ['jake.a.mathias@gmail.com']);
  assert.equal(email.from, 'Northwright Software <contact@mail.northwrightsoftware.com>');
  assert.equal(email.reply_to, valid.email);
  assert.equal(email.html, undefined);
  assert.ok(mock.calls[1].options.headers['Idempotency-Key'].startsWith(`contact/${valid.requestId}/`));
});
test('invalid fields, spam trap, and header injection cannot send', async () => {
  const changes = [{ name: '' }, { email: 'invalid' }, { email: 'test@example.com\r\nBcc: bad@example.com' }, { name: 'a\nb' }, { product: 'Arbitrary subject' }, { message: 'x'.repeat(5001) }, { website: 'bot.example' }, { token: '' }, { requestId: 'not-a-uuid' }, { company: {} }];
  for (const patch of changes) {
    const mock = service();
    const response = await handleContact(request({ ...valid, ...patch }), env, mock.fetch);
    assert.equal(response.status, 400, JSON.stringify(patch).slice(0, 80));
    assert.equal(mock.calls.length, 0);
  }
});
test('cross-origin requests, malformed bodies, and oversized payloads are rejected', async () => {
  const mock = service();
  assert.equal((await handleContact(request(valid, { headers: { origin: 'https://attacker.example' } }), env, mock.fetch)).status, 403);
  assert.equal((await handleContact(request(valid, { headers: { 'Content-Type': 'text/plain' } }), env, mock.fetch)).status, 415);
  assert.equal((await handleContact(new Request(`${origin}/api/contact`, { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: '{broken' }), env, mock.fetch)).status, 400);
  assert.equal((await handleContact(request({ ...valid, message: 'x'.repeat(70000) }), env, mock.fetch)).status, 413);
  assert.equal(mock.calls.length, 0);
});
test('failed, replayed, wrong-host, and wrong-action challenges never send mail', async () => {
  for (const turnstile of [{ success: false, 'error-codes': ['timeout-or-duplicate'] }, { success: true, hostname: 'attacker.example', action: 'contact' }, { success: true, hostname: 'www.northwrightsoftware.com', action: 'login' }]) {
    const mock = service({ turnstile });
    assert.equal((await handleContact(request(), env, mock.fetch)).status, 400);
    assert.equal(mock.calls.length, 1);
  }
});
test('provider rejection, missing receipt, and outages cannot report success or leak credentials', async () => {
  for (const options of [{ status: 401 }, { status: 429 }, { status: 500 }, { receipt: {} }]) {
    const mock = service(options);
    const response = await handleContact(request(), env, mock.fetch);
    assert.ok(response.status >= 400);
    assert.equal((await response.json()).ok, undefined);
  }
  const failed = await handleContact(request(), env, async () => { throw new Error(env.TURNSTILE_SECRET_KEY); });
  assert.equal(failed.status, 503);
  assert.ok(!(await failed.text()).includes(env.TURNSTILE_SECRET_KEY));
});
test('retrying identical content reuses the idempotency key; editing content changes it', async () => {
  const mock = service();
  for (const fields of [valid, valid, { ...valid, message: 'Changed inquiry' }]) await handleContact(request(fields), env, mock.fetch);
  const keys = mock.calls.filter(call => call.url.includes('api.resend')).map(call => call.options.headers['Idempotency-Key']);
  assert.equal(keys[0], keys[1]);
  assert.notEqual(keys[0], keys[2]);
});
test('config exposes only the public key and fails closed when setup is incomplete', async () => {
  const response = await handleContact(new Request(`${origin}/api/contact/config`), env);
  assert.deepEqual(await response.json(), { siteKey: env.TURNSTILE_SITE_KEY });
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal((await handleContact(new Request(`${origin}/api/contact/config`), {})).status, 503);
  assert.equal((await handleContact(new Request('https://untrusted.pages.dev/api/contact/config'), env)).status, 403);
  assert.equal((await handleContact(new Request(`${origin}/api/contact`), env)).status, 405);
});
test('static assets still pass through the Pages asset binding', async () => {
  let seen;
  const response = await worker.fetch(new Request(`${origin}/styles.css`), { ASSETS: { fetch: req => { seen = req.url; return new Response('css'); } } });
  assert.equal(await response.text(), 'css');
  assert.equal(seen, `${origin}/styles.css`);
});
