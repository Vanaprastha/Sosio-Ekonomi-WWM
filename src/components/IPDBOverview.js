'use client';

import { useMemo } from 'react';

const CATEGORY_COLORS = {
  'Tinggi': { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
  'Sedang atas': { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
  'Sedang bawah': { bg: '#fef9c3', text: '#854d0e', border: '#fde68a' },
  'Rendah': { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
};

function getCategoryStyle(kategori) {
  return CATEGORY_COLORS[kategori] || { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
}

function capitalize(name) {
  return name
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function IPDBOverview({ socioData, selectedKecamatan, onKecamatanSelect }) {
  const sortedData = useMemo(() => {
    if (!socioData) return [];
    return Object.entries(socioData)
      .map(([name, data]) => ({
        name,
        ipdb: data.ipdb2025 || 0,
        kategori: data.kategoriIPDB || '',
        iks: data.iks || 0,
        expenditure: data.estimasiPengeluaran || 0,
      }))
      .sort((a, b) => b.ipdb - a.ipdb);
  }, [socioData]);

  const maxIPDB = useMemo(() => {
    if (sortedData.length === 0) return 110;
    return Math.max(...sortedData.map((d) => d.ipdb), 110);
  }, [sortedData]);

  const minIPDB = useMemo(() => {
    if (sortedData.length === 0) return 90;
    return Math.min(...sortedData.map((d) => d.ipdb), 90);
  }, [sortedData]);

  // Category summary
  const categoryCounts = useMemo(() => {
    const counts = { 'Tinggi': 0, 'Sedang atas': 0, 'Sedang bawah': 0, 'Rendah': 0 };
    sortedData.forEach((d) => {
      if (counts[d.kategori] !== undefined) counts[d.kategori]++;
    });
    return counts;
  }, [sortedData]);

  return (
    <div className="ipdb-overview">
      <div className="chart-title">Ranking IPDB Kecamatan 2025</div>
      <div className="chart-subtitle">
        Indeks Potensi Daya Beli — {sortedData.length} Kecamatan Kota Surabaya
      </div>

      {/* Category badges */}
      <div className="ipdb-category-summary">
        {Object.entries(categoryCounts).map(([cat, count]) => {
          const style = getCategoryStyle(cat);
          return (
            <div
              key={cat}
              className="ipdb-category-badge"
              style={{
                background: style.bg,
                color: style.text,
                border: `1px solid ${style.border}`,
              }}
            >
              <span className="ipdb-badge-count">{count}</span>
              <span className="ipdb-badge-label">{cat}</span>
            </div>
          );
        })}
      </div>

      {/* Ranking bars */}
      <div className="ipdb-ranking-list">
        {sortedData.map((item, index) => {
          const isActive =
            selectedKecamatan &&
            item.name.toUpperCase() === selectedKecamatan.toUpperCase();
          const catStyle = getCategoryStyle(item.kategori);
          const barWidth = ((item.ipdb - minIPDB + 2) / (maxIPDB - minIPDB + 2)) * 100;

          return (
            <div
              key={item.name}
              className={`ipdb-rank-row ${isActive ? 'active' : ''}`}
              onClick={() => onKecamatanSelect(item.name)}
            >
              <div className="ipdb-rank-num">{index + 1}</div>
              <div className="ipdb-rank-name">{capitalize(item.name)}</div>
              <div className="ipdb-rank-bar-track">
                <div
                  className="ipdb-rank-bar-fill"
                  style={{
                    width: `${barWidth}%`,
                    background: `linear-gradient(90deg, ${catStyle.border}, ${catStyle.text}40)`,
                  }}
                />
              </div>
              <div className="ipdb-rank-value">{item.ipdb.toFixed(2)}</div>
              <div
                className="ipdb-rank-badge"
                style={{
                  background: catStyle.bg,
                  color: catStyle.text,
                  border: `1px solid ${catStyle.border}`,
                }}
              >
                {item.kategori}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
