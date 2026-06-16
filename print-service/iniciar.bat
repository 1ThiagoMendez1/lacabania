@echo off
title Servicio de Impresion - La Cabana POS
color 0A

echo.
echo  ==========================================
echo   Servicio de Impresion - La Cabana POS
echo  ==========================================
echo.

:: Verificar que existe el archivo .env
if not exist "%~dp0.env" (
    echo  ERROR: No se encontro el archivo .env
    echo  Copia .env.example como .env y rellena los valores.
    echo.
    pause
    exit /b 1
)

:: Instalar dependencias si no existen
if not exist "%~dp0node_modules" (
    echo  Instalando dependencias (solo la primera vez)...
    cd /d "%~dp0"
    npm install
    echo.
)

:: Iniciar el servicio
cd /d "%~dp0"
echo  Iniciando servicio...
echo.
node index.js

echo.
echo  El servicio se detuvo. Presiona cualquier tecla para cerrar.
pause >nul
