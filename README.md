# REI Work Management

Aplikasi internal untuk mengelola pekerjaan, proyek, tim, dan progres Raja Emas Indonesia.

Lihat [Panduan Pengguna REI Work Management](Panduan%20Pengguna%20REI%20Work%20Management.docx) untuk langkah penggunaan aplikasi.

## Fitur

**Perencanaan & struktur tugas**
- Tugas dengan sub-tugas (checklist berurutan), prioritas Rendah–Mendesak, label kategori berwarna, tanggal mulai & tenggat.
- Penanggung jawab utama, anggota pelaksana tambahan, dan pengamat (tag rekan).
- Dependensi antartugas (deteksi siklus; tugas terkunci sampai prasyarat selesai) dan milestone.
- Templat proyek: 3 bawaan (peluncuran produk, onboarding, kampanye) atau simpan proyek sendiri sebagai templat.
- Tugas berulang (harian/mingguan/bulanan): kejadian berikutnya dibuat otomatis saat diselesaikan.

**Tampilan**
- Daftar (urut per kolom, 25 baris/halaman, edit massal), Board Kanban (seret-lepas, batas WIP), Kalender (bulan/minggu, seret untuk menggeser jadwal), dan Timeline/Gantt (per proyek atau per orang, deteksi jadwal bertumpuk).
- Filter lanjutan (status, prioritas, penanggung jawab, label, rentang tenggat) yang bisa disimpan sebagai tampilan favorit.
- Empat tema: **Terang**, **Gelap**, **Glassy**, dan **Emas**.

**Kolaborasi**
- Diskusi per tugas dengan @mention, lampiran berkas dengan versi revisi (maks. 25 MB), tautan, dan laporan kendala.
- Chat tim real-time dan kotak masuk pemberitahuan real-time (SSE).
- Formulir permintaan kerja (internal atau publik) yang otomatis menjadi tugas.
- Riwayat aktivitas setiap perubahan tugas.

**Waktu, beban kerja & otomatisasi**
- Timer dan catatan waktu manual, estimasi vs realisasi.
- Beban kerja per anggota terhadap kapasitas mingguan, dengan penanda overload.
- Aturan otomatis: sub-tugas selesai → Menunggu Review, pengingat menjelang tenggat, peringatan terlambat (opsional ke supervisor), kabar saat prasyarat selesai.

**Laporan, keamanan & integrasi**
- Laporan: tren mingguan, kesehatan proyek, rasio keterlambatan, estimasi vs realisasi, ekspor CSV.
- Peran bertingkat (lihat tabel di bawah); sesi lama otomatis berakhir saat kata sandi diganti/direset.
- Feed kalender `.ics` pribadi (Google Calendar/Outlook), kunci API pribadi (`Authorization: Bearer rei_…`), dan webhook keluar (JSON bertanda tangan HMAC-SHA256, Slack, Microsoft Teams).

### Peran

| Peran | Melihat tugas | Kelola tugas/proyek | Pengaturan |
|---|---|---|---|
| Super Admin, Administrator | semua | ya | semua, termasuk divisi & webhook |
| Manager | semua | ya | label, WIP, templat, formulir |
| Supervisor (SPV) | divisinya + miliknya | ya | label, WIP, templat, formulir |
| Karyawan | miliknya, yang ditugaskan, atau di-tag | status & detail tugas miliknya | — |
| Tamu / Klien | hanya tugas yang dibagikan (di-tag) | tidak; hanya komentar & lampiran | — (tanpa chat & daftar tim) |

## Teknologi

- Next.js 16 (App Router, Turbopack) dan React 19
- TypeScript dan Tailwind CSS v4
- Prisma ORM 7 dengan PostgreSQL (driver adapter `@prisma/adapter-pg`)
- `jose` untuk token sesi dan `bcryptjs` untuk hash kata sandi
- `styled-jsx` untuk gaya per komponen

## Prasyarat

- Node.js 20.19 atau lebih baru (disarankan 22+)
- PostgreSQL 14 atau lebih baru

## Konfigurasi

Salin `.env.example` menjadi `.env`, lalu isi:

| Variabel | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | ya | Koneksi PostgreSQL |
| `JWT_SECRET` | ya | Kunci acak ≥ 32 karakter untuk token sesi; jangan dibagikan |
| `CRON_SECRET` | tidak | Bila diisi, cron eksternal boleh memanggil `POST /api/automation/run` dengan `Authorization: Bearer <CRON_SECRET>` |
| `SCHEDULER_DISABLED` | tidak | `1` = matikan penjadwal bawaan (pengingat tiap 5 menit) |
| `REALTIME_BACKEND` | tidak | `postgres` = sebar event real-time antar-instance lewat PostgreSQL `LISTEN/NOTIFY` (bawaan: memori satu proses) |

File `.env` tidak disertakan di repository.

### Menjalankan lebih dari satu instance

- Set `REALTIME_BACKEND=postgres` di semua instance agar chat & pemberitahuan sampai ke semua pengguna.
- Set `SCHEDULER_DISABLED=1` di semua instance dan panggil `POST /api/automation/run` dari **satu** cron (mis. tiap 5 menit) dengan `CRON_SECRET`. Pemeriksaan ini idempoten: tiap pengingat hanya terkirim sekali.
- Berkas unggahan disimpan di `.local-data/`; gunakan volume bersama antar-instance.

## Menjalankan

```bash
npm install
npx prisma generate         # wajib dijalankan manual sejak Prisma 7
npx prisma migrate deploy   # atau: npx prisma migrate dev
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Membuat akun Super Admin pertama:

```bash
npx tsx scripts/create-super-admin.ts
```

## Struktur

```
app/                      halaman (/, /login, /request/[slug]), layout, dan route API (app/api)
instrumentation.ts        menjalankan penjadwal pengingat saat server mulai
components/
  dashboard/
    dashboard-client.tsx  komponen utama: merangkai layout, view, dan modal
    types.ts, constants.ts
    hooks/                use-workspace (data & aksi tugas/proyek/tim), use-chat (chat real-time)
    layout/               sidebar, topbar, pemilih tema, header halaman
    views/                Dashboard, Proyek, Tim, Laporan, Kalender, Timeline, Pengaturan
    tasks/                tabel, kanban, dan modal detail (sub-tugas, dependensi, diskusi, lampiran, waktu, riwayat)
    chat/                 tampilan chat, composer, dan modal
    forms/                form tugas/proyek/anggota, templat, kata sandi, integrasi
    lib/                  helper klien: fetch, format, CSV, perhitungan tugas
    ui.tsx                komponen kecil yang dipakai ulang
    dashboard.styles.ts   gaya global dashboard (styled-jsx)
    features.styles.ts    gaya fitur lanjutan (filter, kalender, timeline, grafik, dll.)
  rei-logo.tsx, favicon-badge.tsx
lib/                      sesi, autentikasi, Prisma, helper API, tema, otomatisasi,
                          notifikasi, webhook, ICS, templat, berkas, real-time
public/brand/             aset logo
```

- `lib/` — sesi, autentikasi, akses Prisma, helper API, serta tema (`theme.ts` aman untuk server, `use-theme.ts` hook klien)
- `prisma/` — schema dan migrasi database
- `scripts/` — utilitas pembuatan dan reset akun Super Admin

## Pemeriksaan

```bash
npx tsc --noEmit
npm run lint
npm run build
```
