import { agentOrchestrator } from './index';
import { DiscoveryAgent } from './DiscoveryAgent';
import { CrawlingAgent } from './CrawlingAgent';

export class AgentManager {
  private static instance: AgentManager;
  private initialized = false;

  private constructor() {}

  static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('Agent system already initialized');
      return;
    }

    try {
      console.log('Initializing AI Agent System...');

      // Initialize and register agents
      const discoveryAgent = new DiscoveryAgent();
      const crawlingAgent = new CrawlingAgent();

      // TODO: Add other agents as they're implemented
      // const analysisAgent = new AnalysisAgent();
      // const insightAgent = new InsightAgent();
      // const alertAgent = new AlertAgent();

      // Register agents with orchestrator
      agentOrchestrator.registerAgent(discoveryAgent);
      agentOrchestrator.registerAgent(crawlingAgent);

      // Start all agents
      await agentOrchestrator.startAll();

      this.initialized = true;
      console.log('✅ AI Agent System initialized successfully');
      
      // Log agent status
      const agentStatuses = agentOrchestrator.getAgentStatus();
      console.log('Active agents:', agentStatuses);

    } catch (error) {
      console.error('❌ Failed to initialize agent system:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      console.log('Shutting down AI Agent System...');
      await agentOrchestrator.stopAll();
      this.initialized = false;
      console.log('✅ AI Agent System shut down successfully');
    } catch (error) {
      console.error('❌ Error during agent system shutdown:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getOrchestrator() {
    return agentOrchestrator;
  }

  // Convenience methods for common agent operations
  async discoverCompetitors(industry: string, keywords?: string[]) {
    if (!this.initialized) {
      throw new Error('Agent system not initialized');
    }

    return agentOrchestrator.executeTask('discovery_agent', {
      type: 'discover_competitors',
      industry,
      keywords
    });
  }

  async crawlDomains(domains: string[], options?: {
    priority?: 'high' | 'medium' | 'low';
    antiDetection?: boolean;
    sections?: string[];
  }) {
    if (!this.initialized) {
      throw new Error('Agent system not initialized');
    }

    return agentOrchestrator.executeTask('crawling_agent', {
      type: 'batch_crawl',
      domains,
      priority: options?.priority || 'medium',
      antiDetection: options?.antiDetection || false,
      sections: options?.sections
    });
  }

  async monitorChanges(domains: string[], frequency: 'daily' | 'weekly' | 'monthly' = 'daily') {
    if (!this.initialized) {
      throw new Error('Agent system not initialized');
    }

    return agentOrchestrator.executeTask('crawling_agent', {
      type: 'monitor_changes',
      domains,
      frequency
    });
  }

  getAgentStatus(agentId?: string) {
    return agentOrchestrator.getAgentStatus(agentId);
  }
}

// Export singleton instance
export const agentManager = AgentManager.getInstance(); 