'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export interface AppNavItem {
  href: string;
  label: string;
  description?: string;
  roles?: string[];
  exact?: boolean;
}

const NAV_SECTIONS: { title: string; items: AppNavItem[] }[] = [
  {
    title: 'Home',
    items: [{ href: '/dashboard', label: 'Dashboard', exact: true }],
  },
  {
    title: 'Learn',
    items: [
      { href: '/library', label: 'Library', description: 'Past papers & notes' },
      { href: '/learn', label: 'Lessons', description: 'Courses & modules' },
      { href: '/forum', label: 'Forum', description: 'Discussions & Q&A' },
      { href: '/library/bookmarks', label: 'Bookmarks', description: 'Saved resources' },
    ],
  },
  {
    title: 'Contribute',
    items: [
      {
        href: '/library/upload',
        label: 'Upload',
        description: 'Share resources',
        roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'LECTURER', 'MODERATOR'],
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        href: '/admin/lessons',
        label: 'Lesson authoring',
        description: 'Modules, videos & content',
        roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'LECTURER'],
      },
      {
        href: '/admin',
        label: 'Admin dashboard',
        description: 'Overview & stats',
        roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'MODERATOR'],
        exact: true,
      },
      {
        href: '/admin/curriculum',
        label: 'Curriculum',
        description: 'Levels, programs & subjects',
        roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN'],
      },
      {
        href: '/admin/moderation',
        label: 'Moderation',
        description: 'Review uploads',
        roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'MODERATOR'],
      },
      {
        href: '/admin/users',
        label: 'Users',
        description: 'Roles & accounts',
        roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN'],
      },
    ],
  },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: AppNavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = isActive(pathname, item.href, item.exact);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`block rounded-lg px-3 py-2.5 transition ${
        active
          ? 'bg-white/10 text-white'
          : 'text-slate-300 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className="text-sm font-medium">{item.label}</span>
      {item.description && (
        <span className="mt-0.5 block text-xs text-slate-400">{item.description}</span>
      )}
    </Link>
  );
}

export function AppSidebar({
  onNavigate,
  className = '',
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  return (
    <aside
      className={`flex h-full w-64 flex-col bg-slate-900 text-white ${className}`}
    >
      <div className="border-b border-white/10 px-5 py-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="text-lg font-bold tracking-tight text-white"
        >
          eFundo
        </Link>
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
          Learning platform
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter(
            (item) => !item.roles || item.roles.includes(user.role),
          );
          if (items.length === 0) return null;

          return (
            <div key={section.title} className="mb-6">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {section.title}
              </p>
              <div className="space-y-1">
                {items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-lg bg-white/5 px-3 py-3">
          <p className="truncate text-sm font-medium">{user.fullName}</p>
          <p className="truncate text-xs text-slate-400">{user.email}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
            {user.role.replace(/_/g, ' ')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
          className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
