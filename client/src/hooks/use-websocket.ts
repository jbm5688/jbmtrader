import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface MarketData {
  id: number;
  pair: string;
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: number;
}

interface Trade {
  id: number;
  userId: number;
  pair: string;
  direction: string;
  entryAmount: string;
  timeframe: number;
  entryPrice?: string;
  exitPrice?: string;
  result?: string;
  payout?: string;
  isActive: boolean;
  isMartingale: boolean;
  parentTradeId?: number;
  entryTime: string;
  exitTime?: string;
}

interface Signal {
  id: number;
  pair: string;
  direction: string;
  strength: number;
  indicators: string;
  timestamp: string;
}

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
}

export function useWebSocket(userId: number) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  const connect = () => {
    try {
      setConnectionStatus('connecting');
      
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        console.log('WebSocket connected');
        
        // Authenticate with user ID
        ws.send(JSON.stringify({ type: 'auth', userId }));
        
        toast({
          title: "Connected",
          description: "Real-time market data connection established.",
        });
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connected':
              console.log('WebSocket authentication successful');
              break;
              
            case 'marketData':
              if (message.data) {
                setMarketData(prev => {
                  const newData = [...prev, message.data];
                  // Keep only last 100 data points per pair
                  const dataMap = new Map<string, MarketData[]>();
                  
                  newData.forEach(item => {
                    if (!dataMap.has(item.pair)) {
                      dataMap.set(item.pair, []);
                    }
                    dataMap.get(item.pair)!.push(item);
                  });
                  
                  // Keep only last 100 entries per pair
                  dataMap.forEach((items, pair) => {
                    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                    dataMap.set(pair, items.slice(0, 100));
                  });
                  
                  return Array.from(dataMap.values()).flat();
                });
              }
              break;
              
            case 'newTrade':
              if (message.data && message.data.userId === userId) {
                setTrades(prev => [message.data, ...prev]);
                toast({
                  title: "New Trade",
                  description: `${message.data.direction} trade opened for ${message.data.pair}`,
                });
              }
              break;
              
            case 'tradeUpdate':
              if (message.data && message.data.userId === userId) {
                setTrades(prev => prev.map(trade => 
                  trade.id === message.data.id ? message.data : trade
                ));
                
                if (message.data.result) {
                  toast({
                    title: `Trade ${message.data.result}`,
                    description: `${message.data.pair} ${message.data.direction} - ${
                      message.data.result === 'WIN' ? '+' : '-'
                    }$${message.data.result === 'WIN' ? message.data.payout : message.data.entryAmount}`,
                    variant: message.data.result === 'WIN' ? 'default' : 'destructive',
                  });
                }
              }
              break;
              
            case 'newSignal':
              if (message.data) {
                setSignals(prev => [message.data, ...prev.slice(0, 19)]); // Keep last 20 signals
                
                if (message.data.strength >= 75) {
                  toast({
                    title: "Strong Signal",
                    description: `${message.data.pair} ${message.data.direction} - ${message.data.strength}% strength`,
                  });
                }
              }
              break;
              
            case 'settingsUpdate':
              toast({
                title: "Settings Updated",
                description: "Bot configuration has been synchronized.",
              });
              break;
              
            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        setConnectionStatus('disconnected');
        wsRef.current = null;
        
        console.log('WebSocket disconnected:', event.code, event.reason);
        
        if (event.code !== 1000) { // Not a normal closure
          toast({
            title: "Connection Lost",
            description: "Attempting to reconnect...",
            variant: "destructive",
          });
          
          // Attempt to reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
        
        toast({
          title: "Connection Error",
          description: "Failed to connect to market data feed.",
          variant: "destructive",
        });
      };

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setConnectionStatus('disconnected');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setConnectionStatus('disconnected');
  };

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, []);

  return {
    connectionStatus,
    marketData,
    trades,
    signals,
    sendMessage,
    connect,
    disconnect,
  };
}
