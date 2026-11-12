@echo off
chcp 65001 >nul
title Spin and Roll - one-time setup for game night on this laptop
cd /d "%~dp0"
where node >nul 2>nul || (echo. & echo Node.js is not installed. Get the LTS version from https://nodejs.org then run this again. & pause & exit /b 1)
where java >nul 2>nul || (echo. & echo Java is not installed. Get "Temurin 21 (LTS)" from https://adoptium.net then run this again. & pause & exit /b 1)
echo Installing the app's packages...
call npm install
cd local
echo Installing the game server's packages...
call npm install
echo Downloading the database (one time, about 60 MB)...
call node node_modules\firebase-tools\lib\bin\firebase.js setup:emulators:firestore
echo.
echo All set. Next: put your backup file in the local\import folder and run "Import Game.bat".
pause
