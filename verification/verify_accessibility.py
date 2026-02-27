
from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app
        page.goto("http://localhost:8080")

        # Wait for the ticker to be populated (cards are added dynamically)
        page.wait_for_selector(".ecard")

        # Click on the body to ensure focus is on the document
        page.mouse.click(0, 0)

        # Press Tab multiple times to focus on the first card
        # The first focusable elements might be in the header or the map attribution
        # Let's target the ticker specifically or tab until we hit a card

        # We can also just focus the first card directly via JS to simulate tabbing to it,
        # but true keyboard navigation is better.
        # However, since there are map controls (zoom etc) which might capture focus,
        # let's try to focus the first card explicitly using page.focus() to simulate it being reached,
        # and then tab to the next one to verify the scroll behavior.

        cards = page.locator(".ecard")
        count = cards.count()
        print(f"Found {count} cards")

        if count > 5:
            # Focus the 5th card to see if it scrolls into view
            # The 5th card should be somewhat to the right
            target_card = cards.nth(4)
            target_card.focus()

            # Wait a bit for the scroll animation/behavior
            time.sleep(1)

            # Take a screenshot showing the focus ring and the scroll position
            page.screenshot(path="verification/focus_card_5.png")
            print("Screenshot taken: verification/focus_card_5.png")

            # Check if the card has the focus-visible style
            # Note: :focus-visible might not apply if we use .focus() method programmatically
            # without prior keyboard interaction in some browsers, but Playwright usually handles this.
            # To be sure, we can try to press Tab from the previous element.

            # Let's try to press Tab from the 4th card to the 5th card
            cards.nth(3).focus()
            page.keyboard.press("Tab")
            time.sleep(1)
            page.screenshot(path="verification/tab_focus_card_5.png")
            print("Screenshot taken: verification/tab_focus_card_5.png")

        browser.close()

if __name__ == "__main__":
    run()
