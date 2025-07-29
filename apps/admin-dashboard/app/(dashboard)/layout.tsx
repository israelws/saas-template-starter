'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { logout } from '@/store/slices/authSlice';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { BreadcrumbProvider } from '@/contexts/breadcrumb-context';
import { BreadcrumbNav } from '@/components/layout/breadcrumb-nav';
import { UserProfileMenu } from '@/components/layout/user-profile-menu';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Logo } from '@/components/layout/logo';
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
  Languages,
  Mail,
} from 'lucide-react';

const navigationItems = [
  { key: 'navigation.dashboard', href: '/dashboard', icon: Home },
  { key: 'navigation.organizations', href: '/dashboard/organizations', icon: Building2 },
  { key: 'navigation.users', href: '/dashboard/users', icon: Users },
  { key: 'navigation.invitations', href: '/dashboard/invitations', icon: Mail },
  { key: 'navigation.roles', href: '/dashboard/roles', icon: Shield },
  { key: 'navigation.policies', href: '/dashboard/policies', icon: Shield },
  { key: 'navigation.attributes', href: '/dashboard/attributes', icon: FileText },
  { key: 'navigation.fieldAccessAudit', href: '/dashboard/audit/field-access', icon: FileSearch },
  // Insurance Section
  { key: 'navigation.insuranceAgents', href: '/dashboard/insurance/agents', icon: Briefcase },
  { key: 'navigation.insuranceBranches', href: '/dashboard/insurance/branches', icon: Building2 },
  { key: 'navigation.territories', href: '/dashboard/territories', icon: MapPin },
  // Business Objects
  { key: 'navigation.products', href: '/dashboard/products', icon: Package },
  { key: 'navigation.customers', href: '/dashboard/customers', icon: UserCircle },
  { key: 'navigation.orders', href: '/dashboard/orders', icon: ShoppingCart },
  { key: 'navigation.transactions', href: '/dashboard/transactions', icon: CreditCard },
  { key: 'navigation.translations', href: '/dashboard/translations', icon: Languages },
  { key: 'navigation.settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { t } = useTranslation();

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
          <div className="flex flex-1 flex-col bg-sidebar border-e">
            <div className="flex h-16 items-center justify-between px-4">
              {sidebarOpen && <Logo />}
              <Button
                variant="ghost"
                size="sm"
                className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <ChevronLeft
                  className={cn('h-5 w-5 transition-transform', !sidebarOpen && 'rotate-180')}
                />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 px-2 pb-4">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      'group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                    )}
                  >
                    <item.icon className={cn('h-5 w-5 flex-shrink-0', sidebarOpen && 'me-3')} />
                    {sidebarOpen && <span>{t(item.key)}</span>}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-sidebar-border p-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                onClick={handleLogout}
              >
                <LogOut className={cn('h-5 w-5', sidebarOpen && 'me-3')} />
                {sidebarOpen && <span>{t('navigation.signOut')}</span>}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="lg:hidden">
          <div
            className={cn(
              'fixed inset-0 z-40 bg-black/50 transition-opacity',
              mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className={cn(
              'fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transition-transform',
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            <div className="flex h-16 items-center justify-between px-4">
              <Logo />
              <Button
                variant="ghost"
                size="sm"
                className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 px-2 pb-4">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      'group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0 me-3" />
                    <span>{t(item.key)}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-sidebar-border p-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 me-3" />
                <span>{t('navigation.signOut')}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex h-16 items-center justify-between border-b bg-background px-4 shadow-sm lg:px-6">
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
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <UserProfileMenu />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto bg-muted/30">
            <div className="flex min-h-full flex-col">
              <div className="flex-1 p-4 lg:p-6">
                <BreadcrumbNav />
                {children}
              </div>
              {/* Footer */}
              <footer className="border-t bg-background px-4 py-4 lg:px-6">
                <div className="flex flex-col items-center justify-between space-y-2 text-sm text-muted-foreground sm:flex-row sm:space-y-0">
                  <p>© {new Date().getFullYear()} Committed Ltd. All rights reserved.</p>
                  <div className="flex space-x-4">
                    <Link href="/terms" className="hover:text-primary">
                      {t('footer.termsOfService')}
                    </Link>
                    <Link href="/privacy" className="hover:text-primary">
                      {t('footer.privacyPolicy')}
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
