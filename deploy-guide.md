# Guia de Deployment - JBM Trader para jbm-enterprize.com

## Preparação para Hospedagem

### 1. Estrutura de Arquivos Criada
- `Dockerfile` - Container da aplicação
- `docker-compose.yml` - Orquestração completa
- `nginx.conf` - Proxy reverso e SSL
- `.env.production` - Variáveis de ambiente

### 2. Configuração no Painel DNS Locaweb

#### A. Configurar DNS
No painel https://painel-dns.locaweb.com.br/jbm-enterprize.com:
```
Tipo A: @ -> IP_DO_SERVIDOR
Tipo A: www -> IP_DO_SERVIDOR
```

#### B. Certificado SSL
Configurar certificado SSL para:
- jbm-enterprize.com
- www.jbm-enterprize.com

### 3. Deploy no Servidor

#### Passo 1: Preparar Servidor
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Passo 2: Upload dos Arquivos
```bash
# Fazer upload de todos os arquivos do projeto para /var/www/jbm-trader/
```

#### Passo 3: Configurar Variáveis
```bash
# Editar .env.production com dados reais:
nano .env.production

# Configurar:
- DATABASE_URL com dados do PostgreSQL
- SESSION_SECRET (gerar chave segura)
- Certificados SSL nos caminhos corretos
```

#### Passo 4: Iniciar Aplicação
```bash
cd /var/www/jbm-trader/
docker-compose up -d
```

### 4. Verificações Pós-Deploy

#### A. Status dos Serviços
```bash
docker-compose ps
docker-compose logs jbm-trader
```

#### B. Teste das URLs
- https://jbm-enterprize.com (deve redirecionar para HTTPS)
- https://www.jbm-enterprize.com

#### C. Funcionalidades
- Sistema de cadastro
- Três opções de licença
- Pay-per-Gain funcional

### 5. Monitoramento

#### Logs da Aplicação
```bash
docker-compose logs -f jbm-trader
```

#### Health Check
```bash
curl -k https://jbm-enterprize.com/api/health
```

### 6. Manutenção

#### Backup do Banco
```bash
docker-compose exec postgres pg_dump -U jbmuser jbmtrader > backup_$(date +%Y%m%d).sql
```

#### Atualização
```bash
git pull origin main
docker-compose build
docker-compose up -d
```

### 7. Pay-per-Gain em Produção

O sistema automaticamente:
- Monitora todas as operações
- Calcula 0,5% apenas em GAINs
- Processa PIX para Chave do JBMTrader
- Mantém histórico detalhado

### 8. Troubleshooting

#### Se não carregar:
1. Verificar DNS propagation
2. Checar certificado SSL
3. Revisar logs do nginx
4. Verificar firewall (portas 80, 443)

#### Se Pay-per-Gain não funcionar:
1. Verificar variável PIX_DESTINATION_EMAIL
2. Checar logs de transações
3. Validar conexão com banco