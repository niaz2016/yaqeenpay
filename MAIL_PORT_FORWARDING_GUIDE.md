# Mail Server with Cloudflare Tunnel - Port Forwarding Guide

## ⚠️ CRITICAL: Cloudflare Tunnel Limitation

**Cloudflare Tunnel does NOT support mail protocols!**
- ✅ Tunnel works for: HTTP/HTTPS (ports 80, 443)
- ❌ Tunnel does NOT work for: SMTP (25, 587, 465), IMAP (143, 993), POP3 (110, 995)

**Solution**: Use **BOTH** Cloudflare Tunnel (for web) + **Port Forwarding** (for mail)

---

## 🔧 Step 1: Find Your Local Server IP

```powershell
# Get your local IP address (e.g., 192.168.1.100)
ipconfig | findstr IPv4
```

**Note your local IP** (example: `192.168.1.100` or `192.168.43.48`)

---

## 🌐 Step 2: Get Your Public IP Address

```powershell
# Get your public IP
(Invoke-WebRequest -Uri "https://api.ipify.org").Content
```

**Copy this public IP** - you'll use it in Cloudflare DNS.

---

## 📡 Step 3: Configure Router Port Forwarding

### Ports to Forward:
| Port | Protocol | Service | Forward To |
|------|----------|---------|------------|
| 25 | TCP | SMTP (incoming mail) | Your local IP:25 |
| 587 | TCP | SMTP Submission | Your local IP:587 |
| 465 | TCP | SMTPS (SSL) | Your local IP:465 |
| 993 | TCP | IMAPS (SSL) | Your local IP:993 |
| 143 | TCP | IMAP | Your local IP:143 (optional) |

### How to Configure (varies by router):

#### Example: TP-Link Router
1. Open router admin: `http://192.168.1.1` (or `192.168.0.1`)
2. Login with admin credentials
3. Go to **Forwarding** → **Virtual Servers** or **Port Forwarding**
4. Add each port:
   - Service Port: `25`
   - Internal Port: `25`
   - IP Address: `192.168.1.100` (your local server IP)
   - Protocol: `TCP`
   - Status: `Enabled`
5. Repeat for ports: 587, 465, 993

#### Example: Generic Router Steps
1. Access router: `http://192.168.1.1` or `http://192.168.0.1`
2. Find section: **NAT**, **Port Forwarding**, or **Virtual Server**
3. Create rules for each mail port
4. Save and restart router if needed

---

## 🔥 Step 4: Configure Windows Firewall

Run PowerShell as **Administrator**:

```powershell
# Allow inbound SMTP ports
New-NetFirewallRule -DisplayName "Mail SMTP" -Direction Inbound -Protocol TCP -LocalPort 25,587,465 -Action Allow

# Allow inbound IMAP ports
New-NetFirewallRule -DisplayName "Mail IMAP" -Direction Inbound -Protocol TCP -LocalPort 143,993 -Action Allow

# Allow inbound POP3 ports (optional)
New-NetFirewallRule -DisplayName "Mail POP3" -Direction Inbound -Protocol TCP -LocalPort 110,995 -Action Allow

# Verify rules created
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Mail*"}
```

---

## 🌍 Step 5: Configure Cloudflare DNS

### A. A Record for mail.techtorio.online
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **techtorio.online** → **DNS**
2. Click **Add record**
3. **Type**: `A`
4. **Name**: `mail`
5. **IPv4 address**: `YOUR_PUBLIC_IP` (from Step 2)
6. **Proxy status**: **DNS only** (gray cloud) ⚠️ CRITICAL - must be gray!
7. **TTL**: Auto
8. Click **Save**

### B. MX Record
1. **Type**: `MX`
2. **Name**: `@` (root domain)
3. **Mail server**: `mail.techtorio.online`
4. **Priority**: `10`
5. **Proxy status**: DNS only (gray cloud)
6. Click **Save**

### C. SPF Record
1. **Type**: `TXT`
2. **Name**: `@`
3. **Content**: `v=spf1 mx a:mail.techtorio.online ip4:YOUR_PUBLIC_IP ~all`
4. Click **Save**

### D. DKIM Record
1. **Type**: `TXT`
2. **Name**: `mail._domainkey`
3. **Content** (single line - remove quotes/parentheses):
```
v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAjtArwZqN0JF22JApS7AFC1bPsn3j0Mg2PMaMRy3q3Jiut6Ck0d8uGoYrcRzUlo6T8s/2QZmcxqYnBhGAfjwQgnrxYcIl0b6sahM3dHitlC71Didm+P4wReHuXxkKMttStp1iMB+SZHUiL3/WPXd+ot3r/ll+eJEu3sbqttwra3wQG/5Zda6RowRywm7pT34evN7HQnCmBx3zgpEIwMBP3o5HCRZM2g01+Usi5PevMDUC/W2wMI2usz8Vnqq3gBlX239DUHnJB+4L/legJsDebKT0oW0iGBgSBJoVKhz90D7Ev72FGTLKsSXLSMweRv7wKUN/BqpRIbhL5lV6ymboQQIDAQAB
```
4. Click **Save**

### E. DMARC Record
1. **Type**: `TXT`
2. **Name**: `_dmarc`
3. **Content**: `v=DMARC1; p=quarantine; rua=mailto:admin@techtorio.online; pct=100; adkim=s; aspf=s`
4. Click **Save**

---

## 🧪 Step 6: Test Port Forwarding

### From Another Network (use your phone's 4G):

```powershell
# Test SMTP port 25
Test-NetConnection mail.techtorio.online -Port 25

# Test SMTP submission port 587
Test-NetConnection mail.techtorio.online -Port 587

# Test IMAPS port 993
Test-NetConnection mail.techtorio.online -Port 993
```

**Expected Result**: `TcpTestSucceeded : True`

If **False**, port forwarding is not working - check router config.

---

## 📧 Step 7: Test IMAP Login

### Option A: Using Thunderbird/Outlook
1. Add new mail account
2. **Email**: `admin@techtorio.online`
3. **Password**: `Iftrmid00!`
4. **IMAP Server**: `mail.techtorio.online`
5. **IMAP Port**: `993` (SSL/TLS)
6. **SMTP Server**: `mail.techtorio.online`
7. **SMTP Port**: `587` (STARTTLS)

### Option B: Using Telnet (for testing)

From **external network** (phone 4G hotspot):
```bash
# Test IMAP connection
telnet mail.techtorio.online 993
# Should show: Connected

# Test SMTP connection
telnet mail.techtorio.online 587
# Should show banner: 220 mail.techtorio.online ESMTP Postfix
```

---

## ⚠️ Common Issues

### Issue 1: ISP Blocks Port 25
**Problem**: Many residential ISPs block inbound port 25
**Solution**: 
- Use port 587 for sending (always works)
- Contact ISP to unblock port 25, OR
- Use VPS/Relay for receiving mail

### Issue 2: Dynamic IP Changes
**Problem**: Your public IP changes periodically
**Solutions**:
- Use Dynamic DNS (DynDNS, No-IP, Duck DNS)
- Update Cloudflare A record automatically via script:

```powershell
# auto-update-dns.ps1
$PublicIP = (Invoke-WebRequest -Uri "https://api.ipify.org").Content
# Update Cloudflare via API (requires API token)
```

### Issue 3: Can't Connect from Outside
**Checklist**:
- [ ] Router port forwarding configured?
- [ ] Windows Firewall rules added?
- [ ] Cloudflare DNS A record set to **DNS only** (gray cloud)?
- [ ] Testing from **external network** (not local WiFi)?

---

## 📊 Architecture Summary

```
Internet
   │
   ├─► HTTP/HTTPS (ports 80, 443)
   │   └─► Cloudflare Tunnel → Your server (gateway container)
   │
   └─► SMTP/IMAP (ports 25, 587, 465, 993)
       └─► Port Forwarding → Your server (mailserver container)
```

---

## 🎯 Next Steps

1. **Configure router port forwarding** (most important!)
2. **Add Windows Firewall rules** (run as Admin)
3. **Update Cloudflare DNS** (A record + MX + SPF + DKIM + DMARC)
4. **Test from external network** (use phone 4G)
5. **Try logging in with email client**

Once ports are forwarded and firewall is configured, your mailbox will work!

Need help with specific router model? Let me know!

