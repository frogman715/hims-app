# 🚀 PANDUAN DEPLOYMENT HIMS KE NIAGAHOSTER VPS
**Complete Step-by-Step Guide for Beginners**

---

## 📋 **RINGKASAN KEPUTUSAN**

Berdasarkan situasi kamu:
- ✅ Hosting Niagahoster Bisnis (untuk website marketing)
- ✅ Domain hanmarine.co (sudah aktif)
- ✅ Komputer 8GB RAM, 500GB SSD, 1TB HDD

### **Pilihan Terbaik: Option 1 atau Option 2**

| Option | Biaya/Bulan | Cocok Untuk | Difficulty |
|--------|-------------|-------------|------------|
| **Option 1: Komputer Kamu** | Rp 0 | Komputer nyala 24/7, internet stabil | ⭐⭐⭐ |
| **Option 2: VPS Niagahoster** | Rp 99.000 | Professional, always online | ⭐⭐ |
| **Option 3: VPS Contabo** | Rp 75.000 | Best value, 4GB RAM | ⭐⭐ |

---

## 🎯 **OPTION 1: DEPLOY DI KOMPUTER KAMU** (GRATIS!)

### **Konsep**:
Komputer kamu jadi server production → Deploy HIMS → Expose ke internet via Cloudflare Tunnel → Domain app.hanmarine.co point ke tunnel

### **Keuntungan**:
- ✅ **GRATIS** (no monthly cost)
- ✅ **Specs lebih bagus** (8GB RAM vs VPS 1-2GB)
- ✅ **Full control** seperti VPS
- ✅ **Instant deployment** (no need wait VPS setup)

### **Requirements**:
- ✅ Komputer nyala 24/7 (atau minimal jam kerja 08:00-17:00)
- ✅ Internet stabil
- ✅ Mau install Ubuntu (dual boot atau full replace)

---

### **🔧 SETUP STEP-BY-STEP**

#### **A. Install Ubuntu 22.04 LTS**

**Option A1: Dual Boot (Keep Windows/Mac)**
1. Download Ubuntu 22.04 LTS Desktop: https://ubuntu.com/download/desktop
2. Buat bootable USB dengan Rufus (Windows) atau Etcher (Mac)
3. Restart komputer → Boot dari USB
4. Pilih "Install Ubuntu alongside [OS]" untuk dual boot
5. Alokasi minimal 100GB untuk Ubuntu partition
6. Follow installation wizard

**Option A2: Full Ubuntu (Replace OS)**
1. Download Ubuntu 22.04 LTS Server: https://ubuntu.com/download/server
2. Buat bootable USB dengan Rufus/Etcher
3. Boot dari USB → Pilih "Install Ubuntu Server"
4. Follow wizard → Pilih "Use entire disk"
5. Setup username & password

**Result**: Komputer sekarang running Ubuntu

---

#### **B. Deploy HIMS ke Ubuntu**

1. **Login Ubuntu & Update System**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Download Deployment Scripts**
   
   Dari komputer development (Windows/Mac), copy project ke Ubuntu:
   
   **If Ubuntu has GUI (Desktop version)**:
   - Copy folder `hims-app` via USB atau shared folder
   - Extract di `/home/yourusername/hims-app`
   
   **If Ubuntu Server (no GUI)**:
   - Upload via rsync dari development machine:
   ```bash
   # From development machine (Mac/Windows WSL/Linux)
   rsync -avz --exclude 'node_modules' --exclude '.next' \
     /path/to/hims-app/ username@ubuntu-ip:/home/username/hims-app/
   ```

3. **Run Automated Deployment Script**
   ```bash
   cd /home/username/hims-app
   sudo chmod +x deploy-to-server.sh
   sudo ./deploy-to-server.sh
   ```

   Script akan:
   - ✅ Install Node.js 20
   - ✅ Install PostgreSQL 16
   - ✅ Install Nginx
   - ✅ Setup database
   - ✅ Build aplikasi
   - ✅ Setup PM2 (auto-start on reboot)
   - ✅ Configure firewall
   - ✅ Setup automatic backups

   **Domain yang diminta**: `app.hanmarine.co`

4. **Verify Local Access**
   ```bash
   # Check PM2 status
   pm2 status
   
   # Check Nginx
   systemctl status nginx
   
   # Test local access
   curl http://localhost:3000
   ```

   ✅ **Result**: HIMS running di `http://localhost:3000`

---

#### **C. Expose ke Internet dengan Cloudflare Tunnel** (NO PUBLIC IP NEEDED!)

**Why Cloudflare Tunnel?**
- ✅ Tidak perlu public IP dari ISP
- ✅ Tidak perlu port forwarding di router
- ✅ Otomatis HTTPS (SSL)
- ✅ DDoS protection gratis
- ✅ Firewall advanced

**Steps**:

1. **Create Cloudflare Account**
   - Go to: https://dash.cloudflare.com/sign-up
   - Sign up dengan email
   - Add domain `hanmarine.co`:
     - Click "Add Site"
     - Enter: `hanmarine.co`
     - Choose "Free Plan"
     - Copy nameservers yang diberikan (e.g., `ns1.cloudflare.com`)

2. **Update Domain Nameservers di Niagahoster**
   - Login ke panel Niagahoster: https://panel.niagahoster.co.id
   - Go to: Domain → hanmarine.co → Nameservers
   - Change to Custom Nameservers:
     - Nameserver 1: `ns1.cloudflare.com` (sesuaikan dengan yang Cloudflare berikan)
     - Nameserver 2: `ns2.cloudflare.com`
   - Save changes
   - Wait 5-10 minutes untuk propagation

3. **Install Cloudflare Tunnel di Ubuntu**
   ```bash
   # Download cloudflared
   wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared-linux-amd64.deb
   
   # Login to Cloudflare
   cloudflared tunnel login
   ```
   
   Browser akan terbuka → Login Cloudflare → Authorize access → Pilih domain `hanmarine.co`

4. **Create Tunnel**
   ```bash
   # Create tunnel
   cloudflared tunnel create hims-tunnel
   
   # Note the Tunnel ID (save it!)
   ```

5. **Configure Tunnel**
   ```bash
   # Create config file
   sudo mkdir -p /etc/cloudflared
   sudo nano /etc/cloudflared/config.yml
   ```
   
   Paste this content (replace `TUNNEL_ID` with yours):
   ```yaml
   tunnel: TUNNEL_ID
   credentials-file: /root/.cloudflared/TUNNEL_ID.json
   
   ingress:
     - hostname: app.hanmarine.co
       service: http://localhost:3000
     - service: http_status:404
   ```
   
   Save: `Ctrl+O` → Enter → `Ctrl+X`

6. **Route DNS**
   ```bash
   cloudflared tunnel route dns hims-tunnel app.hanmarine.co
   ```

7. **Install as Service (Auto-start on reboot)**
   ```bash
   sudo cloudflared service install
   sudo systemctl enable cloudflared
   sudo systemctl start cloudflared
   
   # Check status
   sudo systemctl status cloudflared
   ```

8. **Verify Tunnel**
   ```bash
   cloudflared tunnel list
   
   # Should show: hims-tunnel | ACTIVE
   ```

✅ **DONE! Access your app at**: `https://app.hanmarine.co`

---

#### **D. Update Nginx untuk Cloudflare**

Since we're using Cloudflare Tunnel, update Nginx config:

```bash
sudo nano /etc/nginx/sites-available/hims
```

Change `server_name` to include localhost:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name localhost app.hanmarine.co;
    
    # Rest of config stays the same...
}
```

Restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

#### **E. Add Staff Login Button ke hanmarine.co**

Login cPanel Niagahoster → Website Builder → Edit homepage:

**Add button HTML**:
```html
<a href="https://app.hanmarine.co" 
   style="background: #0066cc; color: white; padding: 15px 30px; 
          border-radius: 5px; text-decoration: none; font-weight: bold;
          display: inline-block; margin: 20px 0;">
   🔐 Staff Login
</a>
```

Or add in navigation menu:
- Label: "Staff Login"
- URL: `https://app.hanmarine.co`
- Open in: New Tab

---

### **🎉 DEPLOYMENT COMPLETE! (Option 1)**

**Your Setup**:
- ✅ `hanmarine.co` → Website marketing (Niagahoster website builder)
- ✅ `app.hanmarine.co` → HIMS application (Running on your computer)
- ✅ **Cost**: Rp 0/month (only electricity)
- ✅ **SSL**: Automatic via Cloudflare
- ✅ **DDoS Protection**: Included
- ✅ **Auto-restart**: PM2 + Cloudflare service

**Login Credentials**:
- URL: https://app.hanmarine.co
- Email: admin@hims.com
- Password: admin123
- ⚠️ **CHANGE PASSWORD IMMEDIATELY!**

**Maintenance**:
```bash
# Check app status
pm2 status

# View logs
pm2 logs hims-app

# Restart app
pm2 restart hims-app

# Check tunnel status
sudo systemctl status cloudflared

# Manual backup
/root/backup-hims.sh
```

**If Computer Restart**:
- ✅ PM2 auto-starts HIMS
- ✅ Cloudflare tunnel auto-starts
- ✅ Nginx auto-starts
- ✅ PostgreSQL auto-starts
- **No manual intervention needed!**

---

---

## 🎯 **OPTION 2: VPS NIAGAHOSTER BARAMUDA** (Rp 99k/month)

**Perfect kalau**:
- ✅ Gak mau komputer nyala terus
- ✅ Mau professional 24/7 setup
- ✅ Budget ada Rp 100k/month

### **Steps**:

#### **A. Order VPS Niagahoster**

1. **Go to**: https://www.niagahoster.co.id/vps-murah
2. **Pilih paket**: VPS Baramuda
   - Harga: Rp 99.000/bulan
   - Specs: 1GB RAM, 40GB SSD, 1 Core CPU
   - OS: Ubuntu 22.04 LTS
3. **Checkout & Payment**
4. **Wait email** dengan VPS credentials:
   - IP Address: `103.150.xxx.xxx`
   - Username: `root`
   - Password: `xxxxxxxxxx`

---

#### **B. Connect ke VPS**

**From Mac/Linux**:
```bash
ssh root@103.150.xxx.xxx
# Enter password saat diminta
```

**From Windows**:
- Download PuTTY: https://www.putty.org/
- Open PuTTY
- Host: `103.150.xxx.xxx`
- Port: `22`
- Click "Open"
- Login as: `root`
- Password: (paste dari email)

✅ **Connected!**

---

#### **C. Upload Application Files**

**From your development machine**:

```bash
# Make upload script executable
chmod +x upload-to-server.sh

# Upload to VPS (replace IP with your VPS IP)
./upload-to-server.sh 103.150.xxx.xxx
```

This will upload all HIMS files to VPS.

---

#### **D. Run Automated Deployment**

**In VPS SSH terminal**:

```bash
cd /opt/hims-app
sudo bash deploy-to-server.sh
```

**During script, you'll be asked**:
- **Domain**: Enter `app.hanmarine.co`
- **SSL Installation**: Type `y` to continue

Script akan otomatis:
- ✅ Install semua dependencies
- ✅ Setup database
- ✅ Build aplikasi
- ✅ Configure Nginx + SSL
- ✅ Setup PM2
- ✅ Configure firewall
- ✅ Setup backups

**Duration**: 10-15 minutes

**At the end**, you'll see:
```
╔════════════════════════════════════════════════════════════╗
║              DEPLOYMENT COMPLETED SUCCESSFULLY!            ║
╚════════════════════════════════════════════════════════════╝

✓ Application URL: https://app.hanmarine.co
✓ Admin Login: admin@hims.com / admin123

Database Credentials (SAVE THIS!):
  Database: hims_production
  Username: hims_user
  Password: xxxxxxxxxxxxxxxxxxxx
```

**SAVE** database credentials to secure location!

---

#### **E. Configure DNS di Niagahoster**

1. **Login cPanel**: https://panel.niagahoster.co.id
2. **Go to**: Domain → hanmarine.co → Zone Editor
3. **Add A Record**:
   - Type: `A`
   - Name: `app` (will create app.hanmarine.co)
   - Address: `103.150.xxx.xxx` (your VPS IP)
   - TTL: `3600` (1 hour)
4. **Save**
5. **Wait 5-10 minutes** for DNS propagation

---

#### **F. Verify SSL & Access**

**Check DNS propagation**:
```bash
# From your computer
nslookup app.hanmarine.co
# Should return your VPS IP
```

**Access HIMS**:
- Open browser: https://app.hanmarine.co
- Login: admin@hims.com / admin123
- ✅ **WORKING!**

---

#### **G. Add Staff Login Button**

Same as Option 1 (section E)

---

### **🎉 DEPLOYMENT COMPLETE! (Option 2)**

**Your Setup**:
- ✅ `hanmarine.co` → Website (Niagahoster hosting)
- ✅ `app.hanmarine.co` → HIMS (VPS Niagahoster)
- ✅ **Cost**: Rp 99.000/month
- ✅ **Uptime**: 99.9% (24/7/365)
- ✅ **SSL**: Free Let's Encrypt
- ✅ **Auto-restart**: PM2 + systemd

---

---

## 🎯 **OPTION 3: VPS CONTABO** (Rp 75k/month - BEST VALUE)

**Perfect kalau**:
- ✅ Mau VPS tapi budget hemat
- ✅ Specs lebih gede (4GB RAM vs 1GB)
- ✅ Best value for money

### **Steps**:

Same as Option 2, tapi:
1. Order VPS dari Contabo: https://contabo.com/en/vps/
2. Pilih: VPS S (€4.50/month = ~Rp 75.000)
   - 4GB RAM, 50GB SSD, 4 Cores
   - OS: Ubuntu 22.04 LTS
3. Follow **Option 2 steps B-G**

**Subdomain DNS setup**:
- Still configure at Niagahoster cPanel (same as Option 2 E)
- Point `app.hanmarine.co` to Contabo VPS IP

---

---

## 🔧 **TROUBLESHOOTING**

### **Problem 1: Upload script fails**
```bash
# Error: rsync not found
sudo apt install rsync  # Install rsync

# Error: SSH connection refused
# Make sure you can SSH manually first:
ssh root@server-ip
```

---

### **Problem 2: Deployment script fails**
```bash
# Re-run with verbose output
sudo bash -x deploy-to-server.sh 2>&1 | tee deployment.log

# Check specific services
systemctl status nginx
systemctl status postgresql
pm2 status
```

---

### **Problem 3: Cannot access https://app.hanmarine.co**
```bash
# Check DNS propagation
nslookup app.hanmarine.co
# Should return VPS IP or Cloudflare IP

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check PM2
pm2 status
pm2 logs hims-app

# Check firewall
sudo ufw status
# Should show: 80/tcp ALLOW, 443/tcp ALLOW
```

---

### **Problem 4: SSL certificate fails**
```bash
# Manual SSL installation
sudo certbot --nginx -d app.hanmarine.co

# Check DNS first
nslookup app.hanmarine.co
# Must return correct IP before SSL

# Check if port 80/443 open
curl -I http://app.hanmarine.co
```

---

### **Problem 5: Cloudflare Tunnel not working** (Option 1)
```bash
# Check tunnel status
sudo systemctl status cloudflared

# View logs
sudo journalctl -u cloudflared -f

# Restart tunnel
sudo systemctl restart cloudflared

# Test local access first
curl http://localhost:3000
```

---

## 📊 **COMPARISON TABLE**

| Feature | Option 1: Komputer | Option 2: VPS Niaga | Option 3: VPS Contabo |
|---------|-------------------|---------------------|----------------------|
| **Cost** | Rp 0/month | Rp 99k/month | Rp 75k/month |
| **RAM** | 8GB | 1GB | 4GB |
| **Storage** | 500GB SSD | 40GB SSD | 50GB SSD |
| **Uptime** | Depends on you | 99.9% | 99.9% |
| **Setup** | Medium | Easy | Easy |
| **Public IP** | Not needed | Included | Included |
| **SSL** | Auto (Cloudflare) | Let's Encrypt | Let's Encrypt |
| **Support** | Self | Niagahoster | Contabo |
| **DDoS Protection** | Cloudflare | Basic | Basic |
| **Best For** | Save money, powerful specs | All-in-one Niagahoster | Best value |

---

## 🎯 **GUE RECOMMEND:**

**Pilih berdasarkan situasi**:

1. **Kalau budget 0 & komputer powerful** → **Option 1** ⭐⭐⭐⭐⭐
   - Gratis selamanya
   - Specs 8GB RAM (overkill for HIMS)
   - Butuh komputer nyala terus

2. **Kalau mau all-in-one Niagahoster** → **Option 2** ⭐⭐⭐⭐
   - Everything di Niagahoster (hosting + domain + VPS)
   - 1GB RAM cukup untuk HIMS
   - Rp 99k/month

3. **Kalau mau best value** → **Option 3** ⭐⭐⭐⭐⭐
   - 4GB RAM (4x lipat dari Niagahoster)
   - Lebih murah (Rp 75k vs 99k)
   - International provider (bagus untuk scaling)

---

## 📞 **NEED HELP?**

**Kasih tau gue**:
1. Mau pilih **Option 1, 2, atau 3**?
2. Kalau Option 1: Komputer specs & OS sekarang apa?
3. Kalau Option 2/3: Sudah order VPS atau belum?

**Gue siap guide step-by-step sampai HIMS live!** 🚀
