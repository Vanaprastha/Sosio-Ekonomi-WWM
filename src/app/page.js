'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { loadCSVData } from '@/lib/csvData';
import Sidebar from '@/components/Sidebar';
import KecamatanSelector from '@/components/KecamatanSelector';
import KPICards from '@/components/KPICards';
import PopulationPyramid from '@/components/PopulationPyramid';
import ComparisonChart from '@/components/ComparisonChart';
import DataTable from '@/components/DataTable';
import IPDBOverview from '@/components/IPDBOverview';
import FormulaGuide from '@/components/FormulaGuide';

// Dynamic import for Leaflet (no SSR)
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const METRICS = [
  { key: 'ipdb2025', label: 'IPDB 2025', icon: '💡', format: 'decimal' },
  { key: 'population', label: 'Jumlah Penduduk', icon: '👥', format: 'number' },
  { key: 'expenditure', label: 'Estimasi Pengeluaran', icon: '💰', format: 'currency' },
  { key: 'iks', label: 'Indeks Kesejahteraan', icon: '🏠', format: 'decimal' },
  { key: 'dependencyRatio', label: 'Rasio Ketergantungan', icon: '👶', format: 'percent' },
  { key: 'sexRatio', label: 'Rasio Jenis Kelamin', icon: '⚤', format: 'ratio' },
];

export default function DashboardPage() {
  const [geoData, setGeoData] = useState(null);
  const [socioData, setSocioData] = useState(null);
  const [selectedKecamatan, setSelectedKecamatan] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('ipdb2025');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showFormula, setShowFormula] = useState(false);

  // Load data from CSV
  useEffect(() => {
    Promise.all([
      fetch('/data/kecamatan.geojson').then((r) => r.json()),
      loadCSVData(),
    ])
      .then(([geo, socio]) => {
        setGeoData(geo);
        setSocioData(socio);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error loading data:', err);
        setIsLoading(false);
      });
  }, []);

  const handleKecamatanSelect = useCallback((name) => {
    setSelectedKecamatan((prev) => (prev === name ? null : name));
    setSidebarOpen(false);
  }, []);

  const handleMetricChange = useCallback((metric) => {
    setSelectedMetric(metric);
  }, []);

  if (isLoading || !geoData || !socioData) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Memuat data IPDB Surabaya...</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile sidebar toggle */}
      <button
        className="mobile-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="dashboard-layout">
        <Sidebar
          metrics={METRICS}
          selectedMetric={selectedMetric}
          onMetricChange={handleMetricChange}
          isOpen={sidebarOpen}
          onShowFormula={() => setShowFormula(true)}
        />

        <main className="main-content">
          {/* Kecamatan Selector — always visible at top */}
          <section className="animate-in" style={{ position: 'relative', zIndex: 50 }}>
            <KecamatanSelector
              socioData={socioData}
              selectedKecamatan={selectedKecamatan}
              onKecamatanSelect={handleKecamatanSelect}
            />
          </section>

          {/* Tab Navigation */}
          <nav className="tab-nav">
            <button
              className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard
            </button>
            <button
              className={`tab-btn ${activeTab === 'ipdb' ? 'active' : ''}`}
              onClick={() => setActiveTab('ipdb')}
            >
              💡 Ranking IPDB
            </button>
            <button
              className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
              onClick={() => setActiveTab('data')}
            >
              📋 Tabel Data
            </button>
            <button
              className="tab-btn formula-tab-btn"
              onClick={() => setShowFormula(true)}
            >
              📐 Rumus IPDB
            </button>
          </nav>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              {/* KPI Cards */}
              <section className="animate-in">
                <KPICards
                  socioData={socioData}
                  selectedKecamatan={selectedKecamatan}
                />
              </section>

              {/* Map */}
              <section className="animate-in animate-delay-1">
                <div className="map-container">
                  <MapView
                    geoData={geoData}
                    socioData={socioData}
                    selectedKecamatan={selectedKecamatan}
                    selectedMetric={selectedMetric}
                    onKecamatanSelect={handleKecamatanSelect}
                    onMetricChange={handleMetricChange}
                    metrics={METRICS}
                  />
                </div>
              </section>

              {/* Charts */}
              <section className="charts-grid animate-in animate-delay-2">
                <div className="chart-card">
                  <PopulationPyramid
                    socioData={socioData}
                    selectedKecamatan={selectedKecamatan}
                  />
                </div>
                <div className="chart-card">
                  <ComparisonChart
                    socioData={socioData}
                    selectedMetric={selectedMetric}
                    selectedKecamatan={selectedKecamatan}
                    onKecamatanSelect={handleKecamatanSelect}
                    metrics={METRICS}
                  />
                </div>
              </section>
            </>
          )}

          {/* IPDB Ranking Tab */}
          {activeTab === 'ipdb' && (
            <section className="animate-in">
              <div className="chart-card full-width">
                <IPDBOverview
                  socioData={socioData}
                  selectedKecamatan={selectedKecamatan}
                  onKecamatanSelect={handleKecamatanSelect}
                />
              </div>
            </section>
          )}

          {/* Data Table Tab */}
          {activeTab === 'data' && (
            <section className="animate-in">
              <div className="chart-card full-width">
                <DataTable
                  socioData={socioData}
                  selectedKecamatan={selectedKecamatan}
                  onKecamatanSelect={handleKecamatanSelect}
                />
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Formula Guide Modal */}
      <FormulaGuide
        isVisible={showFormula}
        onClose={() => setShowFormula(false)}
      />
    </>
  );
}
