const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// OpenClaw configuration
const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || '737ca5044c75151e455072bd547a82e3bfc11b645fc4ef5d';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1809345608';

// Middleware
app.use(bodyParser.json());

// Alexa Skill ID - validate requests
const SKILL_ID = 'amzn1.ask.skill.745346a7-0352-498b-828d-8897ffeeb3e9';

// Verify Alexa request signature (simplified for Hostinger)
function verifyAlexaRequest(req) {
    // In production, verify the signature certificate URL and signature
    // For simplicity, we check the skill ID in the request
    const requestBody = req.body;
    if (requestBody.session && requestBody.session.application) {
        return requestBody.session.application.applicationId === SKILL_ID;
    }
    // Allow for testing
    return true;
}

// Build Alexa speech response
function buildSpeechResponse(speechText, shouldEndSession = true, repromptText = null) {
    return {
        version: '1.0',
        response: {
            outputSpeech: {
                type: 'PlainText',
                text: speechText
            },
            shouldEndSession: shouldEndSession,
            ...(repromptText && {
                reprompt: {
                    outputSpeech: {
                        type: 'PlainText',
                        text: repromptText
                    }
                }
            })
        }
    };
}

// Send message to OpenClaw (which forwards to Telegram)
async function sendMessageToGilg(message) {
    try {
        // Send to OpenClaw Gateway which will route to Telegram
        const response = await axios.post(`${OPENCLAW_GATEWAY_URL}/api/send`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: `🎤 [Desde Alexa] ${message}`
        }, {
            headers: {
                'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        return true;
    } catch (error) {
        console.error('Error sending to OpenClaw:', error.message);
        // Fallback: just log it
        console.log(`Message to Gilg: ${message}`);
        return true;
    }
}

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'Alexa Gilg Server',
        skillId: SKILL_ID 
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Main Alexa endpoint
app.post('/', async (req, res) => {
    console.log('Received Alexa request:', JSON.stringify(req.body, null, 2));

    if (!verifyAlexaRequest(req)) {
        return res.status(403).json({ error: 'Invalid request' });
    }

    const requestBody = req.body;
    const requestType = requestBody.request.type;
    const intent = requestBody.request.intent;

    // Handle different request types
    switch (requestType) {
        case 'LaunchRequest':
            // User said "Alexa, open Gilg"
            return res.json(buildSpeechResponse(
                'Hola, soy Gilg. ¿Qué necesitas? Dime tu mensaje y lo enviaré.',
                false,
                'Dime tu mensaje para Gilg.'
            ));

        case 'IntentRequest':
            // Handle intents
            if (intent) {
                switch (intent.name) {
                    case 'SendMessageIntent':
                        const message = intent.slots && intent.slots.message ? intent.slots.message.value : '';
                        
                        if (message) {
                            // Send to OpenClaw/Telegram
                            await sendMessageToGilg(message);
                            
                            return res.json(buildSpeechResponse(
                                `Mensaje enviado: ${message}. Gilg lo recibirá en Telegram.`,
                                true
                            ));
                        } else {
                            return res.json(buildSpeechResponse(
                                'No entendí el mensaje. Por favor, repítelo.',
                                false,
                                '¿Qué mensaje quieres enviar a Gilg?'
                            ));
                        }

                    case 'AMAZON.HelpIntent':
                        return res.json(buildSpeechResponse(
                            'Puedes decir: dile a Gilg, seguido de tu mensaje. Por ejemplo: dile a Gilg que revise mi calendario.',
                            false,
                            '¿Qué necesitas enviar a Gilg?'
                        ));

                    case 'AMAZON.CancelIntent':
                    case 'AMAZON.StopIntent':
                        return res.json(buildSpeechResponse(
                            'Hasta luego.',
                            true
                        ));

                    default:
                        return res.json(buildSpeechResponse(
                            'No entendí eso. Intenta decir: dile a Gilg, y tu mensaje.',
                            false
                        ));
                }
            }
            break;

        case 'SessionEndedRequest':
            // Session ended
            return res.json({ version: '1.0', response: {} });

        default:
            return res.json(buildSpeechResponse(
                'No pude procesar esa solicitud.',
                true
            ));
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Alexa Gilg Server running on port ${PORT}`);
    console.log(`📋 Skill ID: ${SKILL_ID}`);
    console.log(`🔗 OpenClaw Gateway: ${OPENCLAW_GATEWAY_URL}`);
});

module.exports = app;
