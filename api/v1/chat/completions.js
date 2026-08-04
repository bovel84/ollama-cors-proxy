const ALLOWED_ORIGIN = 'https://excel.kinaia.app';

function setCors(req, res) {
  const requestedHeaders = req.headers['access-control-request-headers'];

  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin, Access-Control-Request-Headers');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    requestedHeaders ||
      'Authorization, Content-Type, X-Stainless-Arch, X-Stainless-Lang, X-Stainless-OS, X-Stainless-Package-Version, X-Stainless-Retry-Count, X-Stainless-Runtime, X-Stainless-Runtime-Version, OpenAI-Organization, OpenAI-Project'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Cache-Control', 'no-store');
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
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
