#!/usr/bin/env python3
"""
Bridge entre Node.js e API Avalon
Permite comunicação via stdin/stdout para integração com o sistema JBM Trader
"""

import sys
import json
import time
import logging
from typing import Optional, Dict, Any
import asyncio

# Importar a API Avalon
sys.path.append('../attached_assets')
try:
    from api import Avalonaapi
    from robo_avalon import login, compra, payout
    AVALON_AVAILABLE = True
except ImportError as e:
    AVALON_AVAILABLE = False
    logging.error(f"Erro ao importar API Avalon: {e}")

class AvalonBridge:
    def __init__(self):
        self.api: Optional[Avalonaapi] = None
        self.connected = False
        self.connection_id = None
        
        # Configurar logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    async def connect(self, email: str, password: str, demo: bool = True) -> Dict[str, Any]:
        """Conectar com a corretora Avalon"""
        try:
            if not AVALON_AVAILABLE:
                return {
                    "success": False,
                    "error": "API Avalon não disponível"
                }
            
            # Inicializar API Avalon
            self.api = Avalonaapi(email, password)
            
            # Realizar login
            login_result = self.api.connect()
            
            if login_result:
                self.connected = True
                self.connection_id = str(int(time.time()))
                
                # Obter saldo inicial
                balance = await self.get_balance()
                
                return {
                    "success": True,
                    "connection_id": self.connection_id,
                    "balance": balance,
                    "message": "LOGIN_SUCCESS",
                    "account_type": "DEMO" if demo else "REAL"
                }
            else:
                return {
                    "success": False,
                    "error": "Falha no login com Avalon"
                }
                
        except Exception as e:
            self.logger.error(f"Erro na conexão Avalon: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def disconnect(self) -> Dict[str, Any]:
        """Desconectar da corretora"""
        try:
            if self.api and self.connected:
                self.api.close()
            
            self.connected = False
            self.api = None
            self.connection_id = None
            
            return {
                "success": True,
                "message": "Desconectado com sucesso"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_balance(self) -> float:
        """Obter saldo da conta"""
        try:
            if not self.connected or not self.api:
                return 0.0
            
            # Usar a API Avalon para obter saldo real
            # Este método pode variar dependendo da implementação específica
            balances = self.api.get_balances()
            
            # Retornar o primeiro saldo disponível ou valor padrão
            if balances and len(balances) > 0:
                return float(balances[0].get('amount', 10000))
            
            return 10000.0  # Valor padrão para demo
            
        except Exception as e:
            self.logger.error(f"Erro ao obter saldo: {e}")
            return 10000.0
    
    async def place_trade(self, pair: str, direction: str, amount: float, duration: int) -> Dict[str, Any]:
        """Executar trade na corretora"""
        try:
            if not self.connected or not self.api:
                return {
                    "success": False,
                    "error": "Não conectado ao Avalon"
                }
            
            # Mapear direção para formato Avalon
            avalon_direction = "call" if direction.upper() == "CALL" else "put"
            
            # Executar trade usando a API Avalon
            # Adaptar conforme a implementação específica da API
            trade_result = compra(pair, amount, avalon_direction, duration, "digital")
            
            if trade_result:
                return {
                    "success": True,
                    "tradeId": int(time.time()),
                    "avalon_id": trade_result.get('id', None),
                    "message": f"Trade executado: {pair} {direction} ${amount}"
                }
            else:
                return {
                    "success": False,
                    "error": "Falha ao executar trade"
                }
                
        except Exception as e:
            self.logger.error(f"Erro ao executar trade: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_market_data(self, pair: str) -> Dict[str, Any]:
        """Obter dados de mercado"""
        try:
            if not self.connected or not self.api:
                return {
                    "success": False,
                    "error": "Não conectado ao Avalon"
                }
            
            # Usar API Avalon para obter dados reais de mercado
            # Este método pode variar dependendo da implementação
            candles = self.api.getcandles(pair, 60, 1)  # 1 minuto, 1 candle
            
            if candles and len(candles) > 0:
                latest_candle = candles[-1]
                return {
                    "success": True,
                    "pair": pair,
                    "price": latest_candle.get('close', 0),
                    "timestamp": time.time()
                }
            
            return {
                "success": False,
                "error": "Dados de mercado não disponíveis"
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao obter dados de mercado: {e}")
            return {
                "success": False,
                "error": str(e)
            }

async def main():
    """Loop principal para comunicação via stdin/stdout"""
    bridge = AvalonBridge()
    
    # Enviar confirmação de inicialização
    print(json.dumps({"status": "ready", "avalon_available": AVALON_AVAILABLE}))
    sys.stdout.flush()
    
    try:
        while True:
            # Ler comando do stdin
            line = sys.stdin.readline()
            if not line:
                break
            
            try:
                command = json.loads(line.strip())
                action = command.get('action')
                
                result = None
                
                if action == 'connect':
                    result = await bridge.connect(
                        command['email'],
                        command['password'],
                        command.get('demo', True)
                    )
                
                elif action == 'disconnect':
                    result = await bridge.disconnect()
                
                elif action == 'get_balance':
                    balance = await bridge.get_balance()
                    result = {"balance": balance}
                
                elif action == 'place_trade':
                    result = await bridge.place_trade(
                        command['pair'],
                        command['direction'],
                        command['amount'],
                        command['duration']
                    )
                
                elif action == 'get_market_data':
                    result = await bridge.get_market_data(command['pair'])
                
                else:
                    result = {"error": f"Ação não reconhecida: {action}"}
                
                # Enviar resultado
                print(json.dumps(result))
                sys.stdout.flush()
                
            except json.JSONDecodeError:
                print(json.dumps({"error": "JSON inválido"}))
                sys.stdout.flush()
            except Exception as e:
                print(json.dumps({"error": str(e)}))
                sys.stdout.flush()
                
    except KeyboardInterrupt:
        pass
    finally:
        await bridge.disconnect()

if __name__ == "__main__":
    asyncio.run(main())