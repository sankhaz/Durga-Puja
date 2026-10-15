# Agartala Puja Snap 🪔

A mobile-first, Snapchat Map-style web application centered on **Agartala, Tripura, India** for discovering, viewing, and uploading Durga Puja pandal stories in real-time.

---

## 🌟 Key Features

1. **Official Google Maps Engine with Custom Dark Theme:**
   - Centered on **Agartala (`23.8315° N, 91.2868° E`)**, default zoom level `14`.
   - Dark/night mode styling matching the Snapchat Map aesthetic (`#0a0a14` deep obsidian, glowing roads, hidden clutter/POI).
   - All standard Google chrome disabled (`disableDefaultUI: true`) for a clean mobile canvas.

2. **Mobile Viewport Optimization:**
   - `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">`
   - Fixed `100dvh` layout with zero horizontal overflow.
   - Smooth iOS safe-area padding and gesture support.

3. **Snapchat-Style Map UI Overlays:**
   - **Translucent Top Header:** Displays "Agartala Puja Snap", a pulsing live viewer counter badge, and a GPS recenter button.
   - **Custom Snap Pins:** Glowing circular avatar rings with saffron/gold gradients, pandal thumbnail imagery, drop-pin tail, radar pulse beacons, and emoji category badges.
   - **Full-Screen Vertical Story Modal:** 9:16 vertical view featuring full-screen photos, 5-second animated progress bar, uploader profile, interactive like counter, view count, and native share sheet trigger.
   - **Swipeable Bottom Sheet Drawer:** Swipe up/down or tap to expand the list of recent Agartala pandal posts with quick navigation to pins on the map.
   - **Floating Camera Action Button:** Floating button at the bottom center to upload photos on the go.

4. **Camera & GPS Location Attachment:**
   - Native device camera trigger using `capture="environment"`.
   - Gallery image selection support.
   - Automatic GPS coordinates fetching via `navigator.geolocation.getCurrentPosition()`.
   - Instant map pin insertion with animation and auto-pan.

---

## 🔑 Google Maps API Key Setup

To activate the live Google Maps satellite/street tiles:

1. Obtain an API key from the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis).
2. Enable the **Maps JavaScript API**.
3. In [index.html](file:///Users/shatadrusarkar/Documents/Web%20Apps/Durga-Puja/index.html), replace `YOUR_GOOGLE_MAPS_API_KEY`:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap" async defer></script>
   ```
4. In [src/App.tsx](file:///Users/shatadrusarkar/Documents/Web%20Apps/Durga-Puja/src/App.tsx), update `MAPS_API_KEY`:
   ```ts
   const MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'
   ```

> **Note:** The app includes an automatic fallback preview canvas so all interactive features (pins, story modal, camera upload, drawer, and live simulation) can be tested immediately even before setting up a paid Google Cloud key.
