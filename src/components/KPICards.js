'use client';

import { useState, useEffect, useMemo, useRef } from 'react';

function useAnimatedValue(targetValue, duration = 1000) {
  const [displayValue, setDisplayValue] = useState(0);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const startValueRef = useRef(0);

  useEffect(() => {
    if (targetValue == null || isNaN(targetValue)) {
      setDisplayValue(0);
      return;
    }

    startValueRef.current = 0;
    startTimeRef.current = null;

    const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);

      const current = startValueRef.current + (targetValue - startValueRef.current) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValue);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetValue, duration]);

  return displayValue;
}

function formatPopulation(value) {
  return Math.round(value).toLocaleString('id-ID');
}

function formatCurrency(value) {
  return 'Rp ' + Math.round(value).toLocaleString('id-ID');
}

function formatPercentage(value) {
  return value.toFixed(1) + '%';
}

function formatDecimal(value) {
  return value.toFixed(2);
}

function formatRatio(value) {
  return value.toFixed(2);
}

const CATEGORY_COLORS = {
  'Tinggi': '#166534',
  'Sedang atas': '#1e40af',
  'Sedang bawah': '#854d0e',
  'Rendah': '#991b1b',
};

function KPICard({ icon, label, value, sub, formatter, extraContent }) {
  const animatedValue = useAnimatedValue(value);

  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
        <span className="kpi-icon">{icon}</span>
      </div>
      <div className="kpi-value">
        {formatter(animatedValue)}
      </div>
      <div className="kpi-sub">{sub}</div>
      {extraContent}
    </div>
  );
}

export default function KPICards({ socioData, selectedKecamatan }) {
  const kpiValues = useMemo(() => {
    if (!socioData) return null;

    if (selectedKecamatan && socioData[selectedKecamatan]) {
      const d = socioData[selectedKecamatan];
      return {
        population: d.population || 0,
        populationSub: selectedKecamatan,
        ipdb: d.ipdb2025 || 0,
        kategori: d.kategoriIPDB || '-',
        iks: d.iks || 0,
        expenditure: d.expenditure || 0,
        expenditureSub: selectedKecamatan,
        dependencyRatio: d.dependencyRatio || 0,
        sexRatio: d.sexRatio || 0,
      };
    }

    // City aggregate
    const entries = Object.values(socioData);
    const count = entries.length;
    if (count === 0) return null;

    return {
      population: entries.reduce((s, d) => s + (d.population || 0), 0),
      populationSub: `${count} Kecamatan`,
      ipdb: entries.reduce((s, d) => s + (d.ipdb2025 || 0), 0) / count,
      kategori: 'Rata-rata',
      iks: entries.reduce((s, d) => s + (d.iks || 0), 0) / count,
      expenditure: entries.reduce((s, d) => s + (d.expenditure || 0), 0) / count,
      expenditureSub: 'Rata-rata Kecamatan',
      dependencyRatio: entries.reduce((s, d) => s + (d.dependencyRatio || 0), 0) / count,
      sexRatio: entries.reduce((s, d) => s + (d.sexRatio || 0), 0) / count,
    };
  }, [socioData, selectedKecamatan]);

  if (!kpiValues) return null;

  const kategoriColor = CATEGORY_COLORS[kpiValues.kategori] || '#475569';

  return (
    <div className="kpi-grid">
      <KPICard
        icon="💡"
        label="IPDB 2025"
        value={kpiValues.ipdb}
        sub={
          <span style={{ color: kategoriColor, fontWeight: 600 }}>
            {kpiValues.kategori}
          </span>
        }
        formatter={formatDecimal}
      />
      <KPICard
        icon="👥"
        label="Total Penduduk"
        value={kpiValues.population}
        sub={kpiValues.populationSub}
        formatter={formatPopulation}
      />
      <KPICard
        icon="💰"
        label="Estimasi Pengeluaran/Kapita"
        value={kpiValues.expenditure}
        sub="Per bulan (pendekatan sosial-demografi)"
        formatter={formatCurrency}
      />
      <KPICard
        icon="🏠"
        label="Indeks Kesejahteraan (IKS)"
        value={kpiValues.iks}
        sub="Skala 0–100"
        formatter={formatDecimal}
      />
      <KPICard
        icon="👶"
        label="Rasio Ketergantungan"
        value={kpiValues.dependencyRatio}
        sub="Non-produktif per 100 produktif"
        formatter={formatPercentage}
      />
      <KPICard
        icon="⚤"
        label="Rasio Jenis Kelamin"
        value={kpiValues.sexRatio}
        sub="Laki-laki per 100 Perempuan"
        formatter={formatRatio}
      />
    </div>
  );
}
