'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, Settings, LogOut, HelpCircle, Bell, Shield, ChevronDown } from 'lucide-react';
import { LanguageSwitcher } from './language-switcher';

export const UserProfileMenu: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const isRTL = ['he', 'ar'].includes(i18n.language);

  // Get user data from Redux store
  const user = useSelector((state: RootState) => state.auth.user);

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  const handleLogout = async () => {
    try {
      // Clear tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      document.cookie = 'authToken=; path=/; max-age=0';

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

  const handleProfileClick = () => {
    router.push('/dashboard/profile');
    setIsOpen(false);
  };

  const handleSettingsClick = () => {
    router.push('/dashboard/settings');
    setIsOpen(false);
  };

  const handleSecurityClick = () => {
    router.push('/dashboard/settings/security');
    setIsOpen(false);
  };

  const handleNotificationsClick = () => {
    router.push('/dashboard/notifications');
    setIsOpen(false);
  };

  const handleHelpClick = () => {
    router.push('/dashboard/help');
    setIsOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-full justify-start gap-2 px-2 lg:w-auto">
          <Avatar className="h-8 w-8">
            <AvatarImage src={''} alt={user.email} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-sm">
            <span className="font-medium">
              {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
            </span>
            <span className="text-xs text-muted-foreground hidden lg:block">Member</span>
          </div>
          <ChevronDown className="ms-auto h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align={isRTL ? "start" : "end"} forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfileClick}>
          <User className="me-2 h-4 w-4" />
          <span>{t('userMenu.profile')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleNotificationsClick}>
          <Bell className="me-2 h-4 w-4" />
          <span>{t('userMenu.notifications')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSecurityClick}>
          <Shield className="me-2 h-4 w-4" />
          <span>Security</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSettingsClick}>
          <Settings className="me-2 h-4 w-4" />
          <span>{t('userMenu.settings')}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleHelpClick}>
          <HelpCircle className="me-2 h-4 w-4" />
          <span>Help & Support</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="w-full px-2 py-1.5">
          <LanguageSwitcher />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
          <LogOut className="me-2 h-4 w-4" />
          <span>{t('userMenu.signOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
