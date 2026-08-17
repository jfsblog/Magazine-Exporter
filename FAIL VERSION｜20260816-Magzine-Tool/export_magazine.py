from playwright.sync_api import sync_playwright
import os
import zipfile
from pathlib import Path
import traceback

TARGET_URL = "http://localhost:8000/index.html"
OUTPUT_ZIP_NAME = "Magazine_Export.zip"

def run_export():
    print("🚀 启动 Playwright 浏览器...")
    browser = None
    try:
        # 把 headless 改为 False，这样你可以亲眼看到浏览器弹出来做动作
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False, args=['--disable-web-security'])
            context = browser.new_context(device_scale_factor=2)
            page = context.new_page()
            
            print(f"🌐 正在加载网页: {TARGET_URL}")
            page.goto(TARGET_URL)
            page.wait_for_load_state("networkidle")
            # 强制等待 1秒，确保网页上的各种 JS 和字体彻底排版完毕
            page.wait_for_timeout(1000)
            print("✅ 网页加载完成！正在寻找排版元素...")

            # 创建临时文件夹（如果失败，这里不会被删，方便你排查）
            temp_dir = Path("temp_export_png")
            temp_dir.mkdir(exist_ok=True)

            # ----- 辅助函数：检查元素是否存在 -----
            def take_screenshot(selector, name):
                element = page.locator(selector)
                count = element.count()
                if count == 0:
                    print(f"⚠️ 警告：没有找到元素 '{selector}'，跳过截图 {name}")
                    return
                if count > 1:
                    element = element.first # 如果找到多个，默认截取第一个
                element.screenshot(path=temp_dir / name, type="png")
                print(f"✅ 截图成功: {name}")

            # ----- 开始按顺序截图 -----
            take_screenshot('.page.horizontal-cover', 'Cover_Horizontal.png')
            take_screenshot('.page.vertical-cover', 'Cover_Vertical.png')

            # 截图所有标准跨页
            spreads = page.locator('.spread').all()
            if len(spreads) == 0:
                print("⚠️ 警告：没有找到任何 .spread (跨页) 元素，请检查网页结构。")
            
            for idx, spread in enumerate(spreads):
                index_num = idx + 1
                print(f"📸 正在处理第 {index_num} 个跨页...")
                spread.screenshot(path=temp_dir / f"Content_Spread_{index_num:02d}.png", type="png")
                
                left_page = spread.locator('.page-left')
                if left_page.count() > 0:
                    left_page.first.screenshot(path=temp_dir / f"Page_{index_num:02d}_Left.png", type="png")
                
                right_page = spread.locator('.page-right')
                if right_page.count() > 0:
                    right_page.first.screenshot(path=temp_dir / f"Page_{index_num:02d}_Right.png", type="png")

            print("📦 截图全部完成！正在打包成 ZIP 文件...")
            with zipfile.ZipFile(OUTPUT_ZIP_NAME, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for file in temp_dir.iterdir():
                    zipf.write(file, file.name)

            print(f"🎉 成功！ZIP已生成: {OUTPUT_ZIP_NAME}")

    except Exception as e:
        print("\n❌ ！！！脚本执行出现错误 ！！！")
        print("错误详情：", str(e))
        print("--- 错误堆栈追踪 ---")
        traceback.print_exc()
        print("-------------------")
        print("请根据上面的报错信息排查问题。")
    finally:
        if browser:
            print("关闭浏览器...")
            browser.close()

if __name__ == "__main__":
    run_export()