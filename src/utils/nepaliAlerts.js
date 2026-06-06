import { WMO_CODES } from './weather';

/**
 * Get Nepali weather alert based on WMO code and severity
 */
export function getNepaliAlert(weatherCode, municipality) {
  const nepaliWeatherMap = {
    51: { title: 'Light Drizzle', nepali: 'हल्का पानी' },
    53: { title: 'Drizzle', nepali: 'पानी' },
    55: { title: 'Heavy Drizzle', nepali: 'भारी पानी' },

    61: { title: 'Light Rain', nepali: 'हल्का वर्षा' },
    63: { title: 'Moderate Rain', nepali: 'मध्यम वर्षा' },
    65: { title: 'Heavy Rain ⚠️', nepali: 'भारी वर्षा चेतावनी' },

    80: { title: 'Light Showers', nepali: 'हल्का वर्षा' },
    81: { title: 'Heavy Showers ⚠️', nepali: 'भारी वर्षा चेतावनी' },
    82: { title: 'Violent Showers ⚠️', nepali: 'अत्यन्त भारी वर्षा चेतावनी' },

    95: { title: 'Thunderstorm ⚠️', nepali: 'आँधी चेतावनी' },
    96: { title: 'Thunderstorm with Hail ⚠️', nepali: 'आँधी र असिना चेतावनी' },
    99: { title: 'Severe Hailstorm ⚠️', nepali: 'तीव्र असिना चेतावनी' },

    71: { title: 'Light Snow', nepali: 'हल्का हिमपात' },
    73: { title: 'Moderate Snow', nepali: 'मध्यम हिमपात' },
    75: { title: 'Heavy Snow ⚠️', nepali: 'भारी हिमपात चेतावनी' },
    85: { title: 'Snow Showers', nepali: 'हिमपातको वर्षा' },
    86: { title: 'Heavy Snow Showers ⚠️', nepali: 'भारी हिमपात चेतावनी' },

    0: { title: 'Clear Sky', nepali: 'आकाश सफा छ' },
    1: { title: 'Mainly Clear', nepali: 'मुख्यतः सफा' },
    2: { title: 'Partly Cloudy', nepali: 'आंशिक बादल' },
    3: { title: 'Overcast', nepali: 'बादल छाएको' },
    45: { title: 'Foggy', nepali: 'कोहरा' },
    48: { title: 'Icy Fog', nepali: 'चिसो कोहरा' },
  };

  const weatherInfo =
    nepaliWeatherMap[weatherCode] ?? {
      title: 'Weather Alert',
      nepali: 'मौसम सूचना',
    };

  const title = `${municipality}: ${weatherInfo.title}`;
  const nepaliTitle = `${municipality}: ${weatherInfo.nepali}`;

  let body = '';
  let nepaliBody = '';

  if ([65, 81, 82].includes(weatherCode)) {
    body = `Heavy rain expected in ${municipality}. Please stay safe and avoid unnecessary travel.`;
    nepaliBody = `${municipality} मा भारी वर्षा हुने सम्भावना छ। कृपया सुरक्षित रहनुहोस् र अनावश्यक यात्रा नगर्नुहोस्।`;
  } 
  else if ([95, 96, 99].includes(weatherCode)) {
    body = `Thunderstorm warning in ${municipality}. Seek shelter immediately.`;
    nepaliBody = `${municipality} मा आँधीको चेतावनी छ। तुरुन्त आश्रय लिनुहोस्।`;
  } 
  else if ([75, 85, 86].includes(weatherCode)) {
    body = `Heavy snow expected in ${municipality}. Roads may be blocked.`;
    nepaliBody = `${municipality} मा भारी हिमपात हुने सम्भावना छ। सडकहरू अवरुद्ध हुन सक्छन्।`;
  } 
  else {
    body = `Current weather in ${municipality}: ${weatherInfo.title}`;
    nepaliBody = `${municipality} को मौसम: ${weatherInfo.nepali}`;
  }

  return { title, nepaliTitle, body, nepaliBody };
}

/**
 * Morning weather summary
 */
export function getMorningNepaliWeather(weatherCode, maxTemp, minTemp, municipality) {
  const nepaliWeatherMap = {
    0: 'आकाश सफा छ',
    1: 'मुख्यतः सफा',
    2: 'आंशिक बादल',
    3: 'बादल छाएको',
    45: 'कोहरा',
    48: 'चिसो कोहरा',
    51: 'हल्का पानी',
    53: 'पानी',
    55: 'भारी पानी',
    61: 'हल्का वर्षा',
    63: 'मध्यम वर्षा',
    65: 'भारी वर्षा',
    71: 'हल्का हिमपात',
    73: 'मध्यम हिमपात',
    75: 'भारी हिमपात',
    80: 'हल्का वर्षा',
    81: 'भारी वर्षा',
    82: 'अत्यन्त भारी वर्षा',
    85: 'हिमपातको वर्षा',
    86: 'भारी हिमपात',
    95: 'आँधी',
    96: 'आँधी र असिना',
    99: 'तीव्र असिना',
  };

  const nepaliWeather = nepaliWeatherMap[weatherCode] ?? 'मौसम सामान्य छ';

  return {
    title: `${municipality} - Morning Weather Update`,
    nepaliTitle: `${municipality} - आजको मौसम`,
    body: `Good morning! Expected high: ${maxTemp}°C, Low: ${minTemp}°C. Weather: ${nepaliWeather}`,
    nepaliBody: `शुभ प्रभात! अधिकतम तापमान: ${maxTemp}°C, न्यूनतम: ${minTemp}°C। मौसम: ${nepaliWeather}`,
  };
}

/**
 * Severity messages
 */
export function getSeverityMessage(severity) {
  const messages = {
    normal: {
      en: 'Weather is normal. Stay safe.',
      nepali: 'मौसम सामान्य छ। सुरक्षित रहनुहोस्।',
    },
    warning: {
      en: 'Weather warning active. Exercise caution.',
      nepali: 'मौसम चेतावनी सक्रिय छ। सावधान रहनुहोस्।',
    },
    emergency: {
      en: 'Emergency weather alert! Seek shelter immediately.',
      nepali: 'आपतकालीन मौसम चेतावनी! तुरुन्त आश्रय लिनुहोस्।',
    },
  };

  return messages[severity] ?? messages.normal;
}