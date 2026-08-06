@echo off
title Configurar Inicio Automatico
color 0A
echo.
echo  =============================================================
echo   Configurando inicio automatico del servicio de impresion...
echo  =============================================================
echo.

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "WRAPPER=%STARTUP%\LaCabana-Impresion.bat"
set "TARGET_DIR=%~dp0"

:: Creamos un pequeno .bat en la carpeta de inicio de Windows
echo @echo off > "%WRAPPER%"
echo title Servicio de Impresion - Inicio Automatico >> "%WRAPPER%"
echo cd /d "%TARGET_DIR%" >> "%WRAPPER%"
echo call iniciar.bat >> "%WRAPPER%"

if exist "%WRAPPER%" (
    echo  LISTO: El servicio iniciara automaticamente con Windows.
    echo  - Se ha configurado correctamente el inicio automatico.
    echo.
    echo  NOTA: La proxima vez que enciendas el PC, veras que se abre
    echo  la ventana del servicio automaticamente. No la cierres.
) else (
    echo  ERROR: No se pudo registrar el servicio de forma automatica.
    echo  Asegurate de ejecutar este archivo de forma normal sin permisos especiales.
)
echo.

:: Limpiamos el registro de windows en caso de que haya quedado rastro del intento anterior
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "LaCabanaPrintService" /f >nul 2>&1
pause
