# Rencana & Hasil Restrukturisasi Repository

## 1. Ringkasan
Restrukturisasi dilakukan untuk merapikan dokumentasi, skrip deployment, dan artefak testing agar sesuai pola:
```
/src        # kode aplikasi
/prisma     # schema + migrations
/public     # aset publik
/deploy     # konfigurasi & skrip deploy
/docs       # dokumentasi (markdown / pdf)
/tests      # fixture & berkas pengujian
```

## 2. Pemetaan File yang Dipindahkan
| Sebelumnya | Sekarang |
| --- | --- |
| `*.md` / `*.pdf` di root | `docs/manuals`, `docs/deployment`, `docs/reports`, `docs/reference`, `docs/testing` |
| `deploy.sh`, `setup-*.sh`, `backup-database.sh`, `test-form-system.sh` | `deploy/scripts/` |
| `nginx-hims-app.conf` | `deploy/config/nginx/hims-app.conf` |
| `ecosystem.config.js` | `deploy/config/pm2/ecosystem.config.js` (root file hanya me-require lokasi baru) |
| `Dockerfile`, `docker-compose.yml` | `deploy/config/docker/` (root file berupa symlink untuk kompatibilitas lama) |
| Folder `docker/` (entrypoint dsb) | `deploy/docker/` (root symlink `docker/` menjaga path lama) |
| `test_ac*.pdf`, `test_cr*.pdf` | `tests/samples/` |
| `docs/HIMS_APP_USER_MANUAL.md`, `docs/HIMS_OFFICE_STAFF_MAIN_MANUAL.md` | `docs/manuals/` bersama manual lain |

## 3. Dampak & Penyesuaian
- **PM2**: Jalankan `pm2 start deploy/config/pm2/ecosystem.config.js` (root file tetap dapat dipakai karena melakukan `require`).
- **Nginx**: Konfigurasi kini berada di `deploy/config/nginx/`; update panduan deployment agar menyalin dari path baru.
- **Docker**: Gunakan `docker compose -f deploy/config/docker/docker-compose.yml up -d` dan `docker build -f deploy/config/docker/Dockerfile .` bila tidak memakai symlink.
- **Dokumentasi**: Referensi path lama diperbarui di README, audit update diperlukan pada seluruh dokumen di `docs/deployment/`.
- **Cron / Automation**: Jika ada job yang memanggil skrip di lokasi lama, perbarui ke `deploy/scripts/*`.

## 4. Item Tertunda
- Dokumentasi internal (PDF/MD) perlu penyesuaian hyperlink sesuai struktur baru.
- Pertimbangkan folder `archive/` jika kelak ingin menyimpan dokumen historis atau deprecated.
- Review ulang `scripts/` (folder existing) untuk memindahkan script non-deploy (mis. data cleaning) bila diperlukan.
