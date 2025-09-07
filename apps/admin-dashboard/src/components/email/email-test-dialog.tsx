'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  emailConfigAPI,
  EmailServiceConfig,
  getProviderDisplayName,
} from '@/lib/api/email-config';
import { CheckCircle, XCircle, Send, Loader2 } from 'lucide-react';

interface EmailTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: EmailServiceConfig;
  organizationId: string;
}

export function EmailTestDialog({
  open,
  onOpenChange,
  config,
  organizationId,
}: EmailTestDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleTest = async () => {
    if (!testEmail) {
      toast({
        title: 'Error',
        description: 'Please enter a test email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const result = await emailConfigAPI.test(
        organizationId,
        config.provider,
        testEmail
      );
      
      setTestResult(result);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Test email sent successfully! Check your inbox.',
        });
      } else {
        toast({
          title: 'Test Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send test email';
      setTestResult({
        success: false,
        message: errorMessage,
      });
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTestEmail('');
    setTestResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Test {getProviderDisplayName(config.provider)}</DialogTitle>
          <DialogDescription>
            Send a test email to verify your configuration is working correctly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testEmail">Test Email Address</Label>
            <Input
              id="testEmail"
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500">
              Enter the email address where you want to receive the test message
            </p>
          </div>

          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Configuration Details:</p>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Provider:</span>{' '}
                {getProviderDisplayName(config.provider)}
              </p>
              <p>
                <span className="font-medium">From:</span>{' '}
                {config.config.fromEmail || 'Not configured'}
              </p>
              <p>
                <span className="font-medium">Status:</span>{' '}
                {config.enabled ? 'Enabled' : 'Disabled'}
              </p>
              {config.lastTestAt && (
                <p>
                  <span className="font-medium">Last Test:</span>{' '}
                  {new Date(config.lastTestAt).toLocaleString()}
                  {' - '}
                  {config.lastTestSuccess ? 'Passed' : 'Failed'}
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Close
          </Button>
          <Button onClick={handleTest} disabled={isLoading || !testEmail}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Test Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}