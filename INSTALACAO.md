# JBM TRADER - Instruções de Instalação

## Requisitos
- Node.js 20 ou superior
- PostgreSQL (opcional, usa banco em memória por padrão)

## Instalação Rápida

1. Extrair todos os arquivos
2. Executar: npm install
3. Executar: npm run dev
4. Acessar: http://localhost:5000

## Configuração de Brokers

### IQ Option
- Email e senha da conta

### Quotex  
- Email e senha da conta

### Avalon
- Email e senha da conta
- Requer Python instalado

## Tipos de Licença

1. **Licença Permanente**: R$ 299,99
2. **Assinatura Mensal**: R$ 29,99/mês  
3. **Pagamento por Ganho**: 0,5% dos lucros

## Suporte
Email: jbm5688@hotmail.com
Site: jbm-enterprize.com

## Scripts Disponíveis

- `npm run dev` - Modo desenvolvimento
- `npm run build` - Compilar para produção
- `npm run start` - Executar produção
- `node criar-executavel.js` - Criar executável standalone
- `node criar-app-local.js` - Criar app local

## Arquivos Importantes

- `jbm-trader.html` - Versão standalone completa
- `server/` - Backend do sistema
- `client/` - Interface React
- `attached_assets/` - APIs dos brokers
