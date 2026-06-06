import { getWeatherInfo, SHORT_DAYS, windDirection } from '../utils/weather';
import LocationSelector from './LocationSelector';

const PROVINCE_NAMES = {
  '1': 'Koshi Province',
  '2': 'Madhesh Province',
  '3': 'Bagmati Province',
  '4': 'Gandaki Province',
  '5': 'Lumbini Province',
  '6': 'Karnali Province',
  '7': 'Sudurpashchim Province',
};

const PROVINCE_COLORS = [
  '#e74c3c','#e67e22','#f1c40f','#27ae60',
  '#2980b9','#8e44ad','#1abc9c',
];

// ── Small sub-components ─────────────────────────────────────────────────────

function StatCard({ icon, label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

function ForecastRow({ date, index, maxT, minT, code, rain }) {
  const d = new Date(date);
  const day = index === 0 ? 'Today' : SHORT_DAYS[d.getDay()];
  const { icon } = getWeatherInfo(code);
  return (
    <div className="forecast-row">
      <span className="forecast-day">{day}</span>
      <span className="forecast-icon">{icon}</span>
      <div className="forecast-bar-wrap">
        <div className="forecast-bar">
          <div
            className="forecast-bar-fill"
            style={{ width: `${Math.min(100, Math.round(maxT + 10))}%` }}
          />
        </div>
      </div>
      <div className="forecast-temps">
        <span className="temp-max">{Math.round(maxT)}°</span>
        <span className="temp-min">{Math.round(minT)}°</span>
      </div>
      {rain > 0 && <span className="forecast-rain">💧{rain}mm</span>}
    </div>
  );
}

// ── Main Sidebar ─────────────────────────────────────────────────────────────

export default function Sidebar({
  selectedProvince,
  // viewLocation = the temporary map/search location (for weather display)
  viewLocation,
  // selectedMunicipality kept for backward-compat (same as viewLocation)
  selectedMunicipality,
  weather,
  weatherLoading,
  onBack,
  municipalityData,
  onMunicipalitySelect,
  // My Municipality (FCM notification target)
  savedMunicipality,
  onSaveMunicipality,
  onRemoveSavedMunicipality,
}) {
  // Use viewLocation if provided, fall back to selectedMunicipality
  const activeMuni = viewLocation || selectedMunicipality;

  const provNum = String(
    activeMuni?.Province ??
    activeMuni?.STATE_CODE ??
    selectedProvince?.properties?.PROVINCE ??
    ''
  );
  const provColor = PROVINCE_COLORS[(parseInt(provNum) - 1) % PROVINCE_COLORS.length];

  return (
    <aside className="sidebar">
      {/* ── Header ── */}
      <div className="sidebar-header">
        <div className="header-logo">
          <span className="flag-emoji">🇳🇵</span>
          <div>
            <div className="header-title">Nepal Weather GIS</div>
            <div className="header-sub">Interactive Dashboard</div>
          </div>
        </div>
        {selectedProvince && (
          <button className="back-btn-sidebar" onClick={onBack} aria-label="Back to all provinces">
            ← Back
          </button>
        )}
      </div>

      {/* ── My Municipality (always visible, notification target) ── */}
      {municipalityData && (
        <div className="sidebar-section my-muni-section">
          <LocationSelector
            municipalityData={municipalityData}
            savedMunicipality={savedMunicipality}
            onSave={onSaveMunicipality}
            onRemove={onRemoveSavedMunicipality}
          />
        </div>
      )}

      {/* ── Welcome state ── */}
      {!selectedProvince && !activeMuni && (
        <div className="welcome-panel">
          <div className="welcome-icon">🗺️</div>
          <h2 className="welcome-title">Select Location</h2>
          <p className="welcome-desc">
            Search for a municipality or click on the map to view weather.
          </p>

          <div className="stats-row">
            <div className="stat-pill">
              <span className="pill-num">7</span>
              <span className="pill-lbl">Provinces</span>
            </div>
            <div className="stat-pill">
              <span className="pill-num">77</span>
              <span className="pill-lbl">Districts</span>
            </div>
            <div className="stat-pill">
              <span className="pill-num">753</span>
              <span className="pill-lbl">Municipalities</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Province selected, no municipality yet ── */}
      {selectedProvince && !activeMuni && (
        <div className="province-panel">
          <div className="province-badge" style={{ background: provColor }}>
            Province {selectedProvince.properties.PROVINCE}
          </div>
          <h2 className="province-name">
            {PROVINCE_NAMES[String(selectedProvince.properties.PROVINCE)] ||
              selectedProvince.properties.PR_NAME}
          </h2>
          <p className="province-hint">
            Click any municipality on the map to view its weather.
          </p>
        </div>
      )}

      {/* ── Municipality (view location) selected ── */}
      {activeMuni && (
        <div className="location-panel">
          {/* View-only badge */}
          <div className="view-only-badge">
            <span>👁️</span> Viewing weather only
          </div>

          <div className="location-breadcrumb">
            <span style={{ color: provColor }}>
              {PROVINCE_NAMES[provNum] || `Province ${provNum}`}
            </span>
            <span className="breadcrumb-sep">›</span>
            <span>{activeMuni.DISTRICT}</span>
          </div>

          <h2 className="location-name">{activeMuni.GaPa_NaPa}</h2>

          <div className="location-meta">
            <span className="type-badge">{activeMuni.Type_GN}</span>
            {activeMuni.centroid && (
              <span className="coords">
                {activeMuni.centroid[0].toFixed(3)}°N &nbsp;
                {activeMuni.centroid[1].toFixed(3)}°E
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Weather loading ── */}
      {weatherLoading && (
        <div className="weather-loading">
          <div className="weather-spinner" />
          <span>Fetching weather…</span>
        </div>
      )}

      {/* ── Current weather ── */}
      {weather && activeMuni && !weatherLoading && (
        <div className="weather-panel">
          <div className="current-weather-card">
            <div className="cw-left">
              <div className="cw-temp">
                {Math.round(weather.current.temperature_2m)}
                <span className="cw-unit">°C</span>
              </div>
              <div className="cw-desc">
                {getWeatherInfo(weather.current.weather_code).label}
              </div>
              <div className="cw-feels">
                Feels like {Math.round(weather.current.apparent_temperature)}°C
              </div>
            </div>
            <div className="cw-right">
              <div className="cw-icon">
                {getWeatherInfo(weather.current.weather_code).icon}
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <StatCard
              icon="💧"
              label="Humidity"
              value={`${weather.current.relative_humidity_2m}%`}
            />
            <StatCard
              icon="💨"
              label="Wind"
              value={`${weather.current.wind_speed_10m} km/h ${windDirection(weather.current.wind_direction_10m)}`}
            />
            {weather.current.precipitation > 0 && (
              <StatCard
                icon="🌧️"
                label="Precipitation"
                value={`${weather.current.precipitation} mm`}
              />
            )}
          </div>

          {/* 7-day forecast */}
          <div className="forecast-panel">
            <div className="forecast-title">7-Day Forecast</div>
            <div className="forecast-list">
              {weather.daily?.time?.map((date, i) => (
                <ForecastRow
                  key={date}
                  date={date}
                  index={i}
                  maxT={weather.daily.temperature_2m_max[i]}
                  minT={weather.daily.temperature_2m_min[i]}
                  code={weather.daily.weather_code[i]}
                  rain={weather.daily.precipitation_sum?.[i] ?? 0}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <div className="footer-text">
          Weather · <a href="https://open-meteo.com" target="_blank" rel="noreferrer">Open-Meteo</a>
          &nbsp;·&nbsp;
          Map · <a href="https://www.openstreetmap.org" target="_blank" rel="noreferrer">OpenStreetMap</a>
        </div>
      </div>
    </aside>
  );
}
