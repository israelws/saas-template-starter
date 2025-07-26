'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { logout } from '@/store/slices/authSlice';
import { useToast } from '@/hooks/use-toast';
import { BreadcrumbProvider } from '@/contexts/breadcrumb-context';
import { BreadcrumbNav } from '@/components/layout/breadcrumb-nav';
import { UserProfileMenu } from '@/components/layout/user-profile-menu';
import {
  Building2,
  Users,
  Shield,
  Package,
  ShoppingCart,
  CreditCard,
  Settings,
  Menu,
  X,
  ChevronLeft,
  Home,
  UserCircle,
  LogOut,
  FileText,
  FileSearch,
  Briefcase,
  MapPin,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Organizations', href: '/dashboard/organizations', icon: Building2 },
  { name: 'Users', href: '/dashboard/users', icon: Users },
  { name: 'Roles', href: '/dashboard/roles', icon: Shield },
  { name: 'Policies', href: '/dashboard/policies', icon: Shield },
  { name: 'Field Permissions', href: '/dashboard/policies/field-permissions', icon: Shield },
  { name: 'Attributes', href: '/dashboard/attributes', icon: FileText },
  { name: 'Field Access Audit', href: '/dashboard/audit/field-access', icon: FileSearch },
  // Insurance Section
  { name: 'Insurance Agents', href: '/dashboard/insurance/agents', icon: Briefcase },
  { name: 'Insurance Branches', href: '/dashboard/insurance/branches', icon: Building2 },
  { name: 'Territories', href: '/dashboard/territories', icon: MapPin },
  // Business Objects
  { name: 'Products', href: '/dashboard/products', icon: Package },
  { name: 'Customers', href: '/dashboard/customers', icon: UserCircle },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Transactions', href: '/dashboard/transactions', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      // Clear tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');

      // Clear cookie properly
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      // Dispatch logout action
      dispatch(logout());

      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });

      // Redirect to login
      router.push('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <BreadcrumbProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar for desktop */}
        <div className={cn('hidden lg:flex lg:flex-col', sidebarOpen ? 'lg:w-64' : 'lg:w-16')}>
          <div className="flex flex-1 flex-col bg-gray-900">
            <div className="flex h-16 items-center justify-between px-4">
              {sidebarOpen && <h1 className="text-xl font-semibold text-white">SAAS Admin</h1>}
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <ChevronLeft
                  className={cn('h-5 w-5 transition-transform', !sidebarOpen && 'rotate-180')}
                />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 px-2 pb-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                    )}
                  >
                    <item.icon className={cn('h-5 w-5 flex-shrink-0', sidebarOpen && 'mr-3')} />
                    {sidebarOpen && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-gray-700 p-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className={cn('h-5 w-5', sidebarOpen && 'mr-3')} />
                {sidebarOpen && <span>Sign out</span>}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="lg:hidden">
          <div
            className={cn(
              'fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity',
              mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className={cn(
              'fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transition-transform',
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            <div className="flex h-16 items-center justify-between px-4">
              <h1 className="text-xl font-semibold text-white">SAAS Admin</h1>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 px-2 pb-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-gray-700 p-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <LogOut className="mr-3 h-5 w-5" />
                <span>Sign out</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm lg:px-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <UserProfileMenu />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="flex min-h-full flex-col">
              <div className="flex-1 p-4 lg:p-6">
                <BreadcrumbNav />
                {children}
              </div>
              {/* Footer */}
              <footer className="border-t bg-white px-4 py-4 lg:px-6">
                <div className="flex flex-col items-center justify-between space-y-2 text-sm text-muted-foreground sm:flex-row sm:space-y-0">
                  <p>&copy; {new Date().getFullYear()} SAAS Template. All rights reserved.</p>
                  <div className="flex space-x-4">
                    <Link href="/terms" className="hover:text-primary">
                      Terms of Service
                    </Link>
                    <Link href="/privacy" className="hover:text-primary">
                      Privacy Policy
                    </Link>
                  </div>
                </div>
              </footer>
            </div>
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}
