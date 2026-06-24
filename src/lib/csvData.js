'use client';

import Papa from 'papaparse';

/**
 * Parse the IPDB CSV data and return structured data for all components.
 * ALL values come directly from the CSV — no recalculation.
 */

// Helper: parse Indonesian number format (e.g. "75.164" → 75164, "99,1685" → 99.1685)
function parseNumber(val) {
  if (val == null || val === '' || val === '-') return null;
  let s = String(val).trim();
  
  // If contains comma as decimal separator (Indonesian format like "99,1685")
  if (s.includes(',') && s.includes('.')) {
    // e.g. "3.099.119" with comma → thousands separator is dot
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  } else if ((s.match(/\./g) || []).length > 1) {
    // Multiple dots = thousands separator (e.g. "3.099.119")
    s = s.replace(/\./g, '');
  }
  
  const num = Number(s);
  return isNaN(num) ? null : num;
}

// Age group columns in order
const AGE_GROUPS = [
  '00-04', '05-09', '10-14', '15-19', '20-24', '25-29',
  '30-34', '35-39', '40-44', '45-49', '50-54', '55-59',
  '60-64', '65-69', '70-74', '>75'
];

export async function loadCSVData() {
  const response = await fetch('/data/ipdb_data.csv');
  const csvText = await response.text();
  
  // Parse CSV — first row is header, second row is sub-header for age groups
  const parsed = Papa.parse(csvText, {
    header: false,
    skipEmptyLines: true,
  });
  
  const rows = parsed.data;
  if (rows.length < 3) return null;
  
  // Row 0 = main headers, Row 1 = age sub-headers, Row 2+ = data
  const mainHeaders = rows[0];
  const dataRows = rows.slice(2); // skip header + sub-header
  
  const result = {};
  
  dataRows.forEach((row) => {
    const name = (row[0] || '').trim();
    if (!name) return;
    
    // Main IPDB columns (indices based on CSV structure)
    const entry = {
      // Basic info
      kecamatan: name,
      
      // Welfare data (from CSV directly)
      miskinEkstrem: parseNumber(row[1]),
      miskin: parseNumber(row[2]),
      praSejahtera: parseNumber(row[3]),
      sejahtera: parseNumber(row[4]),
      totalStatusKesejahteraan: parseNumber(row[5]),
      
      // IPDB calculated values (from CSV, NOT recalculated)
      iks: parseNumber(row[6]),
      indeksSosial: parseNumber(row[7]),
      
      // Age demographics
      pendudukUsia0_14: parseNumber(row[8]),
      pendudukUsia15_64: parseNumber(row[9]),
      pendudukUsia65Plus: parseNumber(row[10]),
      
      // IPDB core
      rasioKetergantungan: parseNumber(row[11]),
      faktorDemografi: parseNumber(row[12]),
      ipdb2025: parseNumber(row[13]),
      kategoriIPDB: (row[14] || '').trim(),
      estimasiPengeluaran: parseNumber(row[15]),
      
      // BPS data
      pendudukBPS: parseNumber(row[16]),
      totalUsiaDanGender: parseNumber(row[17]),
      lajuPertumbuhan: parseNumber(row[18]),
      distribusiPenduduk: parseNumber(row[19]),
      kepadatanPenduduk: parseNumber(row[20]),
      rasioJenisKelamin: parseNumber(row[21]),
      
      // Age pyramid data
      agePyramid: [],
    };
    
    // Parse age pyramid columns (starting at index 22)
    // Each age group has 2 columns: Male, Female
    let colIdx = 22;
    AGE_GROUPS.forEach((ageGroup) => {
      const male = parseNumber(row[colIdx]) || 0;
      const female = parseNumber(row[colIdx + 1]) || 0;
      entry.agePyramid.push({ ageGroup, male, female });
      colIdx += 2;
    });
    
    // Compute totalMale / totalFemale from pyramid
    let totalMale = 0;
    let totalFemale = 0;
    entry.agePyramid.forEach(({ male, female }) => {
      totalMale += male;
      totalFemale += female;
    });
    entry.totalMale = totalMale;
    entry.totalFemale = totalFemale;
    
    // Population = from BPS or total gender
    entry.population = entry.pendudukBPS || entry.totalUsiaDanGender || (totalMale + totalFemale);
    
    // Productive age percentage
    if (entry.pendudukUsia15_64 && entry.population) {
      entry.productiveAgePct = parseFloat(((entry.pendudukUsia15_64 / entry.population) * 100).toFixed(1));
    } else {
      entry.productiveAgePct = null;
    }
    
    entry.productiveAge = entry.pendudukUsia15_64;
    
    // For map/chart compatibility
    entry.expenditure = entry.estimasiPengeluaran;
    entry.sexRatio = entry.rasioJenisKelamin;
    entry.dependencyRatio = entry.rasioKetergantungan;
    
    result[name] = entry;
  });
  
  return result;
}

/**
 * Get city-level aggregates for KPI display.
 * These are simple sums/averages of CSV data — NOT recalculating IPDB.
 */
export function getCityAggregates(data) {
  if (!data) return null;
  
  const entries = Object.values(data);
  const count = entries.length;
  if (count === 0) return null;
  
  const totalPopulation = entries.reduce((s, d) => s + (d.population || 0), 0);
  const avgIPDB = entries.reduce((s, d) => s + (d.ipdb2025 || 0), 0) / count;
  const avgIKS = entries.reduce((s, d) => s + (d.iks || 0), 0) / count;
  const avgExpenditure = entries.reduce((s, d) => s + (d.expenditure || 0), 0) / count;
  const avgDependencyRatio = entries.reduce((s, d) => s + (d.dependencyRatio || 0), 0) / count;
  const avgSexRatio = entries.reduce((s, d) => s + (d.sexRatio || 0), 0) / count;
  const totalProductiveAge = entries.reduce((s, d) => s + (d.productiveAge || 0), 0);
  const avgProductiveAgePct = entries.reduce((s, d) => s + (d.productiveAgePct || 0), 0) / count;
  
  // Category counts
  const categories = { Tinggi: 0, 'Sedang atas': 0, 'Sedang bawah': 0, Rendah: 0 };
  entries.forEach((d) => {
    if (categories[d.kategoriIPDB] !== undefined) {
      categories[d.kategoriIPDB]++;
    }
  });
  
  return {
    totalPopulation,
    avgIPDB,
    avgIKS,
    avgExpenditure,
    avgDependencyRatio,
    avgSexRatio,
    totalProductiveAge,
    avgProductiveAgePct,
    categories,
    count,
  };
}
