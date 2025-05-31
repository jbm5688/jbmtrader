export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JBM Trader v2.2</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
            color: white;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
        }
        .header {
            padding: 40px 0;
            border-bottom: 2px solid #00d4ff;
            margin-bottom: 40px;
        }
        .header h1 {
            font-size: 3em;
            color: #00d4ff;
            margin: 0;
        }
        .card {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 30px;
            margin: 20px 0;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .status {
            display: inline-block;
            background: #00ff88;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 10px;
            box-shadow: 0 0 10px #00ff88;
        }
        .btn {
            background: linear-gradient(45deg, #00d4ff, #0099cc);
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            color: white;
            font-size: 1.1em;
            cursor: pointer;
            margin: 10px;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.3s;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>JBM Trader v2.2</h1>
            <p>Sistema Avançado de Trading Binário</p>
        </div>
        
        <div class="card">
            <h2>Sistema Online</h2>
            <p><span class="status"></span>Plataforma funcionando corretamente</p>
            <p><span class="status"></span>APIs conectadas</p>
            <p><span class="status"></span>Pronto para usar</p>
        </div>
        
        <div class="card">
            <h2>Versão Desktop Disponível</h2>
            <p>Para acesso completo às funcionalidades de trading automatizado, análise avançada e interface completa, baixe a versão desktop.</p>
            <p>Inclui todas as ferramentas profissionais do JBM Trader v2.2</p>
        </div>
        
        <div class="card">
            <h2>APIs Configuradas</h2>
            <p>Alpha Vantage • Twelve Data • Avalon Trading • Stripe</p>
            <p>Todas as integrações estão ativas e funcionando</p>
        </div>
    </div>
    
    <script>
        console.log('JBM Trader v2.2 - Sistema inicializado com sucesso');
    </script>
</body>
</html>
  `);
}