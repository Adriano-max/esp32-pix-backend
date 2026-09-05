const express = require('express');
const axios = require('axios');
const mqtt = require('mqtt');

const app = express();
app.use(express.json());

// Conecta ao broker MQTT gratuito
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883');
const TOPICO_MQTT = process.env.TOPICO_MQTT || 'seu_usuario_exclusivo/esp32/rele';
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

mqttClient.on('connect', () => {
    console.log('Conectado ao broker MQTT HiveMQ com sucesso!');
});

// Rota para testar se o servidor está online
app.get('/', (req, res) => {
    res.send('Servidor do ESP32 Pix ativo e operante!');
});

// Webhook do Mercado Pago
app.post('/webhook', async (req, res) => {
    const { type, data } = req.body;

    if (type === 'payment' && data && data.id) {
        try {
            const response = await axios.get(`https://api.mercadopago.com/v1/payments/${data.id}`, {
                headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
            });

            const payment = response.data;

            if (payment.status === 'approved') {
                console.log(`Pagamento ${data.id} aprovado! Valor: R$ ${payment.transaction_amount}`);
                
                // Envia comando para acionar o ESP32
                mqttClient.publish(TOPICO_MQTT, 'LIGAR');
            }
        } catch (error) {
            console.error('Erro ao consultar o Mercado Pago:', error.message);
        }
    }

    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
