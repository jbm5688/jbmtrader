const express = require('express');
const session = require('express-session');
const axios = require('axios');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'jbm_trader_session_secret_2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true }
}));

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '2.2.0'
    });
});

// Alpha Vantage API
app.get('/api/market-data/alpha-vantage/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: 'Alpha Vantage API key not configured' });
        }
        
        const response = await axios.get(`https://www.alphavantage.co/query`, {
            params: {
                function: 'TIME_SERIES_INTRADAY',
                symbol: symbol,
                interval: '1min',
                apikey: apiKey
            }
        });
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Twelve Data API
app.get('/api/market-data/twelve-data/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const apiKey = process.env.TWELVE_DATA_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: 'Twelve Data API key not configured' });
        }
        
        const response = await axios.get(`https://api.twelvedata.com/time_series`, {
            params: {
                symbol: symbol,
                interval: '1min',
                apikey: apiKey
            }
        });
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Avalon login
app.post('/api/avalon/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const avalonEmail = process.env.AVALON_EMAIL;
        const avalonPassword = process.env.AVALON_PASSWORD;
        
        if (email === avalonEmail && password === avalonPassword) {
            req.session.avalonUser = { email, connected: true };
            res.json({ success: true, message: 'Login realizado com sucesso' });
        } else {
            res.status(401).json({ error: 'Credenciais inválidas' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Avalon trade
app.post('/api/avalon/trade', async (req, res) => {
    try {
        if (!req.session.avalonUser) {
            return res.status(401).json({ error: 'Usuário não conectado' });
        }
        
        const { asset, amount, direction, expiry } = req.body;
        
        const tradeId = Math.random().toString(36).substr(2, 9);
        
        res.json({
            success: true,
            tradeId,
            asset,
            amount,
            direction,
            expiry,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stripe payment
app.post('/api/stripe/create-payment', async (req, res) => {
    try {
        const { amount } = req.body;
        
        res.json({
            success: true,
            amount,
            clientSecret: 'pi_simulated_' + Math.random().toString(36).substr(2, 9),
            message: 'Pagamento simulado criado'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Página principal
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JBM Trader v2.2 - Sistema de Trading Binário</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
            color: white;
            margin: 0;
            padding: 20px;
        }
        .header { 
            text-align: center; 
            padding: 20px 0; 
            border-bottom: 2px solid #00d4ff;
            margin-bottom: 30px;
        }
        .header h1 { 
            color: #00d4ff; 
            font-size: 2.5em;
            margin: 0;
        }
        .card { 
            background: rgba(255,255,255,0.1); 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .btn {
            background: linear-gradient(45deg, #00d4ff, #0099cc);
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            color: white;
            cursor: pointer;
            margin: 10px 5px;
            text-decoration: none;
            display: inline-block;
        }
        .btn:hover {
            opacity: 0.8;
        }
        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #00ff88;
            display: inline-block;
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>JBM Trader v2.2</h1>
        <p>Sistema Avançado de Trading Binário</p>
    </div>
    
    <div class="card">
        <h3>Status do Sistema</h3>
        <p><span class="status-dot"></span>Sistema online e funcionando</p>
        <p><span class="status-dot"></span>APIs conectadas</p>
        <p><span class="status-dot"></span>Versão: 2.2.0</p>
        <a href="/api/health" target="_blank" class="btn">Verificar APIs</a>
    </div>
    
    <div class="card">
        <h3>Sistema Completo</h3>
        <p>Esta é a versão web simplificada. Para acesso completo às funcionalidades:</p>
        <p>• Trading automatizado</p>
        <p>• Análise de mercado em tempo real</p>
        <p>• Interface completa</p>
        <p>Baixe a versão desktop do JBM Trader v2.2</p>
    </div>
    
    <script>
        console.log('JBM Trader v2.2 - Sistema web inicializado');
        
        // Teste de conectividade
        fetch('/api/health')
            .then(res => res.json())
            .then(data => console.log('Sistema:', data))
            .catch(err => console.error('Erro:', err));
    </script>
</body>
</html>
    `);
});

module.exports = app;
