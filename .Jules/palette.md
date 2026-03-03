## 2024-05-20 - Keyboard Navigation on Custom UI Elements
**Learning:** Custom interactive elements (like `.ecard` list items) in this app lack native keyboard support and focus states, hindering accessibility for keyboard users.
**Action:** Always add `tabindex="0"` and `keydown` event listeners (Enter/Space) to non-button interactive elements, and ensure a `:focus-visible` outline using the brand's Volt color (`#ccff00`) is present.
