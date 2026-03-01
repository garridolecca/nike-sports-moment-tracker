## 2024-05-20 - Custom UI Elements Need Explicit Keyboard Support
**Learning:** The event cards (`.ecard`) were implemented as `<div>` elements with click handlers but lacked native keyboard accessibility. Keyboard users could not tab to them or activate them with Enter/Space.
**Action:** Added `tabindex="0"` and explicit `keydown` listeners for Enter/Space to ensure custom interactive elements are fully usable by keyboard users. Also applied `#ccff00` focus-visible styles per design guidelines.
