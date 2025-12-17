# HIMS Production Readiness Audit (2025-12-16)

## 1. Arsitektur Sistem (Ringkas)
```
Browser
  │
  ├─ Next.js App Router (src/app)
  │    ├─ UI Server Components (default)
  │    ├─ Client wrappers (SessionProvider, ErrorBoundary)
  │    └─ Module Pages: crewing, hr, accounting, quality, compliance
  │
  ├─ Middleware (middleware.ts)
  │    └─ Enforce login → redirect ke /auth/signin
  │
  ├─ NextAuth (src/lib/auth.ts)
  │    ├─ Credentials provider + bcrypt
  │    ├─ JWT strategy (role + roles persisted)
  │    ├─ Callbacks → session hydration
  │    └─ rateLimit(login) via src/lib/rate-limit.ts
  │
  ├─ RBAC Utilities
  │    ├─ permissions.ts → matrix modul & sensitivitas
  │    ├─ permission-middleware.ts → API guard by token roles
  │    └─ authz.ts → requireUser / normalize role di server components
  │
  ├─ API Routes (src/app/api/**)
  │    ├─ withAuth / withPermission / withRateLimit wrappers
  │    └─ Prisma queries with include & guard
  │
  ├─ Prisma Layer (src/lib/prisma.ts)
  │    ├─ Adapter PG pool singleton
  │    └─ Schema & migrations (prisma/schema.prisma, prisma/migrations)
  │
  └─ Database PostgreSQL 16
       └─ Seed & maintenance scripts (prisma/seed.ts, scripts/*)
```

## 2. Integration Checklist
| Integrasi | Status | Catatan |
| --- | --- | --- |
| NextAuth session → middleware → RBAC guard | ✅ | Token kini menyimpan `token.user`; middleware & `requireUser` menutup akses publik. |
| RBAC → UI menu | ⚠️ | Navigasi utama belum sepenuhnya membaca matrix; perlu audit komponen sidebar untuk hide entry saat role tidak punya akses. |
| Prisma schema → migrations → seed | ✅ | `prisma/schema.prisma`, `prisma/migrations/**`, `prisma/seed.ts` konsisten; seed menghasilkan akun utama. |
| Prisma → API routes | ✅ | Mayoritas route memakai `withPermission` atau pengecekan manual; beberapa legacy route masih inline (perlu review lanjutan). |
| Forms & modul Crewing/HR/Accounting | ⚠️ | Struktur halaman lengkap, namun beberapa form (mis. compliance communication) belum punya validasi input dan test e2e. |
| External compliance widget | ✅ | API overview menghitung `externalComplianceActive`; UI dashboard memakainya. |
| File upload pipeline | ⚠️ | Upload dokumen bekerja tapi belum ada validasi MIME / scanning. |
| Logging & monitoring | ⚠️ | Log auth disaring di production, namun belum ada agregasi/alert eksternal. |
| Healthcheck & observability | ❌ | Docker compose cek `GET /api/health` sementara endpoint belum tersedia. |

## 3. Top 10 Temuan Risiko Tinggi
1. **Default credential dan password sama untuk semua akun (Severity: Critical)** – Referensi: [docs/reference/LOGIN_CREDENTIALS.md](docs/reference/LOGIN_CREDENTIALS.md#L1-L170). *Aksi*: Pindahkan file ke repositori aman / Secret Manager, ganti semua password produksi, paksa reset setelah seed.
2. **Build mengabaikan error ESLint & TypeScript (Severity: High)** – Referensi: [next.config.ts](next.config.ts#L5-L12). *Aksi*: Set `ignoreDuringBuilds` dan `ignoreBuildErrors` ke `false`, perbaiki error lint/type sebelum deploy.
3. **CSP baru bersifat ketat namun belum dicakup domain eksternal (Severity: High)** – Referensi: [next.config.ts](next.config.ts#L43-L55). *Aksi*: Daftar domain API pihak ketiga (jika ada) dan sesuaikan `connect-src`, `img-src`, dsb sebelum go-live.
4. **Endpoint healthcheck belum ada (Severity: High)** – Docker memanggil `/api/health` namun tidak ada implementasi (lihat [deploy/config/docker/docker-compose.yml](deploy/config/docker/docker-compose.yml#L37-L41)). *Aksi*: Tambahkan route ringan yang mengecek koneksi Prisma & redis/queue bila ada.
5. **Upload dokumen tanpa validasi file (Severity: High)** – [src/app/api/documents/route.ts](src/app/api/documents/route.ts#L57-L104) menerima file apa pun, nama file langsung dipakai. *Aksi*: Validasi MIME/size, ganti nama file dengan whitelist extension, pertimbangkan AV scan / S3 presigned URL.
6. **Folder `public/uploads` diekspos langsung (Severity: High)** – File sensitif dapat diakses langsung via URL. *Aksi*: Hindari menyimpan dokumen pribadi di publik; gunakan penyimpanan privat + signed URL.
7. **Tidak ada audit trail untuk operasi kritikal (Severity: High)** – Banyak API create/update tidak menulis ke `activityLog`. *Aksi*: Implementasikan logging standar dengan metadata (user, waktu, payload ringkas) dan simpan di tabel audit.
8. **RBAC matrix belum mencakup role `CREW` (Severity: High)** – `UserRole` tidak memiliki entri untuk role crew internal (lihat [src/lib/permissions.ts](src/lib/permissions.ts#L15-L109)). *Aksi*: Tambah definisi & hak akses atau hapus penggunaan role tersebut agar tidak terjadi fallback salah.
9. **Dokumen deployment lama masih menginstruksikan jalur lama (Severity: High)** – Setelah restrukturisasi, referensi path di README lama bisa menyesatkan. *Aksi*: Update semua manual di `docs/deployment/` agar memakai path baru (`deploy/scripts`, `deploy/config`).
10. **Tidak ada pengujian automated minimum (Severity: High)** – Tidak ditemukan unit/API/UI tests; risiko regresi besar. *Aksi*: Rancang smoke test (lint, typecheck, `npm run build`, Prisma validate) dan minimal API contract test.

## 4. Audit Matrix
| Area | Status | Risiko | Rekomendasi |
| --- | --- | --- | --- |
| Security Headers | ✅ | Rendah | CSP baru ditambahkan; lengkapi domain eksternal sebelum produksi. |
| Auth & Session | ⚠️ | Sedang | Logging sudah dibatasi & token.user persist, tapi masih perlu rotasi password seed + enforce 2FA jangka panjang. |
| Authorization (RBAC) | ⚠️ | Sedang | Matrix kuat, namun beberapa UI menu belum memeriksa role; perlunya audit client-side. |
| Input Validation | ❌ | Tinggi | Banyak endpoint belum memakai schema validator; gunakan Zod/Yup untuk request body. |
| File Handling | ❌ | Tinggi | Upload tanpa MIME/size check & publik; migrasikan ke storage aman. |
| Database Reliability | ✅ | Rendah | Prisma adapter memakai pool; tambahkan `prisma.$queryRaw` limit & index review. |
| Observability | ❌ | Tinggi | Belum ada healthcheck, rate-limit global, atau alert PM2. |
| Code Quality | ⚠️ | Sedang | TypeScript belum strict, lint script ada tetapi diabaikan saat build. |
| Testing | ❌ | Tinggi | Belum ada suite test otomatis; minimal smoke test wajib sebelum produksi. |
| DevOps | ⚠️ | Sedang | Struktur baru `deploy/` ok, perlu dokumen update & pipeline untuk backup/restore otomatis. |

## 5. Observasi Tambahan
- `tsconfig.json` masih `strict: false` & `allowJs`; aktifkan mode ketat bertahap untuk modul kritikal.
- Logger `console.info` di authz dimatikan di production (good), namun pertimbangkan Winston/Pino agar bisa kirim ke ELK / Cloud Logging.
- `rateLimit` bersifat in-memory; untuk lingkungan multi-instance perlu Redis atau store eksternal.
- `docs/reference/LOGIN_CREDENTIALS.md` memuat perintah reset DB; pindahkan ke runbook internal non-publik.
- `deploy/scripts/backup-database.sh` kini berada di folder baru—pastikan cron/automation mengacu ke path baru.

## 6. Langkah Selanjutnya
1. Tuntaskan high-risk: hapus kredensial publik, aktifkan lint/typecheck, siapkan healthcheck, amankan upload.
2. Tambahkan validator request (Zod) pada endpoint sensitif (crewing, contracts, accounting).
3. Siapkan pipeline CI yang menjalankan `npm run lint`, `npm run build`, `npx prisma validate`, serta smoke test login.
4. Audit ulang manual di `docs/deployment/` agar sinkron dengan struktur baru (`deploy/scripts`, `deploy/config`).
5. Implementasikan audit log standar untuk semua operasi CREATE/UPDATE/DELETE.

**Status akhir:** *Belum siap produksi*. Poin high-risk perlu diselesaikan sebelum go-live.
