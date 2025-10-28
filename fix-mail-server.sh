#!/bin/bash

# Mail Server Configuration Fix Script
# This script fixes common email delivery issues

set -e

echo "=== Mail Server Configuration Fix ==="
echo ""

# Backup current configuration
echo "1. Backing up current configuration..."
sudo cp /etc/postfix/main.cf /etc/postfix/main.cf.backup.$(date +%Y%m%d_%H%M%S)

# Set basic Postfix parameters
echo "2. Updating Postfix configuration..."

# Set hostname and domain
sudo postconf -e "myhostname = mail.techtorio.online"
sudo postconf -e "mydomain = techtorio.online"
sudo postconf -e "myorigin = \$mydomain"

# Configure to receive mail for virtual domains
sudo postconf -e "mydestination = localhost"
sudo postconf -e "virtual_mailbox_domains = techtorio.online"

# Ensure listening on all interfaces
sudo postconf -e "inet_interfaces = all"
sudo postconf -e "inet_protocols = ipv4"

# Set relay and network settings
sudo postconf -e "mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128"
sudo postconf -e "relayhost ="

# Virtual mailbox settings (should already be configured)
sudo postconf -e "virtual_mailbox_base = /var/mail/vhosts"
sudo postconf -e "virtual_mailbox_maps = hash:/etc/postfix/virtual_mailbox"
sudo postconf -e "virtual_uid_maps = static:5000"
sudo postconf -e "virtual_gid_maps = static:5000"

# SMTP settings for better deliverability
sudo postconf -e "smtpd_banner = \$myhostname ESMTP"
sudo postconf -e "smtpd_helo_required = yes"
sudo postconf -e "disable_vrfy_command = yes"

# Authentication and TLS
sudo postconf -e "smtpd_tls_cert_file = /etc/letsencrypt/live/techtorio.online/fullchain.pem"
sudo postconf -e "smtpd_tls_key_file = /etc/letsencrypt/live/techtorio.online/privkey.pem"
sudo postconf -e "smtpd_use_tls = yes"
sudo postconf -e "smtpd_tls_auth_only = no"
sudo postconf -e "smtp_tls_security_level = may"

# SASL authentication
sudo postconf -e "smtpd_sasl_type = dovecot"
sudo postconf -e "smtpd_sasl_path = private/auth"
sudo postconf -e "smtpd_sasl_auth_enable = yes"

# SPF and DKIM (if OpenDKIM is installed)
if [ -f /etc/opendkim.conf ]; then
    echo "3. Configuring DKIM..."
    sudo postconf -e "milter_default_action = accept"
    sudo postconf -e "milter_protocol = 2"
    sudo postconf -e "smtpd_milters = inet:localhost:8891"
    sudo postconf -e "non_smtpd_milters = inet:localhost:8891"
fi

# Ensure virtual mailbox file exists and is hashed
echo "4. Updating virtual mailbox maps..."
if [ -f /etc/postfix/virtual_mailbox ]; then
    sudo postmap /etc/postfix/virtual_mailbox
else
    echo "WARNING: /etc/postfix/virtual_mailbox not found!"
fi

# Check DNS configuration
echo ""
echo "5. Checking DNS configuration..."
echo "Current MX records:"
dig techtorio.online MX +short

echo ""
echo "Current A record:"
dig techtorio.online A +short

echo ""
echo "Reverse DNS (PTR):"
dig -x 16.170.233.86 +short

# Restart services
echo ""
echo "6. Restarting mail services..."
sudo systemctl restart postfix
sudo systemctl restart dovecot
if systemctl is-active --quiet opendkim; then
    sudo systemctl restart opendkim
fi

# Check status
echo ""
echo "7. Checking service status..."
sudo systemctl status postfix --no-pager -l | head -20
echo ""
sudo systemctl status dovecot --no-pager -l | head -20

# Check if port 25 is listening
echo ""
echo "8. Checking listening ports..."
sudo netstat -tlnp | grep :25

# Check recent logs
echo ""
echo "9. Recent mail logs..."
sudo tail -n 20 /var/log/mail.log

echo ""
echo "=== Configuration Complete ==="
echo ""
echo "IMPORTANT NEXT STEPS:"
echo "1. Verify MX record points to: mail.techtorio.online or 16.170.233.86"
echo "2. Add SPF record: v=spf1 ip4:16.170.233.86 ~all"
echo "3. Ensure AWS Security Group allows inbound port 25 from 0.0.0.0/0"
echo "4. Request AWS to remove port 25 throttle (for EC2 instances)"
echo "5. Test with: echo 'Test' | mail -s 'Test' your-gmail@gmail.com"
echo ""
echo "To check if external mail is being received, watch logs:"
echo "sudo tail -f /var/log/mail.log"
