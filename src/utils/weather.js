import axios from 'axios';

/** WMO weather interpretation codes → label + emoji */
export const WMO_CODES = {
  0:  { label: 'Clear Sky',        icon: '☀️'  },
  1:  { label: 'Mainly Clear',     icon: '🌤️'  },
  2:  { label: 'Partly Cloudy',    icon: '⛅'  },
  3:  { label: 'Overcast',         icon: '☁️'  },
  45: { label: 'Foggy',            icon: '🌫️'  },
  48: { label: 'Icy Fog',          icon: '🌫️'  },
  51: { label: 'Light Drizzle',    icon: '🌦️'  },
  53: { label: 'Moderate Drizzle', icon: '🌦️'  },
  55: { label: 'Dense Drizzle',    icon: '🌧️'  },
  61: { label: 'Light Rain',       icon: '🌧️'  },
  63: { label: 'Moderate Rain',    icon: '🌧️'  },
  65: { label: 'Heavy Rain',       icon: '🌧️'  },
  71: { label: 'Light Snow',       icon: '❄️'  },
  73: { label: 'Moderate Snow',    icon: '❄️'  },
  75: { label: 'Heavy Snow',       icon: '❄️'  },
  77: { label: 'Snow Grains',      icon: '🌨️'  },
  80: { label: 'Rain Showers',     icon: '🌦️'  },
  81: { label: 'Heavy Showers',    icon: '🌧️'  },
  82: { label: 'Violent Showers',  icon: '⛈️'  },
  85: { label: 'Snow Showers',     icon: '🌨️'  },
  86: { label: 'Heavy Snow Showers', icon: '🌨️' },
  95: { label: 'Thunderstorm',     icon: '⛈️'  },
  96: { label: 'Thunderstorm + Hail', icon: '⛈️' },
  99: { label: 'Heavy Hailstorm',  icon: '⛈️'  },
};

export function getWeatherInfo(code) {
  return WMO_CODES[code] ?? { label: 'Unknown', icon: '🌡️' };
}

/**
 * Fetch current conditions + 7-day forecast from Open-Meteo.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<object>} Open-Meteo response
 */
export async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat.toFixed(5),
    longitude: lon.toFixed(5),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'wind_speed_10m',
      'wind_direction_10m',
      'weather_code',
      'precipitation',
    ].join(','),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'weather_code',
      'wind_speed_10m_max',
    ].join(','),
    timezone: 'Asia/Kathmandu',
    forecast_days: 7,
  });

  const { data } = await axios.get(
    `https://api.open-meteo.com/v1/forecast?${params}`
  );
  return data;
}

export const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Return compass direction string from degrees */
export function windDirection(deg) {
  if (deg == null || isNaN(deg)) return '';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8] ?? '';
}
