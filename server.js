const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const JSZip = require('jszip');

const app = express();
// 放大請求容量限制，確保大量的 base64 圖片資料能順利傳輸
app.use(express.json({ limit: '100mb' }));
app.use(express.static(__dirname));

let browserInstance = null;

async function getBrowser() {
    if (!browserInstance) {
        browserInstance = await puppeteer.launch({
            headless: true, // 保持無頭模式在背景安靜執行
            defaultViewport: { 
                width: 1920, 
                height: 1080,
                // 【關鍵升級】開啟 Retina 視網膜等級 2倍高畫質！
                deviceScaleFactor: 2 
            }
        });
    }
    return browserInstance;
}

app.post('/api/export', async (req, res) => {
    try {
        const { pagesData, masterText, globalBgColor } = req.body;
        console.log('📸 收到匯出請求，正在啟動真實瀏覽器內核進行高畫質原生渲染...');

        const browser = await getBrowser();
        const page = await browser.newPage();
        
        // 載入本地伺服器的網頁
        await page.goto(`http://localhost:3000/index.html`, { waitUntil: 'networkidle0' });

        // 將目前前端編輯的即時狀態注入頁面
        await page.evaluate((data) => {
            window.loadProjectState(data);
        }, { pagesData, masterText, globalBgColor });

        await page.evaluate(async () => {
            await document.fonts.ready;
            const imgs = Array.from(document.querySelectorAll('img'));
            await Promise.all(imgs.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
            }));
        });

        await page.evaluate(() => {
            // 隱藏所有的 UI 控制按鈕與編輯虛線框
            document.querySelectorAll('.control-left, .control-right, .img-edit-overlay').forEach(el => el.style.display = 'none');
            
            // 【關鍵修復一】強制將所有圖片容器的灰色背景設為透明
            document.querySelectorAll('.img-container').forEach(el => el.style.backgroundColor = 'transparent');
            
            // 【關鍵修復二】加入「出血邊緣」(Bleed)，將圖片網格微微放大 0.2%，配合 overflow:hidden 完美切齊無白邊
            document.querySelectorAll('.layout-grid').forEach(el => el.style.transform = 'scale(1.002)');
            
            // 確保網頁沒有自帶的滾動條干擾截圖邊緣
            document.body.style.overflow = 'hidden';
        });

        const zip = new JSZip();

        // 🌟 新增：產生輕量化的排版設定檔 (去除龐大的圖片 base64 碼，只保留檔名與座標)
        const recordData = {
            version: "1.1",
            globalBgColor,
            masterText,
            pages: pagesData.map(p => {
                const cleanP = { ...p };
                if (cleanP.images) {
                    cleanP.images = cleanP.images.map(img => {
                        if (!img) return null;
                        return {
                            filename: img.filename,
                            scale: img.scale,
                            minScale: img.minScale,
                            x: img.x,
                            y: img.y,
                            watermark: img.watermark // 🌟 新增這行：把浮水印設定存入檔案
                        };
                    });
                }
                return cleanP;
            })
        };
        // 將設定檔寫入 ZIP 壓縮檔的根目錄
        zip.file("layout_settings.txt", JSON.stringify(recordData, null, 2));

        const landscapeFolder = zip.folder("Landscape (3-2)");
        const portraitFolder = zip.folder("Portrait (3-4)");

        // 1. 橫向封面
        const hCover = await page.$('.page.horizontal-cover');
        if (hCover) {
            // quality: 100 代表無損 JPG 壓縮，檔案大小大約可達 150kb 甚至更高！
            const buffer = await hCover.screenshot({ type: 'jpeg', quality: 95 });
            landscapeFolder.file('0_cover.jpg', buffer);
        }

        // 2. 直向封面
        const vCover = await page.$('.page.vertical-cover');
        if (vCover) {
            const buffer = await vCover.screenshot({ type: 'jpeg', quality: 95 });
            portraitFolder.file('0_cover.jpg', buffer);
        }

        // 3. 處理跨頁與拆分的單頁
        const spreads = await page.$$('.spread');
        let pIndex = 1;
        for (const spread of spreads) {
            // 截取跨頁全景
            const spreadBuffer = await spread.screenshot({ type: 'jpeg', quality: 95 });
            landscapeFolder.file(`page_${String(pIndex).padStart(2, '0')}.jpg`, spreadBuffer);

            // 處理左單頁 (先拔掉陰影再截圖)
            const leftPage = await spread.$('.page-left');
            if (leftPage) {
                await page.evaluate(el => {
                    el.dataset.origBorder = el.style.borderRight;
                    el.dataset.origShadow = el.style.boxShadow;
                    el.style.borderRight = 'none';
                    el.style.boxShadow = 'none';
                }, leftPage);

                const leftBuffer = await leftPage.screenshot({ type: 'jpeg', quality: 95 });
                portraitFolder.file(`page_${String(pIndex).padStart(2, '0')}_left.jpg`, leftBuffer);

                // 截完圖把陰影裝回去
                await page.evaluate(el => {
                    el.style.borderRight = el.dataset.origBorder;
                    el.style.boxShadow = el.dataset.origShadow;
                }, leftPage);
            }

            // 處理右單頁 (先拔掉陰影再截圖)
            const rightPage = await spread.$('.page-right');
            if (rightPage) {
                await page.evaluate(el => {
                    el.dataset.origShadow = el.style.boxShadow;
                    el.style.boxShadow = 'none';
                }, rightPage);

                const rightBuffer = await rightPage.screenshot({ type: 'jpeg', quality: 95 });
                portraitFolder.file(`page_${String(pIndex).padStart(2, '0')}_right.jpg`, rightBuffer);

                // 截完圖把陰影裝回去
                await page.evaluate(el => {
                    el.style.boxShadow = el.dataset.origShadow;
                }, rightPage);
            }
            pIndex++;
        }

        await page.close();

        const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=Magazine_Project.zip');
        res.send(zipContent);
        console.log('🎉 匯出與高畫質打包完成！檔案已傳送至前端下載。');
    } catch (err) {
        console.error('❌ 匯出失敗：', err);
        res.status(500).send(err.toString());
    }
});

app.listen(3000, () => {
    console.log('=========================================');
    console.log('🚀 雜誌排版工具伺服器已啟動: http://localhost:3000/index.html');
    console.log('=========================================');
});