import { useState, useEffect, useRef, useCallback } from 'react';
import * as topojson from 'topojson-client';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import { fetchWeather } from './utils/weather';
import { runWeatherSystem } from './utils/weatherSystem';
import './utils/weatherDebug'; // Loads debug console utilities


// localStorage key for the persistent notification municipality
const SAVED_MUNICIPALITY_KEY = 'selectedMunicipality';

export default function App() {
  // ── Data state ───────────────────────────────────────────────────────────
  const [provinceData, setProvinceData]         = useState(null);
  const [districtData, setDistrictData]         = useState(null);
  const [municipalityData, setMunicipalityData] = useState(null);
  const [dataLoading, setDataLoading]           = useState(true);
  const [dataError, setDataError]               = useState(null);

  // ── Province drill-down (map state) ─────────────────────────────────────
  const [selectedProvince, setSelectedProvince] = useState(null);

  // ── VIEW LOCATION (temporary – map click or search) ──────────────────────
  // Used only to display weather; never saved to localStorage for FCM.
  const [viewLocation, setViewLocation] = useState(null);

  // ── SAVED MUNICIPALITY (persistent – notification target) ─────────────────
  // Persisted in localStorage('selectedMunicipality').
  // ONLY this location triggers FCM push notifications.
  const [savedMunicipality, setSavedMunicipality] = useState(() => {
    try {
      const raw = localStorage.getItem(SAVED_MUNICIPALITY_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // ── Weather state (for the VIEW location) ───────────────────────────────
  const [weather, setWeather]               = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const mapRef = useRef(null);

  // ── Load TopoJSON files from /public/data/ ────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [provRes, distRes, muniRes] = await Promise.all([
          fetch('/data/province.topojson'),
          fetch('/data/district.topojson'),
          fetch('/data/municipality.topojson'),
        ]);

        if (!provRes.ok || !distRes.ok || !muniRes.ok) {
          throw new Error(
            'One or more TopoJSON files could not be loaded. ' +
            'Please place province.topojson, district.topojson, and ' +
            'municipality.topojson inside the public/data/ folder.'
          );
        }

        const [provTopo, distTopo, muniTopo] = await Promise.all([
          provRes.json(),
          distRes.json(),
          muniRes.json(),
        ]);

        setProvinceData(topojson.feature(provTopo, provTopo.objects.collection));
        setDistrictData(topojson.feature(distTopo, distTopo.objects.collection));
        setMunicipalityData(topojson.feature(muniTopo, muniTopo.objects.collection));
        setDataLoading(false);
      } catch (err) {
        console.error(err);
        setDataError(err.message);
        setDataLoading(false);
      }
    }
    load();
  }, []);

  // ── Fetch weather whenever VIEW location changes ──────────────────────────
  useEffect(() => {
    if (!viewLocation?.centroid) {
      setWeather(null);
      return;
    }

    setWeatherLoading(true);
    setWeather(null);

    const [lat, lon] = viewLocation.centroid;

    fetchWeather(lat, lon)
      .then((data) => {
        setWeather(data);
        setWeatherLoading(false);
      })
      .catch((err) => {
        console.error('Weather API error:', err);
        setWeatherLoading(false);
      });
  }, [viewLocation]);

  // ── Smart Weather Alert System (uses SAVED municipality only) ────────────
  useEffect(() => {
    // Run weather system immediately on app load
    runWeatherSystem().then((result) => {
      if (result.action !== 'none') {
        console.log('🌤️ Weather System Result:', result);
      }
    });

    // Set up periodic checks every 5 minutes (300,000 ms) for frontend simulation
    const intervalId = setInterval(() => {
      runWeatherSystem().then((result) => {
        if (result.action !== 'none') {
          console.log('🌤️ Weather System Result:', result);
        }
      });
    }, 300000);

    return () => clearInterval(intervalId);
  }, []);

  // ── Firebase Initialization & Messaging ────────────────────────────────────
  // ── Browser Notification Permission Request ────────────────────────────────
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log(`Browser notification permission status: ${permission}`);
      });
    }
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  /** Province click – map drill-down only, clears view location */
  const handleProvinceClick = useCallback((feature) => {
    setSelectedProvince(feature);
    setViewLocation(null);
    setWeather(null);
  }, []);

  /**
   * Municipality click from MAP or SearchBar.
   * Sets VIEW LOCATION only – does NOT touch localStorage / savedMunicipality.
   */
  const handleViewLocationSelect = useCallback((properties, centroid) => {
    if (!properties) {
      setViewLocation(null);
      setWeather(null);
      return;
    }

    const location = { ...properties, centroid };
    setViewLocation(location);

    if (mapRef.current && centroid) {
      mapRef.current.setView(centroid, 13, { animate: true });
    }
  }, []);

  /**
   * Save a municipality as the user's personal notification location.
   * Persists to localStorage, saves to Firestore under the FCM token, and re-triggers the weather system check.
   */
  /**
   * Save a municipality as the user's personal notification location.
   * Persists to localStorage, requests Notification permission, and re-triggers the weather system check.
   */
  const handleSaveMunicipality = useCallback((properties, centroid) => {
    const municipality = { ...properties, centroid };
    setSavedMunicipality(municipality);
    localStorage.setItem(SAVED_MUNICIPALITY_KEY, JSON.stringify(municipality));

    // Request browser permission if needed
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('🔔 Native Notification permission granted by user');
        }
      });
    }

    // Trigger weather system check immediately
    runWeatherSystem().then(() => {});

    console.log('📍 Saved municipality for notifications:', municipality.GaPa_NaPa || municipality.NAME);
  }, []);

  /**
   * Remove the saved municipality.
   * Clears localStorage and stops scheduled alerts.
   */
  const handleRemoveSavedMunicipality = useCallback(() => {
    setSavedMunicipality(null);
    localStorage.removeItem(SAVED_MUNICIPALITY_KEY);

    // Trigger weather system to reflect the removal
    runWeatherSystem().then(() => {});

    console.log('🗑️ Saved municipality removed');
  }, []);


  /** Back to province overview */
  const handleBack = useCallback(() => {
    setSelectedProvince(null);
    setViewLocation(null);
    setWeather(null);
    if (mapRef.current) {
      mapRef.current.setView([28.2, 84.0], 7, { animate: true });
    }
  }, []);

  // ── Loading screen ────────────────────────────────────────────────────────
  if (dataLoading) {
    return (
      <div className="splash-screen">
        <div className="splash-content">
          <div className="splash-flag">🇳🇵</div>
          <h1 className="splash-title">Nepal Weather GIS</h1>
          <p className="splash-sub">Loading geographic data…</p>
          <div className="splash-loader">
            <div className="splash-bar" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error screen ──────────────────────────────────────────────────────────
  if (dataError) {
    return (
      <div className="splash-screen error">
        <div className="splash-content">
          <div className="splash-flag">⚠️</div>
          <h1 className="splash-title">Data Not Found</h1>
          <p className="error-message">{dataError}</p>
          <div className="error-steps">
            <p><strong>Quick fix:</strong></p>
            <ol>
              <li>Create the folder: <code>public/data/</code></li>
              <li>Place these 3 files inside it:
                <ul>
                  <li><code>province.topojson</code></li>
                  <li><code>district.topojson</code></li>
                  <li><code>municipality.topojson</code></li>
                </ul>
              </li>
              <li>Refresh the page</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <div className="app-layout">
      {/* Map area */}
      <div className="map-area">
        {(selectedProvince || viewLocation) && (
          <SearchBar
            municipalityData={municipalityData}
            provinceData={provinceData}
            onMunicipalitySelect={handleViewLocationSelect}
            setSelectedProvince={setSelectedProvince}
            mapRef={mapRef}
          />
        )}

        {selectedProvince && (
          <button className="map-back-btn" onClick={handleBack}>
            ← All Provinces
          </button>
        )}

        <MapView
          provinceData={provinceData}
          districtData={districtData}
          municipalityData={municipalityData}
          selectedProvince={selectedProvince}
          // Pass viewLocation so the map highlights the currently-viewed muni
          selectedMunicipality={viewLocation}
          // savedMunicipality is shown with a distinct pin on the map
          savedMunicipality={savedMunicipality}
          onProvinceClick={handleProvinceClick}
          // Map clicks → view only, no save
          onMunicipalityClick={handleViewLocationSelect}
          mapRef={mapRef}
        />
      </div>

      {/* Sidebar */}
      <Sidebar
        selectedProvince={selectedProvince}
        // Sidebar shows weather for viewLocation
        viewLocation={viewLocation}
        // For legacy display (breadcrumb, name)
        selectedMunicipality={viewLocation}
        weather={weather}
        weatherLoading={weatherLoading}
        onBack={handleBack}
        municipalityData={municipalityData}
        // View-only select (from search inside sidebar)
        onMunicipalitySelect={handleViewLocationSelect}
        // My Municipality (FCM target)
        savedMunicipality={savedMunicipality}
        onSaveMunicipality={handleSaveMunicipality}
        onRemoveSavedMunicipality={handleRemoveSavedMunicipality}
      />
    </div>
  );
}
