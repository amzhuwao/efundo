import Link from 'next/link';

const footerLinks = {
  Platform: [
    { href: '/study-guides', label: 'Study guides' },
    { href: '/blog', label: 'Blog' },
    { href: '/how-it-works', label: 'How it works' },
    { href: '/register', label: 'Create account' },
    { href: '/login', label: 'Sign in' },
  ],
  Company: [
    { href: '/about', label: 'About us' },
    { href: '/contact', label: 'Contact' },
  ],
  Legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link href="/" className="text-xl font-bold text-white">
            eFundo
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Free and premium learning resources for university and college
            students across Zimbabwe.
          </p>
        </div>
        {Object.entries(footerLinks).map(([title, links]) => (
          <div key={title}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              {title}
            </h3>
            <ul className="mt-4 space-y-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-500 md:flex-row">
          <p>© {new Date().getFullYear()} eFundo. All rights reserved.</p>
          <p>
            <Link href="/privacy" className="hover:text-slate-300">
              Privacy
            </Link>
            {' · '}
            <Link href="/terms" className="hover:text-slate-300">
              Terms
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
