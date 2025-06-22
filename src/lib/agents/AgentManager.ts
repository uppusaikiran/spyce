import { agentOrchestrator } from './index';
import { DiscoveryAgent } from './DiscoveryAgent';
import { CrawlingAgent } from './CrawlingAgent';
import { ResearchAgent } from './ResearchAgent';

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
      const researchAgent = new ResearchAgent();

      // TODO: Add other agents as they're implemented
      // const analysisAgent = new AnalysisAgent();
      // const insightAgent = new InsightAgent();
      // const alertAgent = new AlertAgent();

      // Register agents with orchestrator
      agentOrchestrator.registerAgent(discoveryAgent);
      agentOrchestrator.registerAgent(crawlingAgent);
      agentOrchestrator.registerAgent(researchAgent);

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

  async performResearch(query: string, options?: {
    type?: 'deep_research' | 'competitive_analysis' | 'market_intelligence' | 'trend_analysis' | 'source_verification' | 'contextual_research';
    context?: {
      industry?: string;
      competitors?: string[];
      timeframe?: 'recent' | 'quarterly' | 'yearly' | 'all-time';
      depth?: 'surface' | 'moderate' | 'comprehensive' | 'exhaustive';
      sources?: 'academic' | 'news' | 'industry' | 'social' | 'all';
    };
    focusAreas?: string[];
    excludeTerms?: string[];
    customInstructions?: string;
  }) {
    if (!this.initialized) {
      throw new Error('Agent system not initialized');
    }

    return agentOrchestrator.executeTask('research_agent', {
      type: options?.type || 'deep_research',
      query,
      context: options?.context || {},
      focusAreas: options?.focusAreas || [],
      excludeTerms: options?.excludeTerms || [],
      customInstructions: options?.customInstructions || ''
    });
  }

  async analyzeCompetitors(competitors: string[], options?: {
    industry?: string;
    focusAreas?: string[];
    depth?: 'surface' | 'moderate' | 'comprehensive' | 'exhaustive';
  }) {
    if (!this.initialized) {
      throw new Error('Agent system not initialized');
    }

    return agentOrchestrator.executeTask('research_agent', {
      type: 'competitive_analysis',
      query: `Competitive analysis for ${competitors.join(', ')}`,
      context: {
        competitors,
        industry: options?.industry,
        depth: options?.depth || 'comprehensive'
      },
      focusAreas: options?.focusAreas || [
        'business strategy',
        'product offerings',
        'market position',
        'financial performance',
        'recent developments'
      ]
    });
  }

  async getMarketIntelligence(query: string, options?: {
    industry?: string;
    regions?: string[];
    timeframe?: 'recent' | 'quarterly' | 'yearly' | 'all-time';
    focusAreas?: string[];
  }) {
    if (!this.initialized) {
      throw new Error('Agent system not initialized');
    }

    return agentOrchestrator.executeTask('research_agent', {
      type: 'market_intelligence',
      query,
      context: {
        industry: options?.industry,
        timeframe: options?.timeframe || 'recent'
      },
      regions: options?.regions || [],
      focusAreas: options?.focusAreas || [
        'market size',
        'growth trends',
        'key players',
        'opportunities',
        'threats'
      ]
    });
  }

  async analyzeTrends(query: string, options?: {
    industry?: string;
    timeframe?: 'recent' | 'quarterly' | 'yearly' | 'all-time';
    depth?: 'surface' | 'moderate' | 'comprehensive' | 'exhaustive';
  }) {
    if (!this.initialized) {
      throw new Error('Agent system not initialized');
    }

    return agentOrchestrator.executeTask('research_agent', {
      type: 'trend_analysis',
      query,
      context: {
        industry: options?.industry,
        timeframe: options?.timeframe || 'recent',
        depth: options?.depth || 'comprehensive'
      }
    });
  }

  getAgentStatus(agentId?: string) {
    return agentOrchestrator.getAgentStatus(agentId);
  }
}

// Export singleton instance
export const agentManager = AgentManager.getInstance(); 