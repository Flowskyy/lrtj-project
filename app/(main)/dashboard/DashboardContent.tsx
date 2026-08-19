"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionContext } from "@/contexts/SessionContext";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Shield, 
  Newspaper, 
  Bell, 
  ShoppingBag, 
  Gift, 
  Package, 
  Star, 
  Image as ImageIcon, 
  Award, 
  User, 
  Mail, 
  Clock,
  Trophy
} from "lucide-react";

interface Shortcut {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  category: string;
}

interface OnlineUser {
  id: string;
  name: string;
  role: string;
}

interface ActivityLog {
  id: string;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  tableName: string;
  createdAt: string;
}

// Icon mapping for shortcuts
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  users: Users,
  shield: Shield,
  newspaper: Newspaper,
  bell: Bell,
  'shopping-bag': ShoppingBag,
  gift: Gift,
  package: Package,
  star: Star,
  image: ImageIcon,
  award: Award,
  user: User,
  mail: Mail,
  clock: Clock,
  trophy: Trophy,
};

export default function DashboardContent() {
  const { session, isPending } = useSessionContext();
  const router = useRouter();
  
  // Welcome banner state
  const [showWelcome, setShowWelcome] = useState(false);
  const [isFirstTimeLogin, setIsFirstTimeLogin] = useState(false);
  const [welcomeAnimating, setWelcomeAnimating] = useState(false);
  
  // Data states
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  
  // Loading states
  const [shortcutsLoading, setShortcutsLoading] = useState(true);
  const [onlineUsersLoading, setOnlineUsersLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  const displayName = session?.user?.email 
    ? session.user.email.split('@')[0] 
    : session?.user?.name || 'User';

  // Check if first-time login or returning user
  useEffect(() => {
    if (session?.user) {
      // Fetch user details to get createdAt and lastSeen
      const fetchUserDetails = async () => {
        try {
          const res = await fetch('/api/user/details');
          if (res.ok) {
            const data = await res.json();
            const userCreatedAt = new Date(data.user.createdAt || '');
            const userLastSeen = data.user.lastSeen ? new Date(data.user.lastSeen) : null;
            
            // First-time login: user was created very recently (within last minute) and no lastSeen
            const isRecentCreation = (Date.now() - userCreatedAt.getTime()) < 60000; // 1 minute
            const isFirstTime = isRecentCreation && !userLastSeen;
            
            setIsFirstTimeLogin(isFirstTime);
            
            // Check sessionStorage to only show welcome once per login session
            const hasShownWelcome = sessionStorage.getItem('welcome_shown');
            if (!hasShownWelcome) {
              setShowWelcome(true);
              setWelcomeAnimating(true);
              sessionStorage.setItem('welcome_shown', 'true');
              
              // Auto-fade after 15 seconds
              const timer = setTimeout(() => {
                setWelcomeAnimating(false);
                setTimeout(() => setShowWelcome(false), 300); // Wait for exit animation
              }, 15000);
              
              return () => clearTimeout(timer);
            }
          }
        } catch (error) {
          console.error('Failed to fetch user details:', error);
        }
      };
      
      fetchUserDetails();
    }
  }, [session]);

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    async function fetchShortcuts() {
      try {
        const res = await fetch("/api/dashboard/shortcuts", { signal });
        const data = await res.json();
        if (!signal.aborted) {
          setShortcuts(data.shortcuts || []);
        }
      } catch (err) {
        if (!signal.aborted) {
          console.error("Failed to fetch shortcuts", err);
        }
      } finally {
        if (!signal.aborted) {
          setShortcutsLoading(false);
        }
      }
    }

    async function fetchOnlineUsers() {
      try {
        const res = await fetch("/api/dashboard/online-users", { signal });
        const data = await res.json();
        if (!signal.aborted) {
          setOnlineUsers(data.users || []);
        }
      } catch (err) {
        if (!signal.aborted) {
          console.error("Failed to fetch online users", err);
        }
      } finally {
        if (!signal.aborted) {
          setOnlineUsersLoading(false);
        }
      }
    }

    async function fetchActivityLogs() {
      try {
        const res = await fetch("/api/dashboard/activity?limit=3", { signal });
        const data = await res.json();
        if (!signal.aborted) {
          setActivityLogs(data.logs || []);
        }
      } catch (err) {
        if (!signal.aborted) {
          console.error("Failed to fetch activity logs", err);
        }
      } finally {
        if (!signal.aborted) {
          setActivityLoading(false);
        }
      }
    }

    fetchShortcuts();
    fetchOnlineUsers();
    fetchActivityLogs();

    return () => {
      abortController.abort();
    };
  }, []);

  const handleShortcutClick = (path: string) => {
    router.push(path);
  };

  const formatActivityAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatActivityTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatTableForDisplay = (tableName: string) => {
    return tableName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner - 15 second auto-fade with animation */}
      {showWelcome && (
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${welcomeAnimating ? 'opacity-100 max-h-32 mb-6' : 'opacity-0 max-h-0 mb-0'}`}
        >
          <Card className="bg-gradient-to-r from-[#E5262C]/10 to-[#E5262C]/5 border-[#E5262C]/10 rounded-2xl">
            <CardContent className="p-6">
              {isPending ? (
                <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
              ) : (
                <h2 className="text-lg font-semibold text-gray-900">
                  {isFirstTimeLogin 
                    ? <>Welcome to Larata Apps Dashboard, <span className="text-[#E5262C]">{displayName}</span>!</>
                    : <>Welcome back, <span className="text-[#E5262C]">{displayName}</span>!</>
                  }
                </h2>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shortcuts - Full width panel */}
      <Card className="bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-gray-900 font-semibold">Shortcuts</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {shortcutsLoading ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="p-3 rounded-lg bg-gray-50/50 border border-gray-200/60 hover:bg-gray-50/70 transition-colors cursor-pointer">
                  <Skeleton className="h-6 w-6 rounded mb-2" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-2 w-3/4" />
                </div>
              ))
            ) : (
              shortcuts.map((shortcut) => {
                const IconComponent = iconMap[shortcut.icon];
                return (
                  <div
                    key={shortcut.id}
                    onClick={() => handleShortcutClick(shortcut.path)}
                    className="p-3 rounded-lg bg-gray-50/50 border border-gray-200/60 hover:bg-gray-50/70 hover:border-[#E5262C]/30 transition-all cursor-pointer group"
                  >
                    {IconComponent && (
                      <div className="h-6 w-6 rounded-lg bg-[#E5262C]/10 flex items-center justify-center mb-2 group-hover:bg-[#E5262C]/20 transition-colors">
                        <IconComponent className="h-3 w-3 text-[#E5262C]" />
                      </div>
                    )}
                    <h3 className="text-xs font-medium text-gray-900 mb-1 truncate">
                      {shortcut.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 line-clamp-2">
                      {shortcut.description}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout below: Shortcuts | Online Admin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Activity */}
        <div>
          <Card className="bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-lg h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-gray-900 font-semibold">Activity</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {activityLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-3 rounded bg-gray-50/50">
                      <Skeleton className="h-4 w-8 mb-2" />
                      <Skeleton className="h-3 w-full mb-1" />
                      <Skeleton className="h-2 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No recent activity
                </div>
              ) : (
                <div className="space-y-2">
                  {activityLogs.map((log, index) => (
                    <div key={log.id} className="p-3 rounded bg-gray-50/50 hover:bg-gray-50/70 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                        <span className="text-sm font-medium text-gray-900 truncate flex-1">
                          {log.actorName || log.actorEmail || 'Unknown'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatActivityTime(log.createdAt)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatActivityAction(log.action)} - {formatTableForDisplay(log.tableName)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Online Admins */}
        <div>
          <Card className="bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-lg h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-gray-900 font-semibold">Online Admins</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {onlineUsersLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : onlineUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No admins currently online
                </div>
              ) : (
                <div className="space-y-2">
                  {onlineUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50">
                      <div className="h-8 w-8 rounded-full bg-[#E5262C]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#E5262C] font-semibold text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
