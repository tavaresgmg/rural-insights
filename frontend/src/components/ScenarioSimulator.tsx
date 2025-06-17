import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ScenarioSimulatorProps {
  currentCashFlow?: number;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ 
  currentCashFlow = 15000 
}) => {
  const [activeScenario, setActiveScenario] = useState<'equipment' | 'hiring' | 'investment'>('equipment');
  const [templates, setTemplates] = useState<any>(null);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scenarioConfig, setScenarioConfig] = useState({
    equipment: 'tractor_new',
    payment_method: 'cash',
    employment_type: 'clt',
    positions: 1,
    investment: 'irrigation_system',
    current_monthly_flow: currentCashFlow
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/insights/scenario-templates');
      if (response.ok) {
        const result = await response.json();
        setTemplates(result.templates);
      }
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
    }
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const config = {
        type: activeScenario === 'equipment' ? 'equipment_purchase' : 
              activeScenario === 'hiring' ? 'hiring' : 'investment',
        ...scenarioConfig
      };

      const response = await fetch('http://localhost:8000/api/insights/scenario-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const result = await response.json();
        setSimulationResult(result.simulation);
      }
    } catch (error) {
      console.error('Erro na simulação:', error);
    } finally {
      setLoading(false);
    }
  };

  const getViabilityColor = (value: number | string, type: 'roi' | 'payback' | 'risk') => {
    if (type === 'roi') {
      return (value as number) > 15 ? '#10B981' : (value as number) > 5 ? '#F59E0B' : '#EF4444';
    } else if (type === 'payback') {
      return (value as number) < 24 ? '#10B981' : (value as number) < 48 ? '#F59E0B' : '#EF4444';
    } else { // risk
      return value === 'low' ? '#10B981' : value === 'medium' ? '#F59E0B' : '#EF4444';
    }
  };

  const formatCurrency = (value: number) => 
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const renderEquipmentSimulator = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seleção de Equipamento */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">🚜 Equipamento</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Equipamento
              </label>
              <select
                value={scenarioConfig.equipment}
                onChange={(e) => setScenarioConfig(prev => ({ ...prev, equipment: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-safra focus:border-transparent"
              >
                <option value="tractor_new">Trator Novo (120cv)</option>
                <option value="tractor_used">Trator Usado (120cv)</option>
                <option value="irrigation_system">Sistema Irrigação (10ha)</option>
                <option value="grain_silo">Silo Graneleiro (500t)</option>
              </select>
            </div>

            {templates && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Detalhes:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Custo:</strong> {formatCurrency(templates.equipment[scenarioConfig.equipment]?.cost || 0)}</p>
                  <p><strong>Economia Mensal:</strong> {formatCurrency(templates.equipment[scenarioConfig.equipment]?.monthly_savings || 0)}</p>
                  <p><strong>Vida Útil:</strong> {templates.equipment[scenarioConfig.equipment]?.useful_life || 0} anos</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modalidade de Pagamento */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">💳 Pagamento</h3>
          
          <div className="space-y-3">
            {['cash', 'financing', 'consortium'].map((method) => (
              <label key={method} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment_method"
                  value={method}
                  checked={scenarioConfig.payment_method === method}
                  onChange={(e) => setScenarioConfig(prev => ({ ...prev, payment_method: e.target.value }))}
                  className="w-4 h-4 text-verde-safra focus:ring-verde-safra"
                />
                <span className="text-gray-700">
                  {method === 'cash' ? '💰 À Vista' : 
                   method === 'financing' ? '🏦 Financiado (Pronaf)' : 
                   '🤝 Consórcio'}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fluxo de Caixa Atual (R$/mês)
            </label>
            <input
              type="range"
              min="5000"
              max="50000"
              step="1000"
              value={scenarioConfig.current_monthly_flow}
              onChange={(e) => setScenarioConfig(prev => ({ ...prev, current_monthly_flow: parseInt(e.target.value) }))}
              className="w-full"
            />
            <div className="text-sm text-gray-600 mt-1">
              {formatCurrency(scenarioConfig.current_monthly_flow)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHiringSimulator = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tipo de Contratação */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">👨‍🌾 Mão de Obra</h3>
          
          <div className="space-y-3">
            {[
              { value: 'clt', label: '👔 CLT (Carteira Assinada)', desc: 'Estabilidade e direitos trabalhistas' },
              { value: 'daily_worker', label: '📅 Diarista', desc: 'Flexibilidade conforme demanda' },
              { value: 'outsourced', label: '🏢 Terceirizado', desc: 'Sem responsabilidades trabalhistas' }
            ].map((option) => (
              <label key={option.value} className="block cursor-pointer">
                <div className={`p-4 border-2 rounded-lg transition-colors ${
                  scenarioConfig.employment_type === option.value 
                    ? 'border-verde-safra bg-verde-safra/5' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="employment_type"
                      value={option.value}
                      checked={scenarioConfig.employment_type === option.value}
                      onChange={(e) => setScenarioConfig(prev => ({ ...prev, employment_type: e.target.value }))}
                      className="w-4 h-4 text-verde-safra focus:ring-verde-safra"
                    />
                    <div>
                      <div className="font-medium text-gray-800">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.desc}</div>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Quantidade e Configurações */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">⚙️ Configurações</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Funcionários
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={scenarioConfig.positions}
                onChange={(e) => setScenarioConfig(prev => ({ ...prev, positions: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="text-sm text-gray-600 mt-1">
                {scenarioConfig.positions} {scenarioConfig.positions === 1 ? 'funcionário' : 'funcionários'}
              </div>
            </div>

            {templates && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Estimativa Mensal:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {scenarioConfig.employment_type === 'clt' && (
                    <>
                      <p><strong>Salário Base:</strong> {formatCurrency((templates.hiring?.worker_clt?.monthly_cost || 0) * scenarioConfig.positions)}</p>
                      <p><strong>Total com Encargos:</strong> {formatCurrency((templates.hiring?.worker_clt?.monthly_cost || 0) * 1.68 * scenarioConfig.positions)}</p>
                    </>
                  )}
                  {scenarioConfig.employment_type === 'daily_worker' && (
                    <>
                      <p><strong>Valor Diária:</strong> R$ {templates.hiring?.worker_daily?.daily_cost || 0}</p>
                      <p><strong>Total Mensal:</strong> {formatCurrency((templates.hiring?.worker_daily?.daily_cost || 0) * 20 * scenarioConfig.positions)}</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInvestmentSimulator = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">🏗️ Investimento em Infraestrutura</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Investimento
            </label>
            <select
              value={scenarioConfig.investment}
              onChange={(e) => setScenarioConfig(prev => ({ ...prev, investment: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-safra focus:border-transparent"
            >
              <option value="irrigation_system">💧 Sistema de Irrigação (10ha)</option>
              <option value="grain_silo">🌾 Silo Graneleiro (500t)</option>
              <option value="tractor_new">🚜 Trator Novo</option>
              <option value="tractor_used">🚜 Trator Usado</option>
            </select>
          </div>

          {templates && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Projeção:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Investimento:</strong> {formatCurrency(templates.equipment[scenarioConfig.investment]?.cost || 0)}</p>
                <p><strong>Retorno Mensal:</strong> {formatCurrency(templates.equipment[scenarioConfig.investment]?.monthly_savings || 0)}</p>
                <p><strong>Vida Útil:</strong> {templates.equipment[scenarioConfig.investment]?.useful_life || 0} anos</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!simulationResult) return null;

    if (activeScenario === 'equipment') {
      return renderEquipmentResults();
    } else if (activeScenario === 'hiring') {
      return renderHiringResults();
    } else {
      return renderInvestmentResults();
    }
  };

  const renderEquipmentResults = () => {
    const { payment_scenarios, recommendation, timeline } = simulationResult;
    
    return (
      <div className="space-y-6">
        {/* Comparação de Modalidades */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">💡 Comparação de Modalidades</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(payment_scenarios).map(([method, scenario]: [string, any]) => (
              <motion.div
                key={method}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border-2 ${
                  method === recommendation.best_option 
                    ? 'border-verde-safra bg-verde-safra/5' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">
                    {method === 'cash' ? '💰 À Vista' : 
                     method === 'financing' ? '🏦 Financiado' : 
                     '🤝 Consórcio'}
                  </h4>
                  {method === recommendation.best_option && (
                    <span className="text-xs bg-verde-safra text-white px-2 py-1 rounded-full">
                      Recomendado
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Benefício Mensal:</span>
                    <span className="font-medium text-verde-safra">
                      {formatCurrency(scenario.monthly_net_benefit)}
                    </span>
                  </div>
                  
                  {scenario.payback_months && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payback:</span>
                      <span className="font-medium">
                        {scenario.payback_months.toFixed(1)} meses
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Impacto Liquidez:</span>
                    <span className={`font-medium ${
                      scenario.liquidity_impact === 'low' ? 'text-green-600' :
                      scenario.liquidity_impact === 'medium' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {scenario.liquidity_impact === 'low' ? 'Baixo' :
                       scenario.liquidity_impact === 'medium' ? 'Médio' : 'Alto'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">💡 Recomendação:</h4>
            <p className="text-blue-700 text-sm">{recommendation.reasoning}</p>
          </div>
        </div>

        {/* Gráfico de Fluxo de Caixa */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">📈 Projeção de Fluxo de Caixa (12 meses)</h3>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Line 
                  type="monotone" 
                  dataKey="accumulated_flow" 
                  stroke="#10B981" 
                  strokeWidth={3} 
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderHiringResults = () => {
    const { employment_scenarios, recommendation, cost_comparison } = simulationResult;
    
    return (
      <div className="space-y-6">
        {/* Comparação de Custos */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">💰 Comparação de Custos Anuais</h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(cost_comparison).map(([type, data]: [string, any]) => ({
                type: type === 'clt' ? 'CLT' : type === 'daily' ? 'Diarista' : 'Terceirizado',
                custo: data.annual_cost,
                produtividade: data.annual_productivity
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Bar dataKey="custo" fill="#EF4444" name="Custo Anual" />
                <Bar dataKey="produtividade" fill="#10B981" name="Produtividade" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recomendação */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">🎯 Análise e Recomendação</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(employment_scenarios).map(([type, scenario]: [string, any]) => (
              <div 
                key={type}
                className={`p-4 rounded-lg border-2 ${
                  type === recommendation.best_option 
                    ? 'border-verde-safra bg-verde-safra/5' 
                    : 'border-gray-200'
                }`}
              >
                <h4 className="font-medium text-gray-800 mb-2">
                  {type === 'clt' ? '👔 CLT' : 
                   type === 'daily' ? '📅 Diarista' : 
                   '🏢 Terceirizado'}
                </h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Custo Mensal:</span>
                    <span className="font-medium">
                      {formatCurrency(scenario.monthly_cost)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Benefício Líquido:</span>
                    <span className={`font-medium ${scenario.monthly_net_benefit > 0 ? 'text-verde-safra' : 'text-red-600'}`}>
                      {formatCurrency(scenario.monthly_net_benefit)}
                    </span>
                  </div>
                  
                  {scenario.stability && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estabilidade:</span>
                      <span className="font-medium">{scenario.stability === 'high' ? 'Alta' : 'Baixa'}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">✅ Recomendação:</h4>
            <p className="text-green-700 text-sm">{recommendation.reasoning}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderInvestmentResults = () => {
    const { investment, roi_analysis, payback_analysis, risk_assessment } = simulationResult;
    
    return (
      <div className="space-y-6">
        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-xl border border-gray-200 text-center"
          >
            <div className="text-3xl mb-2">📈</div>
            <h3 className="font-semibold text-gray-800 mb-2">ROI</h3>
            <div 
              className="text-2xl font-bold mb-1"
              style={{ color: getViabilityColor(roi_analysis.roi_percentage, 'roi') }}
            >
              {roi_analysis.roi_percentage.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">ao ano</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl border border-gray-200 text-center"
          >
            <div className="text-3xl mb-2">⏱️</div>
            <h3 className="font-semibold text-gray-800 mb-2">Payback</h3>
            <div 
              className="text-2xl font-bold mb-1"
              style={{ color: getViabilityColor(payback_analysis.payback_months, 'payback') }}
            >
              {payback_analysis.payback_years.toFixed(1)}
            </div>
            <p className="text-sm text-gray-600">anos</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl border border-gray-200 text-center"
          >
            <div className="text-3xl mb-2">⚠️</div>
            <h3 className="font-semibold text-gray-800 mb-2">Risco</h3>
            <div 
              className="text-2xl font-bold mb-1 capitalize"
              style={{ color: getViabilityColor(risk_assessment.risk_level, 'risk') }}
            >
              {risk_assessment.risk_level === 'low' ? 'Baixo' :
               risk_assessment.risk_level === 'medium' ? 'Médio' : 'Alto'}
            </div>
            <p className="text-sm text-gray-600">geral</p>
          </motion.div>
        </div>

        {/* Análise Detalhada */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">📊 Análise Detalhada</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-3">💰 Dados Financeiros</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Investimento Inicial:</span>
                  <span className="font-medium">{formatCurrency(investment.cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Benefício Anual:</span>
                  <span className="font-medium text-verde-safra">{formatCurrency(roi_analysis.annual_net_benefit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Benefício Total:</span>
                  <span className="font-medium">{formatCurrency(roi_analysis.total_benefits)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vida Útil:</span>
                  <span className="font-medium">{investment.useful_life} anos</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-3">⚡ Indicadores</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Viabilidade:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    payback_analysis.breakeven_analysis === 'positive' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payback_analysis.breakeven_analysis === 'positive' ? 'Viável' : 'Questionável'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Risco ROI:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    risk_assessment.roi_risk === 'low' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {risk_assessment.roi_risk === 'low' ? 'Baixo' : 'Alto'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Risco Tecnológico:</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {risk_assessment.technology_risk === 'low' ? 'Baixo' : 'Alto'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🎯 Simulador de Cenários Financeiros
        </h2>
        <p className="text-gray-600">
          Projete o impacto de diferentes decisões no seu fluxo de caixa
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'equipment', label: '🚜 Equipamentos', desc: 'Comprar máquinas e implementos' },
            { id: 'hiring', label: '👨‍🌾 Contratação', desc: 'Expandir equipe de trabalho' },
            { id: 'investment', label: '🏗️ Infraestrutura', desc: 'Investir em instalações' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveScenario(tab.id as any)}
              className={`flex-1 p-4 text-center transition-colors ${
                activeScenario === tab.id
                  ? 'bg-verde-safra text-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">{tab.label}</div>
              <div className="text-xs opacity-75">{tab.desc}</div>
            </button>
          ))}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScenario}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {activeScenario === 'equipment' && renderEquipmentSimulator()}
              {activeScenario === 'hiring' && renderHiringSimulator()}
              {activeScenario === 'investment' && renderInvestmentSimulator()}
            </motion.div>
          </AnimatePresence>

          {/* Botão de Simulação */}
          <div className="mt-8 text-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={runSimulation}
              disabled={loading}
              className="bg-gradient-to-r from-verde-safra to-dourado-milho text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Simulando...</span>
                </div>
              ) : (
                <>🚀 Executar Simulação</>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <AnimatePresence>
        {simulationResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {renderResults()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};