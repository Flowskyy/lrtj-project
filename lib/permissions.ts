import { prisma } from "@/lib/prisma"

// Route to pageKey mapping (for checking permissions)
const ROUTE_TO_PAGE_KEY: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/users': 'users',
  '/news': 'news',
  '/notifications': 'notifications',
  '/larata-club-earning': 'larata-club-earning',
  '/merchandise': 'merchandise',
  '/redeem-merchandise': 'redeem-merchandise',
  '/daily-benefit': 'daily-benefit',
  '/redeem-benefit': 'redeem-benefit',
  '/master/merchandise-category': 'master-merchandise-category',
  '/master/welcome-point': 'master-welcome-point',
  '/master/banner': 'master-banner',
  '/master/popups': 'master-popups',
  '/master/membership': 'master-membership',
  '/admin-control-panel/roles': 'master-roles',
  '/admin-control-panel/admin-management': 'master-admin-management',
  '/admin-control-panel/invitation': 'master-invitation',
  '/admin-control-panel/activity-log': 'master-activity-log',
  '/admin-control-panel/roles/add': 'master-roles',
  '/admin-control-panel/roles/edit': 'master-roles',
  '/admin-control-panel/admin-management/add': 'master-admin-management',
  '/admin-control-panel/admin-management/edit': 'master-admin-management',
  '/admin-control-panel/invitation/add': 'master-invitation',
  '/admin-control-panel/invitation/edit': 'master-invitation',
  '/master/banner/add': 'master-banner',
  '/master/banner/edit': 'master-banner',
  '/master/popups/add': 'master-popups',
  '/master/popups/edit': 'master-popups',
  '/master/welcome-point/edit': 'master-welcome-point',
  '/merchandise/add': 'merchandise',
  '/merchandise/edit': 'merchandise',
  '/merchandise/view': 'merchandise',
  '/redeem-merchandise/view': 'redeem-merchandise',
  '/daily-benefit/add': 'daily-benefit',
  '/daily-benefit/edit': 'daily-benefit',
  '/daily-benefit/view': 'daily-benefit',
  '/redeem-benefit/view': 'redeem-benefit',
  '/news/add': 'news',
  '/news/edit': 'news',
  '/news/view': 'news',
  '/users/': 'users',
}

const PAGE_ROUTE_MAP: Record<string, string> = {
  'dashboard': '/dashboard',
  'users': '/users',
  'news': '/news',
  'notifications': '/notifications',
  'larata-club-earning': '/larata-club-earning',
  'merchandise': '/merchandise',
  'redeem-merchandise': '/redeem-merchandise',
  'daily-benefit': '/daily-benefit',
  'redeem-benefit': '/redeem-benefit',
  'master-merchandise-category': '/master/merchandise-category',
  'master-welcome-point': '/master/welcome-point',
  'master-banner': '/master/banner',
  'master-popups': '/master/popups',
  'master-membership': '/master/membership',
  'master-roles': '/admin-control-panel/roles',
  'master-admin-management': '/admin-control-panel/admin-management',
  'master-invitation': '/admin-control-panel/invitation',
  'master-activity-log': '/admin-control-panel/activity-log',
}

export async function getUserPermissions(roleId: number | null): Promise<string[]> {
  if (!roleId) return []

  const role = await prisma.auth_roles.findUnique({
    where: { id: roleId },
    select: { isSuperAdmin: true }
  })

  if (!role) return []

  // Super admins have access to all pages
  if (role.isSuperAdmin) {
    return Object.keys(PAGE_ROUTE_MAP)
  }

  const permissions = await prisma.role_permissions.findMany({
    where: { roleId },
    select: { pageKey: true }
  })

  return permissions.map(p => p.pageKey)
}

export function getPageKeyFromPath(pathname: string): string | null {
  // Check for exact matches first
  if (ROUTE_TO_PAGE_KEY[pathname]) {
    return ROUTE_TO_PAGE_KEY[pathname]
  }

  // Check for sub-routes (e.g., /merchandise/edit/123 -> merchandise)
  for (const [route, pageKey] of Object.entries(ROUTE_TO_PAGE_KEY)) {
    if (pathname.startsWith(route + '/') || pathname === route) {
      return pageKey
    }
  }

  return null
}

export async function hasPageAccess(roleId: number | null, pathname: string): Promise<boolean> {
  // Always allow access to dashboard (default landing page)
  if (pathname === '/dashboard') return true
  
  const pageKey = getPageKeyFromPath(pathname)
  if (!pageKey) return false // Unknown page, deny access

  const permissions = await getUserPermissions(roleId)
  return permissions.includes(pageKey)
}
