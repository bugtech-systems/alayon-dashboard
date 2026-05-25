// components/redirect-handler.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { markRedirectShown } from '@/lib/actions/order-actions';

interface RedirectHandlerProps {
  deliveryId: string;
}

export function RedirectHandler({ deliveryId }: RedirectHandlerProps) {
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      
      // Mark redirect as shown via Server Action
      markRedirectShown().then(() => {
        // Redirect to order page
        router.push(`/your-order?id=${deliveryId}`);
      }).catch((error) => {
        console.error('Failed to mark redirect:', error);
        // Still redirect even if marking fails
        router.push(`/your-order?id=${deliveryId}`);
      });
    }
  }, [deliveryId, router]);

  // This component doesn't render anything
  return null;
}