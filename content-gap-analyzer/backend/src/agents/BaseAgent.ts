/**
 * Base Agent Class for Multi-Agent Workforce
 * Provides common functionality for all specialized agents
 */

import { EventEmitter } from 'events';
import logger from '../utils/logger';

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'error' | 'info';
  payload: any;
  timestamp: Date;
}

export interface AgentCapability {
  name: string;
  description: string;
  inputSchema?: any;
  outputSchema?: any;
}

export interface AgentConfig {
  name: string;
  description: string;
  capabilities: AgentCapability[];
  priority?: number;
}

export abstract class BaseAgent extends EventEmitter {
  protected name: string;
  protected description: string;
  protected capabilities: AgentCapability[];
  protected priority: number;
  protected isActive: boolean = false;
  protected messageQueue: AgentMessage[] = [];

  constructor(config: AgentConfig) {
    super();
    this.name = config.name;
    this.description = config.description;
    this.capabilities = config.capabilities;
    this.priority = config.priority || 1;
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    this.isActive = true;
    logger.info(`Agent ${this.name} initialized`);
  }

  /**
   * Process incoming message
   */
  async processMessage(message: AgentMessage): Promise<AgentMessage | null> {
    logger.debug(`Agent ${this.name} processing message from ${message.from}`);
    
    try {
      const result = await this.handleMessage(message);
      return this.createResponse(message, result);
    } catch (error) {
      logger.error(`Agent ${this.name} error processing message:`, error);
      return this.createErrorResponse(message, error);
    }
  }

  /**
   * Abstract method to be implemented by specific agents
   */
  protected abstract handleMessage(message: AgentMessage): Promise<any>;

  /**
   * Send message to another agent
   */
  protected sendMessage(to: string, type: AgentMessage['type'], payload: any): void {
    const message: AgentMessage = {
      id: this.generateMessageId(),
      from: this.name,
      to,
      type,
      payload,
      timestamp: new Date()
    };
    this.emit('message', message);
  }

  /**
   * Create response message
   */
  protected createResponse(originalMessage: AgentMessage, payload: any): AgentMessage {
    return {
      id: this.generateMessageId(),
      from: this.name,
      to: originalMessage.from,
      type: 'response',
      payload,
      timestamp: new Date()
    };
  }

  /**
   * Create error response message
   */
  protected createErrorResponse(originalMessage: AgentMessage, error: any): AgentMessage {
    return {
      id: this.generateMessageId(),
      from: this.name,
      to: originalMessage.from,
      type: 'error',
      payload: {
        error: error.message || 'Unknown error',
        originalMessageId: originalMessage.id
      },
      timestamp: new Date()
    };
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Shutdown the agent
   */
  async shutdown(): Promise<void> {
    this.isActive = false;
    this.removeAllListeners();
    logger.info(`Agent ${this.name} shutdown`);
  }

  // Getters
  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getCapabilities(): AgentCapability[] {
    return this.capabilities;
  }

  getPriority(): number {
    return this.priority;
  }

  isAgentActive(): boolean {
    return this.isActive;
  }
}