## 2024-05-24 - Keyboard Accessible Event Cards
**Learning:** Custom interactive elements (like the ticker event cards `div.ecard`) need explicit `tabindex="0"` and `keydown` handlers (Enter/Space) to be accessible to keyboard users. Also, a clear visual focus state is essential for keyboard navigation.
**Action:** Add `tabindex="0"` and Enter/Space event listeners to all interactive `div` cards, and use Nike's Volt color (#ccff00) for `:focus-visible` outlines to ensure high visibility.
