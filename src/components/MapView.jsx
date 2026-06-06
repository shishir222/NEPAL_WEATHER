import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { computeCentroid } from '../utils/topoUtils';

// ─── Province colour palette (7 provinces) ───────────────────────────────────
const PROVINCE_COLORS = [
  '#e74c3c', // Province 1 – red
  '#e67e22', // Province 2 – orange
  '#f1c40f', // Province 3 – yellow
  '#27ae60', // Province 4 – green
  '#2980b9', // Province 5 – blue
  '#8e44ad', // Province 6 – purple
  '#1abc9c', // Province 7 – teal
];

const PROVINCE_NAMES = {
  1: 'Koshi Province',
  2: 'Madhesh Province',
  3: 'Bagmati Province',
  4: 'Gandaki Province',
  5: 'Lumbini Province',
  6: 'Karnali Province',
  7: 'Sudurpashchim Province',
};

export default function MapView({
  provinceData,
  districtData,
  municipalityData,
  selectedProvince,
  selectedMunicipality,
  onProvinceClick,
  onMunicipalityClick,
  mapRef,
}) {
  const containerRef = useRef(null);
  const mapInstance = useRef(null);
  const layers = useRef({ province: null, district: null, municipality: null });

  // ── 1. Initialise Leaflet map once ─────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapInstance.current) return;

    const map = L.map(containerRef.current, {
      center: [28.2, 84.0],
      zoom: 7,
      minZoom: 6,
      maxZoom: 16,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Tile layer – CartoDB Positron (clean, light style)
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }
    ).addTo(map);

    mapInstance.current = map;
    if (mapRef) mapRef.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // ── 2. Province layer ───────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !provinceData) return;

    if (layers.current.province) {
      map.removeLayer(layers.current.province);
      layers.current.province = null;
    }

    if (selectedProvince) return; // hide when a province is selected

    const layer = L.geoJSON(provinceData, {
      style: (f) => ({
        fillColor: PROVINCE_COLORS[(f.properties.PROVINCE - 1) % PROVINCE_COLORS.length],
        weight: 2.5,
        opacity: 1,
        color: '#ffffff',
        fillOpacity: 0.65,
      }),
      onEachFeature: (feature, lyr) => {
        const provNum = feature.properties.PROVINCE;
        const name = PROVINCE_NAMES[provNum] || feature.properties.PR_NAME || `Province ${provNum}`;

        lyr.bindTooltip(
          `<div class="map-tooltip"><strong>${name}</strong></div>`,
          { sticky: true, className: 'leaflet-tooltip-custom' }
        );

        lyr.on({
          mouseover(e) {
            e.target.setStyle({ fillOpacity: 0.85, weight: 3.5 });
            e.target.bringToFront();
          },
          mouseout(e) {
            layer.resetStyle(e.target);
          },
          click() {
            onProvinceClick(feature);
          },
        });
      },
    }).addTo(map);

    layers.current.province = layer;

    // Fit Nepal bounds
    try {
      map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    } catch (_) { /* ignore */ }
  }, [provinceData, selectedProvince]);

  // ── 3. Municipality layer (filtered by selected province) ───────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Remove old municipality layer
    if (layers.current.municipality) {
      map.removeLayer(layers.current.municipality);
      layers.current.municipality = null;
    }
    if (layers.current.district) {
      map.removeLayer(layers.current.district);
      layers.current.district = null;
    }

    if (!selectedProvince || !municipalityData) return;

    const provNum = String(selectedProvince.properties.PROVINCE);

    // Filter municipalities for this province
    const filteredFeatures = municipalityData.features.filter(
      (f) =>
        String(f.properties.Province) === provNum ||
        String(f.properties.STATE_CODE) === provNum
    );

    if (!filteredFeatures.length) return;

    const filteredGeo = { ...municipalityData, features: filteredFeatures };

    const muniLayer = L.geoJSON(filteredGeo, {
      style: (f) => ({
        fillColor: selectedMunicipality?.GaPa_NaPa === f.properties.GaPa_NaPa
          ? '#ff6b35'
          : '#4a90d9',
        weight: 0.8,
        opacity: 0.9,
        color: '#1a5276',
        fillOpacity:
          selectedMunicipality?.GaPa_NaPa === f.properties.GaPa_NaPa ? 0.85 : 0.3,
      }),
      onEachFeature: (feature, lyr) => {
        const { GaPa_NaPa, Type_GN, DISTRICT } = feature.properties;
        lyr.bindTooltip(
          `<div class="map-tooltip">
            <strong>${GaPa_NaPa || 'Unknown'}</strong>
            <span>${Type_GN || ''}</span>
            <span>${DISTRICT || ''}</span>
          </div>`,
          { sticky: true, className: 'leaflet-tooltip-custom' }
        );

        lyr.on({
          mouseover(e) {
            const isSelected =
              selectedMunicipality?.GaPa_NaPa === feature.properties.GaPa_NaPa;
            e.target.setStyle({
              fillOpacity: isSelected ? 0.95 : 0.65,
              weight: 1.8,
            });
            e.target.bringToFront();
          },
          mouseout(e) {
            const isSelected =
              selectedMunicipality?.GaPa_NaPa === feature.properties.GaPa_NaPa;
            e.target.setStyle({
              fillOpacity: isSelected ? 0.85 : 0.3,
              weight: 0.8,
            });
          },
          click() {
            const centroid = computeCentroid(feature.geometry);
            onMunicipalityClick(feature.properties, centroid);
          },
        });
      },
    }).addTo(map);

    layers.current.municipality = muniLayer;

    // District boundary overlay (outlines only, no properties)
    if (districtData) {
      const distLayer = L.geoJSON(districtData, {
        style: {
          fillColor: 'transparent',
          weight: 1.8,
          color: '#1a3a5c',
          opacity: 0.5,
          fillOpacity: 0,
        },
        interactive: false,
      }).addTo(map);
      layers.current.district = distLayer;
    }

    // Zoom to province bounds
    const bounds = muniLayer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30], animate: true, duration: 0.8 });
    }
  }, [municipalityData, selectedProvince]);

  // ── 4. Highlight selected municipality ──────────────────────────────────────
  useEffect(() => {
    const muniLayer = layers.current.municipality;
    if (!muniLayer) return;

    muniLayer.eachLayer((lyr) => {
      const props = lyr.feature?.properties;
      if (!props) return;
      const isSelected = selectedMunicipality?.GaPa_NaPa === props.GaPa_NaPa;
      lyr.setStyle({
        fillColor: isSelected ? '#ff6b35' : '#4a90d9',
        fillOpacity: isSelected ? 0.85 : 0.3,
        weight: isSelected ? 2.5 : 0.8,
        color: isSelected ? '#c0392b' : '#1a5276',
      });
      if (isSelected) lyr.bringToFront();
    });
  }, [selectedMunicipality]);

  return (
    <div ref={containerRef} id="map-container" style={{ height: '100%', width: '100%' }} />
  );
}
