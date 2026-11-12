@echo off
chcp 65001 >nul
title Spin and Roll - import a backup into the laptop game
cd /d "%~dp0local"
node import.mjs %*
pause
