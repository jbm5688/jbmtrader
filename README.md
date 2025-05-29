# JBM Trader - Bot de Trading Automatizado

Sistema automatizado para trading de opções binárias com análise de tendências, detecção de confluências e estratégias inteligentes de entrada.

## 🚀 Características

- **Interface Moderna**: Interface React responsiva com tema escuro/claro
- **Trading Automatizado**: Bot inteligente com configurações personalizáveis
- **Análise de Mercado**: Indicadores técnicos e sinais em tempo real
- **Conexão com Corretoras**: Suporte para IQ Option, Quotex e outras
- **WebSocket**: Atualizações em tempo real de dados e trades
- **Gestão de Risco**: Controles avançados de gerenciamento de risco

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone https://github.com/jbm5688/jbmtrader.git
cd jbmtrader
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse o aplicativo em: `http://localhost:5000`

## 🏗️ Estrutura do Projeto

```
jbmtrader/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── hooks/          # Hooks customizados
│   │   ├── pages/          # Páginas da aplicação
│   │   └── lib/            # Utilitários
├── server/                 # Backend Express
│   ├── broker-api.ts       # APIs das corretoras
│   ├── routes.ts           # Rotas da API
│   ├── storage.ts          # Gerenciamento de dados
│   └── index.ts            # Servidor principal
├── shared/                 # Schemas compartilhados
└── electron/               # Aplicativo desktop
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Configurações do banco de dados (opcional)
DATABASE_URL=postgresql://...

# Configurações das corretoras
IQ_OPTION_API_URL=...
QUOTEX_API_URL=...
```

### Configuração das Corretoras

1. **IQ Option**: Configure suas credenciais de API
2. **Quotex**: Configure suas credenciais de acesso
3. **Modo Demo**: Recomendado para testes iniciais

## 🎮 Como Usar

1. **Dashboard**: Visualize estatísticas de performance e trades ativos
2. **Configurações**: Ajuste parâmetros do bot (valor inicial, timeframes, etc.)
3. **Análise de Mercado**: Acompanhe sinais e dados em tempo real
4. **Log de Trades**: Histórico completo de operações

## 📊 Funcionalidades Principais

### Bot de Trading
- Configuração de valor inicial
- Timeframes primário e secundário
- Multiplicador para Martingale
- Limite de perda diária
- Gerenciamento de risco automático

### Análise Técnica
- Dados de mercado em tempo real
- Geração de sinais automatizados
- Indicadores de força e direção
- Confluências de múltiplos indicadores

### Interface
- Dashboard com estatísticas em tempo real
- Gráficos interativos de trading
- Log detalhado de operações
- Controles de configuração intuitivos

## 🔄 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar em produção
npm start

# Verificação de tipos
npm run check

# Sincronizar banco de dados
npm run db:push
```

## 🖥️ Versão Desktop

O projeto inclui uma versão desktop usando Electron:

```bash
# Para Windows
npm run electron:build

# Para criar executável portátil
node criar-executavel.js
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## ⚠️ Aviso Legal

Este software é fornecido apenas para fins educacionais. O trading de opções binárias envolve riscos significativos. Use por sua conta e risco.

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- GitHub Issues: [https://github.com/jbm5688/jbmtrader/issues](https://github.com/jbm5688/jbmtrader/issues)
- Email: [seu-email@exemplo.com]

---

**Desenvolvido com ❤️ por JBM**