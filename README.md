# Alexa Gilg Server

Servidor Node.js para la skill de Alexa "Gilg" que permite enviar mensajes por voz desde un reloj inteligente.

## Configuración en Hostinger

1. Sube esta carpeta a tu hosting
2. En el panel de Hostinger, ve a **Node.js Applications**
3. Crea una nueva aplicación:
   - **Application URL:** tu dominio o subdominio (ej: `gilg.tudominio.com`)
   - **Application Root:** ruta a esta carpeta
   - **Application Startup File:** `server.js`
4. Configura las variables de entorno:
   ```
   OPENCLAW_GATEWAY_URL=http://tu-ip:18789
   OPENCLAW_TOKEN=tu-token
   TELEGRAM_CHAT_ID=tu-chat-id
   ```
5. Reinicia la aplicación

## Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto del servidor | 3000 |
| `OPENCLAW_GATEWAY_URL` | URL del Gateway OpenClaw | http://localhost:18789 |
| `OPENCLAW_TOKEN` | Token de autenticación | (requerido) |
| `TELEGRAM_CHAT_ID` | ID del chat de Telegram | 1809345608 |

## Uso con Alexa

1. Di: "Alexa, abre Gilg"
2. Alexa responderá: "Hola, soy Gilg. ¿Qué necesitas?"
3. Di: "Dile a Gilg que revise mi calendario"
4. Alexa enviará el mensaje a Telegram

## Comandos disponibles

- "Dile a Gilg {mensaje}"
- "Pregúntale a Gilg {mensaje}"
- "Avísale a Gilg {mensaje}"
- "Gilg {mensaje}"

## Skill ID

`amzn1.ask.skill.745346a7-0352-498b-828d-8897ffeeb3e9`

## Endpoints

- `GET /` - Health check
- `GET /health` - Health check
- `POST /` - Alexa webhook

## Licencia

MIT
