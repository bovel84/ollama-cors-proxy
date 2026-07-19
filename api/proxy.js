// Vercel Serverless Function: proxy per Ollama Cloud
// Risolve il problema CORS: il browser chiama questo endpoint,
// che forwarda a Ollama Cloud (https://ollama.com)
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Forward path to Ollama Cloud
  // The client calls: https://your-app.vercel.app/api/proxy/api/chat
  // We forward to: https://ollama.com/api/chat
  const path = req.url?.replace(/^\/api\/proxy/, '') || '';
  const targetUrl = 'https://ollama.com' + (path || '/api/chat');

  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    const fetchOptions = {
      method: req.method || 'POST',
      headers,
    };

    if (req.method === 'POST' || req.method === 'PUT') {
      // Vercel parses JSON body automatically when content-type is JSON
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