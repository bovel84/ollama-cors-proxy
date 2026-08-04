const FALLBACK_HEADERS =
  'Authorization, Content-Type, X-Stainless-Arch, X-Stainless-Lang, X-Stainless-OS, X-Stainless-Package-Version, X-Stainless-Retry-Count, X-Stainless-Runtime, X-Stainless-Runtime-Version, OpenAI-Organization, OpenAI-Project';

function getAllowedOrigin(origin) {
  if (!origin) return null;

  try {
    const url = new URL(origin);
    const isHttps = url.protocol === 'https:';
    const isKinaia =
      url.hostname === 'kinaia.app' || url.hostname.endsWith('.kinaia.app');

    return isHttps && isKinaia ? origin : null;
  } catch {
    return null;
  }
}

function setCors(req, res) {
  const origin = getAllowedOrigin(req.headers.origin);
  const requestedHeaders = req.headers['access-control-request-headers'];

  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin, Access-Control-Request-Headers');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', requestedHeaders || FALLBACK_HEADERS);
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Cache-Control', 'no-store');

  return origin;
}

export default async function handler(req, res) {
  const allowedOrigin = setCors(req, res);

  if (req.method === 'OPTIONS') {
    if (req.headers.origin && !allowedOrigin) {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const upstream = await fetch('https://ollama.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization
          ? { Authorization: req.headers.authorization }
          : {}),
      },
      body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
    });

    res.status(upstream.status);
    res.setHeader(
      'Content-Type',
      upstream.headers.get('content-type') || 'application/json'
    );

    const body = await upstream.text();
    return res.send(body);
  } catch (error) {
    return res.status(502).json({
      error: 'Ollama upstream request failed',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
