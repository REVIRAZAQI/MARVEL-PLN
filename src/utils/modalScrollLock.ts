import { useEffect } from 'react';

/**
 * Global reference counter for active modals.
 * Prevents nested modals or rapid open/close cycles from permanently locking the body scroll.
 */
let activeModalCount = 0;
let originalOverflow: string = '';
let originalPaddingRight: string = '';

/**
 * Unconditionally restores scroll on body and documentElement.
 * Safely strips any residual 'overflow: hidden' or padding added by modals.
 */
export const forceUnlockScroll = () => {
  activeModalCount = 0;
  originalOverflow = '';
  originalPaddingRight = '';

  if (typeof document !== 'undefined') {
    // 1. Clear body overflow & padding
    if (document.body) {
      document.body.style.overflow = '';
      document.body.style.removeProperty('overflow');
      document.body.style.paddingRight = '';
      document.body.style.removeProperty('padding-right');
      document.body.classList.remove('modal-open');
    }

    // 2. Clear html (documentElement) overflow
    if (document.documentElement) {
      document.documentElement.style.overflow = '';
      document.documentElement.style.removeProperty('overflow');
      document.documentElement.classList.remove('modal-open');
    }
  }
};

/**
 * Checks if any modal backdrop or fixed overlay is currently visible in the DOM.
 * If none exists, guarantees body scrolling is enabled.
 */
export const sanitizeScrollLock = () => {
  if (typeof document === 'undefined') return;

  const hasVisibleModal = document.querySelector(
    '.fixed.inset-0.z-50, [role="dialog"], .modal-backdrop-animate, .modal-backdrop-print'
  );

  if (!hasVisibleModal) {
    forceUnlockScroll();
  }
};

/**
 * Custom React hook that locks background scrolling when a modal or pop-up is active,
 * ensuring the modal remains dead center on the screen without jumping or scrolling.
 * When closed, cleanly and reliably restores scroll for all browsers & devices.
 */
export const useModalScrollLock = (isOpen?: boolean) => {
  useEffect(() => {
    if (!isOpen) {
      // If isOpen is false or changed to false, check if all modals are gone
      if (activeModalCount <= 0) {
        forceUnlockScroll();
      }
      return;
    }

    // Only apply lock on the FIRST modal opening
    if (activeModalCount === 0) {
      const currentOverflow = document.body.style.overflow;
      if (currentOverflow && currentOverflow !== 'hidden') {
        originalOverflow = currentOverflow;
      } else {
        originalOverflow = '';
      }

      originalPaddingRight = document.body.style.paddingRight || '';
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.body.classList.add('modal-open');
    }

    activeModalCount++;

    return () => {
      activeModalCount = Math.max(0, activeModalCount - 1);

      if (activeModalCount === 0) {
        // Last modal closing: restore immediately
        if (originalOverflow && originalOverflow !== 'hidden') {
          document.body.style.overflow = originalOverflow;
        } else {
          document.body.style.overflow = '';
          document.body.style.removeProperty('overflow');
        }

        if (originalPaddingRight) {
          document.body.style.paddingRight = originalPaddingRight;
        } else {
          document.body.style.paddingRight = '';
          document.body.style.removeProperty('padding-right');
        }

        document.body.classList.remove('modal-open');
        document.documentElement.style.overflow = '';
        document.documentElement.style.removeProperty('overflow');

        originalOverflow = '';
        originalPaddingRight = '';
      }

      // Defer a safety check on next tick to ensure no rogue styles remain
      setTimeout(() => {
        sanitizeScrollLock();
      }, 50);
    };
  }, [isOpen]);
};

// Global listener: safety fallback on Escape or tab visibility change
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      setTimeout(sanitizeScrollLock, 60);
    }
  });

  window.addEventListener('popstate', () => {
    setTimeout(forceUnlockScroll, 50);
  });
}
