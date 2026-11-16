# REI Work Management

Aplikasi internal untuk mengelola pekerjaan, proyek, tim, dan progres Raja Emas Indonesia.

## Fitur

- Empat tema tampilan: **Terang**, **Gelap**, **Glassy** (kaca transparan), dan **Emas**, tersimpan di browser.
- Login dengan email dan kata sandi, sesi JWT di cookie httpOnly (berlaku 7 hari).
- Dashboard ringkasan: statistik tugas, progres proyek, beban tim, aktivitas terbaru.
- Board Kanban dan tabel tugas dengan pencarian, filter status/prioritas, serta detail tugas.
- Tautan tugas (GitHub, dokumen, desain, referensi) dengan validasi URL HTTP/HTTPS.
- Riwayat laporan kendala per tugas, dengan bukti gambar/PDF maksimal 10 MB.
- Peran pengguna: `SUPER_ADMIN`, `SPV`, dan `MEMBER`, dengan divisi dan penanggung jawab.

## Teknologi

- Next.js 16 (App Router, Turbopack) dan React 19
- TypeScript dan Tailwind CSS v4
- Prisma ORM dengan PostgreSQL
- `jose` untuk token sesi dan `bcryptjs` untuk hash kata sandi
- `styled-jsx` untuk gaya per komponen

## Prasyarat

- Node.js 20 atau lebih baru
- PostgreSQL 14 atau lebih baru

## Konfigurasi

Buat file `.env` di root proyek:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/rei_work_management?schema=public"
JWT_SECRET="kunci-acak-minimal-32-karakter"
```

`JWT_SECRET` wajib diisi dan tidak boleh dibagikan. File `.env` tidak disertakan di repository.

## Menjalankan

```bash
npm install
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
app/                      halaman (/, /login), layout, dan route API (app/api)
components/
  dashboard/
    dashboard-client.tsx  komponen utama: merangkai layout, view, dan modal
    types.ts, constants.ts
    hooks/                use-workspace (data & aksi tugas/proyek/tim), use-chat (chat real-time)
    layout/               sidebar, topbar, pemilih tema, header halaman
    views/                Dashboard, Proyek, Tim, Laporan
    tasks/                tabel/kanban tugas dan modal detail (tag, tautan, kendala)
    chat/                 tampilan chat, composer, dan modal
    forms/                form buat tugas, proyek, anggota
    lib/                  helper klien: fetch, format, CSV, perhitungan tugas
    ui.tsx                komponen kecil yang dipakai ulang
    dashboard.styles.ts   gaya global dashboard (styled-jsx)
  rei-logo.tsx, favicon-badge.tsx
lib/                      sesi, autentikasi, Prisma, helper API, dan tema
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
