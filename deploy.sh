#!/bin/bash

# Script de Deploy JBM Trader para jbm-enterprize.com
echo "🚀 Iniciando deploy do JBM Trader..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instalando..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Instalando..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Parar serviços existentes
echo "🛑 Parando serviços existentes..."
docker-compose down

# Build da aplicação
echo "🔨 Fazendo build da aplicação..."
docker-compose build

# Iniciar banco de dados primeiro
echo "🗄️ Iniciando banco de dados..."
docker-compose up -d postgres

# Aguardar banco estar pronto
echo "⏳ Aguardando banco de dados..."
sleep 10

# Executar migrações
echo "📊 Executando migrações do banco..."
docker-compose run --rm jbm-trader npm run db:push

# Iniciar todos os serviços
echo "🚀 Iniciando todos os serviços..."
docker-compose up -d

# Verificar status
echo "✅ Verificando status dos serviços..."
docker-compose ps

# Aguardar aplicação estar pronta
echo "⏳ Aguardando aplicação..."
sleep 15

# Teste de conectividade
echo "🌐 Testando conectividade..."
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Aplicação está respondendo!"
else
    echo "❌ Aplicação não está respondendo. Verificando logs..."
    docker-compose logs jbm-trader
fi

echo "🎉 Deploy concluído!"
echo "📋 Para verificar logs: docker-compose logs -f jbm-trader"
echo "🔧 Para parar: docker-compose down"
echo "🌐 Acesse: https://jbm-enterprize.com"