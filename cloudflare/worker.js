const HOSTS = new Set(['www.northwrightsoftware.com', 'northwrightsoftware.com', 'northwright.pages.dev']);
const PRODUCTS = new Set(['CleanFeed', 'SlitLogic', 'Both products', 'General question']);
const RECIPIENT = 'jake.a.mathias@gmail.com';
const SENDER = 'Northwright Software <contact@mail.northwrightsoftware.com>';
const MAX_BODY = 65536;
const UNAVAILABLE = 'We couldn’t send your message. Please try again in a moment, or use the email link.';

function json(data, status = 200, extraHeaders = {}) {
  return Response.json(data, { status, headers: {
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extraHeaders,
  } });
}

async function readBody(request) {
  if (Number(request.headers.get('content-length')) > MAX_BODY) throw new Error('too-large');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid');
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel();
      throw new Error('too-large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

function validate(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const limits = { name: 120, email: 254, company: 160, product: 40, message: 5000, token: 2048, website: 200, requestId: 36 };
  const fields = {};
  for (const [key, limit] of Object.entries(limits)) {
    const value = data[key] ?? '';
    if (typeof value !== 'string' || value.length > limit) return null;
    fields[key] = value.trim();
  }
  if (!fields.name || !fields.message || !fields.token || !PRODUCTS.has(fields.product)) return null;
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(fields.email)) return null;
  if (/[\r\n\x00-\x1f\x7f]/.test(fields.name + fields.email + fields.company)) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(fields.requestId)) return null;
  return fields;
}

export async function handleContact(request, env, fetcher = fetch) {
  const url = new URL(request.url);
  if (!HOSTS.has(url.hostname)) return json({ error: 'This form is not enabled on this hostname.' }, 403);
  if (url.pathname === '/api/contact/config') {
    if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405, { Allow: 'GET' });
    if (!env.TURNSTILE_SITE_KEY || !env.TURNSTILE_SECRET_KEY || !env.RESEND_API_KEY) return json({ error: UNAVAILABLE }, 503);
    return json({ siteKey: env.TURNSTILE_SITE_KEY });
  }
  if (url.pathname !== '/api/contact') return json({ error: 'Not found.' }, 404);
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });
  if (request.headers.get('origin') !== url.origin) return json({ error: 'Please submit this form from the Northwright website.' }, 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return json({ error: 'Unsupported submission format.' }, 415);
  if (!env.TURNSTILE_SECRET_KEY || !env.RESEND_API_KEY) return json({ error: UNAVAILABLE }, 503);
  let data;
  try { data = await readBody(request); }
  catch (error) { return json({ error: 'Please check your message and try again.' }, error.message === 'too-large' ? 413 : 400); }
  const fields = validate(data);
  if (!fields || fields.website) return json({ error: 'Please check the form fields and complete the verification.' }, 400);

  let verification;
  try {
    const result = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: fields.token,
        remoteip: request.headers.get('cf-connecting-ip') || undefined }),
      signal: AbortSignal.timeout(10000),
    });
    if (!result.ok) throw new Error('verification-unavailable');
    verification = await result.json();
  } catch { return json({ error: 'Verification is temporarily unavailable. Please try again or use the email link.' }, 503); }
  if (!verification.success || verification.hostname !== url.hostname || verification.action !== 'contact') {
    return json({ error: 'Please complete the verification again, then resend your message.' }, 400);
  }

  // Fixed sender and recipient prevent the public endpoint from becoming an email relay.
  // Plain text keeps visitor content out of HTML and email headers.
  const email = {
    from: SENDER, to: [RECIPIENT], reply_to: fields.email,
    subject: `Northwright Software — ${fields.product} inquiry`,
    text: `Name: ${fields.name}\nEmail: ${fields.email}\nCompany: ${fields.company || 'Not provided'}\nInterested in: ${fields.product}\n\n${fields.message}`,
  };
  const payload = JSON.stringify(email);
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  const fingerprint = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  try {
    const result = await fetcher('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json', 'Idempotency-Key': `contact/${fields.requestId}/${fingerprint}` },
      body: payload, signal: AbortSignal.timeout(15000),
    });
    if (!result.ok) return json({ error: UNAVAILABLE }, result.status === 429 ? 429 : 502);
    const receipt = await result.json();
    if (!receipt.id) return json({ error: UNAVAILABLE }, 502);
    // Acceptance by Resend is not a guarantee of inbox delivery.
    return json({ ok: true });
  } catch { return json({ error: UNAVAILABLE }, 502); }
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname.startsWith('/api/')) return handleContact(request, env);
    return env.ASSETS.fetch(request);
  },
};
