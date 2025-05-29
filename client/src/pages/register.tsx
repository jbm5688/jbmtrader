import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Lock, CreditCard, CheckCircle, Shield, Star } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  licenseType: string;
}

interface LicenseOption {
  id: string;
  title: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  paymentMethods: string[];
}

export default function Register() {
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1: dados pessoais, 2: licença, 3: pagamento
  const [formData, setFormData] = useState<RegisterData>({
    email: "",
    password: "",
    fullName: "",
    licenseType: ""
  });

  const licenseOptions: LicenseOption[] = [
    {
      id: "definitiva",
      title: "Licença Definitiva",
      price: "R$ 299,99",
      period: "Pagamento único",
      description: "Acesso vitalício ao JBM Trader com todas as funcionalidades.",
      features: [
        "Uso indeterminado da licença",
        "Não pagará mais nada pelo uso",
        "Backup automático das atualizações",
        "Suporte técnico prioritário",
        "Acesso a todas as corretoras",
        "Estratégias avançadas de trading",
        "Relatórios detalhados"
      ],
      popular: true,
      paymentMethods: ["Cartão de Crédito", "PIX", "Boleto"]
    },
    {
      id: "mensal",
      title: "Licença Mensal",
      price: "R$ 29,99",
      period: "por mês",
      description: "Acesso mensal com garantia de 7 dias conforme legislação do consumidor.",
      features: [
        "Acesso completo por 30 dias",
        "7 dias de garantia",
        "Cancelamento a qualquer momento",
        "Suporte técnico",
        "Acesso a todas as corretoras",
        "Atualizações automáticas"
      ],
      paymentMethods: ["Cartão de Crédito", "PIX Programado"]
    },
    {
      id: "pay_per_gain",
      title: "Pay-per-Gain",
      price: "0,5%",
      period: "por operação ganha",
      description: "Pague apenas quando lucrar! Débito automático de 0,5% de cada GAIN via PIX.",
      features: [
        "Sem custo inicial - use gratuitamente",
        "Pague apenas quando ganhar",
        "0,5% de cada operação com GAIN",
        "Débito automático via PIX",
        "Não paga nada nos LOSS",
        "Acesso a todas as funcionalidades",
        "Relatórios de pagamentos detalhados"
      ],
      popular: false,
      paymentMethods: ["PIX Automático"]
    }
  ];

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest('POST', '/api/auth/register', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Cadastro Realizado!",
        description: "Sua conta foi criada com sucesso. Redirecionando para pagamento...",
      });
      // Redirecionar para pagamento ou dashboard
    },
    onError: (error: any) => {
      toast({
        title: "Erro no Cadastro",
        description: error.message || "Verifique os dados informados",
        variant: "destructive",
      });
    }
  });

  const handleStep1Submit = () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      toast({
        title: "Campos Obrigatórios",
        description: "Preencha todos os campos para continuar",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Senha Inválida",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setStep(2);
  };

  const handleLicenseSelect = (licenseType: string) => {
    setFormData(prev => ({ ...prev, licenseType }));
    setStep(3);
  };

  const handleFinalSubmit = () => {
    registerMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl bg-[#1E293B] border-[#334155]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">
            {step === 1 && "Criar Conta JBM Trader"}
            {step === 2 && "Escolha sua Licença"}
            {step === 3 && "Finalizar Cadastro"}
          </CardTitle>
          <p className="text-gray-400">
            {step === 1 && "Crie sua conta para começar a usar o bot de trading"}
            {step === 2 && "Selecione o plano que melhor se adequa às suas necessidades"}
            {step === 3 && "Confirme seus dados e complete o cadastro"}
          </p>
        </CardHeader>

        <CardContent>
          {/* Indicador de Progresso */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-600'}`}>
                <span className="text-sm font-medium">1</span>
              </div>
              <div className={`h-1 w-12 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-600'}`}>
                <span className="text-sm font-medium">2</span>
              </div>
              <div className={`h-1 w-12 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-600'}`}>
                <span className="text-sm font-medium">3</span>
              </div>
            </div>
          </div>

          {/* Etapa 1: Dados Pessoais */}
          {step === 1 && (
            <div className="max-w-md mx-auto space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Nome Completo
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="bg-[#334155] border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-[#334155] border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="bg-[#334155] border-gray-600"
                />
              </div>

              <Button 
                onClick={handleStep1Submit}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Continuar
              </Button>
            </div>
          )}

          {/* Etapa 2: Seleção de Licença */}
          {step === 2 && (
            <div className="grid md:grid-cols-2 gap-6">
              {licenseOptions.map((license) => (
                <Card 
                  key={license.id}
                  className={`relative bg-[#334155] border-2 cursor-pointer transition-all hover:border-blue-500 ${
                    license.popular ? 'border-blue-500' : 'border-gray-600'
                  }`}
                  onClick={() => handleLicenseSelect(license.id)}
                >
                  {license.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        Mais Popular
                      </div>
                    </div>
                  )}

                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{license.title}</CardTitle>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-blue-400">{license.price}</div>
                      <div className="text-sm text-gray-400">{license.period}</div>
                    </div>
                    <p className="text-sm text-gray-300">{license.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {license.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-600 pt-4">
                      <div className="text-sm text-gray-400 mb-2">Formas de Pagamento:</div>
                      <div className="flex flex-wrap gap-2">
                        {license.paymentMethods.map((method, index) => (
                          <span key={index} className="bg-[#1E293B] px-2 py-1 rounded text-xs">
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Selecionar {license.title}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Etapa 3: Confirmação */}
          {step === 3 && (
            <div className="max-w-md mx-auto space-y-6">
              <div className="bg-[#334155] p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Resumo do Cadastro</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nome:</span>
                    <span>{formData.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span>{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Licença:</span>
                    <span>{licenseOptions.find(l => l.id === formData.licenseType)?.title}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span className="text-blue-400">
                      {licenseOptions.find(l => l.id === formData.licenseType)?.price}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-400/10 border border-blue-400/20 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-400">Garantia e Segurança</h4>
                    <p className="text-xs text-gray-300 mt-1">
                      {formData.licenseType === 'mensal' 
                        ? "7 dias de garantia conforme legislação do consumidor. Cancele a qualquer momento."
                        : "Licença definitiva com backup automático e suporte vitalício."
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button 
                  onClick={handleFinalSubmit}
                  disabled={registerMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {registerMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Finalizar Cadastro
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}