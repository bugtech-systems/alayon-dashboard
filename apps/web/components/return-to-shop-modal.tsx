// components/return-to-shop-modal.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package2, Minimize2, BellOff, AlertCircle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  dismissOrderRedirectTemporary, 
  dismissOrderRedirectPermanent,
  removeMedusaDeliveryCookie 
} from '@/lib/actions/order-actions';

interface ReturnToShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onCleanupComplete?: () => void;
}

export function ReturnToShopModal({ isOpen, onClose, orderId, onCleanupComplete }: ReturnToShopModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleConfirmReturn = () => {
    setIsLoading(true);
    onClose();
    router.push('/');
  };

  const handleDismissToday = async () => {
    setIsLoading(true);
    setSelectedOption('today');
    await dismissOrderRedirectTemporary();
    setIsLoading(false);
    onClose();
    router.push('/');
  };

  const handleDismissPermanent = async () => {
    setIsLoading(true);
    setSelectedOption('permanent');
    await dismissOrderRedirectPermanent();
    setIsLoading(false);
    onClose();
    router.push('/');
  };

    setIsLoading(true);
    setSelectedOption('cleanup');
    setIsLoading(false);
    onClose();
    if (onCleanupComplete) onCleanupComplete();
    router.push('/');
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Minimize2 className="h-5 w-5 text-primary" />
            Minimize Order Tracking?
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Your order is still in progress. You can continue tracking it later from your orders page.
          </DialogDescription>
        </DialogHeader>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 my-2">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="bg-primary/10 rounded-full p-2">
                <Package2 className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Order #{orderId.slice(-8)}</p>
              <p className="text-xs text-muted-foreground">Status: In Progress</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                router.push(`/your-order?id=${orderId}`);
              }}
              className="text-xs"
            >
              View Details
            </Button>
          </div>
        </div>

        <Separator />

        {/* Options */}
        <div className="space-y-3 py-2">
          <p className="text-sm font-medium text-foreground">What would you like to do?</p>
          
          <Button
            variant="outline"
            onClick={handleDismissToday}
            disabled={isLoading}
            className="w-full justify-start gap-3 h-auto py-3 px-4"
          >
            <BellOff className="h-4 w-4 text-blue-500" />
            <div className="text-left flex-1">
              <p className="text-sm font-medium">Remind me later today</p>
              <p className="text-xs text-muted-foreground">You won't see this popup again for the rest of the day</p>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={handleDismissPermanent}
            disabled={isLoading}
            className="w-full justify-start gap-3 h-auto py-3 px-4"
          >
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <div className="text-left flex-1">
              <p className="text-sm font-medium">Don't show again</p>
              <p className="text-xs text-muted-foreground">Permanently disable order tracking popups</p>
            </div>
          </Button>

          <Button
            variant="outline"
            disabled={isLoading}
            className="w-full justify-start gap-3 h-auto py-3 px-4 border-red-200 hover:border-red-300"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
            <div className="text-left flex-1">
              <p className="text-sm font-medium">Complete order & don't show again</p>
              <p className="text-xs text-muted-foreground">Remove order cookie and disable future popups</p>
            </div>
          </Button>
        </div>

        <Separator />

        {/* Hidden option to remove cookie only */}
        <div className="text-center">
          <button
            onClick={handleRemoveCookieOnly}
            disabled={isLoading}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear order cookie only
          </button>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="sm:flex-1"
          >
            Cancel, Stay Here
          </Button>
          <Button
            onClick={handleConfirmReturn}
            disabled={isLoading}
            className="sm:flex-1"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </div>
            ) : (
              'Continue to Store'
            )}
          </Button>
        </DialogFooter>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
            <div className="bg-white rounded-lg p-4 shadow-lg flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm">Processing...</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}