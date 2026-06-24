'use client';

import { useState } from 'react';

const FORMULAS = [
  {
    id: 'iks',
    title: 'Indeks Kesejahteraan Sosial (IKS)',
    icon: '🏠',
    description: 'Mengukur tingkat kesejahteraan penduduk berdasarkan komposisi status kemiskinan di kecamatan.',
    formula: 'IKS = (0×Miskin Ekstrem + 1×Miskin + 2×Pra Sejahtera + 3×Sejahtera) ÷ (3 × Total Penduduk) × 100',
    explanation: 'Setiap penduduk diberi skor berdasarkan status kesejahteraannya: Miskin Ekstrem = 0, Miskin = 1, Pra Sejahtera = 2, Sejahtera = 3. Skor total dibagi dengan skor maksimum yang mungkin (3 × jumlah penduduk) lalu dikali 100. Semakin tinggi IKS, semakin sejahtera penduduk di kecamatan tersebut.',
    example: 'Jika di suatu kecamatan ada 0 Miskin Ekstrem, 215 Miskin, 1.438 Pra Sejahtera, dan 73.231 Sejahtera, maka skor = (0×0 + 1×215 + 2×1.438 + 3×73.231) = 222.784. Total penduduk = 74.884. IKS = 222.784 ÷ (3 × 74.884) × 100 = 99,17.',
  },
  {
    id: 'indeks-sosial',
    title: 'Indeks Sosial Dibanding Rata-rata Kota',
    icon: '📊',
    description: 'Membandingkan IKS kecamatan dengan IKS rata-rata seluruh Kota Surabaya.',
    formula: 'Indeks Sosial = (IKS Kecamatan ÷ IKS Kota) × 100',
    explanation: 'Jika hasilnya di atas 100, berarti kecamatan tersebut lebih sejahtera dari rata-rata kota. Jika di bawah 100, berarti di bawah rata-rata.',
    example: 'Jika IKS Kecamatan Benowo = 99,17 dan IKS Kota = 95,33, maka Indeks Sosial = (99,17 ÷ 95,33) × 100 = 104,03.',
  },
  {
    id: 'rasio-ketergantungan',
    title: 'Rasio Ketergantungan Penduduk',
    icon: '👶',
    description: 'Mengukur berapa banyak penduduk non-produktif yang ditanggung oleh penduduk usia produktif.',
    formula: 'Rasio Ketergantungan = ((Usia 0-14 + Usia 65+) ÷ Usia 15-64) × 100',
    explanation: 'Usia 0-14 tahun (anak-anak) dan 65 tahun ke atas (lansia) dianggap penduduk yang belum/tidak produktif. Usia 15-64 tahun adalah usia produktif. Semakin tinggi rasio ini, semakin besar beban penduduk produktif untuk menanggung penduduk non-produktif.',
    example: 'Jika ada 17.023 anak (0-14), 54.601 produktif (15-64), dan 4.092 lansia (65+), maka rasio = ((17.023 + 4.092) ÷ 54.601) × 100 = 38,67%.',
  },
  {
    id: 'faktor-demografi',
    title: 'Faktor Penyesuaian Demografi',
    icon: '⚖️',
    description: 'Menyesuaikan indeks sosial berdasarkan perbandingan beban ketergantungan kecamatan dengan kota.',
    formula: 'Faktor Demografi = (1 + RK Kota ÷ 100) ÷ (1 + RK Kecamatan ÷ 100)',
    explanation: 'Jika rasio ketergantungan kecamatan lebih rendah dari kota, faktornya lebih dari 1 (menguntungkan). Jika lebih tinggi, faktornya di bawah 1. Ini memastikan kecamatan dengan penduduk produktif lebih banyak mendapat nilai IPDB yang lebih baik.',
    example: 'Jika RK Kota = 41,89% dan RK Kecamatan Benowo = 38,67%, maka faktor = (1 + 0,4189) ÷ (1 + 0,3867) = 1,4189 ÷ 1,3867 = 1,0232.',
  },
  {
    id: 'ipdb',
    title: 'Indeks Potensi Daya Beli (IPDB) 2025',
    icon: '💡',
    description: 'Indeks utama yang menggabungkan faktor sosial dan demografi untuk mengukur potensi daya beli relatif per kecamatan.',
    formula: 'IPDB = Indeks Sosial × Faktor Demografi',
    explanation: 'IPDB menggabungkan dua aspek: seberapa sejahtera penduduk (indeks sosial) dan seberapa produktif komposisi usianya (faktor demografi). Nilai 100 berarti setara dengan rata-rata kota.',
    example: 'Jika Indeks Sosial Benowo = 104,10 dan Faktor Demografi = 1,0248, maka IPDB = 104,10 × 1,0248 = 106,68.',
  },
  {
    id: 'estimasi-pengeluaran',
    title: 'Estimasi Pengeluaran per Kapita',
    icon: '💰',
    description: 'Memproyeksikan pengeluaran rata-rata per orang per bulan berdasarkan IPDB.',
    formula: 'Estimasi Pengeluaran = Pengeluaran per Kapita Kota × IPDB ÷ 100',
    explanation: 'Pengeluaran per kapita Kota Surabaya (dari BPS) dikalikan dengan IPDB kecamatan, lalu dibagi 100. Jika IPDB > 100, pengeluaran di atas rata-rata kota; jika < 100, di bawah rata-rata.',
    example: 'Jika pengeluaran kota = Rp 2.905.004/bulan dan IPDB Benowo = 106,68, maka estimasi = 2.905.004 × 106,68 ÷ 100 = Rp 3.099.119/bulan.',
  },
  {
    id: 'kategori',
    title: 'Kategori IPDB',
    icon: '🏷️',
    description: 'Pengelompokan kecamatan berdasarkan nilai IPDB.',
    formula: '< 95 → Rendah  |  95–99 → Sedang Bawah  |  100–104 → Sedang Atas  |  ≥ 105 → Tinggi',
    explanation: 'Kategori ini memudahkan identifikasi kecamatan mana yang memiliki daya beli tinggi dan mana yang rendah. Kecamatan dengan IPDB tinggi umumnya memiliki penduduk yang lebih sejahtera dan komposisi usia yang produktif.',
    example: 'IPDB 106,68 → Tinggi. IPDB 98,63 → Sedang Bawah. IPDB 92,87 → Rendah.',
  },
];

function AccordionItem({ item, isOpen, onToggle }) {
  return (
    <div className={`formula-item ${isOpen ? 'open' : ''}`}>
      <button className="formula-header" onClick={onToggle}>
        <div className="formula-header-left">
          <span className="formula-icon">{item.icon}</span>
          <div>
            <div className="formula-title">{item.title}</div>
            <div className="formula-desc">{item.description}</div>
          </div>
        </div>
        <span className="formula-chevron">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className="formula-body">
          <div className="formula-block">
            <div className="formula-block-label">Rumus</div>
            <div className="formula-expression">{item.formula}</div>
          </div>
          
          <div className="formula-block">
            <div className="formula-block-label">Penjelasan</div>
            <p className="formula-text">{item.explanation}</p>
          </div>
          
          <div className="formula-block example">
            <div className="formula-block-label">Contoh Perhitungan</div>
            <p className="formula-text">{item.example}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FormulaGuide({ isVisible, onClose }) {
  const [openId, setOpenId] = useState(null);
  
  if (!isVisible) return null;
  
  return (
    <div className="formula-overlay" onClick={onClose}>
      <div className="formula-panel" onClick={(e) => e.stopPropagation()}>
        <div className="formula-panel-header">
          <div>
            <h2 className="formula-panel-title">📐 Panduan Rumus IPDB</h2>
            <p className="formula-panel-subtitle">
              Penjelasan lengkap metodologi penghitungan Indeks Potensi Daya Beli Kecamatan Kota Surabaya 2025
            </p>
          </div>
          <button className="formula-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="formula-flow">
          <div className="formula-flow-label">Alur Perhitungan</div>
          <div className="formula-flow-steps">
            <span className="flow-step">Data Kesejahteraan</span>
            <span className="flow-arrow">→</span>
            <span className="flow-step">IKS</span>
            <span className="flow-arrow">→</span>
            <span className="flow-step">Indeks Sosial</span>
            <span className="flow-arrow">→</span>
            <span className="flow-step accent">IPDB</span>
            <span className="flow-arrow">←</span>
            <span className="flow-step">Faktor Demografi</span>
            <span className="flow-arrow">←</span>
            <span className="flow-step">Data Usia</span>
          </div>
        </div>
        
        <div className="formula-list">
          {FORMULAS.map((item) => (
            <AccordionItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => setOpenId(openId === item.id ? null : item.id)}
            />
          ))}
        </div>
        
        <div className="formula-footer">
          <p>Sumber metodologi: Program Hitung IPDB Kecamatan Kota Surabaya 2025</p>
        </div>
      </div>
    </div>
  );
}
