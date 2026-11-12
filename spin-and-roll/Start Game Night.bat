@echo off
chcp 65001 >nul
title Spin and Roll - GAME NIGHT (press Ctrl+C once to finish and save)
cd /d "%~dp0local"
node start.mjs
pause
