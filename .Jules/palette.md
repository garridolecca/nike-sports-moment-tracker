## 2026-05-22 - Ticker Keyboard Accessibility
**Learning:** Custom horizontal scroll containers (like tickers/carousels) are often inaccessible to keyboard users because items are not focusable and the container doesn't auto-scroll when an item receives focus.
**Action:** When building custom list components, always ensure:
1.  Items have `tabindex="0"` to be focusable.
2.  `keydown` handlers support 'Enter' and 'Space' for activation.
3.  A `focus` handler calls a scroll-to-center logic to ensure the focused item is visible.
4.  `:focus-visible` styles are high-contrast and clear.
