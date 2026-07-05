export const ADMIN_ROLES = [
  'SUPER_ADMIN',
  'INSTITUTION_ADMIN',
  'MODERATOR',
] as const;

export function isAdminRole(role: string) {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

export function getHomeHref(role: string) {
  return isAdminRole(role) ? '/admin' : '/dashboard';
}
