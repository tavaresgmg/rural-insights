import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { 
  OptimizedFinancialHealthScore,
  OptimizedScenarioSimulator,
  OptimizedInsightTimeline,
  OptimizedEnhancedExportButtons
} from '../components/LazyComponents';
import type { AnalysisResponse } from '../services/api';

// Cores para as categorias
const COLORS = ['#10B981', '#F59E0B', '#92400E', '#8B4513', '#F5DEB3'];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'bar' | 'line' | 'pie'>('bar');
  const [loading, setLoading] = useState(true);
  const [scoreData, setScoreData] = useState<any>(null);

  useEffect(() => {
    // Recupera dados da análise do sessionStorage
    const storedData = sessionStorage.getItem('analysisData');
    // const processingTime = sessionStorage.getItem('processingTime');
    
    if (!storedData) {
      navigate('/');
      return;
    }

    try {
      const data = JSON.parse(storedData);
      setAnalysis(data);
      
      // Busca dados do score se disponível
      fetchScoreData(data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchScoreData = async (analysisData: AnalysisResponse) => {
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
      }
    } catch (error) {
      console.error('Erro ao buscar score data:', error);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!analysis) {
    return null;
  }

  // Prepara dados para os gráficos
  const barData = analysis.top_categorias.map(cat => ({
    name: cat.nome.length > 20 ? cat.nome.substring(0, 20) + '...' : cat.nome,
    valor: cat.valor,
    percentual: cat.percentual
  }));

  const pieData = analysis.top_categorias.map(cat => ({
    name: cat.nome,
    value: cat.valor,
    percentual: cat.percentual
  }));

  // Prepara dados para gráfico de linha (evolução mensal)
  const lineData: any[] = [];
  const months = new Set<string>();
  
  Object.entries(analysis.evolucao_mensal).forEach(([_categoria, evolucao]) => {
    evolucao.forEach(item => {
      months.add(item.mes);
    });
  });

  Array.from(months).sort().forEach(mes => {
    const monthData: any = { mes };
    Object.entries(analysis.evolucao_mensal).forEach(([categoria, evolucao]) => {
      const item = evolucao.find(e => e.mes === mes);
      monthData[categoria] = item ? item.valor : 0;
    });
    lineData.push(monthData);
  });

  // Calcula economia potencial
  const economiaPotencial = analysis.alertas
    .filter(a => a.impacto_estimado)
    .reduce((sum, a) => sum + (a.impacto_estimado || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-verde-safra/5">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">
              Análise <span className="text-verde-safra">Financeira Rural</span>
            </h1>
            <button
              onClick={() => navigate('/')}
              className="btn btn-ghost btn-sm"
            >
              Nova Análise
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Resumo Executivo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-white rounded-2xl shadow-lg"
        >
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Resumo Executivo</h2>
          <p className="text-gray-600 leading-relaxed">{analysis.resumo_executivo}</p>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <span>Período: {analysis.periodo_analise.inicio} - {analysis.periodo_analise.fim}</span>
            <span>{analysis.numero_transacoes} transações analisadas</span>
          </div>
        </motion.div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Total Gasto"
            value={`R$ ${analysis.total_gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon="💰"
            color="verde-safra"
            trend={analysis.numero_transacoes > 500 ? 'high' : 'normal'}
          />
          
          <MetricCard
            title="Maior Categoria"
            value={analysis.top_categorias[0]?.nome || '-'}
            subtitle={`${analysis.top_categorias[0]?.percentual || 0}% do total`}
            icon="📊"
            color="dourado-milho"
          />
          
          <MetricCard
            title="Economia Potencial"
            value={`R$ ${economiaPotencial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            subtitle="Com base nos alertas"
            icon="💡"
            color="terra-fertil"
            trend="opportunity"
          />
        </div>

        {/* Score de Saúde Financeira */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Score de Saúde Financeira Rural
          </h2>
          <OptimizedFinancialHealthScore data={analysis} />
        </motion.div>

        {/* Simulador de Cenários */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <OptimizedScenarioSimulator currentCashFlow={analysis?.total_gasto ? analysis.total_gasto / 12 : 15000} />
        </motion.div>

        {/* Seção de Gráficos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {/* Tabs */}
            <div className="flex space-x-4 mb-6 border-b">
              <button
                onClick={() => setActiveTab('bar')}
                className={`pb-2 px-1 font-semibold transition-colors ${
                  activeTab === 'bar' 
                    ? 'text-verde-safra border-b-2 border-verde-safra' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Top Categorias
              </button>
              <button
                onClick={() => setActiveTab('line')}
                className={`pb-2 px-1 font-semibold transition-colors ${
                  activeTab === 'line' 
                    ? 'text-verde-safra border-b-2 border-verde-safra' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Evolução Mensal
              </button>
              <button
                onClick={() => setActiveTab('pie')}
                className={`pb-2 px-1 font-semibold transition-colors ${
                  activeTab === 'pie' 
                    ? 'text-verde-safra border-b-2 border-verde-safra' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Distribuição
              </button>
            </div>

            {/* Gráficos */}
            <div className="h-80">
              {activeTab === 'bar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    />
                    <Bar dataKey="valor" fill="#10B981" radius={[8, 8, 0, 0]}>
                      {barData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {activeTab === 'line' && lineData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    />
                    <Legend />
                    {Object.keys(analysis.evolucao_mensal).slice(0, 3).map((categoria, index) => (
                      <Line
                        key={categoria}
                        type="monotone"
                        dataKey={categoria}
                        stroke={COLORS[index]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}

              {activeTab === 'pie' && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.percentual}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </motion.div>

        {/* Timeline de Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Insights e Recomendações
          </h2>
          <OptimizedInsightTimeline alerts={analysis.alertas} />
        </motion.div>
      </main>

      {/* Botões de Exportação Flutuantes Aprimorados */}
      <OptimizedEnhancedExportButtons 
        analysisData={analysis} 
        scoreData={scoreData} 
        customization={{
          companyName: 'Rural Insights',
          primaryColor: '#10B981',
          secondaryColor: '#F59E0B'
        }}
      />
    </div>
  );
};

// Skeleton Loading
const DashboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 animate-pulse">
    <div className="bg-white h-16 mb-8"></div>
    <div className="max-w-7xl mx-auto px-4">
      <div className="h-32 bg-gray-200 rounded-xl mb-8"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="h-40 bg-gray-200 rounded-xl"></div>
        <div className="h-40 bg-gray-200 rounded-xl"></div>
        <div className="h-40 bg-gray-200 rounded-xl"></div>
      </div>
      <div className="h-96 bg-gray-200 rounded-xl"></div>
    </div>
  </div>
);