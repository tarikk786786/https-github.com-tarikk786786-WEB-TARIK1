# UMATAXI Mobile Conversion Guide (APK)

This project is a Progressive Web App (PWA) by default. You can install it on any mobile device using "Add to Home Screen" from Chrome or Safari.

If you specifically need an **Android APK**, follow these steps using **Capacitor**:

## 1. Initial Setup
Run these commands in your project root:
```bash
npm install @capacitor/core @capacitor/cli
npx cap init UMATAXI com.umataxi.app --web-dir dist
```

## 2. Generate Built Web Static Files
```bash
npm run build
```

## 3. Add Android Platform
```bash
npm install @capacitor/android
npx cap add android
```

## 4. Sync Content
Whenever you update your web code, run:
```bash
npm run build
npx cap sync
```

## 5. Build the APK
1. Open the project in Android Studio:
   ```bash
   npx cap open android
   ```
2. In Android Studio, go to `Build` -> `Build Bundle(s) / APK(s)` -> `Build APK(s)`.
3. Your APK will be located in `android/app/build/outputs/apk/debug/app-debug.apk`.

## Deployment Tips
- **PWA**: Deploy to Netlify or Vercel. Both automatically detect Vite and build correctly.
- **SSL**: Ensure your site has HTTPS (Netlify/Vercel handles this) otherwise Geolocation won't work in browsers.
