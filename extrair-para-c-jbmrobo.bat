@echo off
echo Extraindo jbmtrader.rar para c:\JBMROBO\...

:: Criar pasta se não existir
if not exist "c:\JBMROBO\" mkdir "c:\JBMROBO\"

:: Extrair usando WinRAR (se instalado)
if exist "%ProgramFiles%\WinRAR\winrar.exe" (
    "%ProgramFiles%\WinRAR\winrar.exe" x "jbmtrader.rar" "c:\JBMROBO\"
    goto sucesso
)

:: Extrair usando WinRAR (32-bit)
if exist "%ProgramFiles(x86)%\WinRAR\winrar.exe" (
    "%ProgramFiles(x86)%\WinRAR\winrar.exe" x "jbmtrader.rar" "c:\JBMROBO\"
    goto sucesso
)

:: Extrair usando 7-Zip (se instalado)
if exist "%ProgramFiles%\7-Zip\7z.exe" (
    "%ProgramFiles%\7-Zip\7z.exe" x "jbmtrader.rar" -o"c:\JBMROBO\"
    goto sucesso
)

:: Extrair usando 7-Zip (32-bit)
if exist "%ProgramFiles(x86)%\7-Zip\7z.exe" (
    "%ProgramFiles(x86)%\7-Zip\7z.exe" x "jbmtrader.rar" -o"c:\JBMROBO\"
    goto sucesso
)

echo Erro: WinRAR ou 7-Zip não encontrado.
echo Por favor, instale um deles ou extraia manualmente.
pause
exit

:sucesso
echo Sucesso! JBM Trader extraído para c:\JBMROBO\
echo Você pode executar o trading bot a partir dessa pasta.
pause