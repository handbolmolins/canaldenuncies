@echo off
set /p commit_msg="Introduce el mensaje de commit: "
if "%commit_msg%"=="" set commit_msg="Actualizacion automatica"
git add .
git commit -m "%commit_msg%"
git push origin main
pause
