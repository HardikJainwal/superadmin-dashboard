'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthManager } from '@/lib/auth-manager';
import Sidebar from '@/components/dashboard/sidebar';
import Header from '@/components/dashboard/header';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const currentBackend = AuthManager.getCurrentBackend();
    
    if (!currentBackend || !AuthManager.isAuthenticated(currentBackend)) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex h-screen">
      <Sidebar isOpen={sidebarOpen} />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header 
          sidebarOpen={sidebarOpen} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}