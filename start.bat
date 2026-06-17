@echo off
title Kalle's Sudoku - Full Stack Launcher

echo Starting Kalle's Sudoku Full Stack...
echo.

echo [1/2] Starting Sinatra API Backend on port 4567...
start "Sudoku Backend" cmd /k "cd /d backend && bundle exec ruby app.rb"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Vite React Frontend on port 3000...
start "Sudoku Frontend" cmd /k "cd /d frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend:  http://localhost:4567
echo Frontend: http://localhost:3000
echo.
pause