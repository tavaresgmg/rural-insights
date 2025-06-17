// React automatically imported by Vite
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { PWAPrompt } from './components/PWAPrompt';
import { usePrefetchComponents } from './components/LazyComponents';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Prefetch componentes para melhor performance
  usePrefetchComponents();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
          
          {/* PWA Controls e Status */}
          <PWAPrompt />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
