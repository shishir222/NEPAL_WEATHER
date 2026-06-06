import { useState, useEffect, useRef } from 'react';
import { runWeatherSystem } from '../utils/weatherSystem';

/**
 * LocationSelector — "My Municipality" panel
 *
 * This component manages ONLY the user's saved personal municipality
 * (used for FCM push notifications). It is completely separate from
 * the view/map location.
 *
 * Props:
 * - municipalityData: GeoJSON FeatureCollection
 * - savedMunicipality: currently saved municipality object or null
 * - onSave: function(properties, centroid) => void
 * - onRemove: function() => void
 */
export default function LocationSelector({
  municipalityData,
  savedMunicipality,
  onSave,
  onRemove,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [filtered, setFiltered] = useState([]);
  const searchRef = useRef(null);

  const allMunicipalities = municipalityData?.features?.map((f) => ({
    name: f.properties?.GaPa_NaPa || f.properties?.NAME || 'Unknown',
    district: f.properties?.DISTRICT || f.properties?.District || '',
    province: f.properties?.Province || f.properties?.STATE_CODE || '',
    properties: f.properties,
    centroid: f.properties?.centroid || [28.2, 84.0],
  })) || [];

  // Filter based on search input
  useEffect(() => {
    const q = (searchInput || '').trim().toLowerCase();
    if (!q) {
      setFiltered([]);
      return;
    }
    const list = allMunicipalities.filter((m) =>
      m.name.toLowerCase().includes(q) ||
      m.district.toLowerCase().includes(q)
    );
    setFiltered(list.slice(0, 80));
  }, [searchInput, municipalityData]);

  // Auto-focus search when panel opens
  useEffect(() => {
    if (isExpanded && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [isExpanded]);

  const savedName = savedMunicipality?.GaPa_NaPa
    || savedMunicipality?.NAME
    || savedMunicipality?.name
    || null;

  const savedDistrict = savedMunicipality?.DISTRICT
    || savedMunicipality?.District
    || '';

  const handleSelect = (m) => {
    onSave?.(m.properties, m.centroid);
    setSearchInput('');
    setFiltered([]);
    setIsExpanded(false);
    runWeatherSystem().then(() => {});
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove?.();
    setSearchInput('');
    setFiltered([]);
    runWeatherSystem().then(() => {});
  };

  const handleToggle = () => {
    setIsExpanded((v) => !v);
    if (isExpanded) {
      setSearchInput('');
      setFiltered([]);
    }
  };

  const isSelected = (m) => {
    if (!savedMunicipality) return false;
    return (
      savedMunicipality.GaPa_NaPa === m.properties.GaPa_NaPa ||
      savedMunicipality.NAME === m.name
    );
  };

  return (
    <div className="my-muni-panel">
      {/* ── Header strip ── */}
      <div className="my-muni-header" onClick={handleToggle} role="button" tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleToggle()}>
        <div className="my-muni-header-left">
          <span className="my-muni-bell">🔔</span>
          <div>
            <div className="my-muni-label">My Municipality</div>
            <div className="my-muni-value">
              {savedName
                ? <><span className="my-muni-pin">📍</span> {savedName}{savedDistrict && <span className="my-muni-district">, {savedDistrict}</span>}</>
                : <span className="my-muni-none">No municipality selected</span>
              }
            </div>
          </div>
        </div>
        <div className="my-muni-header-right">
          {savedName && (
            <button
              className="my-muni-remove-btn"
              onClick={handleRemove}
              title="Remove municipality"
              aria-label="Remove municipality"
            >
              ✕
            </button>
          )}
          <span className={`my-muni-chevron ${isExpanded ? 'open' : ''}`}>›</span>
        </div>
      </div>

      {/* ── Notification note ── */}
      {savedName && !isExpanded && (
        <div className="my-muni-active-note">
          <span>🔔</span> Weather alerts will be sent for <strong>{savedName}</strong>
        </div>
      )}

      {/* ── Expandable search panel ── */}
      {isExpanded && (
        <div className="my-muni-body">
          <p className="my-muni-hint">
            Select your municipality to receive push notification weather alerts.
            This location is separate from the map view.
          </p>

          {/* Search field */}
          <div className="location-search-box">
            <span className="location-search-icon">🔎</span>
            <input
              ref={searchRef}
              className="location-search-field"
              placeholder="Search municipality or district…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search municipality"
            />
            {searchInput && (
              <button
                className="location-clear-button"
                onClick={() => { setSearchInput(''); setFiltered([]); }}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Results */}
          {filtered.length > 0 && (
            <div className="location-filtered-list" style={{ marginTop: 8 }}>
              {filtered.map((m) => {
                const sel = isSelected(m);
                return (
                  <button
                    key={`${m.name}-${m.district}`}
                    onClick={() => handleSelect(m)}
                    className={`location-list-item ${sel ? 'selected' : ''}`}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div className="location-item-main">{m.name}</div>
                      {m.district && <div className="location-item-meta">{m.district}</div>}
                    </div>
                    {sel && <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1rem' }}>✓</div>}
                  </button>
                );
              })}
              <div className="location-result-count">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}

          {searchInput && filtered.length === 0 && (
            <div className="location-no-results" style={{ marginTop: 8 }}>
              No municipalities found for "{searchInput}"
            </div>
          )}

          {!searchInput && (
            <div className="my-muni-prompt">
              Type a municipality or district name to search
            </div>
          )}
        </div>
      )}
    </div>
  );
}
