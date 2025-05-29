import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertTradeSchema, 
  insertMarketDataSchema, 
  insertBotSettingsSchema,
  insertSignalSchema,
  insertUserSchema,
  insertLicenseSchema,
  type Trade
} from "@shared/schema";
import { BrokerManager, type BrokerCredentials } from "./broker-api";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

interface WebSocketConnection {
  ws: WebSocket;
  userId?: number;
}

const connections: Set<WebSocketConnection> = new Set();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    const connection: WebSocketConnection = { ws };
    connections.add(connection);

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'auth' && data.userId) {
          connection.userId = data.userId;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      connections.delete(connection);
    });

    // Send initial connection success
    ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
  });

  // Broadcast function for real-time updates
  function broadcast(message: any, userId?: number) {
    const messageStr = JSON.stringify(message);
    connections.forEach((connection) => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        if (!userId || connection.userId === userId) {
          connection.ws.send(messageStr);
        }
      }
    });
  }

  // Market data simulation (in production, this would connect to real market data)
  const basePrice = { 'EUR/USD': 1.0850, 'GBP/USD': 1.2650, 'USD/JPY': 149.50, 'USD/CHF': 0.8950 };
  
  function generateMarketData() {
    const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF'];
    
    pairs.forEach(async (pair) => {
      try {
        const currentPrice = basePrice[pair as keyof typeof basePrice];
        const volatility = 0.0020;
        const change = (Math.random() - 0.5) * volatility;
        
        const open = currentPrice + change;
        const close = open + (Math.random() - 0.5) * volatility;
        const high = Math.max(open, close) + Math.random() * volatility * 0.3;
        const low = Math.min(open, close) - Math.random() * volatility * 0.3;
        
        const marketData = await storage.addMarketData({
          pair,
          open: open.toFixed(5),
          high: high.toFixed(5),
          low: low.toFixed(5),
          close: close.toFixed(5),
          volume: Math.floor(Math.random() * 100000) + 50000,
        });

        // Update base price for next iteration
        basePrice[pair as keyof typeof basePrice] = close;

        // Broadcast market data update
        broadcast({
          type: 'marketData',
          data: marketData
        });
      } catch (error) {
        console.error('Error generating market data for', pair, error);
      }
    });
  }

  // Start market data simulation
  setInterval(generateMarketData, 2000);

  // API Routes

  // Authentication routes
  
  // Register new user
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email já está em uso' });
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      // Create license if specified
      if (userData.licenseType) {
        let licensePrice = '0.00';
        let licenseStatus = 'inactive';
        
        if (userData.licenseType === 'definitiva') {
          licensePrice = '299.99';
        } else if (userData.licenseType === 'mensal') {
          licensePrice = '29.99';
        } else if (userData.licenseType === 'pay_per_gain') {
          licensePrice = '0.00'; // No upfront cost
          licenseStatus = 'active'; // Immediately active for pay-per-gain
        }
        
        await storage.createLicense({
          userId: user.id,
          type: userData.licenseType,
          status: licenseStatus,
          price: licensePrice,
          currency: 'BRL',
          paymentMethod: userData.licenseType === 'pay_per_gain' ? 'pix_auto' : undefined
        });
      }

      // Update user license status
      const finalLicenseStatus = userData.licenseType === 'pay_per_gain' ? 'active' : 'inactive';
      await storage.updateUser(user.id, {
        licenseType: userData.licenseType,
        licenseStatus: finalLicenseStatus
      });

      // Remove password from response
      const { password, ...userResponse } = user;
      
      broadcast({
        type: 'newUserRegistered',
        data: { userId: user.id, licenseType: userData.licenseType }
      });

      res.status(201).json({
        success: true,
        user: userResponse,
        message: 'Usuário registrado com sucesso'
      });

    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Erro no registro' 
      });
    }
  });

  // Login user
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Check license status
      const license = await storage.getUserLicense(user.id);
      
      // Remove password from response
      const { password: _, ...userResponse } = user;

      res.json({
        success: true,
        user: userResponse,
        license: license,
        message: 'Login realizado com sucesso'
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Get user profile
  app.get('/api/auth/profile/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const license = await storage.getUserLicense(userId);
      
      // Remove password from response
      const { password, ...userResponse } = user;

      res.json({
        user: userResponse,
        license: license
      });

    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  });

  // Activate license (after payment)
  app.post('/api/licenses/activate/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { paymentMethod, stripePaymentIntentId } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Find inactive license for user
      const licenses = Array.from((storage as any).licenses.values());
      const userLicense = licenses.find((l: any) => 
        l.userId === userId && l.status === 'inactive'
      );

      if (!userLicense) {
        return res.status(404).json({ error: 'Licença não encontrada' });
      }

      // Activate license
      const activatedAt = new Date();
      const expiresAt = userLicense.type === 'definitiva' 
        ? null 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await storage.updateLicense(userLicense.id, {
        status: 'active',
        paymentMethod,
        stripePaymentIntentId,
        activatedAt,
        expiresAt
      });

      // Update user license status
      await storage.updateUser(userId, {
        licenseStatus: 'active',
        licenseExpiresAt: expiresAt
      });

      broadcast({
        type: 'licenseActivated',
        data: { userId, licenseType: userLicense.type }
      }, userId);

      res.json({
        success: true,
        message: 'Licença ativada com sucesso',
        expiresAt
      });

    } catch (error) {
      console.error('Erro ao ativar licença:', error);
      res.status(500).json({ error: 'Erro ao ativar licença' });
    }
  });

  // Get license status
  app.get('/api/licenses/status/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const license = await storage.getUserLicense(userId);
      
      if (!license) {
        return res.json({ 
          hasLicense: false, 
          status: 'inactive' 
        });
      }

      const now = new Date();
      const isExpired = license.expiresAt && license.expiresAt < now;

      res.json({
        hasLicense: true,
        license: license,
        status: isExpired ? 'expired' : license.status,
        isExpired: isExpired,
        daysRemaining: license.expiresAt 
          ? Math.max(0, Math.ceil((license.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : null
      });

    } catch (error) {
      res.status(500).json({ error: 'Erro ao verificar licença' });
    }
  });

  // Get user gain payments history
  app.get('/api/gain-payments/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const payments = await storage.getUserGainPayments(userId);
      
      // Calculate totals
      const totalPaid = payments
        .filter(p => p.paymentStatus === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.feeAmount), 0);
      
      const totalPending = payments
        .filter(p => p.paymentStatus === 'pending')
        .reduce((sum, p) => sum + parseFloat(p.feeAmount), 0);

      res.json({
        payments: payments.sort((a, b) => {
          const dateA = a.createdAt ? a.createdAt.getTime() : 0;
          const dateB = b.createdAt ? b.createdAt.getTime() : 0;
          return dateB - dateA;
        }),
        summary: {
          totalPaid: totalPaid.toFixed(2),
          totalPending: totalPending.toFixed(2),
          totalPayments: payments.length,
          pixDestination: 'jbm5688@hotmail.com'
        }
      });

    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar histórico de pagamentos' });
    }
  });

  // Process pending PIX payments (manual trigger for admin)
  app.post('/api/gain-payments/process-pix', async (req, res) => {
    try {
      const pendingPayments = await storage.getPendingGainPayments();
      let processedCount = 0;

      for (const payment of pendingPayments) {
        // Simulate PIX processing (in production, integrate with real PIX API)
        const pixTransactionId = `PIX${Date.now()}${payment.id}`;
        
        await storage.updateGainPayment(payment.id, {
          paymentStatus: 'completed',
          pixTransactionId: pixTransactionId,
          processedAt: new Date()
        });

        // Broadcast payment completion
        broadcast({
          type: 'payPerGainFeeProcessed',
          data: {
            userId: payment.userId,
            paymentId: payment.id,
            feeAmount: payment.feeAmount,
            pixTransactionId
          }
        }, payment.userId);

        processedCount++;
      }

      res.json({
        success: true,
        message: `${processedCount} pagamentos processados via PIX`,
        processedCount,
        pixDestination: 'jbm5688@hotmail.com'
      });

    } catch (error) {
      console.error('Erro ao processar pagamentos PIX:', error);
      res.status(500).json({ error: 'Erro ao processar pagamentos PIX' });
    }
  });

  // Get Pay-per-Gain statistics
  app.get('/api/gain-payments/stats', async (req, res) => {
    try {
      const allPayments = await storage.getPendingGainPayments();
      const completedPayments = Array.from((storage as any).gainPayments.values())
        .filter((p: any) => p.paymentStatus === 'completed');

      const totalRevenue = completedPayments
        .reduce((sum: number, p: any) => sum + parseFloat(p.feeAmount), 0);

      const pendingRevenue = allPayments
        .reduce((sum, p) => sum + parseFloat(p.feeAmount), 0);

      res.json({
        totalRevenue: totalRevenue.toFixed(2),
        pendingRevenue: pendingRevenue.toFixed(2),
        totalTransactions: completedPayments.length + allPayments.length,
        pendingTransactions: allPayments.length,
        pixDestination: 'jbm5688@hotmail.com',
        feePercentage: '0.5%'
      });

    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  });

  // Get bot settings
  app.get('/api/settings/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const settings = await storage.getBotSettings(userId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get settings' });
    }
  });

  // Update bot settings
  app.post('/api/settings/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const validatedSettings = insertBotSettingsSchema.parse(req.body);
      const settings = await storage.updateBotSettings(userId, validatedSettings);
      
      broadcast({
        type: 'settingsUpdate',
        data: settings
      }, userId);
      
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: 'Invalid settings data' });
    }
  });

  // Get active trades
  app.get('/api/trades/active/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const trades = await storage.getActiveTrades(userId);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get active trades' });
    }
  });

  // Get trade history
  app.get('/api/trades/history/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const trades = await storage.getTradeHistory(userId, limit);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get trade history' });
    }
  });

  // Create new trade
  app.post('/api/trades', async (req, res) => {
    try {
      const validatedTrade = insertTradeSchema.parse(req.body);
      const trade = await storage.createTrade(validatedTrade);
      
      broadcast({
        type: 'newTrade',
        data: trade
      }, trade.userId);
      
      res.json(trade);
    } catch (error) {
      res.status(400).json({ error: 'Invalid trade data' });
    }
  });

  // Update trade (for closing positions)
  app.put('/api/trades/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const trade = await storage.updateTrade(id, updates);
      
      if (!trade) {
        return res.status(404).json({ error: 'Trade not found' });
      }

      // Process Pay-per-Gain fee if trade is a WIN
      if (updates.result === 'WIN' && trade.payout) {
        await processPayPerGainFee(trade);
      }
      
      broadcast({
        type: 'tradeUpdate',
        data: trade
      }, trade.userId);
      
      res.json(trade);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update trade' });
    }
  });

  // Function to process Pay-per-Gain fee
  async function processPayPerGainFee(trade: Trade) {
    try {
      // Get user license
      const user = await storage.getUser(trade.userId);
      if (!user || user.licenseType !== 'pay_per_gain') {
        return; // Not a pay-per-gain user
      }

      const gainAmount = parseFloat(trade.payout || "0");
      const feePercentage = 0.5; // 0.5%
      const feeAmount = (gainAmount * feePercentage) / 100;

      // Create gain payment record
      await storage.createGainPayment({
        userId: trade.userId,
        tradeId: trade.id,
        gainAmount: gainAmount.toFixed(2),
        feePercentage: feePercentage.toFixed(3),
        feeAmount: feeAmount.toFixed(2),
        pixDestination: 'jbm5688@hotmail.com',
        paymentStatus: 'pending'
      });

      console.log(`Pay-per-Gain fee created: User ${trade.userId}, Trade ${trade.id}, Fee: R$ ${feeAmount.toFixed(2)}`);

      // Broadcast payment notification
      broadcast({
        type: 'payPerGainFeeCreated',
        data: {
          userId: trade.userId,
          tradeId: trade.id,
          gainAmount,
          feeAmount,
          pixDestination: 'jbm5688@hotmail.com'
        }
      }, trade.userId);

    } catch (error) {
      console.error('Error processing pay-per-gain fee:', error);
    }
  }

  // Get market data
  app.get('/api/market/:pair', async (req, res) => {
    try {
      const pair = req.params.pair;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const data = await storage.getMarketDataHistory(pair, limit);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get market data' });
    }
  });

  // Get latest market data
  app.get('/api/market/:pair/latest', async (req, res) => {
    try {
      const pair = req.params.pair;
      const data = await storage.getLatestMarketData(pair);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get latest market data' });
    }
  });

  // Get performance stats
  app.get('/api/performance/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const today = new Date();
      
      const [dailyPnL, winRate, activeTrades, tradeHistory] = await Promise.all([
        storage.getDailyPnL(userId, today),
        storage.getWinRate(userId),
        storage.getActiveTrades(userId),
        storage.getTradeHistory(userId, 100)
      ]);

      const todayTrades = tradeHistory.filter(trade => {
        const tradeDate = trade.entryTime ? new Date(trade.entryTime) : null;
        return tradeDate && tradeDate.toDateString() === today.toDateString();
      });

      const wins = todayTrades.filter(trade => trade.result === 'WIN').length;
      const losses = todayTrades.filter(trade => trade.result === 'LOSS').length;

      const performance = {
        dailyPnL,
        winRate,
        totalTrades: todayTrades.length,
        wins,
        losses,
        activeTrades: activeTrades.length,
        avgTrade: todayTrades.length > 0 ? dailyPnL / todayTrades.length : 0
      };

      res.json(performance);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get performance data' });
    }
  });

  // Create signal
  app.post('/api/signals', async (req, res) => {
    try {
      const validatedSignal = insertSignalSchema.parse(req.body);
      const signal = await storage.createSignal(validatedSignal);
      
      broadcast({
        type: 'newSignal',
        data: signal
      });
      
      res.json(signal);
    } catch (error) {
      res.status(400).json({ error: 'Invalid signal data' });
    }
  });

  // Get latest signals
  app.get('/api/signals/:pair', async (req, res) => {
    try {
      const pair = req.params.pair;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const signals = await storage.getLatestSignals(pair, limit);
      res.json(signals);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get signals' });
    }
  });

  // Rotas para conexão com corretoras
  const brokerManager = BrokerManager.getInstance();

  // Conectar à corretora
  app.post('/api/broker/connect', async (req, res) => {
    try {
      const credentials: BrokerCredentials = req.body;
      const userId = 1; // Mock user ID - em produção viria da sessão
      
      const connection = await brokerManager.connectBroker(userId, credentials);
      
      broadcast({
        type: 'brokerConnected',
        data: {
          broker: credentials.broker,
          accountType: credentials.demo ? 'DEMO' : 'REAL',
          balance: connection.accountBalance
        }
      }, userId);
      
      res.json({
        success: true,
        connection,
        message: `Conectado com sucesso à ${credentials.broker} (${credentials.demo ? 'DEMO' : 'REAL'})`
      });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro de conexão' 
      });
    }
  });

  // Desconectar da corretora
  app.post('/api/broker/disconnect', async (req, res) => {
    try {
      const userId = 1; // Mock user ID
      await brokerManager.disconnectBroker(userId);
      
      broadcast({
        type: 'brokerDisconnected',
        data: {}
      }, userId);
      
      res.json({ success: true, message: 'Desconectado da corretora' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao desconectar' });
    }
  });

  // Status da conexão com corretora
  app.get('/api/broker/status/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const isConnected = brokerManager.isConnected(userId);
      const brokerAPI = brokerManager.getBrokerAPI(userId);
      
      if (isConnected && brokerAPI) {
        const balance = await brokerAPI.getBalance();
        res.json({
          connected: true,
          balance,
          broker: 'connected'
        });
      } else {
        res.json({
          connected: false,
          balance: 0,
          broker: null
        });
      }
    } catch (error) {
      res.status(500).json({ error: 'Erro ao verificar status' });
    }
  });

  // Executar trade real na corretora
  app.post('/api/broker/trade', async (req, res) => {
    try {
      const { pair, direction, amount, duration } = req.body;
      const userId = 1; // Mock user ID
      
      const brokerAPI = brokerManager.getBrokerAPI(userId);
      if (!brokerAPI) {
        return res.status(400).json({ error: 'Não conectado à corretora' });
      }
      
      const result = await brokerAPI.placeTrade(pair, direction, amount, duration);
      
      broadcast({
        type: 'brokerTradeExecuted',
        data: {
          pair,
          direction,
          amount,
          duration,
          result
        }
      }, userId);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao executar trade' });
    }
  });

  return httpServer;
}
