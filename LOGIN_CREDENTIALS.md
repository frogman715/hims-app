# 🔐 HANMARINE HIMS - LOGIN CREDENTIALS
**UPDATED: 6 Desember 2025 - 22:30 WIB**

---

## ✅ KREDENSIAL YANG BENAR (WORKING!)

### 🎯 ADMIN UTAMA - GUNAKAN INI!
```
Email: admin@hanmarine.co
Password: admin123
Role: DIRECTOR (Full Access)
```

**⚠️ PENTING**: Domain email sekarang `@hanmarine.co` (bukan .com!)

---

---

## 👥 SEMUA USER ACCOUNTS (Password sama semua: admin123)

### 1️⃣ DIRECTOR Role (Full Access)
```
admin@hanmarine.co / admin123 ⭐ RECOMMENDED
rinaldy@hanmarine.co / admin123
```
- Full access ke semua module
- Bisa lihat/edit semua data
- Access: ALL modules

---

### 2️⃣ CDMO Role (Technical Admin)
```
cdmo@hanmarine.co / admin123
```
- System administrator
- Technical override capability
- Access: Crewing, Crew, Contracts, Documents, Compliance, Insurance

---

### 3️⃣ OPERATIONAL Role
```
dino@hanmarine.co / admin123
```
- Focus on vessel operations
- Access: Vessels, Crew assignments, Operations

---

### 4️⃣ ACCOUNTING Role
```
arief@hanmarine.co / admin123
```
- Financial management
- Access: Accounting, Agency Fees, Wages, Allotments, Billing

---

### 5️⃣ HR Role
```
hr@hanmarine.co / admin123
auditor@hanmarine.co / admin123
```
**hr@hanmarine.com** / hr123
- Human resources management
- Access: HR, Disciplinary, Orientation, National Holidays

---

### 6️⃣ CREW_PORTAL Role
**crew@hanmarine.com** / crew123
- Limited crew member access
- Access: View own profile, View own documents (read-only)

---

## 🚀 Quick Start

1. **Start Development Server:**
   ```bash
   cd /home/docter203/hanmarine_hims/hims-app
   npm run dev
   ```

2. **Open Browser:**
   ```
   http://localhost:3000/auth/signin
   ```

3. **Login dengan:**
   ```
   Email: admin@hanmarine.com
   Password: admin123
   ```

4. **Test Routes:**
   - Dashboard: http://localhost:3000/dashboard
   - Crew: http://localhost:3000/crew
   - Crew Onboard: http://localhost:3000/crew?status=ONBOARD
   - Prepare Joining: http://localhost:3000/crewing/prepare-joining
   - Compliance: http://localhost:3000/compliance

---

## ⚠️ PENTING

### Email yang SALAH (jangan gunakan):
- ❌ admin@hims.com (TIDAK ADA di database)
- ❌ finance@hims.com (TIDAK ADA di database)

### Email yang BENAR:
- ✅ **admin@hanmarine.com** (DIRECTOR - Main Admin)
- ✅ cdmo@hanmarine.com (CDMO)
- ✅ director@hanmarine.com (DIRECTOR)
- ✅ operational@hanmarine.com (OPERATIONAL)
- ✅ accounting@hanmarine.com (ACCOUNTING)
- ✅ hr@hanmarine.com (HR)
- ✅ crew@hanmarine.com (CREW_PORTAL)

---

## 🔄 Reset Database & Re-seed

Jika database corrupt atau perlu reset:

```bash
# Reset database
npx prisma migrate reset --force

# Re-seed data
npm run seed
```

Output akan tampilkan semua login credentials dengan jelas.

---

## 📊 Permission Matrix by Role

| Module | DIRECTOR | CDMO | OPERATIONAL | ACCOUNTING | HR | CREW_PORTAL |
|--------|----------|------|-------------|------------|----|----|
| Crewing | ✅ Full | ✅ Full | ✅ Edit | ❌ No | ❌ No | ❌ No |
| Crew Management | ✅ Full | ✅ Full | 👁️ View | ❌ No | 👁️ View | 👁️ View Own |
| Contracts | ✅ Full | ✅ Full | 👁️ View | ✅ Full | ❌ No | 👁️ View Own |
| Documents | ✅ Full | ✅ Full | 👁️ View | 👁️ View | ✏️ Edit | 👁️ View Own |
| Compliance | ✅ Full | ✅ Full | 👁️ View | 👁️ View | ✏️ Edit | ❌ No |
| Accounting | ✅ Full | ❌ No | ❌ No | ✅ Full | ❌ No | ❌ No |
| HR | ✅ Full | ❌ No | ❌ No | ❌ No | ✅ Full | ❌ No |
| Insurance | ✅ Full | ✅ Full | ❌ No | ✏️ Edit | ❌ No | ❌ No |
| Quality | ✅ Full | ✏️ Edit | ✏️ Edit | ❌ No | ❌ No | ❌ No |
| Admin | ✅ Full | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |

Legend:
- ✅ Full = Full Access (create, read, update, delete)
- ✏️ Edit = Edit Access (create, read, update)
- 👁️ View = View Only (read)
- ❌ No = No Access

---

## 📞 Support

Dokumentasi lengkap:
- [STATUS_FINAL.md](./STATUS_FINAL.md) - Complete status & testing guide
- [MARITIME_WORKFLOW.md](./MARITIME_WORKFLOW.md) - Maritime operations workflow
- [PERMISSION_MATRIX.md](./PERMISSION_MATRIX.md) - Detailed permission rules
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
