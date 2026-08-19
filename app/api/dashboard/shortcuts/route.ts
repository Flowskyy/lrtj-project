import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserPermissions } from '@/lib/permissions';

// Complete list of all modules from sidebar navigation for Dashboard shortcuts
// This includes all top-level items and sub-items as individual shortcut boxes
// ORDERED TO MATCH SIDEBAR NAV_ITEMS EXACTLY
const DASHBOARD_SHORTCUTS = [
  {
    id: 'users',
    name: 'Users',
    description: 'Manage user accounts and profiles',
    icon: 'users',
    path: '/users',
    category: 'users'
  },
  {
    id: 'news',
    name: 'News',
    description: 'Manage news and announcements',
    icon: 'newspaper',
    path: '/news',
    category: 'news'
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Manage push notifications',
    icon: 'bell',
    path: '/notifications',
    category: 'notifications'
  },
  {
    id: 'larata-club-history',
    name: 'LarataClub History',
    description: 'View LarataClub earning history',
    icon: 'trophy',
    path: '/larata-club-earning',
    category: 'club'
  },
  {
    id: 'merchandise',
    name: 'Merchandise',
    description: 'Manage merchandise catalog',
    icon: 'shopping-bag',
    path: '/merchandise',
    category: 'merchandise'
  },
  {
    id: 'redeem-merchandise',
    name: 'Redeem Merchandise',
    description: 'Manage merchandise redemptions',
    icon: 'gift',
    path: '/redeem-merchandise',
    category: 'merchandise'
  },
  {
    id: 'merchandise-category',
    name: 'Merchandise Category',
    description: 'Manage merchandise categories',
    icon: 'package',
    path: '/master/merchandise-category',
    category: 'master'
  },
  {
    id: 'welcome-point',
    name: 'Welcome Point',
    description: 'Manage welcome point settings',
    icon: 'star',
    path: '/master/welcome-point',
    category: 'master'
  },
  {
    id: 'banner',
    name: 'Banner',
    description: 'Manage banner images',
    icon: 'image',
    path: '/master/banner',
    category: 'master'
  },
  {
    id: 'popups',
    name: 'Popups',
    description: 'Manage popup configurations',
    icon: 'image',
    path: '/master/popups',
    category: 'master'
  },
  {
    id: 'membership',
    name: 'Membership',
    description: 'Manage membership tiers',
    icon: 'award',
    path: '/master/membership',
    category: 'master'
  },
  {
    id: 'roles',
    name: 'Roles',
    description: 'Manage role permissions',
    icon: 'shield',
    path: '/admin-control-panel/roles',
    category: 'security'
  },
  {
    id: 'admin-management',
    name: 'Admin Management',
    description: 'Manage admin accounts',
    icon: 'user',
    path: '/admin-control-panel/admin-management',
    category: 'security'
  },
  {
    id: 'invitation',
    name: 'Invitation',
    description: 'Manage admin invitations',
    icon: 'mail',
    path: '/admin-control-panel/invitation',
    category: 'security'
  },
  {
    id: 'activity-log',
    name: 'Activity Log',
    description: 'View system activity logs',
    icon: 'clock',
    path: '/admin-control-panel/activity-log',
    category: 'security'
  }
];

// Helper function to get permission key from path (matches sidebar logic)
const getPageKey = (href: string) => {
  // Special handling for master routes
  if (href.startsWith('/master/')) {
    return 'master-' + href.replace('/master/', '').replace(/\//g, '-');
  }
  // Special handling for admin-control-panel routes
  if (href.startsWith('/admin-control-panel/')) {
    return 'master-' + href.replace('/admin-control-panel/', '').replace(/\//g, '-');
  }
  return href.replace(/^\//, '').replace(/\//g, '-');
};

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user permissions
    let permissions: string[] = [];
    const roleId = (session.user as any).roleId;
    if (roleId) {
      permissions = await getUserPermissions(roleId);
    } else {
      const { prisma } = await import('@/lib/prisma');
      const user = await prisma.auth_users.findUnique({
        where: { id: session.user.id },
        select: { roleId: true }
      });
      if (user?.roleId) {
        permissions = await getUserPermissions(user.roleId);
      }
    }

    // Filter shortcuts based on permissions (same logic as sidebar)
    const filteredShortcuts = DASHBOARD_SHORTCUTS.filter(shortcut => {
      const pageKey = getPageKey(shortcut.path);
      return permissions.includes(pageKey);
    });

    return NextResponse.json({ shortcuts: filteredShortcuts });
  } catch (error) {
    console.error('Error fetching dashboard shortcuts:', error);
    return NextResponse.json({ error: 'Failed to fetch shortcuts' }, { status: 500 });
  }
}
