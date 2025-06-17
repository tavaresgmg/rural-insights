import React, { Suspense } from 'react';
import { motion } from 'framer-motion';

// Lazy load dos componentes pesados
const LazyFinancialHealthScore = React.lazy(() => 
  import('./FinancialHealthScore').then(module => ({ 
    default: module.FinancialHealthScore 
  }))
);

const LazyScenarioSimulator = React.lazy(() => 
  import('./ScenarioSimulator').then(module => ({ 
    default: module.ScenarioSimulator 
  }))
);

const LazyInsightTimeline = React.lazy(() => 
  import('./InsightTimeline').then(module => ({ 
    default: module.InsightTimeline 
  }))
);

const LazyExportButtons = React.lazy(() => 
  import('./ExportButtons').then(module => ({ 
    default: module.ExportButtons 
  }))
);

const LazyEnhancedExportButtons = React.lazy(() => 
  import('./EnhancedExportButtons').then(module => ({ 
    default: module.EnhancedExportButtons 
  }))
);

// Componente de loading avançado
const ComponentSkeleton: React.FC<{ 
  height?: string; 
  className?: string;
  title?: string;
}> = ({ 
  height = 'h-64', 
  className = '', 
  title = 'Carregando componente...' 
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={`bg-white rounded-2xl border border-gray-100 p-6 ${height} ${className}`}
  >
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
      </div>
      
      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      
      {/* Chart area skeleton */}
      <div className="mt-6 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-400 text-sm font-medium">{title}</div>
      </div>
    </div>
  </motion.div>
);

// Loading específico para gráficos
const ChartSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6">
    <div className="animate-pulse">
      {/* Tabs skeleton */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
        ))}
      </div>
      
      {/* Chart skeleton */}
      <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-gray-400 text-sm">Preparando visualizações...</div>
        </div>
      </div>
    </div>
  </div>
);

// Loading para score financeiro
const ScoreSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6">
    <div className="animate-pulse">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
      </div>
      
      {/* Gauge skeleton */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="w-48 h-24 bg-gray-200 rounded-t-full"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
            <div className="w-8 h-8 bg-gray-300 rounded-full mb-2"></div>
            <div className="h-6 bg-gray-300 rounded w-12"></div>
          </div>
        </div>
      </div>
      
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-50 p-4 rounded-xl">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Loading para simulador
const SimulatorSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="text-center animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
    </div>
    
    {/* Tabs */}
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex border-b border-gray-200 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex-1 p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        ))}
      </div>
      
      {/* Content */}
      <div className="p-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <div className="h-12 bg-gray-200 rounded-xl w-48 mx-auto"></div>
        </div>
      </div>
    </div>
  </div>
);

// Loading para insights timeline
const TimelineSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[1, 2, 3].map(i => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.1 }}
        className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
      >
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
          <div className="flex-1 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
          <div className="text-right">
            <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

// Wrapper com error boundary
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

class LazyErrorBoundary extends React.Component<
  LazyWrapperProps,
  { hasError: boolean; error?: Error }
> {
  constructor(props: LazyWrapperProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
    // Try to recover by retrying once
    if (!this.state.hasError) {
      setTimeout(() => {
        this.setState({ hasError: false });
      }, 1000);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.errorFallback || (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Erro ao carregar componente
          </h3>
          <p className="text-red-600 text-sm mb-4">
            {this.state.error?.message || 'Ocorreu um erro inesperado. Tente recarregar a página.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            🔄 Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Componentes otimizados exportados
export const OptimizedFinancialHealthScore: React.FC<{ data: any }> = ({ data }) => (
  <LazyErrorBoundary>
    <Suspense fallback={<ScoreSkeleton />}>
      <LazyFinancialHealthScore data={data} />
    </Suspense>
  </LazyErrorBoundary>
);

export const OptimizedScenarioSimulator: React.FC<{ currentCashFlow?: number }> = ({ currentCashFlow }) => (
  <LazyErrorBoundary>
    <Suspense fallback={<SimulatorSkeleton />}>
      <LazyScenarioSimulator currentCashFlow={currentCashFlow} />
    </Suspense>
  </LazyErrorBoundary>
);

export const OptimizedInsightTimeline: React.FC<{ alerts: any[] }> = ({ alerts }) => (
  <LazyErrorBoundary>
    <Suspense fallback={<TimelineSkeleton />}>
      <LazyInsightTimeline alerts={alerts} />
    </Suspense>
  </LazyErrorBoundary>
);

export const OptimizedExportButtons: React.FC<{ analysisData?: any; scoreData?: any }> = ({ 
  analysisData, 
  scoreData 
}) => (
  <LazyErrorBoundary>
    <Suspense fallback={<div></div>}>
      <LazyExportButtons analysisData={analysisData} scoreData={scoreData} />
    </Suspense>
  </LazyErrorBoundary>
);

export const OptimizedEnhancedExportButtons: React.FC<{ 
  analysisData?: any; 
  scoreData?: any;
  customization?: any;
}> = ({ 
  analysisData, 
  scoreData,
  customization
}) => (
  <LazyErrorBoundary>
    <Suspense fallback={<div></div>}>
      <LazyEnhancedExportButtons 
        analysisData={analysisData} 
        scoreData={scoreData} 
        customization={customization}
      />
    </Suspense>
  </LazyErrorBoundary>
);

// Hook para prefetch de componentes
export const usePrefetchComponents = () => {
  React.useEffect(() => {
    // Prefetch componentes após página carregar
    const prefetchTimer = setTimeout(() => {
      import('./FinancialHealthScore');
      import('./ScenarioSimulator');
      import('./InsightTimeline');
      import('./ExportButtons');
      import('./EnhancedExportButtons');
    }, 2000);

    return () => clearTimeout(prefetchTimer);
  }, []);
};

// Export dos skeletons para uso independente
export {
  ComponentSkeleton,
  ChartSkeleton,
  ScoreSkeleton,
  SimulatorSkeleton,
  TimelineSkeleton
};