@echo off
chcp 65001 >nul
title 雜誌排版伺服器

echo =========================================
echo    正在啟動本地排版伺服器...
echo =========================================

:: 強制請 npm 確認並安裝所有缺少的套件
echo [系統提示] 正在檢查並補齊環境套件，請稍候...
call npm install express puppeteer jszip >nul 2>&1

:: 在背景啟動伺服器
echo [系統提示] 正在啟動後端伺服器引擎...
start /b node server.js

:: 循環檢測伺服器是否已經準備就緒 (檢查 localhost:3000)
echo [系統提示] 正在等待伺服器就緒，請稍候...
:CHECK_SERVER
timeout /t 1 >nul
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% neq 0 (
    <nul set /p=". "
    goto CHECK_SERVER
)

echo.
echo [系統提示] 伺服器已成功運行！正在為您開啟編輯網頁...
timeout /t 1 >nul
start http://localhost:3000/index.html

echo =========================================
echo    伺服器運行中 (請勿關閉此視窗)
echo =========================================
pause