'use client';

import { useMemo } from 'react';

export default function PopulationPyramid({ socioData, selectedKecamatan }) {
  const {
    pyramidData,
    maxValue,
    totalMale,
    totalFemale,
    maxMale,
    minMale,
    maxFemale,
    minFemale,
  } = useMemo(() => {
    if (!socioData) {
      return {
        pyramidData: [],
        maxValue: 1,
        totalMale: 0,
        totalFemale: 0,
        maxMale: 0,
        minMale: 0,
        maxFemale: 0,
        minFemale: 0,
      };
    }

    let ageGroups;

    if (selectedKecamatan && socioData[selectedKecamatan]) {
      ageGroups = socioData[selectedKecamatan].agePyramid || [];
    } else {
      // Aggregate all kecamatan data
      const aggregated = {};

      Object.values(socioData).forEach((kecData) => {
        if (!kecData.agePyramid) return;
        kecData.agePyramid.forEach(({ ageGroup, male, female }) => {
          if (!aggregated[ageGroup]) {
            aggregated[ageGroup] = { ageGroup, male: 0, female: 0 };
          }
          aggregated[ageGroup].male += male;
          aggregated[ageGroup].female += female;
        });
      });

      ageGroups = Object.values(aggregated);
    }

    // Reverse so oldest is at top, youngest at bottom
    const reversed = [...ageGroups].reverse();

    let max = 1;
    let sumMale = 0;
    let sumFemale = 0;

    let minMale = Infinity, maxMale = -Infinity;
    let minFemale = Infinity, maxFemale = -Infinity;

    reversed.forEach(({ male, female }) => {
      if (male > max) max = male;
      if (female > max) max = female;
      
      if (male > maxMale) maxMale = male;
      if (male < minMale) minMale = male;
      if (female > maxFemale) maxFemale = female;
      if (female < minFemale) minFemale = female;

      sumMale += male;
      sumFemale += female;
    });

    return {
      pyramidData: reversed,
      maxValue: max,
      totalMale: sumMale,
      totalFemale: sumFemale,
      maxMale,
      minMale,
      maxFemale,
      minFemale,
    };
  }, [socioData, selectedKecamatan]);

  const displayName = selectedKecamatan
    ? selectedKecamatan
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
    : 'Seluruh Kota Surabaya';

  return (
    <div className="population-pyramid">
      <div className="chart-title">Piramida Jumlah Penduduk Berdasarkan Usia</div>
      <div className="chart-subtitle">
        {displayName} — Laki-laki: {totalMale.toLocaleString('id-ID')} | Perempuan:{' '}
        {totalFemale.toLocaleString('id-ID')} | Total: {(totalMale + totalFemale).toLocaleString('id-ID')} jiwa
      </div>

      <div className="pyramid-chart">
        {pyramidData.map(({ ageGroup, male, female }) => {
          const maleWidth = (male / maxValue) * 100;
          const femaleWidth = (female / maxValue) * 100;

          const isMaxMale = male === maxMale && male > 0;
          const isMinMale = male === minMale;
          const isMaxFemale = female === maxFemale && female > 0;
          const isMinFemale = female === minFemale;

          return (
            <div className="pyramid-row" key={ageGroup}>
              <div className="pyramid-bar-container pyramid-bar-male">
                <div
                  className={`pyramid-bar male ${isMaxMale || isMinMale ? 'highlighted' : ''}`}
                  style={{ width: `${maleWidth}%` }}
                >
                  <span
                    className="pyramid-bar-value"
                    style={{
                      opacity: isMaxMale || isMinMale ? 1 : undefined,
                      fontWeight: isMaxMale || isMinMale ? 700 : 400,
                      color: isMaxMale ? '#fff' : (isMinMale ? 'var(--text-muted)' : undefined),
                      // If max (long bar), keep text inside the right edge.
                      // If min (short bar), keep text outside the left edge of the bar (which is right aligned)
                      right: isMaxMale ? '4px' : (isMinMale ? 'calc(100% + 4px)' : undefined),
                      left: isMaxMale ? 'auto' : undefined
                    }}
                  >
                    {male.toLocaleString('id-ID')}
                    {isMaxMale && ' (Tertinggi)'}
                    {isMinMale && ' (Terendah)'}
                  </span>
                </div>
              </div>
              <div className="pyramid-label">{ageGroup}</div>
              <div className="pyramid-bar-container pyramid-bar-female">
                <div
                  className={`pyramid-bar female ${isMaxFemale || isMinFemale ? 'highlighted' : ''}`}
                  style={{ width: `${femaleWidth}%` }}
                >
                  <span
                    className="pyramid-bar-value"
                    style={{
                      opacity: isMaxFemale || isMinFemale ? 1 : undefined,
                      fontWeight: isMaxFemale || isMinFemale ? 700 : 400,
                      color: isMaxFemale ? '#fff' : (isMinFemale ? 'var(--text-muted)' : undefined),
                      // If max (long bar), keep text inside the left edge.
                      // If min (short bar), keep text outside the right edge of the bar (which is left aligned)
                      left: isMaxFemale ? '4px' : (isMinFemale ? 'calc(100% + 4px)' : undefined),
                      right: isMaxFemale ? 'auto' : undefined
                    }}
                  >
                    {female.toLocaleString('id-ID')}
                    {isMaxFemale && ' (Tertinggi)'}
                    {isMinFemale && ' (Terendah)'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pyramid-legend" style={{ flexWrap: 'wrap' }}>
        <div className="pyramid-legend-item">
          <span
            className="pyramid-legend-dot"
            style={{ background: 'var(--accent-blue)' }}
          />
          Laki-laki (L)
        </div>
        <div className="pyramid-legend-item">
          <span
            className="pyramid-legend-dot"
            style={{ background: 'var(--accent-pink)' }}
          />
          Perempuan (P)
        </div>
      </div>
      <div className="pyramid-legend" style={{ marginTop: 4, paddingTop: 0, borderTop: 'none' }}>
        <div className="pyramid-legend-item" style={{ fontSize: '0.7rem' }}>
          * Nilai tertinggi dan terendah dari masing-masing gender ditampilkan secara permanen pada grafik.
        </div>
      </div>
    </div>
  );
}
