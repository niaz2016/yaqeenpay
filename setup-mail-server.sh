#!/bin/bash
#
# Self-Hosted Email Server Setup for techtorio.online
# This script installs and configures Postfix, Dovecot, and OpenDKIM
#
# Usage: Run on Ubuntu server as root or with sudo
#

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
DOMAIN="techtorio.online"
HOSTNAME="mail.techtorio.online"
ADMIN_EMAIL="niaz@techtorio.online"
MAIL_USER="niaz"
SECRETS_DIR="/root/mail-secrets"
LOG_FILE="/var/log/mail-setup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
fi

log "========================================="
log "Starting Mail Server Setup"
log "Domain: $DOMAIN"
log "Hostname: $HOSTNAME"
log "Admin Email: $ADMIN_EMAIL"
log "========================================="

# Create secrets directory
mkdir -p "$SECRETS_DIR"
chmod 700 "$SECRETS_DIR"

# Update system
log "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# Install required packages
log "Installing mail server packages (Postfix, Dovecot, OpenDKIM)..."
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    postfix \
    postfix-pcre \
    dovecot-core \
    dovecot-imapd \
    dovecot-pop3d \
    dovecot-lmtpd \
    opendkim \
    opendkim-tools \
    mailutils \
    certbot \
    python3-certbot-nginx

log "Packages installed successfully"

# Set hostname
log "Configuring hostname..."
hostnamectl set-hostname "$HOSTNAME"
echo "127.0.0.1 $HOSTNAME $DOMAIN" >> /etc/hosts

# Configure Postfix
log "Configuring Postfix..."

# Backup original config
cp /etc/postfix/main.cf /etc/postfix/main.cf.backup.$(date +%Y%m%d)

# Create Postfix main.cf
cat > /etc/postfix/main.cf << EOF
# See /usr/share/postfix/main.cf.dist for a commented, more complete version

# Server settings
myhostname = $HOSTNAME
mydomain = $DOMAIN
myorigin = \$mydomain
mydestination = \$myhostname, localhost.\$mydomain, localhost, \$mydomain
relayhost =
mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128
mailbox_size_limit = 0
recipient_delimiter = +
inet_interfaces = all
inet_protocols = all

# TLS parameters
smtpd_tls_cert_file=/etc/letsencrypt/live/$DOMAIN/fullchain.pem
smtpd_tls_key_file=/etc/letsencrypt/live/$DOMAIN/privkey.pem
smtpd_tls_security_level=may
smtpd_tls_auth_only = yes
smtpd_tls_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1
smtpd_tls_ciphers = high
smtpd_tls_exclude_ciphers = aNULL, MD5, DES, 3DES, DES-CBC3-SHA, RC4-SHA, AES256-SHA, AES128-SHA

smtp_tls_cert_file=\$smtpd_tls_cert_file
smtp_tls_key_file=\$smtpd_tls_key_file
smtp_tls_security_level = may
smtp_tls_session_cache_database = btree:\${data_directory}/smtp_scache

# Virtual alias support
virtual_alias_domains =
virtual_alias_maps = hash:/etc/postfix/virtual

# SASL Authentication (Dovecot)
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_auth_enable = yes

# Mail delivery to Dovecot
mailbox_transport = lmtp:unix:private/dovecot-lmtp
local_recipient_maps = proxy:unix:passwd.byname \$alias_maps

# Security restrictions
smtpd_helo_required = yes
smtpd_recipient_restrictions =
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_unauth_destination,
    reject_invalid_hostname,
    reject_non_fqdn_hostname,
    reject_non_fqdn_sender,
    reject_non_fqdn_recipient,
    reject_unknown_sender_domain,
    reject_unknown_recipient_domain,
    reject_rbl_client zen.spamhaus.org,
    reject_rbl_client bl.spamcop.net,
    permit

smtpd_helo_restrictions =
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_invalid_helo_hostname,
    reject_non_fqdn_helo_hostname,
    reject_unknown_helo_hostname

# DKIM
milter_default_action = accept
milter_protocol = 6
smtpd_milters = inet:127.0.0.1:8891
non_smtpd_milters = \$smtpd_milters

# Message size limit (50MB)
message_size_limit = 52428800
mailbox_size_limit = 0

# Disable backwards compatibility
compatibility_level = 2
EOF

# Configure Postfix master.cf for submission
log "Configuring Postfix submission ports..."
cat >> /etc/postfix/master.cf << EOF

# Submission port (587) with authentication
submission inet n       -       y       -       -       smtpd
  -o syslog_name=postfix/submission
  -o smtpd_tls_security_level=encrypt
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_tls_auth_only=yes
  -o smtpd_reject_unlisted_recipient=no
  -o smtpd_client_restrictions=permit_sasl_authenticated,reject
  -o smtpd_helo_restrictions=
  -o smtpd_sender_restrictions=
  -o smtpd_recipient_restrictions=
  -o smtpd_relay_restrictions=permit_sasl_authenticated,reject
  -o milter_macro_daemon_name=ORIGINATING

# SMTPS port (465)
smtps     inet  n       -       y       -       -       smtpd
  -o syslog_name=postfix/smtps
  -o smtpd_tls_wrappermode=yes
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_reject_unlisted_recipient=no
  -o smtpd_client_restrictions=permit_sasl_authenticated,reject
  -o smtpd_helo_restrictions=
  -o smtpd_sender_restrictions=
  -o smtpd_recipient_restrictions=
  -o smtpd_relay_restrictions=permit_sasl_authenticated,reject
  -o milter_macro_daemon_name=ORIGINATING
EOF

# Create virtual alias file
touch /etc/postfix/virtual
postmap /etc/postfix/virtual

# Configure Dovecot
log "Configuring Dovecot..."

# Backup original configs
cp /etc/dovecot/dovecot.conf /etc/dovecot/dovecot.conf.backup.$(date +%Y%m%d) 2>/dev/null || true

# Main dovecot.conf
cat > /etc/dovecot/dovecot.conf << EOF
protocols = imap pop3 lmtp
listen = *, ::
!include_try /usr/share/dovecot/protocols.d/*.protocol
!include conf.d/*.conf
EOF

# dovecot/conf.d/10-auth.conf
cat > /etc/dovecot/conf.d/10-auth.conf << EOF
disable_plaintext_auth = yes
auth_mechanisms = plain login
!include auth-system.conf.ext
EOF

# dovecot/conf.d/10-mail.conf
cat > /etc/dovecot/conf.d/10-mail.conf << EOF
mail_location = maildir:/var/mail/vhosts/%d/%n
mail_privileged_group = mail
namespace inbox {
  inbox = yes
}
first_valid_uid = 1000
EOF

# dovecot/conf.d/10-master.conf
cat > /etc/dovecot/conf.d/10-master.conf << EOF
service imap-login {
  inet_listener imap {
    port = 143
  }
  inet_listener imaps {
    port = 993
    ssl = yes
  }
}

service pop3-login {
  inet_listener pop3 {
    port = 110
  }
  inet_listener pop3s {
    port = 995
    ssl = yes
  }
}

service lmtp {
  unix_listener /var/spool/postfix/private/dovecot-lmtp {
    mode = 0600
    user = postfix
    group = postfix
  }
}

service auth {
  unix_listener /var/spool/postfix/private/auth {
    mode = 0660
    user = postfix
    group = postfix
  }
  unix_listener auth-userdb {
    mode = 0600
    user = vmail
  }
  user = dovecot
}

service auth-worker {
  user = vmail
}
EOF

# dovecot/conf.d/10-ssl.conf
cat > /etc/dovecot/conf.d/10-ssl.conf << EOF
ssl = required
ssl_cert = </etc/letsencrypt/live/$DOMAIN/fullchain.pem
ssl_key = </etc/letsencrypt/live/$DOMAIN/privkey.pem
ssl_min_protocol = TLSv1.2
ssl_cipher_list = HIGH:!aNULL:!MD5
ssl_prefer_server_ciphers = yes
EOF

# Create mail directory structure
log "Creating mail directory structure..."
mkdir -p /var/mail/vhosts/$DOMAIN
groupadd -g 5000 vmail 2>/dev/null || true
useradd -g vmail -u 5000 vmail -d /var/mail 2>/dev/null || true
chown -R vmail:vmail /var/mail/vhosts
chmod -R 770 /var/mail/vhosts

# Configure OpenDKIM
log "Configuring OpenDKIM..."

mkdir -p /etc/opendkim/keys/$DOMAIN
chown -R opendkim:opendkim /etc/opendkim

cat > /etc/opendkim.conf << EOF
Syslog                  yes
SyslogSuccess           yes
LogWhy                  yes
UMask                   002
Mode                    sv
SubDomains              no
AutoRestart             yes
AutoRestartRate         10/1M
Background              yes
DNSTimeout              5
SignatureAlgorithm      rsa-sha256
Canonicalization        relaxed/simple
Socket                  inet:8891@localhost
PidFile                 /run/opendkim/opendkim.pid
TrustAnchorFile         /usr/share/dns/root.key
UserID                  opendkim
KeyTable                /etc/opendkim/key.table
SigningTable            /etc/opendkim/signing.table
ExternalIgnoreList      /etc/opendkim/trusted.hosts
InternalHosts           /etc/opendkim/trusted.hosts
EOF

# Generate DKIM keys
log "Generating DKIM keys..."
cd /etc/opendkim/keys/$DOMAIN
opendkim-genkey -b 2048 -d $DOMAIN -s default
chown opendkim:opendkim default.private default.txt

# Create OpenDKIM tables
cat > /etc/opendkim/key.table << EOF
default._domainkey.$DOMAIN $DOMAIN:default:/etc/opendkim/keys/$DOMAIN/default.private
EOF

cat > /etc/opendkim/signing.table << EOF
*@$DOMAIN default._domainkey.$DOMAIN
EOF

cat > /etc/opendkim/trusted.hosts << EOF
127.0.0.1
localhost
$DOMAIN
*.$DOMAIN
EOF

# Save DKIM public key
DKIM_RECORD=$(cat /etc/opendkim/keys/$DOMAIN/default.txt)
echo "$DKIM_RECORD" > "$SECRETS_DIR/dkim-public-key.txt"

log "DKIM keys generated and saved to $SECRETS_DIR/dkim-public-key.txt"

# Create mail user
log "Creating mail user: $MAIL_USER@$DOMAIN..."

# Create system user if doesn't exist
if ! id "$MAIL_USER" &>/dev/null; then
    useradd -m -s /bin/bash "$MAIL_USER"
fi

# Generate secure random password
MAIL_PASSWORD=$(openssl rand -base64 24)
echo "$MAIL_USER:$MAIL_PASSWORD" | chpasswd

# Save credentials
cat > "$SECRETS_DIR/niaz-mail-credentials.txt" << EOF
Email Server Credentials for $ADMIN_EMAIL
==========================================
Generated: $(date)

Email Address: $ADMIN_EMAIL
Username: $MAIL_USER (for email clients, use full email: $ADMIN_EMAIL)
Password: $MAIL_PASSWORD

IMAP Settings (for receiving mail):
- Server: $HOSTNAME
- Port: 993 (SSL/TLS)
- Security: SSL/TLS
- Authentication: Normal password

SMTP Settings (for sending mail):
- Server: $HOSTNAME
- Port: 587 (STARTTLS) or 465 (SSL/TLS)
- Security: STARTTLS or SSL/TLS
- Authentication: Normal password

POP3 Settings (alternative to IMAP):
- Server: $HOSTNAME
- Port: 995 (SSL/TLS)
- Security: SSL/TLS

Webmail: Not configured (consider installing Roundcube)
==========================================
EOF

chmod 600 "$SECRETS_DIR/niaz-mail-credentials.txt"

log "Mail credentials saved to $SECRETS_DIR/niaz-mail-credentials.txt"

# Create mailbox directory
mkdir -p /var/mail/vhosts/$DOMAIN/$MAIL_USER
chown -R vmail:vmail /var/mail/vhosts/$DOMAIN/$MAIL_USER

# Restart services
log "Restarting mail services..."
systemctl restart opendkim
systemctl restart postfix
systemctl restart dovecot

# Enable services to start on boot
systemctl enable opendkim
systemctl enable postfix
systemctl enable dovecot

log "Services restarted and enabled"

# Generate DNS records
log "Generating DNS records..."

SERVER_IP=$(curl -s http://checkip.amazonaws.com)

cat > "$SECRETS_DIR/dns-records.txt" << EOF
DNS Records for $DOMAIN Email Setup
====================================
Add these records to your DNS provider (Cloudflare, etc.)

1. MX Record (Mail Exchanger):
   Type: MX
   Name: @
   Value: $HOSTNAME
   Priority: 10
   TTL: 3600

2. A Record (Mail server):
   Type: A
   Name: mail
   Value: $SERVER_IP
   TTL: 3600

3. SPF Record (Sender Policy Framework):
   Type: TXT
   Name: @
   Value: v=spf1 mx a:$HOSTNAME ip4:$SERVER_IP ~all
   TTL: 3600

4. DKIM Record (DomainKeys Identified Mail):
   Type: TXT
   Name: default._domainkey
   Value: (See dkim-public-key.txt - copy the part inside quotes)
   TTL: 3600

   Full DKIM record value:
   $(cat $SECRETS_DIR/dkim-public-key.txt | grep -v '^---' | tr -d '\n' | sed 's/.*( \(.*\) ).*/\1/')

5. DMARC Record (Domain-based Message Authentication):
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=quarantine; rua=mailto:$ADMIN_EMAIL; ruf=mailto:$ADMIN_EMAIL; fo=1
   TTL: 3600

6. Reverse DNS (PTR Record):
   IMPORTANT: Contact your hosting provider (AWS) to set up:
   PTR: $SERVER_IP → $HOSTNAME
   
   For AWS EC2: Go to EC2 → Request to Remove Email Sending Limitations
   This also sets up reverse DNS.

====================================
After adding these DNS records:
1. Wait 1-24 hours for DNS propagation
2. Verify with: dig MX $DOMAIN
3. Test DKIM: dig TXT default._domainkey.$DOMAIN
4. Test SPF: dig TXT $DOMAIN
====================================
EOF

log "DNS records saved to $SECRETS_DIR/dns-records.txt"

# Open firewall ports
log "Configuring firewall..."
ufw allow 25/tcp comment 'SMTP'
ufw allow 587/tcp comment 'SMTP Submission'
ufw allow 465/tcp comment 'SMTPS'
ufw allow 143/tcp comment 'IMAP'
ufw allow 993/tcp comment 'IMAPS'
ufw allow 110/tcp comment 'POP3'
ufw allow 995/tcp comment 'POP3S'

log "Firewall rules added"

# Display summary
log "========================================="
log "Mail Server Setup Complete!"
log "========================================="
echo ""
echo -e "${GREEN}✅ Mail server installed successfully!${NC}"
echo ""
echo "📧 Email Address: $ADMIN_EMAIL"
echo "🔐 Credentials: $SECRETS_DIR/niaz-mail-credentials.txt"
echo "📋 DNS Records: $SECRETS_DIR/dns-records.txt"
echo "🔑 DKIM Public Key: $SECRETS_DIR/dkim-public-key.txt"
echo ""
echo -e "${YELLOW}⚠️  NEXT STEPS:${NC}"
echo "1. Add DNS records from: $SECRETS_DIR/dns-records.txt"
echo "2. Wait for DNS propagation (1-24 hours)"
echo "3. Configure email client with credentials from: $SECRETS_DIR/niaz-mail-credentials.txt"
echo "4. Test sending/receiving email"
echo ""
echo -e "${GREEN}📱 Email Client Settings:${NC}"
echo "Server: $HOSTNAME"
echo "IMAP Port: 993 (SSL/TLS)"
echo "SMTP Port: 587 (STARTTLS)"
echo ""
echo "To view credentials:"
echo "  cat $SECRETS_DIR/niaz-mail-credentials.txt"
echo ""
echo "To view DNS records:"
echo "  cat $SECRETS_DIR/dns-records.txt"
echo ""
log "Setup script completed successfully"
