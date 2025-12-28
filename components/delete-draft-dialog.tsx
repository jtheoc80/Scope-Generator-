'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/hooks/useLanguage';

interface DeleteDraftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: number;
  clientName: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function DeleteDraftDialog({
  isOpen,
  onClose,
  proposalId,
  clientName,
  onSuccess,
  onError,
}: DeleteDraftDialogProps) {
  const { t } = useLanguage();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onSuccess();
        onClose();
      } else if (response.status === 401) {
        onError(t.proposals.deleteDraft.signInRequired);
      } else if (response.status === 403) {
        onError(data.message || t.proposals.deleteDraft.onlyDraftsDeletable);
      } else {
        onError(data.message || t.proposals.deleteDraft.genericError);
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      onError(t.proposals.deleteDraft.networkError);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete draft?</AlertDialogTitle>
          <AlertDialogDescription>
            This draft proposal for <span className="font-medium">{clientName}</span> will be permanently removed. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t.common.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              t.common.delete
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
