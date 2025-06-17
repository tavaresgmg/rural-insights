import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExportService, type ExportData } from '../services/export.service';

interface ExportButtonsProps {
  analysisData?: any;
  scoreData?: any;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ 
  analysisData, 
  scoreData 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<'whatsapp' | 'pdf' | null>(null);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  const exportData: ExportData = {
    analysis: analysisData,
    scoreData: scoreData,
    timestamp: new Date().toISOString()
  };

  const handleWhatsAppExport = async () => {
    if (!analysisData) {
      alert('Dados de análise não disponíveis para exportação');
      return;
    }

    setIsLoading('whatsapp');
    
    try {
      const whatsappText = ExportService.generateWhatsAppText(exportData);
      
      // Copia para clipboard primeiro
      const copied = await ExportService.copyToClipboard(whatsappText);
      
      if (copied) {
        setShowSuccess('Texto copiado! Abrindo WhatsApp...');
        
        // Aguarda um pouco para mostrar mensagem de sucesso
        setTimeout(() => {
          ExportService.openWhatsApp(whatsappText);
          setShowSuccess(null);
        }, 1500);
      } else {
        // Se não conseguir copiar, só abre o WhatsApp
        ExportService.openWhatsApp(whatsappText);
        setShowSuccess('WhatsApp aberto com relatório!');
        setTimeout(() => setShowSuccess(null), 2000);
      }
    } catch (error) {
      console.error('Erro no export WhatsApp:', error);
      alert('Erro ao exportar para WhatsApp. Tente novamente.');
    } finally {
      setIsLoading(null);
    }
  };

  const handlePDFExport = async () => {
    if (!analysisData) {
      alert('Dados de análise não disponíveis para exportação');
      return;
    }

    setIsLoading('pdf');
    
    try {
      await ExportService.generatePDF(exportData);
      setShowSuccess('PDF gerado e baixado!');
      setTimeout(() => setShowSuccess(null), 2000);
    } catch (error) {
      console.error('Erro no export PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsLoading(null);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Se não há dados, não mostra os botões
  if (!analysisData) {
    return null;
  }

  return (
    <>
      {/* Overlay de sucesso */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-4 right-4 bg-verde-safra text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center space-x-2"
          >
            <span>✅</span>
            <span className="font-medium">{showSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botões flutuantes */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="flex flex-col items-end space-y-3">
          
          {/* Botões de ação */}
          <AnimatePresence>
            {isOpen && (
              <>
                {/* WhatsApp Button */}
                <motion.button
                  initial={{ opacity: 0, scale: 0, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0, y: 20 }}
                  transition={{ delay: 0.1 }}
                  onClick={handleWhatsAppExport}
                  disabled={isLoading === 'whatsapp'}
                  className="group bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 min-w-[60px] justify-center"
                  title="Exportar para WhatsApp"
                >
                  {isLoading === 'whatsapp' ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span className="text-2xl">📱</span>
                      <span className="hidden group-hover:block whitespace-nowrap font-medium">
                        WhatsApp
                      </span>
                    </>
                  )}
                </motion.button>

                {/* PDF Button */}
                <motion.button
                  initial={{ opacity: 0, scale: 0, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0, y: 20 }}
                  transition={{ delay: 0.2 }}
                  onClick={handlePDFExport}
                  disabled={isLoading === 'pdf'}
                  className="group bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 min-w-[60px] justify-center"
                  title="Exportar como PDF"
                >
                  {isLoading === 'pdf' ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span className="text-2xl">📄</span>
                      <span className="hidden group-hover:block whitespace-nowrap font-medium">
                        PDF
                      </span>
                    </>
                  )}
                </motion.button>

                {/* Separator */}
                <div className="w-12 h-px bg-gray-300 mx-auto"></div>
              </>
            )}
          </AnimatePresence>

          {/* Main toggle button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMenu}
            className={`relative p-4 rounded-full shadow-lg transition-all duration-300 text-white ${
              isOpen 
                ? 'bg-gray-500 hover:bg-gray-600' 
                : 'bg-gradient-to-r from-verde-safra to-dourado-milho hover:shadow-xl'
            }`}
            title={isOpen ? 'Fechar menu' : 'Exportar relatório'}
          >
            <motion.div
              animate={{ rotate: isOpen ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              )}
            </motion.div>

            {/* Indicador de badge */}
            {!isOpen && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-dourado-milho text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
              >
                2
              </motion.div>
            )}
          </motion.button>
        </div>

        {/* Tooltip text */}
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2 }}
            className="absolute top-1/2 right-full mr-3 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap pointer-events-none"
          >
            <span>Compartilhar relatório</span>
            <div className="absolute top-1/2 left-full transform -translate-y-1/2 w-0 h-0 border-l-4 border-r-0 border-t-4 border-b-4 border-l-gray-800 border-t-transparent border-b-transparent"></div>
          </motion.div>
        )}
      </div>
    </>
  );
};

// Hook personalizado para usar com score data
export const useExportData = () => {
  const [scoreData, setScoreData] = useState(null);

  const fetchScoreData = async (analysisData: any) => {
    try {
      const response = await fetch('http://localhost:8000/api/insights/financial-health-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      if (response.ok) {
        const result = await response.json();
        setScoreData(result.score_data);
        return result.score_data;
      }
    } catch (error) {
      console.error('Erro ao buscar score data:', error);
    }
    return null;
  };

  return { scoreData, fetchScoreData };
};