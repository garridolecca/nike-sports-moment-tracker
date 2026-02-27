import time
from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the app (hosted via python http.server on port 8080)
            page.goto("http://localhost:8080/index.html")

            # Wait for the splash screen to disappear
            # The splash screen has a transition of 0.6s and a hard fallback of 700ms in hideSplash
            # But there is also a 12s fallback. We should wait for #splash to have class 'hidden' or display:none
            try:
                page.wait_for_selector("#splash.hidden", timeout=15000)
            except:
                print("Splash screen might not have hidden via class, checking display style or proceeding...")

            # Give it a moment for the initial rendering and any transitions
            time.sleep(2)

            # Take a full page screenshot
            page.screenshot(path="verification_screenshot.png", full_page=True)
            print("Screenshot captured: verification_screenshot.png")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
