import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFSafeExportService, type EnhancedExportData, type WhatsAppOptions } from '../services/pdf-safe-export.service';
import { EnhancedExportService } from '../services/enhanced-export.service';

interface EnhancedExportButtonsProps {
  analysisData?: any;
  scoreData?: any;
  customization?: {
    logo?: string;
    companyName?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

type ExportAction = 'whatsapp-full' | 'whatsapp-summary' | 'whatsapp-minimal' | 'pdf-standard' | 'pdf-enhanced' | 'share-link' | null;

interface ExportOption {
  id: ExportAction;
  label: string;
  sublabel?: string;
  icon: string;
  color: string;
  hoverColor: string;
}

export const EnhancedExportButtons: React.FC<EnhancedExportButtonsProps> = ({ 
  analysisData, 
  scoreData,
  customization
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isLoading, setIsLoading] = useState<ExportAction>(null);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  const exportData: EnhancedExportData = {
    analysis: analysisData,
    scoreData: scoreData,
    timestamp: new Date().toISOString(),
    customization
  };

  const exportOptions: ExportOption[] = [
    {
      id: 'pdf-enhanced',
      label: 'PDF Completo',
      sublabel: 'Com gráficos',
      icon: '📊',
      color: 'bg-gradient-to-r from-red-500 to-red-600',
      hoverColor: 'hover:from-red-600 hover:to-red-700'
    },
    {
      id: 'pdf-standard',
      label: 'PDF Simples',
      sublabel: 'Sem gráficos',
      icon: '📄',
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600'
    },
    {
      id: 'whatsapp-full',
      label: 'WhatsApp Completo',
      sublabel: 'Relatório detalhado',
      icon: '💬',
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700'
    },
    {
      id: 'whatsapp-summary',
      label: 'WhatsApp Resumo',
      sublabel: 'Principais pontos',
      icon: '📱',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      id: 'whatsapp-minimal',
      label: 'WhatsApp Express',
      sublabel: 'Ultra resumido',
      icon: '⚡',
      color: 'bg-green-400',
      hoverColor: 'hover:bg-green-500'
    },
    {
      id: 'share-link',
      label: 'Gerar Link',
      sublabel: 'Compartilhável',
      icon: '🔗',
      color: 'bg-gradient-to-r from-blue-500 to-purple-600',
      hoverColor: 'hover:from-blue-600 hover:to-purple-700'
    }
  ];

  const handleAction = async (action: ExportAction) => {
    if (!analysisData || !action) return;

    setIsLoading(action);

    try {
      switch (action) {
        case 'pdf-enhanced':
          await PDFSafeExportService.generateEnhancedPDF(exportData);
          showSuccessMessage('PDF completo gerado com sucesso!');
          break;

        case 'pdf-standard':
          // Usar o serviço antigo para PDF simples
          const { ExportService } = await import('../services/export.service');
          await ExportService.generatePDF(exportData);
          showSuccessMessage('PDF simples gerado!');
          break;

        case 'whatsapp-full':
        case 'whatsapp-summary':
        case 'whatsapp-minimal':
          const format = action.replace('whatsapp-', '') as 'full' | 'summary' | 'minimal';
          await handleWhatsAppExport(format);
          break;

        case 'share-link':
          const link = await PDFSafeExportService.generateShareableLink(exportData);
          await PDFSafeExportService.copyToClipboard(link);
          showSuccessMessage('Link copiado para a área de transferência!');
          break;
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
      alert('Erro ao processar exportação. Tente novamente.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleWhatsAppExport = async (format: 'full' | 'summary' | 'minimal') => {
    const options: WhatsAppOptions = {
      format,
      phone: phoneNumber || undefined,
      includeAIInsights: true
    };

    const whatsappText = PDFSafeExportService.generateWhatsAppText(exportData, options);
    
    // Copia para clipboard
    const copied = await PDFSafeExportService.copyToClipboard(whatsappText);
    
    if (copied) {
      showSuccessMessage('Texto copiado! Abrindo WhatsApp...');
      
      setTimeout(() => {
        PDFSafeExportService.openWhatsApp(whatsappText, phoneNumber);
      }, 1500);
    } else {
      PDFSafeExportService.openWhatsApp(whatsappText, phoneNumber);
      showSuccessMessage('WhatsApp aberto!');
    }
  };

  const showSuccessMessage = (message: string) => {
    setShowSuccess(message);
    setTimeout(() => setShowSuccess(null), 3000);
  };

  const toggleMenu = () => {
    if (isOpen) {
      setShowOptions(false);
      setTimeout(() => setIsOpen(false), 300);
    } else {
      setIsOpen(true);
      setTimeout(() => setShowOptions(true), 100);
    }
  };

  // Se não há dados, não mostra os botões
  if (!analysisData) return null;

  return (
    <>
      {/* Mensagem de sucesso */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 right-4 bg-gradient-to-r from-verde-safra to-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center space-x-3"
          >
            <motion.span
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-2xl"
            >
              ✨
            </motion.span>
            <span className="font-medium">{showSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input de telefone (opcional) */}
      <AnimatePresence>
        {showPhoneInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center"
            onClick={() => setShowPhoneInput(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white p-6 rounded-2xl shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">Número do WhatsApp (opcional)</h3>
              <input
                type="tel"
                placeholder="5511999999999"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg mb-4"
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowPhoneInput(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowPhoneInput(false);
                    // Continuar com a ação pendente
                  }}
                  className="flex-1 px-4 py-2 bg-verde-safra text-white rounded-lg hover:bg-green-600"
                >
                  Continuar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Container principal */}
      <div className="fixed bottom-6 right-6 z-40">
        {/* Opções expandidas */}
        <AnimatePresence>
          {isOpen && showOptions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-20 right-0 w-64 bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Escolha o formato:</h3>
                
                {/* Opções de exportação */}
                <div className="space-y-2">
                  {exportOptions.map((option, index) => (
                    <motion.button
                      key={option.id}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleAction(option.id)}
                      disabled={isLoading === option.id}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isLoading === option.id 
                          ? 'opacity-50 cursor-not-allowed' 
                          : `${option.color} ${option.hoverColor} text-white hover:shadow-lg hover:scale-105`
                      }`}
                    >
                      {isLoading === option.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <span className="text-xl">{option.icon}</span>
                      )}
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{option.label}</div>
                        {option.sublabel && (
                          <div className="text-xs opacity-80">{option.sublabel}</div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Configurações adicionais */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowPhoneInput(true)}
                    className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span>📱 Adicionar número WhatsApp</span>
                    <span className="text-xs">{phoneNumber || 'Opcional'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão principal */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleMenu}
          className={`relative p-5 rounded-full shadow-2xl transition-all duration-300 ${
            isOpen 
              ? 'bg-gray-500 hover:bg-gray-600' 
              : 'bg-gradient-to-r from-verde-safra via-dourado-milho to-terra-marrom hover:shadow-3xl'
          }`}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.3, type: "spring" }}
            className="relative"
          >
            {isOpen ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center"
                >
                  6
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Efeito de pulso */}
          {!isOpen && (
            <motion.div
              className="absolute inset-0 rounded-full bg-verde-safra"
              animate={{
                scale: [1, 1.2, 1.2, 1],
                opacity: [0.3, 0.1, 0, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
            />
          )}
        </motion.button>

        {/* Tooltip flutuante */}
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 3 }}
            className="absolute bottom-5 right-full mr-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl whitespace-nowrap pointer-events-none"
          >
            <span className="font-medium">✨ Exporte seu relatório</span>
            <div className="text-xs opacity-80 mt-1">6 formatos disponíveis</div>
            <div className="absolute top-1/2 left-full transform -translate-y-1/2 w-0 h-0 border-l-8 border-r-0 border-t-8 border-b-8 border-l-gray-800 border-t-transparent border-b-transparent"></div>
          </motion.div>
        )}
      </div>
    </>
  );
};

// Hook para configurações personalizadas
export const useExportCustomization = () => {
  const [customization, setCustomization] = useState({
    companyName: 'Rural Insights',
    primaryColor: '#10B981',
    secondaryColor: '#F59E0B'
  });

  const updateCustomization = (updates: Partial<typeof customization>) => {
    setCustomization(prev => ({ ...prev, ...updates }));
  };

  return { customization, updateCustomization };
};