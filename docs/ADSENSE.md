# Google AdSense Readiness Checklist

Use this checklist before applying for Google AdSense on **https://efundo.org**.

## Site requirements (on production domain)

- [x] **Custom domain** with HTTPS — `https://efundo.org` (and `www`)
- [x] **Original content** — marketing pages + 10 blog/study-guide articles
- [x] **Clear navigation** — header and footer links to main pages
- [x] **About page** — `/about`
- [x] **Contact page** — `/contact` with monitored email addresses
- [x] **Privacy Policy** — `/privacy` (includes AdSense & cookie disclosure)
- [x] **Terms of Service** — `/terms` (includes copyright / takedown process)
- [x] **Account deletion** — `/account-deletion`
- [ ] **No prohibited content** — keep moderation active; remove infringing uploads promptly

## Technical setup (implemented)

- [x] Privacy Policy with Google AdSense section
- [x] Cookie consent banner (loads ads only after acceptance)
- [x] `ads.txt` at `/ads.txt` (add your publisher ID after approval)
- [x] `sitemap.xml` via Next.js (`/sitemap.xml`)
- [x] `robots.txt` (`/robots.txt`) — blocks `/dashboard`, `/admin`, `/onboarding`
- [x] SEO metadata (title, description, Open Graph, canonical base)
- [x] AdSense script via `NEXT_PUBLIC_ADSENSE_CLIENT_ID` env var

## After AdSense approval

1. Add your publisher ID to `apps/web/public/ads.txt`:
   ```
   google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
   ```

2. Set environment variable in production (`apps/web/.env.local`) and rebuild:
   ```
   NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
   ```

3. Place ad units on high-traffic **public** pages only (home, about, how-it-works, blog). Avoid ads on:
   - Login / register
   - Dashboard
   - Onboarding
   - Admin
   - Library download / authenticated app screens

## Recommended before applying

1. ~~Deploy to production with HTTPS~~ — done on `efundo.org`
2. ~~Add 10+ blog posts or study guides~~ — live at `/blog` and `/study-guides`
3. Ensure contact emails are monitored (`support@efundo.org`, `privacy@efundo.org`, `content@efundo.org`)
4. Link Privacy Policy in footer on every page
5. Test cookie consent flow (Accept loads ads only when client ID is set)
6. Submit `https://efundo.org/sitemap.xml` in [Google Search Console](https://search.google.com/search-console)

## Apply

https://www.google.com/adsense/start/
