import OpenAI from 'openai';
import { encoding_for_model } from 'tiktoken';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { PageContent } from '../types';
import { costTracker } from './costTracker';
import { promptService } from './promptService';

interface RefinedContent {
  url: string;
  originalLength: number;
  refinedSummary: string;
  keyPoints: string[];
  refinementSuccess: boolean;
  refinementStats: {
    totalChunks: number;
    successful: number;
    failed: number;
  };
}

class ContentRefinementService {
  private openai: OpenAI | null = null;
  private tokenizer: any = null;
  
  constructor() {
    // Lazy initialization
  }
  
  private initializeIfNeeded() {
    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey || apiKey.trim() === '') {
        throw new AppError('OpenAI API key not configured', 500, 'OPENAI_KEY_MISSING');
      }
      
      this.openai = new OpenAI({
        apiKey: apiKey.trim()
      });
      
      // Initialize tokenizer for gpt-4o-mini (use gpt-4 tokenizer as closest match)
      this.tokenizer = encoding_for_model('gpt-4o');
      
      logger.info('Content Refinement Service initialized with OpenAI and tiktoken');
    }
  }
  
  /**
   * Count tokens in text using tiktoken
   */
  private countTokens(text: string): number {
    if (!this.tokenizer) {
      this.initializeIfNeeded();
    }
    return this.tokenizer.encode(text).length;
  }
  
  /**
   * Split content into chunks based on logical boundaries (H2 headings) or token count
   */
  private splitIntoChunks(content: string, maxChunkTokens: number = 4000): string[] {
    const totalTokens = this.countTokens(content);
    if (totalTokens <= maxChunkTokens) {
      return [content];
    }
    
    const chunks: string[] = [];
    
    // Try to split by H2 headings first
    const h2Sections = content.split(/\n## /);
    
    if (h2Sections.length > 1) {
      // We have H2 sections, process each one
      for (let i = 0; i < h2Sections.length; i++) {
        let section = h2Sections[i];
        
        // Add back the H2 marker (except for the first section)
        if (i > 0) {
          section = '## ' + section;
        }
        
        const sectionTokens = this.countTokens(section);
        if (sectionTokens <= maxChunkTokens) {
          chunks.push(section);
        } else {
          // Section is still too large, split by token count
          chunks.push(...this.splitByTokenCount(section, maxChunkTokens));
        }
      }
    } else {
      // No H2 sections, split by token count
      chunks.push(...this.splitByTokenCount(content, maxChunkTokens));
    }
    
    return chunks.filter(chunk => {
      const tokens = this.countTokens(chunk.trim());
      return tokens > 50; // Filter out tiny chunks (less than 50 tokens)
    });
  }
  
  private splitByTokenCount(content: string, maxChunkTokens: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    
    const paragraphs = content.split('\n\n');
    
    for (const paragraph of paragraphs) {
      const potentialChunk = currentChunk + (currentChunk ? '\n\n' : '') + paragraph;
      const potentialTokens = this.countTokens(potentialChunk);
      
      if (potentialTokens <= maxChunkTokens) {
        currentChunk = potentialChunk;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = paragraph;
        } else {
          // Single paragraph is too long, force split by sentences
          const sentences = paragraph.split(/[。！？.!?]+/);
          let sentenceChunk = '';
          
          for (const sentence of sentences) {
            if (!sentence.trim()) continue;
            
            const potentialSentence = sentenceChunk + (sentenceChunk ? '。' : '') + sentence;
            const sentenceTokens = this.countTokens(potentialSentence);
            
            if (sentenceTokens <= maxChunkTokens) {
              sentenceChunk = potentialSentence;
            } else {
              if (sentenceChunk) {
                chunks.push(sentenceChunk);
                sentenceChunk = sentence;
              } else {
                // Single sentence is too long, truncate
                chunks.push(sentence.substring(0, Math.floor(sentence.length * 0.8)));
              }
            }
          }
          
          if (sentenceChunk) {
            currentChunk = sentenceChunk;
          }
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }
  
  /**
   * Refine a single text chunk using the content refinement prompt
   */
  private async refineChunk(chunk: string, jobId?: string): Promise<{ success: boolean; content: string; error?: string }> {
    this.initializeIfNeeded();
    
    // v2.0 使用標準化 Prompt 服務
    const refinementPrompt = promptService.renderPrompt('content_refinement', {
      content: chunk
    });

    if (!refinementPrompt) {
      logger.error('Failed to render content refinement prompt');
      return {
        success: false,
        content: chunk,
        error: 'Prompt rendering failed'
      };
    }

    // 獲取 Prompt 元數據以配置 API 調用
    const promptMeta = promptService.getPromptMetadata('content_refinement');
    const maxResponseTokens = promptMeta?.maxTokens || 1500;
    const temperature = promptMeta?.temperature || 0.3;

    // Check token count before sending - gpt-4o-mini has 128K context window
    const promptTokens = this.countTokens(refinementPrompt);
    const safetyMargin = 1000;
    const maxTotalTokens = 32000; // Conservative limit for gpt-4o-mini (much higher capacity)
    
    if (promptTokens + maxResponseTokens + safetyMargin > maxTotalTokens) {
      logger.warn(`Chunk too large for refinement: ${promptTokens} tokens. Returning original chunk (truncated).`);
      return {
        success: false,
        content: chunk.substring(0, Math.floor(chunk.length * 0.5)), // Return first half as fallback
        error: 'Chunk too large for refinement'
      };
    }

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: refinementPrompt }
        ],
        temperature,
        max_tokens: maxResponseTokens
      });

      // v5.1 新增：成本追蹤
      if (response.usage && jobId) {
        costTracker.recordContentRefinementCost(
          jobId,
          response.usage.prompt_tokens,
          response.usage.completion_tokens
        );
      }
      
      const refinedContent = response.choices[0]?.message?.content || '';
      return {
        success: true,
        content: refinedContent
      };
    } catch (error: any) {
      logger.warn(`Failed to refine chunk (${promptTokens} tokens):`, error.message);
      // Return original chunk as fallback instead of throwing
      return {
        success: false,
        content: chunk,
        error: error.message
      };
    }
  }
  
  /**
   * Refine a single page content using parallel chunk processing
   */
  async refinePage(pageContent: PageContent, jobId?: string): Promise<RefinedContent> {
    this.initializeIfNeeded();
    
    const { url, cleanedContent } = pageContent;
    const originalLength = cleanedContent.length;
    
    logger.info(`Refining content for ${url}: ${originalLength} characters`);
    
    // Step 1: Split into chunks
    const chunks = this.splitIntoChunks(cleanedContent);
    logger.info(`Split into ${chunks.length} chunks for ${url}`);
    
    // Step 2: Parallel refinement of chunks with error handling
    const refinementPromises = chunks.map(chunk => this.refineChunk(chunk, jobId));
    const refinementResults = await Promise.all(refinementPromises);
    
    // Count successes and failures
    const successfulRefinements = refinementResults.filter(r => r.success).length;
    const failedRefinements = refinementResults.filter(r => !r.success).length;
    
    logger.info(`Refinement results for ${url}: ${successfulRefinements} successful, ${failedRefinements} failed`);
    
    // Step 3: Aggregate refined content (use original if refinement failed)
    const refinedSummary = refinementResults
      .map(result => result.content)
      .filter(content => content.trim().length > 0)
      .join('\n\n');
    
    // Extract key points from refined summary
    const keyPoints = refinedSummary
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim())
      .filter(point => point.length > 10);
    
    logger.info(`Refined ${url}: ${originalLength} → ${refinedSummary.length} chars, ${keyPoints.length} key points (${successfulRefinements}/${chunks.length} chunks refined)`);
    
    return {
      url,
      originalLength,
      refinedSummary,
      keyPoints,
      refinementSuccess: successfulRefinements > 0,
      refinementStats: {
        totalChunks: chunks.length,
        successful: successfulRefinements,
        failed: failedRefinements
      }
    };
  }
  
  /**
   * Refine multiple pages in parallel
   */
  async refineMultiplePages(pages: PageContent[], jobId?: string): Promise<RefinedContent[]> {
    logger.info(`Starting parallel refinement of ${pages.length} pages`);
    
    const refinementPromises = pages.map(page => this.refinePage(page, jobId));
    const results = await Promise.all(refinementPromises);
    
    const totalOriginal = results.reduce((sum, r) => sum + r.originalLength, 0);
    const totalRefined = results.reduce((sum, r) => sum + r.refinedSummary.length, 0);
    const compressionRatio = ((1 - totalRefined / totalOriginal) * 100).toFixed(1);
    
    const totalSuccessfulRefinements = results.reduce((sum, r) => sum + r.refinementStats.successful, 0);
    const totalFailedRefinements = results.reduce((sum, r) => sum + r.refinementStats.failed, 0);
    const pagesWithFailures = results.filter(r => r.refinementStats.failed > 0).length;
    
    logger.info(`Content refinement completed: ${totalOriginal} → ${totalRefined} chars (${compressionRatio}% compression)`);
    logger.info(`Refinement stats: ${totalSuccessfulRefinements} successful, ${totalFailedRefinements} failed chunks. ${pagesWithFailures}/${pages.length} pages had failures.`);
    
    return results;
  }

  /**
   * 公共方法：精煉單個內容塊（用於測試）
   */
  async refineChunkPublic(content: string, jobId?: string): Promise<{ success: boolean; content: string; error?: string }> {
    return this.refineChunk(content, jobId);
  }
}

export const contentRefinementService = new ContentRefinementService();