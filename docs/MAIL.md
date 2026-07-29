# Self-hosted email on the droplet (efundo.org)

Mail stack on `209.38.225.150`:

| Service | Role |
|---------|------|
| Postfix | SMTP (25), submission (587), SMTPS (465) |
| Dovecot | IMAPS (993) |
| OpenDKIM | DKIM signing |

## Mailboxes

- `admin@efundo.org`
- `support@efundo.org`
- `privacy@efundo.org`
- `content@efundo.org`
- Aliases: `postmaster@` and `abuse@` → `admin@`

Passwords (root only):

```bash
ssh root@209.38.225.150 'cat /root/efundo-mail-credentials.txt'
```

## DNS records (add at your domain registrar)

| Type | Name / Host | Value |
|------|-------------|-------|
| **MX** | `@` / `efundo.org` | `10 efundo.org.` |
| **TXT** (SPF) | `@` | `v=spf1 ip4:209.38.225.150 -all` |
| **TXT** (DKIM) | `mail._domainkey` | *(see below)* |
| **TXT** (DMARC) | `_dmarc` | `v=DMARC1; p=none; rua=mailto:admin@efundo.org; adkim=r; aspf=r` |

### DKIM value

On the droplet:

```bash
cat /etc/opendkim/keys/efundo.org/mail.txt
```

Paste the quoted pieces into **one** TXT record for `mail._domainkey.efundo.org` (no line breaks), e.g.:

```text
v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEF...
```

### Reverse DNS (PTR) — required for good deliverability

In DigitalOcean → Droplet → **Networking** → **Edit PTR**:

- Set hostname to `efundo.org` (must match the A record for this IP)

## Mail client settings

| Setting | Value |
|---------|-------|
| Incoming | IMAP, `efundo.org`, port **993**, SSL/TLS |
| Outgoing | SMTP, `efundo.org`, port **587**, STARTTLS (or **465** SSL) |
| Username | full address (`support@efundo.org`) |
| Password | from credentials file |

## Verify after DNS propagates

```bash
dig +short MX efundo.org
dig +short TXT efundo.org
dig +short TXT mail._domainkey.efundo.org
dig +short TXT _dmarc.efundo.org
dig +short -x 209.38.225.150

# Send a test from Gmail to support@efundo.org, then:
ssh root@209.38.225.150 'find /var/mail/vhosts/efundo.org/support -type f | wc -l'
```

Check outbound reputation: https://www.mail-tester.com (send from one of your mailboxes).

## App SMTP (password reset)

Configure on the API (`apps/api/.env` / production env):

```bash
SMTP_HOST=efundo.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=support@efundo.org
SMTP_PASS='(from /root/efundo-mail-credentials.txt)'
MAIL_FROM='eFundo <support@efundo.org>'
WEB_URL=https://efundo.org
```

If SMTP vars are unset, reset links are logged by the API instead of emailed (useful for local dev).

## Notes

- No webmail UI is installed (use Thunderbird, Apple Mail, Outlook, or Gmail “Check mail from other accounts”).
- The droplet is ~2 GB RAM; keep spam filtering light. Consider a larger droplet or a managed provider (Migadu, Zoho, Google Workspace) if volume grows.
- After Let’s Encrypt renews, Postfix/Dovecot are reloaded by `/etc/letsencrypt/renewal-hooks/deploy/reload-mail.sh`.
