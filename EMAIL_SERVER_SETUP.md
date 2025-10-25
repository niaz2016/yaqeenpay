# Email Server Setup Complete ✅

## Summary
Self-hosted email server successfully installed on EC2 (16.170.233.86) for **techtorio.online**

**Email Address:** `niaz@techtorio.online`  
**Mail Server:** `mail.techtorio.online`  
**Status:** ✅ Installed | ⏳ Awaiting DNS Configuration

---

## 📧 Email Credentials

```
Email: niaz@techtorio.online
Username: niaz@techtorio.online (use full email address)
Password: stU0EH6MrNQ0B63QQn4dHoxFB/C2z25C

IMAP (Receiving):
- Server: mail.techtorio.online
- Port: 993
- Security: SSL/TLS

SMTP (Sending):
- Server: mail.techtorio.online  
- Port: 587 (STARTTLS) or 465 (SSL/TLS)
- Security: STARTTLS or SSL/TLS
- Authentication: Required (same credentials)
```

---

## 🌐 DNS Records to Add

**CRITICAL:** Add these records to your DNS provider (Cloudflare, Namecheap, etc.)

### 1. MX Record (Mail Exchanger)
```
Type: MX
Name: @
Value: mail.techtorio.online
Priority: 10
TTL: 3600
```

### 2. A Record (Mail Server)
```
Type: A
Name: mail
Value: 16.170.233.86
TTL: 3600
```

### 3. SPF Record (Sender Policy Framework)
```
Type: TXT
Name: @
Value: v=spf1 mx a:mail.techtorio.online ip4:16.170.233.86 ~all
TTL: 3600
```

### 4. DKIM Record (Email Authentication)
```
Type: TXT
Name: default._domainkey
Value: v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAptO0wnYM6fEtYZCrEZpYH04BXNlYvj0O4F53lpnH6ud5mi7WWHfiadnf1yHjR7N3fCXxvPLs9ZV+FI0rcrI27qld/Pn8ImumLoGCJU3DN9kkvTUA9rhVaiTIKgPa0hTyhuEL4hDx+ePrcPnjXPkg7MGeuSB6o1ijRPYQsXZeMdK4BNJosHtujD5hDu+brGhPVVX1R+V+GWkfqobT/pWb7NtPbzQpzWKrnRR+lk4CW+M6kU7M9MUnBzy5eUh7fANfn2W9wnG8xNZ6CfoGyZePBTRKR1Ptg5W4q8ZgBkDhY4beDLQz1XqsrYy4TD7LuHWXPVrAdp7dKWDdVKWy2PSEYQIDAQAB
TTL: 3600
```

**Note:** Some DNS providers require the DKIM value without `v=DKIM1; h=sha256; k=rsa;` prefix - just use the `p=MII...` part.

### 5. DMARC Record (Email Policy)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:niaz@techtorio.online; ruf=mailto:niaz@techtorio.online; fo=1
TTL: 3600
```

### 6. ⚠️ Reverse DNS (PTR) - AWS Action Required
**Contact AWS Support** to set up reverse DNS:
- Go to AWS Console → EC2 → Support Center
- Request: "Remove Email Sending Limitations"
- Specify: PTR record for 16.170.233.86 → mail.techtorio.online

**Why this is important:** Without reverse DNS, many email servers will reject your emails as spam.

---

## 📱 Setting Up Email Client

### For Gmail App (Android/iOS):
1. Add account → Other
2. Email: niaz@techtorio.online
3. Manual setup → IMAP
4. Incoming server: mail.techtorio.online, port 993, SSL
5. Outgoing server: mail.techtorio.online, port 587, STARTTLS
6. Username: niaz@techtorio.online
7. Password: (use the password above)

### For Outlook/Thunderbird:
1. Add account
2. Manual configuration
3. Use settings from "Email Credentials" section above

### For iPhone Mail:
1. Settings → Mail → Accounts → Add Account → Other
2. Add Mail Account
3. Use IMAP settings above

---

## ✅ What's Already Configured

- ✅ Postfix (SMTP server) - installed and configured
- ✅ Dovecot (IMAP/POP3) - installed and configured  
- ✅ OpenDKIM (email signing) - installed with 2048-bit keys
- ✅ SSL/TLS certificates (Let's Encrypt) - configured
- ✅ Firewall ports opened (25, 587, 465, 993, 995, 143, 110)
- ✅ Mail user created (niaz@techtorio.online)
- ✅ Secure password generated and stored
- ✅ Mail directory structure created
- ✅ Anti-spam protections configured

---

## ⏳ Next Steps

### Immediate (You need to do):
1. **Add DNS records** listed above to your DNS provider
2. **Wait 1-24 hours** for DNS propagation
3. **Contact AWS Support** to request reverse DNS (PTR record)

### After DNS Propagation:
4. Verify DNS records:
   ```bash
   dig MX techtorio.online
   dig TXT default._domainkey.techtorio.online
   dig TXT techtorio.online
   ```

5. Configure email client with credentials above

6. Test sending/receiving email

---

## 🧪 Testing Email (After DNS is configured)

### Send Test Email from Server:
```bash
ssh ubuntu@16.170.233.86
echo "Test email body" | mail -s "Test from techtorio.online" your-personal-email@gmail.com
```

### Check Mail Logs:
```bash
ssh ubuntu@16.170.233.86
sudo tail -f /var/log/mail.log
```

### Verify Services Running:
```bash
ssh ubuntu@16.170.233.86
sudo systemctl status postfix dovecot opendkim
```

---

## 📂 Files on Server

All mail configuration and credentials stored securely:

```
/root/mail-secrets/niaz-mail-credentials.txt  - Email login credentials
/root/mail-secrets/dns-records.txt            - DNS records to add
/root/mail-secrets/dkim-public-key.txt        - DKIM public key
/var/log/mail-setup.log                       - Installation log
/var/mail/vhosts/techtorio.online/niaz/       - Mail storage directory
```

To view credentials on server:
```bash
ssh ubuntu@16.170.233.86
sudo cat /root/mail-secrets/niaz-mail-credentials.txt
```

---

## 🔒 Security Features

- ✅ TLS 1.2+ only (no SSLv3, TLSv1.0, TLSv1.1)
- ✅ Strong cipher suites configured
- ✅ SASL authentication required for sending
- ✅ SPF, DKIM, DMARC configured
- ✅ RBL (spam blacklist) checking enabled
- ✅ Rate limiting and anti-spam rules
- ✅ Secure password (24-character random)
- ✅ Restricted file permissions (600) for secrets

---

## 📊 Email Deliverability Checklist

After DNS is configured, check your email reputation:

- [ ] MX record resolves correctly
- [ ] Reverse DNS (PTR) configured via AWS
- [ ] SPF record validates (use mxtoolbox.com/spf.aspx)
- [ ] DKIM signature validates (use mail-tester.com)
- [ ] DMARC policy published
- [ ] Not listed on spam blacklists (check mxtoolbox.com/blacklists.aspx)
- [ ] Test email score (send to mail-tester.com and get 10/10 score)

---

## 🆘 Troubleshooting

### Email not sending:
```bash
# Check Postfix logs
sudo tail -100 /var/log/mail.log

# Check if Postfix is running
sudo systemctl status postfix

# Test SMTP connection
telnet mail.techtorio.online 587
```

### Email not receiving:
```bash
# Check Dovecot logs
sudo tail -100 /var/log/mail.log | grep dovecot

# Check if Dovecot is running
sudo systemctl status dovecot

# Check mailbox
sudo ls -la /var/mail/vhosts/techtorio.online/niaz/
```

### DKIM not working:
```bash
# Check DKIM service
sudo systemctl status opendkim

# Test DKIM DNS
dig TXT default._domainkey.techtorio.online
```

---

## 💰 Cost Summary

- **Mail Server Software:** FREE (open source)
- **EC2 Server:** Already running (no additional cost)
- **DNS Records:** FREE
- **SSL Certificates:** FREE (Let's Encrypt)
- **Total Additional Cost:** $0/month

Compare to:
- Google Workspace: $6/user/month
- AWS WorkMail: $4/user/month
- Microsoft 365: $6/user/month

---

## 🎯 Summary

✅ **Email server fully configured and running**  
⏳ **Waiting for DNS configuration** (you need to add records)  
⏳ **Waiting for AWS reverse DNS** (contact AWS support)  

Once DNS is configured and propagated, your email will be fully functional!

**Questions? Check the logs or contact support.**
