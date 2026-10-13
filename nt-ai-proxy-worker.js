/**
 * New Taraneh AI Proxy — Cloudflare Worker
 *
 * Deploy steps:
 * 1) https://dash.cloudflare.com → Workers & Pages → Create Worker
 * 2) Paste this file
 * 3) Settings → Variables → add secrets:
 *    AVALAI_KEY, OR_KEY_1, OR_KEY_2, OR_KEY_3, OR_KEY_4 (optional NT_TOKEN)
 * 4) Deploy → copy URL like https://nt-ai-proxy.YOUR_NAME.workers.dev
 * 5) In template CONFIG.PROXY_URL set that URL
 */
const AVALAI_BASE = 'https://api.avalai.ir/v1';
const OR_BASE = 'https://openrouter.ai/api/v1';
const OR_MODELS = ['openai/gpt-4o-mini', 'openrouter/auto'];

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-nt-token',
};

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

    const url = new URL(req.url);
    if (!url.pathname.endsWith('/chat/completions') && url.pathname !== '/' && !url.pathname.endsWith('/v1/chat/completions')) {
      return json({ error: 'use POST /v1/chat/completions' }, 404);
    }

    if (env.NT_TOKEN) {
      const t = req.headers.get('x-nt-token') || '';
      if (t !== env.NT_TOKEN) return json({ error: 'unauthorized' }, 401);
    }

    let body;
    try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
    if (!body || !Array.isArray(body.messages)) return json({ error: 'messages required' }, 400);

    const stream = !!body.stream;
    const payload = {
      model: body.model || 'gpt-4o-mini',
      messages: body.messages,
      temperature: body.temperature == null ? 0.4 : body.temperature,
      max_tokens: body.max_tokens || 1600,
      stream
    };

    const avalKey = env.AVALAI_KEY || '';
    if (avalKey) {
      try {
        const r = await fetch(AVALAI_BASE + '/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + avalKey },
          body: JSON.stringify(payload)
        });
        if (r.ok) return proxyRes(r, stream);
      } catch (e) {}
    }

    const orKeys = [env.OR_KEY_1, env.OR_KEY_2, env.OR_KEY_3, env.OR_KEY_4].filter(Boolean);
    for (let ki = 0; ki < orKeys.length; ki++) {
      for (let mi = 0; mi < OR_MODELS.length; mi++) {
        try {
          const r = await fetch(OR_BASE + '/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + orKeys[ki],
              'HTTP-Referer': 'https://new-taraneh.ir',
              'X-Title': 'New Taraneh AI Proxy'
            },
            body: JSON.stringify(Object.assign({}, payload, { model: OR_MODELS[mi] }))
          });
          if (r.ok) return proxyRes(r, stream);
        } catch (e) {}
      }
    }
    return json({ error: 'all upstream failed' }, 502);
  }
};

function json(o, status) {
  return new Response(JSON.stringify(o), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json' }, cors) });
}

function proxyRes(r, stream) {
  const h = new Headers(cors);
  h.set('Content-Type', r.headers.get('Content-Type') || 'application/json');
  if (stream) return new Response(r.body, { status: r.status, headers: h });
  return r.text().then(t => new Response(t, { status: r.status, headers: h }));
}
