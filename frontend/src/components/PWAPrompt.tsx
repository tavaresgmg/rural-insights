import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOffline } from '../hooks/useOffline';

export const PWAPrompt: React.FC = () => {
  const {
    isOnline,
    isInstalled,
    updateAvailable,
    canInstall,
    networkStatus,
    installPWA,
    applyUpdate,
    forceSync,
    lastSync
  } = useOffline();

  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Auto-show install prompt após alguns segundos
  React.useEffect(() => {
    if (canInstall && !dismissed) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 5000); // 5 segundos

      return () => clearTimeout(timer);
    }
  }, [canInstall, dismissed]);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const success = await installPWA();
      if (success) {
        setShowInstallPrompt(false);
      }
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setDismissed(true);
  };

  const handleUpdate = () => {
    applyUpdate();
  };

  const handleSync = async () => {
    await forceSync();
  };

  return (
    <>
      {/* Status Bar - sempre visível quando offline */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white text-center py-2 text-sm font-medium"
          >
            <div className="flex items-center justify-center space-x-2">
              <span>📡</span>
              <span>Modo offline - Usando dados em cache</span>
              {lastSync && (
                <span className="text-xs opacity-75">
                  • Última sincronização: {lastSync.toLocaleTimeString('pt-BR')}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Available Bar */}
      <AnimatePresence>
        {updateAvailable && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white text-center py-2 text-sm font-medium"
          >
            <div className="flex items-center justify-center space-x-4">
              <span>🔄 Nova versão disponível!</span>
              <button
                onClick={handleUpdate}
                className="bg-white text-blue-600 px-3 py-1 rounded text-xs font-semibold hover:bg-gray-100 transition-colors"
              >
                Atualizar Agora
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install Prompt */}
      <AnimatePresence>
        {showInstallPrompt && canInstall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Instalar Rural Insights
                </h3>
                <p className="text-gray-600 mb-6">
                  Instale o app para acesso rápido e funcionamento offline. 
                  Suas análises ficam sempre disponíveis!
                </p>

                <div className="bg-verde-safra/10 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-verde-safra mb-2">✨ Vantagens:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• 📡 Funciona offline</li>
                    <li>• ⚡ Carregamento mais rápido</li>
                    <li>• 🏠 Ícone na tela inicial</li>
                    <li>• 💾 Dados salvos localmente</li>
                  </ul>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Agora Não
                  </button>
                  <button
                    onClick={handleInstall}
                    disabled={installing}
                    className="flex-1 py-3 px-4 bg-verde-safra text-white rounded-lg font-medium hover:bg-verde-safra/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {installing ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Instalando...
                      </div>
                    ) : (
                      'Instalar App'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating PWA Controls (apenas quando necessário) */}
      {(canInstall || !isOnline) && (
        <div className="fixed bottom-20 left-4 z-40">
          <div className="flex flex-col space-y-2">
            {/* Install Button */}
            {canInstall && !showInstallPrompt && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowInstallPrompt(true)}
                className="bg-verde-safra text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                title="Instalar App"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </motion.button>
            )}

            {/* Sync Button (quando offline) */}
            {!isOnline && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSync}
                className="bg-yellow-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                title="Tentar Sincronizar"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </motion.button>
            )}
          </div>
        </div>
      )}

      {/* Connection Status Indicator */}
      <div className="fixed top-4 right-4 z-40">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
            isOnline 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span>{networkStatus === 'online' ? 'Online' : 'Offline'}</span>
          {isInstalled && (
            <span className="ml-1">📱</span>
          )}
        </motion.div>
      </div>
    </>
  );
};

// Componente para mostrar métricas de cache (debug)
export const CacheMetrics: React.FC = () => {
  const { getCacheStatus } = useOffline();
  const [cacheInfo, setCacheInfo] = useState<any[]>([]);
  const [show, setShow] = useState(false);

  const loadCacheInfo = async () => {
    const info = await getCacheStatus();
    setCacheInfo(info);
    setShow(true);
  };

  if (!show) {
    return (
      <button
        onClick={loadCacheInfo}
        className="fixed bottom-4 left-4 text-xs bg-gray-600 text-white px-2 py-1 rounded opacity-50 hover:opacity-100"
      >
        Cache Info
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border text-xs max-w-xs"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">Cache Status</h4>
        <button
          onClick={() => setShow(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      
      {cacheInfo.map((cache, index) => (
        <div key={index} className="mb-1">
          <span className="text-gray-600">{cache.name}:</span>
          <span className="ml-1 font-medium">{cache.entries} items</span>
        </div>
      ))}
      
      <button
        onClick={loadCacheInfo}
        className="mt-2 text-blue-600 hover:text-blue-800"
      >
        🔄 Refresh
      </button>
    </motion.div>
  );
};