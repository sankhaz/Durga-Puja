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

## 🔑 Google Maps & Firebase Authentication Setup

### 1. Google Maps JavaScript API
1. Obtain an API key from the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis).
2. Enable the **Maps JavaScript API**.
3. In [index.html](file:///Users/shatadrusarkar/Documents/Web%20Apps/Durga-Puja/index.html), replace `YOUR_GOOGLE_MAPS_API_KEY`:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap" async defer></script>
   ```

### 2. Firebase & Google Sign-In Setup
1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** -> **Sign-in method** -> **Google**.
3. Enable **Cloud Firestore** in test or production mode with a `snaps` collection.
4. Add a Web App in Firebase Project Settings and paste your credentials in `firebaseConfig` in [index.html](file:///Users/shatadrusarkar/Documents/Web%20Apps/Durga-Puja/index.html):
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_FIREBASE_API_KEY",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.firebasestorage.app",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef1234567890"
   };
   ```
> **Note:** The app includes an automatic fallback simulation mode so all features (Google Sign-In popup, profile tagging, photo & video stories, dynamic map markers, and feed sync) work immediately out-of-the-box for instant local testing even before configuring production keys!

---

## 🛠️ Troubleshooting: "Cannot find module '@vitejs/plugin-react'"

If your IDE reports:
`Cannot find module '@vitejs/plugin-react' or its corresponding type declarations. @[vite.config.ts:L1]`

### Why this happens:
- `@vitejs/plugin-react` is declared in [package.json](file:///Users/shatadrusarkar/Documents/Web%20Apps/Durga-Puja/package.json), but project dependencies have **not yet been installed** (the `node_modules/` folder does not exist).
- Furthermore, Node.js / `npm` may not be installed or configured in your terminal's `$PATH`.

### Solution:
1. **Install Node.js (LTS)**:
   - On macOS with Homebrew:
     ```bash
     brew install node
     ```
   - Or download directly from [nodejs.org](https://nodejs.org).
2. **Install dependencies**:
   ```bash
   cd "/Users/shatadrusarkar/Documents/Web Apps/Durga-Puja"
   npm install
   ```
3. Once `npm install` runs, `node_modules/@vitejs/plugin-react` is populated, the TypeScript language server resolves the type declarations, and the red squiggly in [vite.config.ts](file:///Users/shatadrusarkar/Documents/Web%20Apps/Durga-Puja/vite.config.ts) disappears.
4. **Standalone App Note**: You can also run the full mobile app right away simply by opening [index.html](file:///Users/shatadrusarkar/Documents/Web%20Apps/Durga-Puja/index.html) directly in any browser (or using Live Server), requiring zero build tools!

