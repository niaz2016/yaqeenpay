# BREVO SMTP SETUP GUIDE - Sending Emails from TechTorio

## Step 1: Create Free Brevo Account

1. Go to: https://www.brevo.com/
2. Click **"Sign up free"**
3. Fill in:
   - Email: your-email@gmail.com
   - Password: (create strong password)
   - Company name: Techtorio / TechTorio
4. Verify your email

## Step 2: Get SMTP Credentials

1. After login, go to: https://app.brevo.com/settings/keys/smtp
   - Or: **Menu → Settings → SMTP & API → SMTP**
2. You'll see:
   ```
   SMTP Server: smtp-relay.brevo.com
   Port: 587
   Login: your-email@gmail.com
   Password: (click "Generate new SMTP key")
   ```
3. Click **"Generate new SMTP key"** button
4. **COPY THE KEY IMMEDIATELY** (you won't see it again!)
5. Save credentials securely

## Step 3: Verify Sender Email

1. Go to: https://app.brevo.com/settings/senders
2. Click **"Add a sender"**
3. Add: `noreply@techtorio.online` or `admin@techtorio.online`
4. Brevo will send verification email to that address
5. **IMPORTANT**: You need access to this mailbox to verify
   - Option 1: Create a Gmail alias and forward
   - Option 2: Use your existing email for now (change later)
   - Option 3: For testing, use your Gmail: `yourname@gmail.com`

## Step 4: Your Brevo SMTP Settings

Once you have the credentials, you'll configure your TechTorio backend with:

```json
{
  "EmailSettings": {
    "SmtpServer": "smtp-relay.brevo.com",
    "SmtpPort": 587,
    "SmtpUsername": "your-email@gmail.com",
    "SmtpPassword": "YOUR_BREVO_SMTP_KEY_HERE",
    "SenderEmail": "noreply@techtorio.online",
    "SenderName": "TechTorio",
    "EnableSsl": true
  }
}
```

## Free Tier Limits

✅ **300 emails per day** (9,000/month)  
✅ **Unlimited contacts**  
✅ **Email templates**  
✅ **Email tracking (opens, clicks)**  
✅ **SMTP and API access**  
✅ **No credit card required**  
✅ **Forever free**

## Upgrade Options (If Needed)

- **Lite Plan**: $25/month for 20,000 emails/month
- **Business Plan**: $65/month for 100,000 emails/month
- **Pay-as-you-go**: $0.50 per 1,000 emails

## Alternative Free Options

If you prefer other services:

### SendGrid (Twilio)
- Free: 100 emails/day
- Signup: https://sendgrid.com/
- SMTP: smtp.sendgrid.net:587

### Mailgun
- Free: 1,000 emails/month (first 3 months)
- Signup: https://www.mailgun.com/
- Requires credit card verification

### Amazon SES
- Very cheap: $0.10 per 1,000 emails
- Signup: https://aws.amazon.com/ses/
- Requires AWS account

## Next Steps

After getting Brevo credentials:

1. I'll create EmailService in your backend
2. Configure appsettings.json with your credentials
3. Test sending emails
4. Integrate with password reset, email verification, etc.

## Quick Test (After Setup)

You can test Brevo SMTP directly:

```powershell
# Using PowerShell to test SMTP
$SMTPServer = "smtp-relay.brevo.com"
$SMTPPort = 587
$Username = "your-email@gmail.com"
$Password = "YOUR_BREVO_SMTP_KEY" | ConvertTo-SecureString -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($Username, $Password)

Send-MailMessage -From "noreply@techtorio.online" `
                 -To "your-test-email@gmail.com" `
                 -Subject "Test from TechTorio" `
                 -Body "This is a test email via Brevo SMTP" `
                 -SmtpServer $SMTPServer `
                 -Port $SMTPPort `
                 -UseSsl `
                 -Credential $Credential
```

## Let me know when you have:

1. ✅ Brevo account created
2. ✅ SMTP key generated
3. ✅ Sender email verified (or using your Gmail for testing)

Then I'll proceed with backend integration!
