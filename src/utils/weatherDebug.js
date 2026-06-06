/**
 * Weather Alert System Diagnostic Console
 * 
 * Usage in browser console:
 *   window.WEATHER_DEBUG.status()          // Show current system state
 *   window.WEATHER_DEBUG.clearAlerts()     // Reset all alert tracking
 *   window.WEATHER_DEBUG.testMorning()     // Simulate 7 AM trigger
 *   window.WEATHER_DEBUG.testEvening()     // Simulate 6 PM trigger
 *   window.WEATHER_DEBUG.testEmergency()   // Simulate emergency alert
 *   window.WEATHER_DEBUG.mockTime(hour)    // Fake the current time
 */

import { runWeatherSystem } from './weatherSystem';

const STORAGE_KEYS = {
  SELECTED_MUNICIPALITY: 'selectedMunicipality',
  LAST_MORNING_ALERT: 'lastMorningAlertDate',
  LAST_EVENING_ALERT: 'lastEveningAlertDate',
  LAST_EMERGENCY_CODE: 'lastEmergencyCode',
  LAST_EMERGENCY_TIME: 'lastEmergencyTime',
};

const EMERGENCY_CODES = [65, 81, 82, 95, 96, 99];

export const WEATHER_DEBUG = {
  /**
   * Display current system status
   */
  status: () => {
    console.log('════════════════════════════════════════════════════════════════');
    console.log('🌤️  WEATHER ALERT SYSTEM - DIAGNOSTIC STATUS');
    console.log('════════════════════════════════════════════════════════════════');

    // Municipality
    const municipality = localStorage.getItem(STORAGE_KEYS.SELECTED_MUNICIPALITY);
    console.log(`\n📍 Selected Municipality:\n${municipality ? JSON.stringify(JSON.parse(municipality), null, 2) : '❌ None'}`);

    // Morning Alert
    const lastMorning = localStorage.getItem(STORAGE_KEYS.LAST_MORNING_ALERT);
    const todayString = new Date().toDateString();
    const morningStatus = lastMorning === todayString ? '✅ Sent today' : '⏳ Not sent today';
    console.log(`\n☀️  Morning Alert: ${morningStatus}`);
    console.log(`   Last sent: ${lastMorning || 'Never'}`);

    // Evening Alert
    const lastEvening = localStorage.getItem(STORAGE_KEYS.LAST_EVENING_ALERT);
    const eveningStatus = lastEvening === todayString ? '✅ Sent today' : '⏳ Not sent today';
    console.log(`\n🌙 Evening Alert: ${eveningStatus}`);
    console.log(`   Last sent: ${lastEvening || 'Never'}`);

    // Emergency Alert
    const lastCode = localStorage.getItem(STORAGE_KEYS.LAST_EMERGENCY_CODE);
    const lastTime = localStorage.getItem(STORAGE_KEYS.LAST_EMERGENCY_TIME);
    if (lastCode) {
      const timeAgo = new Date(lastTime);
      const minutesAgo = Math.floor((Date.now() - timeAgo) / 60000);
      console.log(`\n🚨 Last Emergency Alert:`);
      console.log(`   Code: ${lastCode}`);
      console.log(`   Time: ${timeAgo.toLocaleString()} (${minutesAgo} minutes ago)`);
    } else {
      console.log(`\n🚨 Last Emergency Alert: None`);
    }

    // Notification Permission
    const permStatus = Notification.permission;
    console.log(`\n🔔 Browser Notification Permission: ${permStatus}`);

    // Current Time
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const inMorning = hour >= 6 && hour < 9;
    const inEvening = hour >= 17 && hour < 20;
    console.log(`\n⏰ Current Time: ${now.toLocaleTimeString()}`);
    console.log(`   In Morning Window (6-9 AM): ${inMorning ? '✅ YES' : '❌ NO'}`);
    console.log(`   In Evening Window (5-8 PM): ${inEvening ? '✅ YES' : '❌ NO'}`);

    console.log('\n════════════════════════════════════════════════════════════════\n');
  },

  /**
   * Clear all alert tracking
   */
  clearAlerts: () => {
    localStorage.removeItem(STORAGE_KEYS.LAST_MORNING_ALERT);
    localStorage.removeItem(STORAGE_KEYS.LAST_EVENING_ALERT);
    localStorage.removeItem(STORAGE_KEYS.LAST_EMERGENCY_CODE);
    localStorage.removeItem(STORAGE_KEYS.LAST_EMERGENCY_TIME);
    console.log('✅ All alert tracking cleared. Weather system will re-trigger on next check.');
  },

  /**
   * Test emergency alert
   */
  testEmergency: async () => {
    console.log('🧪 Testing Emergency Alert...');
    WEATHER_DEBUG.clearAlerts();
    const result = await runWeatherSystem();
    console.log('Result:', result);
  },

  /**
   * Test morning alert (clear tracking, then run)
   */
  testMorning: async () => {
    console.log('🧪 Testing Morning Alert...');
    localStorage.removeItem(STORAGE_KEYS.LAST_MORNING_ALERT);
    const result = await runWeatherSystem();
    console.log('Result:', result);
  },

  /**
   * Test evening alert
   */
  testEvening: async () => {
    console.log('🧪 Testing Evening Alert...');
    localStorage.removeItem(STORAGE_KEYS.LAST_EVENING_ALERT);
    const result = await runWeatherSystem();
    console.log('Result:', result);
  },

  /**
   * Mock the current time (for testing)
   * 
   * Example:
   *   WEATHER_DEBUG.mockTime(7)   // Set to 7:00 AM
   *   runWeatherSystem()
   *   WEATHER_DEBUG.mockTime(18)  // Set to 6:00 PM
   *   WEATHER_DEBUG.mockTime('reset')  // Back to real time
   */
  mockTime: (hour) => {
    if (hour === 'reset' || hour === 'clear') {
      delete window.__MOCK_TIME;
      console.log('✅ Time mock cleared, using real time');
      return;
    }

    if (typeof hour !== 'number' || hour < 0 || hour > 23) {
      console.error('❌ Hour must be 0-23 or "reset"');
      return;
    }

    window.__MOCK_TIME = hour;
    console.log(`✅ Time mocked to ${hour}:00. Next runWeatherSystem() will use this time.`);
    console.log(`   Tip: Call runWeatherSystem() to trigger the check`);
  },

  /**
   * Check if anti-spam would block an emergency code
   */
  checkAntiSpam: (code = 65) => {
    const lastCode = localStorage.getItem(STORAGE_KEYS.LAST_EMERGENCY_CODE);
    const lastTime = localStorage.getItem(STORAGE_KEYS.LAST_EMERGENCY_TIME);

    if (!lastCode) {
      console.log(`✅ Code ${code}: Would FIRE (no previous alert)`);
      return;
    }

    if (code !== Number(lastCode)) {
      console.log(`✅ Code ${code}: Would FIRE (weather changed from ${lastCode})`);
      return;
    }

    const minutesAgo = Math.floor((Date.now() - new Date(lastTime)) / 60000);
    if (minutesAgo < 60) {
      console.log(
        `❌ Code ${code}: Would BLOCK (same code, ${60 - minutesAgo} minutes until cooldown expires)`
      );
      return;
    }

    console.log(`✅ Code ${code}: Would FIRE (60+ minutes passed: ${minutesAgo} minutes)`);
  },

  /**
   * Show all emergency codes
   */
  emergencyCodes: () => {
    console.log('🚨 Emergency Codes (instant alert):', EMERGENCY_CODES.join(', '));
    console.log('   65  = Heavy Rain');
    console.log('   81  = Heavy Showers');
    console.log('   82  = Violent Showers');
    console.log('   95  = Thunderstorm');
    console.log('   96  = Thunderstorm + Hail');
    console.log('   99  = Severe Hailstorm');
  },

  /**
   * Set a test municipality
   */
  setTestMunicipality: (name = 'Pokhara', district = 'Kaski', lat = 28.209, lon = 83.9856) => {
    const municipality = {
      NAME_NP: name,
      NAME_EN: name,
      DISTRICT: district,
      centroid: [lon, lat],
    };
    localStorage.setItem(STORAGE_KEYS.SELECTED_MUNICIPALITY, JSON.stringify(municipality));
    console.log(`✅ Test municipality set: ${name}, ${district}`);
    console.log(`   Coordinates: ${lat}, ${lon}`);
  },

  /**
   * Run weather system and show result
   */
  run: async () => {
    console.log('🌤️  Running weather system...');
    const result = await runWeatherSystem();
    console.log('Result:', result);
    return result;
  },
};

// Attach to window for console access
if (typeof window !== 'undefined') {
  window.WEATHER_DEBUG = WEATHER_DEBUG;
}
