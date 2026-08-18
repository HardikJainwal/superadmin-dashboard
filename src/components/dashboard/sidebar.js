'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

import { 
  LayoutDashboard, 
  Users, 
  Settings,
  Building2,
  Bell,
  Flame,
  HelpCircle,
  Stethoscope,
  FileText,
  Zap,
  ShieldCheck,
  UserCog,
  UserPlus,
  Calendar,
  icons
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const menuItems = [
  { 
    label: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      // { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
    ]
  },
  {
    label: 'Management',
    items: [
      { id: 'users', label: 'Role Based Users', icon: Users, href: '/dashboard/users' },
    ]
  },
  {
    label: 'Website Management',
    items: [
      { id: 'blogs', label: 'Blog Posts', icon: FileText, href: '/dashboard/blogs' },
      { id: 'coaches', label: 'All Coaches', icon: UserCog, href: '/dashboard/Allcoaches'}
    ]
  },
  {
    label: '⚙️ Initial Setup',
    subtitle: 'Create these first — they are global',
    items: [
      { id: 'corporate-features', label: '⚡ Features', icon: Zap, href: '/dashboard/corporate-features' },
      { id: 'corporate-permissions', label: '🛡️ Permissions', icon: ShieldCheck, href: '/dashboard/corporate-permissions' },
    ]
  },
  {
    label: '🏢 Org Onboarding',
    subtitle: 'Follow these steps in order',
    items: [
      { id: 'create-org', label: '① Create Organization', icon: Building2, href: '/dashboard/createCorporate' },
      { id: 'company-config', label: '② Company Config', icon: Settings, href: '/dashboard/company-config' },
      { id: 'create-admin', label: '③ Create Admin', icon: UserCog, href: '/dashboard/create-admin' },
      { id: 'create-user', label: '④ Create User', icon: UserPlus, href: '/dashboard/create-user' },
    ]
  },
  {
    label: '🔧 Org Configuration',
    subtitle: 'Configure after onboarding',
    items: [
      { id: 'org-features', label: 'Org Features', icon: Zap, href: '/dashboard/org-features' },
      { id: 'user-roles', label: 'User Roles', icon: Users, href: '/dashboard/user-roles' },
      { id: 'corporate-community', label: 'Corporate Community', icon: Users, href: '/dashboard/corporate-community' },
      { id: 'role-permissions', label: 'Role Permissions', icon: ShieldCheck, href: '/dashboard/role-permissions' },
      { id: 'corporate-resources', label: 'Resources', icon: FileText, href: '/dashboard/corporate-resources' },
      { id: 'corporate-events', label: 'Create Event', icon: Calendar, href: '/dashboard/corporate-events' },
      { id: 'corporate-coach-assign', label: 'Coach Assignment', icon: Stethoscope, href: '/dashboard/corporate-coach-assign' },
    ]
  },
  {
    label: 'School Management',
    items: [
      { id: 'School Groups', label: 'School Groups', icon: Building2, href: '/dashboard/school-groups' },

      { id: 'School Posts', label: 'School Posts', icon: Building2, href: '/dashboard/school-posts'},
      { id: 'Get School Details', label: 'Get School Post details', icon: Building2, href: '/dashboard/get-community'},
      { id: 'Active Challange', label: 'Active Challange', icon: Flame, href: '/dashboard/active-challange'},
      { id: 'Add Resources', label: 'Add Resources', icon: Building2, href: '/dashboard/add-resource'},
      { id: 'Add Equipment', label: 'Add Equipment', icon: Stethoscope, href: '/dashboard/add-equipment'},
      { id: 'Coach Assign', label: 'Coach Assign', icon: Building2, href: '/dashboard/coach-assign'},
      { id: 'Add Daily Tips', label: 'Add Daily Tips', icon: Building2, href: '/dashboard/add-tips'},
      { id: 'Create Program', label:'Create Program', icon: Building2 , href:'/dashboard/create-program'},
      { id: 'Quiz Modules', label: 'Quiz Modules', icon: Building2, href: '/dashboard/quiz-modules'},
      // { id: 'All Schools', label: 'All Schools', icon: Building2, href: '/dashboard/all-school'},
      // { id: 'billing', label: 'Billing', icon: CreditCard, href: '/dashboard/billing' },
      { id: 'notifications', label: 'Notifications', icon: Bell, href: '/dashboard/notifications' },
      { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
      { id: 'help', label: 'Help & Support', icon: HelpCircle, href: '/dashboard/help' },
    ]
  }
];

export default function Sidebar({ isOpen }) {
  const pathname = usePathname();

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-0'} border-r bg-background transition-all duration-300 overflow-hidden`}>
      <div className="flex h-full flex-col">
        {/* Logo/Brand */}
        <div className="flex h-14 items-center border-b px-4">
          <h2 className="text-lg font-semibold">Admin Panel</h2>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid gap-6 px-2">
            {menuItems.map((section, idx) => (
              <div key={idx}>
                <h3 className="mb-1 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.label}
                </h3>
                {section.subtitle && (
                  <p className="mb-2 px-4 text-[10px] text-muted-foreground/70 leading-tight">
                    {section.subtitle}
                  </p>
                )}
                <div className="grid gap-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    
                    return (
                      <Link key={item.id} href={item.href}>
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className="w-full justify-start"
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
                {idx < menuItems.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </nav>
        </div>

        {/* User Profile at Bottom */}
        <div className="mt-auto border-t p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">Admin User</p>
              <p className="text-xs text-muted-foreground truncate">admin@example.com</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}