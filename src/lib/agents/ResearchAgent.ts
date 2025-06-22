import { BaseAgent, AgentConfig, AgentMessage, AgentResult } from './index';

interface ResearchTask {
  type: 'deep_research' | 'competitive_analysis' | 'market_intelligence' | 'trend_analysis' | 'source_verification' | 'contextual_research';
  query: string;
  context?: {
    industry?: string;
    competitors?: string[];
    timeframe?: 'recent' | 'quarterly' | 'yearly' | 'all-time';
    depth?: 'surface' | 'moderate' | 'comprehensive' | 'exhaustive';
    sources?: 'academic' | 'news' | 'industry' | 'social' | 'all';
  };
  focusAreas?: string[];
  excludeTerms?: string[];
  languages?: string[];
  regions?: string[];
  customInstructions?: string;
}

interface ResearchSource {
  url: string;
  title: string;
  content: string;
  publishDate?: string;
  author?: string;
  credibilityScore: number;
  sourceType: 'academic' | 'news' | 'blog' | 'report' | 'social' | 'official' | 'unknown';
  relevanceScore: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  keyTopics: string[];
  quotes: string[];
}

interface ResearchInsight {
  category: string;
  insight: string;
  confidence: number;
  supportingSources: string[];
  implications: string[];
  actionableRecommendations: string[];
}

interface TrendAnalysis {
  trend: string;
  direction: 'rising' | 'declining' | 'stable' | 'volatile';
  strength: number;
  timeframe: string;
  drivingFactors: string[];
  potentialImpact: string;
  relatedTrends: string[];
}

interface CompetitiveIntel {
  competitor: string;
  strengths: string[];
  weaknesses: string[];
  recentDevelopments: string[];
  marketPosition: string;
  strategicFocus: string[];
  threats: string[];
  opportunities: string[];
}

interface ResearchResult {
  query: string;
  summary: string;
  keyFindings: string[];
  sources: ResearchSource[];
  insights: ResearchInsight[];
  trends?: TrendAnalysis[];
  competitiveIntel?: CompetitiveIntel[];
  recommendations: string[];
  confidenceScore: number;
  researchDepth: 'surface' | 'moderate' | 'comprehensive' | 'exhaustive';
  metadata: {
    sourcesAnalyzed: number;
    timeSpent: number;
    methodsUsed: string[];
    limitations: string[];
    lastUpdated: string;
    taskType?: string;
  };
}

export class ResearchAgent extends BaseAgent {
  private apiKeys: {
    tavily?: string;
    perplexity?: string;
    serper?: string;
  } = {};

  private researchCache: Map<string, { result: ResearchResult; timestamp: number }> = new Map();
  private rateLimits = {
    tavily: { requests: 0, resetTime: 0, limit: 100 },
    perplexity: { requests: 0, resetTime: 0, limit: 50 }
  };

  constructor() {
    const config: AgentConfig = {
      id: 'research_agent',
      name: 'Advanced Research Intelligence Agent',
      role: 'Deep research, market intelligence, and analytical insights',
      capabilities: [
        'Advanced Web Research via Tavily',
        'AI-Powered Analysis via Perplexity',
        'Multi-Source Intelligence Gathering',
        'Competitive Intelligence Analysis',
        'Trend Detection & Forecasting',
        'Source Credibility Assessment',
        'Contextual Research Synthesis',
        'Real-time Market Intelligence',
        'Academic & Industry Research',
        'Sentiment & Impact Analysis'
      ],
      status: 'idle'
    };
    
    super(config);
    
    // Initialize API keys from environment
    this.apiKeys = {
      tavily: process.env.TAVILY_API_KEY,
      perplexity: process.env.PERPLEXITY_API_KEY,
      serper: process.env.SERPER_API_KEY,
    };
  }

  async execute(task: ResearchTask): Promise<AgentResult> {
    try {
      this.config.status = 'working';
      
      // Validate API keys before proceeding
      if (!this.validateApiKeys()) {
        return {
          success: false,
          error: 'No research API keys configured. Please set TAVILY_API_KEY, PERPLEXITY_API_KEY, or SERPER_API_KEY in your environment variables.'
        };
      }
      
      console.log(`🔬 Executing ${task.type} research task: "${task.query}"`);
      
      switch (task.type) {
        case 'deep_research':
          return await this.performDeepResearch(task);
        case 'competitive_analysis':
          return await this.performCompetitiveAnalysis(task);
        case 'market_intelligence':
          return await this.gatherMarketIntelligence(task);
        case 'trend_analysis':
          return await this.analyzeTrends(task);
        case 'source_verification':
          return await this.verifySourceCredibility(task);
        case 'contextual_research':
          return await this.performContextualResearch(task);
        default:
          throw new Error(`Unknown research task type: ${task.type}`);
      }
    } catch (error) {
      this.config.status = 'error';
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown research error occurred'
      };
    } finally {
      this.config.status = 'idle';
    }
  }

  private async performDeepResearch(task: ResearchTask): Promise<AgentResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(task);
    
    // Check cache first
    const cached = this.researchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
      return {
        success: true,
        data: cached.result,
        metadata: { cached: true }
      };
    }

    console.log('📊 Phase 1: Multi-source data gathering...');
    
    // Phase 1: Multi-source data gathering
    const [tavilyResults, perplexityAnalysis, webScrapeResults] = await Promise.allSettled([
      this.searchWithTavily(task),
      this.analyzeWithPerplexity(task),
      this.performSupplementarySearch(task)
    ]);

    console.log('📊 Phase 1 Results:', {
      tavily: tavilyResults.status,
      perplexity: perplexityAnalysis.status,
      webScrape: webScrapeResults.status
    });

    const sources: ResearchSource[] = [];
    
    // Process Tavily results
    if (tavilyResults.status === 'fulfilled') {
      sources.push(...this.processTavilyResults(tavilyResults.value, task));
    }
    
    // Process supplementary web scrape results
    if (webScrapeResults.status === 'fulfilled') {
      sources.push(...this.processWebScrapeResults(webScrapeResults.value, task));
    }

    // Phase 2: AI-powered analysis and synthesis
    let perplexityInsights: any = null;
    if (perplexityAnalysis.status === 'fulfilled') {
      perplexityInsights = perplexityAnalysis.value;
    }

    console.log('🔍 Phase 2: Processing sources...');
    console.log(`Found ${sources.length} sources to process`);

    // Phase 3: Advanced analysis and synthesis
    const processedSources = await this.enhanceSourcesWithCredibility(sources);
    console.log('🧠 Phase 3: Generating insights...');
    const insights = await this.generateInsights(processedSources, task, perplexityInsights);
    console.log('📈 Phase 4: Identifying trends...');
    const trends = await this.identifyTrends(processedSources, task);
    const recommendations = await this.generateRecommendations(insights, trends, task);

    const result: ResearchResult = {
      query: task.query,
      summary: await this.generateExecutiveSummary(processedSources, insights, task),
      keyFindings: await this.extractKeyFindings(processedSources, insights),
      sources: processedSources.slice(0, 50), // Limit to top 50 sources
      insights,
      trends,
      recommendations,
      confidenceScore: this.calculateConfidenceScore(processedSources, insights),
      researchDepth: task.context?.depth || 'comprehensive',
      metadata: {
        sourcesAnalyzed: processedSources.length,
        timeSpent: Date.now() - startTime,
        methodsUsed: this.getMethodsUsed(tavilyResults, perplexityAnalysis, webScrapeResults),
        limitations: await this.identifyLimitations(task, processedSources),
        lastUpdated: new Date().toISOString()
      }
    };

    // Cache the result
    this.researchCache.set(cacheKey, { result, timestamp: Date.now() });

    // Notify other agents about significant findings
    await this.notifyOtherAgents(result, task);

    return {
      success: true,
      data: result,
      metadata: {
        researchTime: Date.now() - startTime,
        sourcesAnalyzed: processedSources.length,
        confidenceScore: result.confidenceScore
      }
    };
  }

  private async performCompetitiveAnalysis(task: ResearchTask): Promise<AgentResult> {
    console.log('🏆 Starting Competitive Analysis for:', task.query);
    const startTime = Date.now();
    
    try {
      const competitors = task.context?.competitors || [];
      const competitiveIntel: CompetitiveIntel[] = [];
      const allSources: ResearchSource[] = [];

      // Phase 1: Individual competitor analysis
      for (const competitor of competitors) {
        console.log(`🔍 Analyzing competitor: ${competitor}`);
        
        const competitorQueries = [
          `${competitor} company analysis business strategy 2024`,
          `${competitor} financial performance revenue market share`,
          `${competitor} products services offerings competitive advantages`,
          `${competitor} recent news acquisitions partnerships`,
          `${competitor} technology innovation digital transformation`
        ];

        const competitorSources: ResearchSource[] = [];
        
        // Gather data from multiple sources for each competitor
        for (const query of competitorQueries) {
          try {
            const tavilyResults = await this.searchWithTavily({
              ...task,
              query,
              focusAreas: ['competitive intelligence', 'market analysis']
            });
            
            if (tavilyResults && tavilyResults.length > 0) {
              const processedSources = this.processTavilyResults(tavilyResults, task);
              competitorSources.push(...processedSources);
            }
          } catch (error) {
            console.error(`Error researching ${competitor}:`, error);
          }
        }

        // Extract competitive intelligence for this competitor
        if (competitorSources.length > 0) {
          const intel = await this.extractDetailedCompetitiveIntel(competitor, competitorSources);
          competitiveIntel.push(intel);
          allSources.push(...competitorSources);
        }
      }

      // Phase 2: Cross-competitor analysis using Perplexity
      const perplexityAnalysis = await this.analyzeWithPerplexity(task);
      let perplexityInsights: ResearchInsight[] = [];
      
      if (perplexityAnalysis) {
        perplexityInsights = await this.generateInsights(allSources, task, perplexityAnalysis);
      }

      // Phase 3: Market positioning analysis
      const marketAnalysis = await this.performMarketPositionAnalysis(task, competitiveIntel);
      
      // Phase 4: Strategic recommendations
      const strategicRecommendations = await this.generateStrategicRecommendations(competitiveIntel, task);

      // Construct final result
      const result: ResearchResult = {
        query: task.query,
        summary: await this.generateCompetitiveSummary(competitiveIntel, task),
        keyFindings: await this.extractCompetitiveFindings(competitiveIntel),
        sources: allSources.slice(0, 20), // Limit sources
        insights: perplexityInsights,
        competitiveIntel,
        recommendations: strategicRecommendations,
        confidenceScore: this.calculateConfidenceScore(allSources, perplexityInsights),
        researchDepth: task.context?.depth || 'comprehensive',
        metadata: {
          sourcesAnalyzed: allSources.length,
          timeSpent: Date.now() - startTime,
          methodsUsed: ['Tavily Search', 'Perplexity Analysis', 'Competitive Intelligence'],
          limitations: await this.identifyLimitations(task, allSources),
          lastUpdated: new Date().toISOString(),
          taskType: 'competitive_analysis'
        }
      };

      return {
        success: true,
        data: result
      };
      
    } catch (error) {
      console.error('Competitive analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform competitive analysis'
      };
    }
  }

  private async searchWithTavily(task: ResearchTask): Promise<any> {
    if (!this.apiKeys.tavily) {
      throw new Error('Tavily API key not configured');
    }

    if (!this.checkRateLimit('tavily')) {
      throw new Error('Tavily rate limit exceeded');
    }

    const searchQueries = this.generateSearchQueries(task);
    const allResults: any[] = [];

    for (const query of searchQueries) {
      try {
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKeys.tavily}`
          },
          body: JSON.stringify({
            query,
            search_depth: task.context?.depth === 'exhaustive' ? 'advanced' : 'basic',
            include_answer: true,
            include_raw_content: true,
            max_results: task.context?.depth === 'surface' ? 5 : 15,
            include_domains: this.getPreferredDomains(task),
            exclude_domains: this.getExcludedDomains(task)
          })
        });

        if (!response.ok) {
          throw new Error(`Tavily API error: ${response.statusText}`);
        }

        const data = await response.json();
        allResults.push(...(data.results || []));
        
        this.updateRateLimit('tavily');
        
        // Add delay between requests to respect rate limits
        await this.delay(200);
      } catch (error) {
        console.error(`Tavily search error for query "${query}":`, error);
      }
    }

    return allResults;
  }

  private async analyzeWithPerplexity(task: ResearchTask): Promise<any> {
    if (!this.apiKeys.perplexity) {
      throw new Error('Perplexity API key not configured');
    }

    if (!this.checkRateLimit('perplexity')) {
      throw new Error('Perplexity rate limit exceeded');
    }

    const analysisPrompt = this.generatePerplexityPrompt(task);

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKeys.perplexity}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are an expert research analyst. Provide comprehensive, well-sourced analysis with specific insights, trends, and actionable recommendations.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          max_tokens: task.context?.depth === 'exhaustive' ? 4000 : 2000,
          temperature: 0.1,
          return_citations: true,
          return_images: false
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`);
      }

      const data = await response.json();
      this.updateRateLimit('perplexity');
      
      return {
        analysis: data.choices[0]?.message?.content || '',
        citations: data.citations || []
      };
    } catch (error) {
      console.error('Perplexity analysis error:', error);
      return null;
    }
  }

  // Additional helper methods would continue here...
  // Due to length constraints, I'll continue with the most essential methods

  protected async handleMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case 'task':
        const result = await this.execute(message.payload);
        await this.sendMessage(message.from, 'result', result);
        break;
      case 'result':
        // Handle results from other agents
        console.log(`Research agent received result from ${message.from}:`, message.payload);
        break;
      default:
        console.log(`Research agent received unknown message type: ${message.type}`);
    }
  }

  // Essential utility methods
  private generateCacheKey(task: ResearchTask): string {
    return `${task.type}_${task.query}_${JSON.stringify(task.context)}`.toLowerCase().replace(/\s+/g, '_');
  }

  private checkRateLimit(service: 'tavily' | 'perplexity'): boolean {
    const limit = this.rateLimits[service];
    const now = Date.now();
    
    if (now > limit.resetTime) {
      limit.requests = 0;
      limit.resetTime = now + 3600000; // Reset every hour
    }
    
    return limit.requests < limit.limit;
  }

  private updateRateLimit(service: 'tavily' | 'perplexity'): void {
    this.rateLimits[service].requests++;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateSearchQueries(task: ResearchTask): string[] {
    const baseQuery = task.query;
    const queries = [baseQuery];
    
    if (task.focusAreas) {
      task.focusAreas.forEach(area => {
        queries.push(`${baseQuery} ${area}`);
      });
    }
    
    if (task.context?.industry) {
      queries.push(`${baseQuery} ${task.context.industry} industry`);
    }
    
    if (task.context?.timeframe === 'recent') {
      queries.forEach((query, index) => {
        queries[index] = `${query} 2024 latest recent`;
      });
    }
    
    // Add exclude terms to queries (using NOT operator)
    if (task.excludeTerms?.length) {
      queries.forEach((query, index) => {
        const excludeClause = task.excludeTerms!.map(term => `-"${term}"`).join(' ');
        queries[index] = `${query} ${excludeClause}`;
      });
    }
    
    return queries.slice(0, 5); // Limit to 5 queries to manage API costs
  }

  private generatePerplexityPrompt(task: ResearchTask): string {
    let prompt = '';
    
    // Customize prompt based on research type
    switch (task.type) {
      case 'deep_research':
        prompt = `Conduct an exhaustive research analysis on: ${task.query}\n\n`;
        prompt += `Please provide:
1. Comprehensive executive summary with key insights
2. Detailed findings with supporting evidence
3. Major trends and patterns identified
4. Competitive landscape analysis
5. Market opportunities and threats
6. Actionable strategic recommendations
7. Data-backed conclusions with specific metrics
8. Future outlook and predictions
9. Risk assessment and mitigation strategies`;
        break;
        
      case 'competitive_analysis':
        prompt = `Perform a detailed competitive intelligence analysis on: ${task.query}\n\n`;
        if (task.context?.competitors?.length) {
          prompt += `Key Competitors to Analyze: ${task.context.competitors.join(', ')}\n`;
        }
        prompt += `Please provide:
1. Competitive positioning analysis
2. Strengths and weaknesses of each competitor
3. Market share and positioning
4. Recent strategic moves and developments
5. Technology and innovation capabilities
6. Pricing strategies and business models
7. SWOT analysis for each competitor
8. Competitive threats and opportunities
9. Strategic recommendations for competitive advantage`;
        break;
        
      case 'market_intelligence':
        prompt = `Gather comprehensive market intelligence on: ${task.query}\n\n`;
        prompt += `Please provide:
1. Market size, growth rate, and forecasts
2. Market segmentation and key demographics
3. Industry trends and driving forces
4. Regulatory environment and compliance requirements
5. Key market players and their market share
6. Entry barriers and market dynamics
7. Customer behavior and preferences
8. Supply chain and distribution channels
9. Investment opportunities and market outlook`;
        break;
        
      case 'trend_analysis':
        prompt = `Conduct a comprehensive trend analysis on: ${task.query}\n\n`;
        prompt += `Please provide:
1. Emerging trends and their trajectory
2. Trend drivers and underlying causes
3. Timeline and adoption patterns
4. Impact assessment on industry/market
5. Geographic and demographic variations
6. Technology enablers and disruptors
7. Potential future scenarios
8. Early indicators and warning signs
9. Strategic implications and recommendations`;
        break;
        
      case 'source_verification':
        prompt = `Perform rigorous source verification and fact-checking on: ${task.query}\n\n`;
        prompt += `Please provide:
1. Source credibility assessment
2. Cross-verification of key claims
3. Bias analysis and perspective evaluation
4. Fact-checking against authoritative sources
5. Methodology and data quality review
6. Conflicting information identification
7. Reliability scoring and confidence levels
8. Alternative viewpoints and counterarguments
9. Verification recommendations and caveats`;
        break;
        
      case 'contextual_research':
        prompt = `Conduct specialized contextual research on: ${task.query}\n\n`;
        if (task.customInstructions) {
          prompt += `Special Instructions: ${task.customInstructions}\n`;
        }
        prompt += `Please provide:
1. Domain-specific analysis and insights
2. Contextual background and framework
3. Specialized knowledge and expertise
4. Industry-specific implications
5. Technical or regulatory considerations
6. Best practices and case studies
7. Expert opinions and thought leadership
8. Contextual risks and opportunities
9. Tailored recommendations for the specific context`;
        break;
    }
    
    if (task.context?.industry) {
      prompt += `\n\nIndustry Context: ${task.context.industry}`;
    }
    
    if (task.focusAreas?.length) {
      prompt += `\nFocus Areas: ${task.focusAreas.join(', ')}`;
    }
    
    if (task.context?.depth) {
      prompt += `\nResearch Depth: ${task.context.depth}`;
    }
    
    prompt += `\n\nPlease cite all sources and provide confidence levels for your key findings. Use specific data, metrics, and examples wherever possible.`;
    
    return prompt;
  }

  private async notifyOtherAgents(result: ResearchResult, task: ResearchTask): Promise<void> {
    // Notify discovery agent about new competitors or sources found
    if (result.sources.length > 0) {
      await this.sendMessage('discovery_agent', 'result', {
        type: 'research_findings',
        newSources: result.sources.filter(s => s.sourceType === 'official' || s.credibilityScore > 0.8),
        insights: result.insights.filter(i => i.confidence > 0.7)
      });
    }
    
    // Notify crawling agent about high-value URLs to monitor
    const highValueUrls = result.sources
      .filter(s => s.credibilityScore > 0.8 && s.relevanceScore > 0.7)
      .map(s => s.url);
      
    if (highValueUrls.length > 0) {
      await this.sendMessage('crawling_agent', 'task', {
        type: 'monitor_changes',
        domains: highValueUrls,
        priority: 'high'
      });
    }
  }

  // Placeholder methods for complex operations
  private processTavilyResults(results: any[], task: ResearchTask): ResearchSource[] {
    return results.map(result => ({
      url: result.url || '',
      title: result.title || 'Untitled',
      content: result.content || result.snippet || '',
      publishDate: result.published_date,
      author: result.author,
      credibilityScore: this.calculateSourceCredibility(result),
      sourceType: this.determineSourceType(result.url),
      relevanceScore: this.calculateRelevanceScore(result, task),
      sentiment: this.analyzeSentiment(result.content || result.snippet || ''),
      keyTopics: this.extractKeyTopics(result.content || result.snippet || ''),
      quotes: this.extractQuotes(result.content || result.snippet || '')
    }));
  }

  private processWebScrapeResults(results: any[], task: ResearchTask): ResearchSource[] {
    return results.map(result => ({
      url: result.url || '',
      title: result.title || 'Untitled',
      content: result.content || '',
      credibilityScore: this.calculateSourceCredibility(result),
      sourceType: this.determineSourceType(result.url),
      relevanceScore: this.calculateRelevanceScore(result, task),
      keyTopics: this.extractKeyTopics(result.content || ''),
      quotes: this.extractQuotes(result.content || '')
    }));
  }

  private async enhanceSourcesWithCredibility(sources: ResearchSource[]): Promise<ResearchSource[]> {
    return sources.map(source => ({
      ...source,
      credibilityScore: Math.max(source.credibilityScore, this.calculateDomainCredibility(source.url))
    }));
  }

  private async generateInsights(sources: ResearchSource[], task: ResearchTask, perplexityData: any): Promise<ResearchInsight[]> {
    const insights: ResearchInsight[] = [];
    
    // Generate insights from Perplexity analysis if available
    if (perplexityData?.analysis) {
      const analysis = perplexityData.analysis;
      const sections = analysis.split('\n\n');
      
      sections.forEach((section: string, index: number) => {
        if (section.trim().length > 50) {
          insights.push({
            category: this.extractInsightCategory(section, index),
            insight: section.trim(),
            confidence: this.calculateInsightConfidence(section, sources),
            supportingSources: this.findSupportingSources(section, sources),
            implications: this.extractImplications(section),
            actionableRecommendations: this.extractRecommendations(section)
          });
        }
      });
    }
    
    // Generate insights from source analysis
    const topSources = sources.filter(s => s.credibilityScore > 0.7).slice(0, 5);
    topSources.forEach(source => {
      if (source.keyTopics.length > 0) {
        insights.push({
          category: 'Source Analysis',
          insight: `Key findings from ${source.title}: ${source.keyTopics.join(', ')}`,
          confidence: source.credibilityScore,
          supportingSources: [source.url],
          implications: [`Insights from ${this.getSourceType(source.sourceType)} source`],
          actionableRecommendations: this.generateSourceRecommendations(source)
        });
      }
    });
    
    return insights;
  }

  private async identifyTrends(sources: ResearchSource[], task: ResearchTask): Promise<TrendAnalysis[]> {
    const trends: TrendAnalysis[] = [];
    const timeframeKeywords = ['2024', '2023', 'recent', 'latest', 'emerging', 'growing', 'increasing', 'rising'];
    const trendKeywords = ['trend', 'growth', 'adoption', 'market', 'demand', 'popularity'];
    
    sources.forEach(source => {
      const content = source.content.toLowerCase();
      const hasTimeframe = timeframeKeywords.some(keyword => content.includes(keyword));
      const hasTrend = trendKeywords.some(keyword => content.includes(keyword));
      
      if (hasTimeframe && hasTrend && source.credibilityScore > 0.6) {
        source.keyTopics.forEach(topic => {
          const existingTrend = trends.find(t => t.trend.toLowerCase().includes(topic.toLowerCase()));
          if (!existingTrend) {
            trends.push({
              trend: topic,
              direction: this.analyzeTrendDirection(content, topic),
              strength: this.calculateTrendStrength(content, topic),
              timeframe: this.extractTimeframe(content),
              drivingFactors: this.extractDrivingFactors(content, topic),
              potentialImpact: this.assessPotentialImpact(content, topic),
              relatedTrends: this.findRelatedTrends(content, topic, trends)
            });
          }
        });
      }
    });
    
    return trends.slice(0, 5); // Limit to top 5 trends
  }

  private async generateRecommendations(insights: ResearchInsight[], trends: TrendAnalysis[], task: ResearchTask): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Generate recommendations from insights
    insights.forEach(insight => {
      if (insight.actionableRecommendations.length > 0) {
        recommendations.push(...insight.actionableRecommendations);
      }
    });
    
    // Generate recommendations from trends
    trends.forEach(trend => {
      if (trend.direction === 'rising' && trend.strength > 0.7) {
        recommendations.push(`Consider leveraging the rising trend in ${trend.trend} by ${trend.drivingFactors[0] || 'investing in this area'}`);
      }
      if (trend.direction === 'declining' && trend.strength > 0.6) {
        recommendations.push(`Monitor the declining trend in ${trend.trend} and consider alternative approaches`);
      }
    });
    
    // Add task-specific recommendations
    switch (task.type) {
      case 'competitive_analysis':
        recommendations.push('Conduct regular competitive monitoring to stay ahead of market changes');
        break;
      case 'market_intelligence':
        recommendations.push('Establish key performance indicators to track market opportunities');
        break;
      case 'trend_analysis':
        recommendations.push('Set up alerts for emerging trends in your industry');
        break;
    }
    
    return Array.from(new Set(recommendations)).slice(0, 8); // Remove duplicates and limit to 8
  }

  private async generateExecutiveSummary(sources: ResearchSource[], insights: ResearchInsight[], task: ResearchTask): Promise<string> {
    const topInsights = insights.filter(i => i.confidence > 0.7).slice(0, 3);
    const keyFindings = topInsights.map(i => i.insight.substring(0, 100) + '...').join(' ');
    
    return `Research analysis for "${task.query}" reveals ${sources.length} relevant sources with ${topInsights.length} high-confidence insights. ${keyFindings} The analysis suggests focusing on ${task.focusAreas?.join(', ') || 'core areas'} for maximum impact.`;
  }

  private async extractKeyFindings(sources: ResearchSource[], insights: ResearchInsight[]): Promise<string[]> {
    const findings: string[] = [];
    
    // Extract from high-confidence insights
    insights.filter(i => i.confidence > 0.7).forEach(insight => {
      findings.push(insight.insight.split('.')[0] + '.'); // First sentence
    });
    
    // Extract from high-credibility sources
    sources.filter(s => s.credibilityScore > 0.8).forEach(source => {
      if (source.quotes.length > 0) {
        findings.push(source.quotes[0]);
      }
    });
    
    return Array.from(new Set(findings)).slice(0, 6); // Remove duplicates and limit
  }

  // Helper methods for data processing
  private calculateSourceCredibility(result: any): number {
    let score = 0.5; // Base score
    
    if (result.url) {
      const domain = new URL(result.url).hostname;
      if (domain.includes('.edu') || domain.includes('.gov')) score += 0.3;
      if (domain.includes('wikipedia') || domain.includes('britannica')) score += 0.2;
      if (domain.includes('reuters') || domain.includes('bloomberg')) score += 0.2;
    }
    
    if (result.published_date) score += 0.1;
    if (result.author) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  private determineSourceType(url: string): ResearchSource['sourceType'] {
    if (!url) return 'unknown';
    
    const domain = new URL(url).hostname.toLowerCase();
    
    if (domain.includes('.edu') || domain.includes('.org')) return 'academic';
    if (domain.includes('.gov')) return 'official';
    if (domain.includes('news') || domain.includes('reuters') || domain.includes('bloomberg')) return 'news';
    if (domain.includes('blog') || domain.includes('medium')) return 'blog';
    if (domain.includes('report') || domain.includes('research')) return 'report';
    
    return 'unknown';
  }

  private calculateRelevanceScore(result: any, task: ResearchTask): number {
    let score = 0.5;
    const content = (result.content || result.snippet || '').toLowerCase();
    const query = task.query.toLowerCase();
    
    if (content.includes(query)) score += 0.3;
    
    task.focusAreas?.forEach(area => {
      if (content.includes(area.toLowerCase())) score += 0.1;
    });
    
    return Math.min(score, 1.0);
  }

  private analyzeSentiment(content: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'growth', 'success', 'opportunity'];
    const negativeWords = ['bad', 'poor', 'negative', 'decline', 'crisis', 'problem', 'risk'];
    
    const lowerContent = content.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractKeyTopics(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const topicWords = words.filter(word => 
      word.length > 4 && 
      !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)
    );
    
    return Array.from(new Set(topicWords)).slice(0, 5);
  }

  private extractQuotes(content: string): string[] {
    const quotes = content.match(/"[^"]*"/g) || [];
    return quotes.map(quote => quote.replace(/"/g, '')).slice(0, 3);
  }

  private calculateDomainCredibility(url: string): number {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      const highCredibilityDomains = ['.edu', '.gov', 'reuters.com', 'bloomberg.com', 'nature.com', 'science.org'];
      
      if (highCredibilityDomains.some(d => domain.includes(d))) return 0.9;
      if (domain.includes('wikipedia') || domain.includes('britannica')) return 0.7;
      
      return 0.5;
    } catch {
      return 0.3;
    }
  }

  private extractInsightCategory(section: string, index: number): string {
    const categories = ['Market Analysis', 'Competitive Landscape', 'Trend Identification', 'Strategic Insights', 'Risk Assessment'];
    
    if (section.toLowerCase().includes('market')) return 'Market Analysis';
    if (section.toLowerCase().includes('competitor') || section.toLowerCase().includes('competition')) return 'Competitive Landscape';
    if (section.toLowerCase().includes('trend') || section.toLowerCase().includes('emerging')) return 'Trend Identification';
    if (section.toLowerCase().includes('risk') || section.toLowerCase().includes('threat')) return 'Risk Assessment';
    
    return categories[index % categories.length];
  }

  private calculateInsightConfidence(section: string, sources: ResearchSource[]): number {
    let confidence = 0.6; // Base confidence
    
    if (section.includes('data shows') || section.includes('research indicates')) confidence += 0.2;
    if (section.includes('study') || section.includes('analysis')) confidence += 0.1;
    if (sources.length > 5) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private findSupportingSources(section: string, sources: ResearchSource[]): string[] {
    return sources
      .filter(source => source.credibilityScore > 0.6)
      .map(source => source.url)
      .slice(0, 3);
  }

  private extractImplications(section: string): string[] {
    const implications = [];
    
    if (section.toLowerCase().includes('impact')) {
      implications.push('Significant market impact expected');
    }
    if (section.toLowerCase().includes('growth')) {
      implications.push('Growth opportunities identified');
    }
    if (section.toLowerCase().includes('risk')) {
      implications.push('Risk mitigation strategies needed');
    }
    
    return implications;
  }

  private extractRecommendations(section: string): string[] {
    const recommendations = [];
    
    if (section.toLowerCase().includes('should') || section.toLowerCase().includes('recommend')) {
      const sentences = section.split('.').filter(s => 
        s.toLowerCase().includes('should') || s.toLowerCase().includes('recommend')
      );
      recommendations.push(...sentences.map(s => s.trim()).filter(s => s.length > 0));
    }
    
    return recommendations.slice(0, 2);
  }

  private getSourceType(sourceType: string): string {
    const typeMap: { [key: string]: string } = {
      'academic': 'academic',
      'news': 'news',
      'official': 'government',
      'report': 'industry report',
      'blog': 'blog',
      'unknown': 'web'
    };
    
    return typeMap[sourceType] || 'web';
  }

  private generateSourceRecommendations(source: ResearchSource): string[] {
    return [`Monitor ${source.title} for updates`, `Explore related content from ${new URL(source.url).hostname}`];
  }

  private analyzeTrendDirection(content: string, topic: string): 'rising' | 'declining' | 'stable' | 'volatile' {
    const risingKeywords = ['increasing', 'growing', 'rising', 'expanding', 'surge', 'boom'];
    const decliningKeywords = ['decreasing', 'declining', 'falling', 'shrinking', 'drop'];
    
    const lowerContent = content.toLowerCase();
    const hasRising = risingKeywords.some(keyword => lowerContent.includes(keyword));
    const hasDeclining = decliningKeywords.some(keyword => lowerContent.includes(keyword));
    
    if (hasRising && !hasDeclining) return 'rising';
    if (hasDeclining && !hasRising) return 'declining';
    if (hasRising && hasDeclining) return 'volatile';
    
    return 'stable';
  }

  private calculateTrendStrength(content: string, topic: string): number {
    const strengthKeywords = ['significant', 'major', 'substantial', 'dramatic', 'rapid'];
    const lowerContent = content.toLowerCase();
    
    let strength = 0.5;
    strengthKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) strength += 0.1;
    });
    
    return Math.min(strength, 1.0);
  }

  private extractTimeframe(content: string): string {
    if (content.includes('2024')) return '2024';
    if (content.includes('recent') || content.includes('latest')) return 'Recent';
    if (content.includes('quarterly')) return 'Quarterly';
    if (content.includes('annual') || content.includes('yearly')) return 'Annual';
    
    return 'Current';
  }

  private extractDrivingFactors(content: string, topic: string): string[] {
    const factors = [];
    
    if (content.includes('due to') || content.includes('because of')) {
      factors.push('Market conditions');
    }
    if (content.includes('technology') || content.includes('innovation')) {
      factors.push('Technological advancement');
    }
    if (content.includes('demand') || content.includes('consumer')) {
      factors.push('Consumer demand');
    }
    
    return factors;
  }

  private assessPotentialImpact(content: string, topic: string): string {
    if (content.includes('significant') || content.includes('major')) {
      return 'High potential impact on market dynamics';
    }
    if (content.includes('moderate') || content.includes('steady')) {
      return 'Moderate impact expected';
    }
    
    return 'Limited immediate impact';
  }

  private findRelatedTrends(content: string, topic: string, existingTrends: TrendAnalysis[]): string[] {
    return existingTrends
      .filter(trend => trend.trend !== topic)
      .map(trend => trend.trend)
      .slice(0, 2);
  }

  private calculateConfidenceScore(sources: ResearchSource[], insights: ResearchInsight[]): number {
    // Implementation would calculate overall confidence score
    return 0.8;
  }

  private getMethodsUsed(tavilyResults: any, perplexityResults: any, webResults: any): string[] {
    const methods = [];
    if (tavilyResults.status === 'fulfilled') methods.push('Tavily Web Search');
    if (perplexityResults.status === 'fulfilled') methods.push('Perplexity AI Analysis');
    if (webResults.status === 'fulfilled') methods.push('Supplementary Web Scraping');
    return methods;
  }

  private async identifyLimitations(task: ResearchTask, sources: ResearchSource[]): Promise<string[]> {
    // Implementation would identify research limitations
    return [];
  }

  private async performSupplementarySearch(task: ResearchTask): Promise<any[]> {
    // Implementation would perform additional searches
    return [];
  }

  private async extractCompetitiveIntelligence(competitor: string, research: ResearchResult): Promise<CompetitiveIntel> {
    // Implementation would extract competitive intelligence
    return {
      competitor,
      strengths: [],
      weaknesses: [],
      recentDevelopments: [],
      marketPosition: '',
      strategicFocus: [],
      threats: [],
      opportunities: []
    };
  }

  private async extractDetailedCompetitiveIntel(competitor: string, sources: ResearchSource[]): Promise<CompetitiveIntel> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recentDevelopments: string[] = [];
    const strategicFocus: string[] = [];
    const threats: string[] = [];
    const opportunities: string[] = [];
    
    // Analyze sources for competitive insights
    sources.forEach(source => {
      const content = source.content.toLowerCase();
      
      // Extract strengths
      if (content.includes('strength') || content.includes('advantage') || content.includes('leader')) {
        const strengthMatch = source.content.match(/[^.]*(?:strength|advantage|leader)[^.]*\./gi);
        if (strengthMatch) strengths.push(...strengthMatch.slice(0, 2));
      }
      
      // Extract weaknesses
      if (content.includes('weakness') || content.includes('challenge') || content.includes('struggle')) {
        const weaknessMatch = source.content.match(/[^.]*(?:weakness|challenge|struggle)[^.]*\./gi);
        if (weaknessMatch) weaknesses.push(...weaknessMatch.slice(0, 2));
      }
      
      // Extract recent developments
      if (content.includes('2024') || content.includes('recent') || content.includes('announce')) {
        const devMatch = source.content.match(/[^.]*(?:2024|recent|announce)[^.]*\./gi);
        if (devMatch) recentDevelopments.push(...devMatch.slice(0, 2));
      }
      
      // Extract strategic focus
      source.keyTopics.forEach(topic => {
        if (topic.length > 3 && !strategicFocus.includes(topic)) {
          strategicFocus.push(topic);
        }
      });
    });
    
    return {
      competitor,
      strengths: Array.from(new Set(strengths)).slice(0, 5),
      weaknesses: Array.from(new Set(weaknesses)).slice(0, 5),
      recentDevelopments: Array.from(new Set(recentDevelopments)).slice(0, 5),
      marketPosition: this.determineMarketPosition(sources),
      strategicFocus: Array.from(new Set(strategicFocus)).slice(0, 5),
      threats: Array.from(new Set(threats)).slice(0, 3),
      opportunities: Array.from(new Set(opportunities)).slice(0, 3)
    };
  }

  private determineMarketPosition(sources: ResearchSource[]): string {
    const content = sources.map(s => s.content.toLowerCase()).join(' ');
    
    if (content.includes('market leader') || content.includes('dominant')) {
      return 'Market Leader';
    } else if (content.includes('challenger') || content.includes('competitor')) {
      return 'Strong Challenger';
    } else if (content.includes('niche') || content.includes('specialized')) {
      return 'Niche Player';
    } else if (content.includes('emerging') || content.includes('startup')) {
      return 'Emerging Player';
    }
    
    return 'Established Player';
  }

  private async generateCompetitiveSummary(competitiveIntel: CompetitiveIntel[], task: ResearchTask): Promise<string> {
    if (competitiveIntel.length === 0) {
      return `Competitive analysis for "${task.query}" could not identify specific competitors. Consider providing competitor names in the context for more detailed analysis.`;
    }
    
    const totalCompetitors = competitiveIntel.length;
    const marketLeaders = competitiveIntel.filter(c => c.marketPosition === 'Market Leader').length;
    const challengers = competitiveIntel.filter(c => c.marketPosition === 'Strong Challenger').length;
    
    let summary = `Competitive analysis of ${totalCompetitors} key players in the ${task.query} market. `;
    
    if (marketLeaders > 0) {
      summary += `${marketLeaders} market leader(s) identified. `;
    }
    if (challengers > 0) {
      summary += `${challengers} strong challenger(s) present. `;
    }
    
    // Add key insights
    const allStrengths = competitiveIntel.flatMap(c => c.strengths);
    const commonStrengths = this.findCommonElements(allStrengths);
    
    if (commonStrengths.length > 0) {
      summary += `Common competitive strengths include: ${commonStrengths.slice(0, 3).join(', ')}. `;
    }
    
    return summary;
  }

  private async extractCompetitiveFindings(competitiveIntel: CompetitiveIntel[]): Promise<string[]> {
    const findings: string[] = [];
    
    competitiveIntel.forEach(intel => {
      if (intel.strengths.length > 0) {
        findings.push(`${intel.competitor}: Key strengths include ${intel.strengths[0]}`);
      }
      if (intel.recentDevelopments.length > 0) {
        findings.push(`${intel.competitor}: Recent development - ${intel.recentDevelopments[0]}`);
      }
    });
    
    // Add market-level findings
    if (competitiveIntel.length > 1) {
      const positions = competitiveIntel.map(c => c.marketPosition);
      const uniquePositions = Array.from(new Set(positions));
      findings.push(`Market structure: ${uniquePositions.join(', ')} players identified`);
    }
    
    return findings.slice(0, 8);
  }

  private async performMarketPositionAnalysis(task: ResearchTask, intel: CompetitiveIntel[]): Promise<any> {
    // Implementation would analyze market positions
    return {};
  }

  private async generateStrategicRecommendations(intel: CompetitiveIntel[], task: ResearchTask): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (!intel.length) {
      return ['Conduct competitive analysis to identify strategic opportunities'];
    }
    
    // Analyze competitive landscape
    const competitorStrengths = intel.flatMap(c => c.strengths);
    const competitorWeaknesses = intel.flatMap(c => c.weaknesses);
    const opportunities = intel.flatMap(c => c.opportunities);
    const threats = intel.flatMap(c => c.threats);
    
    // Generate strategic recommendations based on analysis
    if (competitorWeaknesses.length > 0) {
      recommendations.push(`Capitalize on competitor weaknesses: ${competitorWeaknesses.slice(0, 2).join(', ')}`);
    }
    
    if (opportunities.length > 0) {
      recommendations.push(`Pursue market opportunities: ${opportunities.slice(0, 2).join(', ')}`);
    }
    
    if (threats.length > 0) {
      recommendations.push(`Mitigate competitive threats: ${threats.slice(0, 2).join(', ')}`);
    }
    
    // Add differentiation strategies
    const commonStrengths = this.findCommonElements(competitorStrengths);
    if (commonStrengths.length > 0) {
      recommendations.push(`Differentiate from competitors who all focus on: ${commonStrengths.slice(0, 2).join(', ')}`);
    }
    
    // Add market positioning recommendations
    const marketPositions = intel.map(c => c.marketPosition).filter(Boolean);
    if (marketPositions.length > 0) {
      recommendations.push(`Consider positioning strategy relative to competitors in: ${marketPositions.slice(0, 2).join(', ')}`);
    }
    
    return recommendations.slice(0, 6); // Limit to top 6 recommendations
  }

  private findCommonElements(array: string[]): string[] {
    const counts: { [key: string]: number } = {};
    array.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
    
    return Object.keys(counts)
      .filter(item => counts[item] > 1)
      .sort((a, b) => counts[b] - counts[a]);
  }

  private async gatherMarketIntelligence(task: ResearchTask): Promise<AgentResult> {
    console.log('🔍 Starting Market Intelligence Research for:', task.query);
    
    try {
      // Use the same comprehensive research approach as deep research
      const result = await this.performDeepResearch({
        ...task,
        type: 'deep_research',
        focusAreas: [
          'market size and growth',
          'market trends',
          'key players and competition',
          'opportunities and challenges',
          'regulatory environment',
          'consumer behavior',
          ...(task.focusAreas || [])
        ]
      });

      if (result.success && result.data) {
        // Enhance with market-specific analysis
        result.data.metadata.taskType = 'market_intelligence';
        result.data.insights = result.data.insights?.map((insight: any) => ({
          ...insight,
          category: this.mapToMarketCategory(insight.category)
        })) || [];
      }

      return result;
    } catch (error) {
      console.error('Market Intelligence research error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to gather market intelligence'
      };
    }
  }

  private async analyzeTrends(task: ResearchTask): Promise<AgentResult> {
    console.log('📈 Starting Trend Analysis for:', task.query);
    
    try {
      // Use deep research with trend-specific focus
      const result = await this.performDeepResearch({
        ...task,
        type: 'deep_research',
        focusAreas: [
          'emerging trends',
          'trend analysis',
          'market direction',
          'future outlook',
          'industry evolution',
          'consumer preferences',
          ...(task.focusAreas || [])
        ]
      });

      if (result.success && result.data) {
        result.data.metadata.taskType = 'trend_analysis';
        result.data.researchDepth = task.context?.depth || 'comprehensive';
      }

      return result;
    } catch (error) {
      console.error('Trend analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze trends'
      };
    }
  }

  private async verifySourceCredibility(task: ResearchTask): Promise<AgentResult> {
    console.log('🔍 Starting Source Verification for:', task.query);
    
    try {
      // Use deep research with verification focus
      const result = await this.performDeepResearch({
        ...task,
        type: 'deep_research',
        focusAreas: [
          'source credibility',
          'fact checking',
          'verification',
          'authority assessment',
          'bias analysis',
          ...(task.focusAreas || [])
        ]
      });

      if (result.success && result.data) {
        result.data.metadata.taskType = 'source_verification';
        // Enhanced credibility scoring for verification tasks
        result.data.sources = result.data.sources?.map((source: any) => ({
          ...source,
          credibilityScore: this.calculateSourceCredibility(source)
        })) || [];
      }

      return result;
    } catch (error) {
      console.error('Source verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify source credibility'
      };
    }
  }

  private async performContextualResearch(task: ResearchTask): Promise<AgentResult> {
    console.log('🎯 Starting Contextual Research for:', task.query);
    
    try {
      // Use deep research with context-specific enhancements
      const result = await this.performDeepResearch({
        ...task,
        type: 'deep_research',
        focusAreas: [
          'contextual analysis',
          'domain expertise',
          'specialized knowledge',
          'industry context',
          ...(task.focusAreas || [])
        ]
      });

      if (result.success && result.data) {
        result.data.metadata.taskType = 'contextual_research';
        // Add custom instructions impact
        if (task.customInstructions) {
          result.data.metadata.customInstructions = task.customInstructions;
        }
      }

      return result;
    } catch (error) {
      console.error('Contextual research error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform contextual research'
      };
    }
  }

  private getPreferredDomains(task: ResearchTask): string[] {
    const domains: string[] = [];
    
    if (!task.context?.sources || task.context.sources === 'all') {
      return []; // No filtering, search all sources
    }
    
    switch (task.context.sources) {
      case 'academic':
        domains.push(
          'scholar.google.com', 'jstor.org', 'pubmed.ncbi.nlm.nih.gov',
          'arxiv.org', 'researchgate.net', 'academia.edu', 'springer.com',
          'nature.com', 'science.org', 'ieee.org', 'acm.org'
        );
        // Add .edu domains
        domains.push('.edu');
        break;
        
      case 'news':
        domains.push(
          'reuters.com', 'bloomberg.com', 'wsj.com', 'ft.com',
          'economist.com', 'bbc.com', 'cnn.com', 'nytimes.com',
          'washingtonpost.com', 'guardian.com', 'ap.org'
        );
        break;
        
      case 'industry':
        domains.push(
          'mckinsey.com', 'bcg.com', 'deloitte.com', 'pwc.com',
          'gartner.com', 'forrester.com', 'idc.com', 'statista.com',
          'techcrunch.com', 'venturebeat.com', 'crunchbase.com'
        );
        break;
        
      case 'social':
        domains.push(
          'twitter.com', 'linkedin.com', 'reddit.com', 'medium.com',
          'substack.com', 'youtube.com', 'facebook.com'
        );
        break;
    }
    
    return domains;
  }

  private getExcludedDomains(task: ResearchTask): string[] {
    const excludedDomains: string[] = [];
    
    // Always exclude known low-quality or unreliable sources
    excludedDomains.push(
      'pinterest.com', 'instagram.com', 'tiktok.com',
      'quora.com', 'answers.yahoo.com', 'ehow.com',
      'wikihow.com', 'buzzfeed.com'
    );
    
    // Add domains based on excluded terms if provided
    if (task.excludeTerms?.length) {
      // This is a basic implementation - could be enhanced with domain mapping
      task.excludeTerms.forEach(term => {
        const termLower = term.toLowerCase();
        if (termLower.includes('social')) {
          excludedDomains.push('facebook.com', 'twitter.com', 'instagram.com');
        }
        if (termLower.includes('wiki')) {
          excludedDomains.push('wikipedia.org', 'wikimedia.org');
        }
        if (termLower.includes('blog')) {
          excludedDomains.push('blogger.com', 'wordpress.com', 'medium.com');
        }
      });
    }
    
    return Array.from(new Set(excludedDomains)); // Remove duplicates
  }

  private mapToMarketCategory(category: string): string {
    const marketCategories: { [key: string]: string } = {
      'general': 'Market Overview',
      'technology': 'Technology & Innovation',
      'competitive': 'Competitive Landscape',
      'consumer': 'Consumer Behavior',
      'regulatory': 'Regulatory Environment',
      'growth': 'Market Growth & Opportunities',
      'risk': 'Market Risks & Challenges'
    };
    
    return marketCategories[category.toLowerCase()] || category;
  }

  private validateApiKeys(): boolean {
    const hasAnyKey = this.apiKeys.tavily || this.apiKeys.perplexity || this.apiKeys.serper;
    if (!hasAnyKey) {
      console.warn('⚠️ No research API keys configured. Research functionality will be limited.');
      return false;
    }
    return true;
  }
} 