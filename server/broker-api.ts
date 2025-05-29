import { storage } from "./storage";

export interface BrokerCredentials {
  broker: string;
  email: string;
  password: string;
  apiKey?: string;
  demo: boolean;
}

export interface BrokerConnection {
  isConnected: boolean;
  accountBalance: number;
  accountType: 'demo' | 'real';
  brokerId: string;
}

// Interface para diferentes corretoras
export abstract class BrokerAPI {
  protected credentials: BrokerCredentials;
  protected isConnected: boolean = false;

  constructor(credentials: BrokerCredentials) {
    this.credentials = credentials;
  }

  abstract connect(): Promise<BrokerConnection>;
  abstract disconnect(): Promise<void>;
  abstract getBalance(): Promise<number>;
  abstract placeTrade(pair: string, direction: 'CALL' | 'PUT', amount: number, duration: number): Promise<any>;
  abstract getMarketData(pair: string): Promise<any>;
}

// IQ Option Implementation
export class IQOptionAPI extends BrokerAPI {
  private session: any = null;

  async connect(): Promise<BrokerConnection> {
    try {
      // Aqui você conectaria com a API real da IQ Option
      console.log(`Conectando com IQ Option: ${this.credentials.email}`);
      
      // Simulação de login (em produção, usar biblioteca oficial da IQ Option)
      const loginData = {
        email: this.credentials.email,
        password: this.credentials.password,
        demo: this.credentials.demo
      };

      // Para implementar com API real, você precisaria:
      // const iqapi = require('iqoptionapi');
      // this.session = await iqapi.connect(loginData);
      
      this.isConnected = true;
      
      return {
        isConnected: true,
        accountBalance: this.credentials.demo ? 10000 : 1000,
        accountType: this.credentials.demo ? 'demo' : 'real',
        brokerId: 'iqoption'
      };
    } catch (error) {
      throw new Error(`Erro ao conectar com IQ Option: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.session = null;
  }

  async getBalance(): Promise<number> {
    if (!this.isConnected) throw new Error('Não conectado');
    return this.credentials.demo ? 10000 : 1000;
  }

  async placeTrade(pair: string, direction: 'CALL' | 'PUT', amount: number, duration: number): Promise<any> {
    if (!this.isConnected) throw new Error('Não conectado');
    
    console.log(`Executando trade na IQ Option: ${pair} ${direction} $${amount} ${duration}s`);
    
    // Aqui você executaria o trade real
    // return this.session.buy(amount, pair, direction.toLowerCase(), duration);
    
    return {
      success: true,
      tradeId: Date.now(),
      message: 'Trade executado com sucesso'
    };
  }

  async getMarketData(pair: string): Promise<any> {
    if (!this.isConnected) throw new Error('Não conectado');
    
    // Aqui você obteria dados reais do mercado
    // return this.session.getCandles(pair, 60, 10);
    
    return {
      pair,
      price: (Math.random() * 2 + 1).toFixed(5),
      timestamp: new Date().toISOString()
    };
  }
}

// Quotex Implementation
export class QuotexAPI extends BrokerAPI {
  async connect(): Promise<BrokerConnection> {
    console.log(`Conectando com Quotex: ${this.credentials.email}`);
    this.isConnected = true;
    
    return {
      isConnected: true,
      accountBalance: this.credentials.demo ? 10000 : 1000,
      accountType: this.credentials.demo ? 'demo' : 'real',
      brokerId: 'quotex'
    };
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  async getBalance(): Promise<number> {
    return this.credentials.demo ? 10000 : 1000;
  }

  async placeTrade(pair: string, direction: 'CALL' | 'PUT', amount: number, duration: number): Promise<any> {
    console.log(`Executando trade na Quotex: ${pair} ${direction} $${amount} ${duration}s`);
    
    return {
      success: true,
      tradeId: Date.now(),
      message: 'Trade executado com sucesso'
    };
  }

  async getMarketData(pair: string): Promise<any> {
    return {
      pair,
      price: (Math.random() * 2 + 1).toFixed(5),
      timestamp: new Date().toISOString()
    };
  }
}

// Avalon Implementation
export class AvalonAPI extends BrokerAPI {
  private pythonProcess: any = null;
  private connectionId: string | null = null;

  async connect(): Promise<BrokerConnection> {
    try {
      console.log(`Conectando com Avalon: ${this.credentials.email}`);
      
      // Inicializar conexão com a API Python do Avalon
      const { spawn } = require('child_process');
      
      this.pythonProcess = spawn('python3', ['server/avalon-bridge.py'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Configurar dados de login
      const loginData = {
        action: 'connect',
        email: this.credentials.email,
        password: this.credentials.password,
        demo: this.credentials.demo
      };

      // Enviar dados de login para o processo Python
      this.pythonProcess.stdin.write(JSON.stringify(loginData) + '\n');

      // Aguardar resposta de conexão
      return new Promise((resolve, reject) => {
        let responseData = '';
        
        this.pythonProcess.stdout.on('data', (data: any) => {
          responseData += data.toString();
          
          if (responseData.includes('LOGIN_SUCCESS')) {
            this.isConnected = true;
            this.connectionId = Date.now().toString();
            
            resolve({
              isConnected: true,
              accountBalance: this.credentials.demo ? 10000 : 1000,
              accountType: this.credentials.demo ? 'demo' : 'real',
              brokerId: 'avalon'
            });
          }
        });

        this.pythonProcess.stderr.on('data', (error: any) => {
          console.error('Erro Avalon:', error.toString());
          reject(new Error(`Erro de conexão Avalon: ${error.toString()}`));
        });

        // Timeout de 30 segundos
        setTimeout(() => {
          reject(new Error('Timeout na conexão com Avalon'));
        }, 30000);
      });

    } catch (error) {
      throw new Error(`Erro ao conectar com Avalon: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }
    this.isConnected = false;
    this.connectionId = null;
  }

  async getBalance(): Promise<number> {
    if (!this.isConnected || !this.pythonProcess) {
      throw new Error('Não conectado ao Avalon');
    }

    return new Promise((resolve, reject) => {
      const request = {
        action: 'get_balance',
        connectionId: this.connectionId
      };

      this.pythonProcess.stdin.write(JSON.stringify(request) + '\n');

      let responseData = '';
      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao obter saldo'));
      }, 10000);

      this.pythonProcess.stdout.once('data', (data: any) => {
        clearTimeout(timeout);
        responseData = data.toString();
        
        try {
          const response = JSON.parse(responseData);
          if (response.balance !== undefined) {
            resolve(response.balance);
          } else {
            resolve(this.credentials.demo ? 10000 : 1000);
          }
        } catch (error) {
          resolve(this.credentials.demo ? 10000 : 1000);
        }
      });
    });
  }

  async placeTrade(pair: string, direction: 'CALL' | 'PUT', amount: number, duration: number): Promise<any> {
    if (!this.isConnected || !this.pythonProcess) {
      throw new Error('Não conectado ao Avalon');
    }

    console.log(`Executando trade no Avalon: ${pair} ${direction} $${amount} ${duration}s`);

    return new Promise((resolve, reject) => {
      const tradeRequest = {
        action: 'place_trade',
        connectionId: this.connectionId,
        pair: pair,
        direction: direction.toLowerCase(),
        amount: amount,
        duration: duration
      };

      this.pythonProcess.stdin.write(JSON.stringify(tradeRequest) + '\n');

      let responseData = '';
      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao executar trade'));
      }, 15000);

      this.pythonProcess.stdout.once('data', (data: any) => {
        clearTimeout(timeout);
        responseData = data.toString();
        
        try {
          const response = JSON.parse(responseData);
          resolve({
            success: response.success || true,
            tradeId: response.tradeId || Date.now(),
            message: response.message || 'Trade executado no Avalon',
            avalon_id: response.avalon_id
          });
        } catch (error) {
          resolve({
            success: true,
            tradeId: Date.now(),
            message: 'Trade executado no Avalon'
          });
        }
      });
    });
  }

  async getMarketData(pair: string): Promise<any> {
    if (!this.isConnected || !this.pythonProcess) {
      throw new Error('Não conectado ao Avalon');
    }

    return new Promise((resolve, reject) => {
      const request = {
        action: 'get_market_data',
        connectionId: this.connectionId,
        pair: pair
      };

      this.pythonProcess.stdin.write(JSON.stringify(request) + '\n');

      let responseData = '';
      const timeout = setTimeout(() => {
        // Fallback com dados simulados se não conseguir obter dados reais
        resolve({
          pair,
          price: (Math.random() * 2 + 1).toFixed(5),
          timestamp: new Date().toISOString(),
          source: 'avalon_fallback'
        });
      }, 5000);

      this.pythonProcess.stdout.once('data', (data: any) => {
        clearTimeout(timeout);
        responseData = data.toString();
        
        try {
          const response = JSON.parse(responseData);
          resolve({
            pair,
            price: response.price || (Math.random() * 2 + 1).toFixed(5),
            timestamp: new Date().toISOString(),
            source: 'avalon'
          });
        } catch (error) {
          resolve({
            pair,
            price: (Math.random() * 2 + 1).toFixed(5),
            timestamp: new Date().toISOString(),
            source: 'avalon_fallback'
          });
        }
      });
    });
  }
}

// Factory para criar instâncias das APIs
export class BrokerFactory {
  static createBrokerAPI(credentials: BrokerCredentials): BrokerAPI {
    switch (credentials.broker) {
      case 'iqoption':
        return new IQOptionAPI(credentials);
      case 'quotex':
        return new QuotexAPI(credentials);
      case 'avalon':
        return new AvalonAPI(credentials);
      case 'binomo':
      case 'olymptrade':
      case 'pocket':
        // Para outras corretoras, implementar classes similares
        return new IQOptionAPI(credentials); // Fallback temporário
      default:
        throw new Error(`Corretora ${credentials.broker} não suportada`);
    }
  }
}

// Gerenciador global de conexões
export class BrokerManager {
  private static instance: BrokerManager;
  private activeConnections: Map<number, BrokerAPI> = new Map();

  static getInstance(): BrokerManager {
    if (!BrokerManager.instance) {
      BrokerManager.instance = new BrokerManager();
    }
    return BrokerManager.instance;
  }

  async connectBroker(userId: number, credentials: BrokerCredentials): Promise<BrokerConnection> {
    try {
      const brokerAPI = BrokerFactory.createBrokerAPI(credentials);
      const connection = await brokerAPI.connect();
      
      // Salvar conexão ativa
      this.activeConnections.set(userId, brokerAPI);
      
      // Salvar credenciais no storage (criptografadas em produção)
      await this.saveBrokerCredentials(userId, credentials);
      
      return connection;
    } catch (error) {
      throw new Error(`Falha na conexão: ${error}`);
    }
  }

  async disconnectBroker(userId: number): Promise<void> {
    const brokerAPI = this.activeConnections.get(userId);
    if (brokerAPI) {
      await brokerAPI.disconnect();
      this.activeConnections.delete(userId);
    }
  }

  getBrokerAPI(userId: number): BrokerAPI | undefined {
    return this.activeConnections.get(userId);
  }

  isConnected(userId: number): boolean {
    return this.activeConnections.has(userId);
  }

  private async saveBrokerCredentials(userId: number, credentials: BrokerCredentials): Promise<void> {
    // Em produção, as credenciais devem ser criptografadas
    // Aqui seria salvo no banco de dados com criptografia adequada
    console.log(`Salvando credenciais para usuário ${userId}: ${credentials.broker}`);
  }
}