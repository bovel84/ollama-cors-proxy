// Catch-all proxy: forwarda qualsiasi path a Ollama Cloud
// GET/POST /api/proxy/api/chat -> https://ollama.com/api/chat
// GET/POST /api/proxy/v1/chat/completions -> https://ollama.com/v1/chat/completions

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Extract the catch-all path
  const pathParam = req.query.path;
  const subPath = Array.isArray(pathParam) ? pathParam.join('/') : (pathParam || '');
  const targetUrl = 'https://ollama.com/' + subPath;

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    const fetchOptions = { method: req.method || 'POST', headers };
    if (req.method === 'POST' || req.method === 'PUT') {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || 'application/json';
    const data = await response.text();
    res.status(response.status).setHeader('Content-Type', contentType);
    return res.send(data);
  } catch (err) {
    return res.status(502).json({ error: err.message || 'Proxy error' });
  }
}
