import { checkWeather, getWeatherSeverity, hasWeatherChanged } from './weatherCheck';
import { getNepaliAlert, getMorningNepaliWeather } from './nepaliAlerts';
import { fetchWeather } from './weather';

/**
 * Storage keys for tracking weather system state in the browser
 */
const STORAGE_KEYS = {
  LAST_MORNING_ALERT: 'lastMorningAlertDate',
  LAST_EVENING_ALERT: 'lastEveningAlertDate',
  LAST_EMERGENCY_CODE: 'lastEmergencyCode',
  LAST_EMERGENCY_TIME: 'lastEmergencyTime',
  SELECTED_MUNICIPALITY: 'selectedMunicipality',
};

/**
 * Emergency weather codes (real-time, trigger instantly)
 */
const EMERGENCY_CODES = [65, 81, 82, 95, 96, 99];

/**
 * Check if it is morning time (6:00 AM - 9:00 AM)
 * @returns {boolean}
 */
function isMorningTime() {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 9;
}

/**
 * Check if it is evening time (5:00 PM - 8:00 PM)
 * @returns {boolean}
 */
function isEveningTime() {
  const hour = new Date().getHours();
  return hour >= 17 && hour < 20;
}

/**
 * Check if morning alert has already been sent today
 * @returns {boolean}
 */
function hasMorningAlertBeenSent() {
  const lastAlert = localStorage.getItem(STORAGE_KEYS.LAST_MORNING_ALERT);
  if (!lastAlert) return false;
  return lastAlert === new Date().toDateString();
}

/**
 * Check if evening alert has already been sent today
 * @returns {boolean}
 */
function hasEveningAlertBeenSent() {
  const lastAlert = localStorage.getItem(STORAGE_KEYS.LAST_EVENING_ALERT);
  if (!lastAlert) return false;
  return lastAlert === new Date().toDateString();
}

/**
 * Check if emergency notification is spammy
 * Rules:
 * - Return false (allow notification) if the weather code has changed from last alert.
 * - Return false (allow notification) if the same code has been sent but the 60 minutes cooldown has passed.
 * - Return true (spam - block notification) otherwise.
 * @param {number} currentCode - Current weather WMO code
 * @returns {boolean}
 */
function isSpammyEmergency(currentCode) {
  const lastCodeStr = localStorage.getItem(STORAGE_KEYS.LAST_EMERGENCY_CODE);
  const lastTimeStr = localStorage.getItem(STORAGE_KEYS.LAST_EMERGENCY_TIME);

  if (!lastCodeStr || !lastTimeStr) {
    return false; // No previous alert, not spammy
  }

  const lastCode = parseInt(lastCodeStr, 10);
  const lastTime = new Date(lastTimeStr).getTime();
  const now = new Date().getTime();
  const diffMinutes = (now - lastTime) / (1000 * 60);

  // If code changed, alert immediately (bypass cooldown)
  if (currentCode !== lastCode) {
    return false;
  }

  // Same code, check 60 minutes cooldown
  return diffMinutes < 60;
}

/**
 * Triggers a browser native notification
 * @param {string} title - Notification Title
 * @param {string} body - Notification Body
 */
export async function triggerLocalNotification(title, body) {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return false;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: '/vite.svg',
    });
    return true;
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/vite.svg',
      });
      return true;
    }
  }
  console.log('Notification permission is blocked/denied.');
  return false;
}

/**
 * MAIN FRONTEND HYBRID WEATHER ALERT ENGINE
 * Resolves:
 * 1. Scheduled Check:
 *    - Morning Summary (6:00 AM - 9:00 AM) -> Trigger summary once per day.
 *    - Evening Summary (5:00 PM - 8:00 PM) -> Trigger summary once per day.
 * 2. Real-Time Emergency:
 *    - If code in [65, 81, 82, 95, 96, 99] -> Trigger alert immediately if not spammy.
 */
export async function runWeatherSystem() {
  try {
    const municipalityJson = localStorage.getItem(STORAGE_KEYS.SELECTED_MUNICIPALITY);
    if (!municipalityJson) {
      return { action: 'none', reason: 'No municipality selected' };
    }

    let municipality;
    try {
      municipality = JSON.parse(municipalityJson);
    } catch {
      municipality = { name: municipalityJson, centroid: [28.2, 84.0] };
    }

    const municipalityName = municipality.GaPa_NaPa || municipality.NAME || municipality.name || 'Your Municipality';
    const [lat, lon] = municipality.centroid || [28.2, 84.0];

    console.log(`📡 Frontend Alert Engine: Checking ${municipalityName} (${lat}, ${lon})`);

    // 1. Fetch current weather from Open-Meteo
    const currentWeather = await checkWeather(lat, lon);
    if (!currentWeather) {
      return { action: 'none', reason: 'Weather API check failed' };
    }

    const currentCode = currentWeather.weatherCode;

    // ==========================================
    // ⚡ REAL-TIME EMERGENCY CHECK (Instant)
    // ==========================================
    if (EMERGENCY_CODES.includes(currentCode)) {
      if (!isSpammyEmergency(currentCode)) {
        const alert = getNepaliAlert(currentCode, municipalityName);
        
        // Save alert state to prevent spam
        localStorage.setItem(STORAGE_KEYS.LAST_EMERGENCY_CODE, String(currentCode));
        localStorage.setItem(STORAGE_KEYS.LAST_EMERGENCY_TIME, new Date().toISOString());

        // Trigger native notification
        await triggerLocalNotification(alert.nepaliTitle, alert.nepaliBody);

        console.log(`🚨 Emergency Alert Fired: ${municipalityName} (Code ${currentCode})`);
        return {
          action: 'emergency_alert',
          municipality: municipalityName,
          weather: currentWeather,
          message: alert,
        };
      } else {
        console.log(`🚨 Emergency active for ${municipalityName} (Code ${currentCode}) but blocked by anti-spam cooldown.`);
      }
    }

    // ==========================================
    // 🌅 SCHEDULED MORNING SUMMARY (6:00 AM - 9:00 AM)
    // ==========================================
    if (isMorningTime() && !hasMorningAlertBeenSent()) {
      const fullWeather = await fetchWeather(lat, lon);
      if (fullWeather && fullWeather.daily) {
        const todayCode = fullWeather.daily.weather_code[0];
        const maxTemp = fullWeather.daily.temperature_2m_max[0];
        const minTemp = fullWeather.daily.temperature_2m_min[0];

        const alert = getMorningNepaliWeather(todayCode, Math.round(maxTemp), Math.round(minTemp), municipalityName);

        // Mark as sent for today
        localStorage.setItem(STORAGE_KEYS.LAST_MORNING_ALERT, new Date().toDateString());

        // Trigger native notification
        await triggerLocalNotification(alert.nepaliTitle, alert.nepaliBody);

        console.log(`🌅 Morning summary triggered for ${municipalityName}`);
        return {
          action: 'morning_summary',
          municipality: municipalityName,
          weather: currentWeather,
          message: alert,
        };
      }
    }

    // ==========================================
    // 🌇 SCHEDULED EVENING SUMMARY (5:00 PM - 8:00 PM)
    // ==========================================
    if (isEveningTime() && !hasEveningAlertBeenSent()) {
      const fullWeather = await fetchWeather(lat, lon);
      if (fullWeather && fullWeather.daily) {
        const todayCode = fullWeather.daily.weather_code[0];
        const maxTemp = fullWeather.daily.temperature_2m_max[0];
        const minTemp = fullWeather.daily.temperature_2m_min[0];

        // Format an evening summary alert
        const alert = {
          title: `${municipalityName} - Evening Weather Update`,
          nepaliTitle: `${municipalityName} - साँझको मौसम अपडेट`,
          body: `Good evening! Tomorrow's expected high: ${Math.round(maxTemp)}°C. Weather will be moderate.`,
          nepaliBody: `शुभ साँझ! भोलिको मौसम अपडेट - अधिकतम तापमान: ${Math.round(maxTemp)}°C सम्म पुग्नेछ। मौसम सामान्य रहनेछ।`,
        };

        // Mark as sent for today
        localStorage.setItem(STORAGE_KEYS.LAST_EVENING_ALERT, new Date().toDateString());

        // Trigger native notification
        await triggerLocalNotification(alert.nepaliTitle, alert.nepaliBody);

        console.log(`🌇 Evening summary triggered for ${municipalityName}`);
        return {
          action: 'evening_summary',
          municipality: municipalityName,
          weather: currentWeather,
          message: alert,
        };
      }
    }

    return {
      action: 'none',
      reason: 'No scheduled windows active or emergency conditions met (or blocked by cooldown)',
    };
  } catch (error) {
    console.error('❌ Frontend Alert Engine error:', error);
    return { action: 'error', reason: error.message };
  }
}
