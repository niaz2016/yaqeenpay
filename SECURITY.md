# Security Best Practices for TechTorio

## 🔐 Never Commit These Files

The following files contain sensitive data and should **NEVER** be committed to git:

- `.env`, `.env.cloud`, `.env.production` - Environment variables with passwords and API keys
- `appsettings.Production.json` - Production configuration with connection strings
- `jwt-keys.txt`, `*.pem`, `*.key` - Cryptographic keys
- `gkey`, `gkey.pub` - SSH keys
- `temp/` folder - Temporary files that may contain credentials

## ✅ How to Manage Secrets Securely

### 1. Use Environment Variables

Store secrets in `.env` files (gitignored) and reference them in docker-compose:

```yaml
environment:
  - DB_PASSWORD=${POSTGRES_PASSWORD}
  - API_KEY=${EMAIL_API_KEY}
```

### 2. Use Example Templates

Provide `.example` files that show the structure without actual secrets:

```bash
cp .env.cloud.example .env.cloud
# Then edit .env.cloud with your actual values
```

### 3. Use Docker Secrets (Production)

For production deployments, use Docker secrets or environment-specific secret managers:

```bash
# Create a secret
echo "my_secret_password" | docker secret create db_password -

# Use in docker-compose
services:
  db:
    secrets:
      - db_password
```

### 4. Use GitHub Secrets (CI/CD)

Store secrets in GitHub repository settings → Secrets and variables → Actions

### 5. Use Cloud Provider Secret Managers

- **GCP**: Secret Manager
- **AWS**: AWS Secrets Manager / Parameter Store  
- **Azure**: Azure Key Vault

## 🚨 If You've Already Committed Secrets

### Option 1: Remove from History (Simple)

```bash
# Remove sensitive files
git rm --cached .env.cloud temp/appsettings.Production.json

# Commit the removal
git commit -m "Remove sensitive files from tracking"

# Force push (this rewrites history!)
git push --force
```

### Option 2: Use BFG Repo-Cleaner (Thorough)

```bash
# Install BFG
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Remove file from entire history
java -jar bfg.jar --delete-files appsettings.Production.json
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

### Option 3: Rotate All Credentials (Safest)

After removing from git:
1. **Change all passwords** immediately
2. **Regenerate all API keys**
3. **Create new JWT signing keys**
4. **Revoke old database credentials**

## 📋 Checklist Before Committing

- [ ] Run `git status` to check what files are staged
- [ ] Review `git diff --cached` to see actual content
- [ ] Ensure no `.env*` files are staged
- [ ] Ensure no `appsettings.Production.json` is staged
- [ ] Ensure `temp/` folder is not included
- [ ] Check for hardcoded passwords/keys in code
- [ ] Verify `.gitignore` is working: `git check-ignore -v .env.cloud`

## 🔄 Current Action Items

1. **Immediately rotate compromised credentials:**
   - Database password in `temp/appsettings.Production.json`
   - MacroDroid API key: `23e98a30-fb07-4892-a435-4b65b0b1a4a2`
   - Any Brevo/SendGrid API keys that were exposed

2. **Update the server:**
   ```bash
   # On the GCP server
   cd ~/yaqeenpay
   
   # Create new .env.cloud with NEW credentials
   nano .env.cloud
   
   # Restart with new secrets
   docker compose -f docker-compose.cloud.yml --env-file .env.cloud down
   docker compose -f docker-compose.cloud.yml --env-file .env.cloud up -d
   ```

3. **Remove temp folder completely:**
   ```bash
   rm -rf temp/
   git add -A
   git commit -m "Security: Remove sensitive temp files"
   ```

## 📚 Additional Resources

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Docker Secrets Documentation](https://docs.docker.com/engine/swarm/secrets/)
