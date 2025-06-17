import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export interface TopCategory {
  nome: string;
  valor: number;
  percentual: number;
  transacoes: number;
  media_por_transacao: number;
  variacao_mensal?: number;
}

export interface Alert {
  tipo: 'urgent' | 'warning' | 'info';
  categoria: string;
  mensagem: string;
  impacto_estimado?: number;
  acao_sugerida?: string;
}

// Re-export para garantir compatibilidade
export type { Alert as AlertType };

export interface MonthlyEvolution {
  mes: string;
  valor: number;
  transacoes: number;
}

export interface AnalysisResponse {
  total_gasto: number;
  numero_transacoes: number;
  periodo_analise: {
    inicio: string;
    fim: string;
  };
  top_categorias: TopCategory[];
  evolucao_mensal: Record<string, MonthlyEvolution[]>;
  alertas: Alert[];
  resumo_executivo: string;
}

// Re-export para garantir compatibilidade
export type { AnalysisResponse as Analysis };

export interface UploadResponse {
  success: boolean;
  message: string;
  analysis?: AnalysisResponse;
  processing_time: number;
}

export const uploadCSV = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<UploadResponse>('/api/upload/', formData);
  return response.data;
};

export default api;