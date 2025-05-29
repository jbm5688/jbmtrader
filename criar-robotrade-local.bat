@echo off
echo Criando JBM Trader em C:\ROBOTRADE\...

if not exist "C:\ROBOTRADE\" mkdir "C:\ROBOTRADE\"

echo Criando iniciar-trading-bot.bat...
echo @echo off > "C:\ROBOTRADE\iniciar-trading-bot.bat"
echo title JBM Trader - Bot de Trading >> "C:\ROBOTRADE\iniciar-trading-bot.bat"
echo echo ======================================== >> "C:\ROBOTRADE\iniciar-trading-bot.bat"
echo echo    JBM TRADER - BOT DE TRADING >> "C:\ROBOTRADE\iniciar-trading-bot.bat"
echo echo ======================================== >> "C:\ROBOTRADE\iniciar-trading-bot.bat"
echo echo. >> "C:\ROBOTRADE\iniciar-trading-bot.bat"
echo echo Instalando Node.js se necessario... >> "C:\ROBOTRADE\iniciar-trading-bot.bat"
echo npm install >> "C:\ROBOTRADE\iniciar-trading-bot.bat"
echo echo Iniciando servidor... >> "C:\ROBOTRADE\iniciar-trading-bot.bat"
echo node server.js >> "C:\ROBOTRADE\iniciar-trading-bot.bat"
echo pause >> "C:\ROBOTRADE\iniciar-trading-bot.bat"

echo Criando package.json...
echo { > "C:\ROBOTRADE\package.json"
echo   "name": "jbm-trader", >> "C:\ROBOTRADE\package.json"
echo   "version": "1.0.0", >> "C:\ROBOTRADE\package.json"
echo   "main": "server.js", >> "C:\ROBOTRADE\package.json"
echo   "dependencies": { >> "C:\ROBOTRADE\package.json"
echo     "express": "^4.18.0" >> "C:\ROBOTRADE\package.json"
echo   } >> "C:\ROBOTRADE\package.json"
echo } >> "C:\ROBOTRADE\package.json"

echo Criando server.js...
echo const express = require('express'^); > "C:\ROBOTRADE\server.js"
echo const app = express('^); >> "C:\ROBOTRADE\server.js"
echo app.get('/', (req, res^) =^> { >> "C:\ROBOTRADE\server.js"
echo   res.send('JBM Trader funcionando!'^); >> "C:\ROBOTRADE\server.js"
echo }^); >> "C:\ROBOTRADE\server.js"
echo app.listen(5000, ('^) =^> console.log('JBM Trader em http://localhost:5000'^)^); >> "C:\ROBOTRADE\server.js"

echo.
echo ✓ JBM Trader criado em C:\ROBOTRADE\
echo ✓ Execute o arquivo iniciar-trading-bot.bat na pasta
echo.
pause