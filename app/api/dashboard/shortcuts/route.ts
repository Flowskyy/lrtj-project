import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// Complete list of all modules from sidebar navigation for Dashboard shortcuts
// This includes all top-level items and sub-items as individual shortcut boxes
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
    category: 'content'
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Manage push notifications',
    icon: 'bell',
    path: '/notifications',
    category: 'content'
  },
  {
    id: 'larata-club-history',
    name: 'LarataClub History',
    description: 'View LarataClub earning history',
    icon: 'trophy',
    path: '/larata-club-earning',
    category: 'content'
  },
  {
    id: 'merchandise',
    name: 'Merchandise',
    description: 'Manage merchandise catalog',
    icon: 'shopping-bag',
    path: '/merchandise',
    category: 'content'
  },
  {
    id: 'redeem-merchandise',
    name: 'Redeem Merchandise',
    description: 'Manage merchandise redemptions',
    icon: 'gift',
    path: '/redeem-merchandise',
    category: 'content'
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

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return static shortcuts list
    // In the future, this could be enhanced with user-specific shortcuts
    // or usage-based ranking if needed
    return NextResponse.json({ shortcuts: DASHBOARD_SHORTCUTS });
  } catch (error) {
    console.error('Error fetching dashboard shortcuts:', error);
    return NextResponse.json({ error: 'Failed to fetch shortcuts' }, { status: 500 });
  }
}
