'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Plus, Send, X, RotateCw } from 'lucide-react';
import { InvitationsTable } from './invitations-table';
import { InviteUserDialog } from './invite-user-dialog';

export default function InvitationsPage() {
  const { t } = useTranslation();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('invitations.title')}</h1>
          <p className="text-gray-500">{t('invitations.description')}</p>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)}>
          <Plus className="me-2 h-4 w-4" />
          {t('invitations.inviteUser')}
        </Button>
      </div>

      <InvitationsTable />
      
      <InviteUserDialog 
        open={inviteDialogOpen} 
        onOpenChange={setInviteDialogOpen}
      />
    </div>
  );
}