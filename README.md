# WizyBot Chatbot API

API de chatbot con inteligencia artificial que busca productos y convierte divisas usando OpenAI y Gemini (con fallback automático).

## Requisitos

- Node.js 22+
- npm
- Claves de API: OpenAI, Gemini y Open Exchange Rates

## Configuración

1. Crear un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
OPENAI_API_KEY=sk-...          # Clave de OpenAI (obligatoria)
GEMINI_API_KEY=AIza...         # Clave de Gemini (opcional, para fallback)
OPEN_EXCHANGE_RATES_APP_ID=...  # Clave de Open Exchange Rates (obligatoria)
```

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

### Ejemplos de mensajes

```bash
curl -X POST http://localhost:8080/chatbot -H "Content-Type: application/json" -d '{"userMessage":"I am looking for a phone"}'
```

```bash
curl -X POST http://localhost:8080/chatbot -H "Content-Type: application/json" -d '{"userMessage":"I am looking for a present for my dad"}'
```

```bash
curl -X POST http://localhost:8080/chatbot -H "Content-Type: application/json" -d '{"userMessage":"How much does a watch costs?"}'
```

```bash
curl -X POST http://localhost:8080/chatbot -H "Content-Type: application/json" -d '{"userMessage":"What is the price of the watch in Euros"}'
```

```bash
curl -X POST http://localhost:8080/chatbot -H "Content-Type: application/json" -d '{"userMessage":"How many Canadian Dollars are 350 Euros"}'
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
