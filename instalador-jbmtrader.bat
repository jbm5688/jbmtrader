@echo off
echo JBMSOLUCOES - Instalador JBMTRADER
echo =====================================

echo Criando diretorio C:\JBMTRADER...
mkdir "C:\JBMTRADER" 2>nul

echo Copiando arquivos para C:\JBMTRADER...
copy "credentials.json" "C:\JBMTRADER\" >nul 2>&1
copy "config.json" "C:\JBMTRADER\" >nul 2>&1
copy "jbm-trader.html" "C:\JBMTRADER\" >nul 2>&1

echo.
echo JBMTRADER instalado com sucesso!
echo Diretorio: C:\JBMTRADER
echo.
echo Para executar: Abra C:\JBMTRADER\jbm-trader.html
echo.
pause