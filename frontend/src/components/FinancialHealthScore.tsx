import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FinancialHealthScoreProps {
  data: any;
}

interface ScoreComponent {
  score: number;
  peso: number;
  status: string;
  valor_atual?: number;
  meses_cobertura?: number;
  percentual_receita?: number;
  valor_dividas?: number;
  roi_estimado?: number;
}

interface ScoreData {
  score_total: number;
  nivel: string;
  componentes: {
    liquidez: ScoreComponent;
    endividamento: ScoreComponent;
    eficiencia: ScoreComponent;
  };
  benchmark: {
    posicao_regional: string;
    cultura_detectada: string;
    ajuste_sazonal: number;
  };
  recomendacoes: Array<{
    categoria: string;
    prioridade: string;
    acao: string;
    impacto_score: string;
    prazo: string;
  }>;
  tendencia: {
    direcao: string;
    variacao: number;
  };
  proxima_revisao: string;
}

export const FinancialHealthScore: React.FC<FinancialHealthScoreProps> = ({ data }) => {
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'componentes' | 'recomendacoes'>('componentes');

  useEffect(() => {
    if (data) {
      calculateScore();
    }
  }, [data]);

  const calculateScore = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/insights/financial-health-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setScoreData(result.score_data);
      }
    } catch (error) {
      console.error('Erro ao calcular score:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // verde-safra
    if (score >= 60) return '#F59E0B'; // dourado-milho
    if (score >= 40) return '#F97316'; // laranja
    return '#EF4444'; // vermelho
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '🌟';
    if (score >= 60) return '👍';
    if (score >= 40) return '⚠️';
    return '🚨';
  };

  const getTrendEmoji = (tendencia: string) => {
    switch (tendencia) {
      case 'melhorando': return '📈';
      case 'piorando': return '📉';
      default: return '➡️';
    }
  };

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'baixa': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-verde-safra mx-auto mb-4"></div>
          <p className="text-gray-600">Calculando Score de Saúde Financeira...</p>
        </div>
      </div>
    );
  }

  if (!scoreData) {
    return (
      <div className="text-center p-12">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-gray-500">Score será calculado após o upload dos dados</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score Principal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 shadow-xl border border-gray-100"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Score de Saúde Financeira Rural
          </h2>
          <p className="text-gray-600">
            Análise baseada em liquidez, endividamento e eficiência
          </p>
        </div>

        {/* Score Visual */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            {/* Gauge Background */}
            <svg width="240" height="140" viewBox="0 0 240 140" className="drop-shadow-lg">
              {/* Background semicircle */}
              <path
                d="M 30 120 A 90 90 0 0 1 210 120"
                stroke="#E5E7EB"
                strokeWidth="16"
                fill="none"
                strokeLinecap="round"
              />
              
              {/* Progress semicircle */}
              <motion.path
                d="M 30 120 A 90 90 0 0 1 210 120"
                stroke={getScoreColor(scoreData.score_total)}
                strokeWidth="16"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="283"
                strokeDashoffset={283 - (scoreData.score_total / 100) * 283}
                initial={{ strokeDashoffset: 283 }}
                animate={{ strokeDashoffset: 283 - (scoreData.score_total / 100) * 283 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="drop-shadow-sm"
              />
              
              {/* Score ranges marks */}
              <g stroke="#D1D5DB" strokeWidth="2">
                <line x1="30" y1="120" x2="35" y2="115" /> {/* 0 */}
                <line x1="67.5" y1="67.5" x2="72.5" y2="62.5" /> {/* 25 */}
                <line x1="120" y1="30" x2="120" y2="25" /> {/* 50 */}
                <line x1="172.5" y1="67.5" x2="167.5" y2="62.5" /> {/* 75 */}
                <line x1="210" y1="120" x2="205" y2="115" /> {/* 100 */}
              </g>
            </svg>
            
            {/* Score Number */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
              <motion.div 
                className="text-5xl mb-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                {getScoreEmoji(scoreData.score_total)}
              </motion.div>
              <motion.div 
                className="text-4xl font-bold"
                style={{ color: getScoreColor(scoreData.score_total) }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
              >
                {scoreData.score_total}
              </motion.div>
              <motion.div 
                className="text-sm text-gray-600 font-medium capitalize"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 0.5 }}
              >
                {scoreData.nivel}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <span>{getTrendEmoji(scoreData.tendencia.direcao)}</span>
              <span className="font-medium text-gray-700">Tendência</span>
            </div>
            <p className="text-lg font-semibold capitalize text-gray-800">
              {scoreData.tendencia.direcao}
            </p>
            <p className="text-sm text-gray-500">
              {scoreData.tendencia.variacao > 0 ? '+' : ''}{scoreData.tendencia.variacao}% no período
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <span>📍</span>
              <span className="font-medium text-gray-700">Regional</span>
            </div>
            <p className="text-lg font-semibold text-gray-800">
              {scoreData.benchmark.posicao_regional}
            </p>
            <p className="text-sm text-gray-500 capitalize">
              Cultura: {scoreData.benchmark.cultura_detectada}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <span>📅</span>
              <span className="font-medium text-gray-700">Próxima Revisão</span>
            </div>
            <p className="text-lg font-semibold text-gray-800">
              {scoreData.proxima_revisao}
            </p>
            <p className="text-sm text-gray-500">
              Revisão mensal recomendada
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('componentes')}
            className={`flex-1 p-4 text-center font-medium transition-colors ${
              activeTab === 'componentes'
                ? 'bg-verde-safra text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📊 Componentes do Score
          </button>
          <button
            onClick={() => setActiveTab('recomendacoes')}
            className={`flex-1 p-4 text-center font-medium transition-colors ${
              activeTab === 'recomendacoes'
                ? 'bg-verde-safra text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            💡 Recomendações
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'componentes' && (
              <motion.div
                key="componentes"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Liquidez */}
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-blue-800">
                      💧 Liquidez ({scoreData.componentes.liquidez.peso}%)
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-blue-600">
                        {scoreData.componentes.liquidez.score}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        scoreData.componentes.liquidez.status === 'Forte' ? 'bg-green-100 text-green-800' :
                        scoreData.componentes.liquidez.status === 'Adequado' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {scoreData.componentes.liquidez.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-blue-700">
                    <p><strong>Cobertura:</strong> {scoreData.componentes.liquidez.meses_cobertura} meses de gastos</p>
                    <p><strong>Caixa Estimado:</strong> R$ {scoreData.componentes.liquidez.valor_atual?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {/* Endividamento */}
                <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-orange-800">
                      📊 Endividamento ({scoreData.componentes.endividamento.peso}%)
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-orange-600">
                        {scoreData.componentes.endividamento.score}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        scoreData.componentes.endividamento.status === 'Forte' ? 'bg-green-100 text-green-800' :
                        scoreData.componentes.endividamento.status === 'Adequado' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {scoreData.componentes.endividamento.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-orange-700">
                    <p><strong>% da Receita:</strong> {scoreData.componentes.endividamento.percentual_receita}%</p>
                    <p><strong>Total Dívidas:</strong> R$ {scoreData.componentes.endividamento.valor_dividas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {/* Eficiência */}
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-green-800">
                      ⚡ Eficiência ({scoreData.componentes.eficiencia.peso}%)
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-green-600">
                        {scoreData.componentes.eficiencia.score}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        scoreData.componentes.eficiencia.status === 'Forte' ? 'bg-green-100 text-green-800' :
                        scoreData.componentes.eficiencia.status === 'Adequado' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {scoreData.componentes.eficiencia.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-green-700">
                    <p><strong>ROI Estimado:</strong> {scoreData.componentes.eficiencia.roi_estimado}% ao ano</p>
                    <p><strong>Base:</strong> Diversificação e consistência dos gastos</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'recomendacoes' && (
              <motion.div
                key="recomendacoes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {scoreData.recomendacoes.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {rec.categoria === 'Liquidez' ? '💧' :
                           rec.categoria === 'Endividamento' ? '📊' :
                           rec.categoria === 'Eficiência' ? '⚡' : '🎯'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{rec.categoria}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.prioridade)}`}>
                            {rec.prioridade.charAt(0).toUpperCase() + rec.prioridade.slice(1)} Prioridade
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-verde-safra">{rec.impacto_score}</div>
                        <div className="text-xs text-gray-500">{rec.prazo}</div>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{rec.acao}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};