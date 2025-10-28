# AWS Email Support Request Template

## Request Form URL
https://aws.amazon.com/forms/ec2-email-limit-rdns-request

---

## Form Fields to Fill Out

### 1. Email Address
**Your AWS account email address**

### 2. Use Case Description
```
I am operating a legitimate mail server for my domain techtorio.online. 
This server is used for:
- Business email communications (e.g., support@techtorio.online, niaz@techtorio.online)
- Transactional emails for our YaqeenPay payment platform
- Customer support correspondence

The mail server is properly configured with:
- Postfix MTA with SPF authentication
- Dovecot for IMAP/POP3 access
- DKIM signing for email authentication
- Valid MX records pointing to mail.techtorio.online
- Firewall rules configured to allow SMTP traffic

I need the following assistance:
1. Remove email sending limitations (port 25 throttle) for outbound SMTP
2. Enable full inbound SMTP connectivity on port 25
3. Configure reverse DNS (PTR record) for proper email authentication
```

### 3. Elastic IP Address
```
16.170.233.86
```

### 4. Reverse DNS Record
```
mail.techtorio.online
```

### 5. Instance Region
```
eu-north-1 (Europe - Stockholm)
```

### 6. Use Case Type
Select: **Transactional Email / Business Email**

---

## Additional Information to Include

### Current Issue:
- **Outbound SMTP (port 25)**: Emails to Gmail/external servers are queued with "Connection timed out" errors
- **Inbound SMTP (port 25)**: External mail servers (including Gmail) cannot connect to deliver emails, even though:
  - AWS Security Group has inbound rule for port 25 (0.0.0.0/0)
  - Server firewall (UFW) allows port 25
  - Postfix is listening on 0.0.0.0:25
  - Local SMTP tests work successfully

### Technical Details:
- **Server**: Ubuntu on EC2 instance in eu-north-1
- **Domain**: techtorio.online
- **Mail Server Hostname**: mail.techtorio.online
- **Current Reverse DNS**: ec2-16-170-233-86.eu-north-1.compute.amazonaws.com
- **Requested Reverse DNS**: mail.techtorio.online
- **MX Record**: 10 mail.techtorio.online (verified)
- **SPF Record**: v=spf1 ip4:16.170.233.86 ~all (verified)

### What We've Already Done:
1. Configured AWS Security Group inbound rule: TCP port 25 from 0.0.0.0/0
2. Configured server firewall (UFW) to allow port 25
3. Verified Postfix is listening on all interfaces (0.0.0.0:25)
4. Set proper MX and SPF DNS records
5. Configured virtual domains and SMTP authentication
6. Local email delivery works correctly

### Test Results:
- ✅ Internal SMTP test: Working
- ✅ Local email delivery: Working
- ✅ DNS MX record: Resolving correctly
- ✅ Postfix listening on port 25: Confirmed
- ❌ External connection to port 25: **BLOCKED** (Test-NetConnection fails)
- ❌ Gmail delivery: Cannot connect to server
- ❌ Outbound email to Gmail: Timeout connecting to gmail-smtp-in.l.google.com:25

---

## Expected Timeline
AWS typically responds within **24-48 hours** for email-related requests.

---

## What This Will Fix

### Once Approved:

#### Inbound Email (Receiving):
- ✅ Gmail → techtorio.online will work
- ✅ Any external email → techtorio.online will work
- ✅ Proper reverse DNS will improve email deliverability

#### Outbound Email (Sending):
- ✅ techtorio.online → Gmail will work
- ✅ techtorio.online → any external email will work
- ✅ Emails won't be marked as spam due to proper PTR record

---

## After AWS Approval

### 1. Verify Reverse DNS
```bash
# Check PTR record
dig -x 16.170.233.86 +short
# Should return: mail.techtorio.online
```

### 2. Test Outbound Email
```bash
# Send test email
echo "Test from Postfix" | mail -s "Test Email" your-gmail@gmail.com

# Check mail queue (should be empty if delivered)
sudo mailq
```

### 3. Test Inbound Email
- Send email from Gmail to support@techtorio.online
- Check in Outlook - should receive within seconds

### 4. Monitor Logs
```bash
# Watch Postfix logs for successful deliveries
sudo journalctl -u postfix -f
```

### 5. Verify No Spam Listing
Check your IP isn't blacklisted:
- https://mxtoolbox.com/blacklists.aspx
- Enter: 16.170.233.86
- Should show: Not Blacklisted

---

## Temporary Workaround (Until AWS Approves)

While waiting for AWS approval, you can:

1. **Receive emails**: Still blocked externally
2. **Send emails via SMTP relay**:
   - Use port 587 with TLS (usually not throttled)
   - Configure Postfix to relay through SendGrid/Amazon SES/Mailgun
   - This allows outbound email while waiting

### Option: Configure SMTP Relay (Temporary)
```bash
# If you want to send emails before AWS approval
# You can configure a relay service like SendGrid or Amazon SES
# This works on port 587 which AWS doesn't throttle

# Example for Amazon SES relay:
sudo postconf -e "relayhost = [email-smtp.eu-north-1.amazonaws.com]:587"
sudo postconf -e "smtp_sasl_auth_enable = yes"
sudo postconf -e "smtp_sasl_security_options = noanonymous"
sudo postconf -e "smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd"
sudo postconf -e "smtp_tls_security_level = encrypt"

# Then configure SMTP credentials in /etc/postfix/sasl_passwd
# This is OPTIONAL and only if you need to send emails urgently
```

---

## Important Notes

1. **Do NOT use mail server for spam** - AWS will ban your IP permanently
2. **Keep email volume reasonable** - Start with low volume, increase gradually
3. **Monitor bounce rates** - High bounces will flag your IP
4. **Implement DMARC** - After PTR record is set, add DMARC policy
5. **Use TLS/SSL** - Always encrypt email transmission

---

## Support Contact

If AWS denies the request:
- Check if your account is in good standing
- Ensure billing is up to date
- Consider using Amazon SES instead of direct SMTP
- May need to use a different region

If approved but still having issues:
- Allow 24 hours for DNS propagation
- Clear DNS cache: `sudo systemd-resolve --flush-caches`
- Test with https://mxtoolbox.com/SuperTool.aspx
- Check /var/log/mail.log for delivery errors

---

## Summary

**Current Status:**
- ✅ Mail server configured correctly
- ✅ Local delivery working
- ❌ External connectivity blocked by AWS

**After AWS Approval:**
- ✅ Full email functionality (send + receive)
- ✅ Proper reverse DNS authentication
- ✅ No more port 25 throttling

**Estimated Fix Time:** 24-48 hours after AWS approval
