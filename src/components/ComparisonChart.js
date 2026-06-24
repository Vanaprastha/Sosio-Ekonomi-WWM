'use client';

import { useMemo, useEffect, useRef } from 'react';

function capitalize(name) {
  return name
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value, format) {
  if (value == null) return '-';
  switch (format) {
    case 'number':
      return value.toLocaleString('id-ID');
    case 'currency':
      return 'Rp ' + Math.round(value).toLocaleString('id-ID');
    case 'ratio':
      return value.toFixed(2);
    case 'percent':
      return value.toFixed(1) + '%';
    case 'decimal':
      return value.toFixed(2);
    default:
      return String(value);
  }
}

export default function ComparisonChart({
  socioData,
  selectedMetric,
  selectedKecamatan,
  onKecamatanSelect,
  metrics,
}) {
  const containerRef = useRef(null);
  const activeRowRef = useRef(null);

  const currentMetric = metrics.find((m) => m.key === selectedMetric);
  const metricFormat = currentMetric?.format || 'number';
  const metricLabel = currentMetric?.label || selectedMetric;

  const sortedData = useMemo(() => {
    if (!socioData) return [];

    return Object.entries(socioData)
      .map(([name, data]) => ({
        name,
        value: data[selectedMetric] ?? 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [socioData, selectedMetric]);

  const maxValue = useMemo(() => {
    if (sortedData.length === 0) return 1;
    return Math.max(...sortedData.map((d) => d.value), 1);
  }, [sortedData]);

  useEffect(() => {
    if (activeRowRef.current && containerRef.current) {
      activeRowRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedKecamatan]);

  return (
    <div className="comparison-chart">
      <div className="chart-title">Perbandingan Kecamatan</div>
      <div className="chart-subtitle">{metricLabel}</div>

      <div
        className="comparison-bar-container"
        ref={containerRef}
        style={{ maxHeight: '500px', overflowY: 'auto' }}
      >
        {sortedData.map((item, index) => {
          const isActive =
            selectedKecamatan &&
            item.name.toUpperCase() === selectedKecamatan.toUpperCase();
          const widthPct = (item.value / maxValue) * 100;

          return (
            <div
              key={item.name}
              ref={isActive ? activeRowRef : null}
              className={`comparison-bar-row${isActive ? ' active' : ''}`}
              onClick={() => onKecamatanSelect(item.name)}
            >
              <div className="comparison-rank">{index + 1}</div>
              <div className="comparison-name" title={item.name}>
                {capitalize(item.name)}
              </div>
              <div className="comparison-bar-track">
                <div
                  className="comparison-bar-fill"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <div className="comparison-bar-value">
                {formatValue(item.value, metricFormat)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
