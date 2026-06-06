# 🌤️ Weather Alert System - Quick Start & Troubleshooting Guide

## Using the Debug Console

After your app loads, open the browser Developer Console (F12 or Cmd+Option+J) and use these commands:

### View System Status
```javascript
WEATHER_DEBUG.status()
```
Shows:
- Selected municipality
- Morning/evening alert status
- Last emergency alert details
- Browser notification permission
- Current time and alert windows

### Test Alerts

#### Test Morning Alert
```javascript
WEATHER_DEBUG.testMorning()
```
Clears morning alert tracking and triggers the weather system. Useful for testing without waiting until 6 AM.

#### Test Evening Alert
```javascript
WEATHER_DEBUG.testEvening()
```
Same as morning, but for evening alerts.

#### Test Emergency Alert
```javascript
WEATHER_DEBUG.testEmergency()
```
Clears emergency tracking and runs the system. Most likely to fire if your municipality has active weather conditions.

#### Manual Time Mock (Advanced)
```javascript
// Set fake time to 7 AM
WEATHER_DEBUG.mockTime(7)

// Run weather system
await WEATHER_DEBUG.run()

// Switch to evening
WEATHER_DEBUG.mockTime(18)
await WEATHER_DEBUG.run()

// Reset to real time
WEATHER_DEBUG.mockTime('reset')
```

### Check Anti-Spam Logic
```javascript
WEATHER_DEBUG.checkAntiSpam(65)  // Check code 65 (Heavy Rain)
```
Shows whether the next emergency alert would fire or be blocked by anti-spam.

### Clear All Tracking
```javascript
WEATHER_DEBUG.clearAlerts()
```
Resets all alert state. Next `runWeatherSystem()` will fire all applicable alerts again.

### Set Test Municipality
```javascript
WEATHER_DEBUG.setTestMunicipality('Kathmandu', 'Kathmandu', 27.7172, 85.3240)
```
Saves a test municipality for local development testing.

### Run Weather System Immediately
```javascript
const result = await WEATHER_DEBUG.run()
```
Triggers the weather system and logs the result.

---

## Expected Behavior

### First App Load
1. **Notification Permission Prompt** appears
   - Click "Allow" to enable browser notifications
   - Required for alerts to work

2. **Municipality Selection Screen** appears
   - Search and select your municipality
   - System saves this to localStorage

3. **Weather Check Runs**
   - System fetches current weather
   - Logs result to console

### During Usage

#### Morning (6:00 AM - 9:00 AM)
- App checks current weather
- If no morning alert sent today → fires morning summary
- Shows: temperature range, weather description in Nepali

#### Evening (5:00 PM - 8:00 PM)  
- App checks current weather
- If no evening alert sent today → fires evening summary
- Shows: tomorrow's weather forecast in Nepali

#### Emergency (Any Time)
- If weather code is 65, 81, 82, 95, 96, or 99 → immediate alert
- Anti-spam blocks duplicate codes within 60 minutes
- Weather code change bypasses cooldown

#### Every 5 Minutes
- System checks weather in background
- Checks for new emergency conditions
- Logs to console (can be noisy)

---

## Common Issues & Solutions

### Issue: No Alerts Firing
**Debug Steps:**
1. Check permission: `Notification.permission`
   - Should be `'granted'`
   - If `'denied'`: reset in browser settings

2. Check municipality: `localStorage.getItem('selectedMunicipality')`
   - Should have valid JSON with lat/lon
   - If empty: select municipality again

3. Check if in alert window:
   - Morning window: 6 AM - 9 AM
   - Evening window: 5 PM - 8 PM
   - Test with `WEATHER_DEBUG.mockTime(7)`

4. Check weather API:
   ```javascript
   // Manually test weather fetch
   await WEATHER_DEBUG.run()
   // Check console for API errors
   ```

### Issue: Too Many Notifications
**Solution:** Anti-spam is working as intended
- Same weather code blocks alerts for 60 minutes
- Different weather code triggers immediately
- Check last alert: `WEATHER_DEBUG.status()`

### Issue: Municipality Not Saving
**Debug:**
```javascript
// Check localStorage
localStorage.getItem('selectedMunicipality')

// Should output:
// {"NAME_NP":"मुलपानी","NAME_EN":"Mulpani","DISTRICT":"Kathmandu","centroid":[...]}

// If empty, select municipality again in the app
```

### Issue: Notification Permission Not Requested
**Solution:** This only happens once on first load
- If you denied it: reset in browser settings
- Chrome: Settings → Privacy and Security → Site settings → Notifications → Find your site and remove it
- Then reload the app

### Issue: Time-Based Alerts Not Triggering
**Debug:**
```javascript
// Check current time
new Date().getHours()  // Should be 6-9 for morning, 17-20 for evening

// Check localStorage dates
localStorage.getItem('lastMorningAlertDate')
localStorage.getItem('lastEveningAlertDate')

// They should be different from today's date for new alerts
new Date().toDateString()
```

---

## Production Checklist

- [ ] Select a municipality in the app
- [ ] Grant notification permission when prompted
- [ ] Wait for morning (6-9 AM) or evening (5-8 PM) window, OR:
  - Use `WEATHER_DEBUG.mockTime()` to test time windows
  - Use `WEATHER_DEBUG.testMorning()` or `WEATHER_DEBUG.testEvening()`
- [ ] Verify notification appears
- [ ] Change municipality and verify alerts switch locations
- [ ] Test emergency alert by waiting for severe weather in your region
- [ ] Monitor console for errors

---

## Architecture Quick Reference

```
App loads
  ↓
Request notification permission
  ↓
Load map data (provinces, districts, municipalities)
  ↓
setInterval every 5 minutes:
  ├─ Check for emergency codes [65, 81, 82, 95, 96, 99]
  │  └─ If yes → apply anti-spam → fire if passes
  │
  ├─ Check if 6-9 AM → if yes, fire morning summary
  │
  └─ Check if 5-8 PM → if yes, fire evening summary
```

---

## Performance Notes

- **Network:** Calls Open-Meteo API every 5 minutes (3.6 KB per call)
- **Storage:** Uses ~1-2 KB localStorage for tracking
- **CPU:** Minimal (JavaScript time checks, no heavy computation)
- **Notifications:** Native browser API (OS handles rendering)
- **Compatible:** Works on Android, iOS, Windows, macOS

---

## Future Enhancements

- [ ] Notification sounds (add `sound: '/notification.mp3'` to Notification constructor)
- [ ] Vibration on Android (`navigator.vibrate([200, 100, 200])`)
- [ ] Multiple municipalities with alerts
- [ ] User-configurable alert times (instead of 6-9 AM / 5-8 PM)
- [ ] Offline support with Service Workers (PWA)
- [ ] Alert history log in app UI
- [ ] Timezone-aware checks (currently uses browser local time)

---

## Support & Debugging

**For detailed architecture:** See [ALERT_ARCHITECTURE.js](./ALERT_ARCHITECTURE.js)

**Console Commands Summary:**
- `WEATHER_DEBUG.status()` — Show all system state
- `WEATHER_DEBUG.testMorning()` — Test morning alert
- `WEATHER_DEBUG.testEvening()` — Test evening alert
- `WEATHER_DEBUG.testEmergency()` — Test emergency alert
- `WEATHER_DEBUG.mockTime(7)` — Fake time to 7 AM
- `WEATHER_DEBUG.clearAlerts()` — Reset all tracking
- `WEATHER_DEBUG.run()` — Manually run weather system
- `WEATHER_DEBUG.emergencyCodes()` — Show codes that trigger alerts
- `WEATHER_DEBUG.checkAntiSpam(65)` — Check if code would fire
- `WEATHER_DEBUG.setTestMunicipality()` — Set test location

---

**Last Updated:** 2025-01-24
**System:** Frontend-only hybrid weather alerts (free Firebase tier)
**Framework:** React 18 + Vite
**Data Source:** Open-Meteo API (free, no key required)
