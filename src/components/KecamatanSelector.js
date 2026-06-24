'use client';

import { useState, useMemo } from 'react';

const CATEGORY_STYLES = {
  'Tinggi': { bg: '#dcfce7', color: '#166534' },
  'Sedang atas': { bg: '#dbeafe', color: '#1e40af' },
  'Sedang bawah': { bg: '#fef9c3', color: '#854d0e' },
  'Rendah': { bg: '#fee2e2', color: '#991b1b' },
};

export default function KecamatanSelector({
  socioData,
  selectedKecamatan,
  onKecamatanSelect,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const kecamatanList = useMemo(() => {
    if (!socioData) return [];
    return Object.entries(socioData)
      .map(([name, data]) => ({
        name,
        ipdb: data.ipdb2025 || 0,
        kategori: data.kategoriIPDB || '',
        population: data.population || 0,
      }))
      .sort((a, b) => b.ipdb - a.ipdb);
  }, [socioData]);

  const filtered = useMemo(() => {
    if (!searchTerm) return kecamatanList;
    return kecamatanList.filter((k) =>
      k.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [kecamatanList, searchTerm]);

  const selectedData = selectedKecamatan && socioData?.[selectedKecamatan]
    ? socioData[selectedKecamatan]
    : null;

  const capitalize = (name) =>
    name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="kec-selector">
      <div className="kec-selector-header">
        <div className="kec-selector-info">
          <h2 className="kec-selector-title">
            {selectedKecamatan
              ? `📍 ${capitalize(selectedKecamatan)}`
              : '📍 Seluruh Kota Surabaya'}
          </h2>
          <p className="kec-selector-hint">
            {selectedKecamatan
              ? 'Klik tombol di bawah untuk mengganti kecamatan atau kembali ke ringkasan kota'
              : 'Pilih kecamatan di bawah untuk melihat analisis detail per wilayah'}
          </p>
        </div>

        {/* Selected kecamatan summary badge */}
        {selectedData && (
          <div className="kec-selector-badge-group">
            <div className="kec-selector-stat">
              <span className="kec-stat-label">IPDB</span>
              <span className="kec-stat-value">{selectedData.ipdb2025?.toFixed(2)}</span>
            </div>
            <div
              className="kec-selector-stat kategori"
              style={{
                background: CATEGORY_STYLES[selectedData.kategoriIPDB]?.bg || '#f1f5f9',
                color: CATEGORY_STYLES[selectedData.kategoriIPDB]?.color || '#475569',
              }}
            >
              {selectedData.kategoriIPDB}
            </div>
            <div className="kec-selector-stat">
              <span className="kec-stat-label">Penduduk</span>
              <span className="kec-stat-value">
                {selectedData.population?.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Search & dropdown */}
      <div className="kec-selector-controls">
        <div className="kec-search-row">
          <div className="kec-search-wrapper">
            <span className="kec-search-icon">🔍</span>
            <input
              type="text"
              className="kec-search-input"
              placeholder="Cari kecamatan..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
            />
            <button
              className="kec-search-toggle"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="Toggle daftar kecamatan"
            >
              {isDropdownOpen ? '▲' : '▼'}
            </button>
          </div>

          {selectedKecamatan && (
            <button
              className="kec-reset-btn"
              onClick={() => {
                onKecamatanSelect(null);
                setSearchTerm('');
                setIsDropdownOpen(false);
              }}
            >
              ✕ Reset
            </button>
          )}
        </div>

        {/* Dropdown list */}
        {isDropdownOpen && (
          <div className="kec-dropdown">
            {filtered.length === 0 ? (
              <div className="kec-dropdown-empty">
                Kecamatan tidak ditemukan
              </div>
            ) : (
              filtered.map((kec) => {
                const catStyle = CATEGORY_STYLES[kec.kategori] || {};
                const isActive =
                  selectedKecamatan &&
                  kec.name.toUpperCase() === selectedKecamatan.toUpperCase();

                return (
                  <button
                    key={kec.name}
                    className={`kec-dropdown-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onKecamatanSelect(kec.name);
                      setSearchTerm('');
                      setIsDropdownOpen(false);
                    }}
                  >
                    <span className="kec-dropdown-name">
                      {capitalize(kec.name)}
                    </span>
                    <span className="kec-dropdown-meta">
                      <span
                        className="kec-dropdown-badge"
                        style={{
                          background: catStyle.bg || '#f1f5f9',
                          color: catStyle.color || '#475569',
                        }}
                      >
                        {kec.kategori}
                      </span>
                      <span className="kec-dropdown-ipdb">
                        {kec.ipdb.toFixed(2)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
