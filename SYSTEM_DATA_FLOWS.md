# Complete Weather Alert System - Data Flow & Integration

## System Architecture Overview

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         WEATHER ALERT SYSTEM                             │
│                      Frontend-Only Hybrid Engine                          │
│                        (Free Firebase Tier)                               │
└───────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │   Browser   │
                              │     App     │
                              └──────┬──────┘
                                     │
                  ┌──────────────────┼──────────────────┐
                  │                  │                  │
                  ▼                  ▼                  ▼
         ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐
         │  localStorage   │  │  Open-Meteo API │  │ Browser      │
         │  (State)        │  │  (Weather Data) │  │ Notification │
         └─────────────────┘  └─────────────────┘  │ API          │
                                                    └──────────────┘
```

## Complete Component Interaction Map

```
src/App.jsx (Root Component)
│
├─ useEffect #1 (Initialization)
│  └─ Notification.requestPermission()
│     └─ Request user consent for notifications
│
├─ useEffect #2 (Smart Weather System)
│  ├─ Call: runWeatherSystem()
│  │  └─ On app load (immediate)
│  │
│  └─ setInterval: runWeatherSystem()
│     └─ Every 5 minutes (300,000 ms)
│
└─ Sidebar (UI Component)
   └─ LocationSelector
      └─ Calls: handleMunicipalityClick()
         └─ Save to localStorage['selectedMunicipality']
            └─ Trigger: runWeatherSystem()

                              ▼

src/utils/weatherSystem.js (Main Engine)
│
└─ runWeatherSystem() [MAIN ORCHESTRATOR]
   │
   ├─ Read: localStorage['selectedMunicipality']
   │  └─ Extract: lat, lon, municipality name
   │
   ├─ Call: checkWeather(lat, lon)
   │  └─ Returns: { weatherCode, temperature, humidity }
   │
   ├─ PRIORITY #1: Emergency Detection
   │  ├─ Check: weatherCode in [65, 81, 82, 95, 96, 99]?
   │  │  ├─ Yes → Call: isSpammyEmergency(currentCode)
   │  │  │        ├─ No spam → Fire alert
   │  │  │        └─ Spammy → Block alert
   │  │  └─ No → Continue
   │  │
   │  └─ If fires:
   │     ├─ Call: getNepaliAlert(code, municipality)
   │     ├─ Save: localStorage['lastEmergencyCode']
   │     ├─ Save: localStorage['lastEmergencyTime']
   │     ├─ Call: triggerLocalNotification()
   │     └─ Return: { action: 'emergency_alert', ... }
   │
   ├─ PRIORITY #2: Morning Summary (6-9 AM only)
   │  ├─ Call: isMorningTime()
   │  │  └─ Returns: true if hour in [6, 7, 8]
   │  │
   │  ├─ Call: hasMorningAlertBeenSent()
   │  │  └─ Check: localStorage['lastMorningAlertDate'] === today
   │  │
   │  ├─ If all conditions met:
   │  │  ├─ Call: fetchWeather(lat, lon)
   │  │  ├─ Extract: todayCode, maxTemp, minTemp
   │  │  ├─ Call: getMorningNepaliWeather(code, temps, municipality)
   │  │  ├─ Save: localStorage['lastMorningAlertDate'] = new Date().toDateString()
   │  │  ├─ Call: triggerLocalNotification()
   │  │  └─ Return: { action: 'morning_summary', ... }
   │  └─ Else: Continue
   │
   └─ PRIORITY #3: Evening Summary (5-8 PM only)
      ├─ Call: isEveningTime()
      │  └─ Returns: true if hour in [17, 18, 19]
      │
      ├─ Call: hasEveningAlertBeenSent()
      │  └─ Check: localStorage['lastEveningAlertDate'] === today
      │
      ├─ If all conditions met:
      │  ├─ Call: fetchWeather(lat, lon)
      │  ├─ Extract: todayCode, maxTemp, minTemp
      │  ├─ Generate: alert (English + Nepali)
      │  ├─ Save: localStorage['lastEveningAlertDate'] = new Date().toDateString()
      │  ├─ Call: triggerLocalNotification()
      │  └─ Return: { action: 'evening_summary', ... }
      └─ Else: Return: { action: 'none', ... }
```

## Data Flow: Emergency Alert Example

```
User's Device 8:30 AM
│
└─ Heavy Rain Starts
   └─ Weather Code: 65
      │
      ├─ setInterval triggers runWeatherSystem()
      │  │
      │  └─ Call: checkWeather(28.2, 84.0)
      │     │
      │     └─ GET /https://api.open-meteo.com/v1/forecast
      │        ?latitude=28.2&longitude=84.0
      │        &current=weather_code,temperature_2m,relative_humidity_2m
      │        │
      │        └─ API Response: { weatherCode: 65, temperature: 24 }
      │           │
      │           ├─ EMERGENCY_CODES.includes(65) ✓ YES
      │           │  │
      │           │  └─ Call: isSpammyEmergency(65)
      │           │     │
      │           │     ├─ Read: lastEmergencyCode = "75" (from yesterday)
      │           │     ├─ Read: lastEmergencyTime = "yesterday 10:00 AM"
      │           │     │
      │           │     ├─ currentCode (65) !== lastCode (75)
      │           │     │  └─ Return: false (NOT spammy, weather changed)
      │           │     │
      │           │     └─ Call: getNepaliAlert(65, "Mulpani")
      │           │        └─ Returns: {
      │           │              nepaliTitle: "मुलपानी: भारी वर्षा चेतावनी",
      │           │              nepaliBody: "मुलपानी मा भारी वर्षा हुने सम्भावना छ। ...",
      │           │              title: "Mulpani: Heavy Rain Warning",
      │           │              body: "Heavy rain expected in Mulpani area. ..."
      │           │           }
      │           │     │
      │           │     └─ Save State:
      │           │        ├─ localStorage['lastEmergencyCode'] = "65"
      │           │        └─ localStorage['lastEmergencyTime'] = "2025-01-24T08:30:00.000Z"
      │           │
      │           └─ Call: triggerLocalNotification(
      │              "मुलपानी: भारी वर्षा चेतावनी",
      │              "मुलपानी मा भारी वर्षा हुने सम्भावना छ। कृपया सुरक्षित रहनुहोस्।"
      │           )
      │              │
      │              ├─ Check: Notification.permission
      │              │  └─ 'granted' ✓
      │              │
      │              ├─ Execute: new Notification(title, { body, icon })
      │              │
      │              └─ OS displays: 🔔 [Notification appears on user's desktop/mobile]
      │
      └─ Console Log:
         "🚨 Emergency Alert Fired: Mulpani (Code 65)"
```

## Data Flow: Anti-Spam Logic (60-Min Cooldown)

```
Scenario: Same Weather Code Persists for 2 Hours

Timeline:
8:00 AM - Code 65 Alert Fires
│        Save: lastEmergencyCode = "65"
│        Save: lastEmergencyTime = "08:00 AM"
│
├─ 8:30 AM - Code still 65
│  │ Call: isSpammyEmergency(65)
│  │ ├─ currentCode (65) === lastCode (65) ✓
│  │ ├─ Elapsed time: 30 minutes < 60 minutes
│  │ └─ Return: true (SPAMMY, block alert)
│  │    └─ No notification fired
│  │
├─ 9:00 AM - Code still 65
│  │ Call: isSpammyEmergency(65)
│  │ ├─ currentCode (65) === lastCode (65) ✓
│  │ ├─ Elapsed time: 60 minutes >= 60 minutes ✓
│  │ └─ Return: false (NOT spammy, allow alert)
│  │    └─ Fire new notification
│  │    └─ Update: lastEmergencyTime = "09:00 AM"
│  │
└─ 9:01 AM - Code changes to 95 (Thunderstorm)
   │ Call: isSpammyEmergency(95)
   │ ├─ currentCode (95) !== lastCode (65) ✓
   │ └─ Return: false (Weather changed, bypass 60-min cooldown)
   │    └─ Fire new notification immediately (emergency escalation)
   │    └─ Update: lastEmergencyCode = "95"
   │    └─ Update: lastEmergencyTime = "09:01 AM"
```

## Data Flow: Scheduled Morning Alert

```
Timeline: 6:30 AM

6:00 AM - App running
│  └─ setInterval triggers every 5 minutes
│
6:05 AM - Check 1
│  ├─ Call: isMorningTime()
│  │  └─ hour = 6, in [6,7,8]? YES ✓
│  ├─ Call: hasMorningAlertBeenSent()
│  │  ├─ lastMorningAlertDate = undefined (first time today)
│  │  └─ Return: false ✓
│  └─ Conditions met → Fire morning summary
│     ├─ Call: fetchWeather(28.2, 84.0)
│     │  └─ Returns: { daily: { weather_code[0]: 3, temperature_2m_max[0]: 28 } }
│     ├─ Call: getMorningNepaliWeather(3, 28, 15, "Mulpani")
│     │  └─ Returns: {
│     │       nepaliTitle: "शुभ प्रभात!",
│     │       nepaliBody: "अधिकतम तापमान: 28°C, न्यूनतम तापमान: 15°C। मौसम सामान्य छ।"
│     │     }
│     ├─ Save: localStorage['lastMorningAlertDate'] = "Fri Jan 24 2025"
│     └─ Call: triggerLocalNotification()
│        └─ 🔔 Notification appears
│
6:10 AM - Check 2
│  ├─ Call: isMorningTime()
│  │  └─ YES ✓
│  ├─ Call: hasMorningAlertBeenSent()
│  │  ├─ lastMorningAlertDate = "Fri Jan 24 2025"
│  │  ├─ today = "Fri Jan 24 2025"
│  │  ├─ Match? YES ✓
│  │  └─ Return: true (already sent)
│  └─ Skip alert (already sent today)
│
...more checks skipped...
│
9:30 AM - Check (outside morning window)
│  ├─ Call: isMorningTime()
│  │  └─ hour = 9, in [6,7,8]? NO ✗
│  └─ Skip alert (not in morning window)
│
Next Day 6:05 AM
│  ├─ Call: hasMorningAlertBeenSent()
│  │  ├─ lastMorningAlertDate = "Fri Jan 24 2025" (old)
│  │  ├─ today = "Sat Jan 25 2025" (new)
│  │  ├─ Match? NO ✗
│  │  └─ Return: false
│  └─ Fire morning summary again (new day)
```

## localStorage State Schema

```
Key: "selectedMunicipality"
Type: JSON String
Value: {
  "GaPa_NaPa": "Mulpani",
  "DISTRICT": "Kathmandu",
  "NAME": "Mulpani",
  "NAME_NP": "मुलपानी",
  "centroid": [85.3456, 27.8456]  // [lon, lat]
}
Purpose: Persist user's selected location

---

Key: "lastMorningAlertDate"
Type: String (Date)
Value: "Fri Jan 24 2025"
Purpose: Track if morning alert already sent today

---

Key: "lastEveningAlertDate"
Type: String (Date)
Value: "Fri Jan 24 2025"
Purpose: Track if evening alert already sent today

---

Key: "lastEmergencyCode"
Type: String (Number)
Value: "65"
Purpose: Store last emergency weather code for anti-spam

---

Key: "lastEmergencyTime"
Type: String (ISO Timestamp)
Value: "2025-01-24T08:30:00.000Z"
Purpose: Store time of last emergency alert for 60-min cooldown

---

Key: "fcmToken"
Type: String
Value: "eKJ5W2pTl5M:APA91bHxyz..."  (Firebase generated)
Purpose: Store FCM token for backend pushes (future use)
```

## API Interactions

### Open-Meteo Current Weather API

```
Endpoint: GET /v1/forecast
Query Parameters:
  latitude: 28.2             # Latitude from municipality centroid
  longitude: 84.0            # Longitude from municipality centroid
  current: weather_code,     # Current WMO code
           temperature_2m,   # Temperature
           relative_humidity_2m  # Humidity

Response:
  {
    "current": {
      "weather_code": 65,        # Emergency trigger code
      "temperature_2m": 24.5,
      "relative_humidity_2m": 72
    }
  }

Frequency: Every 5 minutes (via setInterval)
Free Tier: ✓ Yes, no authentication required
```

### Open-Meteo Daily Forecast API

```
Endpoint: GET /v1/forecast
Query Parameters:
  latitude: 28.2
  longitude: 84.0
  daily: weather_code,
         temperature_2m_max,
         temperature_2m_min

Response:
  {
    "daily": {
      "weather_code": [3, 51, 71, ...],    # Today's code at index [0]
      "temperature_2m_max": [28, 29, ...],
      "temperature_2m_min": [15, 14, ...]
    }
  }

Usage: Morning & evening summary generation
Frequency: Only during morning/evening windows
Free Tier: ✓ Yes
```

### Browser Notification API

```
Permission Request:
  Notification.requestPermission()
    → Returns: "granted" | "denied" | "default"

Fire Notification:
  new Notification(title, {
    body: string,
    icon: string (icon URL)
  })

State:
  Notification.permission === "granted"
    → Notifications can be sent
```

## Testing Data Flows

### Test Emergency Alert Flow

```javascript
// 1. Set up test environment
WEATHER_DEBUG.setTestMunicipality("Kathmandu", "Kathmandu", 27.7, 85.3)

// 2. Clear emergency tracking
localStorage.removeItem('lastEmergencyCode')
localStorage.removeItem('lastEmergencyTime')

// 3. Run weather system
await WEATHER_DEBUG.run()

// 4. Check results
WEATHER_DEBUG.status()
// Should show emergency alert fired if weather code is in [65,81,82,95,96,99]
```

### Test Morning Alert Flow

```javascript
// 1. Mock time to morning
WEATHER_DEBUG.mockTime(7)  // 7:00 AM

// 2. Clear morning alert
localStorage.removeItem('lastMorningAlertDate')

// 3. Run weather system
await WEATHER_DEBUG.run()

// 4. Verify
localStorage.getItem('lastMorningAlertDate')
// Should be today's date
```

### Test Anti-Spam Flow

```javascript
// 1. Trigger alert
WEATHER_DEBUG.testEmergency()

// 2. Check anti-spam (should block)
WEATHER_DEBUG.checkAntiSpam(65)
// Output: "Code 65: Would BLOCK (same code, 55 minutes until cooldown expires)"

// 3. After 60 minutes (or mock time)
WEATHER_DEBUG.mockTime('reset')
// Manually wait or advance time, then test again
WEATHER_DEBUG.checkAntiSpam(65)
// Output: "Code 65: Would FIRE (60+ minutes passed: 61 minutes)"
```

## Performance Metrics

| Component | Frequency | Data Size | CPU | Network |
|-----------|-----------|-----------|-----|---------|
| checkWeather() | Every 5 min | ~500 B | <5ms | ~3 KB |
| fetchWeather() | Morning + Evening | ~1 KB | <10ms | ~5 KB |
| localStorage Read | Per check | - | <1ms | - |
| Notification | Per alert | - | <2ms | - |
| **Total Daily** | - | **~400 KB** | **<5%** | **~400 KB** |

## Browser Compatibility

| Browser | Desktop | Mobile | Notifications | localStorage |
|---------|---------|--------|---|---|
| Chrome | ✓ | ✓ | ✓ | ✓ |
| Firefox | ✓ | ✓ | ✓ | ✓ |
| Safari | ✓ | ✓ | ⚠️ Limited | ✓ |
| Edge | ✓ | ✓ | ✓ | ✓ |
| iOS Safari | - | ⚠️ | ⚠️ | ✓ |

## Error Handling & Recovery

```
Scenario: Open-Meteo API fails

runWeatherSystem()
  └─ checkWeather() returns null
     ├─ Catch error
     ├─ Log: "❌ Frontend Alert Engine error: ..."
     └─ Return: { action: 'error', reason: '...' }

Next execution (5 min later):
  └─ Retry automatically
     └─ No user action required
```

```
Scenario: localStorage quota exceeded

new Notification() fires
  └─ localStorage.setItem() throws
     ├─ Catch error
     ├─ Log error
     ├─ Notification still sent (browser native)
     └─ Next alert may fail if quota not cleared

Recovery: Clear old data or increase quota
```

---

**Last Updated:** 2025-01-24
**System Version:** Frontend-Only Hybrid Alert Engine v1.0
**Compatible With:** React 18+, Vite, Free Firebase Tier
