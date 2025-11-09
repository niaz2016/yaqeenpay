# Gmail SMTP Setup Guide

## 🔐 Step 1: Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under **"Signing in to Google"**, click **"2-Step Verification"**
3. Follow the prompts to enable it (you'll need your phone for verification)
4. ✅ Once enabled, you can generate App Passwords

---

## 🔑 Step 2: Generate Gmail App Password

1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - If you don't see this option, make sure 2-Step Verification is enabled first
2. Select app: **"Mail"**
3. Select device: **"Windows Computer"** (or "Other/Custom")
4. Click **"Generate"**
5. **COPY THE 16-CHARACTER PASSWORD** that appears
   - My generated code is : nynq xepm ycsz kkix

   - ⚠️ **IMPORTANT**: Save this password - you won't see it again!

---

## 📧 Step 3: What Email to Use?

**Option A: Use your personal Gmail** (e.g., `yourname@gmail.com`)
- ✅ Simple and quick
- ⚠️ Sent emails will show your personal Gmail as sender
- Limit: 500 emails/day

**Option B: Create a new Gmail for your app** (Recommended)
- Create a new Gmail account: `techtorio.noreply@gmail.com` or similar
- ✅ Professional separation
- ✅ Same 500/day limit
- Enable 2-Step Verification and generate App Password for this account

**Recommendation**: Create `techtorio.noreply@gmail.com` for your app!

---

## ⚙️ Step 4: Configuration Details

Once you have your App Password, provide me with:

1. **Gmail address**: `your-email@gmail.com` (or the new one you created)
2. **App Password**: The 16-character password (without spaces)
3. **Sender display name**: What name should appear in emails? (e.g., "TechTorio Support")
4. **Sender email**: What email should appear as "From"? 
   - Can be `noreply@techtorio.online` even though you're using Gmail SMTP

Example configuration I'll use:
```json
{
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "SmtpUsername": "techtorio.noreply@gmail.com",
    "SmtpPassword": "abcdefghijklmnop",
    "SenderEmail": "noreply@techtorio.online",
    "SenderName": "TechTorio Escrow Service",
    "EnableSsl": true
  }
}
```

---

## 📊 Gmail SMTP Limits

- ✅ **500 emails per day** (free Gmail account)
- ✅ **2000 emails per day** (Google Workspace - $6/month)
- ✅ High deliverability (Gmail's reputation)
- ✅ No additional cost for free tier

---

## 🚀 Ready to Configure?

Once you provide:
1. ✅ Gmail address (username)
2. ✅ App Password
3. ✅ Sender name preference

I will:
1. Update `appsettings.Production.json` with Gmail SMTP
2. Update `appsettings.Development.json` (if needed)
3. Rebuild the backend Docker container
4. Restart the backend service
5. Test email sending

---

## 🔒 Security Notes

- ✅ App Passwords are more secure than using your actual Gmail password
- ✅ You can revoke App Passwords anytime from Google Account settings
- ✅ Gmail SMTP uses TLS encryption (EnableSsl: true)
- ⚠️ Never commit passwords to Git - use environment variables in production

