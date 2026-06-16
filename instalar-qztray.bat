@echo off
echo ============================================
echo   La Cabana POS - Setup QZ Tray
echo ============================================
echo.

:: Crear carpeta de certificados de QZ Tray
set CERT_DIR=%USERPROFILE%\.qz\certificate
if not exist "%CERT_DIR%" mkdir "%CERT_DIR%"

:: Descargar el certificado desde la app
echo Descargando certificado...
powershell -Command "Invoke-WebRequest -Uri 'https://lacabania.mivra.com.co/qz-certificate.pem' -OutFile '%CERT_DIR%\digital-certificate.txt'"

if exist "%CERT_DIR%\digital-certificate.txt" (
    echo.
    echo Certificado instalado correctamente.
    echo.
    echo IMPORTANTE: Reinicia QZ Tray si ya estaba abierto.
    echo Luego abre la app, acepta UNA vez el popup y marca "Remember this decision".
) else (
    echo ERROR: No se pudo descargar el certificado.
    echo Asegurate de tener conexion a internet.
)

echo.
pause
