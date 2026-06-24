'use client';

import { useState, useMemo } from 'react';

const capitalize = (name) =>
  name
    .toLowerCase()
    .split(' ')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');

const CATEGORY_STYLES = {
  'Tinggi': { bg: '#dcfce7', color: '#166534' },
  'Sedang atas': { bg: '#dbeafe', color: '#1e40af' },
  'Sedang bawah': { bg: '#fef9c3', color: '#854d0e' },
  'Rendah': { bg: '#fee2e2', color: '#991b1b' },
};

const baseColumns = [
  { key: 'name', label: 'Kecamatan' },
  { key: 'miskinEkstrem', label: 'Miskin Ekstrem' },
  { key: 'miskin', label: 'Miskin' },
  { key: 'praSejahtera', label: 'Pra Sejahtera' },
  { key: 'sejahtera', label: 'Sejahtera' },
  { key: 'totalStatusKesejahteraan', label: 'TOTAL STATUS KESEJAHTERAAN' },
  { key: 'iks', label: 'IKS (Indeks Kesejahteraan Sosial)' },
  { key: 'indeksSosial', label: 'Indeks Sosial' },
  { key: 'pendudukUsia0_14', label: '0-14 Tahun (Non-Produktif)' },
  { key: 'pendudukUsia15_64', label: '15-64 Tahun (Produktif)' },
  { key: 'pendudukUsia65Plus', label: '65+ Tahun (Non-Produktif)' },
  { key: 'rasioKetergantungan', label: 'Rasio Ketergantungan' },
  { key: 'faktorDemografi', label: 'Faktor Demografi (1 - (Rasio Ketergantungan / 100))' },
  { key: 'ipdb2025', label: 'IPDB 2025 (IKS x Faktor Demografi)' },
  { key: 'kategoriIPDB', label: 'KATEGORI IPDB 2025' },
  { key: 'estimasiPengeluaran', label: 'ESTIMASI PENGELUARAN SOSIO-DEMOGRAFI / KAPITA / BULAN (Rp)' },
  { key: 'pendudukBPS', label: 'PENDUDUK KOTA SURABAYA BPS (Bulan Tahun)' },
  { key: 'totalUsiaDanGender', label: 'TOTAL (Usia & Gender)' },
  { key: 'lajuPertumbuhan', label: 'Laju Pertumbuhan 2020-2023 (%)' },
  { key: 'distribusiPenduduk', label: 'Distribusi Penduduk (%)' },
  { key: 'kepadatanPenduduk', label: 'Kepadatan Penduduk (Jiwa/km2)' },
  { key: 'rasioJenisKelamin', label: 'Rasio Jenis Kelamin' }
];

const AGE_GROUPS = [
  '00-04', '05-09', '10-14', '15-19', '20-24', '25-29',
  '30-34', '35-39', '40-44', '45-49', '50-54', '55-59',
  '60-64', '65-69', '70-74', '>75'
];

const ageColumns = [];
AGE_GROUPS.forEach(age => {
  ageColumns.push({ key: `age_${age}_L`, label: `Laki-laki Usia ${age} Tahun` });
  ageColumns.push({ key: `age_${age}_P`, label: `Perempuan Usia ${age} Tahun` });
});

const columns = [...baseColumns, ...ageColumns];

function formatCell(key, value) {
  if (value == null || value === undefined || value === '') return '-';

  if (typeof key === 'string' && key.startsWith('age_')) {
    return Number(value).toLocaleString('id-ID');
  }

  switch (key) {
    case 'name':
      return capitalize(String(value));
    case 'kategoriIPDB':
      return value;
    case 'miskinEkstrem':
    case 'miskin':
    case 'praSejahtera':
    case 'sejahtera':
    case 'totalStatusKesejahteraan':
    case 'pendudukUsia0_14':
    case 'pendudukUsia15_64':
    case 'pendudukUsia65Plus':
    case 'pendudukBPS':
    case 'totalUsiaDanGender':
    case 'kepadatanPenduduk':
      return Number(value).toLocaleString('id-ID');
    case 'estimasiPengeluaran':
      return 'Rp ' + Math.round(Number(value)).toLocaleString('id-ID');
    case 'ipdb2025':
    case 'iks':
    case 'indeksSosial':
    case 'faktorDemografi':
      return Number(value).toFixed(4);
    case 'rasioKetergantungan':
    case 'lajuPertumbuhan':
    case 'distribusiPenduduk':
      return Number(value).toFixed(2) + '%';
    case 'rasioJenisKelamin':
      return Number(value).toFixed(2);
    default:
      return value;
  }
}

export default function DataTable({ socioData, selectedKecamatan, onKecamatanSelect }) {
  const [sortKey, setSortKey] = useState('ipdb2025');
  const [sortDir, setSortDir] = useState('desc');

  const dataArray = useMemo(() => {
    if (!socioData) return [];
    return Object.entries(socioData).map(([name, data]) => {
      const row = { name, ...data };
      if (data.agePyramid) {
        data.agePyramid.forEach(({ ageGroup, male, female }) => {
          row[`age_${ageGroup}_L`] = male;
          row[`age_${ageGroup}_P`] = female;
        });
      }
      return row;
    });
  }, [socioData]);

  const sortedData = useMemo(() => {
    const sorted = [...dataArray].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal, 'id')
          : bVal.localeCompare(aVal, 'id');
      }

      const aNum = Number(aVal) || 0;
      const bNum = Number(bVal) || 0;
      return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
    });
    return sorted;
  }, [dataArray, sortKey, sortDir]);

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  if (!socioData) return null;

  return (
    <div className="data-table-wrapper" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <div className="chart-title">Tabel Data Lengkap IPDB</div>
      <div className="chart-subtitle">
        Semua data langsung dari file CSV — {dataArray.length} Kecamatan Kota Surabaya
      </div>

      <div 
        className="table-container" 
        style={{ 
          width: '100%', 
          overflowX: 'auto', 
          overflowY: 'auto', 
          maxHeight: '600px',
          display: 'block',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <table className="data-table" style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: 40, whiteSpace: 'nowrap', padding: '12px 16px' }}>#</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={sortKey === col.key ? 'sorted' : ''}
                  onClick={() => handleSort(col.key)}
                  style={{ whiteSpace: 'nowrap', padding: '12px 16px' }}
                >
                  {col.label}
                  <span className="sort-icon">
                    {sortKey === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => {
              const catStyle = CATEGORY_STYLES[row.kategoriIPDB] || {};
              return (
                <tr
                  key={row.name}
                  className={selectedKecamatan === row.name ? 'active' : ''}
                  onClick={() => onKecamatanSelect(row.name)}
                >
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap', padding: '10px 16px' }}>{idx + 1}</td>
                  {columns.map((col) => (
                    <td key={col.key} style={{ whiteSpace: 'nowrap', padding: '10px 16px' }}>
                      {col.key === 'kategoriIPDB' ? (
                        <span
                          className="table-badge"
                          style={{
                            background: catStyle.bg || '#f1f5f9',
                            color: catStyle.color || '#475569',
                          }}
                        >
                          {row.kategoriIPDB || '-'}
                        </span>
                      ) : (
                        formatCell(col.key, row[col.key])
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
