import jsPDF from 'jspdf';
import { Chart, registerables } from 'chart.js';

// Registrar todos os componentes do Chart.js
Chart.register(...registerables);

export interface EnhancedExportData {
  analysis?: any;
  scoreData?: any;
  timestamp?: string;
  customization?: {
    logo?: string;
    companyName?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export interface WhatsAppOptions {
  includeLink?: boolean;
  phone?: string;
  includeAIInsights?: boolean;
  format?: 'full' | 'summary' | 'minimal';
}

export class PDFSafeExportService {
  
  private static readonly EMOJIS = {
    // Agricultura
    farm: '🌾',
    corn: '🌽',
    tractor: '🚜',
    cow: '🐄',
    pig: '🐷',
    chicken: '🐓',
    seeds: '🌱',
    harvest: '🌾',
    
    // Finanças
    money: '💰',
    chart: '📊',
    trending_up: '📈',
    trending_down: '📉',
    credit_card: '💳',
    bank: '🏦',
    calculator: '🧮',
    
    // Status
    success: '✅',
    warning: '⚠️',
    danger: '🚨',
    info: 'ℹ️',
    star: '⭐',
    fire: '🔥',
    rocket: '🚀',
    
    // Ações
    target: '🎯',
    lightbulb: '💡',
    tools: '🔧',
    shield: '🛡️',
    clock: '⏰',
    calendar: '📅',
    
    // Comunicação
    phone: '📱',
    message: '💬',
    mail: '📧',
    link: '🔗',
    document: '📄',
    
    // Natureza
    sun: '☀️',
    rain: '🌧️',
    plant: '🌿',
    leaf: '🍃',
    water: '💧'
  };

  /**
   * Gera texto formatado para WhatsApp com opções avançadas
   */
  static generateWhatsAppText(data: EnhancedExportData, options: WhatsAppOptions = {}): string {
    const { analysis, scoreData, customization } = data;
    const { format = 'full', includeAIInsights = true } = options;
    
    if (!analysis) return '';

    const timestamp = new Date().toLocaleDateString('pt-BR');
    const companyName = customization?.companyName || 'Rural Insights';
    
    // Cálculos
    const economiaTotal = analysis.alertas?.reduce((sum: number, alert: any) => 
      sum + (alert.impacto_estimado || 0), 0) || 0;

    // Escolher formato
    switch (format) {
      case 'minimal':
        return this.generateMinimalWhatsApp(analysis, scoreData, timestamp, companyName);
      case 'summary':
        return this.generateSummaryWhatsApp(analysis, scoreData, timestamp, companyName, economiaTotal);
      default:
        return this.generateFullWhatsApp(analysis, scoreData, timestamp, companyName, economiaTotal, includeAIInsights);
    }
  }

  private static generateMinimalWhatsApp(analysis: any, scoreData: any, timestamp: string, companyName: string): string {
    return `${this.EMOJIS.farm} *RELATÓRIO RURAL EXPRESS*
${this.EMOJIS.calendar} ${timestamp}

${this.EMOJIS.money} *R$ ${analysis.total_gasto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}* gastos
${this.EMOJIS.chart} *${analysis.numero_transacoes}* transações
${this.EMOJIS.trending_up} *${analysis.top_categorias?.[0]?.nome}* (${analysis.top_categorias?.[0]?.percentual}%)

${scoreData ? `${this.EMOJIS.star} Score: *${scoreData.score_total}/100*` : ''}

${this.EMOJIS.link} ${companyName}`;
  }

  private static generateSummaryWhatsApp(
    analysis: any, 
    scoreData: any, 
    timestamp: string, 
    companyName: string,
    economiaTotal: number
  ): string {
    const alertaUrgente = analysis.alertas?.find((a: any) => a.tipo === 'urgent');
    
    return `${this.EMOJIS.farm} *RELATÓRIO FINANCEIRO RURAL*
${this.EMOJIS.calendar} ${timestamp}

${this.EMOJIS.money} *RESUMO GERAL*
• Total: R$ ${analysis.total_gasto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Transações: ${analysis.numero_transacoes}
• Economia potencial: R$ ${economiaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

${scoreData ? `${this.EMOJIS.star} *SAÚDE FINANCEIRA*
Score: ${scoreData.score_total}/100 (${scoreData.nivel})
${this.getScoreEmoji(scoreData.score_total)} ${this.getScoreMessage(scoreData.score_total)}

` : ''}${this.EMOJIS.chart} *TOP 3 GASTOS*
${analysis.top_categorias?.slice(0, 3).map((cat: any, i: number) => 
  `${i + 1}. ${cat.nome}: ${cat.percentual}%`
).join('\n')}

${alertaUrgente ? `${this.EMOJIS.danger} *ALERTA URGENTE*
${alertaUrgente.mensagem}
` : ''}
${this.EMOJIS.rocket} ${companyName}`;
  }

  private static generateFullWhatsApp(
    analysis: any,
    scoreData: any,
    timestamp: string,
    companyName: string,
    economiaTotal: number,
    includeAIInsights: boolean
  ): string {
    const periodo = `${analysis.periodo_analise?.inicio} a ${analysis.periodo_analise?.fim}`;
    const diasAnalise = this.calcularDias(analysis.periodo_analise?.inicio, analysis.periodo_analise?.fim);
    const mediaDiaria = analysis.total_gasto / diasAnalise;

    let texto = `${this.EMOJIS.farm} *RELATÓRIO COMPLETO - GESTÃO RURAL* ${this.EMOJIS.farm}
${this.EMOJIS.calendar} Gerado em: ${timestamp}

${this.EMOJIS.corn} *DADOS DA PROPRIEDADE*
${this.EMOJIS.tractor} Período: ${periodo}
${this.EMOJIS.calendar} Dias analisados: ${diasAnalise}

${this.EMOJIS.money} *RESUMO FINANCEIRO*
• Total investido: *R$ ${analysis.total_gasto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*
• Número de transações: *${analysis.numero_transacoes}*
• Média por dia: *R$ ${mediaDiaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*
• Ticket médio: *R$ ${(analysis.total_gasto / analysis.numero_transacoes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*

`;

    // Score de saúde financeira
    if (scoreData) {
      texto += `${this.EMOJIS.star} *SCORE DE SAÚDE FINANCEIRA*
${this.getScoreBar(scoreData.score_total)}
• Score Total: *${scoreData.score_total}/100* ${this.getScoreEmoji(scoreData.score_total)}
• Classificação: *${scoreData.nivel}*
• Posição Regional: *${scoreData.benchmark?.posicao_regional || 'N/A'}*

${this.EMOJIS.chart} *ANÁLISE DETALHADA*
${this.EMOJIS.water} Liquidez: ${scoreData.componentes?.liquidez?.score}/100
  └ ${scoreData.componentes?.liquidez?.meses_cobertura} meses de cobertura
${this.EMOJIS.bank} Endividamento: ${scoreData.componentes?.endividamento?.score}/100
  └ ${scoreData.componentes?.endividamento?.percentual_receita}% da receita
${this.EMOJIS.rocket} Eficiência: ${scoreData.componentes?.eficiencia?.score}/100
  └ ${scoreData.componentes?.eficiencia?.status}

`;
    }

    // Top categorias com ícones
    texto += `${this.EMOJIS.chart} *PRINCIPAIS INVESTIMENTOS*
${analysis.top_categorias?.slice(0, 5).map((cat: any, i: number) => {
  const icon = this.getCategoryIcon(cat.nome);
  const trend = cat.variacao_mensal > 0 ? this.EMOJIS.trending_up : this.EMOJIS.trending_down;
  return `${icon} *${i + 1}. ${cat.nome}*
   └ R$ ${cat.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${cat.percentual}%)
   └ ${trend} Variação: ${cat.variacao_mensal > 0 ? '+' : ''}${cat.variacao_mensal}%`;
}).join('\n\n')}

`;

    // Alertas organizados por prioridade
    const alertasUrgentes = analysis.alertas?.filter((a: any) => a.tipo === 'urgent') || [];
    const alertasAviso = analysis.alertas?.filter((a: any) => a.tipo === 'warning') || [];
    const alertasInfo = analysis.alertas?.filter((a: any) => a.tipo === 'info').slice(0, 3) || [];

    if (alertasUrgentes.length > 0) {
      texto += `${this.EMOJIS.danger} *ATENÇÃO URGENTE*
${alertasUrgentes.map((alert: any) => 
  `• ${alert.categoria}: ${alert.mensagem}\n  ${this.EMOJIS.lightbulb} *Ação:* ${alert.acao_sugerida}`
).join('\n\n')}

`;
    }

    if (alertasAviso.length > 0) {
      texto += `${this.EMOJIS.warning} *PONTOS DE ATENÇÃO*
${alertasAviso.slice(0, 2).map((alert: any) => 
  `• ${alert.categoria}: ${alert.mensagem}`
).join('\n')}

`;
    }

    // Insights de IA
    if (includeAIInsights && alertasInfo.length > 0) {
      texto += `${this.EMOJIS.lightbulb} *INSIGHTS INTELIGENTES*
${alertasInfo.map((alert: any) => 
  `• ${alert.mensagem}`
).join('\n')}

`;
    }

    // Economia potencial
    if (economiaTotal > 0) {
      texto += `${this.EMOJIS.money} *OPORTUNIDADE DE ECONOMIA*
${this.EMOJIS.fire} Potencial total: *R$ ${economiaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*
${this.EMOJIS.target} Isso representa *${((economiaTotal / analysis.total_gasto) * 100).toFixed(1)}%* do total!

`;
    }

    // Próximos passos
    texto += `${this.EMOJIS.target} *PRÓXIMOS PASSOS RECOMENDADOS*
${scoreData?.recomendacoes?.slice(0, 3).map((rec: any, i: number) => 
  `${i + 1}. ${this.EMOJIS.tools} ${rec.acao}`
).join('\n') || analysis.alertas?.slice(0, 3).map((alert: any, i: number) => 
  `${i + 1}. ${this.EMOJIS.tools} ${alert.acao_sugerida}`
).join('\n')}

${this.EMOJIS.shield} *DICAS DE GESTÃO RURAL*
• ${this.EMOJIS.calendar} Planeje compras antecipadamente
• ${this.EMOJIS.tractor} Faça manutenção preventiva
• ${this.EMOJIS.corn} Diversifique produção
• ${this.EMOJIS.money} Negocie em grupo

━━━━━━━━━━━━━━━━━
${this.EMOJIS.phone} *${companyName}*
${this.EMOJIS.rocket} Gestão rural inteligente
${this.EMOJIS.link} ruralinsights.com.br`;

    // Limitar a 4096 caracteres
    if (texto.length > 4096) {
      texto = texto.substring(0, 4090) + '\n...';
    }

    return texto;
  }

  /**
   * Gera PDF avançado com gráficos (sem emojis)
   */
  static async generateEnhancedPDF(data: EnhancedExportData): Promise<void> {
    const { analysis, scoreData, customization } = data;
    
    if (!analysis) {
      throw new Error('Dados de análise não disponíveis');
    }

    const pdf = new jsPDF('p', 'mm', 'a4');

    // === CAPA ===
    await this.addCoverPage(pdf, analysis, scoreData, customization);
    
    // === PÁGINA 2: RESUMO EXECUTIVO ===
    pdf.addPage();
    await this.addExecutiveSummary(pdf, analysis, scoreData);
    
    // === PÁGINA 3: GRÁFICOS ===
    pdf.addPage();
    await this.addChartsPage(pdf, analysis, scoreData);
    
    // === PÁGINA 4: DETALHAMENTO ===
    pdf.addPage();
    await this.addDetailedAnalysis(pdf, analysis, scoreData);
    
    // === PÁGINA 5: RECOMENDAÇÕES ===
    if (scoreData?.recomendacoes?.length > 0 || analysis.alertas?.length > 0) {
      pdf.addPage();
      await this.addRecommendations(pdf, analysis, scoreData);
    }

    // Salvar
    const filename = `relatorio-rural-completo-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
  }

  private static async addCoverPage(
    pdf: jsPDF, 
    analysis: any, 
    scoreData: any,
    customization?: any
  ) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Background gradiente
    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Overlay com transparência simulada
    pdf.setFillColor(255, 255, 255);
    // @ts-ignore - GState opacity
    pdf.setGState(new (pdf as any).GState({ opacity: 0.1 }));
    pdf.rect(0, pageHeight/2, pageWidth, pageHeight/2, 'F');
    // @ts-ignore - GState opacity
    pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

    // Logo ou nome da empresa
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(32);
    pdf.setFont('helvetica', 'bold');
    pdf.text(customization?.companyName || 'RELATÓRIO FINANCEIRO', pageWidth/2, 60, { align: 'center' });
    
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'normal');
    pdf.text('GESTÃO RURAL INTELIGENTE', pageWidth/2, 80, { align: 'center' });

    // Texto decorativo
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'italic');
    pdf.text('AGRICULTURA | PECUÁRIA | GESTÃO RURAL', pageWidth/2, 110, { align: 'center' });

    // Informações principais
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`R$ ${analysis.total_gasto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth/2, 140, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('TOTAL ANALISADO', pageWidth/2, 150, { align: 'center' });

    // Score em destaque (se disponível)
    if (scoreData) {
      const scoreColor = scoreData.score_total >= 80 ? [255, 255, 255] : 
                        scoreData.score_total >= 60 ? [255, 239, 213] : 
                        scoreData.score_total >= 40 ? [254, 215, 170] : [254, 178, 76];
      
      pdf.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      pdf.circle(pageWidth/2, 180, 25, 'F');
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${scoreData.score_total}`, pageWidth/2, 185, { align: 'center' });
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.text('SCORE DE SAÚDE', pageWidth/2, 220, { align: 'center' });
    }

    // Período
    pdf.setFontSize(10);
    pdf.text(`Período: ${analysis.periodo_analise?.inicio} - ${analysis.periodo_analise?.fim}`, pageWidth/2, 250, { align: 'center' });

    // Footer
    const date = new Date().toLocaleDateString('pt-BR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    pdf.setFontSize(10);
    pdf.text(`Gerado em ${date}`, pageWidth/2, pageHeight - 20, { align: 'center' });
  }

  private static async addExecutiveSummary(pdf: jsPDF, analysis: any, scoreData: any) {
    let yPos = 30;
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Título
    pdf.setTextColor(16, 185, 129);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RESUMO EXECUTIVO', 20, yPos);
    yPos += 15;

    // Linha divisória
    pdf.setDrawColor(16, 185, 129);
    pdf.setLineWidth(0.5);
    pdf.line(20, yPos - 5, pageWidth - 20, yPos - 5);

    // Cards de resumo
    const cards = [
      {
        title: 'INVESTIMENTO TOTAL',
        value: `R$ ${analysis.total_gasto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        icon: 'R$',
        color: [16, 185, 129]
      },
      {
        title: 'TRANSAÇÕES',
        value: analysis.numero_transacoes.toString(),
        icon: '#',
        color: [245, 158, 11]
      },
      {
        title: 'TICKET MÉDIO',
        value: `R$ ${(analysis.total_gasto / analysis.numero_transacoes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        icon: 'AVG',
        color: [59, 130, 246]
      }
    ];

    // Renderizar cards
    let xPos = 20;
    cards.forEach(card => {
      // Fundo do card
      pdf.setFillColor(card.color[0], card.color[1], card.color[2]);
      // @ts-ignore - GState opacity
      pdf.setGState(new (pdf as any).GState({ opacity: 0.1 }));
      pdf.roundedRect(xPos, yPos, 55, 30, 3, 3, 'F');
      // @ts-ignore - GState opacity
      pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

      // Conteúdo
      pdf.setTextColor(card.color[0], card.color[1], card.color[2]);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(card.icon, xPos + 5, yPos + 10);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);
      pdf.text(card.title, xPos + 5, yPos + 18);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(card.value, xPos + 5, yPos + 26);
      
      xPos += 60;
    });

    yPos += 40;

    // Análise de período
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ANÁLISE DO PERÍODO', 20, yPos);
    yPos += 8;

    const dias = this.calcularDias(analysis.periodo_analise?.inicio, analysis.periodo_analise?.fim);
    const mediaDiaria = analysis.total_gasto / dias;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const periodoTexto = [
      `• Período analisado: ${analysis.periodo_analise?.inicio} a ${analysis.periodo_analise?.fim} (${dias} dias)`,
      `• Média diária de gastos: R$ ${mediaDiaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `• Categoria principal: ${analysis.top_categorias?.[0]?.nome} (${analysis.top_categorias?.[0]?.percentual}%)`
    ];

    periodoTexto.forEach(linha => {
      pdf.text(linha, 20, yPos);
      yPos += 6;
    });

    // Score de saúde (se disponível)
    if (scoreData) {
      yPos += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SAÚDE FINANCEIRA', 20, yPos);
      yPos += 8;

      // Barra de progresso do score
      const barWidth = 150;
      const barHeight = 10;
      const scorePercent = scoreData.score_total / 100;

      // Fundo da barra
      pdf.setFillColor(240, 240, 240);
      pdf.roundedRect(20, yPos, barWidth, barHeight, 2, 2, 'F');

      // Preenchimento da barra
      const scoreColor = scoreData.score_total >= 80 ? [16, 185, 129] : 
                        scoreData.score_total >= 60 ? [245, 158, 11] : 
                        scoreData.score_total >= 40 ? [249, 115, 22] : [239, 68, 68];
      
      pdf.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      pdf.roundedRect(20, yPos, barWidth * scorePercent, barHeight, 2, 2, 'F');

      // Texto do score
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.text(`${scoreData.score_total}/100 - ${scoreData.nivel}`, 20, yPos + 20);
      
      yPos += 30;

      // Componentes
      const componentes = [
        `Liquidez: ${scoreData.componentes?.liquidez?.score}/100 - ${scoreData.componentes?.liquidez?.status}`,
        `Endividamento: ${scoreData.componentes?.endividamento?.score}/100 - ${scoreData.componentes?.endividamento?.status}`,
        `Eficiência: ${scoreData.componentes?.eficiencia?.score}/100 - ${scoreData.componentes?.eficiencia?.status}`
      ];

      pdf.setFont('helvetica', 'normal');
      componentes.forEach(comp => {
        pdf.text(`• ${comp}`, 25, yPos);
        yPos += 6;
      });
    }
  }

  private static async addChartsPage(pdf: jsPDF, analysis: any, scoreData: any) {
    let yPos = 30;

    // Título
    pdf.setTextColor(16, 185, 129);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ANÁLISE VISUAL', 20, yPos);
    yPos += 15;

    // Gráfico de pizza - Top categorias
    const pieChartCanvas = await this.createPieChart(analysis.top_categorias);
    if (pieChartCanvas) {
      pdf.addImage(pieChartCanvas, 'PNG', 20, yPos, 80, 80);
    }

    // Legenda ao lado do gráfico
    let legendY = yPos + 10;
    analysis.top_categorias?.slice(0, 5).forEach((cat: any, i: number) => {
      const colors = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6'];
      const rgb = this.hexToRgb(colors[i]);
      pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
      pdf.rect(110, legendY - 3, 10, 5, 'F');
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);
      pdf.text(`${cat.nome} (${cat.percentual}%)`, 125, legendY);
      legendY += 8;
    });

    yPos += 100;

    // Gráfico de barras - Evolução mensal
    const barChartCanvas = await this.createMonthlyBarChart(analysis.evolucao_mensal);
    if (barChartCanvas) {
      pdf.addImage(barChartCanvas, 'PNG', 20, yPos, 170, 80);
    }

    yPos += 90;

    // Mini dashboard de indicadores
    if (scoreData) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INDICADORES CHAVE', 20, yPos);
      yPos += 10;

      const indicators = [
        {
          label: 'Meses de Cobertura',
          value: scoreData.componentes?.liquidez?.meses_cobertura || 0,
          unit: 'meses',
          status: scoreData.componentes?.liquidez?.meses_cobertura >= 3 ? 'good' : 'warning'
        },
        {
          label: 'Taxa de Endividamento',
          value: scoreData.componentes?.endividamento?.percentual_receita || 0,
          unit: '%',
          status: scoreData.componentes?.endividamento?.percentual_receita <= 30 ? 'good' : 'warning'
        },
        {
          label: 'Eficiência Operacional',
          value: scoreData.componentes?.eficiencia?.score || 0,
          unit: '/100',
          status: scoreData.componentes?.eficiencia?.score >= 70 ? 'good' : 'warning'
        }
      ];

      let indicatorX = 20;
      indicators.forEach(ind => {
        const color = ind.status === 'good' ? [16, 185, 129] : [245, 158, 11];
        
        pdf.setFillColor(color[0], color[1], color[2]);
        // @ts-ignore - GState opacity
        pdf.setGState(new (pdf as any).GState({ opacity: 0.1 }));
        pdf.roundedRect(indicatorX, yPos, 55, 25, 3, 3, 'F');
        // @ts-ignore - GState opacity
        pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(8);
        pdf.text(ind.label, indicatorX + 3, yPos + 6);
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text(`${ind.value}${ind.unit}`, indicatorX + 3, yPos + 18);
        
        indicatorX += 60;
      });
    }
  }

  private static async addDetailedAnalysis(pdf: jsPDF, analysis: any, _scoreData: any) {
    let yPos = 30;
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Título
    pdf.setTextColor(16, 185, 129);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ANÁLISE DETALHADA', 20, yPos);
    yPos += 15;

    // Tabela de categorias expandida
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BREAKDOWN DE GASTOS', 20, yPos);
    yPos += 10;

    // Headers da tabela
    const headers = ['Categoria', 'Valor Total', '%', 'Transações', 'Ticket Médio', 'Variação'];
    const colWidths = [45, 35, 15, 25, 30, 25];
    let xPos = 20;

    pdf.setFillColor(240, 240, 240);
    pdf.rect(20, yPos - 4, 175, 8, 'F');

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    headers.forEach((header, i) => {
      pdf.text(header, xPos, yPos);
      xPos += colWidths[i];
    });

    yPos += 10;

    // Dados da tabela
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    analysis.top_categorias?.slice(0, 10).forEach((cat: any) => {
      xPos = 20;
      
      // Nome da categoria (truncar se necessário)
      const catName = cat.nome.length > 25 ? cat.nome.substring(0, 25) + '...' : cat.nome;
      pdf.text(catName, xPos, yPos);
      xPos += colWidths[0];

      // Valor
      pdf.text(`R$ ${cat.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, xPos, yPos);
      xPos += colWidths[1];

      // Percentual
      pdf.text(`${cat.percentual}%`, xPos, yPos);
      xPos += colWidths[2];

      // Transações
      pdf.text(cat.transacoes.toString(), xPos, yPos);
      xPos += colWidths[3];

      // Ticket médio
      pdf.text(`R$ ${cat.media_por_transacao?.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, xPos, yPos);
      xPos += colWidths[4];

      // Variação
      const varColor = cat.variacao_mensal > 0 ? [239, 68, 68] : [16, 185, 129];
      pdf.setTextColor(varColor[0], varColor[1], varColor[2]);
      pdf.text(`${cat.variacao_mensal > 0 ? '+' : ''}${cat.variacao_mensal}%`, xPos, yPos);
      pdf.setTextColor(0, 0, 0);

      yPos += 6;

      // Adicionar linha divisória sutil
      pdf.setDrawColor(240, 240, 240);
      pdf.line(20, yPos - 2, pageWidth - 15, yPos - 2);
    });

    yPos += 15;

    // Análise de anomalias
    const anomalias = analysis.alertas?.filter((a: any) => a.tipo === 'info' && a.mensagem.includes('atípicas'));
    if (anomalias?.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TRANSAÇÕES ATÍPICAS DETECTADAS', 20, yPos);
      yPos += 10;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      anomalias.slice(0, 5).forEach((anomalia: any) => {
        pdf.text(`• ${anomalia.mensagem}`, 25, yPos);
        yPos += 6;
      });
    }

    // Economia potencial
    yPos += 10;
    const economiaTotal = analysis.alertas?.reduce((sum: number, alert: any) => 
      sum + (alert.impacto_estimado || 0), 0) || 0;

    if (economiaTotal > 0) {
      pdf.setFillColor(16, 185, 129);
      // @ts-ignore - GState opacity
      pdf.setGState(new (pdf as any).GState({ opacity: 0.1 }));
      pdf.roundedRect(20, yPos - 5, 175, 30, 3, 3, 'F');
      // @ts-ignore - GState opacity
      pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

      pdf.setTextColor(16, 185, 129);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('POTENCIAL DE ECONOMIA IDENTIFICADO', 25, yPos + 5);
      
      pdf.setFontSize(16);
      pdf.text(`R$ ${economiaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, yPos + 18);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Equivalente a ${((economiaTotal / analysis.total_gasto) * 100).toFixed(1)}% do total analisado`, 90, yPos + 18);
    }
  }

  private static async addRecommendations(pdf: jsPDF, analysis: any, scoreData: any) {
    let yPos = 30;
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Título
    pdf.setTextColor(16, 185, 129);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RECOMENDAÇÕES E PRÓXIMOS PASSOS', 20, yPos);
    yPos += 15;

    // Recomendações prioritárias
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AÇÕES PRIORITÁRIAS', 20, yPos);
    yPos += 10;

    const recomendacoes = scoreData?.recomendacoes || [];
    const alertasUrgentes = analysis.alertas?.filter((a: any) => a.tipo === 'urgent') || [];

    // Combinar recomendações
    const todasRecomendacoes = [
      ...recomendacoes.map((r: any) => ({
        categoria: r.categoria,
        acao: r.acao,
        prioridade: r.prioridade || 'alta',
        economia: r.impacto_financeiro
      })),
      ...alertasUrgentes.map((a: any) => ({
        categoria: a.categoria,
        acao: a.acao_sugerida,
        prioridade: 'urgente',
        economia: a.impacto_estimado
      }))
    ].slice(0, 5);

    todasRecomendacoes.forEach((rec: any, index: number) => {
      // Card de recomendação
      const cardColor = rec.prioridade === 'urgente' ? [239, 68, 68] : 
                       rec.prioridade === 'alta' ? [245, 158, 11] : [16, 185, 129];
      
      pdf.setFillColor(cardColor[0], cardColor[1], cardColor[2]);
      // @ts-ignore - GState opacity
      pdf.setGState(new (pdf as any).GState({ opacity: 0.1 }));
      pdf.roundedRect(20, yPos - 3, 175, 25, 3, 3, 'F');
      // @ts-ignore - GState opacity
      pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

      // Número
      pdf.setFillColor(cardColor[0], cardColor[1], cardColor[2]);
      pdf.circle(30, yPos + 7, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text((index + 1).toString(), 30, yPos + 9, { align: 'center' });

      // Categoria
      pdf.setTextColor(cardColor[0], cardColor[1], cardColor[2]);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(rec.categoria, 45, yPos + 3);

      // Ação
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const acao = this.wrapText(pdf, rec.acao, 140);
      pdf.text(acao[0], 45, yPos + 10);
      if (acao[1]) {
        pdf.text(acao[1], 45, yPos + 15);
      }

      // Economia potencial
      if (rec.economia && rec.economia > 0) {
        pdf.setTextColor(16, 185, 129);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Economia: R$ ${rec.economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 45, yPos + 20);
      }

      yPos += 30;
    });

    yPos += 10;

    // Timeline de implementação
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CRONOGRAMA SUGERIDO', 20, yPos);
    yPos += 10;

    const timeline = [
      { periodo: 'IMEDIATO (0-7 dias)', icone: '[!]', acoes: ['Revisar contratos urgentes', 'Negociar dívidas'] },
      { periodo: 'CURTO PRAZO (8-30 dias)', icone: '[>]', acoes: ['Implementar controles', 'Otimizar processos'] },
      { periodo: 'MÉDIO PRAZO (31-90 dias)', icone: '[=]', acoes: ['Avaliar resultados', 'Ajustar estratégias'] },
      { periodo: 'LONGO PRAZO (90+ dias)', icone: '[+]', acoes: ['Consolidar melhorias', 'Planejar expansão'] }
    ];

    pdf.setFontSize(9);
    timeline.forEach(fase => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${fase.icone} ${fase.periodo}`, 25, yPos);
      yPos += 6;
      
      pdf.setFont('helvetica', 'normal');
      fase.acoes.forEach(acao => {
        pdf.text(`  • ${acao}`, 30, yPos);
        yPos += 5;
      });
      yPos += 3;
    });

    // Footer motivacional
    yPos = pdf.internal.pageSize.getHeight() - 40;
    pdf.setFillColor(16, 185, 129);
    // @ts-ignore - GState opacity
    pdf.setGState(new (pdf as any).GState({ opacity: 0.1 }));
    pdf.roundedRect(20, yPos - 5, 175, 25, 3, 3, 'F');
    // @ts-ignore - GState opacity
    pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

    pdf.setTextColor(16, 185, 129);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('>>> Juntos por uma gestão rural mais eficiente! <<<', pageWidth/2, yPos + 8, { align: 'center' });
  }

  // Métodos auxiliares

  private static getCategoryIcon(categoryName: string): string {
    const icons: { [key: string]: string } = {
      'EMPRÉSTIMO': this.EMOJIS.bank,
      'CAPITAL': this.EMOJIS.money,
      'MÃO DE OBRA': this.EMOJIS.tools,
      'COMBUSTÍVEL': this.EMOJIS.tractor,
      'COMPRA': this.EMOJIS.credit_card,
      'MANUTENÇÃO': this.EMOJIS.tools,
      'ENERGIA': this.EMOJIS.lightbulb,
      'ALIMENTAÇÃO': this.EMOJIS.corn,
      'VETERINÁRIO': this.EMOJIS.cow,
      'SEMENTES': this.EMOJIS.seeds,
      'FERTILIZANTE': this.EMOJIS.plant,
      'DEFENSIVO': this.EMOJIS.shield
    };

    for (const [key, icon] of Object.entries(icons)) {
      if (categoryName.toUpperCase().includes(key)) {
        return icon;
      }
    }
    return this.EMOJIS.chart;
  }

  private static getScoreEmoji(score: number): string {
    if (score >= 80) return this.EMOJIS.star;
    if (score >= 60) return this.EMOJIS.success;
    if (score >= 40) return this.EMOJIS.warning;
    return this.EMOJIS.danger;
  }

  private static getScoreMessage(score: number): string {
    if (score >= 80) return 'Excelente gestão financeira!';
    if (score >= 60) return 'Boa saúde financeira';
    if (score >= 40) return 'Atenção necessária';
    return 'Situação crítica';
  }

  private static getScoreBar(score: number): string {
    const filled = Math.round(score / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  private static calcularDias(inicio: string, fim: string): number {
    const [diaI, mesI, anoI] = inicio.split('/').map(Number);
    const [diaF, mesF, anoF] = fim.split('/').map(Number);
    const dataInicio = new Date(anoI, mesI - 1, diaI);
    const dataFim = new Date(anoF, mesF - 1, diaF);
    const diffTime = Math.abs(dataFim.getTime() - dataInicio.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private static hexToRgb(hex: string): number[] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }

  private static async createPieChart(categorias: any[]): Promise<string | null> {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');

      if (!ctx) return null;

      const colors = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6'];
      const data = categorias.slice(0, 5).map(cat => cat.percentual);
      const labels = categorias.slice(0, 5).map(cat => cat.nome);

      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors,
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  return `${context.label}: ${context.parsed}%`;
                }
              }
            }
          }
        }
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Erro ao criar gráfico de pizza:', error);
      return null;
    }
  }

  private static async createMonthlyBarChart(evolucao: any): Promise<string | null> {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');

      if (!ctx) return null;

      // Preparar dados mensais agregados
      const monthlyTotals: { [key: string]: number } = {};
      
      Object.entries(evolucao).forEach(([_categoria, meses]: [string, any]) => {
        meses.forEach((mes: any) => {
          if (!monthlyTotals[mes.mes]) {
            monthlyTotals[mes.mes] = 0;
          }
          monthlyTotals[mes.mes] += mes.valor;
        });
      });

      const sortedMonths = Object.keys(monthlyTotals).sort();
      const values = sortedMonths.map(month => monthlyTotals[month]);

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: sortedMonths.map(m => {
            const [year, month] = m.split('-');
            return `${month}/${year.substring(2)}`;
          }),
          datasets: [{
            label: 'Total Mensal',
            data: values,
            backgroundColor: '#10B981',
            borderColor: '#059669',
            borderWidth: 1
          }]
        },
        options: {
          responsive: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => {
                  return `R$ ${(Number(value) / 1000).toFixed(0)}k`;
                }
              }
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Erro ao criar gráfico de barras:', error);
      return null;
    }
  }

  private static wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const textWidth = pdf.getTextWidth(testLine);
      
      if (textWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Copia texto para clipboard
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Erro ao copiar texto:', error);
      return false;
    }
  }

  /**
   * Abre WhatsApp Web com texto pré-preenchido
   */
  static openWhatsApp(text: string, phone?: string): void {
    const encodedText = encodeURIComponent(text);
    const phoneParam = phone ? `?phone=${phone}&` : '?';
    const url = `https://web.whatsapp.com/send${phoneParam}text=${encodedText}`;
    
    window.open(url, '_blank');
  }

  /**
   * Gera link curto para compartilhamento (placeholder)
   */
  static async generateShareableLink(_data: EnhancedExportData): Promise<string> {
    // Esta seria uma integração com um serviço de encurtamento de URL
    // Por enquanto, retorna um link fictício
    const baseUrl = 'https://ruralinsights.com.br/relatorio';
    const reportId = Date.now().toString(36);
    return `${baseUrl}/${reportId}`;
  }
}