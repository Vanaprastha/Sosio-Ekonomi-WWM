'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const COLOR_SCALES = [
  '#ecfeff',
  '#cffafe',
  '#a5f3fc',
  '#67e8f9',
  '#22d3ee',
  '#06b6d4',
  '#0891b2',
  '#155e75',
];

function getColor(value, min, max) {
  if (max === min) return COLOR_SCALES[4];
  const ratio = (value - min) / (max - min);
  const index = Math.min(Math.floor(ratio * COLOR_SCALES.length), COLOR_SCALES.length - 1);
  return COLOR_SCALES[index];
}

function formatValue(value, format) {
  if (value == null) return '-';
  if (format === 'number') return value.toLocaleString('id-ID');
  if (format === 'currency') return 'Rp ' + Math.round(value).toLocaleString('id-ID');
  if (format === 'ratio') return value.toFixed(2);
  if (format === 'percent') return value.toFixed(1) + '%';
  if (format === 'decimal') return value.toFixed(2);
  return value;
}

function getMetricExplanation(metricKey) {
  switch (metricKey) {
    case 'ipdb2025':
      return 'IPDB mengukur potensi daya beli relatif kecamatan. Nilai 100 = setara rata-rata kota. Di atas 100 = daya beli lebih tinggi dari rata-rata.';
    case 'population':
      return 'Jumlah penduduk yang berdomisili di kecamatan menurut data BPS.';
    case 'expenditure':
      return 'Estimasi pengeluaran per kapita per bulan berdasarkan pendekatan sosial-demografi (IPDB × Pengeluaran Kota ÷ 100).';
    case 'iks':
      return 'Indeks Kesejahteraan Sosial. Skala 0-100, semakin tinggi semakin sejahtera komposisi penduduknya.';
    case 'dependencyRatio':
      return 'Rasio penduduk non-produktif (anak + lansia) terhadap penduduk usia produktif (15-64 tahun). Semakin rendah semakin baik.';
    case 'sexRatio':
      return 'Jumlah laki-laki per 100 perempuan. Nilai 100 berarti jumlah laki-laki dan perempuan seimbang.';
    default:
      return '';
  }
}

export default function MapView({
  geoData,
  socioData,
  selectedKecamatan,
  selectedMetric,
  onKecamatanSelect,
  onMetricChange,
  metrics,
}) {
  const geoJsonRef = useRef(null);
  const mapRef = useRef(null);

  // Compute min/max values for the selected metric across all kecamatan
  const { minValue, maxValue } = useMemo(() => {
    if (!socioData) return { minValue: 0, maxValue: 1 };

    const values = Object.values(socioData)
      .map((d) => d[selectedMetric])
      .filter((v) => v != null);

    if (values.length === 0) return { minValue: 0, maxValue: 1 };

    return {
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
    };
  }, [socioData, selectedMetric]);

  // Find the current metric config
  const currentMetric = useMemo(() => {
    return metrics?.find((m) => m.key === selectedMetric) || metrics?.[0];
  }, [metrics, selectedMetric]);

  // Style each GeoJSON feature based on selected metric and selection state
  const styleFeature = useCallback(
    (feature) => {
      const name = feature.properties.NAMOBJ;
      const data = socioData?.[name];
      const value = data?.[selectedMetric];
      const fillColor = value != null ? getColor(value, minValue, maxValue) : '#cbd5e1';

      const isSelected = name === selectedKecamatan;

      return {
        fillColor,
        weight: isSelected ? 3 : 1,
        opacity: 1,
        color: isSelected ? '#f59e0b' : 'rgba(0, 0, 0, 0.2)',
        fillOpacity: isSelected ? 0.9 : 0.75,
      };
    },
    [socioData, selectedMetric, selectedKecamatan, minValue, maxValue]
  );

  // Bind permanent name label + hover tooltip + events to each feature
  const onEachFeature = useCallback(
    (feature, layer) => {
      const name = feature.properties.NAMOBJ;
      const data = socioData?.[name];
      const value = data?.[selectedMetric];
      const formatted = value != null ? formatValue(value, currentMetric?.format) : '-';
      const isSelected = name === selectedKecamatan;

      // Permanent name label on the polygon center
      const labelClass = isSelected ? 'map-label map-label-bold' : 'map-label';
      layer.bindTooltip(name, {
        permanent: true,
        direction: 'center',
        className: labelClass,
      });

      // Extra info for hover popup
      let extraInfo = '';
      if (data) {
        if (selectedMetric === 'ipdb2025' && data.kategoriIPDB) {
          extraInfo = `<div class="tooltip-extra">Kategori: ${data.kategoriIPDB}</div>`;
        } else if (selectedMetric === 'expenditure') {
          extraInfo = `<div class="tooltip-extra">Per bulan</div>`;
        }
      }

      const popupContent = `
        <div class="map-tooltip">
          <div class="tooltip-name">${name}</div>
          <div class="tooltip-value">${currentMetric?.label || selectedMetric}: ${formatted}</div>
          ${extraInfo}
        </div>
      `;

      layer.bindPopup(popupContent, {
        className: 'map-popup-wrapper',
        closeButton: false,
        autoPan: false,
      });

      layer.on({
        mouseover: (e) => {
          const target = e.target;
          if (target.feature.properties.NAMOBJ !== selectedKecamatan) {
            target.setStyle({
              weight: 3,
              color: 'rgba(0, 0, 0, 0.5)',
            });
          }
          target.bringToFront();
          target.openPopup();
        },
        mouseout: (e) => {
          const target = e.target;
          if (target.feature.properties.NAMOBJ !== selectedKecamatan) {
            target.setStyle({
              weight: 1,
              color: 'rgba(0, 0, 0, 0.2)',
            });
          }
          target.closePopup();
        },
        click: () => {
          onKecamatanSelect(name);
        },
      });
    },
    [socioData, selectedMetric, selectedKecamatan, currentMetric, onKecamatanSelect]
  );

  // Fly to selected kecamatan bounds
  useEffect(() => {
    if (!mapRef.current || !geoJsonRef.current || !selectedKecamatan) return;

    const map = mapRef.current;
    const geoJsonLayer = geoJsonRef.current;

    let targetLayer = null;
    geoJsonLayer.eachLayer((layer) => {
      if (layer.feature?.properties?.NAMOBJ === selectedKecamatan) {
        targetLayer = layer;
      }
    });

    if (targetLayer) {
      const bounds = targetLayer.getBounds();
      map.flyToBounds(bounds, {
        padding: [50, 50],
        duration: 0.8,
        maxZoom: 14,
      });
    }
  }, [selectedKecamatan]);

  // Reset map view when no kecamatan selected
  useEffect(() => {
    if (!mapRef.current || selectedKecamatan) return;
    mapRef.current.flyTo([-7.275, 112.745], 12, { duration: 0.8 });
  }, [selectedKecamatan]);

  // Build gradient string for the legend
  const gradientStyle = useMemo(() => {
    return {
      background: `linear-gradient(to right, ${COLOR_SCALES.join(', ')})`,
    };
  }, []);

  // Format min/max for legend
  const formattedMin = formatValue(minValue, currentMetric?.format);
  const formattedMax = formatValue(maxValue, currentMetric?.format);

  if (!geoData) return null;

  return (
    <>
      <MapContainer
        center={[-7.275, 112.745]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <GeoJSON
          key={`${selectedMetric}-${selectedKecamatan || 'none'}`}
          ref={geoJsonRef}
          data={geoData}
          style={styleFeature}
          onEachFeature={onEachFeature}
        />
      </MapContainer>

      {/* Metric Selector Overlay */}
      <div className="map-metric-selector">
        {metrics?.map((metric) => (
          <button
            key={metric.key}
            className={`map-metric-btn ${selectedMetric === metric.key ? 'active' : ''}`}
            onClick={() => onMetricChange(metric.key)}
            title={metric.label}
          >
            <span>{metric.icon}</span> {metric.label}
          </button>
        ))}
      </div>

      {/* Legend Overlay */}
      <div className="map-legend">
        <div className="map-legend-explanation">
          {getMetricExplanation(selectedMetric)}
        </div>
        <div className="map-legend-title">{currentMetric?.label || 'Metrik'}</div>
        <div className="map-legend-gradient" style={gradientStyle} />
        <div className="map-legend-labels">
          <span>{formattedMin}</span>
          <span>{formattedMax}</span>
        </div>
      </div>
    </>
  );
}
