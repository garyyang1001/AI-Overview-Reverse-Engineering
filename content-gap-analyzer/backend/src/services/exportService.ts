import puppeteer from 'puppeteer';
import { AnalysisReportWithMetadata, ActionItem, SourceAnalysis } from '../shared/types';
import logger from '../utils/logger';

export class ExportService {
  /**
   * Generate PDF from analysis report
   */
  async generatePDF(report: AnalysisReportWithMetadata): Promise<Buffer> {
    try {
      const html = this.generateHTML(report);
      
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        displayHeaderFooter: true,
        headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; margin: 0;">AI SEO Content Gap Analyzer Report</div>',
        footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; margin: 0;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
      });
      
      await browser.close();
      
      return Buffer.from(pdf);
    } catch (error) {
      logger.error('PDF generation failed:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  /**
   * Generate HTML report with inline styles
   */
  generateHTML(report: AnalysisReportWithMetadata): string {
    const formatDate = (timestamp: string) => {
      return new Date(timestamp).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const escapeHtml = (text: string): string => {
      const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, m => map[m]);
    };

    const renderActionItem = (item: ActionItem): string => `
      <div class="action-item">
        <h4>改善建議：</h4>
        <p>${escapeHtml(item.recommendation)}</p>
        <h4>Gemini Prompt：</h4>
        <pre class="prompt">${escapeHtml(item.geminiPrompt)}</pre>
      </div>
    `;

    const renderSourceAnalysis = (source: SourceAnalysis): string => `
      <div class="source-analysis">
        <h4>網址：${escapeHtml(source.url)}</h4>
        <p><strong>內容摘要：</strong> ${escapeHtml(source.contentSummary)}</p>
        <p><strong>對 AI 摘要的貢獻：</strong> ${escapeHtml(source.contribution)}</p>
        <div class="eeat">
          <h5>E-E-A-T 分析：</h5>
          <ul>
            <li><strong>經驗 (Experience)：</strong> ${escapeHtml(source.eeatAnalysis.experience)}</li>
            <li><strong>專業 (Expertise)：</strong> ${escapeHtml(source.eeatAnalysis.expertise)}</li>
            <li><strong>權威 (Authoritativeness)：</strong> ${escapeHtml(source.eeatAnalysis.authoritativeness)}</li>
            <li><strong>信賴 (Trustworthiness)：</strong> ${escapeHtml(source.eeatAnalysis.trustworthiness)}</li>
          </ul>
        </div>
      </div>
    `;

    return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI SEO Content Gap Analysis Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    
    .container {
      background-color: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    h1, h2, h3, h4, h5 {
      color: #1a1a1a;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    
    h1 {
      color: #0066cc;
      border-bottom: 3px solid #0066cc;
      padding-bottom: 10px;
    }
    
    h2 {
      color: #0052a3;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 8px;
    }
    
    h3 {
      color: #004080;
    }
    
    .metadata {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 30px;
    }
    
    .metadata p {
      margin: 5px 0;
    }
    
    .action-item {
      background-color: #f0f7ff;
      border-left: 4px solid #0066cc;
      padding: 15px;
      margin: 15px 0;
      border-radius: 0 5px 5px 0;
    }
    
    .prompt {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      white-space: pre-wrap;
      word-wrap: break-word;
      border: 1px solid #ddd;
    }
    
    .source-analysis {
      background-color: #fafafa;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
      border: 1px solid #e0e0e0;
    }
    
    .eeat {
      margin-top: 10px;
      padding-left: 20px;
    }
    
    .eeat ul {
      list-style-type: disc;
      margin-left: 20px;
    }
    
    .content-gap {
      background-color: #fff5f5;
      border-left: 4px solid #ff6b6b;
      padding: 10px 15px;
      margin: 10px 0;
      border-radius: 0 5px 5px 0;
    }
    
    .quality-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: bold;
      margin-left: 10px;
    }
    
    .quality-high { background-color: #d4edda; color: #155724; }
    .quality-medium { background-color: #fff3cd; color: #856404; }
    .quality-low { background-color: #f8d7da; color: #721c24; }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      color: #666;
    }
    
    .footer a {
      color: #0066cc;
      text-decoration: none;
    }
    
    .footer a:hover {
      text-decoration: underline;
    }
    
    @media print {
      body {
        background-color: white;
      }
      .container {
        box-shadow: none;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>AI SEO Content Gap Analysis Report</h1>
    
    <div class="metadata">
      <p><strong>分析 ID：</strong> ${escapeHtml(report.analysisId)}</p>
      <p><strong>生成時間：</strong> ${formatDate(report.timestamp)}</p>
      ${report.targetKeyword ? `<p><strong>目標關鍵字：</strong> ${escapeHtml(report.targetKeyword)}</p>` : ''}
      ${report.userPageUrl ? `<p><strong>目標網址：</strong> <a href="${escapeHtml(report.userPageUrl)}" target="_blank">${escapeHtml(report.userPageUrl)}</a></p>` : ''}
      <p><strong>分析品質：</strong> 
        <span class="quality-badge quality-${report.qualityAssessment?.level || 'medium'}">
          ${report.qualityAssessment?.score || 0}分 - ${report.qualityAssessment?.level?.toUpperCase() || 'N/A'}
        </span>
      </p>
    </div>
    
    <h2>第一部分：綜合戰略與改善計畫</h2>
    
    <h3>P1 - 立即執行（高影響力、低執行難度）</h3>
    ${report.strategyAndPlan.p1_immediate.map(renderActionItem).join('')}
    
    <h3>P2 - 中期規劃（高影響力、高執行難度）</h3>
    ${report.strategyAndPlan.p2_mediumTerm.map(renderActionItem).join('')}
    
    <h3>P3 - 長期優化（持續進行）</h3>
    ${report.strategyAndPlan.p3_longTerm.map(renderActionItem).join('')}
    
    <h2>第二部分：關鍵字意圖分析</h2>
    <h3>大家最想知道什麼</h3>
    <p>${escapeHtml(report.keywordIntent.coreIntent)}</p>
    
    <h3>他們還可能想知道什麼</h3>
    <ul>
      ${report.keywordIntent.latentIntents.map(intent => 
        `<li>${escapeHtml(intent)}</li>`
      ).join('')}
    </ul>
    
    <h2>第三部分：Google AI 怎麼看</h2>
    <h3>AI 摘要了什麼？</h3>
    <p>${escapeHtml(report.aiOverviewAnalysis.summary)}</p>
    
    <h3>Google AI 為什麼這樣呈現？</h3>
    <p>${escapeHtml(report.aiOverviewAnalysis.presentationAnalysis)}</p>
    
    <h2>第四部分：Google AI 參考了誰？</h2>
    ${report.citedSourceAnalysis.map(renderSourceAnalysis).join('')}
    
    <h2>第五部分：你的網址現況評估</h2>
    <h3>內容摘要</h3>
    <p>${escapeHtml(report.websiteAssessment.contentSummary)}</p>
    
    <h3>內容缺口</h3>
    ${report.websiteAssessment.contentGaps.map(gap => 
      `<div class="content-gap">${escapeHtml(gap)}</div>`
    ).join('')}
    
    <h3>頁面體驗</h3>
    <p>${escapeHtml(report.websiteAssessment.pageExperience)}</p>
    
    <h3>結構化資料建議</h3>
    <p>${escapeHtml(report.websiteAssessment.structuredDataRecs)}</p>
    
    <div class="footer">
      <p>${escapeHtml(report.reportFooter)}</p>
      <p>
        <strong>好事發生數位有限公司</strong><br>
        Email: <a href="mailto:gary@ohya.co">gary@ohya.co</a><br>
        Threads: <a href="https://www.threads.net/@ohya.studio" target="_blank">@ohya.studio</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

export const exportService = new ExportService();