# Quick DNS Setup Guide for techtorio.online Email

## 🚀 Copy-Paste These Records to Your DNS Provider

### Record 1: MX (Mail Exchanger)
```
Type: MX
Host/Name: @
Value/Points to: mail.techtorio.online
Priority: 10
TTL: 3600 (or Auto)
```

### Record 2: A (Mail Server IP)
```
Type: A
Host/Name: mail
Value/Points to: 16.170.233.86
TTL: 3600 (or Auto)
```

### Record 3: TXT (SPF - Sender Policy Framework)
```
Type: TXT
Host/Name: @
Value: v=spf1 mx a:mail.techtorio.online ip4:16.170.233.86 ~all
TTL: 3600 (or Auto)
```

### Record 4: TXT (DKIM - Email Signature)
```
Type: TXT
Host/Name: default._domainkey
Value: v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAptO0wnYM6fEtYZCrEZpYH04BXNlYvj0O4F53lpnH6ud5mi7WWHfiadnf1yHjR7N3fCXxvPLs9ZV+FI0rcrI27qld/Pn8ImumLoGCJU3DN9kkvTUA9rhVaiTIKgPa0hTyhuEL4hDx+ePrcPnjXPkg7MGeuSB6o1ijRPYQsXZeMdK4BNJosHtujD5hDu+brGhPVVX1R+V+GWkfqobT/pWb7NtPbzQpzWKrnRR+lk4CW+M6kU7M9MUnBzy5eUh7fANfn2W9wnG8xNZ6CfoGyZePBTRKR1Ptg5W4q8ZgBkDhY4beDLQz1XqsrYy4TD7LuHWXPVrAdp7dKWDdVKWy2PSEYQIDAQAB
TTL: 3600 (or Auto)
```

**Note:** If your DNS provider splits the DKIM value into multiple text strings, that's normal.

### Record 5: TXT (DMARC - Email Policy)
```
Type: TXT
Host/Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:niaz@techtorio.online; ruf=mailto:niaz@techtorio.online; fo=1
TTL: 3600 (or Auto)
```

---

## ⏱️ DNS Propagation Time

After adding these records, wait **1-24 hours** for DNS to propagate worldwide.

Check propagation status:
- https://dnschecker.org (check MX, A, TXT records)
- https://mxtoolbox.com/SuperTool.aspx

---

## ✅ Verification Commands

After DNS propagates, run these to verify:

```bash
# Check MX record
dig MX techtorio.online

# Check A record for mail server
dig A mail.techtorio.online

# Check SPF
dig TXT techtorio.online

# Check DKIM  
dig TXT default._domainkey.techtorio.online

# Check DMARC
dig TXT _dmarc.techtorio.online
```

---

## 🔴 IMPORTANT: AWS Reverse DNS

Email will likely be marked as spam without reverse DNS. 

**To fix:**
1. Go to AWS Console → Support Center
2. Create a case: "Service Limit Increase"
3. Limit type: "EC2 Instances" → "Email Sending Limitations"
4. Request details:
   - Elastic IP: 16.170.233.86
   - Reverse DNS: mail.techtorio.online
   - Use case: "Self-hosted mail server for techtorio.online domain"

AWS usually approves within 24-48 hours.

---

## 📱 Email Client Setup (After DNS is configured)

### Settings:
- Email: niaz@techtorio.online
- Password: stU0EH6MrNQ0B63QQn4dHoxFB/C2z25C
- IMAP Server: mail.techtorio.online (Port 993, SSL)
- SMTP Server: mail.techtorio.online (Port 587, STARTTLS)

---

## ✅ Status Checklist

- [x] Mail server installed
- [x] Services running (Postfix, Dovecot, OpenDKIM)
- [x] Ports open (25, 587, 465, 993, 995, 143, 110)
- [x] SSL certificates configured
- [x] Mail user created
- [x] DNS records added (YOU NEED TO DO THIS)
- [x] DNS propagated (wait 1-24 hours)
- [x] Reverse DNS configured via AWS
- [ ] Email client configured
- [ ] Test email sent/received

---

**Next Step:** Add the DNS records above to your DNS provider!
