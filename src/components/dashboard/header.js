'use client';

import { useRouter, usePathname } from 'next/navigation'; 
import Link from 'next/link';
import { 
  Menu, X, Search, Bell, User, CreditCard, Settings, LogOut,
  LayoutDashboard, Users, ShoppingCart, Package, BarChart3,
  FileText, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


const menuItems = [
  { 
    label: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
    ]
  },
  {
    label: 'Management',
    items: [
      { id: 'users', label: 'Users', icon: Users, href: '/dashboard/users' },
      { id: 'products', label: 'Products', icon: Package, href: '/dashboard/products' },
      { id: 'orders', label: 'Orders', icon: ShoppingCart, href: '/dashboard/orders' },
    ]
  },
  {
    label: 'Other',
    items: [
      { id: 'reports', label: 'Reports', icon: FileText, href: '/dashboard/reports' },
      { id: 'billing', label: 'Billing', icon: CreditCard, href: '/dashboard/billing' },
      { id: 'notifications', label: 'Notifications', icon: Bell, href: '/dashboard/notifications' },
      { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
      { id: 'help', label: 'Help & Support', icon: HelpCircle, href: '/dashboard/help' },
    ]
  }
];

  


function MobileSidebar() {
  const pathname = usePathname();
  
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </div>
      
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
    </div>
  );
}

export default function Header({ sidebarOpen, toggleSidebar }) {
     const router = useRouter(); 

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      {/* Desktop Sidebar Toggle */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleSidebar}
        className="hidden md:flex"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <MobileSidebar />
        </SheetContent>
      </Sheet>

      <div className="flex-1">
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </div>

      {/* Search */}
      <Button variant="ghost" size="icon">
        <Search className="h-5 w-5" />
      </Button>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute right-1 top-1 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
        </span>
      </Button>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
           <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
      <LogOut className="mr-2 h-4 w-4" />
      Log out
    </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}