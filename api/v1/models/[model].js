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

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const requestedModel = Array.isArray(req.query.model)
    ? req.query.model.join('/')
    : req.query.model;

  if (!requestedModel) return res.status(400).json({ error: 'Model ID is required' });

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
      return res.send(raw);
    }

    const payload = JSON.parse(raw);
    const model = Array.isArray(payload?.data)
      ? payload.data.find((item) => item?.id === requestedModel)
      : null;

    if (!model) {
      return res.status(404).json({
        error: {
          message: `Model '${requestedModel}' not found`,
          type: 'invalid_request_error',
          param: 'model',
          code: 'model_not_found',
        },
      });
    }

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({
      id: model.id,
      object: 'model',
      created: Number.isFinite(model.created) ? model.created : 0,
      owned_by: model.owned_by || 'ollama',
    });
  } catch (error) {
    return res.status(502).json({
      error: 'Ollama upstream request failed',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
