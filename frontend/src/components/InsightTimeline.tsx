import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Alert } from '../services/api';

interface InsightTimelineProps {
  alerts: Alert[];
}

export const InsightTimeline: React.FC<InsightTimelineProps> = ({ alerts }) => {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedIds(newExpanded);
  };

  // Ordena alertas por impacto financeiro (maiores primeiro)
  const sortedAlerts = [...alerts].sort((a, b) => {
    const impactoA = a.impacto_estimado || 0;
    const impactoB = b.impacto_estimado || 0;
    return impactoB - impactoA;
  });

  const getAlertIcon = (tipo: string) => {
    switch (tipo) {
      case 'urgent': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return '💡';
      default: return '📋';
    }
  };

  const getAlertColor = (tipo: string) => {
    switch (tipo) {
      case 'urgent': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getTextColor = (tipo: string) => {
    switch (tipo) {
      case 'urgent': return 'text-red-700';
      case 'warning': return 'text-yellow-700';
      case 'info': return 'text-blue-700';
      default: return 'text-gray-700';
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎉</div>
        <p className="text-gray-500">Nenhum alerta encontrado. Suas finanças estão em ordem!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedAlerts.map((alert, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`rounded-xl border-2 p-6 ${getAlertColor(alert.tipo)} transition-all duration-200 hover:shadow-md`}
        >
          <div className="flex items-start space-x-4">
            {/* Icon */}
            <div className="text-3xl flex-shrink-0">
              {getAlertIcon(alert.tipo)}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg mb-2 ${getTextColor(alert.tipo)}`}>
                    {alert.categoria}
                  </h3>
                  <p className="text-gray-700 mb-3 leading-relaxed">
                    {alert.mensagem}
                  </p>
                </div>

                {/* Valor do Impacto */}
                {alert.impacto_estimado && alert.impacto_estimado > 0 && (
                  <div className="text-right ml-4">
                    <div className="text-sm text-gray-500">Economia Potencial</div>
                    <div className="text-xl font-bold text-verde-safra">
                      R$ {alert.impacto_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                )}
              </div>

              {/* Ação Sugerida (expandível) */}
              {alert.acao_sugerida && (
                <div>
                  <button
                    onClick={() => toggleExpanded(index)}
                    className="flex items-center space-x-2 text-sm font-medium text-verde-safra hover:text-verde-safra/80 transition-colors"
                  >
                    <span>Como resolver</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        expandedIds.has(index) ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {expandedIds.has(index) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 p-4 bg-white/50 rounded-lg border border-white/60"
                      >
                        <div className="flex items-start space-x-2">
                          <div className="text-verde-safra text-lg">✅</div>
                          <div>
                            <h4 className="font-medium text-gray-800 mb-1">Ação Recomendada:</h4>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {alert.acao_sugerida}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: alerts.length * 0.1 + 0.2 }}
        className="mt-8 p-6 bg-gradient-to-r from-verde-safra to-dourado-milho rounded-xl text-white"
      >
        <h3 className="text-lg font-semibold mb-2">💰 Potencial Total de Economia</h3>
        <p className="text-3xl font-bold mb-2">
          R$ {sortedAlerts
            .reduce((sum, alert) => sum + (alert.impacto_estimado || 0), 0)
            .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-sm opacity-90">
          Implementando todas as recomendações acima, você pode economizar este valor anualmente.
        </p>
      </motion.div>
    </div>
  );
};