'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useTranslation } from '@/hooks/use-translation';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Send, X, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Invitation {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roleId: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: string;
  createdAt: string;
  resendCount: number;
  invitedBy: {
    firstName: string;
    lastName: string;
  };
  organization: {
    name: string;
  };
}

export function InvitationsTable() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const token = useSelector((state: RootState) => state.auth.token);
  const currentOrganizationId = useSelector((state: RootState) => state.auth.currentOrganizationId);
  
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);

  useEffect(() => {
    fetchInvitations();
  }, [currentOrganizationId]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const queryParams = currentOrganizationId ? `?organizationId=${currentOrganizationId}` : '';
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/invitations${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch invitations');
      
      const data = await response.json();
      setInvitations(data);
    } catch (error) {
      toast({
        title: t('invitations.fetchError'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (invitation: Invitation) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/invitations/${invitation.id}/resend`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('Failed to resend invitation');
      
      toast({
        title: t('invitations.resendSuccess'),
        description: t('invitations.resendSuccessDescription', { email: invitation.email }),
      });
      
      fetchInvitations();
    } catch (error) {
      toast({
        title: t('invitations.resendError'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRevoke = async () => {
    if (!selectedInvitation) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/invitations/${selectedInvitation.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('Failed to revoke invitation');
      
      toast({
        title: t('invitations.revokeSuccess'),
        description: t('invitations.revokeSuccessDescription'),
      });
      
      fetchInvitations();
    } catch (error) {
      toast({
        title: t('invitations.revokeError'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setRevokeDialogOpen(false);
      setSelectedInvitation(null);
    }
  };

  const copyInvitationLink = (token: string) => {
    const link = `${window.location.origin}/onboarding?token=${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: t('invitations.linkCopied'),
      description: t('invitations.linkCopiedDescription'),
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'default',
      accepted: 'secondary',
      expired: 'destructive',
      revoked: 'outline',
    };
    
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      revoked: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {t(`invitations.status.${status}`)}
      </Badge>
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8">{t('common.loading')}</div>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('invitations.table.email')}</TableHead>
              <TableHead>{t('invitations.table.name')}</TableHead>
              <TableHead>{t('invitations.table.role')}</TableHead>
              <TableHead>{t('invitations.table.status')}</TableHead>
              <TableHead>{t('invitations.table.invitedBy')}</TableHead>
              <TableHead>{t('invitations.table.expiresAt')}</TableHead>
              <TableHead>{t('invitations.table.resendCount')}</TableHead>
              <TableHead className="text-end">{t('invitations.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  {t('invitations.noInvitations')}
                </TableCell>
              </TableRow>
            ) : (
              invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">{invitation.email}</TableCell>
                  <TableCell>
                    {invitation.firstName || invitation.lastName
                      ? `${invitation.firstName || ''} ${invitation.lastName || ''}`.trim()
                      : '-'}
                  </TableCell>
                  <TableCell>{invitation.roleId}</TableCell>
                  <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                  <TableCell>
                    {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}
                  </TableCell>
                  <TableCell>
                    {format(new Date(invitation.expiresAt), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{invitation.resendCount}</TableCell>
                  <TableCell className="text-end">
                    {invitation.status === 'pending' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">{t('common.openMenu')}</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleResend(invitation)}>
                            <Send className="me-2 h-4 w-4" />
                            {t('invitations.resend')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyInvitationLink(invitation.id)}>
                            <Copy className="me-2 h-4 w-4" />
                            {t('invitations.copyLink')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedInvitation(invitation);
                              setRevokeDialogOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <X className="me-2 h-4 w-4" />
                            {t('invitations.revoke')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('invitations.revokeConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('invitations.revokeConfirmDescription', { 
                email: selectedInvitation?.email 
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-destructive text-destructive-foreground">
              {t('invitations.revoke')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}