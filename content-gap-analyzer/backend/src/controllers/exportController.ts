import { Request, Response } from 'express';
import { queueService } from '../services/queueService';
import { exportService } from '../services/exportService';
import logger from '../utils/logger';
import { AnalysisReportWithMetadata } from '../shared/types';

export class ExportController {
  /**
   * Export analysis report as PDF
   */
  async exportPDF(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      
      if (!jobId) {
        res.status(400).json({ error: 'Job ID is required' });
        return;
      }

      // Get job status from queue
      const jobStatus = await queueService.getJobStatus(jobId);
      
      if (!jobStatus) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }

      if (jobStatus.status !== 'completed' && jobStatus.status !== 'completed_with_errors') {
        res.status(400).json({ 
          error: 'Report is not ready yet', 
          status: jobStatus.status 
        });
        return;
      }

      if (!jobStatus.data) {
        res.status(404).json({ error: 'Report data not found' });
        return;
      }

      // Generate PDF
      const report: AnalysisReportWithMetadata = jobStatus.data as AnalysisReportWithMetadata;
      const pdfBuffer = await exportService.generatePDF(report);

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition', 
        `attachment; filename="seo-analysis-${jobId}-${new Date().toISOString().split('T')[0]}.pdf"`
      );
      res.setHeader('Content-Length', pdfBuffer.length.toString());

      // Send PDF
      res.send(pdfBuffer);
      
      logger.info(`PDF exported successfully for job ${jobId}`);
    } catch (error) {
      logger.error('PDF export error:', error);
      res.status(500).json({ 
        error: 'Failed to export PDF',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Export analysis report as HTML
   */
  async exportHTML(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      
      if (!jobId) {
        res.status(400).json({ error: 'Job ID is required' });
        return;
      }

      // Get job status from queue
      const jobStatus = await queueService.getJobStatus(jobId);
      
      if (!jobStatus) {
        res.status(404).json({ error: 'Job not found' });
        return;
      }

      if (jobStatus.status !== 'completed' && jobStatus.status !== 'completed_with_errors') {
        res.status(400).json({ 
          error: 'Report is not ready yet', 
          status: jobStatus.status 
        });
        return;
      }

      if (!jobStatus.data) {
        res.status(404).json({ error: 'Report data not found' });
        return;
      }

      // Generate HTML
      const report: AnalysisReportWithMetadata = jobStatus.data as AnalysisReportWithMetadata;
      const html = exportService.generateHTML(report);

      // Set response headers
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader(
        'Content-Disposition', 
        `attachment; filename="seo-analysis-${jobId}-${new Date().toISOString().split('T')[0]}.html"`
      );

      // Send HTML
      res.send(html);
      
      logger.info(`HTML exported successfully for job ${jobId}`);
    } catch (error) {
      logger.error('HTML export error:', error);
      res.status(500).json({ 
        error: 'Failed to export HTML',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const exportController = new ExportController();