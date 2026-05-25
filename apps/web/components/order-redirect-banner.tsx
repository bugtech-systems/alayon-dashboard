// components/order-redirect-banner.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Package, BellOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  dismissOrderRedirectTemporary, 
  dismissOrderRedirectPermanent 
} from '@/lib/actions/order-actions';

interface OrderRedirectBannerProps {
  deliveryId: string;
  onDismiss?: () => void;
}

export function OrderRedirectBanner({ deliveryId, onDismiss }: OrderRedirectBannerProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  // Auto-hide after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onDismiss) onDismiss();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleViewOrder = () => {
    router.push(`/your-order?id=${deliveryId}`);
  };

  // Remind later - DOES NOT remove delivery cookie
  const handleDismissTemp = async () => {
    setIsDismissing(true);
    await dismissOrderRedirectTemporary();
    setIsVisible(false);
    setIsDismissing(false);
    if (onDismiss) onDismiss();
  };

  // Don't show again - REMOVES delivery cookie
  const handleDismissPermanent = async () => {
    setIsDismissing(true);
    await dismissOrderRedirectPermanent();
    setIsVisible(false);
    setIsDismissing(false);
    if (onDismiss) onDismiss();
    router.refresh(); // Refresh to update the UI
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 max-w-sm transition-all duration-300 transform",
        isHovered ? "scale-105" : "scale-100"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg shadow-2xl overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative p-4">
          <button
            onClick={() => {
              setIsVisible(false);
              if (onDismiss) onDismiss();
            }}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Close banner"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="bg-white/20 rounded-full p-2">
                <Package className="h-5 w-5" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-1">Active Order Detected!</h4>
              <p className="text-xs opacity-90 mb-3">
                You have an existing order. Track its status in real-time.
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={handleViewOrder}
                  className="bg-white text-primary hover:bg-gray-100 text-xs h-7 px-3"
                  disabled={isDismissing}
                >
                  Track Order
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismissTemp}
                  className="text-white hover:bg-white/20 text-xs h-7 px-3"
                  disabled={isDismissing}
                >
                  <BellOff className="h-3 w-3 mr-1" />
                  Remind Later
                </Button>
              </div>
            </div>
          </div>

          {/* Permanent dismiss link - REMOVES COOKIE */}
          <div className="mt-2 text-right">
            <button
              onClick={handleDismissPermanent}
              className="text-xs text-white/70 hover:text-white transition-colors"
              disabled={isDismissing}
            >
              <AlertCircle className="h-3 w-3 inline mr-1" />
              Don't show again (clears order)
            </button>
          </div>
        </div>

        {/* Progress bar for auto-hide */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30">
          <div className="h-full bg-white animate-shrink-width" />
        </div>
      </div>

      <style jsx>{`
        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-shrink-width {
          animation: shrinkWidth 10s linear forwards;
        }
      `}</style>
    </div>
  );
}