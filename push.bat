@echo off
set /p commit_msg="Introduce el mensaje de commit (opcional): "
if "%commit_msg%"=="" set commit_msg="Actualizacion source code"

echo [1/3] Añadiendo cambios...
git add .

echo [2/3] Creando commit...
git commit -m "%commit_msg%"

echo [3/3] Subiendo a GitHub (rama main)...
git push origin main

echo.
echo Proceso finalizado. El codigo fuente se ha subido a GitHub.
echo La web se actualizara automaticamente en unos minutos mediante GitHub Actions:
echo https://handbolmolins.github.io/canaldenuncies/
echo.
pause

