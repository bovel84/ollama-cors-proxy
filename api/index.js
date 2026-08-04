export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://excel.kinaia.app');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    ok: true,
    service: 'ollama-cors-proxy',
    upstream: 'https://ollama.com/v1',
    endpoints: [
      'GET /v1/models',
      'POST /v1/chat/completions',
      'POST /v1/responses'
    ]
  });
}
