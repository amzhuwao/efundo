# Google AdSense Readiness Checklist

Use this checklist before applying for Google AdSense.

## Site requirements (on production domain)

- [ ] **Custom domain** with HTTPS (e.g. `https://efundo.co.zw`) — localhost will not be approved
- [ ] **Original content** — at least 15–20 pages of useful, unique content (blog + study guides added; expand with subject-specific resource pages in Phase 2)
- [ ] **Clear navigation** — header and footer links to all main pages
- [ ] **About page** — `/about`
- [ ] **Contact page** — `/contact` with working email addresses
- [ ] **Privacy Policy** — `/privacy` (includes AdSense & cookie disclosure)
- [ ] **Terms of Service** — `/terms`
- [ ] **No prohibited content** — no copyright-infringing downloads, adult content, or misleading material

## Technical setup (implemented)

- [x] Privacy Policy with Google AdSense section
- [x] Cookie consent banner (loads ads only after acceptance)
- [x] `ads.txt` at `/ads.txt` (add your publisher ID after approval)
- [x] `sitemap.xml` via Next.js (`/sitemap.xml`)
- [x] `robots.txt` (`/robots.txt`) — blocks `/dashboard`, `/admin`
- [x] SEO metadata (title, description, Open Graph)
- [x] AdSense script via `NEXT_PUBLIC_ADSENSE_CLIENT_ID` env var

## After AdSense approval

1. Add your publisher ID to `apps/web/public/ads.txt`:
   ```
   google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
   ```

2. Set environment variable in production:
   ```
   NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
   ```

3. Place ad units on high-traffic **public** pages only (home, about, how-it-works, blog). Avoid ads on:
   - Login / register
   - Dashboard
   - Onboarding
   - Admin

## Recommended before applying

1. Deploy to production with HTTPS
2. ~~Add 10+ blog posts or study guides~~ — **10 articles live** at `/blog` and `/study-guides`
3. Ensure contact emails are monitored (`support@efundo.co.zw`, etc.)
4. Link Privacy Policy in footer on every page
5. Test cookie consent flow
6. Submit sitemap in Google Search Console

## Apply

https://www.google.com/adsense/start/
