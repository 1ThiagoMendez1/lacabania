@echo off
echo  Configurando inicio automatico del servicio de impresion...
echo.

:: Crear acceso directo en la carpeta Inicio de Windows
set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT=%STARTUP%\LaCabana-Impresion.lnk
set TARGET=%~dp0iniciar.bat

:: Crear el acceso directo usando PowerShell
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = '%TARGET%'; $s.WorkingDirectory = '%~dp0'; $s.WindowStyle = 1; $s.Description = 'Servicio de Impresion La Cabana POS'; $s.Save()"

if exist "%SHORTCUT%" (
    echo  LISTO: El servicio iniciara automaticamente con Windows.
    echo  Acceso directo creado en: %SHORTCUT%
) else (
    echo  ERROR: No se pudo crear el acceso directo.
    echo  Hazlo manualmente: agrega un acceso directo de iniciar.bat
    echo  en la carpeta: %STARTUP%
)
echo.
pause
