#!/bin/bash
echo "🚀 Instalando JBM Trader..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 20+ primeiro."
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Verificar se tudo foi instalado
if [ $? -eq 0 ]; then
    echo "✅ JBM Trader instalado com sucesso!"
    echo "🎯 Execute 'npm run dev' para iniciar"
    echo "🌐 Acesse http://localhost:5000"
else
    echo "❌ Erro na instalação"
    exit 1
fi
