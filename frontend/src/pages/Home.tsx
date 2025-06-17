import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileUpload } from '../components/FileUpload';
import { uploadCSV } from '../services/api';

export const Home: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setError('');

    try {
      const response = await uploadCSV(file);
      
      if (response.success && response.analysis) {
        // Armazena análise no sessionStorage
        sessionStorage.setItem('analysisData', JSON.stringify(response.analysis));
        sessionStorage.setItem('processingTime', response.processing_time.toString());
        
        // Navega para dashboard
        navigate('/dashboard');
      } else {
        setError('Erro ao processar arquivo. Tente novamente.');
      }
    } catch (err: any) {
      console.error('Erro no upload:', err);
      setError(err.response?.data?.detail || 'Erro ao enviar arquivo');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-bege-palha via-white to-verde-safra/10">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-6 px-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Logo Icon */}
            <div className="w-10 h-10 bg-verde-safra rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3.5 18.5L9.5 12.5L13.5 16.5L22 6.92L20.59 5.5L13.5 13.5L9.5 9.5L2 17L3.5 18.5Z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Rural <span className="text-verde-safra">Insights</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-5 h-5 text-dourado-milho" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
            <span>Análise com IA</span>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12 max-w-3xl"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Transforme seus dados em
            <span className="text-verde-safra block mt-2">decisões lucrativas</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            Análise financeira inteligente para o produtor rural moderno.
            Descubra oportunidades de economia e otimize seus gastos com insights personalizados.
          </p>
        </motion.div>

        {/* Upload Area */}
        <FileUpload onFileSelect={handleFileSelect} isLoading={isUploading} />

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md"
          >
            <p className="text-red-700 text-center">{error}</p>
          </motion.div>
        )}

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl"
        >
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-verde-safra/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-verde-safra" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 17H7v-7h2m4 7h-2V7h2m4 10h-2v-4h2m4 4h-2V3h2" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg text-gray-800 mb-2">Análise Detalhada</h3>
            <p className="text-gray-600 text-sm">
              Identifique seus maiores gastos e tendências de consumo
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-dourado-milho/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-dourado-milho" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg text-gray-800 mb-2">100% Seguro</h3>
            <p className="text-gray-600 text-sm">
              Seus dados são processados com total privacidade
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-terra-fertil/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-terra-fertil" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg text-gray-800 mb-2">Insights Acionáveis</h3>
            <p className="text-gray-600 text-sm">
              Receba sugestões práticas para economizar
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500">
        <p>🌾 Feito com carinho para o produtor rural brasileiro</p>
      </footer>
    </div>
  );
};