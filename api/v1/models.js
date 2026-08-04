const ALLOWED_ORIGIN = 'https://excel.kinaia.app';
const FALLBACK_HEADERS =
  'Authorization, Content-Type, X-Stainless-Arch, X-Stainless-Lang, X-Stainless-OS, X-Stainless-Package-Version, X-Stainless-Retry-Count, X-Stainless-Runtime, X-Stainless-Runtime-Version, OpenAI-Organization, OpenAI-Project';

function setCors(req, res) {
  const requestedHeaders = req.headers['access-control-request-headers'];

  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin, Access-Control-Request-Headers');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', requestedHeaders || FALLBACK_HEADERS);
  res.setHeader('Access-Control-Max-Age', '86400');
}

function normalizeModels(payload) {
  const models = Array.isArray(payload?.data) ? payload.data : [];
  const unique = new Map();

  for (const model of models) {
    if (!model || typeof model.id !== 'string' || !model.id.trim()) continue;

    const id = model.id.trim();
    unique.set(id, {
      id,
      object: 'model',
      created: Number.isFinite(model.created) ? model.created : 0,
      owned_by: model.owned_by || 'ollama',
    });
  }

  return {
    object: 'list',
    data: [...unique.values()].sort((a, b) =>
      a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' })
    ),
  };
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const upstream = await fetch('https://ollama.com/v1/models', {
      headers: req.headers.authorization
        ? { Authorization: req.headers.authorization }
        : {},
    });

    const raw = await upstream.text();

    if (!upstream.ok) {
      res.status(upstream.status);
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      return res.send(raw);
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: 'Invalid models response from Ollama Cloud' });
    }

    const normalized = normalizeModels(payload);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.setHeader('X-Model-Count', String(normalized.data.length));
    return res.status(200).json(normalized);
  } catch (error) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({
      error: 'Ollama upstream request failed',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
