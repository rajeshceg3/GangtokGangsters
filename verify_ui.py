
from playwright.sync_api import sync_playwright
import time

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # --- Desktop Verification ---
        page_desktop = browser.new_page(viewport={'width': 1280, 'height': 800})
        page_desktop.goto("http://localhost:8080")

        # Wait for welcome overlay and click Explore
        page_desktop.wait_for_selector("#welcome-overlay")
        page_desktop.screenshot(path="/home/jules/verification/desktop_welcome.png")
        page_desktop.click("#explore-btn")

        # Wait for map
        time.sleep(2) # Animation wait

        # Hover over a marker
        marker = page_desktop.locator(".custom-marker-container").first
        marker.hover()
        time.sleep(0.5)

        # Click marker to open panel
        marker.click()
        time.sleep(1) # Wait for panel fly-in

        # Hover over zoom button for tooltip
        page_desktop.hover("#zoom-in")
        time.sleep(0.5)

        page_desktop.screenshot(path="/home/jules/verification/desktop_interaction.png")

        # --- Mobile Verification ---
        page_mobile = browser.new_page(viewport={'width': 375, 'height': 812}, is_mobile=True, has_touch=True)
        page_mobile.goto("http://localhost:8080")

        # Dismiss welcome
        page_mobile.click("#explore-btn")
        time.sleep(2)

        # Click marker
        page_mobile.locator(".custom-marker-container").first.click()
        time.sleep(1)

        page_mobile.screenshot(path="/home/jules/verification/mobile_interaction.png")

        browser.close()

if __name__ == "__main__":
    verify_ui()
