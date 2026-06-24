import './globals.css';

export const metadata = {
  title: 'Dashboard IPDB Kota Surabaya 2025 | Indeks Potensi Daya Beli',
  description:
    'Dashboard interaktif Indeks Potensi Daya Beli (IPDB) 31 Kecamatan Kota Surabaya 2025. Visualisasi data sosio-ekonomi, ranking kecamatan, dan panduan rumus perhitungan.',
  keywords: [
    'Surabaya',
    'IPDB',
    'Indeks Potensi Daya Beli',
    'dashboard',
    'sosio-ekonomi',
    'kecamatan',
    '2025',
  ],
  authors: [{ name: 'WWM Analytics' }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
