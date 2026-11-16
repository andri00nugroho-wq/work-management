# REI Work Management

Aplikasi internal untuk mengelola pekerjaan, proyek, tim, dan progres Raja Emas Indonesia.

## Fitur

- Empat tema tampilan: **Terang**, **Gelap**, **Glassy** (kaca transparan), dan **Emas**, tersimpan di browser.
- Login dengan email dan kata sandi, sesi JWT di cookie httpOnly (berlaku 7 hari).
- Dashboard ringkasan: statistik tugas, progres proyek, beban tim, aktivitas terbaru.
- Board Kanban dan tabel tugas dengan pencarian, filter status/prioritas, serta detail tugas.
- Tautan tugas (GitHub, dokumen, desain, referensi) dengan validasi URL HTTP/HTTPS.
- Riwayat laporan kendala per tugas, dengan bukti gambar/PDF maksimal 10 MB.
- Peran pengguna: `SUPER_ADMIN`, `ADMIN`, `SPV`, `MANAGER`, dan `MEMBER`, dengan divisi dan penanggung jawab.
- Penghapusan anggota tim (soft delete) hanya oleh `SUPER_ADMIN` dan `ADMIN`; akun nonaktif tidak bisa login, tetapi riwayat tugas tetap tersimpan.
- Penghapusan proyek (soft delete) dan tugas (permanen, termasuk bukti isu) hanya oleh `SUPER_ADMIN` dan `ADMIN`.
- Setiap pengguna dapat mengganti kata sandi sendiri dari menu profil; kata sandi saat ini wajib diverifikasi.

## Teknologi

- Next.js 16 (App Router) dan React 19
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

## Deploy ke AWS

Aplikasi berjalan sebagai server Node.js. Untuk ECS, EC2, atau container AWS lain, jalankan langkah berikut dalam job release Linux yang memakai base image sama dengan runtime:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start:standalone
```

`npm run build` sudah menyiapkan `public/` dan `.next/static/` serta membersihkan file konfigurasi dan migrasi dari paket standalone. Salin hanya `.next/standalone` ke image/runtime AWS.

Jalankan langkah build di Linux dengan base image dan versi Node yang sama dengan runtime AWS. Prisma menyertakan query engine sesuai platform saat `prisma generate`; build di Windows lalu menyalin hasilnya ke Linux dapat membuat database client gagal dimuat.

Atur `HOSTNAME=0.0.0.0` dan `PORT=3000` pada container. Simpan `DATABASE_URL` (gunakan PostgreSQL terkelola seperti RDS) dan `JWT_SECRET` di AWS Secrets Manager atau Parameter Store; jangan masukkan rahasia ke image. Jalankan migrasi satu kali sebagai langkah release sebelum mengganti task/service aplikasi. Health check load balancer dapat memakai `GET /api/health`; endpoint ini mengembalikan `503` bila database tidak dapat dijangkau.

`DATABASE_URL` harus tersedia pada job release untuk `prisma generate` dan migrasi; generate tidak membuka koneksi database, sedangkan migrasi membutuhkan akses jaringan ke database.

Chat waktu nyata dan presence saat ini memakai memori satu proses, sedangkan lampiran disimpan di `.local-data`. Untuk satu instance, pasang direktori `.local-data` pada volume persisten dan pastikan backup-nya. Untuk beberapa task/instance atau autoscaling, pindahkan event/presence ke broker bersama dan berkas ke S3 (atau storage bersama) sebelum mengaktifkannya; filesystem container dan memori antar-task tidak dibagi.

## Operasional skala internal (10–50 pengguna IT)

Hasil benchmark menunjukkan satu instance sudah melayani ~455 req/s SSR dengan p50 26 ms. Untuk 10–50 pengguna internal, konfigurasi berikut cukup; PgBouncer baru dipertimbangkan bila pengguna aktif bersamaan mendekati 1.000.

### Connection pool database

Tambahkan parameter pool pada `DATABASE_URL` (5 koneksi per instance sudah memadai):

```text
postgresql://USER:PASSWORD@HOST:5432/rei_work_management?schema=public&connection_limit=5&pool_timeout=10
```

`connection_limit` dihitung per proses aplikasi. Jika nanti menjalankan beberapa instance, kalikan dengan jumlah instance dan pastikan totalnya masih di bawah `max_connections` PostgreSQL.

### Backup harian

`scripts/backup-database.mjs` membuat dump custom-format dengan `pg_dump`, menyimpannya di `BACKUP_DIR` (default `.local-data/backups`), menghapus dump lokal yang lebih lama dari `BACKUP_RETENTION_DAYS` (default 14 hari), lalu mengunggahnya ke S3 bila `BACKUP_S3_URI` diisi (memerlukan AWS CLI dan izin `s3:PutObject`).

```bash
npm run db:backup
```

Jadwalkan harian dari cron di host/container (contoh 02.00):

```text
0 2 * * * cd /opt/rei-work-management && /usr/bin/node --env-file=.env scripts/backup-database.mjs >> /var/log/rei-backup.log 2>&1
```

Di Dokploy, gunakan fitur scheduled task/cron container dengan perintah yang sama. Untuk retensi off-site, atur lifecycle rule pada bucket S3. Simpan juga salinan `.local-data/chat-files` dan `.local-data/task-evidence` karena lampiran tidak ikut dalam dump database.

Restore dump ke database kosong:

```bash
pg_restore --clean --if-exists --no-owner --no-privileges --dbname "$DATABASE_URL" .local-data/backups/rei-work-management-<timestamp>.dump
```

### Header keamanan

`next.config.ts` menambahkan `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, dan `Permissions-Policy` pada semua respons. Pastikan aplikasi diakses melalui HTTPS (Dokploy/Traefik sudah menangani TLS) agar HSTS berlaku.

### Port AWS: yang dibuka dan ditutup

Prinsipnya: hanya Traefik yang menghadap internet. Aplikasi dan database tetap di jaringan internal Docker/Swarm dan tidak dipublikasikan ke host.

| Port | Fungsi | Akses yang benar |
| --- | --- | --- |
| `22/tcp` | SSH deploy | Hanya IP admin `/32` atau SSM Session Manager |
| `80/tcp` | HTTP/ACME | `0.0.0.0/0`, `::/0` (atau hanya ALB); lihat catatan ACME |
| `443/tcp` | HTTPS, Traefik, webhook deploy | `0.0.0.0/0`, `::/0` (atau hanya ALB) |
| `3000/tcp` | Aplikasi Next.js / panel Dokploy | Internal saja; jangan buka ke publik |
| `5432/tcp` | PostgreSQL | Hanya dari Security Group aplikasi |
| `8080/tcp` | Traefik dashboard | Internal/admin saja |
| `2375`, `2376/tcp` | Docker API | Jangan pernah dibuka |
| `2377/tcp`, `7946/tcp+udp`, `4789/udp` | Docker Swarm | Hanya SG yang sama atau CIDR privat VPC |
| `9000/tcp` | Portainer (jika ada) | Internal/admin saja |
| `3001`, `5000`, `10000` | Port lain yang tidak dipakai | Tutup |

Jika memakai ALB/NLB: SG load balancer membuka `80/443` publik, sedangkan SG EC2 hanya menerima `80/443` dari SG load balancer. Jika direct EC2 + Dokploy/Traefik: SG EC2 membuka `80/443` publik dan `22` dari IP admin.

Di Dokploy, pastikan service aplikasi memakai **internal port 3000** tanpa publish ke host (Traefik yang meneruskan), dan service PostgreSQL tidak mem-publish `5432`. `DATABASE_URL` harus memakai hostname service internal (mis. `postgres`), bukan IP publik. Panel Dokploy di port `3000` diakses lewat SSH tunnel/VPN, bukan dibuka ke internet.

Skrip bantuan mencabut aturan publik pada port internal tanpa menyentuh `22/80/443` dan tanpa mengubah aturan internal:

```bash
# Cari Security Group node Dokploy
aws ec2 describe-instances \
  --filters "Name=ip-address,Values=43.218.61.24" \
  --query 'Reservations[].Instances[].SecurityGroups' \
  --output table

# Dry-run: tampilkan aturan yang akan dicabut
bash scripts/aws-close-public-ports.sh --group-id sg-xxxx --region ap-southeast-1

# Eksekusi setelah hasil dry-run sesuai
bash scripts/aws-close-public-ports.sh --group-id sg-xxxx --region ap-southeast-1 --apply
```

Urutan aman saat deploy agar tidak error:

1. Pastikan `22` (IP admin), `80`, dan `443` terbuka.
2. Deploy dan verifikasi `https://work-management.lmrei.id/api/health` mengembalikan `200`.
3. Jalankan skrip di atas (dry-run lalu `--apply`).
4. Baru persempit `22` ke IP admin atau aktifkan SSM.
5. Verifikasi dari luar: `nc -zv 43.218.61.24 5432` harus gagal/timeout, sedangkan endpoint HTTPS tetap `200`.

Catatan ACME: jika Let's Encrypt memakai HTTP-01, port `80` harus tetap terbuka saat penerbitan/perpanjangan sertifikat. Jika ingin menutup `80`, ubah Traefik ke TLS-ALPN-01 (`443`) atau DNS-01 lebih dulu. Outbound `443` tetap diperlukan untuk pull image, Git, dan unggah backup ke S3.

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
- `scripts/` — utilitas pembuatan/reset akun Super Admin, backup database, dan penyiapan standalone

## Pemeriksaan

```bash
npx tsc --noEmit
npm run lint
npm run build
```
