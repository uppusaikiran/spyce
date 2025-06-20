import { CompetitorDomain } from '../database';

// Agent Types and Interfaces
export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  status: 'idle' | 'working' | 'error' | 'disabled';
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: 'task' | 'result' | 'error' | 'status';
  payload: any;
  timestamp: Date;
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

// Base Agent Class
export abstract class BaseAgent {
  protected config: AgentConfig;
  protected isRunning: boolean = false;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  abstract execute(task: any): Promise<AgentResult>;
  
  async start(): Promise<void> {
    this.isRunning = true;
    this.config.status = 'idle';
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.config.status = 'disabled';
  }

  getStatus(): AgentConfig {
    return { ...this.config };
  }

  protected async sendMessage(to: string, type: AgentMessage['type'], payload: any): Promise<void> {
    const message: AgentMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: this.config.id,
      to,
      type,
      payload,
      timestamp: new Date()
    };
    
    // Message handling will be implemented by orchestrator
    await this.handleMessage(message);
  }

  protected abstract handleMessage(message: AgentMessage): Promise<void>;
}

// Agent Orchestrator
export class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private messageQueue: AgentMessage[] = [];
  private isProcessing: boolean = false;

  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.getStatus().id, agent);
  }

  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
  }

  async startAll(): Promise<void> {
    const startPromises = Array.from(this.agents.values()).map(agent => agent.start());
    await Promise.all(startPromises);
    this.startMessageProcessing();
  }

  async stopAll(): Promise<void> {
    this.isProcessing = false;
    const stopPromises = Array.from(this.agents.values()).map(agent => agent.stop());
    await Promise.all(stopPromises);
  }

  async executeTask(agentId: string, task: any): Promise<AgentResult> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    return await agent.execute(task);
  }

  getAgentStatus(agentId?: string): AgentConfig | AgentConfig[] | null {
    if (agentId) {
      const agent = this.agents.get(agentId);
      return agent ? agent.getStatus() : null;
    }
    
    return Array.from(this.agents.values()).map(agent => agent.getStatus());
  }

  private async startMessageProcessing(): Promise<void> {
    this.isProcessing = true;
    
    while (this.isProcessing) {
      if (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        if (message) {
          await this.routeMessage(message);
        }
      }
      
      // Small delay to prevent CPU spinning
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async routeMessage(message: AgentMessage): Promise<void> {
    const targetAgent = this.agents.get(message.to);
    if (targetAgent) {
      // Route message to target agent
      await (targetAgent as any).handleMessage(message);
    }
  }

  addMessage(message: AgentMessage): void {
    this.messageQueue.push(message);
  }
}

// Global orchestrator instance
export const agentOrchestrator = new AgentOrchestrator(); 