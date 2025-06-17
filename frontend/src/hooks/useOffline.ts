import { useState, useEffect, useCallback } from 'react';

interface OfflineState {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  hasUpdate: boolean;
  lastSync: Date | null;
}

interface PWAPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const useOffline = () => {
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isInstallable: false,
    isInstalled: false,
    hasUpdate: false,
    lastSync: null
  });

  const [deferredPrompt, setDeferredPrompt] = useState<PWAPromptEvent | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Detecta mudanças de conectividade
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true, lastSync: new Date() }));
      console.log('🌐 Back online');
      
      // Sincroniza dados pendentes (se sync API disponível)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          if ('sync' in registration) {
            return (registration as any).sync.register('upload-csv');
          }
        }).catch(console.error);
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      console.log('📡 Gone offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Detecta se PWA já está instalada
  useEffect(() => {
    const checkIfInstalled = () => {
      // Verifica se está rodando como PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebApp = 'standalone' in window.navigator && window.navigator.standalone;
      
      setState(prev => ({ 
        ...prev, 
        isInstalled: !!(isStandalone || isInWebApp)
      }));
    };

    checkIfInstalled();

    // Monitora mudanças no display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, isInstalled: e.matches }));
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback para navegadores antigos
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Captura evento de instalação PWA
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as PWAPromptEvent);
      setState(prev => ({ ...prev, isInstallable: true }));
      console.log('📱 PWA install prompt captured');
    };

    const handleAppInstalled = () => {
      setState(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
      setDeferredPrompt(null);
      console.log('✅ PWA installed successfully');
      
      // Analytics ou notificação de sucesso
      showNotification('Rural Insights instalado!', 'Agora você pode acessar offline');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Registra Service Worker e detecta updates (desabilitado em dev)
  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ SW registered:', registration.scope);

          // Detecta updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                  setState(prev => ({ ...prev, hasUpdate: true }));
                  console.log('🔄 Update available');
                }
              });
            }
          });

          // Força update check periodicamente
          setInterval(() => {
            registration.update();
          }, 60000); // Check a cada minuto

        })
        .catch(error => {
          console.error('❌ SW registration failed:', error);
        });
    } else {
      console.log('🚧 SW disabled in development mode');
    }
  }, []);

  // Instala PWA
  const installPWA = useCallback(async () => {
    if (!deferredPrompt) {
      console.warn('Install prompt not available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      
      if (choice.outcome === 'accepted') {
        console.log('✅ User accepted PWA install');
        setDeferredPrompt(null);
        setState(prev => ({ ...prev, isInstallable: false }));
        return true;
      } else {
        console.log('❌ User dismissed PWA install');
        return false;
      }
    } catch (error) {
      console.error('Install error:', error);
      return false;
    }
  }, [deferredPrompt]);

  // Aplica update do Service Worker
  const applyUpdate = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });

      // Escuta confirmação e recarrega
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  // Força sincronização
  const forceSync = useCallback(async () => {
    if (!state.isOnline) {
      console.warn('Cannot sync while offline');
      return false;
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          await (registration as any).sync.register('force-sync');
          setState(prev => ({ ...prev, lastSync: new Date() }));
          return true;
        }
      }
    } catch (error) {
      console.error('Sync failed:', error);
      return false;
    }

    return false;
  }, [state.isOnline]);

  // Limpa cache
  const clearCache = useCallback(async () => {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name.startsWith('rural-insights-'))
          .map(name => caches.delete(name))
      );
      console.log('🗑️ Cache cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }, []);

  // Obtém status do cache
  const getCacheStatus = useCallback(async () => {
    try {
      const cacheNames = await caches.keys();
      const ruralCaches = cacheNames.filter(name => name.startsWith('rural-insights-'));
      
      const status = await Promise.all(
        ruralCaches.map(async name => {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          return { name, entries: keys.length };
        })
      );

      return status;
    } catch (error) {
      console.error('Failed to get cache status:', error);
      return [];
    }
  }, []);

  return {
    // Estado
    ...state,
    updateAvailable,

    // Ações
    installPWA,
    applyUpdate,
    forceSync,
    clearCache,
    getCacheStatus,

    // Utilitários
    isOfflineCapable: 'serviceWorker' in navigator,
    canInstall: state.isInstallable && !state.isInstalled,
    networkStatus: state.isOnline ? 'online' : 'offline'
  };
};

// Função utilitária para notificações
function showNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: 'rural-insights'
    });
  }
}

// Hook para armazenamento offline
export const useOfflineStorage = () => {
  const saveOfflineData = useCallback(async (key: string, data: any) => {
    try {
      if ('indexedDB' in window) {
        // Implementação com IndexedDB para dados grandes
        const request = indexedDB.open('RuralInsightsDB', 1);
        
        return new Promise((resolve, reject) => {
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['analyses'], 'readwrite');
            const store = transaction.objectStore('analyses');
            store.put({ id: key, data, timestamp: Date.now() });
            
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
          };
          
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('analyses')) {
              db.createObjectStore('analyses', { keyPath: 'id' });
            }
          };
        });
      } else {
        // Fallback para localStorage
        localStorage.setItem(`rural_insights_${key}`, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
        return true;
      }
    } catch (error) {
      console.error('Failed to save offline data:', error);
      return false;
    }
  }, []);

  const getOfflineData = useCallback(async (key: string) => {
    try {
      if ('indexedDB' in window) {
        const request = indexedDB.open('RuralInsightsDB', 1);
        
        return new Promise((resolve) => {
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['analyses'], 'readonly');
            const store = transaction.objectStore('analyses');
            const getRequest = store.get(key);
            
            getRequest.onsuccess = () => {
              resolve(getRequest.result?.data || null);
            };
            
            getRequest.onerror = () => resolve(null);
          };
          
          request.onerror = () => resolve(null);
        });
      } else {
        // Fallback para localStorage
        const stored = localStorage.getItem(`rural_insights_${key}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.data;
        }
        return null;
      }
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return null;
    }
  }, []);

  return { saveOfflineData, getOfflineData };
};