@echo off
set /p commit_msg="Introduce el mensaje de commit (opcional): "
if "%commit_msg%"=="" set commit_msg="Actualizacion produccion"

echo [1/4] Compilando la aplicacion...
cmd /c npm run build

if not exist dist (
    echo ERROR: La carpeta dist no se ha generado correctamente.
    pause
    exit /b
)

echo [2/4] Preparando carpeta de distribucion...
type nul > dist\.nojekyll

echo [3/4] Inicializando repositorio temporal en dist...
cd dist
if exist .git rm -rf .git
git init
git add .
git commit -m "%commit_msg%"
git branch -M main
git remote add origin https://github.com/handbolmolins/canaldenuncies.git

echo [4/4] Subiendo a GitHub (rama main)...
git push -f origin main

cd ..
echo.
echo Proceso finalizado. La web deberia estar actualizada en:
echo https://handbolmolins.github.io/canaldenuncies/
echo.
echo NOTA: Este script reemplaza la rama main con los archivos compilados.
echo Tus archivos fuente (App.tsx, etc.) siguen seguros en tu ordenador.
pause
