'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { getHomeHref, isAdminRole } from '@/lib/roles';

const QUICK_NAV = [
  { href: '/learn', label: 'Lessons' },
  { href: '/library', label: 'Library' },
  { href: '/assistant', label: 'AI tutor' },
  { href: '/forum', label: 'Forum' },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader({ onMenuOpen }: { onMenuOpen?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const homeHref = getHomeHref(user.role);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="flex h-14 items-center gap-4 px-4 md:px-6">
        <button
          type="button"
          onClick={onMenuOpen}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 md:hidden"
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <Link href={homeHref} className="shrink-0 text-lg font-bold text-efundo-primary">
          eFundo
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href={homeHref}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              isActive(pathname, homeHref)
                ? 'bg-efundo-primary/10 text-efundo-primary'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {isAdminRole(user.role) ? 'Admin' : 'Dashboard'}
          </Link>
          {QUICK_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                isActive(pathname, item.href)
                  ? 'bg-efundo-primary/10 text-efundo-primary'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">{user.fullName}</p>
            <p className="text-xs text-slate-500">{user.role.replace(/_/g, ' ')}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
