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
  Stethoscope
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
                <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.label}
                </h3>
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