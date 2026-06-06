/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                   HYBRID WEATHER ALERT SYSTEM ARCHITECTURE                 │
 * │                    (Frontend-Only, Free Tier Compatible)                   │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * 🎯 DESIGN GOALS:
 * ✓ Zero backend services (100% free Firebase tier)
 * ✓ Real-time emergency alerts (instant detection)
 * ✓ Scheduled summaries (morning 6-9 AM, evening 5-8 PM)
 * ✓ Anti-spam mechanisms (cooldown + weather state tracking)
 * ✓ Nepali language support
 * ✓ Farmers as primary users
 * ✓ Works only when app is open (frontend simulation)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * ALERT SYSTEM FLOW
 * 
 *                        ┌─────────────────────────────────────────┐
 *                        │   App.jsx: useEffect()                  │
 *                        │   - Run on app load                      │
 *                        │   - setInterval() every 5 minutes        │
 *                        └──────────────┬──────────────────────────┘
 *                                       │
 *                                       ▼
 *                        ┌─────────────────────────────────────────┐
 *                        │   runWeatherSystem()                    │
 *                        │   [weatherSystem.js]                    │
 *                        └──────────────┬──────────────────────────┘
 *                                       │
 *          ┌────────────────────────────┼────────────────────────────┐
 *          │                            │                            │
 *          ▼                            ▼                            ▼
 *    ┌─────────────┐          ┌──────────────────┐        ┌──────────────────┐
 *    │ Emergency   │          │ Scheduled Morning│        │ Scheduled Evening│
 *    │ Detection   │          │ (6-9 AM)         │        │ (5-8 PM)         │
 *    │             │          │                  │        │                  │
 *    │ Code in:    │          │ Once per day     │        │ Once per day     │
 *    │ [65,81,82,  │          │ localStorage     │        │ localStorage     │
 *    │  95,96,99]? │          │ tracking         │        │ tracking         │
 *    │             │          │                  │        │                  │
 *    │ → INSTANT   │          │ → FETCHES FULL   │        │ → FETCHES FULL   │
 *    │   FIRE      │          │   FORECAST       │        │   FORECAST       │
 *    └─────────────┘          └──────────────────┘        └──────────────────┘
 *          │                            │                            │
 *          └────────────────────────────┼────────────────────────────┘
 *                                       │
 *                    ┌──────────────────▼──────────────────┐
 *                    │  Anti-Spam Check                   │
 *                    │  - isSpammyEmergency()             │
 *                    │  - 60 min cooldown (same code)     │
 *                    │  - Bypass if weather code changes  │
 *                    └──────────────────┬──────────────────┘
 *                                       │
 *                           ┌───────────▼───────────┐
 *                           │  getNepaliAlert()     │
 *                           │  Generate alert text: │
 *                           │  - English title      │
 *                           │  - Nepali title       │
 *                           │  - English body       │
 *                           │  - Nepali body        │
 *                           └───────────┬───────────┘
 *                                       │
 *                    ┌──────────────────▼──────────────────┐
 *                    │  triggerLocalNotification()         │
 *                    │  [weatherSystem.js]                 │
 *                    │  - Request permission if needed     │
 *                    │  - new Notification(title, {body})  │
 *                    │  - Browser native notification      │
 *                    └─────────────────────────────────────┘
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * KEY COMPONENTS
 * 
 * 1. WEATHER SYSTEM [src/utils/weatherSystem.js]
 *    ├─ runWeatherSystem()                 → Main orchestrator
 *    ├─ isMorningTime()                    → Check 6-9 AM window
 *    ├─ isEveningTime()                    → Check 5-8 PM window
 *    ├─ hasMorningAlertBeenSent()          → localStorage check
 *    ├─ hasEveningAlertBeenSent()          → localStorage check
 *    ├─ isSpammyEmergency(currentCode)     → Anti-spam logic
 *    └─ triggerLocalNotification(title, body)  → Native browser notification
 * 
 * 2. NEPALI ALERTS [src/utils/nepaliAlerts.js]
 *    ├─ getNepaliAlert(code, municipality)     → Emergency alert translation
 *    └─ getMorningNepaliWeather(code, temps)   → Morning summary
 * 
 * 3. WEATHER CHECK [src/utils/weatherCheck.js]
 *    ├─ checkWeather(lat, lon)            → Current weather fetch
 *    └─ getWeatherSeverity(code)          → Classify normal/warning/emergency
 * 
 * 4. APP INTEGRATION [src/App.jsx]
 *    ├─ useEffect() → Init on load + setInterval
 *    ├─ Notification.requestPermission()  → Browser permission
 *    └─ handleMunicipalityClick()         → Save to localStorage
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * STORAGE SCHEMA (localStorage)
 * 
 * Key                          Value Type       Purpose
 * ─────────────────────────────────────────────────────────────────────────────
 * selectedMunicipality         JSON object      Current selected municipality
 * lastMorningAlertDate         Date string      Today's date when morning alert sent
 * lastEveningAlertDate         Date string      Today's date when evening alert sent
 * lastEmergencyCode            String (number)  Last emergency weather code
 * lastEmergencyTime            ISO string       Timestamp of last emergency alert
 * fcmToken                     String           Firebase Cloud Messaging token
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * EMERGENCY CODES (instant real-time triggers)
 * 
 * Code  Severity              Description
 * ────────────────────────────────────────────────────────────────────────────
 * 65    Heavy Rain            Heavy rain – immediate alert
 * 81    Heavy Showers         Heavy rain showers – immediate alert
 * 82    Violent Showers       Extreme rain – highest priority
 * 95    Thunderstorm          Lightning + rain – severe hazard
 * 96    Thunderstorm + Hail   Thunderstorm with hail – emergency
 * 99    Severe Hailstorm      Extreme hail – critical hazard
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * SCHEDULED ALERT WINDOWS
 * 
 * Morning Summary (6:00 AM - 9:00 AM)
 * ────────────────────────────────────────────────────────────────────────────
 * - Triggers ONCE per day (tracked via localStorage date string)
 * - Fetches full 7-day forecast from Open-Meteo
 * - Shows: temperature range, weather description
 * - Sends Nepali + English notification
 * - Nepali example: "शुभ प्रभात! अधिकतम तापमान: 28°C, मौसम सामान्य छ।"
 * 
 * Evening Summary (5:00 PM - 8:00 PM)
 * ────────────────────────────────────────────────────────────────────────────
 * - Triggers ONCE per day (separate from morning)
 * - Shows tomorrow's expected weather
 * - Helps farmers plan next day activities
 * - Nepali example: "शुभ साँझ! भोलिको मौसम अपडेट - अधिकतम तापमान: 25°C"
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * ANTI-SPAM PROTECTION
 * 
 * Problem: Same emergency code can persist for hours (e.g., heavy rain)
 * Solution: Multi-layered anti-spam
 * 
 * Layer 1: Weather Code Change Detection
 * ────────────────────────────────────────────────────────────────────────────
 * If weather code CHANGES from last alert:
 *   → Fire alert IMMEDIATELY (bypass cooldown)
 *   Example: Code 65 (heavy rain) → Code 95 (thunderstorm)
 * 
 * Layer 2: 60-Minute Cooldown (Same Code)
 * ────────────────────────────────────────────────────────────────────────────
 * If weather code is SAME as last alert:
 *   → Block if less than 60 minutes have passed
 *   → Allow if 60+ minutes have passed
 *   Example: Heavy rain (65) at 10 AM → allow again at 11:00 AM minimum
 * 
 * Logic (isSpammyEmergency):
 * 
 *   lastCode = localStorage.getItem('lastEmergencyCode')
 *   lastTime = localStorage.getItem('lastEmergencyTime')
 *   
 *   if (no previous alert):
 *     return false  // not spammy, fire immediately
 *   
 *   if (currentCode !== lastCode):
 *     return false  // weather changed, fire immediately
 *   
 *   diffMinutes = (now - lastTime) / 60000
 *   if (diffMinutes < 60):
 *     return true   // same code, not enough time passed, block it
 *   else:
 *     return false  // 60 min passed, fire alert
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * NOTIFICATION SYSTEM (Browser Native API)
 * 
 * Permission Flow:
 * 
 *   App.jsx useEffect():
 *     if (Notification.permission === 'default'):
 *       Notification.requestPermission()
 *         ▼
 *       User sees OS-level permission prompt
 *         ▼
 *       "Allow" / "Deny"
 * 
 *   When Alert Fires:
 *     triggerLocalNotification(title, body):
 *       if (Notification.permission === 'granted'):
 *         new Notification(title, { body, icon })
 *       else:
 *         console.warn('Permission blocked')
 * 
 * Notification Content:
 * 
 *   Nepali Title Example:
 *   "मुलपानी: भारी वर्षा चेतावनी"
 * 
 *   Nepali Body Example:
 *   "मुलपानी मा भारी वर्षा हुने सम्भावना छ। कृपया सुरक्षित रहनुहोस्।"
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * MUNICIPALITY-BASED LOGIC
 * 
 * Rule 1: Alerts ONLY for selected municipality
 * ────────────────────────────────────────────────────────────────────────────
 * Location is stored in localStorage['selectedMunicipality']
 * 
 *   if (!selectedMunicipality):
 *     return { action: 'none', reason: 'No municipality selected' }
 * 
 * Rule 2: Ignore other location views
 * ────────────────────────────────────────────────────────────────────────────
 * App.jsx has TWO location concepts:
 *   - viewLocation: User browsing map (NO alerts)
 *   - selectedMunicipality (localStorage): Active alerts for this location
 * 
 * Only the saved municipality triggers the weather system.
 * 
 * Rule 3: Single Location Isolation
 * ────────────────────────────────────────────────────────────────────────────
 * If user switches to a different municipality:
 *   1. handleMunicipalityClick() saves NEW location to localStorage
 *   2. Next runWeatherSystem() check uses NEW location
 *   3. Alerts now fire for NEW municipality
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * TESTING CHECKLIST
 * 
 * [✓] Emergency Detection
 *     - Set system time to any hour (override in browser console for testing)
 *     - Manually set weather code to 65, 81, 82, 95, 96, 99
 *     - Verify notification fires instantly
 *     - Verify anti-spam blocks duplicate code within 60 min
 * 
 * [✓] Morning Alert (6-9 AM only)
 *     - Change device time to 7:00 AM
 *     - Call runWeatherSystem()
 *     - Should fire morning summary
 *     - Change to 7:05 AM, call again
 *     - Should NOT fire (already sent today)
 *     - Change to next day 7:00 AM
 *     - Should fire again
 * 
 * [✓] Evening Alert (5-8 PM only)
 *     - Change device time to 6:00 PM
 *     - Call runWeatherSystem()
 *     - Should fire evening summary
 *     - Verify different text from morning alert
 * 
 * [✓] Municipality Selection
 *     - Open browser console
 *     - localStorage.setItem('selectedMunicipality', JSON.stringify({...}))
 *     - Call runWeatherSystem()
 *     - Should work
 *     - Clear localStorage
 *     - Call runWeatherSystem()
 *     - Should skip (no municipality)
 * 
 * [✓] Browser Notification Permission
 *     - First app load: should request permission
 *     - Browser shows OS permission dialog
 *     - User grants: notifications work
 *     - User denies: console shows warning
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * FREE TIER CONSTRAINTS & SOLUTIONS
 * 
 * Constraint 1: No Cloud Functions
 * Solution: Use browser setInterval() to check every 5 minutes
 * 
 * Constraint 2: No Cloud Scheduler
 * Solution: Frontend time-based checks (6-9 AM, 5-8 PM)
 * 
 * Constraint 3: No billing / Blaze plan
 * Solution: Browser native Notification API (free, OS-level)
 * 
 * Constraint 4: Works only when app is open
 * Solution: Document limitation for farmers, suggest PWA for background
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * PRODUCTION DEPLOYMENT
 * 
 * Step 1: Build
 *   npm run build
 * 
 * Step 2: Deploy to Firebase Hosting (free tier)
 *   firebase deploy --only hosting
 * 
 * Step 3: Verify
 *   - Open live URL
 *   - Grant notification permission
 *   - Select a municipality
 *   - Wait or manually test by changing system time
 * 
 * Step 4: Monitor
 *   - Firebase Console → Hosting
 *   - Check error logs via browser console
 *   - Monitor notifications via browser notification center
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * MONITORING & DEBUGGING
 * 
 * Console Logs:
 *   📡 Frontend Alert Engine: Checking ...
 *   🚨 Emergency Alert Fired: ...
 *   🌅 Morning summary triggered for ...
 *   🌇 Evening summary triggered for ...
 * 
 * localStorage Inspection:
 *   localStorage.getItem('lastEmergencyCode')
 *   localStorage.getItem('lastEmergencyTime')
 *   localStorage.getItem('lastMorningAlertDate')
 *   localStorage.getItem('lastEveningAlertDate')
 * 
 * Manual Testing:
 *   // Trigger weather system
 *   await runWeatherSystem()
 *   
 *   // Check localStorage state
 *   Object.keys(localStorage).filter(k => k.includes('Emergency'))
 *   
 *   // Clear all alerts (for testing)
 *   localStorage.removeItem('lastMorningAlertDate')
 *   localStorage.removeItem('lastEveningAlertDate')
 *   localStorage.removeItem('lastEmergencyCode')
 *   localStorage.removeItem('lastEmergencyTime')
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export const ALERT_SYSTEM_ARCHITECTURE = `
Frontend-Only Hybrid Weather Alert System
- 100% free Firebase tier compatible
- Zero backend services
- Real-time emergency detection
- Scheduled morning & evening summaries
- Anti-spam with 60-minute cooldown
- Nepali language support
- Works when app is open (frontend simulation)
`;
