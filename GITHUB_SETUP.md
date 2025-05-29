# Como Enviar o JBM Trader para o GitHub

## Passo a Passo para Upload

### 1. Preparação Inicial

Se você ainda não tem o Git instalado, baixe em: https://git-scm.com/

### 2. Configurar o Git (primeira vez)

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

### 3. Inicializar o Repositório Local

No terminal, dentro da pasta do projeto:

```bash
# Inicializar o repositório
git init

# Adicionar todos os arquivos
git add .

# Fazer o primeiro commit
git commit -m "Inicial: Bot de Trading JBM Trader com React e Express"
```

### 4. Conectar com o GitHub

```bash
# Adicionar o repositório remoto
git remote add origin https://github.com/jbm5688/jbmtrader.git

# Verificar se foi adicionado corretamente
git remote -v
```

### 5. Enviar os Arquivos

```bash
# Fazer push para o GitHub
git push -u origin main
```

Se der erro, tente:
```bash
git push -u origin master
```

### 6. Atualizações Futuras

Para futuras atualizações:

```bash
# Adicionar mudanças
git add .

# Commit com mensagem descritiva
git commit -m "Descrição das mudanças"

# Enviar para o GitHub
git push
```

## Estrutura dos Arquivos que Serão Enviados

✅ **Arquivos Inclusos:**
- `README.md` - Documentação completa
- `LICENSE` - Licença MIT
- `package.json` - Dependências do projeto
- `client/` - Frontend React
- `server/` - Backend Express
- `shared/` - Schemas compartilhados
- `electron/` - Versão desktop

❌ **Arquivos Excluídos (via .gitignore):**
- `node_modules/` - Dependências (muito pesado)
- `executaveis/` - Arquivos compilados
- `*.rar`, `*.zip` - Arquivos compactados
- Arquivos temporários e cache

## Comandos Úteis

```bash
# Ver status dos arquivos
git status

# Ver histórico de commits
git log --oneline

# Criar nova branch
git checkout -b nova-feature

# Mudar entre branches
git checkout main
```

## Troubleshooting

### Erro de Autenticação
Se der erro de autenticação, você pode:

1. **Token de Acesso (Recomendado):**
   - Vá em GitHub > Settings > Developer settings > Personal access tokens
   - Gere um novo token
   - Use o token como senha

2. **SSH (Alternativo):**
   ```bash
   git remote set-url origin git@github.com:jbm5688/jbmtrader.git
   ```

### Repositório Já Existe
Se o repositório já tem conteúdo:

```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

## Próximos Passos

Após o upload:

1. ✅ Configure a descrição do repositório no GitHub
2. ✅ Adicione tags relevantes (trading, bot, react, express)
3. ✅ Configure GitHub Pages se quiser demo online
4. ✅ Adicione GitHub Actions para CI/CD (opcional)

---

🚀 **Seu bot de trading estará online e disponível para a comunidade!**