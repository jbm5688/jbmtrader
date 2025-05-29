import fs from 'fs';
import path from 'path';

// Script simples para criar um executável
console.log('🚀 Criando executável do Trading Bot...');

// Criar estrutura do executável
const execDir = 'executaveis/trading-bot-portable';

if (!fs.existsSync(execDir)) {
  fs.mkdirSync(execDir, { recursive: true });
}

// Copiar arquivos essenciais
const filesToCopy = [
  'package.json',
  'electron/main.js'
];

filesToCopy.forEach(file => {
  if (fs.existsSync(file)) {
    const destPath = path.join(execDir, path.basename(file));
    fs.copyFileSync(file, destPath);
    console.log(`✓ Copiado: ${file}`);
  }
});

// Criar script de inicialização
const startScript = `@echo off
echo Iniciando Trading Bot...
npm install
npm run dev
pause
`;

fs.writeFileSync(path.join(execDir, 'iniciar-trading-bot.bat'), startScript);

// Criar arquivo de instruções
const readme = `# Trading Bot - Sistema de Trading Automatizado

## Como usar:

1. Clique duas vezes em "iniciar-trading-bot.bat"
2. Aguarde a instalação das dependências
3. O sistema será aberto no seu navegador
4. Acesse: http://localhost:5000

## Funcionalidades:
- ✅ Análise técnica automática
- ✅ Detecção de sinais de trading
- ✅ Interface de controle do bot
- ✅ Histórico de trades
- ✅ Estatísticas de performance

## Configuração:
- Configure suas credenciais do broker na tela inicial
- Ajuste os parâmetros de risco nas configurações
- Ative o bot quando estiver pronto para começar

Versão: 1.0.0
`;

fs.writeFileSync(path.join(execDir, 'LEIA-ME.txt'), readme);

console.log('✅ Executável criado com sucesso!');
console.log(`📁 Localização: ${execDir}`);
console.log('');
console.log('Para usar:');
console.log('1. Abra a pasta "executaveis/trading-bot-portable"');
console.log('2. Clique em "iniciar-trading-bot.bat"');
console.log('3. Aguarde o sistema iniciar');