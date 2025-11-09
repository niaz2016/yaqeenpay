# ================================================================
# techtorio MAIL SERVER - QUICK START GUIDE
# ================================================================

## ✅ COMPLETED SETUP

Your mail server is now running with the following configuration:

### Container Status
- Container Name: `techtorio-mailserver`
- Domain: `techtorio.online`
- Hostname: `mail.techtorio.online`
- Status: Running

### First Mailbox Created
- Email: `admin@techtorio.online`
- Password: `Admin@Pass123!`
- Quota: 5GB (default)

### Ports Exposed
- **25** - SMTP (Incoming mail from other servers)
- **587** - Submission (Authenticated sending with STARTTLS)
- **465** - SMTPS (Authenticated sending with SSL/TLS)
- **993** - IMAPS (Secure IMAP for mail clients)
- **143** - IMAP (Unencrypted IMAP)
- **995** - POP3S (Secure POP3)
- **110** - POP3 (Unencrypted POP3)

---

## 📋 NEXT STEPS

### STEP 1: Configure DNS Records (REQUIRED)

**See full details in:** `MAILSERVER_DNS_CONFIG.txt`

**Critical Records to Add to Cloudflare:**

1. **Get Your Public IP First:**
   ```powershell
   (Invoke-WebRequest -Uri "https://api.ipify.org").Content
   ```

2. **Add to Cloudflare DNS:**
   - **A Record**: `mail` → Your Public IP (⚠️ TURN OFF ORANGE CLOUD!)
   - **MX Record**: `@` → `mail.techtorio.online` (Priority: 10)
   - **TXT (SPF)**: `@` → `v=spf1 mx a:mail.techtorio.online ~all`
   - **TXT (DKIM)**: `mail._domainkey` → [Get via command below]
   - **TXT (DMARC)**: `_dmarc` → `v=DMARC1; p=quarantine; rua=mailto:admin@techtorio.online`

3. **Get DKIM Public Key:**
   ```powershell
   docker exec techtorio-mailserver cat /tmp/docker-mailserver/opendkim/keys/techtorio.online/mail.txt
   ```

### STEP 2: Port Forwarding (REQUIRED if running locally)

⚠️ **IMPORTANT**: Cloudflare Tunnel does NOT support email ports!

You have **TWO OPTIONS**:

#### Option A: Port Forwarding (Free but Complex)
1. Find your local IP: `ipconfig` (look for IPv4 Address)
2. Log into your router (usually `192.168.1.1` or `192.168.0.1`)
3. Forward these ports to your local IP:
   - TCP 25, 587, 465 (SMTP)
   - TCP 993, 143 (IMAP)
   - TCP 995, 110 (POP3)
4. Configure Windows Firewall to allow these ports

**CAVEATS:**
- Your ISP might block port 25 (most do for residential)
- Dynamic IP changes break email
- Home internet downtime = email down
- Residential IPs often blacklisted

#### Option B: Deploy to VPS (Recommended - $5/month)
1. Get VPS from Vultr/Hetzner/DigitalOcean ($5-6/month)
2. Copy `docker-compose.yml` and `mailserver.env` to VPS
3. Run: `docker-compose up -d mailserver`
4. Update DNS A record with VPS IP
5. Set reverse DNS (PTR) record via VPS provider

**BENEFITS:**
- Static IP with proper reverse DNS
- No port blocking
- 100% uptime
- Professional email deliverability
- ISP doesn't block port 25

---

## 🔧 MAILBOX MANAGEMENT

### Create a New Mailbox
```powershell
docker exec techtorio-mailserver setup email add user@techtorio.online SecurePassword123!
```

### List All Mailboxes
```powershell
docker exec techtorio-mailserver setup email list
```

### Delete a Mailbox
```powershell
docker exec techtorio-mailserver setup email del user@techtorio.online
```

### Change Password
```powershell
docker exec techtorio-mailserver setup email update user@techtorio.online NewPassword456!
```

### Check Mailbox Quota Usage
```powershell
docker exec techtorio-mailserver setup quota get user@techtorio.online
```

### Set Custom Quota (in MB)
```powershell
docker exec techtorio-mailserver setup quota set user@techtorio.online 10240
# This sets 10GB quota (10240 MB)
```

---

## 📧 EMAIL CLIENT CONFIGURATION

### For Outlook (Desktop)
1. Open Outlook → File → Add Account
2. Select **Manual setup**
3. Choose **POP or IMAP**

**Incoming Mail (IMAP):**
- Server: `mail.techtorio.online`
- Port: `993`
- Encryption: SSL/TLS
- Username: `admin@techtorio.online`
- Password: `Admin@Pass123!`

**Outgoing Mail (SMTP):**
- Server: `mail.techtorio.online`
- Port: `587` (or 465)
- Encryption: STARTTLS (or SSL/TLS for port 465)
- Username: `admin@techtorio.online`
- Password: `Admin@Pass123!`
- ✅ Requires authentication

### For iPhone/iPad
1. Settings → Mail → Accounts → Add Account
2. Select **Other**
3. Add Mail Account
4. Enter:
   - Name: Your Name
   - Email: `admin@techtorio.online`
   - Password: `Admin@Pass123!`
   - Description: Techtorio Mail

**IMAP Settings:**
- Host: `mail.techtorio.online`
- Port: `993`
- SSL: ON
- Username: `admin@techtorio.online`

**SMTP Settings:**
- Host: `mail.techtorio.online`
- Port: `587`
- SSL: ON
- Username: `admin@techtorio.online`

### For Android (Gmail App)
1. Open Gmail app → Settings → Add account
2. Select **Other**
3. Enter: `admin@techtorio.online`
4. Account type: **IMAP**
5. Password: `Admin@Pass123!`

**Incoming server:**
- Server: `mail.techtorio.online`
- Port: `993`
- Security type: SSL/TLS

**Outgoing server:**
- Server: `mail.techtorio.online`
- Port: `587`
- Security type: STARTTLS
- ✅ Require sign-in

---

## 🔍 TESTING & TROUBLESHOOTING

### Test Email Sending
```powershell
# From inside the container
docker exec -it techtorio-mailserver bash
echo "Test email body" | mail -s "Test Subject" your-email@gmail.com
exit
```

### Check Logs
```powershell
# View all logs
docker logs techtorio-mailserver

# Follow logs in real-time
docker logs techtorio-mailserver -f

# Last 50 lines
docker logs techtorio-mailserver --tail=50
```

### Check Services Status
```powershell
docker exec techtorio-mailserver supervisorctl status
```

### Verify DNS Records
```powershell
# Check MX record
nslookup -type=MX techtorio.online

# Check SPF record
nslookup -type=TXT techtorio.online

# Check DKIM
nslookup -type=TXT mail._domainkey.techtorio.online

# Check DMARC
nslookup -type=TXT _dmarc.techtorio.online
```

### Test Email Deliverability
1. Send email to: `test@mail-tester.com`
2. Visit: https://www.mail-tester.com/
3. Check your score (aim for 10/10)

### Check Blacklists
- Visit: https://mxtoolbox.com/blacklists.aspx
- Enter your domain or IP

---

## 🛠️ ADVANCED CONFIGURATION

### Enable Web-based Email (Roundcube)
```yaml
# Add to docker-compose.yml
webmail:
  image: roundcube/roundcubemail:latest
  container_name: techtorio-webmail
  depends_on:
    - mailserver
  environment:
    - ROUNDCUBEMAIL_DEFAULT_HOST=ssl://mail.techtorio.online
    - ROUNDCUBEMAIL_DEFAULT_PORT=993
    - ROUNDCUBEMAIL_SMTP_SERVER=tls://mail.techtorio.online
    - ROUNDCUBEMAIL_SMTP_PORT=587
  ports:
    - "8082:80"
  networks:
    - techtorio-network
```

Then access at: `http://localhost:8082`

### Adjust Spam Filtering
```powershell
# Check SpamAssassin config
docker exec techtorio-mailserver cat /etc/spamassassin/local.cf

# Adjust spam threshold (default is 5.0)
docker exec techtorio-mailserver bash -c 'echo "required_score 3.0" >> /tmp/docker-mailserver/spamassassin-rules.cf'

# Restart mail server
docker restart techtorio-mailserver
```

### View Mail Queue
```powershell
docker exec techtorio-mailserver postqueue -p
```

### Flush Mail Queue
```powershell
docker exec techtorio-mailserver postqueue -f
```

---

## 📊 MONITORING & MAINTENANCE

### Check Disk Usage
```powershell
docker exec techtorio-mailserver du -sh /var/mail
docker exec techtorio-mailserver du -sh /var/mail-state
```

### Backup Mailboxes
```powershell
# Create backup directory
mkdir mailserver-backup

# Backup mail data
docker run --rm -v techtorio_mailserver_data:/data -v ${PWD}/mailserver-backup:/backup alpine tar czf /backup/mail-data-backup.tar.gz /data

# Backup configuration
docker run --rm -v techtorio_mailserver_config:/config -v ${PWD}/mailserver-backup:/backup alpine tar czf /backup/mail-config-backup.tar.gz /config
```

### Restore from Backup
```powershell
docker run --rm -v techtorio_mailserver_data:/data -v ${PWD}/mailserver-backup:/backup alpine tar xzf /backup/mail-data-backup.tar.gz -C /
```

---

## 🔐 SECURITY BEST PRACTICES

1. **Use Strong Passwords**: Minimum 12 characters, mix of upper/lower/numbers/symbols
2. **Enable Fail2Ban**: Already enabled in mailserver.env
3. **Monitor Logs**: Check for suspicious activity regularly
4. **Keep Updated**: Update mail server regularly
   ```powershell
   docker-compose pull mailserver
   docker-compose up -d mailserver
   ```
5. **Enable TLS Only**: Disable unencrypted connections (already configured)
6. **Set Up Backup**: Automate daily backups of mail data

---

## 📞 SUPPORT & DOCUMENTATION

### Official Documentation
- Docker Mailserver: https://docker-mailserver.github.io/docker-mailserver/latest/
- Postfix: http://www.postfix.org/documentation.html
- Dovecot: https://doc.dovecot.org/

### Common Issues

**Problem**: Can't receive emails
**Solution**: Check port 25 is open and MX record is configured

**Problem**: Emails go to spam
**Solution**: Ensure SPF, DKIM, DMARC are configured correctly and reverse DNS is set

**Problem**: Can't send emails
**Solution**: Check port 587/465 is open and SMTP authentication is working

**Problem**: Mail server not starting
**Solution**: Check logs with `docker logs techtorio-mailserver`

---

## 🎯 SUMMARY

✅ Mail server installed and running
✅ Admin mailbox created: `admin@techtorio.online`
✅ DKIM keys generated
✅ SSL certificates configured
⏳ DNS records need to be added to Cloudflare
⏳ Ports need to be exposed (port forwarding or VPS)

**Estimated Time to Fully Operational:**
- If using VPS: 30 minutes
- If using port forwarding: 1-2 hours (+ ISP cooperation)

**Recommended Next Action:**
Deploy to a cheap VPS ($5/month) for professional, reliable email service.

