## 2026-02-28 - Keyboard Accessibility in ArcGIS Web Apps
**Learning:** Custom interactive UI elements like the `.ecard` ticker and the `#popup` overlay lack native keyboard focus (`tabindex="0"`) and visible focus states (`:focus-visible`), rendering the app entirely unusable for keyboard-only or screen reader users, despite the 3D map engine.
**Action:** Add `tabindex="0"`, `:focus-visible` outlines using the Volt brand color, and `keydown` (Enter/Space) event listeners to interactive custom divs. Manage focus explicitly when opening/closing overlays.
