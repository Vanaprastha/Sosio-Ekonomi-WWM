'use client';

const METRIC_COLORS = {
  ipdb2025: 'var(--accent-amber)',
  population: 'var(--accent-cyan)',
  expenditure: 'var(--accent-emerald)',
  iks: 'var(--accent-purple)',
  dependencyRatio: 'var(--accent-pink)',
  sexRatio: 'var(--accent-blue)',
};

export default function Sidebar({
  metrics,
  selectedMetric,
  onMetricChange,
  isOpen,
  onShowFormula,
}) {
  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      {/* Brand */}
      <div className="brand">
        <div className="brand-icon">📊</div>
        <div className="brand-text">
          <h1>IPDB Surabaya</h1>
          <p>Dashboard Sosio-Ekonomi 2025</p>
        </div>
      </div>

      {/* Formula Guide Button */}
      {onShowFormula && (
        <button className="formula-guide-btn" onClick={onShowFormula}>
          <span>📐</span>
          <span>Lihat Panduan Rumus IPDB</span>
        </button>
      )}

      {/* Metric Selector */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">METRIK PETA</div>
        <div className="metric-btn-group">
          {metrics.map((metric) => (
            <button
              key={metric.key}
              className={`metric-btn${selectedMetric === metric.key ? ' active' : ''}`}
              onClick={() => onMetricChange(metric.key)}
            >
              <span
                className="metric-btn-icon"
                style={{
                  backgroundColor: METRIC_COLORS[metric.key] || 'var(--accent-cyan)',
                }}
              >
                {metric.icon}
              </span>
              <span className="metric-btn-label">{metric.label}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
