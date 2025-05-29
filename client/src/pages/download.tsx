import { Download } from "lucide-react";

export default function DownloadPage() {
  const handleDownload = () => {
    // Criar um link de download para o arquivo
    const link = document.createElement('a');
    link.href = '/jbmtrader.rar';
    link.download = 'jbmtrader.rar';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <Download className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            JBMTrader - Sistema de Trading
          </h1>
          <p className="text-gray-600">
            Baixe o arquivo executável do sistema de trading automatizado
          </p>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">📦 O que está incluído:</h3>
          <ul className="text-sm text-blue-700 text-left space-y-1">
            <li>✅ Sistema completo de trading</li>
            <li>✅ Interface de controle do bot</li>
            <li>✅ Análise técnica automática</li>
            <li>✅ Histórico de trades</li>
            <li>✅ Estatísticas de performance</li>
          </ul>
        </div>

        <button
          onClick={handleDownload}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Baixar jbmtrader.rar
        </button>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">🚀 Como usar:</h3>
          <ol className="text-sm text-gray-600 text-left space-y-1">
            <li>1. Baixe o arquivo jbmtrader.rar</li>
            <li>2. Descompacte no C:\</li>
            <li>3. Vá para C:\jbmtrader\</li>
            <li>4. Clique em "iniciar-trading-bot.bat"</li>
            <li>5. Aguarde abrir no navegador</li>
          </ol>
        </div>
      </div>
    </div>
  );
}