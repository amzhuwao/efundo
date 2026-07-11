'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { getHomeHref, isAdminRole } from '@/lib/roles';

export interface AppNavItem {
  href: string;
  label: string;
  description?: string;
  roles?: string[];
  exact?: boolean;
  adminHref?: string;
}

const NAV_SECTIONS: { title: string; items: AppNavItem[] }[] = [
  {
    title: 'Home',
    items: [{ href: '/dashboard', label: 'Dashboard', exact: true, adminHref: '/admin' }],
  },
  {
    title: 'Learn',
    items: [
      { href: '/learn', label: 'Lessons', description: 'Courses & modules' },
      { href: '/practice', label: 'Practice tests', description: 'Quizzes & mock exams' },
      { href: '/library', label: 'Library', description: 'Past papers & notes' },
      { href: '/assistant', label: 'AI tutor', description: 'Ask & upload assignments' },
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
        href: '/admin/lessons/ai',
        label: 'AI course builder',
        description: 'Generate from PDFs & videos',
        roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'LECTURER'],
      },
      {
        href: '/admin/assessment',
        label: 'Assessment',
        description: 'Questions, quizzes & mock exams',
        roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'LECTURER'],
      },
      {
        href: '/admin/curriculum',
        label: 'Programs',
        description: 'Grades, forms & courses',
        roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN'],
      },
      {
        href: '/admin/subjects',
        label: 'Subjects',
        description: 'Create & manage subjects',
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
  userRole,
}: {
  item: AppNavItem;
  pathname: string;
  onNavigate?: () => void;
  userRole: string;
}) {
  const href =
    item.adminHref && isAdminRole(userRole) ? item.adminHref : item.href;
  const active = isActive(pathname, href, item.exact);

  return (
    <Link
      href={href}
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

  const homeHref = getHomeHref(user.role);

  return (
    <aside
      className={`flex h-full w-64 flex-col bg-slate-900 text-white ${className}`}
    >
      <div className="border-b border-white/10 px-5 py-5">
        <Link
          href={homeHref}
          onClick={onNavigate}
          className="text-lg font-bold tracking-tight text-white"
        >
          eFundo
        </Link>
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
          {isAdminRole(user.role) ? 'Admin' : 'Learning platform'}
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
                    userRole={user.role}
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
