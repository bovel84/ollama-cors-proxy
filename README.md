# Ollama Cloud CORS Proxy

Vercel proxy for browser-based clients that use Ollama Cloud through the OpenAI-compatible API.

## Supported endpoints

- `GET /v1/models`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Requests are forwarded to `https://ollama.com/v1` and the `Authorization` header is passed through unchanged. The proxy does not store API keys.

## Kinaia configuration

- Provider: `Custom Endpoint`
- API type: `OpenAI Completions`
- Base URL: `https://ollama-cors-proxy.vercel.app/v1`
- Model ID: for example `deepseek-v4-flash:0731` or `glm-5.2`
- API key: your Ollama Cloud key
- CORS Proxy: disabled

## Deploy

Import this repository into Vercel and deploy the `master` branch. No environment variables are required.

## CORS

The proxy currently allows requests from:

```text
https://excel.kinaia.app
```

The preflight request supports `Authorization` and `Content-Type` headers.
