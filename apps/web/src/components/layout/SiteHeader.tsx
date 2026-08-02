import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';

const navLinks = [
  { href: '/study-guides', label: 'Study guides' },
  { href: '/blog', label: 'Blog' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <BrandLogo href="/" size="lg" priority />
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-slate-600 hover:text-efundo-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-efundo-primary px-4 py-2 text-sm font-medium text-white hover:bg-efundo-primary-dark"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
