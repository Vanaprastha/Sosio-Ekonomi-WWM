import pandas as pd
import numpy as np
import re
from pathlib import Path
from datetime import datetime
from copy import copy

# =====================================================
# PROGRAM HITUNG IPDB KECAMATAN KOTA SURABAYA 2025
# OUTPUT LANGSUNG KE EXCEL
# =====================================================
# Catatan:
# - Angka ribuan seperti 75.164 dibaca menjadi 75164.
# - Angka desimal seperti 2,55 atau 2.55 dibaca menjadi 2.55.
# - Jadi angka 2.55 tidak berubah menjadi 255.
# - Nama kolom output dibuat panjang agar mudah dipahami orang awam.
# =====================================================


# -----------------------------------------------------
# 1. Lokasi file input dan output
# -----------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent

FILE_PENGELUARAN = BASE_DIR / "pengeluaran per kapita nominal (pengeluaran rata-rata riil yang dibelanjakan masyarakat pada tahun berjalan) - 2025.csv"
FILE_USIA = BASE_DIR / "Surabaya - jumlah penduduk berdasarkan Usia & Gender - 2025.csv"
FILE_KEMISKINAN = BASE_DIR / "data kemiskinan per kecamatan,2025.csv"
FILE_PENDUDUK = BASE_DIR / "Penduduk, Laju Pertumbuhan Penduduk, Distribusi Persentase Penduduk, Kepadatan Penduduk,Menurut Kecamatan di Kota Surabaya, 2025 - Sheet1.csv"

FILE_OUTPUT = BASE_DIR / "hasil_ipdb_surabaya_2025_revisi.xlsx"


# -----------------------------------------------------
# 2. Fungsi bantu
# -----------------------------------------------------
def angka_bulat(nilai):
    """
    Untuk membaca angka bulat / ribuan.

    Contoh:
    - 2.905.004 menjadi 2905004
    - 75.164 menjadi 75164
    - 0 menjadi 0
    """
    if pd.isna(nilai):
        return np.nan

    teks = str(nilai).strip()
    teks = re.sub(r"[^0-9-]", "", teks)

    if teks in ["", "-"]:
        return np.nan

    return int(teks)


def angka_desimal(nilai):
    """
    Untuk membaca angka desimal.

    Contoh:
    - 2,55 menjadi 2.55
    - 2.55 tetap 2.55
    - -0,45 menjadi -0.45
    """
    if pd.isna(nilai):
        return np.nan

    teks = str(nilai).strip()
    teks = re.sub(r"[^0-9,.-]", "", teks)

    if teks in ["", "-", ".", ","]:
        return np.nan

    # Jika ada titik dan koma sekaligus
    if "," in teks and "." in teks:
        # Format Indonesia: 1.234,56
        if teks.rfind(",") > teks.rfind("."):
            teks = teks.replace(".", "").replace(",", ".")
        # Format internasional: 1,234.56
        else:
            teks = teks.replace(",", "")

    # Jika hanya ada koma, koma dianggap desimal
    elif "," in teks:
        teks = teks.replace(",", ".")

    # Jika hanya ada titik, titik tetap dianggap desimal
    return float(teks)


def nama_kecamatan_standar(nilai):
    """
    Menyamakan nama kecamatan agar data dari beberapa file bisa digabung.

    Contoh:
    - Genteng
    - GENTENG
    - Genteng

    Semuanya akan dianggap sama.
    """
    if pd.isna(nilai):
        return np.nan

    teks = str(nilai).upper().strip()
    teks = re.sub(r"[^A-Z0-9]", "", teks)

    return teks


def kategori_ipdb(nilai):
    """
    Membuat kategori IPDB berdasarkan nilai akhir IPDB.
    """
    if pd.isna(nilai):
        return np.nan
    elif nilai < 95:
        return "Rendah"
    elif nilai < 100:
        return "Sedang bawah"
    elif nilai < 105:
        return "Sedang atas"
    else:
        return "Tinggi"


def cek_file_ada(daftar_file):
    """
    Mengecek apakah semua file input sudah tersedia di folder yang sama.
    """
    file_hilang = []

    for file in daftar_file:
        if not file.exists():
            file_hilang.append(str(file))

    if file_hilang:
        pesan = "File berikut belum ditemukan:\n"
        pesan += "\n".join(file_hilang)
        raise FileNotFoundError(pesan)


def rapikan_tampilan_excel(writer, nama_sheet, dataframe):
    """
    Merapikan tampilan sheet Excel:
    - Membekukan baris judul
    - Menambahkan filter otomatis
    - Mengatur lebar kolom
    - Menebalkan header
    - Memformat angka bulat dan angka desimal
    """
    worksheet = writer.sheets[nama_sheet]

    worksheet.freeze_panes = "A2"
    worksheet.auto_filter.ref = worksheet.dimensions

    # Atur lebar kolom otomatis sederhana
    for nomor_kolom, nama_kolom in enumerate(dataframe.columns, start=1):
        huruf_kolom = worksheet.cell(row=1, column=nomor_kolom).column_letter

        panjang_maks = max(
            dataframe[nama_kolom].astype(str).map(len).max(),
            len(str(nama_kolom))
        )

        lebar = min(max(panjang_maks + 2, 15), 45)
        worksheet.column_dimensions[huruf_kolom].width = lebar

    # Format header
    for cell in worksheet[1]:
        cell.font = copy(cell.font)
        cell.font = cell.font.copy(bold=True)

    # Kolom angka bulat
    kolom_bulat = [
        "Jumlah Penduduk Miskin Ekstrem",
        "Jumlah Penduduk Miskin",
        "Jumlah Penduduk Pra Sejahtera",
        "Jumlah Penduduk Sejahtera",
        "Total Penduduk Berdasarkan Status Kesejahteraan",
        "Jumlah Penduduk Usia 0-14 Tahun",
        "Jumlah Penduduk Usia Produktif 15-64 Tahun",
        "Jumlah Penduduk Usia 65 Tahun ke Atas",
        "Estimasi Pengeluaran per Kapita per Bulan (Rupiah)",
        "Jumlah Penduduk Menurut BPS",
        "Total Penduduk Berdasarkan Usia dan Jenis Kelamin",
        "Kepadatan Penduduk (Jiwa per km²)"
    ]

    # Kolom angka desimal
    kolom_desimal = [
        "Indeks Kesejahteraan Sosial",
        "Indeks Sosial Dibanding Rata-rata Kota",
        "Rasio Ketergantungan Penduduk",
        "Faktor Penyesuaian Demografi",
        "Indeks IPDB Tahun 2025",
        "Laju Pertumbuhan Penduduk (%)",
        "Distribusi Penduduk terhadap Total Kota (%)",
        "Rasio Jenis Kelamin"
    ]

    for nomor_kolom, nama_kolom in enumerate(dataframe.columns, start=1):
        if nama_kolom in kolom_bulat:
            for row in range(2, len(dataframe) + 2):
                worksheet.cell(row=row, column=nomor_kolom).number_format = '#,##0'

        elif nama_kolom in kolom_desimal:
            for row in range(2, len(dataframe) + 2):
                worksheet.cell(row=row, column=nomor_kolom).number_format = '0.####'


def simpan_excel_aman(
    hasil_final,
    ringkasan_tertinggi,
    ringkasan_terendah,
    validasi,
    file_tujuan
):
    """
    Menyimpan hasil ke Excel.

    Jika file tujuan sedang terbuka di Excel dan tidak bisa ditimpa,
    program otomatis membuat file baru dengan tambahan waktu.
    """
    try:
        with pd.ExcelWriter(file_tujuan, engine="openpyxl") as writer:
            hasil_final.to_excel(writer, sheet_name="Hasil IPDB", index=False)
            ringkasan_tertinggi.to_excel(writer, sheet_name="10 Tertinggi", index=False)
            ringkasan_terendah.to_excel(writer, sheet_name="10 Terendah", index=False)
            validasi.to_excel(writer, sheet_name="Validasi", index=False)

            rapikan_tampilan_excel(writer, "Hasil IPDB", hasil_final)
            rapikan_tampilan_excel(writer, "10 Tertinggi", ringkasan_tertinggi)
            rapikan_tampilan_excel(writer, "10 Terendah", ringkasan_terendah)
            rapikan_tampilan_excel(writer, "Validasi", validasi)

        print(f"\nFile Excel berhasil dibuat: {file_tujuan.name}")

    except PermissionError:
        waktu = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_alternatif = file_tujuan.with_name(
            f"{file_tujuan.stem}_{waktu}{file_tujuan.suffix}"
        )

        with pd.ExcelWriter(file_alternatif, engine="openpyxl") as writer:
            hasil_final.to_excel(writer, sheet_name="Hasil IPDB", index=False)
            ringkasan_tertinggi.to_excel(writer, sheet_name="10 Tertinggi", index=False)
            ringkasan_terendah.to_excel(writer, sheet_name="10 Terendah", index=False)
            validasi.to_excel(writer, sheet_name="Validasi", index=False)

            rapikan_tampilan_excel(writer, "Hasil IPDB", hasil_final)
            rapikan_tampilan_excel(writer, "10 Tertinggi", ringkasan_tertinggi)
            rapikan_tampilan_excel(writer, "10 Terendah", ringkasan_terendah)
            rapikan_tampilan_excel(writer, "Validasi", validasi)

        print("\nFile Excel lama tidak bisa ditimpa.")
        print("Kemungkinan file sedang terbuka di Excel.")
        print(f"Sebagai gantinya, file baru dibuat: {file_alternatif.name}")


# -----------------------------------------------------
# 3. Pastikan semua file input tersedia
# -----------------------------------------------------
cek_file_ada([
    FILE_PENGELUARAN,
    FILE_USIA,
    FILE_KEMISKINAN,
    FILE_PENDUDUK
])


# -----------------------------------------------------
# 4. Baca data pengeluaran per kapita Kota Surabaya
# -----------------------------------------------------
pengeluaran = pd.read_csv(FILE_PENGELUARAN)

PENGELUARAN_KOTA_BULANAN = angka_bulat(
    pengeluaran.loc[0, "pengeluaran per kapita nominal/bulan"]
)

print("Pengeluaran per kapita nominal Kota Surabaya 2025:")
print(f"Rp{PENGELUARAN_KOTA_BULANAN:,.0f}".replace(",", "."))


# -----------------------------------------------------
# 5. Baca data kemiskinan / kesejahteraan
# -----------------------------------------------------
kemiskinan = pd.read_csv(FILE_KEMISKINAN)

kolom_status = [
    "Miskin Ekstrem",
    "Miskin",
    "Pra Sejahtera",
    "Sejahtera"
]

for kolom in kolom_status:
    kemiskinan[kolom] = kemiskinan[kolom].apply(angka_bulat)

kemiskinan["kecamatan_key"] = kemiskinan["Kecamatan"].apply(nama_kecamatan_standar)

kemiskinan["total_status"] = kemiskinan[kolom_status].sum(axis=1)

# Skor kesejahteraan:
# Miskin Ekstrem = 0
# Miskin         = 1
# Pra Sejahtera  = 2
# Sejahtera      = 3
kemiskinan["skor_kesejahteraan"] = (
    0 * kemiskinan["Miskin Ekstrem"]
    + 1 * kemiskinan["Miskin"]
    + 2 * kemiskinan["Pra Sejahtera"]
    + 3 * kemiskinan["Sejahtera"]
)

kemiskinan["IKS"] = (
    kemiskinan["skor_kesejahteraan"]
    / (3 * kemiskinan["total_status"])
) * 100

IKS_KOTA = (
    kemiskinan["skor_kesejahteraan"].sum()
    / (3 * kemiskinan["total_status"].sum())
) * 100

kemiskinan["IPDB_sosial_tanpa_demografi"] = (
    kemiskinan["IKS"] / IKS_KOTA
) * 100


# -----------------------------------------------------
# 6. Baca data usia dan jenis kelamin
# -----------------------------------------------------
usia_mentah = pd.read_csv(FILE_USIA, header=None)

baris_header = usia_mentah.index[
    usia_mentah.iloc[:, 0]
    .astype(str)
    .str.contains("KECAMATAN/KELURAHAN", na=False)
].tolist()[0]

header = usia_mentah.iloc[baris_header].tolist()

kolom_baru = [
    str(nilai).strip()
    if pd.notna(nilai) and str(nilai).strip() != ""
    else f"kolom_{i}"
    for i, nilai in enumerate(header)
]

usia = usia_mentah.iloc[baris_header + 1:].copy()
usia.columns = kolom_baru

usia = usia[usia["KECAMATAN/KELURAHAN"].notna()].copy()

# Ambil hanya baris kecamatan
usia_kecamatan = usia[
    usia["KECAMATAN/KELURAHAN"]
    .astype(str)
    .str.upper()
    .eq("KECAMATAN")
].copy()

usia_kecamatan["Kecamatan"] = usia_kecamatan["WILAYAH"].astype(str).str.strip()
usia_kecamatan["kecamatan_key"] = usia_kecamatan["Kecamatan"].apply(nama_kecamatan_standar)

kolom_usia = [
    kolom for kolom in usia_kecamatan.columns
    if re.search(r"\d|>75", kolom) and kolom != "WILAYAH"
]

for kolom in kolom_usia:
    usia_kecamatan[kolom] = usia_kecamatan[kolom].apply(angka_bulat)

kolom_usia_0_14 = [
    "'00-04'_L", "'00-04'_P",
    "'05-09'_L", "'05-09'_P",
    "'10-14'_L", "'10-14'_P"
]

kolom_usia_15_64 = [
    "'15-19'_L", "'15-19'_P",
    "'20-24'_L", "'20-24'_P",
    "'25-29'_L", "'25-29'_P",
    "'30-34'_L", "'30-34'_P",
    "'35-39'_L", "'35-39'_P",
    "'40-44'_L", "'40-44'_P",
    "'45-49'_L", "'45-49'_P",
    "'50-54'_L", "'50-54'_P",
    "'55-59'_L", "'55-59'_P",
    "'60-64'_L", "'60-64'_P"
]

kolom_usia_65_plus = [
    "'65-69'_L", "'65-69'_P",
    "'70-74'_L", "'70-74'_P",
    "'>75'_L", "'>75'_P"
]

usia_kecamatan["penduduk_0_14"] = usia_kecamatan[kolom_usia_0_14].sum(axis=1)

usia_kecamatan["penduduk_15_64"] = usia_kecamatan[kolom_usia_15_64].sum(axis=1)

usia_kecamatan["penduduk_65_plus"] = usia_kecamatan[kolom_usia_65_plus].sum(axis=1)

usia_kecamatan["total_usia_gender"] = usia_kecamatan[kolom_usia].sum(axis=1)

usia_kecamatan["rasio_ketergantungan"] = (
    (
        usia_kecamatan["penduduk_0_14"]
        + usia_kecamatan["penduduk_65_plus"]
    )
    / usia_kecamatan["penduduk_15_64"]
) * 100

RK_KOTA = (
    (
        usia_kecamatan["penduduk_0_14"].sum()
        + usia_kecamatan["penduduk_65_plus"].sum()
    )
    / usia_kecamatan["penduduk_15_64"].sum()
) * 100


# -----------------------------------------------------
# 7. Baca data penduduk BPS
# -----------------------------------------------------
penduduk = pd.read_csv(FILE_PENDUDUK)

penduduk["kecamatan_key"] = penduduk["Kecamatan"].apply(nama_kecamatan_standar)

# Buang baris total kota jika ada
penduduk = penduduk[
    ~penduduk["Kecamatan"]
    .astype(str)
    .str.upper()
    .str.contains("TOTAL|KOTA SURABAYA", na=False)
].copy()

penduduk["penduduk_bps"] = penduduk["Jumlah Penduduk (jiwa)"].apply(angka_bulat)

penduduk["laju_pertumbuhan_persen"] = penduduk["Laju Pertumbuhan (%)"].apply(angka_desimal)
penduduk["distribusi_penduduk_persen"] = penduduk["Distribusi Penduduk (%)"].apply(angka_desimal)
penduduk["rasio_jenis_kelamin"] = penduduk["Rasio Jenis Kelamin"].apply(angka_desimal)

penduduk["kepadatan_jiwa_km2"] = penduduk["Kepadatan (jiwa/km²)"].apply(angka_bulat)


# -----------------------------------------------------
# 8. Gabungkan data kesejahteraan, usia, dan penduduk BPS
# -----------------------------------------------------
hasil = kemiskinan.merge(
    usia_kecamatan[
        [
            "kecamatan_key",
            "penduduk_0_14",
            "penduduk_15_64",
            "penduduk_65_plus",
            "total_usia_gender",
            "rasio_ketergantungan"
        ]
    ],
    on="kecamatan_key",
    how="left"
)

hasil = hasil.merge(
    penduduk[
        [
            "kecamatan_key",
            "penduduk_bps",
            "laju_pertumbuhan_persen",
            "distribusi_penduduk_persen",
            "kepadatan_jiwa_km2",
            "rasio_jenis_kelamin"
        ]
    ],
    on="kecamatan_key",
    how="left"
)


# -----------------------------------------------------
# 9. Hitung IPDB 2025
# -----------------------------------------------------
hasil["faktor_demografi"] = (
    (1 + RK_KOTA / 100)
    / (1 + hasil["rasio_ketergantungan"] / 100)
)

hasil["IPDB_2025"] = (
    hasil["IPDB_sosial_tanpa_demografi"]
    * hasil["faktor_demografi"]
)

hasil["kategori_IPDB"] = hasil["IPDB_2025"].apply(kategori_ipdb)

hasil["estimasi_proksi_pengeluaran_bulanan"] = (
    PENGELUARAN_KOTA_BULANAN
    * hasil["IPDB_2025"]
    / 100
)


# -----------------------------------------------------
# 10. Validasi data
# -----------------------------------------------------
jumlah_kecamatan_kesejahteraan = kemiskinan["kecamatan_key"].nunique()
jumlah_kecamatan_usia = usia_kecamatan["kecamatan_key"].nunique()
jumlah_kecamatan_penduduk = penduduk["kecamatan_key"].nunique()

total_status = int(kemiskinan["total_status"].sum())
total_usia_gender = int(usia_kecamatan["total_usia_gender"].sum())
total_penduduk_bps = int(penduduk["penduduk_bps"].sum())

selisih_status_usia = (
    (
        kemiskinan["total_status"].sum()
        - usia_kecamatan["total_usia_gender"].sum()
    )
    / usia_kecamatan["total_usia_gender"].sum()
) * 100

print("\n=== VALIDASI DATA DENGAN BAHASA SEDERHANA ===")
print(f"Jumlah kecamatan pada data kesejahteraan : {jumlah_kecamatan_kesejahteraan}")
print(f"Jumlah kecamatan pada data usia          : {jumlah_kecamatan_usia}")
print(f"Jumlah kecamatan pada data penduduk      : {jumlah_kecamatan_penduduk}")
print()
print(f"Total penduduk dari status kesejahteraan : {total_status:,}".replace(",", "."))
print(f"Total penduduk dari data usia/gender     : {total_usia_gender:,}".replace(",", "."))
print(f"Total penduduk dari data BPS             : {total_penduduk_bps:,}".replace(",", "."))
print(f"Selisih status kesejahteraan vs usia     : {selisih_status_usia:.3f}%")
print(f"IKS Kota                                 : {IKS_KOTA:.4f}")
print(f"Rasio Ketergantungan Kota                : {RK_KOTA:.4f}")

kolom_cek_gabung = [
    "rasio_ketergantungan",
    "penduduk_bps"
]

data_tidak_tergabung = hasil[
    hasil[kolom_cek_gabung].isna().any(axis=1)
]

if data_tidak_tergabung.empty:
    status_gabung = "Semua kecamatan berhasil tergabung."
    print(f"\n{status_gabung}")
else:
    status_gabung = "Ada kecamatan yang belum berhasil tergabung."
    print(f"\nPERINGATAN: {status_gabung}")
    print(
        data_tidak_tergabung[
            [
                "Kecamatan",
                "kecamatan_key"
            ]
        ].to_string(index=False)
    )


# -----------------------------------------------------
# 11. Rapikan output akhir dengan nama kolom internal
# -----------------------------------------------------
kolom_output = [
    "Kecamatan",
    "Miskin Ekstrem",
    "Miskin",
    "Pra Sejahtera",
    "Sejahtera",
    "total_status",
    "IKS",
    "IPDB_sosial_tanpa_demografi",
    "penduduk_0_14",
    "penduduk_15_64",
    "penduduk_65_plus",
    "rasio_ketergantungan",
    "faktor_demografi",
    "IPDB_2025",
    "kategori_IPDB",
    "estimasi_proksi_pengeluaran_bulanan",
    "penduduk_bps",
    "total_usia_gender",
    "laju_pertumbuhan_persen",
    "distribusi_penduduk_persen",
    "kepadatan_jiwa_km2",
    "rasio_jenis_kelamin"
]

hasil_final = hasil[kolom_output].copy()

# Pembulatan hanya untuk hasil perhitungan
kolom_hasil_perhitungan = [
    "IKS",
    "IPDB_sosial_tanpa_demografi",
    "rasio_ketergantungan",
    "faktor_demografi",
    "IPDB_2025"
]

for kolom in kolom_hasil_perhitungan:
    hasil_final[kolom] = hasil_final[kolom].round(4)

hasil_final["estimasi_proksi_pengeluaran_bulanan"] = (
    hasil_final["estimasi_proksi_pengeluaran_bulanan"]
    .round()
    .astype("Int64")
)

# Urutkan dari IPDB tertinggi ke terendah
hasil_final = hasil_final.sort_values("IPDB_2025", ascending=False)


# -----------------------------------------------------
# 12. Ubah nama kolom agar mudah dipahami orang awam
# -----------------------------------------------------
nama_kolom_mudah_dipahami = {
    "Kecamatan": "Kecamatan",

    "Miskin Ekstrem": "Jumlah Penduduk Miskin Ekstrem",
    "Miskin": "Jumlah Penduduk Miskin",
    "Pra Sejahtera": "Jumlah Penduduk Pra Sejahtera",
    "Sejahtera": "Jumlah Penduduk Sejahtera",
    "total_status": "Total Penduduk Berdasarkan Status Kesejahteraan",

    "IKS": "Indeks Kesejahteraan Sosial",
    "IPDB_sosial_tanpa_demografi": "Indeks Sosial Dibanding Rata-rata Kota",

    "penduduk_0_14": "Jumlah Penduduk Usia 0-14 Tahun",
    "penduduk_15_64": "Jumlah Penduduk Usia Produktif 15-64 Tahun",
    "penduduk_65_plus": "Jumlah Penduduk Usia 65 Tahun ke Atas",

    "rasio_ketergantungan": "Rasio Ketergantungan Penduduk",
    "faktor_demografi": "Faktor Penyesuaian Demografi",

    "IPDB_2025": "Indeks IPDB Tahun 2025",
    "kategori_IPDB": "Kategori IPDB",
    "estimasi_proksi_pengeluaran_bulanan": "Estimasi Pengeluaran per Kapita per Bulan (Rupiah)",

    "penduduk_bps": "Jumlah Penduduk Menurut BPS",
    "total_usia_gender": "Total Penduduk Berdasarkan Usia dan Jenis Kelamin",
    "laju_pertumbuhan_persen": "Laju Pertumbuhan Penduduk (%)",
    "distribusi_penduduk_persen": "Distribusi Penduduk terhadap Total Kota (%)",
    "kepadatan_jiwa_km2": "Kepadatan Penduduk (Jiwa per km²)",
    "rasio_jenis_kelamin": "Rasio Jenis Kelamin"
}

hasil_final = hasil_final.rename(columns=nama_kolom_mudah_dipahami)


# -----------------------------------------------------
# 13. Buat ringkasan dan validasi untuk sheet Excel
# -----------------------------------------------------
kolom_ringkasan = [
    "Kecamatan",
    "Indeks Kesejahteraan Sosial",
    "Rasio Ketergantungan Penduduk",
    "Indeks IPDB Tahun 2025",
    "Kategori IPDB",
    "Estimasi Pengeluaran per Kapita per Bulan (Rupiah)"
]

ringkasan_tertinggi = hasil_final[kolom_ringkasan].head(10).copy()
ringkasan_terendah = hasil_final[kolom_ringkasan].tail(10).copy()

validasi = pd.DataFrame({
    "Keterangan": [
        "Pengeluaran per kapita nominal Kota Surabaya 2025",
        "Jumlah kecamatan pada data kesejahteraan",
        "Jumlah kecamatan pada data usia",
        "Jumlah kecamatan pada data penduduk",
        "Total penduduk dari status kesejahteraan",
        "Total penduduk dari data usia dan jenis kelamin",
        "Total penduduk dari data BPS",
        "Selisih status kesejahteraan dibanding data usia (%)",
        "Indeks Kesejahteraan Sosial Kota",
        "Rasio Ketergantungan Penduduk Kota",
        "Status penggabungan data"
    ],
    "Nilai": [
        PENGELUARAN_KOTA_BULANAN,
        jumlah_kecamatan_kesejahteraan,
        jumlah_kecamatan_usia,
        jumlah_kecamatan_penduduk,
        total_status,
        total_usia_gender,
        total_penduduk_bps,
        round(selisih_status_usia, 3),
        round(IKS_KOTA, 4),
        round(RK_KOTA, 4),
        status_gabung
    ]
})


# -----------------------------------------------------
# 14. Simpan output langsung ke Excel
# -----------------------------------------------------
simpan_excel_aman(
    hasil_final=hasil_final,
    ringkasan_tertinggi=ringkasan_tertinggi,
    ringkasan_terendah=ringkasan_terendah,
    validasi=validasi,
    file_tujuan=FILE_OUTPUT
)


# -----------------------------------------------------
# 15. Tampilkan ringkasan hasil di terminal
# -----------------------------------------------------
print("\n=== 10 Kecamatan dengan IPDB Tertinggi ===")
print(
    ringkasan_tertinggi
    .to_string(index=False)
)

print("\n=== 10 Kecamatan dengan IPDB Terendah ===")
print(
    ringkasan_terendah
    .to_string(index=False)
)