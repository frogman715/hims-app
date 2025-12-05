# HANMARINE INTEGRATED MANAGEMENT SYSTEM (HIMS)
## PANDUAN LENGKAP PENGGUNA & PROSEDUR

**Versi:** 1.0  
**Tanggal:** 5 Desember 2025  
**Perusahaan:** PT Hanmarine Global Indonesia  
**URL Sistem:** https://app.hanmarine.co

---

## DAFTAR ISI

1. [Ringkasan Sistem](#1-ringkasan-sistem)
2. [Akses & Login](#2-akses--login)
3. [Hak Akses Berdasarkan Role](#3-hak-akses-berdasarkan-role)
4. [Penggunaan Modul](#4-penggunaan-modul)
5. [Prosedur Operasional Standar (SOP)](#5-prosedur-operasional-standar-sop)
6. [Kepatuhan & Manajemen Mutu](#6-kepatuhan--manajemen-mutu)
7. [Penyelesaian Masalah](#7-penyelesaian-masalah)
8. [Lampiran](#8-lampiran)

---

## 1. RINGKASAN SISTEM

### 1.1 Apa itu HIMS?
HIMS (Hanmarine Integrated Management System) adalah sistem manajemen awak kapal maritim yang komprehensif untuk mengelola:
- Aplikasi dan rekrutmen pelaut
- Penugasan dan penggantian crew
- Kontrak kerja (SEA & PKL)
- Manajemen dokumen dan kepatuhan
- Manajemen kapal dan principal
- Akuntansi keuangan dan payroll
- Sistem manajemen mutu (ISO 9001, MLC, STCW)

### 1.2 Arsitektur Sistem
- **Teknologi:** Next.js 16, React 19, PostgreSQL 16, Prisma ORM
- **Deployment:** VPS (31.97.223.11) dengan Nginx, PM2, SSL (Let's Encrypt)
- **Keamanan:** Enkripsi AES-256-GCM, kontrol akses berbasis role, firewall
- **Backup:** Backup otomatis harian jam 02:00 WIB (retensi 7 hari)

### 1.3 Standar Kepatuhan
- **MLC (Maritime Labour Convention):** Kontrak kerja, standar medis
- **STCW:** Manajemen sertifikat pelaut
- **ISO 9001:** Prosedur manajemen mutu
- **Peraturan Indonesia:** Kontrak PKL, dokumentasi Hubla

---

## 2. AKSES & LOGIN

### 2.1 Data Login Pengguna

#### **DIREKTUR (Akses Penuh)**
1. **Rinaldy (Direktur)**
   - Email: `rinaldy@hanmarine.co`
   - Password: `director2025`
   - Akses: Kontrol penuh sistem

2. **Arief (Admin)**
   - Email: `arief@hanmarine.co`
   - Password: `admin2025`
   - Akses: Kontrol penuh sistem

#### **ACCOUNTING (Keuangan)**
3. **Dino (Officer Accounting)**
   - Email: `dino@hanmarine.co`
   - Password: `accounting2025`
   - Akses: Penuh untuk kontrak, wage scales, agency fees, asuransi

#### **STAFF OPERASIONAL**
4. **CDMO (Crew Document Management Officer)**
   - Email: `cdmo@hanmarine.co`
   - Password: `cdmo123`
   - Akses: Penuh untuk crew, dokumen, aplikasi

5. **Manager Operasional**
   - Email: `operational@hanmarine.co`
   - Password: `operational123`
   - Akses: View untuk sebagian besar modul, edit operasi crewing

6. **Officer HR**
   - Email: `hr@hanmarine.co`
   - Password: `hr123`
   - Akses: Penuh untuk HR, rekrutmen, hari libur nasional

#### **PORTAL CREW**
7. **Portal Crew (Untuk Pelaut)**
   - Email: `crew@hanmarine.co`
   - Password: `crew2025`
   - Akses: Lihat kontrak, dokumen, dan penugasan sendiri

#### **AUDITOR**
8. **External Auditor**
   - Email: `auditor@hanmarine.co`
   - Password: `auditor2025`
   - Akses: Read-only untuk compliance, quality, documents

### 2.2 Cara Login
1. Buka: https://app.hanmarine.co
2. Masukkan email dan password Anda
3. Klik "Sign In"
4. Anda akan diarahkan ke dashboard sesuai role

### 2.3 Keamanan Password
- Password dienkripsi menggunakan bcrypt
- Ubah password default segera setelah login pertama
- Gunakan password kuat: minimal 8 karakter, campuran huruf dan angka
- Jangan bagikan kredensial ke pihak yang tidak berwenang

### 2.4 Manajemen Sesi
- Sesi berakhir setelah 24 jam tidak aktif
- Selalu logout saat meninggalkan workstation
- Sistem menggunakan JWT token untuk autentikasi aman

---

## 3. HAK AKSES BERDASARKAN ROLE

### 3.1 Level Permission
- **NO_ACCESS:** Modul sepenuhnya diblokir
- **VIEW_ACCESS:** Read-only (bisa lihat data tapi tidak bisa ubah)
- **EDIT_ACCESS:** Bisa buat dan update records (tidak bisa hapus)
- **FULL_ACCESS:** Kontrol penuh (create, read, update, delete)

### 3.2 Matriks Permission Berdasarkan Role

| Modul | DIRECTOR | CDMO | OPERATIONAL | ACCOUNTING | HR | CREW_PORTAL |
|--------|----------|------|-------------|------------|-----|-------------|
| **Dashboard** | FULL | FULL | FULL | FULL | FULL | VIEW |
| **Crew** | FULL | FULL | EDIT | VIEW | VIEW | NO |
| **Aplikasi** | FULL | FULL | EDIT | VIEW | VIEW | NO |
| **Penugasan** | FULL | FULL | EDIT | VIEW | VIEW | NO |
| **Kontrak** | FULL | EDIT | VIEW | FULL | VIEW | VIEW |
| **Dokumen** | FULL | FULL | VIEW | VIEW | VIEW | VIEW |
| **Principal** | FULL | EDIT | VIEW | EDIT | NO | NO |
| **Kapal** | FULL | EDIT | VIEW | VIEW | NO | NO |
| **Wage Scales** | FULL | VIEW | VIEW | FULL | NO | NO |
| **Agency Fees** | FULL | VIEW | VIEW | FULL | NO | NO |
| **Asuransi** | FULL | VIEW | VIEW | FULL | NO | NO |
| **Quality/HGQS** | FULL | VIEW | VIEW | VIEW | NO | NO |
| **Compliance** | FULL | EDIT | VIEW | VIEW | VIEW | NO |
| **HR/Rekrutmen** | FULL | VIEW | VIEW | VIEW | FULL | NO |
| **Disciplinary** | FULL | EDIT | VIEW | NO | VIEW | NO |

### 3.3 Level Sensitivitas Data

#### **MERAH (Sangat Rahasia - Terenkripsi)**
- Nomor paspor
- Hasil medical examination
- Detail gaji lengkap
- Kode buku pelaut
- Nomor rekening bank

**Akses:** DIRECTOR dan ACCOUNTING saja

#### **KUNING (Rahasia - Ter-mask)**
- Informasi kontak pribadi
- Catatan disipliner
- Detail sertifikat
- Term kontrak

**Akses:** DIRECTOR, CDMO, HR dengan masking untuk yang lain

#### **HIJAU (Publik/Internal)**
- Informasi kapal
- Detail principal
- Dokumen prosedural
- Catatan training

**Akses:** Semua user yang berwenang

---

## 4. PENGGUNAAN MODUL

### 4.1 MODUL CREW

#### 4.1.1 Menambah Pelaut Baru
1. Navigasi ke **Crew** → **Add New Crew**
2. Isi field yang wajib:
   - Nama Lengkap (sesuai paspor)
   - Tanggal Lahir
   - Kewarganegaraan
   - Rank/Posisi
   - Nomor Buku Pelaut
   - Informasi Kontak
3. Upload dokumen yang diperlukan:
   - Copy paspor
   - Buku pelaut
   - COC (Certificate of Competency)
   - Sertifikat medical
4. Klik **Save**

#### 4.1.2 Manajemen Status Crew
- **ACTIVE:** Saat ini dipekerjakan/tersedia
- **ON_BOARD:** Saat ini bertugas di kapal
- **STANDBY:** Tersedia untuk penugasan berikutnya
- **INACTIVE:** Tidak tersedia untuk penugasan
- **BLACKLISTED:** Dilarang untuk dipekerjakan

#### 4.1.3 Pencarian Crew
- Gunakan search bar untuk nama, rank, atau nomor buku pelaut
- Filter berdasarkan:
  - Status (Active, On Board, Standby)
  - Rank (Captain, Chief Engineer, Able Seaman, dll)
  - Kewarganegaraan
  - Tanggal kadaluarsa sertifikat

### 4.2 MODUL APLIKASI (CR-02)

#### 4.2.1 Membuat Aplikasi
1. Pergi ke **Crewing** → **Applications**
2. Klik **New Application**
3. Pilih:
   - Principal (pemilik kapal)
   - Kapal
   - Rank yang dibutuhkan
   - Tanggal sign-on
4. Pilih pelaut dari database crew
5. Upload dokumen aplikasi:
   - Form aplikasi (CR-02)
   - Sertifikat updated
   - Sertifikat medical
6. Set status aplikasi:
   - **PENDING:** Menunggu persetujuan principal
   - **APPROVED:** Principal menerima
   - **REJECTED:** Principal menolak
   - **CANCELLED:** Aplikasi ditarik

#### 4.2.2 Alur Aplikasi
```
Pemilihan Crew → Cek Dokumen → Form CR-02 → Submit ke Principal 
→ Persetujuan Principal → Assignment → Kontrak
```

### 4.3 MODUL ASSIGNMENT (PENUGASAN)

#### 4.3.1 Membuat Assignment
1. Dari aplikasi yang disetujui → **Create Assignment**
2. Isi detail assignment:
   - Tanggal sign-on
   - Pelabuhan sign-on
   - Durasi kontrak (bulan)
   - Expected sign-off date
3. Generate crew list entry
4. Buat kontrak kerja

#### 4.3.2 Proses Penggantian Crew
1. **Monthly Checklist:** Review kontrak yang akan berakhir
2. **Permintaan Penggantian:** Identifikasi posisi yang perlu diganti
3. **Pemilihan Crew:** Pilih pengganti yang sesuai
4. **Aplikasi:** Submit CR-02 ke principal
5. **Assignment:** Buat assignment baru untuk pengganti
6. **Sign-off/Sign-on:** Update crew list

### 4.4 MODUL KONTRAK

#### 4.4.1 Jenis Kontrak
**Kontrak SEA (Seafarer Employment Agreement)**
- Format sesuai MLC
- Dibawa di atas kapal
- Berisi:
  - Ketentuan kerja
  - Detail upah (basic, overtime, leave pay)
  - Jam kerja
  - Hak cuti
  - Ketentuan repatriasi
  - Coverage asuransi

**Kontrak PKL (Perjanjian Kerja Laut)**
- Format peraturan Indonesia
- Dikirim ke Hubla (Kementerian Perhubungan)
- Diperlukan untuk:
  - Clearance imigrasi
  - Kepatuhan izin kerja
  - Audit regulasi nasional

#### 4.4.2 Membuat Kontrak
1. Dari assignment → **Generate Contract**
2. Pilih jenis kontrak: SEA atau PKL
3. Sistem otomatis mengisi dari:
   - Data pribadi crew
   - Detail assignment
   - Ketentuan perjanjian principal
   - Wage scale untuk rank
4. Review dan sesuaikan jika perlu
5. Generate PDF
6. Print untuk tanda tangan
7. Upload copy yang sudah ditandatangani

#### 4.4.3 Manajemen Kontrak
- Track status kontrak: DRAFT, ACTIVE, EXPIRED, TERMINATED
- Set reminder untuk kadaluarsa
- Generate kontrak perpanjangan
- Link ke wage scale dan asuransi

### 4.5 MODUL DOKUMEN

#### 4.5.1 Kategori Dokumen
- **Sertifikat:** COC, GMDSS, BST, AVSEC, dll
- **Medical:** Sertifikat medical examination
- **Identitas:** Paspor, buku pelaut
- **Training:** Kursus STCW, training perusahaan
- **Compliance:** Visa, yellow book, sertifikat KOSMA

#### 4.5.2 Tracking Dokumen
- Alert tanggal kadaluarsa (30/60/90 hari)
- Reminder perpanjangan
- Indikator status compliance
- Batch upload untuk multiple documents

#### 4.5.3 Sistem Compliance Eksternal

**Sertifikat KOSMA (Korea)**
- URL: https://www.marinerights.or.kr
- Tujuan: Training online 3 jam untuk kapal Korea
- Validitas: 1 tahun
- Track di sistem: Tanggal issue, tanggal kadaluarsa, nomor sertifikat

**Sertifikat Dephub (Indonesia)**
- URL: https://pelaut.dephub.go.id/login-perusahaan
- Tujuan: Validasi keaslian buku pelaut
- Diperlukan: Akun perusahaan SIUPAK
- Track: Status verifikasi, tanggal cek terakhir

**Visa Schengen NL (Belanda)**
- URL: https://consular.mfaservices.nl
- Tujuan: Visa untuk crew join kapal di pelabuhan EU
- Track: Status aplikasi, validitas visa, nomor paspor

### 4.6 MODUL PRINCIPAL & KAPAL

#### 4.6.1 Manajemen Principal
- Tambah pemilik kapal/management companies
- Simpan informasi kontak
- Track agency agreements:
  - Tanggal mulai/akhir agreement
  - Persentase komisi
  - Ketentuan pembayaran
  - Daftar kapal yang dikelola

#### 4.6.2 Manajemen Kapal
- Tambah kapal di bawah setiap principal
- Detail kapal:
  - Nomor IMO
  - Nama kapal
  - Jenis kapal (Tanker, Bulk Carrier, Container, dll)
  - Flag state
  - Gross tonnage
  - Manning requirements
- Track crew complement by rank

### 4.7 MODUL ACCOUNTING

#### 4.7.1 Manajemen Wage Scale
1. **Setup Wage Scale:**
   - Buat wage scales berdasarkan principal
   - Set rate untuk setiap rank
   - Komponen:
     - Basic wage (USD/bulan)
     - Overtime rate (USD/jam)
     - Persentase leave pay
     - Fixed overtime hours
   - Set effective date range

2. **Kalkulasi Total Upah:**
   ```
   Total Upah Bulanan = Basic Wage + (Overtime Hours × Overtime Rate) + Leave Pay
   ```

#### 4.7.2 Agency Fees
- Service fees yang ditagih ke principal
- Jenis:
  - Per crew placement fee
  - Monthly management fee
  - Document processing fee
- Track invoicing dan status pembayaran

#### 4.7.3 Manajemen Asuransi
- P&I (Protection & Indemnity) Insurance
- Group insurance untuk crew
- Track:
  - Nomor polis
  - Periode coverage
  - Jumlah premi
  - Beneficiaries

### 4.8 MODUL HR

#### 4.8.1 Rekrutmen
- Manajemen job posting
- Applicant tracking
- Penjadwalan interview
- Proses seleksi
- Workflow onboarding

#### 4.8.2 Hari Libur Nasional
- Maintain kalender hari libur Indonesia
- Referensi untuk kalkulasi cuti
- Kepatuhan terhadap undang-undang ketenagakerjaan

#### 4.8.3 Modul Disciplinary
- Catat insiden/pelanggaran
- Tindakan disipliner:
  - Peringatan lisan
  - Peringatan tertulis
  - Suspensi
  - Terminasi
- Catatan investigasi
- Tracking resolusi

### 4.9 MANAJEMEN MUTU (HGQS)

#### 4.9.1 Overview Sistem HGQS
Hanmarine Group Quality System mematuhi:
- ISO 9001:2015
- MLC 2006
- STCW 2010 Manila Amendments

#### 4.9.2 Document Control
- Prosedur (SOP)
- Work instructions
- Forms dan templates
- Records management
- Document revision control

#### 4.9.3 Internal Audit
- Perencanaan audit
- Audit checklists
- Non-conformance reports (NCR)
- Tracking corrective action
- Management review

#### 4.9.4 Continuous Improvement
- Preventive actions
- Inisiatif perbaikan proses
- Monitoring KPI
- Customer feedback

---

## 5. PROSEDUR OPERASIONAL STANDAR (SOP)

### 5.1 SOP-001: Proses Aplikasi Crew

**Tujuan:** Prosedur standar untuk proses aplikasi pelaut ke principal

**Lingkup:** Semua aplikasi crew untuk penugasan kapal

**Prosedur:**

1. **Pemilihan Crew (CDMO)**
   - Review database crew untuk kandidat yang sesuai
   - Cek validitas sertifikat (minimal 6 bulan tersisa)
   - Verifikasi sertifikat medical (valid)
   - Konfirmasi ketersediaan dan kesediaan

2. **Persiapan Dokumen (CDMO)**
   - Kumpulkan dokumen updated:
     - Copy paspor (minimal 12 bulan validitas)
     - COC dan endorsement
     - Sertifikat medical
     - Sertifikat STCW
     - Sertifikat khusus (jika diperlukan)
   - Siapkan form aplikasi CR-02
   - Scan semua dokumen dengan kualitas tinggi (PDF)

3. **Pembuatan Aplikasi (CDMO)**
   - Login ke HIMS
   - Navigasi ke **Crewing** → **Applications** → **New**
   - Isi detail aplikasi
   - Upload semua dokumen
   - Set status: PENDING
   - Save aplikasi

4. **Pengajuan ke Principal (OPERATIONAL)**
   - Review kelengkapan aplikasi
   - Email paket aplikasi ke principal
   - Catat tanggal pengajuan di HIMS
   - Follow up setelah 2-3 hari kerja

5. **Respons Principal (OPERATIONAL)**
   - Terima persetujuan/penolakan dari principal
   - Update status aplikasi di HIMS:
     - APPROVED: Lanjutkan ke assignment
     - REJECTED: Catat alasan, cari kandidat alternatif
     - PENDING: Lanjutkan follow-up

6. **Pembuatan Assignment (CDMO)**
   - Untuk aplikasi yang disetujui:
   - Buat assignment record
   - Set tanggal dan pelabuhan sign-on
   - Generate crew list entry

**Timeline:** 3-5 hari kerja dari pemilihan sampai persetujuan

**Records:** Form aplikasi, email korespondensi, surat persetujuan

---

### 5.2 SOP-002: Generate dan Tanda Tangan Kontrak

**Tujuan:** Standardisasi pembuatan dan eksekusi kontrak kerja

**Lingkup:** Semua kontrak SEA dan PKL

**Prosedur:**

1. **Inisiasi Kontrak (CDMO)**
   - Dari assignment yang disetujui → **Generate Contract**
   - Pilih jenis kontrak:
     - SEA: Untuk kepatuhan onboard (MLC)
     - PKL: Untuk kepatuhan regulasi Indonesia
   - Sistem otomatis mengisi data

2. **Review Kontrak (OPERATIONAL/ACCOUNTING)**
   - Verifikasi detail upah terhadap wage scale
   - Cek durasi dan ketentuan kontrak
   - Konfirmasi coverage asuransi
   - Review ketentuan repatriasi
   - Pastikan kepatuhan terhadap agreement principal

3. **Finalisasi Kontrak (DIRECTOR)**
   - Review kontrak lengkap
   - Setujui untuk printing
   - Generate PDF final

4. **Printing dan Tanda Tangan (ADMIN)**
   - Print kontrak dalam triplikat:
     - Original: Pelaut
     - Copy 1: File perusahaan
     - Copy 2: Principal (jika diperlukan)
   - Atur janji tanda tangan dengan pelaut
   - Witness signatures

5. **Eksekusi Kontrak**
   - Perwakilan perusahaan tanda tangan
   - Pelaut tanda tangan
   - Witness tanda tangan (jika diperlukan)
   - Tanggal dan cap setiap copy

6. **Manajemen Dokumen (CDMO)**
   - Scan kontrak yang sudah ditandatangani
   - Upload ke HIMS
   - Update status kontrak: ACTIVE
   - File copy fisik di folder crew
   - Kirim copy ke principal (email/kurir)

7. **Filing PKL (HR)**
   - Untuk kontrak PKL:
   - Submit ke sistem online Hubla
   - Dapatkan nomor registrasi
   - Catat di HIMS

**Timeline:** 1-2 hari dari persetujuan assignment

**Records:** Kontrak yang ditandatangani (3 copy), registrasi Hubla (PKL)

---

### 5.3 SOP-003: Manajemen Kadaluarsa Dokumen

**Tujuan:** Monitoring proaktif kadaluarsa sertifikat dan dokumen

**Lingkup:** Semua sertifikat crew, medical, paspor, visa

**Prosedur:**

1. **Monitoring Harian (CDMO)**
   - Login ke dashboard HIMS
   - Review widget "Expiring Documents"
   - Cek dokumen yang kadaluarsa dalam:
     - 30 hari: URGENT (alert merah)
     - 60 hari: WARNING (alert kuning)
     - 90 hari: NOTICE (alert biru)

2. **Notifikasi ke Crew**
   - Untuk dokumen yang kadaluarsa dalam 90 hari:
   - Kirim email/WhatsApp ke pelaut
   - Informasikan tentang tanggal kadaluarsa
   - Berikan instruksi perpanjangan
   - Set reminder untuk follow-up

3. **Koordinasi Perpanjangan (CDMO)**
   - Bantu crew dengan proses perpanjangan
   - Atur janji training/medical
   - Koordinasi dengan training centers
   - Track progress perpanjangan

4. **Pengumpulan Dokumen Updated**
   - Terima sertifikat yang diperpanjang dari pelaut
   - Verifikasi keaslian dan validitas
   - Scan dengan kualitas tinggi
   - Upload ke HIMS

5. **Penggantian Dokumen (CDMO)**
   - Update record dokumen di HIMS
   - Ganti dokumen lama dengan yang baru
   - Update tanggal kadaluarsa
   - Arsipkan sertifikat lama

6. **Cek Compliance (OPERATIONAL)**
   - Review mingguan semua status compliance crew
   - Pastikan tidak ada dokumen yang kadaluarsa
   - Laporkan issue kritis ke direktur

**Frekuensi:** Monitoring harian, laporan compliance mingguan

**Records:** Notifikasi perpanjangan, sertifikat updated, laporan compliance

---

### 5.4 SOP-004: Proses Penggantian Crew

**Tujuan:** Penggantian crew sistematis untuk kontrak yang berakhir

**Lingkup:** Semua crew sign-off dan penggantian

**Prosedur:**

1. **Review Bulanan (OPERATIONAL)**
   - Generate monthly checklist (minggu terakhir bulan)
   - Identifikasi kontrak yang berakhir dalam 60 hari ke depan
   - List semua posisi yang perlu penggantian
   - Konfirmasi tanggal sign-off dengan principal

2. **Perencanaan Penggantian (CDMO)**
   - Untuk setiap posisi yang berakhir:
   - Cari kandidat pengganti yang sesuai
   - Cek ketersediaan dan validitas dokumen
   - Buat shortlist (2-3 kandidat per posisi)
   - Diskusikan dengan manager operasional

3. **Pengajuan Aplikasi**
   - Ikuti SOP-001 (Proses Aplikasi Crew)
   - Submit aplikasi penggantian ke principal
   - Minta persetujuan minimal 30 hari sebelum sign-off

4. **Persetujuan dan Assignment**
   - Terima persetujuan principal
   - Buat assignment untuk crew pengganti
   - Set tanggal sign-on (biasanya sama dengan tanggal sign-off)
   - Koordinasi joining arrangements

5. **Manajemen Crew Sign-off (OPERATIONAL)**
   - Atur transportasi untuk crew sign-off
   - Koordinasi dengan kapal/agen
   - Siapkan dokumen sign-off
   - Kalkulasi upah akhir

6. **Manajemen Crew Sign-on (CDMO)**
   - Siapkan dokumen joining:
     - Kontrak (SEA & PKL)
     - Joining instructions
     - Tiket perjalanan
     - Cash advance (jika applicable)
   - Brief crew tentang detail kapal
   - Atur pre-departure medical (jika diperlukan)

7. **Update Crew List (CDMO)**
   - Update crew list di HIMS
   - Tandai crew sign-off sebagai "STANDBY"
   - Tandai crew sign-on sebagai "ON_BOARD"
   - Generate laporan crew list updated
   - Kirim ke principal dan kapal

8. **Penutupan Kontrak (ACCOUNTING)**
   - Tutup kontrak untuk crew sign-off
   - Kalkulasi settlement akhir
   - Proses pembayaran
   - Update status kontrak: COMPLETED

**Timeline:** Perencanaan 60 hari advance, eksekusi 30 hari

**Records:** Monthly checklist, aplikasi penggantian, crew list updates

---

### 5.5 SOP-005: Manajemen Compliance Eksternal

**Tujuan:** Mengelola requirement sistem regulasi eksternal

**Lingkup:** KOSMA, Dephub, Visa Schengen

**Prosedur:**

#### **A. Sertifikat KOSMA (Korea)**

1. **Cek Eligibilitas**
   - Untuk crew yang ditugaskan di kapal bendera Korea
   - Cek apakah sertifikat KOSMA valid (1 tahun)
   - Jika kadaluarsa atau assignment baru: lanjutkan registrasi

2. **Registrasi Online**
   - Kunjungi: https://www.marinerights.or.kr
   - Gunakan kredensial akun perusahaan
   - Daftarkan detail pelaut
   - Bayar biaya training (sekitar USD 50)

3. **Training Online**
   - Pelaut menyelesaikan kursus online 3 jam
   - Topik: Hukum tenaga kerja Korea, hak MLC, prosedur keluhan
   - Lulus tes online (minimal 70%)

4. **Download Sertifikat**
   - Download sertifikat setelah lulus
   - Upload ke HIMS di bawah "External Compliance"
   - Catat:
     - Nomor sertifikat
     - Tanggal issue
     - Tanggal kadaluarsa (1 tahun dari issue)
   - Print copy untuk file crew

5. **Tracking Perpanjangan**
   - Set reminder 2 bulan sebelum kadaluarsa
   - Beritahu crew untuk perpanjang sebelum assignment kapal Korea berikutnya

#### **B. Verifikasi Sertifikat Dephub (Indonesia)**

1. **Akses Akun**
   - Login ke: https://pelaut.dephub.go.id/login-perusahaan
   - Gunakan akun SIUPAK perusahaan
   - Navigasi ke "Verifikasi Sijil"

2. **Verifikasi Buku Pelaut**
   - Masukkan nomor buku pelaut
   - Masukkan nama pelaut
   - Klik "Verify"
   - Cek hasil verifikasi:
     - VALID: Catat tanggal verifikasi di HIMS
     - INVALID: Hubungi pelaut untuk klarifikasi

3. **Verifikasi Reguler**
   - Verifikasi semua crew aktif: Triwulanan
   - Verifikasi crew baru: Sebelum assignment pertama
   - Catat status verifikasi di HIMS

4. **Resolusi Diskrepansi**
   - Jika verifikasi gagal:
   - Hubungi crew untuk cek detail buku pelaut
   - Verifikasi dengan kantor Syahbandar lokal
   - Update records jika diperlukan
   - Re-verify online

#### **C. Aplikasi Visa Schengen (Belanda)**

1. **Cek Requirement Visa**
   - Untuk crew yang join kapal di pelabuhan EU
   - Cek apakah visa diperlukan (berdasarkan kewarganegaraan)
   - Verifikasi validitas paspor (minimal 6 bulan)

2. **Persiapan Dokumen**
   - Kumpulkan dokumen yang diperlukan:
     - Paspor (original + copy)
     - Foto paspor (2 pcs, 35x45mm)
     - Kontrak/surat assignment
     - Itinerary perjalanan
     - Proof of accommodation
     - Travel insurance
     - Surat undangan perusahaan

3. **Aplikasi Online**
   - Kunjungi: https://consular.mfaservices.nl
   - Buat akun (jika baru)
   - Isi form aplikasi visa
   - Upload dokumen pendukung
   - Bayar biaya visa (sekitar EUR 80)

4. **Booking Appointment**
   - Book appointment di VFS Global center (Jakarta)
   - Bawa dokumen original
   - Submit biometrics (sidik jari, foto)

5. **Tracking Aplikasi**
   - Track status aplikasi online
   - Catat di HIMS:
     - Nomor aplikasi
     - Tanggal submission
     - Status (PENDING/APPROVED/REJECTED)
   - Processing time: 15-20 hari kerja

6. **Pengambilan Visa**
   - Ambil paspor dengan visa dari VFS
   - Verifikasi detail visa:
     - Tanggal validitas
     - Jenis entry (single/multiple)
     - Durasi tinggal
   - Scan dan upload ke HIMS
   - Original ke crew

**Records:** Sertifikat, laporan verifikasi, copy visa

---

### 5.6 SOP-006: Laporan Compliance Bulanan

**Tujuan:** Generate laporan compliance reguler untuk manajemen

**Lingkup:** Semua crew, dokumen, kontrak

**Prosedur:**

1. **Pengumpulan Data (CDMO) - Minggu terakhir bulan**
   - Export database crew
   - Export laporan kadaluarsa dokumen
   - Export laporan status kontrak
   - Export laporan assignment

2. **Analisis (OPERATIONAL)**
   - Total crew: Active, On Board, Standby, Inactive
   - Dokumen yang kadaluarsa: 30/60/90 hari ke depan
   - Kontrak yang berakhir: 60 hari ke depan
   - Aplikasi pending: Ringkasan status
   - External compliance: Status KOSMA, Dephub, Visa

3. **Generate Laporan**
   - Buat laporan bulanan menggunakan template
   - Sertakan:
     - Executive summary
     - Statistik crew
     - Status compliance dokumen
     - Perpanjangan kontrak yang diperlukan
     - Issue kritis dan rekomendasi
   - Lampirkan tabel data pendukung

4. **Review dan Submission (OPERATIONAL)**
   - Review laporan untuk akurasi
   - Submit ke Director paling lambat tanggal 5 bulan berikutnya
   - Distribusikan ke:
     - Director
     - CDMO
     - Accounting (untuk data keuangan)

5. **Management Review (DIRECTOR)**
   - Review laporan bulanan
   - Identifikasi tren dan issue
   - Berikan feedback dan arahan
   - Arsipkan laporan di sistem mutu

**Frekuensi:** Bulanan (paling lambat tanggal 5 bulan berikutnya)

**Records:** Laporan compliance bulanan (arsip digital)

---

## 6. KEPATUHAN & MANAJEMEN MUTU

### 6.1 Maritime Labour Convention (MLC) 2006

#### 6.1.1 Requirement MLC
HIMS memastikan kepatuhan terhadap MLC 2006 melalui:

**Regulasi 1.4 - Rekrutmen dan Penempatan**
- Licensed manning agency (SIUPAK)
- Tidak ada biaya yang dibebankan ke pelaut
- Prosedur rekrutmen yang jelas
- Ketentuan kerja yang adil

**Regulasi 2.1 - Seafarers' Employment Agreement**
- Kontrak tertulis sebelum employment
- Copy diberikan ke pelaut
- Ketentuan dinyatakan dengan jelas
- Tanda tangan persetujuan mutual

**Regulasi 2.2 - Upah**
- Struktur upah yang jelas
- Pembayaran tepat waktu
- Wage slips disediakan
- Kepatuhan upah minimum

**Regulasi 2.3 - Jam Kerja dan Istirahat**
- Maksimal 14 jam kerja per hari
- Minimal 10 jam istirahat per periode 24 jam
- Overtime dikalkulasi dan dibayar dengan benar

**Regulasi 2.5 - Repatriasi**
- Hak repatriasi setelah kontrak
- Perusahaan menanggung biaya repatriasi
- Ketentuan repatriasi medis

**Regulasi 4.2 - Perawatan Medis**
- Medical examination sebelum employment
- Akses ke perawatan medis onboard
- Fasilitas medis di darat

#### 6.1.2 Kepatuhan MLC di HIMS
- Template kontrak sesuai format MLC
- Kalkulasi upah mencakup semua komponen MLC
- Tracking dokumen memastikan sertifikat medical valid
- Modul asuransi track coverage P&I
- Prosedur disipliner mengikuti prinsip perlakuan adil

### 6.2 Kepatuhan STCW

#### 6.2.1 Manajemen Sertifikat
HIMS track semua sertifikat mandatory STCW:

**Management Level:**
- Certificate of Competency (COC) + Endorsement
- GMDSS (Radio Officer)
- Advanced Fire Fighting
- Medical First Aid
- Ship Security Officer (SSO)

**Operational Level:**
- Proficiency in Survival Craft (PSC)
- Advanced Fire Fighting / Fire Prevention & Fire Fighting
- Elementary First Aid
- Personal Safety & Social Responsibility (PSSR)
- Security Awareness

**Support Level:**
- Basic Safety Training (BST):
  - Personal Survival Techniques
  - Fire Prevention & Fire Fighting
  - Elementary First Aid
  - Personal Safety & Social Responsibility

**Sertifikat Khusus:**
- Tanker Familiarization (Basic/Advanced)
- Ship Security Awareness
- Crowd Management (Kapal penumpang)
- Crisis Management (Kapal penumpang)

#### 6.2.2 Monitoring Kepatuhan STCW
- Tracking kadaluarsa sertifikat (alert 90/60/30 hari)
- Koordinasi perpanjangan dengan training centers
- Verifikasi endorsement dengan flag states
- Laporan compliance untuk principal

### 6.3 Manajemen Mutu ISO 9001:2015

#### 6.3.1 Kebijakan Mutu
Hanmarine berkomitmen untuk:
- Menyediakan pelaut kompeten yang memenuhi standar internasional
- Continuous improvement proses
- Kepuasan pelanggan
- Kepatuhan regulasi
- Operasi yang aman dan efisien

#### 6.3.2 Tujuan Mutu
- 98% success rate penempatan crew
- Zero sertifikat kadaluarsa pada crew aktif
- 95% rating kepuasan pelanggan
- 100% kepatuhan regulasi
- Continuous process improvement

#### 6.3.3 Document Control
HIMS berfungsi sebagai sistem document management:
- Controlled documents: SOP, prosedur, forms
- Version control dan revision history
- Access control berdasarkan role
- Archival dokumen obsolete

#### 6.3.4 Program Internal Audit
- Jadwal audit internal tahunan
- Audit checklists di modul quality
- Tracking non-conformance
- Follow-up corrective action
- Management review meetings

### 6.4 Peraturan Maritim Indonesia

#### 6.4.1 SIUPAK (Izin Usaha Manning Agency)
- Perusahaan dilisensikan oleh Kementerian Perhubungan
- Nomor lisensi tracked di sistem
- Kepatuhan perpanjangan tahunan

#### 6.4.2 PKL (Perjanjian Kerja Laut)
- Format kontrak kerja Indonesia
- Dikirim ke sistem online Hubla
- Diperlukan untuk semua pelaut Indonesia di pelayaran internasional
- Sistem track nomor registrasi PKL

#### 6.4.3 Requirement Syahbandar (Harbor Master)
- Verifikasi buku pelaut
- Pelaporan sign-on/sign-off
- Submission crew list

---

## 7. PENYELESAIAN MASALAH

### 7.1 Masalah Umum

#### 7.1.1 Masalah Login

**Issue:** Error "Invalid credentials"
**Solusi:**
1. Verifikasi email benar (gunakan domain @hanmarine.co)
2. Cek password (case-sensitive)
3. Clear browser cache dan cookies
4. Coba browser lain
5. Hubungi admin jika masalah berlanjut

**Issue:** Account terkunci setelah multiple failed attempts
**Solusi:**
- Tunggu 15 menit untuk automatic unlock
- Hubungi DIRECTOR atau ADMIN untuk manual unlock

#### 7.1.2 Permission Errors

**Issue:** Pesan "Insufficient permissions"
**Solusi:**
1. Verifikasi Anda login dengan akun yang benar
2. Cek role Anda sesuai dengan level permission yang diperlukan
3. Hubungi DIRECTOR jika Anda butuh additional permissions
4. Referensi ke matriks permission (Bagian 3.2)

#### 7.1.3 Data Tidak Tersimpan

**Issue:** Perubahan tidak tersimpan atau data hilang
**Solusi:**
1. Cek koneksi internet
2. Verifikasi semua field yang wajib sudah diisi
3. Cek validation errors (highlight merah)
4. Refresh page dan coba lagi
5. Hubungi technical support jika issue berlanjut

#### 7.1.4 Kegagalan Upload Dokumen

**Issue:** Tidak bisa upload dokumen
**Solusi:**
1. Cek ukuran file (maksimal 10MB per file)
2. Verifikasi format file (PDF, JPG, PNG diterima)
3. Cek kecepatan koneksi internet
4. Coba compress file yang besar
5. Gunakan browser lain jika issue berlanjut

### 7.2 Maintenance Sistem

#### 7.2.1 Scheduled Maintenance
- **Backup Harian:** 02:00 - 02:30 WIB
  - Database backup
  - File backup
  - Tidak ada downtime sistem yang diharapkan

- **Maintenance Mingguan:** Minggu 01:00 - 03:00 WIB
  - Update sistem
  - Security patches
  - Optimasi performa
  - Brief downtime mungkin terjadi (5-10 menit)

- **Maintenance Bulanan:** Sabtu pertama 23:00 - 01:00 WIB
  - Major updates
  - Optimasi database
  - Verifikasi system backup
  - Planned downtime (sampai 2 jam)

#### 7.2.2 Emergency Maintenance
- Diumumkan via email ke semua user
- System status page: https://app.hanmarine.co/status (jika tersedia)
- Issue kritis diselesaikan dalam 4 jam

### 7.3 Technical Support

#### 7.3.1 Kontak Support

**Level 1 Support (Issue Umum)**
- Email: support@hanmarine.co
- Telepon: +62 XXX XXXX XXXX
- Response time: 4 jam kerja

**Level 2 Support (Issue Teknis)**
- Email: tech@hanmarine.co
- Response time: 8 jam kerja

**Level 3 Support (Kritis/Emergency)**
- Kontak: DIRECTOR atau System Administrator
- Email: arief@hanmarine.co
- Telepon: [Kontak emergency]
- Response time: 1 jam

#### 7.3.2 Melaporkan Issue
Saat melaporkan issue, sertakan:
1. Nama dan email Anda
2. Role Anda di sistem
3. Deskripsi masalah
4. Langkah untuk reproduce issue
5. Screenshots (jika applicable)
6. Informasi browser dan operating system
7. Waktu saat issue terjadi

### 7.4 Data Recovery

#### 7.4.1 Penghapusan Tidak Disengaja
- Hubungi DIRECTOR segera
- Berikan detail data yang dihapus
- Recovery mungkin dari daily backup (dalam 7 hari)
- Recovery time: 2-4 jam

#### 7.4.2 System Failure
- Automatic failover ke backup system
- Data restored dari backup terbaru
- Maximum data loss: 24 jam
- Recovery time: 1-2 jam

---

## 8. LAMPIRAN

### 8.1 Glosarium

**Assignment:** Periode kerja crew member di kapal tertentu

**CDMO:** Crew Document Management Officer - mengelola dokumen crew dan compliance

**COC:** Certificate of Competency - lisensi profesional pelaut

**Crewing:** Proses rekrutmen, assignment, dan manajemen pelaut

**GMDSS:** Global Maritime Distress and Safety System - sertifikat komunikasi radio

**HGQS:** Hanmarine Group Quality System

**MLC:** Maritime Labour Convention 2006 - standar ketenagakerjaan pelaut internasional

**PKL:** Perjanjian Kerja Laut - kontrak kerja maritim Indonesia

**Principal:** Pemilik kapal atau perusahaan manajemen kapal

**Rank:** Posisi/jabatan pelaut di kapal (misal, Captain, Chief Engineer)

**SEA:** Seafarer Employment Agreement - kontrak sesuai MLC

**Sign-on:** Crew member bergabung dengan kapal

**Sign-off:** Crew member meninggalkan kapal

**SIUPAK:** Surat Izin Usaha Perekrutan Awak Kapal - lisensi manning agency Indonesia

**STCW:** Standards of Training, Certification and Watchkeeping for Seafarers

**Syahbandar:** Otoritas Harbor Master Indonesia

### 8.2 Chart Referensi Cepat

#### 8.2.1 Periode Validitas Sertifikat

| Sertifikat | Validitas | Lead Time Perpanjangan |
|-------------|----------|------------------------|
| COC (Certificate of Competency) | 5 tahun | 6 bulan |
| Sertifikat Medical | 2 tahun (di bawah 18: 1 tahun) | 3 bulan |
| Paspor | 10 tahun | 12 bulan |
| Sertifikat STCW (BST, dll) | 5 tahun | 6 bulan |
| Tanker Familiarization | Tidak ada kadaluarsa | N/A |
| Sertifikat KOSMA | 1 tahun | 2 bulan |
| Visa (varies) | Sesuai jenis visa | 2 bulan |

#### 8.2.2 Matriks Response Time

| Jenis Issue | Prioritas | Response Time | Resolution Time |
|------------|----------|---------------|-----------------|
| System Down | Kritis | 15 menit | 1-2 jam |
| Masalah Login | Tinggi | 1 jam | 4 jam |
| Permission Errors | Sedang | 4 jam | 1 hari kerja |
| Koreksi Data | Sedang | 4 jam | 1 hari kerja |
| Request Laporan | Rendah | 1 hari kerja | 2 hari kerja |
| Feature Requests | Rendah | 1 minggu | Sesuai jadwal development |

### 8.3 Informasi Kontak

**PT Hanmarine Indonesia**
- Alamat: [Alamat Perusahaan]
- Telepon: [Telepon Perusahaan]
- Email: info@hanmarine.co
- Website: https://hanmarine.co

**Akses Sistem:**
- URL Aplikasi: https://app.hanmarine.co
- Email Support: support@hanmarine.co
- Technical Support: tech@hanmarine.co

**Kontak Emergency:**
- Director: rinaldy@hanmarine.co
- Admin: arief@hanmarine.co
- Hotline 24/7: [Nomor Emergency]

### 8.4 Riwayat Revisi Dokumen

| Versi | Tanggal | Perubahan | Penulis |
|---------|------|---------|--------|
| 1.0 | 5 Desember 2025 | Manual lengkap awal | System Administrator |

---

**AKHIR PANDUAN**

*Dokumen ini dikontrol di bawah sistem document management HGQS. Setiap copy yang dicetak adalah uncontrolled. Untuk versi terbaru, referensi ke sistem HIMS.*
