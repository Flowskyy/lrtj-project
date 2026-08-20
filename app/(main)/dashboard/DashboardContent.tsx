"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useSessionContext } from "@/contexts/SessionContext";
import { useRouter } from "next/navigation";
import { useOnlineStatus } from "@/hooks/use-online-status";
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
  const { onlineAdmins } = useOnlineStatus();
  
  // Welcome banner state
  const [showWelcome, setShowWelcome] = useState(true);
  const [isFirstTimeLogin, setIsFirstTimeLogin] = useState(false);
  
  // Data states
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  
  // Loading states
  const [shortcutsLoading, setShortcutsLoading] = useState(true);
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

  // Color palette for shortcuts - purposeful accent colors per category
  const getShortcutAccentColor = (category: string) => {
    const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
      'users': { bg: 'bg-blue-50/80', text: 'text-blue-600', border: 'border-blue-200/60' },
      'news': { bg: 'bg-amber-50/80', text: 'text-amber-600', border: 'border-amber-200/60' },
      'notifications': { bg: 'bg-purple-50/80', text: 'text-purple-600', border: 'border-purple-200/60' },
      'club': { bg: 'bg-yellow-50/80', text: 'text-yellow-600', border: 'border-yellow-200/60' },
      'merchandise': { bg: 'bg-emerald-50/80', text: 'text-emerald-600', border: 'border-emerald-200/60' },
      'master': { bg: 'bg-slate-50/80', text: 'text-slate-600', border: 'border-slate-200/60' },
      'security': { bg: 'bg-rose-50/80', text: 'text-rose-600', border: 'border-rose-200/60' },
    };
    return categoryColors[category] || { bg: 'bg-gray-50/80', text: 'text-gray-600', border: 'border-gray-200/60' };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner - always visible */}
      {showWelcome && (
        <div className="mb-6">
          <Card className="bg-gradient-to-br from-[#E5262C]/8 via-white/60 to-white/40 border border-white/40 shadow-lg backdrop-blur-xl rounded-2xl relative overflow-hidden">
            {/* Decorative gradient blob */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#E5262C]/15 to-[#E5262C]/5 blur-3xl rounded-full" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#E5262C]/8 to-transparent blur-2xl rounded-full" />
            
            <CardContent className="p-6 relative z-10">
              {isPending ? (
                <div className="space-y-3">
                  <div className="h-8 w-64 animate-pulse rounded bg-gray-200/50 overflow-hidden" />
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-200/30 overflow-hidden" />
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  {/* Mascot Image */}
                  <div className="hidden sm:block flex-shrink-0">
                    <img 
                      src="/laratawelcome.png" 
                      alt="Larata Mascot" 
                      className="h-24 w-auto object-contain drop-shadow-lg"
                    />
                  </div>
                  <div className="space-y-2 flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      {isFirstTimeLogin ? (
                        <>
                          <div className="h-2 w-2 rounded-full bg-[#E5262C] animate-pulse" />
                          <h2 className="text-xl font-bold text-gray-900">
                            Welcome to Larata Apps Dashboard
                          </h2>
                        </>
                      ) : (
                        <>
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <h2 className="text-xl font-bold text-gray-900">
                            Welcome back
                          </h2>
                        </>
                      )}
                    </div>
                    <p className="text-base text-gray-600">
                      {isFirstTimeLogin 
                        ? <>Get started with your dashboard, <span className="font-semibold text-[#E5262C]">{displayName}</span>!</>
                        : <>Ready to continue, <span className="font-semibold text-[#E5262C]">{displayName}</span>!</>
                      }
                    </p>
                  </div>
                  {/* LRTJ Logo */}
                  <div className="hidden sm:block flex-shrink-0 pr-8">
                    <img 
                      src="/logo-lrtj.png" 
                      alt="LRTJ Logo" 
                      className="h-16 w-auto object-contain"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shortcuts - Full width panel with elevated glassmorphism */}
      <Card className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-gray-900 font-semibold text-base">Shortcuts</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {shortcutsLoading ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/60 border border-white/40 hover:bg-white/80 transition-all cursor-pointer shadow-sm overflow-hidden">
                  <Skeleton className="h-8 w-8 rounded-lg mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))
            ) : (
              shortcuts.map((shortcut) => {
                const IconComponent = iconMap[shortcut.icon];
                const accentColors = getShortcutAccentColor(shortcut.category);
                return (
                  <div
                    key={shortcut.id}
                    onClick={() => handleShortcutClick(shortcut.path)}
                    className={`p-4 rounded-xl bg-white/60 border border-white/40 shadow-sm hover:bg-white/80 hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group overflow-hidden ${accentColors.border}`}
                  >
                    {IconComponent && (
                      <div className={`h-8 w-8 rounded-lg ${accentColors.bg} flex items-center justify-center mb-3 group-hover:shadow-sm transition-all overflow-hidden`}>
                        <IconComponent className={`h-4 w-4 ${accentColors.text}`} />
                      </div>
                    )}
                    <h3 className="text-xs font-semibold text-gray-900 mb-1 truncate">
                      {shortcut.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight">
                      {shortcut.description}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout below: Activity | Online Admin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Activity */}
        <div>
          <Card className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-gray-900 font-semibold text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {activityLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-3 rounded-lg bg-white/60 border border-white/40 shadow-sm overflow-hidden">
                      <Skeleton className="h-4 w-8 mb-2" />
                      <Skeleton className="h-3 w-full mb-1" />
                      <Skeleton className="h-2 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs">
                  No recent activity
                </div>
              ) : (
                <div className="space-y-2">
                  {activityLogs.map((log, index) => (
                    <div key={log.id} className="p-3 rounded-lg bg-white/60 border border-white/40 shadow-sm hover:bg-white/80 hover:shadow-md transition-all overflow-hidden">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold text-gray-400 bg-gray-100/80 px-1.5 py-0.5 rounded-full">#{index + 1}</span>
                        <span className="text-xs font-medium text-gray-900 truncate flex-1">
                          {log.actorName || log.actorEmail || 'Unknown'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {formatActivityTime(log.createdAt)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        {formatActivityAction(log.action)} <span className="text-gray-400 font-normal">•</span> {formatTableForDisplay(log.tableName)}
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
          <Card className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-gray-900 font-semibold text-base">Online Admins</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {onlineAdmins.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs">
                  No admins currently online
                </div>
              ) : (
                <div className="space-y-2">
                  {onlineAdmins.map((user) => (
                    <div key={user.id} className="flex items-center gap-2 p-3 rounded-lg bg-white/60 border border-white/40 shadow-sm hover:bg-white/80 hover:shadow-md transition-all overflow-hidden">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#E5262C]/10 to-[#E5262C]/5 flex items-center justify-center flex-shrink-0 border border-[#E5262C]/20 overflow-hidden">
                        <span className="text-[#E5262C] font-semibold text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium">
                          {user.role}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50/80 border border-emerald-200/60 overflow-hidden">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-semibold text-emerald-600">Online</span>
                        </span>
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
