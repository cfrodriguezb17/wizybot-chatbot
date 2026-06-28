# WizyBot Chatbot API

API de chatbot con inteligencia artificial que busca productos y convierte divisas usando OpenAI y Gemini (con fallback automático).

## Requisitos

- Node.js 22+
- npm
- Claves de API: OpenAI, Gemini y Open Exchange Rates

## Configuración

1. Copiar `.env` con las claves de API necesarias:
   - `OPENAI_API_KEY` — clave de OpenAI
   - `GEMINI_API_KEY` — clave de Gemini (fallback)
   - `OPEN_EXCHANGE_RATES_APP_ID` — clave de Open Exchange Rates

2. Instalar dependencias:

```bash
npm install
```

## Ejecutar en desarrollo

```bash
npm run start:dev
```

El servidor se inicia en `http://localhost:8080`.

## Ejecutar tests

```bash
npm test                 # tests unitarios
npm run test:e2e         # tests e2e
npm run test:integration # tests con APIs reales
```

## Uso de la API

### Endpoint

`POST /chatbot`

### Request

```json
{
  "userMessage": "I am looking for a phone"
}
```

### Response

```json
{
  "response": "I found the following phones in our catalog..."
}
```

### Ejemplo con curl

```bash
curl -X POST http://localhost:8080/chatbot \
  -H "Content-Type: application/json" \
  -d '{"userMessage":"I am looking for a phone"}'
```

### Documentación Swagger

Disponible en `http://localhost:8080/api` cuando el servidor está corriendo.
