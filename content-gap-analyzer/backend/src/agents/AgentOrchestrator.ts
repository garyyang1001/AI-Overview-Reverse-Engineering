/**
 * Agent Orchestrator
 * Coordinates multiple agents to fix TypeScript errors
 */

import { EventEmitter } from 'events';
import { BaseAgent, AgentMessage } from './BaseAgent';
import { ErrorAnalysisAgent } from './ErrorAnalysisAgent';
import { CodeFixAgent } from './CodeFixAgent';
import { CodeReviewAgent } from './CodeReviewAgent';
import { TestingAgent } from './TestingAgent';
import logger from '../utils/logger';

interface WorkflowResult {
  success: boolean;
  errorAnalysis?: any;
  fixes?: any;
  review?: any;
  testResults?: any;
  duration: number;
  steps: WorkflowStep[];
}

interface WorkflowStep {
  agent: string;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  result?: any;
  error?: string;
}

export class AgentOrchestrator extends EventEmitter {
  private agents: Map<string, BaseAgent> = new Map();
  private isRunning: boolean = false;

  constructor() {
    super();
    this.initializeAgents();
  }

  private initializeAgents(): void {
    // Create agent instances
    const errorAgent = new ErrorAnalysisAgent();
    const fixAgent = new CodeFixAgent();
    const reviewAgent = new CodeReviewAgent();
    const testAgent = new TestingAgent();

    // Register agents
    this.registerAgent(errorAgent);
    this.registerAgent(fixAgent);
    this.registerAgent(reviewAgent);
    this.registerAgent(testAgent);

    logger.info('Agent Orchestrator initialized with 4 agents');
  }

  private registerAgent(agent: BaseAgent): void {
    const name = agent.getName();
    this.agents.set(name, agent);
    
    // Listen for agent messages
    agent.on('message', (message: AgentMessage) => {
      this.handleAgentMessage(message);
    });
    
    agent.initialize();
  }

  private handleAgentMessage(message: AgentMessage): void {
    logger.debug(`Orchestrator received message from ${message.from} to ${message.to}`);
    
    // Route message to target agent
    const targetAgent = this.agents.get(message.to);
    if (targetAgent) {
      targetAgent.processMessage(message);
    } else {
      logger.warn(`No agent found with name: ${message.to}`);
    }
  }

  /**
   * Run the complete workflow to fix TypeScript errors
   */
  async runWorkflow(errorLog: string, projectPath: string, options: {
    dryRun?: boolean;
    skipTests?: boolean;
    autoApprove?: boolean;
  } = {}): Promise<WorkflowResult> {
    if (this.isRunning) {
      throw new Error('Workflow is already running');
    }

    this.isRunning = true;
    const startTime = Date.now();
    const steps: WorkflowStep[] = [];
    
    try {
      logger.info('Starting multi-agent workflow...');
      
      // Step 1: Analyze errors
      const analysisStep = await this.runStep({
        agent: 'ErrorAnalysisAgent',
        action: 'analyzeErrors',
        payload: { errorLog, projectPath }
      });
      steps.push(analysisStep);
      
      if (analysisStep.status === 'failed') {
        throw new Error('Error analysis failed');
      }
      
      const errorAnalysis = analysisStep.result;
      
      // Step 2: Generate and apply fixes
      const fixStep = await this.runStep({
        agent: 'CodeFixAgent',
        action: 'applyFixes',
        payload: {
          errorAnalysis,
          projectPath,
          dryRun: options.dryRun || false
        }
      });
      steps.push(fixStep);
      
      if (fixStep.status === 'failed') {
        throw new Error('Code fixing failed');
      }
      
      const fixes = fixStep.result;
      
      // Step 3: Review changes
      const reviewStep = await this.runStep({
        agent: 'CodeReviewAgent',
        action: 'reviewChanges',
        payload: { fixes: fixes.fixes, projectPath }
      });
      steps.push(reviewStep);
      
      const review = reviewStep.result;
      
      // Step 4: Run tests (if not skipped and changes approved)
      let testResults = null;
      if (!options.skipTests && (review.approved || options.autoApprove)) {
        const testStep = await this.runStep({
          agent: 'TestingAgent',
          action: 'runTests',
          payload: {
            projectPath,
            testsToRun: ['compile', 'unit', 'lint']
          }
        });
        steps.push(testStep);
        testResults = testStep.result;
      }
      
      const duration = Date.now() - startTime;
      const success = review.approved && (!testResults || testResults.success);
      
      return {
        success,
        errorAnalysis,
        fixes,
        review,
        testResults,
        duration,
        steps
      };
      
    } catch (error: any) {
      logger.error('Workflow failed:', error);
      
      return {
        success: false,
        duration: Date.now() - startTime,
        steps,
        errorAnalysis: undefined,
        fixes: undefined,
        review: undefined,
        testResults: undefined
      };
      
    } finally {
      this.isRunning = false;
    }
  }

  private async runStep(config: {
    agent: string;
    action: string;
    payload: any;
  }): Promise<WorkflowStep> {
    const step: WorkflowStep = {
      agent: config.agent,
      action: config.action,
      status: 'pending'
    };
    
    try {
      step.status = 'running';
      step.startTime = new Date();
      
      logger.info(`Running ${config.agent}.${config.action}...`);
      
      const agent = this.agents.get(config.agent);
      if (!agent) {
        throw new Error(`Agent not found: ${config.agent}`);
      }
      
      // Send message to agent
      const message: AgentMessage = {
        id: this.generateMessageId(),
        from: 'Orchestrator',
        to: config.agent,
        type: 'request',
        payload: { action: config.action, ...config.payload },
        timestamp: new Date()
      };
      
      const response = await agent.processMessage(message);
      
      if (response && response.type === 'error') {
        throw new Error(response.payload.error);
      }
      
      step.status = 'completed';
      step.endTime = new Date();
      step.result = response?.payload;
      
      logger.info(`Completed ${config.agent}.${config.action}`);
      
    } catch (error: any) {
      step.status = 'failed';
      step.endTime = new Date();
      step.error = error.message;
      
      logger.error(`Failed ${config.agent}.${config.action}:`, error);
    }
    
    return step;
  }

  private generateMessageId(): string {
    return `orchestrator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get workflow status
   */
  getStatus(): {
    isRunning: boolean;
    agents: Array<{ name: string; active: boolean }>;
  } {
    return {
      isRunning: this.isRunning,
      agents: Array.from(this.agents.entries()).map(([name, agent]) => ({
        name,
        active: agent.isAgentActive()
      }))
    };
  }

  /**
   * Shutdown all agents
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Agent Orchestrator...');
    
    for (const [_name, agent] of this.agents) {
      await agent.shutdown();
    }
    
    this.agents.clear();
    this.removeAllListeners();
    
    logger.info('Agent Orchestrator shutdown complete');
  }
}