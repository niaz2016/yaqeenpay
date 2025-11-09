# Self-Hosted Mail Server Setup
## Complete Email Server on Your Computer (Unlimited Mailboxes!)

### 🎯 What You'll Get
- ✅ **Unlimited email accounts** (sell mailboxes!)
- ✅ **Full control** - your own mail server
- ✅ **Professional emails** - admin@techtorio.online, sales@techtorio.online, etc.
- ✅ **IMAP/SMTP access** - use with Outlook, iPhone, Thunderbird
- ✅ **Spam/Virus protection** - SpamAssassin + ClamAV built-in
- ✅ **DKIM/SPF/DMARC** - proper email authentication
- ✅ **No monthly fees** - runs on your computer

---

## 📋 Step 1: Configure Cloudflare DNS (CRITICAL!)

### A. MX Record (Mail Exchange - for receiving emails)
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **techtorio.online** → **DNS**
2. Click **Add record**
3. **Type**: `MX`
4. **Name**: `@` (or leave blank for root domain)
5. **Mail server**: `mail.techtorio.online`
6. **Priority**: `10`
7. **TTL**: Auto
8. **Proxy status**: DNS only (gray cloud) ⚠️ IMPORTANT: Turn OFF proxy!
9. Click **Save**

### B. A Record (Points mail.techtorio.online to your server)
1. **Type**: `A`
2. **Name**: `mail`
3. **IPv4 address**: Get your public IP from Cloudflare Tunnel
   - If using Cloudflare Tunnel: Use `127.0.0.1` or skip this (tunnel handles it)
   - If port forwarding: Use your actual public IP
4. **Proxy status**: DNS only (gray cloud)
5. Click **Save**

### C. SPF Record (Sender Policy Framework - prevents spoofing)
1. **Type**: `TXT`
2. **Name**: `@`
3. **Content**: `v=spf1 mx a:mail.techtorio.online ~all`
4. **TTL**: Auto
5. Click **Save**

### D. DMARC Record (Email authentication policy)
1. **Type**: `TXT`
2. **Name**: `_dmarc`
3. **Content**: `v=DMARC1; p=quarantine; rua=mailto:admin@techtorio.online; pct=100; adkim=s; aspf=s`
4. **TTL**: Auto
5. Click **Save**

---

## 🚀 Step 2: Start Your Mail Server

Run this command to start the mail server:

```powershell
cd "d:\Work Repos\AI\yaqeenpay"
docker compose up -d mailserver
```

Wait for it to fully start (about 30-60 seconds).

---

## 🔑 Step 3: Generate DKIM Keys (Email Signature)

DKIM signs your emails to prove they're legitimate:

```powershell
# Generate DKIM keys
docker exec -it techtorio-mailserver setup config dkim keysize 2048

# Show the DKIM public key (you'll add this to DNS)
docker exec -it techtorio-mailserver cat /tmp/docker-mailserver/opendkim/keys/techtorio.online/mail.txt
```

Copy the output (it looks like: `"v=DKIM1; k=rsa; p=MIIBIjANBg..."`)

### Add DKIM to Cloudflare DNS:
1. **Type**: `TXT`
2. **Name**: `mail._domainkey`
3. **Content**: Paste the DKIM key (remove quotes and newlines, just the value)
4. Click **Save**

---

## 📧 Step 4: Create Email Accounts

Use the `manage-mailbox.ps1` script I'll create for you:

```powershell
# Create accounts (you'll be prompted for passwords)
.\manage-mailbox.ps1 -Action add -Email admin@techtorio.online
.\manage-mailbox.ps1 -Action add -Email noreply@techtorio.online
.\manage-mailbox.ps1 -Action add -Email support@techtorio.online
.\manage-mailbox.ps1 -Action add -Email sales@techtorio.online

# List all accounts
.\manage-mailbox.ps1 -Action list

# Delete an account
.\manage-mailbox.ps1 -Action delete -Email old@techtorio.online
```

---

## ⚙️ Step 5: Update Backend to Use Local Mail Server

Your backend will send emails through **localhost:587** (your own server!):

```json
{
  "EmailSettings": {
    "SmtpServer": "localhost",
    "SmtpPort": 587,
    "SmtpUsername": "noreply@techtorio.online",
    "SmtpPassword": "your-password-here",
    "SenderEmail": "noreply@techtorio.online",
    "SenderName": "TechTorio Escrow Service",
    "EnableSsl": true
  }
}
```

**Important**: Change `SmtpServer` from `smtp.gmail.com` to `localhost` or `mailserver` (container name).

---

## 🔌 Step 6: Cloudflare Tunnel Configuration

Since you're using Cloudflare Tunnel, you need to expose mail ports:

### Option A: Port Forwarding (Recommended for Mail Server)
Since mail servers need direct access to ports 25, 587, 465, 993, you should:

1. **Forward these ports on your router**:
   - Port 25 (SMTP incoming)
   - Port 587 (SMTP submission)
   - Port 465 (SMTPS)
   - Port 993 (IMAPS)

2. **Update your firewall** (Windows):
```powershell
# Allow incoming mail ports
New-NetFirewallRule -DisplayName "Mail SMTP" -Direction Inbound -Protocol TCP -LocalPort 25,587,465 -Action Allow
New-NetFirewallRule -DisplayName "Mail IMAP" -Direction Inbound -Protocol TCP -LocalPort 143,993 -Action Allow
```

### Option B: Use Cloudflare Tunnel + Port Forwarding Hybrid
- Use Cloudflare Tunnel for web traffic (ports 80, 443)
- Use port forwarding for mail traffic (ports 25, 587, 465, 993)

---

## 📱 Step 7: Access Your Emails

### Using Email Clients (Outlook, iPhone, Thunderbird):

**IMAP Settings (Receiving Mail):**
- Server: `mail.techtorio.online`
- Port: `993`
- Security: SSL/TLS
- Username: `admin@techtorio.online` (full email address)
- Password: (the one you set)

**SMTP Settings (Sending Mail):**
- Server: `mail.techtorio.online`
- Port: `587`
- Security: STARTTLS
- Authentication: Required
- Username: `admin@techtorio.online`
- Password: (the one you set)

---

## 💰 Selling Email Accounts

### Pricing Ideas:
- **Basic**: 1GB storage - $2/month
- **Professional**: 5GB storage - $5/month
- **Business**: 25GB storage - $15/month

### How to Create Customer Accounts:
```powershell
# Create account for customer
.\manage-mailbox.ps1 -Action add -Email customer@techtorio.online

# Set custom quota (in MB)
docker exec -it techtorio-mailserver setup email update customer@techtorio.online quota 1024
```

### Automate Billing:
- Integrate with your YaqeenPay escrow system
- Create subscriptions
- Auto-suspend accounts if payment fails

---

## 🧪 Testing

### Test Sending Email:
```powershell
# Send test email from container
docker exec -it techtorio-mailserver bash
echo "Test email body" | mail -s "Test Subject" youremail@gmail.com
```

### Test Receiving Email:
Send an email to `admin@techtorio.online` from Gmail/Outlook and check:
```powershell
# View mail logs
docker logs techtorio-mailserver --tail 100
```

### Check Email Reputation:
- [Mail Tester](https://www.mail-tester.com/) - Send email to their address and get a score
- [MXToolbox](https://mxtoolbox.com/SuperTool.aspx) - Check DNS records

---

## 🛠️ Troubleshooting

### Emails not receiving:
1. Check MX record: `nslookup -type=mx techtorio.online`
2. Check if port 25 is open: `Test-NetConnection mail.techtorio.online -Port 25`
3. View logs: `docker logs techtorio-mailserver --tail 200`

### Emails going to spam:
1. Check SPF: `nslookup -type=txt techtorio.online`
2. Check DKIM: `nslookup -type=txt mail._domainkey.techtorio.online`
3. Check DMARC: `nslookup -type=txt _dmarc.techtorio.online`
4. Test with [Mail Tester](https://www.mail-tester.com/)

### Can't send emails:
1. Check SMTP auth: Make sure username/password is correct
2. Check port 587: `Test-NetConnection mail.techtorio.online -Port 587`
3. Check firewall rules

---

## 📊 Monitoring

```powershell
# View real-time logs
docker logs -f techtorio-mailserver

# Check disk usage
docker exec -it techtorio-mailserver du -sh /var/mail/*

# List all mailboxes
docker exec -it techtorio-mailserver setup email list
```

---

## 🔒 Security Best Practices

1. ✅ **Always use strong passwords** for email accounts
2. ✅ **Enable Fail2Ban** (already configured) - blocks brute force attacks
3. ✅ **Keep ClamAV updated** - antivirus protection
4. ✅ **Monitor logs regularly** for suspicious activity
5. ✅ **Backup email data** regularly:
   ```powershell
   docker cp techtorio-mailserver:/var/mail ./backup/mail-$(Get-Date -Format 'yyyyMMdd')
   ```

---

## 🎉 Next Steps

1. Start the mail server
2. Configure DNS records (MX, SPF, DKIM, DMARC)
3. Create email accounts
4. Update backend configuration
5. Test sending/receiving
6. Start selling mailboxes! 💰

Ready to proceed? Let me know and I'll help you execute each step!

