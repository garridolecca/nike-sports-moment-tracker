## 2024-05-17 - Focus State Clipping in Overflow Containers
**Learning:** When adding focus-visible outlines to interactive elements (like custom ticker cards) within `overflow: hidden` containers, the default outer outline can get clipped, rendering the focus state invisible to keyboard users.
**Action:** Apply `outline-offset: -2px` (or similar negative value) along with a high-contrast brand color (e.g., Volt `#ccff00`) to pull the focus ring inside the element's bounding box and ensure it remains visible.
