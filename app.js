require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// OpenClaw configuration
const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || '737ca5044c75151e455072bd547a82e3bfc11b645fc4ef5d';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1809345608';

// Alexa Skill ID
const SKILL_ID = 'amzn1.ask.skill.745346a7-0352-498b-828d-8897ffeeb3e9';

// Middleware - log all incoming requests
app.use(bodyParser.json());

app.use((req, res, next) => {
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    next();
});

// Build Alexa speech response
function buildResponse(speechText, shouldEndSession = true, repromptText = null) {
    const response = {
        version: '1.0',
        response: {
            outputSpeech: {
                type: 'PlainText',
                text: speechText
            },
            shouldEndSession: shouldEndSession
        }
    };
    
    if (repromptText) {
        response.response.reprompt = {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText
            }
        };
    }
    
    console.log('Sending response:', JSON.stringify(response, null, 2));
    return response;
}

// Send message to Telegram via OpenClaw
async function sendToTelegram(message) {
    try {
        console.log(`Sending to Telegram: ${message}`);
        const response = await axios.post(`${OPENCLAW_GATEWAY_URL}/api/send`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: `🎤 [Desde Alexa] ${message}`
        }, {
            headers: {
                'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });
        console.log('Telegram response:', response.status);
        return true;
    } catch (error) {
        console.error('Error sending to Telegram:', error.message);
        return false;
    }
}

// Health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'Alexa Gilg Server',
        skillId: SKILL_ID,
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Alexa endpoint
app.post('/', async (req, res) => {
    try {
        const body = req.body;
        
        // Validate request structure
        if (!body || !body.request) {
            console.error('Invalid request structure');
            return res.json(buildResponse('Solicitud inválida.', true));
        }
        
        const request = body.request;
        const requestType = request.type;
        const session = body.session || {};
        
        console.log(`Request type: ${requestType}`);
        console.log(`Session new: ${session.new}`);
        
        // Handle Launch Request (user says "Alexa, open Gilg")
        if (requestType === 'LaunchRequest') {
            return res.json(buildResponse(
                'Hola, soy Gilg. ¿Qué mensaje quieres enviar?',
                false,
                'Dime tu mensaje para Gilg.'
            ));
        }
        
        // Handle Intent Request
        if (requestType === 'IntentRequest') {
            const intent = request.intent;
            
            if (!intent || !intent.name) {
                console.error('No intent found');
                return res.json(buildResponse('No entendí eso. Intenta de nuevo.', false));
            }
            
            console.log(`Intent: ${intent.name}`);
            
            switch (intent.name) {
                case 'SendMessageIntent':
                    const message = intent.slots?.message?.value || '';
                    console.log(`Message slot: "${message}"`);
                    
                    if (message && message.trim()) {
                        await sendToTelegram(message.trim());
                        return res.json(buildResponse(
                            `Listo. Envié: ${message}.`,
                            true
                        ));
                    } else {
                        return res.json(buildResponse(
                            'No escuché ningún mensaje. Repite por favor.',
                            false,
                            '¿Qué quieres enviar a Gilg?'
                        ));
                    }
                
                case 'AMAZON.HelpIntent':
                    return res.json(buildResponse(
                        'Di: dile a Gilg, seguido de tu mensaje. Por ejemplo: dile a Gilg que estoy ocupado.',
                        false,
                        '¿Qué mensaje quieres enviar?'
                    ));
                
                case 'AMAZON.CancelIntent':
                case 'AMAZON.StopIntent':
                    return res.json(buildResponse('Hasta luego.', true));
                
                case 'AMAZON.FallbackIntent':
                    return res.json(buildResponse(
                        'No entendí eso. Di: dile a Gilg, y tu mensaje.',
                        false,
                        '¿Qué quieres enviar a Gilg?'
                    ));
                
                default:
                    console.log(`Unknown intent: ${intent.name}`);
                    return res.json(buildResponse(
                        'No reconocí ese comando.',
                        false
                    ));
            }
        }
        
        // Handle Session Ended
        if (requestType === 'SessionEndedRequest') {
            console.log('Session ended');
            return res.json({ version: '1.0', response: {} });
        }
        
        // Unknown request type
        console.log(`Unknown request type: ${requestType}`);
        return res.json(buildResponse('No pude procesar eso.', true));
        
    } catch (error) {
        console.error('Error processing request:', error);
        return res.json(buildResponse('Hubo un error. Intenta de nuevo.', true));
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('═══════════════════════════════════════');
    console.log('🚀 Alexa Gilg Server STARTED');
    console.log('═══════════════════════════════════════');
    console.log(`Port: ${PORT}`);
    console.log(`Skill ID: ${SKILL_ID}`);
    console.log(`OpenClaw Gateway: ${OPENCLAW_GATEWAY_URL}`);
    console.log(`Telegram Chat ID: ${TELEGRAM_CHAT_ID}`);
    console.log('═══════════════════════════════════════');
});

module.exports = app;
