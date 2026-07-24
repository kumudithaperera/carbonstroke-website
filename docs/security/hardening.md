# CarbonStroke — Security Hardening

## Context

CarbonStroke's site is a static marketing page: plain HTML/CSS/JS, no backend,
no database, no authentication, no dependencies, no build step. It is served by
GitHub Pages at `www.carbonstroke.com`.

That shape removes most of the usual application-security surface. There is no
SQL to inject, no session to steal, no npm tree to audit. The realistic threats
are narrower and almost entirely **infrastructure-side**:

1. Someone takes over the GitHub account or domain and alters what visitors see.
2. Someone tampers with the page in transit, because it is reachable over
   plaintext HTTP.

The code itself was audited and found clean (see "Audit results" below). The
work in this document is therefore weighted toward account, transport, and DNS
hardening rather than toward changing application code.

---

## Priority 1 — Live-site issues found on 2026-07-24

These two were confirmed against the running site, not inferred.

### 1.1 HTTPS is not enforced — plaintext HTTP is served

`curl -I http://www.carbonstroke.com` returns `HTTP/1.1 200 OK` and serves the
page. It does **not** redirect to HTTPS.

A valid TLS certificate already exists and HTTPS works, so this is purely a
switch that is off. Until it is on, anyone on a shared or hostile network
(cafe Wi-Fi, compromised router, a hostile ISP) can read and **rewrite** the
page in transit — injecting scripts, swapping your contact email for theirs, or
defacing it for that visitor. This is the same defacement outcome you were
concerned about, reachable without ever touching your GitHub account.

**Fix:** GitHub repo → Settings → Pages → check **Enforce HTTPS**.

Verify:

```bash
curl -sSI http://www.carbonstroke.com | grep -iE "^HTTP|^location"
# want: HTTP/1.1 301 ... / location: https://www.carbonstroke.com/
```

### 1.2 Cloudflare is DNS-only — no protection is actually active

The nameservers are Cloudflare (`noel`/`abby.ns.cloudflare.com`), but the
records are **not proxied** (grey cloud). Evidence:

- `dig www.carbonstroke.com` returns GitHub's IPs (`185.199.108-111.153`)
  directly, not Cloudflare's.
- Live response headers show `server: GitHub.com`, `via: 1.1 varnish`,
  `x-fastly-request-id` — GitHub/Fastly's stack. There is no `cf-ray` or
  `cf-cache-status` header at all.

So Cloudflare is currently doing nothing but hosting DNS records. No WAF, no
DDoS absorption, no bot filtering, no header injection, and your origin IPs are
public. Every Cloudflare-dependent item below is inert until this changes.

**Fix:** Cloudflare dashboard → DNS → toggle the `www` and apex records to
**Proxied** (orange cloud). Then set SSL/TLS mode to **Full (strict)** — not
Flexible, which would make Cloudflare talk to GitHub over plaintext HTTP and
quietly recreate issue 1.1 behind a padlock.

---

## Priority 2 — Account and domain takeover

This is the highest-consequence category. The site has no login, so the only
way to change it is to control the GitHub account or the domain.

- **Hardware-backed 2FA on GitHub.** A passkey or security key, not SMS. SMS is
  defeated by SIM-swap, which is the common path for this kind of takeover.
- **Audit the account.** Settings → Password and authentication → review active
  sessions; Settings → Applications → revoke OAuth apps you don't recognise;
  Settings → SSH and GPG keys → delete stale keys.
- **Scope personal access tokens.** Any token with `repo` scope can rewrite this
  site. Prefer fine-grained tokens limited to this repository, with an
  expiry set.
- **Registrar lock + 2FA on the domain.** A stolen domain beats every other
  control here — an attacker just repoints DNS at their own server. Enable
  registrar transfer lock and 2FA on the registrar account, and confirm the
  WHOIS contact email is one you still control.
- **Branch protection on `main`.** Require a pull request before merging, so a
  single leaked credential cannot silently force-push a defaced page.
- **Enable secret scanning and push protection** (repo → Settings → Code
  security). Cheap, and it blocks committed credentials before they ship.

### Add a CAA record

`dig CAA carbonstroke.com` returns nothing. With no CAA record, *any* public
certificate authority may issue a certificate for your domain, which widens the
window for a convincing impersonation.

Add in Cloudflare DNS — this must permit both Let's Encrypt (GitHub Pages) and
Cloudflare's own CAs, or certificate renewal will break:

```
carbonstroke.com. CAA 0 issue "letsencrypt.org"
carbonstroke.com. CAA 0 issue "pki.goog"
carbonstroke.com. CAA 0 issue "ssl.com"
carbonstroke.com. CAA 0 issue "digicert.com"
```

---

## Priority 3 — Response headers (requires Cloudflare proxying from 1.2)

`Content-Security-Policy` and `Referrer-Policy` already ship as `<meta>` tags in
`index.html`. The rest are **header-only** — no `<meta>` equivalent exists, and
they are unreachable on bare GitHub Pages.

Cloudflare → Rules → Transform Rules → **Modify Response Header**, add:

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |
| `Content-Security-Policy` | *(same policy as the meta tag, plus `frame-ancestors 'none'`)* |

Two notes:

- `frame-ancestors` is **ignored inside a `<meta>` tag** by design. Clickjacking
  protection is only real once it is set as a header here.
- Only add `preload` to HSTS once you are certain every subdomain will serve
  HTTPS forever. Preloading is baked into browsers and is slow and painful to
  undo.

Verify the whole set at https://securityheaders.com once proxying is live.

---

## Audit results — application code

Reviewed `index.html`, `css/styles.css`, and `js/main.js`. **No vulnerabilities
found.** Recording what was checked, and why each is clean:

- **XSS:** `js/main.js` writes exclusively through `textContent` and
  `createElement`. No `innerHTML`, `outerHTML`, `insertAdjacentHTML`,
  `document.write`, or `eval` anywhere. `renderDigits()` builds the flip-counter
  digits node-by-node rather than by string concatenation.
- **mailto injection:** the subject and body in the submit handler are each
  wrapped in `encodeURIComponent`, so a visitor typing `&cc=` or a newline into
  the name field cannot inject extra mail headers or recipients.
- **Inline handlers:** none. No `onclick`/`onload` attributes, and no `style="…"`
  attributes — which is what allows the CSP to omit `'unsafe-inline'` entirely.
- **Tabnabbing:** all six Behance links plus the portfolio CTA already carry
  `rel="noopener"`.
- **Secrets:** nothing sensitive is committed. `.DS_Store` is correctly ignored
  and untracked.

The one deliberate exception is the CSP `sha256-…` hash in `index.html`, which
pins the single inline script in `<head>`. **If that script's bytes change, the
hash must be regenerated** or the script stops running silently:

```bash
printf "%s" "document.documentElement.classList.add('js');" \
  | openssl dgst -sha256 -binary | openssl base64
```

---

## Deliberately not doing

- **Obfuscating the footer email and phone.** They are business contact details
  whose entire purpose is to be found — by clients and by search engines.
  JS obfuscation costs real leads and SEO to deter scrapers that largely defeat
  it anyway. Gmail's spam filtering is the better trade.
- **Self-hosting Google Fonts.** Would remove two third-party origins and tighten
  the CSP to `'self'`, but was declined in favour of keeping the CDN. Worth
  revisiting if a stricter privacy/GDPR posture is ever needed.
- **Form spam controls.** The contact form builds a `mailto:` link client-side
  and posts to no server, so there is no endpoint to flood. This changes the day
  a hosted form backend (Formspree, Netlify Forms) is adopted — that would need
  server-side validation, rate limiting, and a spam filter.
