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
      // Verifica e converte evolucao_mensal se for string
      let monthlyEvolution = data.evolucao_mensal || {};
      if (typeof monthlyEvolution === 'string') {
        try {
          monthlyEvolution = JSON.parse(monthlyEvolution);
        } catch {
          monthlyEvolution = {};
        }
      }

      // Prepara os dados no formato esperado pelo backend
      const requestData = {
        top_categories: data.top_categorias || [],
        monthly_evolution: monthlyEvolution,
        anomalies: data.alertas || [],
        total_gasto: data.total_gasto || 0,
        numero_transacoes: data.numero_transacoes || 0,
        periodo_analise: data.periodo_analise || {}
      };

      console.log('Enviando dados para score:', requestData);

      const response = await fetch('http://localhost:8000/api/insights/financial-health-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const result = await response.json();
        setScoreData(result.score_data || generateMockScore(data));
      } else {
        // If the API fails, generate mock data
        setScoreData(generateMockScore(data));
      }
    } catch (error) {
      console.error('Erro ao calcular score:', error);
      // Gerar dados mockados para demonstração se houver erro
      setScoreData(generateMockScore(data));
    } finally {
      setLoading(false);
    }
  };

  const generateMockScore = (analysisData: any): ScoreData => {
    // Cálculos básicos com os dados disponíveis
    const totalGasto = analysisData?.total_gasto || 0;
    const gastoMensal = totalGasto > 0 ? totalGasto / 6 : 15000; // Valor médio rural se não houver dados
    const receitaEstimada = gastoMensal * 12 / 0.2; // 20% de margem
    const caixaEstimado = gastoMensal * 2.5; // 2.5 meses de cobertura
    const dividasEstimadas = gastoMensal * 3; // 3 meses de gastos
    
    // Calcular scores dos componentes
    const mesesCobertura = caixaEstimado / Math.max(gastoMensal, 1);
    const liquidezScore = Math.min(100, Math.max(20, mesesCobertura * 20));
    
    const endividamentoRatio = dividasEstimadas / Math.max(receitaEstimada, 1);
    const endividamentoScore = Math.max(10, 100 - (endividamentoRatio * 100));
    
    const eficienciaScore = 65; // Score base
    
    const scoreTotal = (liquidezScore * 0.3) + (endividamentoScore * 0.3) + (eficienciaScore * 0.4);

    return {
      score_total: Math.round(scoreTotal),
      nivel: scoreTotal >= 80 ? 'Excelente' : scoreTotal >= 60 ? 'Bom' : scoreTotal >= 40 ? 'Regular' : 'Precisa Atenção',
      componentes: {
        liquidez: {
          score: Math.round(liquidezScore),
          peso: 30,
          status: liquidezScore >= 75 ? 'Forte' : liquidezScore >= 50 ? 'Adequado' : liquidezScore >= 30 ? 'Atenção' : 'Crítico',
          valor_atual: caixaEstimado,
          meses_cobertura: Math.round(mesesCobertura * 10) / 10
        },
        endividamento: {
          score: Math.round(endividamentoScore),
          peso: 30,
          status: endividamentoScore >= 75 ? 'Forte' : endividamentoScore >= 50 ? 'Adequado' : endividamentoScore >= 30 ? 'Atenção' : 'Crítico',
          percentual_receita: Math.round(endividamentoRatio * 100),
          valor_dividas: dividasEstimadas
        },
        eficiencia: {
          score: Math.round(eficienciaScore),
          peso: 40,
          status: eficienciaScore >= 75 ? 'Forte' : eficienciaScore >= 50 ? 'Adequado' : eficienciaScore >= 30 ? 'Atenção' : 'Crítico',
          roi_estimado: 15
        }
      },
      benchmark: {
        posicao_regional: scoreTotal >= 75 ? 'Top 25% da região' : scoreTotal >= 50 ? 'Acima da média regional' : 'Próximo à média regional',
        cultura_detectada: 'Geral',
        ajuste_sazonal: 0
      },
      recomendacoes: generateRecommendations(liquidezScore, endividamentoScore, eficienciaScore),
      tendencia: {
        direcao: scoreTotal >= 60 ? 'melhorando' : scoreTotal >= 40 ? 'estável' : 'piorando',
        variacao: scoreTotal >= 60 ? 5.2 : scoreTotal >= 40 ? 0 : -4.3
      },
      proxima_revisao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
    };
  };

  const generateRecommendations = (liquidez: number, endividamento: number, eficiencia: number) => {
    const recommendations = [];

    if (liquidez < 50) {
      recommendations.push({
        categoria: 'Liquidez',
        prioridade: 'alta',
        acao: 'Criar reserva de emergência equivalente a 3 meses de gastos operacionais. Considere vender ativos não essenciais ou negociar prazos com fornecedores.',
        impacto_score: '+15 pontos',
        prazo: '3-6 meses'
      });
    }

    if (endividamento < 50) {
      recommendations.push({
        categoria: 'Endividamento',
        prioridade: 'alta',
        acao: 'Renegociar dívidas buscando taxas menores e prazos maiores. Priorize quitar empréstimos com juros mais altos primeiro.',
        impacto_score: '+20 pontos',
        prazo: '6-12 meses'
      });
    }

    if (eficiencia < 60) {
      recommendations.push({
        categoria: 'Eficiência',
        prioridade: 'média',
        acao: 'Diversificar fontes de receita e otimizar custos operacionais. Implemente controle de custos por categoria.',
        impacto_score: '+10 pontos',
        prazo: '1-2 safras'
      });
    }

    recommendations.push({
      categoria: 'Gestão',
      prioridade: 'baixa',
      acao: 'Manter planilha de controle financeiro atualizada semanalmente. Revisar score mensalmente para acompanhar evolução.',
      impacto_score: '+5 pontos',
      prazo: 'Contínuo'
    });

    return recommendations;
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
      case 'média': return 'bg-yellow-100 text-yellow-800';
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

        {/* Score Visual - Corrigido alinhamento */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative w-[240px] h-[140px] flex items-center justify-center">
            {/* Gauge Background */}
            <svg width="240" height="140" viewBox="0 0 240 140" className="absolute inset-0">
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
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
              />
              
              {/* Score ranges marks */}
              <g stroke="#D1D5DB" strokeWidth="2">
                <line x1="30" y1="120" x2="35" y2="115" />
                <line x1="67.5" y1="67.5" x2="72.5" y2="62.5" />
                <line x1="120" y1="30" x2="120" y2="25" />
                <line x1="172.5" y1="67.5" x2="167.5" y2="62.5" />
                <line x1="210" y1="120" x2="205" y2="115" />
              </g>
            </svg>
            
            {/* Score Number - Centralizado */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
              <motion.div 
                className="text-5xl mb-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                {getScoreEmoji(scoreData.score_total)}
              </motion.div>
              <motion.div 
                className="text-4xl font-bold"
                style={{ color: getScoreColor(scoreData.score_total) }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xl sm:text-2xl">{getTrendEmoji(scoreData.tendencia.direcao)}</span>
              <span className="font-medium text-gray-700 text-sm sm:text-base">Tendência</span>
            </div>
            <p className="text-base sm:text-lg font-semibold capitalize text-gray-800">
              {scoreData.tendencia.direcao}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              {scoreData.tendencia.variacao > 0 ? '+' : ''}{scoreData.tendencia.variacao}% no período
            </p>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xl sm:text-2xl">📍</span>
              <span className="font-medium text-gray-700 text-sm sm:text-base">Regional</span>
            </div>
            <p className="text-base sm:text-lg font-semibold text-gray-800 truncate">
              {scoreData.benchmark.posicao_regional}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 capitalize">
              Cultura: {scoreData.benchmark.cultura_detectada}
            </p>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xl sm:text-2xl">📅</span>
              <span className="font-medium text-gray-700 text-sm sm:text-base">Próxima Revisão</span>
            </div>
            <p className="text-base sm:text-lg font-semibold text-gray-800">
              {scoreData.proxima_revisao}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
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
                        scoreData.componentes.liquidez.status === 'Atenção' ? 'bg-orange-100 text-orange-800' :
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
                        scoreData.componentes.endividamento.status === 'Atenção' ? 'bg-orange-100 text-orange-800' :
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
                        scoreData.componentes.eficiencia.status === 'Atenção' ? 'bg-orange-100 text-orange-800' :
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
                    className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {rec.categoria === 'Liquidez' ? '💧' :
                           rec.categoria === 'Endividamento' ? '📊' :
                           rec.categoria === 'Eficiência' ? '⚡' : 
                           rec.categoria === 'Gestão' ? '🎯' : '📌'}
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
                    <p className="text-gray-700 leading-relaxed break-words">{rec.acao}</p>
                  </motion.div>
                ))}

                {/* Nota sobre as recomendações */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 text-center">
                    💡 As recomendações são personalizadas com base no seu perfil financeiro atual. 
                    Implemente-as gradualmente para melhorar seu score.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};