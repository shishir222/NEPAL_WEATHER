import { useState, useMemo, useRef, useEffect } from 'react';
import { computeCentroid } from '../utils/topoUtils';

export default function SearchBar({
  municipalityData,
  provinceData,
  onMunicipalitySelect,
  setSelectedProvince,
  mapRef,
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const results = useMemo(() => {
    if (!query.trim() || !municipalityData) return [];
    const q = query.toLowerCase().trim();
    return municipalityData.features
      .filter((f) => f.properties.GaPa_NaPa?.toLowerCase().includes(q))
      .slice(0, 10);
  }, [query, municipalityData]);

  const handleSelect = (feature) => {
    const props = feature.properties;
    const centroid = computeCentroid(feature.geometry);

    // Auto-select the province first so the municipality layer renders
    if (provinceData) {
      const provNum = String(props.Province ?? props.STATE_CODE);
      const prov = provinceData.features.find(
        (p) => String(p.properties.PROVINCE) === provNum
      );
      if (prov) setSelectedProvince(prov);
    }

    // Slight delay lets province state propagate before selecting municipality
    setTimeout(() => {
      onMunicipalitySelect(props, centroid);
      if (mapRef?.current) {
        mapRef.current.setView(centroid, 13, { animate: true });
      }
    }, 120);

    setQuery(props.GaPa_NaPa || '');
    setOpen(false);
  };

  return (
    <div className="search-container" ref={containerRef}>
      <div className="search-box">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          id="municipality-search"
          type="text"
          placeholder="Search municipality…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query && setOpen(true)}
          autoComplete="off"
          className="search-input"
        />
        {query && (
          <button
            className="search-clear"
            onClick={() => { setQuery(''); setOpen(false); }}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="search-dropdown" role="listbox">
          {results.map((f, i) => (
            <button
              key={i}
              className="search-item"
              role="option"
              onClick={() => handleSelect(f)}
            >
              <div className="search-item-name">{f.properties.GaPa_NaPa}</div>
              <div className="search-item-meta">
                <span className="search-tag">{f.properties.Type_GN}</span>
                <span>{f.properties.DISTRICT}</span>
                <span>Province {f.properties.Province}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.trim() && results.length === 0 && (
        <div className="search-dropdown search-no-result">
          No municipalities found for "{query}"
        </div>
      )}
    </div>
  );
}
