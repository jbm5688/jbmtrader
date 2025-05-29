# Dockerfile para JBM Trader
FROM node:20-alpine

# Instalar Python para o bridge do Avalon
RUN apk add --no-cache python3 py3-pip python3-dev build-base

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código da aplicação
COPY . .

# Build da aplicação
RUN npm run build

# Expor porta
EXPOSE 5000

# Variáveis de ambiente para produção
ENV NODE_ENV=production
ENV PORT=5000

# Comando para iniciar
CMD ["npm", "start"]