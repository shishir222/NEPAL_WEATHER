import axios from 'axios';

/**
 * Check current weather for a municipality using Open-Meteo API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<object>} Current weather data with WMO code
 */
export async function checkWeather(lat, lon) {
  try {
    const params = new URLSearchParams({
      latitude: lat.toFixed(5),
      longitude: lon.toFixed(5),
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'precipitation',
        'weather_code',
        'wind_speed_10m',
      ].join(','),
      timezone: 'Asia/Kathmandu',
    });

    const { data } = await axios.get(
      `https://api.open-meteo.com/v1/forecast?${params}`
    );

    return {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      precipitation: data.current.precipitation,
      weatherCode: data.current.weather_code,
      windSpeed: data.current.wind_speed_10m,
      time: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Weather check error:', error);
    return null;
  }
}

/**
 * Classify weather severity based on WMO code
 * @param {number} code - WMO weather code
 * @returns {string} 'normal' | 'warning' | 'emergency'
 */
export function getWeatherSeverity(code) {
  // Severe weather codes
  const emergencyWeather = [82, 95, 96, 99]; // Violent showers, thunderstorms, hailstorms
  const warningWeather = [65, 81, 80, 85, 86]; // Heavy rain, showers, snow showers

  if (emergencyWeather.includes(code)) return 'emergency';
  if (warningWeather.includes(code)) return 'warning';
  return 'normal';
}

/**
 * Check if weather has significantly changed from previous state
 * @param {object} currentWeather - Current weather object
 * @param {object} previousWeather - Previous weather object (from localStorage)
 * @returns {boolean}
 */
export function hasWeatherChanged(currentWeather, previousWeather) {
  if (!previousWeather) return true;

  const severityChanged =
    getWeatherSeverity(currentWeather.weatherCode) !==
    getWeatherSeverity(previousWeather.weatherCode);

  return severityChanged;
}
