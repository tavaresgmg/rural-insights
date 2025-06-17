import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportData {
  analysis?: any;
  scoreData?: any;
  timestamp?: string;
}

export class ExportService {
  
  /**
   * Gera texto formatado para WhatsApp (max 4096 caracteres)
   */
  static generateWhatsAppText(data: ExportData): string {
    const { analysis, scoreData } = data;
    
    if (!analysis) return '';

    const timestamp = new Date().toLocaleDateString('pt-BR');
    const economiaTotal = analysis.alertas?.reduce((sum: number, alert: any) => 
      sum + (alert.impacto_estimado || 0), 0) || 0;

    const texto = `🌾 *RELATÓRIO FINANCEIRO RURAL* 🌾
📅 ${timestamp}

💰 *RESUMO EXECUTIVO*
• Total Gasto: R$ ${analysis.total_gasto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Transações: ${analysis.numero_transacoes}
• Período: ${analysis.periodo_analise?.inicio} - ${analysis.periodo_analise?.fim}

${scoreData ? `🎯 *SCORE DE SAÚDE FINANCEIRA*
• Score: ${scoreData.score_total}/100 (${scoreData.nivel})
• Posição: ${scoreData.benchmark?.posicao_regional}
• Tendência: ${scoreData.tendencia?.direcao} (${scoreData.tendencia?.variacao > 0 ? '+' : ''}${scoreData.tendencia?.variacao}%)

📊 *COMPONENTES DO SCORE*
• Liquidez: ${scoreData.componentes?.liquidez?.score}/100 (${scoreData.componentes?.liquidez?.meses_cobertura} meses)
• Endividamento: ${scoreData.componentes?.endividamento?.score}/100 (${scoreData.componentes?.endividamento?.percentual_receita}%)
• Eficiência: ${scoreData.componentes?.eficiencia?.score}/100

` : ''}📈 *TOP 5 CATEGORIAS*
${analysis.top_categorias?.slice(0, 5).map((cat: any, i: number) => 
  `${i + 1}. ${cat.nome}: R$ ${cat.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${cat.percentual}%)`
).join('\n') || ''}

${analysis.alertas?.length > 0 ? `🚨 *PRINCIPAIS ALERTAS*
${analysis.alertas.slice(0, 3).map((alert: any) => 
  `• ${alert.categoria}: ${alert.mensagem.substring(0, 80)}${alert.mensagem.length > 80 ? '...' : ''}`
).join('\n')}

💡 *ECONOMIA POTENCIAL*
R$ ${economiaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} anuais

` : ''}🎯 *PRÓXIMAS AÇÕES*
${scoreData?.recomendacoes?.slice(0, 2).map((rec: any) => 
  `• ${rec.categoria}: ${rec.acao.substring(0, 100)}${rec.acao.length > 100 ? '...' : ''}`
).join('\n') || analysis.alertas?.slice(0, 2).map((alert: any) => 
  `• ${alert.acao_sugerida?.substring(0, 100)}${(alert.acao_sugerida?.length || 0) > 100 ? '...' : ''}`
).join('\n') || ''}

--
📱 Gerado por Rural Insights
🌐 Análise com IA especializada em agronegócio`;

    // Trunca se exceder 4096 caracteres
    return texto.length > 4096 ? texto.substring(0, 4093) + '...' : texto;
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
   * Gera PDF profissional do relatório
   */
  static async generatePDF(data: ExportData): Promise<void> {
    const { analysis, scoreData } = data;
    
    if (!analysis) {
      throw new Error('Dados de análise não disponíveis para exportação');
    }

    try {
      // Cria novo documento PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let yPosition = 20;

      // === CABEÇALHO ===
      pdf.setFillColor(16, 185, 129); // verde-safra
      pdf.rect(0, 0, pageWidth, 25, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('🌾 RELATÓRIO FINANCEIRO RURAL', 20, 15);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const timestamp = new Date().toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.text(`Gerado em: ${timestamp}`, pageWidth - 60, 15);

      yPosition = 40;

      // === RESUMO EXECUTIVO ===
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RESUMO EXECUTIVO', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const resumoLines = [
        `Período: ${analysis.periodo_analise?.inicio} - ${analysis.periodo_analise?.fim}`,
        `Total de Transações: ${analysis.numero_transacoes}`,
        `Total Gasto: R$ ${analysis.total_gasto?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `Maior Categoria: ${analysis.top_categorias?.[0]?.nome} (${analysis.top_categorias?.[0]?.percentual}%)`
      ];

      resumoLines.forEach(line => {
        pdf.text(line, 20, yPosition);
        yPosition += 6;
      });

      yPosition += 10;

      // === SCORE DE SAÚDE FINANCEIRA ===
      if (scoreData) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SCORE DE SAÚDE FINANCEIRA', 20, yPosition);
        yPosition += 10;

        // Score principal com fundo colorido
        const scoreColor = scoreData.score_total >= 80 ? [16, 185, 129] : 
                          scoreData.score_total >= 60 ? [245, 158, 11] : 
                          scoreData.score_total >= 40 ? [249, 115, 22] : [239, 68, 68];
        
        pdf.setFillColor(...scoreColor);
        pdf.roundedRect(20, yPosition - 5, 50, 15, 3, 3, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${scoreData.score_total}/100`, 30, yPosition + 5);
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.text(scoreData.nivel, 80, yPosition + 5);
        
        yPosition += 20;

        // Componentes do score
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        const componentes = [
          `Liquidez: ${scoreData.componentes?.liquidez?.score}/100 (${scoreData.componentes?.liquidez?.status})`,
          `Endividamento: ${scoreData.componentes?.endividamento?.score}/100 (${scoreData.componentes?.endividamento?.status})`,
          `Eficiência: ${scoreData.componentes?.eficiencia?.score}/100 (${scoreData.componentes?.eficiencia?.status})`
        ];

        componentes.forEach(comp => {
          pdf.text(`• ${comp}`, 25, yPosition);
          yPosition += 6;
        });

        yPosition += 10;
      }

      // === TOP CATEGORIAS ===
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PRINCIPAIS CATEGORIAS DE GASTOS', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      // Tabela de categorias
      const tableData = analysis.top_categorias?.slice(0, 5).map((cat: any, index: number) => [
        `${index + 1}°`,
        cat.nome,
        `R$ ${cat.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `${cat.percentual}%`
      ]) || [];

      // Headers
      pdf.setFont('helvetica', 'bold');
      const headers = ['#', 'Categoria', 'Valor', '%'];
      const colWidths = [15, 80, 40, 25];
      let xPosition = 20;

      pdf.setFillColor(240, 240, 240);
      pdf.rect(20, yPosition - 3, 160, 8, 'F');

      headers.forEach((header, i) => {
        pdf.text(header, xPosition, yPosition + 2);
        xPosition += colWidths[i];
      });

      yPosition += 10;

      // Data rows
      pdf.setFont('helvetica', 'normal');
      tableData.forEach((row: string[]) => {
        xPosition = 20;
        row.forEach((cell, i) => {
          pdf.text(cell, xPosition, yPosition);
          xPosition += colWidths[i];
        });
        yPosition += 6;
      });

      yPosition += 15;

      // === INSIGHTS E ALERTAS ===
      if (analysis.alertas?.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('INSIGHTS E RECOMENDAÇÕES', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');

        const topAlerts = analysis.alertas.slice(0, 3);
        topAlerts.forEach((alert: any, index: number) => {
          // Verifica se precisa de nova página
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
          }

          const icon = alert.tipo === 'urgent' ? '🚨' : 
                      alert.tipo === 'warning' ? '⚠️' : '💡';
          
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${icon} ${alert.categoria}`, 20, yPosition);
          yPosition += 6;

          pdf.setFont('helvetica', 'normal');
          const mensagem = this.wrapText(pdf, alert.mensagem, 170);
          mensagem.forEach(line => {
            pdf.text(line, 25, yPosition);
            yPosition += 5;
          });

          if (alert.impacto_estimado > 0) {
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Economia Potencial: R$ ${alert.impacto_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, yPosition);
            yPosition += 6;
          }

          yPosition += 8;
        });
      }

      // === RODAPÉ ===
      const finalY = pageHeight - 20;
      pdf.setFillColor(16, 185, 129);
      pdf.rect(0, finalY, pageWidth, 20, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Rural Insights - Análise Financeira Rural com IA', 20, finalY + 10);
      pdf.text('🌐 ruralinsights.com.br', pageWidth - 40, finalY + 10);

      // Salva o PDF
      const filename = `relatorio-rural-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Falha na geração do PDF. Tente novamente.');
    }
  }

  /**
   * Captura screenshot de um elemento para incluir no PDF
   */
  static async captureElement(elementId: string): Promise<string> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Elemento ${elementId} não encontrado`);
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      return canvas.toDataURL('image/jpeg', 0.95);
    } catch (error) {
      console.error('Erro ao capturar elemento:', error);
      return '';
    }
  }

  /**
   * Quebra texto em linhas para caber na largura especificada
   */
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
}