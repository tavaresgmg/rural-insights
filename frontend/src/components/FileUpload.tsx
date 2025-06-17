import React, { useState, useRef, type DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    setError('');
    
    // Validação
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Por favor, selecione um arquivo CSV');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo: 10MB');
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className={`
            relative overflow-hidden rounded-2xl transition-all duration-300
            ${isDragging ? 'scale-105' : 'scale-100'}
            ${isLoading ? 'pointer-events-none opacity-75' : 'cursor-pointer'}
          `}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-verde-safra via-dourado-milho to-terra-fertil opacity-10" />
          
          {/* Border Animation */}
          <div
            className={`
              absolute inset-0 rounded-2xl border-4 transition-all duration-300
              ${isDragging 
                ? 'border-verde-safra animate-pulse-slow' 
                : 'border-dashed border-gray-300 hover:border-verde-safra'
              }
            `}
          />

          {/* Content */}
          <div className="relative z-10 p-12 md:p-16 text-center">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="w-16 h-16 mx-auto">
                    <svg className="animate-spin text-verde-safra" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-gray-700">Processando seu arquivo...</p>
                </motion.div>
              ) : selectedFile ? (
                <motion.div
                  key="selected"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-4"
                >
                  <div className="w-16 h-16 mx-auto text-verde-safra">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-700">Arquivo selecionado:</p>
                    <p className="text-sm text-gray-500 mt-1">{selectedFile.name}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Upload Icon */}
                  <div className="w-20 h-20 mx-auto">
                    <svg
                      className="text-terra-fertil"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>

                  {/* Text */}
                  <div className="space-y-2">
                    <p className="text-xl md:text-2xl font-semibold text-gray-800">
                      {isDragging ? 'Solte o arquivo aqui' : 'Arraste seu arquivo CSV aqui'}
                    </p>
                    <p className="text-base md:text-lg text-gray-600">
                      ou <span className="text-verde-safra font-medium">clique para selecionar</span>
                    </p>
                  </div>

                  {/* File Info */}
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                        <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                      </svg>
                      <span>CSV</span>
                    </div>
                    <span>•</span>
                    <span>Máximo 10MB</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
        />
      </motion.div>
    </div>
  );
};