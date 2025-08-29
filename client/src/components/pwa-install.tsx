import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  platforms: Array<string>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowInstallPrompt(false);
    } else {
      console.log('User dismissed the install prompt');
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Hide for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed, dismissed this session, or no prompt available
  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null;
  }

  // Don't show if dismissed this session
  if (sessionStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-20 left-4 right-4 z-50 bg-card border border-border rounded-xl p-4 shadow-lg elevation-3"
      >
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="material-icons text-white">get_app</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Install GreenPay</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Get the full app experience with faster loading and offline access
            </p>
            <div className="flex space-x-2">
              <Button
                onClick={handleInstallClick}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-xs"
                data-testid="button-install-app"
              >
                Install App
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-xs"
                data-testid="button-dismiss-install"
              >
                Not now
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground p-1 rounded"
            data-testid="button-close-install"
          >
            <span className="material-icons text-sm">close</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}