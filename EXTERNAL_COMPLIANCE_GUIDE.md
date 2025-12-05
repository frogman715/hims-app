# 🚀 QUICK ACCESS GUIDE - External Compliance Applications

## Akses Cepat dari Dashboard

### **1. Widget External Compliance** (Semua Role)

Di dashboard, scroll ke section **"External Compliance Systems"**:

```
┌─────────────────────────────────────────┐
│  External Compliance Systems            │
├─────────────────────────────────────────┤
│  🇰🇷 KOSMA Korea                        │
│  [Apply Training →] [Portal]            │  ← KLIK INI!
│  Total: 12 | Verified: 8 | Expired: 2  │
├─────────────────────────────────────────┤
│  🇮🇩 Dephub Indonesia                   │
│  [Verify Certificate →] [Portal]        │  ← KLIK INI!
│  Total: 45 | Verified: 40 | Pending: 5 │
├─────────────────────────────────────────┤
│  🇳🇱 Schengen Visa NL                   │
│  [Apply Visa →] [Portal]                │  ← KLIK INI!
│  Total: 8 | Approved: 5 | Processing: 3│
└─────────────────────────────────────────┘
```

**Button Actions:**
- **"Apply Training →"** / **"Verify Certificate →"** / **"Apply Visa →"** = Langsung ke form aplikasi
- **"Portal"** = Ke halaman utama sistem

---

### **2. Quick Actions Section** (Director & CDMO Role)

Di bawah widget, ada section **"Quick Apply - External Systems"**:

```
┌─────────────────────────────────────────┐
│  ⚡ Quick Apply - External Systems      │
│  [Manage All →]                         │
├─────────────────────────────────────────┤
│  🇰🇷 KOSMA Training    → Korea vessels  │
│  🇮🇩 Dephub Portal     → Verify sijil   │
│  🇳🇱 Schengen NL       → Tanker visa    │
└─────────────────────────────────────────┘
```

**Klik card untuk langsung buka aplikasi!**

---

## 📋 Workflow Per Sistem

### **KOSMA (Korea) - Training 3 Jam Online**

**Kapan Digunakan:**
- Setiap crew yang akan naik kapal berbendera Korea
- Wajib baru kalau mau join Korean vessel
- Berlaku 1 tahun (harus renew tiap tahun)

**Step-by-Step:**

1. **Dari Dashboard HIMS:**
   - Klik **"Apply Training →"** di widget KOSMA
   - Atau klik card **🇰🇷 KOSMA Training** di Quick Actions

2. **Di Portal KOSMA:**
   - Crew bikin akun sendiri (bisa bikin ID sendiri)
   - Login dengan akun baru
   - Ikut training online 3 jam
   - Selesai → Download sertifikat

3. **Kembali ke HIMS:**
   - Buka `/compliance/external`
   - Klik "Add New"
   - System Type: **KOSMA Certificate**
   - Upload sertifikat
   - Set expiry date (1 tahun dari issue date)
   - Save

**Reminder:** Set reminder di HIMS untuk renew 1 bulan sebelum expired!

---

### **Dephub Indonesia - Validasi Sijil/Buku Pelaut**

**Kapan Digunakan:**
- Untuk verify keaslian sertifikat crew Indonesia
- Sebelum crew berlayar internasional
- Cek apakah sijil/buku pelaut asli atau palsu

**Step-by-Step:**

1. **Persiapan:**
   - Pastikan perusahaan punya akun Dephub (pakai SIUPAK)
   - Login dengan akun perusahaan

2. **Dari Dashboard HIMS:**
   - Klik **"Verify Certificate →"** di widget Dephub
   - Atau klik card **🇮🇩 Dephub Portal**

3. **Di Portal Dephub:**
   - Login dengan akun perusahaan
   - Masukkan nomor sijil/seaman book crew
   - Sistem akan validasi:
     - ✅ Asli dan valid (online)
     - ✅ Asli tapi offline
     - ❌ Tidak ditemukan/palsu

4. **Kembali ke HIMS:**
   - Record hasil verifikasi
   - System Type: **Dephub Certificate**
   - Status: Verified/Rejected
   - Add notes (hasil pengecekan)

**Tip:** Cek semua crew baru sebelum sign contract!

---

### **Schengen Visa NL - Visa Belanda untuk Tanker**

**Kapan Digunakan:**
- Crew yang sudah di-approve join kapal tanker
- Kapal akan singgah di pelabuhan EU
- Crew belum punya visa Schengen

**Step-by-Step:**

1. **Requirement Check:**
   - Crew sudah approved untuk join vessel
   - Vessel confirmed beroperasi di EU waters
   - Paspor valid min. 6 bulan

2. **Dari Dashboard HIMS:**
   - Klik **"Apply Visa →"** di widget Schengen
   - Atau klik card **🇳🇱 Schengen NL**

3. **Di Portal Consular NL:**
   - Buat aplikasi visa online
   - Upload required documents:
     - Paspor
     - Employment letter
     - Vessel itinerary
     - Travel insurance
   - Submit aplikasi

4. **Track di HIMS:**
   - Add new compliance record
   - System Type: **Schengen Visa NL**
   - Status: **PENDING**
   - Add application number
   - Add verification URL (link ke aplikasi)

5. **Update Status:**
   - Cek portal secara berkala
   - Update di HIMS:
     - PENDING → VERIFIED (approved)
     - Or REJECTED (denied)
   - Set expiry date ketika approved

**Processing Time:** Biasanya 2-4 minggu

---

## 🎯 Tips & Best Practices

### **Untuk Director/Manager:**
1. Monitor widget stats di dashboard daily
2. Set reminder untuk expiring certificates (30 days before)
3. Assign staff untuk handle aplikasi

### **Untuk CDMO/Operational:**
1. Check crew compliance sebelum assignment
2. Apply KOSMA minimal 2 minggu sebelum joining
3. Verify Dephub untuk semua crew baru
4. Apply visa 1 bulan sebelum joining date

### **Untuk Staff:**
1. Bookmark external portal URLs
2. Simpan login credentials dengan aman
3. Track semua aplikasi di HIMS
4. Update status segera setelah dapat hasil

---

## 📱 Mobile Access

**Responsive Design:**
- Widget bisa diakses dari mobile browser
- Buttons tetap accessible
- Portal eksternal juga mobile-friendly

**Recommended Workflow:**
1. Cek status di mobile
2. Apply dari desktop (lebih mudah upload docs)
3. Track progress di HIMS mobile

---

## ❓ FAQ

**Q: Apakah link langsung aman?**
A: Ya, semua link membuka tab baru dengan `rel="noopener noreferrer"` untuk security.

**Q: Bisa auto-fill data crew?**
A: Belum. Saat ini manual entry di portal eksternal. Future: Pre-fill forms.

**Q: Data di HIMS sync dengan portal eksternal?**
A: Tidak otomatis. Manual tracking untuk security. Update manual di HIMS setelah proses di portal.

**Q: Bagaimana kalau lupa login portal eksternal?**
A: Gunakan password reset di masing-masing portal. HIMS hanya tracking, tidak store credentials.

**Q: Bisa export compliance reports?**
A: Ya, dari `/compliance/external` ada tombol export (coming soon).

---

## 🔐 Security Notes

**IMPORTANT:**
- Jangan share login credentials portal eksternal
- HIMS hanya track status, tidak simpan password portal
- Selalu logout dari portal setelah selesai
- Gunakan connection aman (HTTPS)
- Jangan screenshot data sensitive

---

## 📞 Support

**Masalah di HIMS:**
- Contact: IT Admin
- Check: `/admin/system-health`

**Masalah di Portal Eksternal:**
- **KOSMA**: support@marinerights.or.kr
- **Dephub**: helpdesk@dephub.go.id
- **Schengen**: Contact Dutch embassy

---

## 🎉 Quick Start Summary

**3 Langkah Mudah:**

1. **Login HIMS** → Go to Dashboard
2. **Klik Button** di widget atau Quick Actions
3. **Complete Form** di portal eksternal

**Sudah selesai?** Jangan lupa update status di HIMS!

---

**🚢 Happy Sailing! ⚓**
