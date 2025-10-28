# Email Delivery Issue - Fix Guide

## Problem
- Emails sent from Gmail to techtorio.online are not received
- Emails sent from techtorio.online to Gmail are not delivered

## Root Causes

### 1. **DNS Records Missing/Incorrect**
Your domain needs proper DNS records for email:

#### Required DNS Records:
```
Type: MX
Name: @
Value: mail.techtorio.online
Priority: 10

Type: A
Name: mail
Value: 16.170.233.86

Type: TXT (SPF)
Name: @
Value: v=spf1 ip4:16.170.233.86 ~all

Type: TXT (DKIM) - if using OpenDKIM
Name: default._domainkey
Value: (from /etc/opendkim/keys/techtorio.online/default.txt)
```

### 2. **AWS Port 25 Restrictions**
AWS throttles/blocks port 25 by default on EC2 instances to prevent spam.

**Solution**: Request removal via AWS Support
- Go to: https://aws.amazon.com/forms/ec2-email-limit-rdns-request
- Request Type: Remove email sending limitations
- Use Case: Legitimate transactional email server

### 3. **Postfix Configuration**
Postfix must be configured to:
- Accept mail for techtorio.online domain
- Listen on all interfaces (not just localhost)
- Use virtual mailbox domains

### 4. **Reverse DNS (PTR Record)**
Email servers check reverse DNS. AWS requires you to set this.

**Solution**: Same form as #2 above - request PTR record for 16.170.233.86 → mail.techtorio.online

## Fix Steps

### Step 1: Run Diagnostics
```powershell
# On Windows
.\diagnose-mail.ps1
```

Or on the server:
```bash
# Check what domains Postfix accepts mail for
sudo postconf mydestination virtual_mailbox_domains

# Check if listening on public interface
sudo netstat -tlnp | grep :25

# Watch live mail logs
sudo tail -f /var/log/mail.log
```

### Step 2: Fix Postfix Configuration
Upload and run the fix script:
```bash
# On your server
chmod +x fix-mail-server.sh
sudo ./fix-mail-server.sh
```

Or manually:
```bash
# Configure virtual domains
sudo postconf -e "mydestination = localhost"
sudo postconf -e "virtual_mailbox_domains = techtorio.online"
sudo postconf -e "inet_interfaces = all"
sudo postconf -e "myhostname = mail.techtorio.online"

# Restart Postfix
sudo systemctl restart postfix
```

### Step 3: Add DNS Records
Go to your DNS provider (Cloudflare, Route53, etc.) and add:

1. **MX Record**:
   - Type: MX
   - Name: @ (or techtorio.online)
   - Value: mail.techtorio.online
   - Priority: 10
   - TTL: 3600

2. **A Record for mail subdomain**:
   - Type: A
   - Name: mail
   - Value: 16.170.233.86
   - TTL: 3600

3. **SPF Record**:
   - Type: TXT
   - Name: @ (or techtorio.online)
   - Value: `v=spf1 ip4:16.170.233.86 ~all`
   - TTL: 3600

4. **DKIM Record** (if using OpenDKIM):
   ```bash
   # Get DKIM public key from server
   sudo cat /etc/opendkim/keys/techtorio.online/default.txt
   ```
   - Type: TXT
   - Name: default._domainkey
   - Value: (copy from file above)
   - TTL: 3600

### Step 4: AWS Security Group
Ensure port 25 is open for INBOUND traffic:

1. Go to AWS Console → EC2 → Security Groups
2. Find your instance's security group
3. Add Inbound Rule:
   - Type: Custom TCP
   - Port: 25
   - Source: 0.0.0.0/0
   - Description: SMTP incoming mail

### Step 5: Request AWS Port 25 Unthrottle
1. Go to: https://aws.amazon.com/forms/ec2-email-limit-rdns-request
2. Fill out the form:
   - **Email Address**: Your AWS account email
   - **Use Case**: Legitimate email server for techtorio.online domain
   - **Elastic IP**: Your server's public IP (16.170.233.86)
   - **Reverse DNS Record**: mail.techtorio.online
3. Submit and wait for AWS approval (usually 24-48 hours)

### Step 6: Test Email Delivery

#### Test Receiving (from Gmail to your server):
1. Send email from Gmail to: niaz@techtorio.online
2. Watch server logs:
   ```bash
   sudo tail -f /var/log/mail.log
   ```
3. Check for errors like "connection refused" or "rejected"

#### Test Sending (from your server to Gmail):
```bash
# Install mail utils if not already
sudo apt-get install mailutils

# Send test email
echo "This is a test email" | mail -s "Test from techtorio.online" your-gmail@gmail.com
```

Watch logs for delivery status:
```bash
sudo tail -f /var/log/mail.log | grep your-gmail@gmail.com
```

## Common Error Messages

### "Connection refused"
- Port 25 not open in AWS Security Group
- Postfix not running: `sudo systemctl status postfix`

### "Relay access denied"
- mydestination or virtual_mailbox_domains not configured
- Fix: `sudo postconf -e "virtual_mailbox_domains = techtorio.online"`

### "Name service error" or "Domain not found"
- DNS MX record missing or incorrect
- Check: `dig techtorio.online MX`

### "Mail for techtorio.online loops back to myself"
- Both mydestination AND virtual_mailbox_domains contain same domain
- Fix: Use only virtual_mailbox_domains

### Gmail rejects with "550 SPF check failed"
- SPF record missing or incorrect
- Add TXT record: `v=spf1 ip4:16.170.233.86 ~all`

## Verification Checklist

- [ ] MX record points to mail.techtorio.online
- [ ] A record for mail.techtorio.online points to 16.170.233.86
- [ ] SPF TXT record exists
- [ ] Port 25 open in AWS Security Group (inbound)
- [ ] Port 25 unthrottle requested from AWS
- [ ] Postfix listening on all interfaces: `sudo netstat -tlnp | grep :25`
- [ ] virtual_mailbox_domains includes techtorio.online
- [ ] Can receive test email from localhost
- [ ] Can receive test email from external (Gmail, Yahoo, etc.)
- [ ] Can send test email to Gmail (may take 24-48h for AWS approval)

## Quick Test Commands

```bash
# Check Postfix is accepting mail for your domain
echo "ehlo test.com" | nc localhost 25
# Should show: 250-mail.techtorio.online

# Test SMTP connection from outside
telnet 16.170.233.86 25
# Should connect successfully

# Check DNS
dig techtorio.online MX +short
# Should show: 10 mail.techtorio.online.

# Check mail queue
sudo mailq
# Should be empty or show queued messages

# Check recent deliveries
sudo tail -50 /var/log/mail.log | grep "status="
```

## Notes

1. **DNS propagation** takes 1-24 hours after adding records
2. **AWS port 25** approval takes 24-48 hours
3. **Gmail** may initially mark emails as spam - this improves with time and proper SPF/DKIM
4. **Testing**: Use https://mxtoolbox.com to test your mail server configuration
5. **Monitoring**: Keep watching `/var/log/mail.log` for real-time troubleshooting
