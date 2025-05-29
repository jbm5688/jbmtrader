import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, Globe, Key, ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface BrokerConfig {
  broker: string;
  email: string;
  password: string;
  apiKey?: string;
  demo: boolean;
}

interface BrokerSetupProps {
  onComplete: (config: BrokerConfig) => void;
}

export default function BrokerSetup({ onComplete }: BrokerSetupProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<BrokerConfig>({
    broker: "",
    email: "",
    password: "",
    apiKey: "",
    demo: true
  });

  // Mutation para testar conexão com a corretora
  const testConnectionMutation = useMutation({
    mutationFn: async (brokerConfig: BrokerConfig) => {
      const response = await apiRequest('POST', '/api/broker/connect', brokerConfig);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Conexão Estabelecida!",
        description: `Conectado com sucesso à ${config.broker}`,
      });
      onComplete(config);
    },
    onError: (error: any) => {
      toast({
        title: "Erro de Conexão",
        description: error.message || "Verifique suas credenciais",
        variant: "destructive",
      });
    }
  });

  const handleConnect = () => {
    if (!config.broker || !config.email || !config.password) {
      toast({
        title: "Campos Obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    testConnectionMutation.mutate(config);
  };

  const brokers = [
    { value: "iqoption", label: "IQ Option", needsApi: false },
    { value: "quotex", label: "Quotex", needsApi: false },
    { value: "avalon", label: "Avalon", needsApi: false },
    { value: "binomo", label: "Binomo", needsApi: false },
    { value: "olymptrade", label: "Olymp Trade", needsApi: false },
    { value: "pocket", label: "Pocket Option", needsApi: false },
    { value: "deriv", label: "Deriv", needsApi: true },
    { value: "binary", label: "Binary.com", needsApi: true }
  ];

  const selectedBroker = brokers.find(b => b.value === config.broker);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-[#1E293B] border-[#334155]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Globe className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Configuração da Corretora
          </CardTitle>
          <p className="text-gray-400">
            Configure sua conexão com a corretora para trading automatizado
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Seleção da Corretora */}
          <div className="space-y-2">
            <Label htmlFor="broker" className="text-sm font-medium">
              Corretora
            </Label>
            <Select value={config.broker} onValueChange={(value) => 
              setConfig(prev => ({ ...prev, broker: value }))
            }>
              <SelectTrigger className="bg-[#334155] border-gray-600">
                <SelectValue placeholder="Selecione sua corretora" />
              </SelectTrigger>
              <SelectContent className="bg-[#1E293B] border-[#334155]">
                {brokers.map((broker) => (
                  <SelectItem key={broker.value} value={broker.value}>
                    {broker.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email da Conta
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={config.email}
              onChange={(e) => setConfig(prev => ({ ...prev, email: e.target.value }))}
              className="bg-[#334155] border-gray-600"
            />
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Senha da Conta
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={config.password}
              onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
              className="bg-[#334155] border-gray-600"
            />
          </div>

          {/* API Key (se necessário) */}
          {selectedBroker?.needsApi && (
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-sm font-medium flex items-center">
                <Key className="w-4 h-4 mr-2" />
                API Key
              </Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Sua API Key"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                className="bg-[#334155] border-gray-600"
              />
              <p className="text-xs text-gray-400">
                Encontre sua API Key nas configurações da sua conta
              </p>
            </div>
          )}

          {/* Modo Demo/Real */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de Conta</Label>
            <Select 
              value={config.demo ? "demo" : "real"} 
              onValueChange={(value) => 
                setConfig(prev => ({ ...prev, demo: value === "demo" }))
              }
            >
              <SelectTrigger className="bg-[#334155] border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1E293B] border-[#334155]">
                <SelectItem value="demo">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-yellow-400" />
                    Conta Demo (Recomendado)
                  </div>
                </SelectItem>
                <SelectItem value="real">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-red-400" />
                    Conta Real
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {!config.demo && (
              <p className="text-xs text-yellow-400 flex items-center">
                <Shield className="w-3 h-3 mr-1" />
                Atenção: Você está usando dinheiro real
              </p>
            )}
          </div>

          {/* Botão de Conexão */}
          <Button 
            onClick={handleConnect}
            disabled={testConnectionMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            {testConnectionMutation.isPending ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Conectando...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                Conectar à Corretora
                <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            )}
          </Button>

          {/* Informações de Segurança */}
          <div className="bg-blue-400/10 border border-blue-400/20 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-400">Segurança</h4>
                <p className="text-xs text-gray-300 mt-1">
                  Suas credenciais são criptografadas e usadas apenas para conectar com a corretora. 
                  Recomendamos começar com uma conta demo.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}