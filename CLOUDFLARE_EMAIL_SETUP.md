# Cloudflare Email Routing + Gmail SMTP Setup
## FREE Email Solution (No Brevo Required)

### Part 1: Cloudflare Email Routing (Receiving Emails)

#### Step 1: Enable Email Routing in Cloudflare
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain: `techtorio.online`
3. Click **Email** in the left sidebar → **Email Routing**
4. Click **Get started** or **Enable Email Routing**
5. Cloudflare will automatically add required DNS records (MX, TXT)

#### Step 2: Add Destination Email Address
1. Click **Destination addresses** tab
2. Click **Add destination email**
3. Enter your personal Gmail/Outlook address (e.g., `your-email@gmail.com`)
4. Check your inbox and click the verification link from Cloudflare
5. Once verified, this email can receive forwarded messages

#### Step 3: Create Email Routes (Unlimited Aliases!)
1. Go to **Routing rules** tab
2. Click **Create address**
3. Example routes:

| Alias Email | Forwards To | Purpose |
|-------------|-------------|---------|
| `support@techtorio.online` | `your-email@gmail.com` | Customer support |
| `info@techtorio.online` | `your-email@gmail.com` | General inquiries |
| `noreply@techtorio.online` | `your-email@gmail.com` | System notifications |
| `admin@techtorio.online` | `your-email@gmail.com` | Admin alerts |
| `sales@techtorio.online` | `another-email@outlook.com` | Sales team |

4. Click **Save** for each route
5. ✅ You can create **unlimited aliases** for FREE!

#### Step 4: Set Catch-All (Optional)
1. In **Routing rules**, toggle on **Catch-all address**
2. Set destination to your Gmail
3. Any email to `*@techtorio.online` will forward to you

#### Test Receiving
Send an email to `support@techtorio.online` from your phone/another email.
✅ It should arrive in your Gmail inbox within seconds!

---

### Part 2: Gmail SMTP (Sending Emails from Your App)

#### Step 1: Enable 2-Step Verification in Google Account
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **2-Step Verification**
3. Follow the prompts to enable it (required for App Passwords)

#### Step 2: Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select app: **Mail**
3. Select device: **Windows Computer** (or Other/Custom name)
4. Click **Generate**
5. **COPY THE 16-CHARACTER PASSWORD** (e.g., `abcd efgh ijkl mnop`)
6. ⚠️ Save it securely - you won't see it again!

#### Step 3: Update Backend Configuration
Your backend `appsettings.json` needs Gmail SMTP settings:

```json
{
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "UseSsl": true,
    "Username": "your-email@gmail.com",
    "Password": "abcd efgh ijkl mnop",
    "FromEmail": "noreply@techtorio.online",
    "FromName": "TechTorio Escrow Service"
  }
}
```

#### Gmail Sending Limits (FREE)
- ✅ **500 emails per day** (more than enough for most apps)
- ✅ No cost
- ✅ High deliverability (Gmail's reputation)
- ⚠️ If you need more, upgrade to Google Workspace ($6/month = 2000/day)

---

### Part 3: Complete Email Flow

#### How it works:
1. **User sends email to:** `support@techtorio.online`
2. **Cloudflare forwards to:** `your-email@gmail.com`
3. **You read it in Gmail**
4. **Your app sends email via:** Gmail SMTP
5. **Recipients see:** `noreply@techtorio.online` as sender

#### Benefits:
✅ **FREE** (no paid services)
✅ **Unlimited receiving** aliases
✅ **500 free sends/day** (Gmail)
✅ **Professional** email addresses
✅ **High deliverability** (Gmail's reputation)
✅ **No server maintenance**
✅ **Works with Cloudflare Tunnel**

---

### Troubleshooting

#### Emails not arriving from Cloudflare routing:
1. Check DNS records in Cloudflare (MX should point to Cloudflare)
2. Verify destination email is verified in Cloudflare dashboard
3. Check Gmail spam folder
4. Send test from external email (not Gmail to Gmail)

#### Gmail SMTP errors:
- **"Username and Password not accepted"**: Enable 2-Step Verification first
- **"Less secure app access"**: Use App Password, not regular password
- **"Daily sending quota exceeded"**: Wait 24 hours or use another Gmail account

#### Emails marked as spam:
1. Add SPF record: `v=spf1 include:_spf.google.com ~all`
2. Add DMARC record: `v=DMARC1; p=none; rua=mailto:admin@techtorio.online`
3. Warm up: Start with few emails, gradually increase

---

### Alternative: Self-Hosted SMTP Relay (Advanced)

If you don't want to use Gmail, I can help you set up a lightweight Postfix container that relays through a free SMTP service or acts as a simple relay. Let me know if you want this option!

