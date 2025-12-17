# Patch Notes – 2025-12-16

## Autentikasi & RBAC
- Menyimpan `token.user` di JWT untuk konsistensi RBAC (lihat `src/lib/auth.ts`).
- Menonaktifkan logging sensitif di production (`src/lib/auth.ts`, `src/lib/authz.ts`).
- Menambahkan rate limiting kredensial login via helper `src/lib/rate-limit.ts`.
- Middleware permission kini memiliki fallback bila `token.user` belum terset (`src/lib/permission-middleware.ts`).

## Keamanan Platform
- Menambahkan header **Content-Security-Policy** default di `next.config.ts`.
- Menyediakan helper `src/lib/rate-limit.ts` dan memakai ulang pada API wrappers.

## Restrukturisasi Repo
- Memindahkan dokumentasi ke `docs/**` dengan kategori (manuals, deployment, reports, reference, testing).
- Memindahkan skrip deployment ke `deploy/scripts/` serta konfigurasi ke `deploy/config/**`.
- Menambahkan `tests/samples/` untuk fixture PDF.
- Memperbarui README structure dan menyediakan panduan detail di `docs/reports/RESTRUCTURE_PLAN.md`.

## Catatan Implementasi
- Root `Dockerfile` dan `docker-compose.yml` diganti symlink agar command lama masih berfungsi.
- PM2 ecosystem di root kini hanya menjadi shim `require('./deploy/config/pm2/...')`.
- Tambahkan dokumen audit: `docs/reports/AUDIT_REPORT_FINAL.md`.
