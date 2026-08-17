@echo off
chcp 65001 >nul
title 雜誌排版伺服器

echo =========================================
echo    正在啟動本地排版伺服器...
echo =========================================

:: 強制請 npm 確認並安裝所有缺少的套件 (如果裝過了它會自動快速跳過)
echo [系統提示] 正在檢查並補齊環境套件，這可能需要 1~2 分鐘，請稍候...
call npm install express puppeteer jszip

echo [系統提示] 環境確認完畢，準備開啟瀏覽器...
timeout /t 2 >nul
start http://localhost:3000/index.html

:: 啟動伺服器
node server.js

pause