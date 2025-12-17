# 🔐 HANMARINE HIMS - KEBIJAKAN KREDENSIAL

> **Penting:** Semua kredensial produksi dan sandbox harus disimpan di Secret Manager atau file `.env` lokal yang tidak pernah dikomit ke repository publik. Anggap seluruh kredensial yang pernah muncul di repository ini sebagai *compromised* dan lakukan rotasi segera.

---

## 🚫 Tidak Ada Kredensial Default di Repo
- Email, password, token, API key, database URL, dan secret lainnya **tidak** boleh ditulis di dokumentasi publik.
- Gunakan placeholder berikut saat mendokumentasikan:
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`
  - `HIMS_CRYPTO_KEY`
- Sumber resmi kredensial hanya dari **Secret Manager** (contoh: Vault, AWS Secrets Manager, GCP Secret Manager) atau file `.env.local` / `.env.production` yang terenkripsi.

---

## ✅ Prosedur Setup Lokal
1. Buat salinan `.env.example` ke `.env.local`.
2. Minta nilai kredensial terbaru dari Secret Manager.
3. Isi placeholder dengan nilai aktual di `.env.local` (jangan commit).
4. Jalankan `npm run dev` untuk pengembangan.

---

## 🔄 Checklist Rotasi Wajib (Production)
Semua item berikut **harus** dirotasi bila pernah ter-expose atau selepas audit tahunan:
1. `NEXTAUTH_SECRET`
2. `HIMS_CRYPTO_KEY`
3. Password database produksi (`DATABASE_URL`)
4. Password seluruh akun admin/backend (DIRECTOR, CDMO, ACCOUNTING, HR, CREW_PORTAL, dsb)
5. API key eksternal lain yang pernah digunakan dalam repositori ini

### Langkah Rotasi
- Generate secret baru (gunakan `openssl rand -base64 32` atau manajer secret internal).
- Update Secret Manager dan `.env.production` dengan nilai baru.
- Deploy ulang aplikasi sehingga environment memuat secret terbaru.
- Dokumentasikan waktu rotasi di runbook internal.

---

## 🛡️ Kebijakan Akses
- Minimal dua faktor autentikasi (MFA) untuk akun admin.
- Gunakan password manager perusahaan untuk distribusi kredensial sementara.
- Lakukan audit akses triwulan untuk memastikan tidak ada akun menganggur.

---

## 📝 Catatan
- File ini hanya memuat panduan kebijakan; detail login aktual dipindahkan ke repositori privat ber-level akses terbatas.
- Bila ditemukan kredensial keras baru di repo, lakukan langkah berikut:
  1. Anggap kredensial tersebut bocor.
  2. Rotasi nilai secepatnya.
  3. Hapus jejak dari sejarah git menggunakan `git filter-repo` atau sejenisnya bila memungkinkan.

---

## 📎 Referensi
- [docs/reports/AUDIT_REPORT_FINAL.md](../reports/AUDIT_REPORT_FINAL.md)
- [PERMISSION_MATRIX.md](../PERMISSION_MATRIX.md)
- [DEPLOYMENT.md](../DEPLOYMENT.md)
