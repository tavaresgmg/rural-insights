// Exportações centralizadas dos componentes de gráficos
export { MetricCard } from '../MetricCard';
export { InsightTimeline } from '../InsightTimeline';

// Re-exporta componentes do Recharts para facilitar importação
export {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Cores padrão para gráficos rurais
export const RURAL_COLORS = [
  '#10B981', // verde-safra
  '#F59E0B', // dourado-milho
  '#92400E', // terra-fertil
  '#8B4513', // marrom-solo
  '#F5DEB3'  // bege-palha
];

// Configurações padrão para tooltips
export const defaultTooltipFormatter = (value: any, name: string) => [
  `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
  name
];

// Configurações padrão para formatação de eixos
export const currencyAxisFormatter = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

export const percentAxisFormatter = (value: number) =>
  `${value.toFixed(1)}%`;