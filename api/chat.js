// Shortcut: POST /api/chat -> https://ollama.com/api/chat
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const targetUrl = 'https://ollama.com/api/chat';
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;
    const opts = { method: req.method || 'POST', headers };
    if (req.method === 'POST') {
      opts.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }
    const response = await fetch(targetUrl, opts);
    const data = await response.text();
    res.status(response.status).setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    return res.send(data);
  } catch (err) {
    return res.status(502).json({ error: err.message || 'Proxy error' });
  }
}
