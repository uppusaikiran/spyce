import { BaseAgent, AgentConfig, AgentMessage, AgentResult, agentOrchestrator } from './index';

interface DiscoveryTask {
  type: 'discover_competitors' | 'analyze_industry' | 'find_sources';
  industry?: string;
  existingCompetitors?: string[];
  keywords?: string[];
  region?: string;
}

interface CompetitorDiscoveryResult {
  competitors: {
    domain: string;
    name: string;
    description: string;
    relevanceScore: number;
    industry: string;
    similarityReasons: string[];
  }[];
  sources: {
    url: string;
    type: 'news' | 'blog' | 'directory' | 'social';
    relevance: number;
  }[];
}

export class DiscoveryAgent extends BaseAgent {
  private apiKeys = {
    serper: process.env.SERPER_API_KEY,
    tavily: process.env.TAVILY_API_KEY,
  };

  constructor() {
    const config: AgentConfig = {
      id: 'discovery_agent',
      name: 'Discovery Agent',
      role: 'Competitor & Source Discovery',
      capabilities: [
        'Industry Analysis',
        'Competitor Discovery',
        'Source Identification',
        'Market Research',
        'Relevance Scoring'
      ],
      status: 'idle'
    };
    super(config);
  }

  async execute(task: DiscoveryTask): Promise<AgentResult> {
    try {
      this.config.status = 'working';
      
      switch (task.type) {
        case 'discover_competitors':
          return await this.discoverCompetitors(task);
        case 'analyze_industry':
          return await this.analyzeIndustry(task);
        case 'find_sources':
          return await this.findSources(task);
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
    } catch (error) {
      this.config.status = 'error';
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      this.config.status = 'idle';
    }
  }

  private async discoverCompetitors(task: DiscoveryTask): Promise<AgentResult> {
    if (!task.industry && !task.keywords) {
      return {
        success: false,
        error: 'Industry or keywords required for competitor discovery'
      };
    }

    const searchQueries = this.generateSearchQueries(task);
    const discoveredCompetitors: CompetitorDiscoveryResult['competitors'] = [];
    const sources: CompetitorDiscoveryResult['sources'] = [];

    for (const query of searchQueries) {
      try {
        // Use Tavily for web search
        const searchResults = await this.performSearch(query);
        const competitors = await this.extractCompetitorsFromResults(searchResults, task);
        
        discoveredCompetitors.push(...competitors);
        
        // Extract valuable sources
        const querySources = searchResults.map(result => ({
          url: result.url,
          type: this.categorizeSource(result.url) as 'news' | 'blog' | 'directory' | 'social',
          relevance: result.score || 0.5
        }));
        
        sources.push(...querySources);
      } catch (error) {
        console.error(`Error searching with query "${query}":`, error);
      }
    }

    // Remove duplicates and score relevance
    const uniqueCompetitors = this.deduplicateAndScore(discoveredCompetitors, task);
    const uniqueSources = this.deduplicateSources(sources);

    const result: CompetitorDiscoveryResult = {
      competitors: uniqueCompetitors.slice(0, 20), // Limit to top 20
      sources: uniqueSources.slice(0, 50) // Limit to top 50 sources
    };

    // Notify other agents about discoveries
    await this.notifyCrawlingAgent(result.competitors);

    return {
      success: true,
      data: result,
      metadata: {
        totalQueries: searchQueries.length,
        competitorsFound: result.competitors.length,
        sourcesFound: result.sources.length
      }
    };
  }

  private async analyzeIndustry(task: DiscoveryTask): Promise<AgentResult> {
    if (!task.industry) {
      return {
        success: false,
        error: 'Industry is required for industry analysis'
      };
    }

    const analysisQueries = [
      `${task.industry} market leaders 2024`,
      `top companies in ${task.industry}`,
      `${task.industry} industry trends competitors`,
      `emerging players ${task.industry} startups`
    ];

    const industryData = {
      marketLeaders: [] as string[],
      emergingPlayers: [] as string[],
      industryTrends: [] as string[],
      keyTopics: [] as string[]
    };

    for (const query of analysisQueries) {
      try {
        const results = await this.performSearch(query);
        // Process results to extract industry insights
        // This would involve more sophisticated NLP in a real implementation
        const insights = this.extractIndustryInsights(results, query);
        
        if (query.includes('market leaders')) {
          industryData.marketLeaders.push(...insights);
        } else if (query.includes('emerging') || query.includes('startups')) {
          industryData.emergingPlayers.push(...insights);
        } else if (query.includes('trends')) {
          industryData.industryTrends.push(...insights);
        }
      } catch (error) {
        console.error(`Error analyzing industry with query "${query}":`, error);
      }
    }

    return {
      success: true,
      data: industryData,
      metadata: {
        industry: task.industry,
        analysisDate: new Date().toISOString()
      }
    };
  }

  private async findSources(task: DiscoveryTask): Promise<AgentResult> {
    const sourceQueries = [
      `${task.industry} news sources`,
      `${task.industry} blogs industry insights`,
      `${task.industry} market research reports`,
      `${task.industry} company directories`
    ];

    const sources: CompetitorDiscoveryResult['sources'] = [];

    for (const query of sourceQueries) {
      try {
        const results = await this.performSearch(query);
        const querySources = results
          .filter(result => this.isReliableSource(result.url))
          .map(result => ({
            url: result.url,
            type: this.categorizeSource(result.url) as 'news' | 'blog' | 'directory' | 'social',
            relevance: result.score || 0.5
          }));
        
        sources.push(...querySources);
      } catch (error) {
        console.error(`Error finding sources with query "${query}":`, error);
      }
    }

    const uniqueSources = this.deduplicateSources(sources)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 100);

    return {
      success: true,
      data: { sources: uniqueSources },
      metadata: {
        totalSources: uniqueSources.length,
        sourceTypes: this.categorizeSourceTypes(uniqueSources)
      }
    };
  }

  private generateSearchQueries(task: DiscoveryTask): string[] {
    const queries: string[] = [];
    
    if (task.industry) {
      // Industry-specific competitor queries
      queries.push(
        `top ${task.industry} companies 2024`,
        `leading ${task.industry} startups`,
        `${task.industry} market leaders competitors`,
        `best ${task.industry} software companies`,
        `${task.industry} SaaS platforms`,
        `${task.industry} industry analysis competitors`
      );
    }

    if (task.keywords && task.keywords.length > 0) {
      // Keyword-based queries
      for (const keyword of task.keywords.slice(0, 3)) { // Limit to avoid too many queries
        queries.push(
          `${keyword} companies`,
          `${keyword} software platforms`,
          `${keyword} industry leaders`,
          `best ${keyword} tools 2024`
        );
      }
      
      // Combined keyword queries
      if (task.keywords.length > 1) {
        const combinedKeywords = task.keywords.slice(0, 3).join(' ');
        queries.push(
          `${combinedKeywords} competitors`,
          `${combinedKeywords} alternatives`,
          `${combinedKeywords} market analysis`
        );
      }
    }

    // If we have existing competitors, find similar companies
    if (task.existingCompetitors && task.existingCompetitors.length > 0) {
      const existingCompany = task.existingCompetitors[0];
      queries.push(
        `companies like ${existingCompany}`,
        `${existingCompany} competitors alternatives`,
        `${existingCompany} vs competitors`
      );
    }

    // Regional queries if specified
    if (task.region) {
      queries.push(
        `${task.industry} companies ${task.region}`,
        `top ${task.region} ${task.industry} startups`
      );
    }

    // Remove duplicates and limit total queries
    return Array.from(new Set(queries)).slice(0, 8); // Limit to 8 queries to avoid rate limits
  }

  private async performSearch(query: string): Promise<any[]> {
    const allResults: any[] = [];

    // Try Tavily first
    try {
      const tavilyResults = await this.searchWithTavily(query);
      if (tavilyResults.length > 0) {
        allResults.push(...tavilyResults);
        console.log(`[DiscoveryAgent] Got ${tavilyResults.length} results from Tavily`);
      } else {
        console.log(`[DiscoveryAgent] No results from Tavily, using fallback`);
        const fallbackResults = await this.searchWithBasicFallback(query);
        allResults.push(...fallbackResults);
      }
    } catch (error) {
      console.error('[DiscoveryAgent] Search error, using fallback:', error);
      const fallbackResults = await this.searchWithBasicFallback(query);
      allResults.push(...fallbackResults);
    }

    return allResults;
  }

  private async searchWithTavily(query: string): Promise<any[]> {
    if (!this.apiKeys.tavily) {
      console.warn('Tavily API key not configured, skipping Tavily search');
      return [];
    }

    try {
      console.log(`[DiscoveryAgent] Searching with Tavily: "${query}"`);
      
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKeys.tavily}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          topic: 'general',
          search_depth: 'advanced',
          include_answer: false,
          include_raw_content: false,
          include_images: false,
          include_domains: [],
          exclude_domains: ['facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com'],
          max_results: 10
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DiscoveryAgent] Tavily API error: ${response.status} - ${errorText}`);
        return [];
      }

      const data = await response.json();
      console.log(`[DiscoveryAgent] Tavily returned ${data.results?.length || 0} results`);
      
      return data.results || [];
    } catch (error) {
      console.error('[DiscoveryAgent] Error calling Tavily API:', error);
      return [];
    }
  }

  private async searchWithBasicFallback(query: string): Promise<any[]> {
    // This is a fallback method that provides some real competitor examples
    // In a production app, you might use other APIs like Serper, Bing, or Google Custom Search
    console.log(`[DiscoveryAgent] Using basic fallback search for: "${query}"`);
    
    const industryCompetitors: Record<string, string[]> = {
      'crm': ['salesforce.com', 'hubspot.com', 'pipedrive.com', 'zoho.com', 'freshworks.com'],
      'ecommerce': ['shopify.com', 'woocommerce.com', 'magento.com', 'bigcommerce.com', 'squarespace.com'],
      'saas': ['atlassian.com', 'slack.com', 'notion.so', 'airtable.com', 'monday.com'],
      'marketing': ['mailchimp.com', 'constantcontact.com', 'sendinblue.com', 'convertkit.com', 'aweber.com'],
      'analytics': ['google.com', 'adobe.com', 'mixpanel.com', 'amplitude.com', 'hotjar.com'],
      'project management': ['asana.com', 'trello.com', 'monday.com', 'clickup.com', 'basecamp.com'],
      'communication': ['slack.com', 'microsoft.com', 'zoom.us', 'discord.com', 'telegram.org'],
      'design': ['figma.com', 'canva.com', 'adobe.com', 'sketch.com', 'invisionapp.com'],
      'development': ['github.com', 'gitlab.com', 'bitbucket.org', 'vercel.com', 'netlify.com'],
      'ai': ['openai.com', 'anthropic.com', 'cohere.ai', 'huggingface.co', 'replicate.com']
    };

    // Find matching industry keywords
    const lowerQuery = query.toLowerCase();
    const matchedDomains: string[] = [];
    
    for (const [industry, domains] of Object.entries(industryCompetitors)) {
      if (lowerQuery.includes(industry) || lowerQuery.includes(industry.replace(' ', ''))) {
        matchedDomains.push(...domains);
      }
    }

    // If no specific matches, provide general tech companies
    if (matchedDomains.length === 0) {
      matchedDomains.push(
        'microsoft.com', 'google.com', 'amazon.com', 'apple.com', 'meta.com',
        'salesforce.com', 'adobe.com', 'oracle.com', 'ibm.com', 'servicenow.com'
      );
    }

    // Convert to the expected format
    return matchedDomains.slice(0, 8).map(domain => ({
      url: `https://${domain}`,
      title: `${domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)} - Industry Leader`,
      content: `Leading company in the industry providing competitive solutions.`,
      score: 0.8
    }));
  }

  private async extractCompetitorsFromResults(results: any[], task: DiscoveryTask): Promise<CompetitorDiscoveryResult['competitors']> {
    const competitors: CompetitorDiscoveryResult['competitors'] = [];

    for (const result of results) {
      try {
        const url = new URL(result.url);
        const domain = url.hostname.replace('www.', '');
        
        // Skip if this domain is already in existing competitors
        if (task.existingCompetitors?.includes(domain)) {
          continue;
        }

        // Skip common non-company domains
        const skipDomains = [
          'wikipedia.org', 'linkedin.com', 'crunchbase.com', 'github.com',
          'stackoverflow.com', 'reddit.com', 'quora.com', 'medium.com',
          'forbes.com', 'techcrunch.com', 'bloomberg.com', 'reuters.com',
          'news.com', 'cnn.com', 'bbc.com', 'wsj.com', 'ft.com'
        ];
        
        if (skipDomains.some(skipDomain => domain.includes(skipDomain))) {
          continue;
        }

        // Only include .com, .io, .ai, .co domains (typical for companies)
        if (!domain.match(/\.(com|io|ai|co|net|org)$/)) {
          continue;
        }

        // Extract company information from the result
        const competitor = {
          domain,
          name: this.extractCompanyName(result.title, result.content, domain),
          description: this.extractDescription(result.content),
          relevanceScore: this.calculateRelevanceScore(result, task),
          industry: task.industry || 'Technology',
          similarityReasons: this.identifySimilarityReasons(result, task)
        };

        if (competitor.relevanceScore > 0.2 && competitor.name.length > 2) { // Only include relevant competitors with valid names
          competitors.push(competitor);
        }
      } catch (error) {
        console.error('Error extracting competitor from result:', error);
      }
    }

    return competitors;
  }

  private extractCompanyName(title: string, content: string, domain: string): string {
    // Try to extract company name from title first
    let companyName = '';
    
    // Remove common suffixes from title
    const cleanTitle = title
      .replace(/\s*-\s*(Home|Homepage|Official Website|Website).*$/i, '')
      .replace(/\s*\|\s*.*$/i, '')
      .replace(/\s*:.*$/i, '')
      .trim();
    
    // Look for company patterns in title
    const titlePatterns = [
      /^([A-Z][a-zA-Z0-9\s&]+?)(?:\s*-|\s*\||$)/,
      /^([A-Z][a-zA-Z0-9\s&]+)$/
    ];
    
    for (const pattern of titlePatterns) {
      const match = cleanTitle.match(pattern);
      if (match && match[1].length > 2 && match[1].length < 50) {
        companyName = match[1].trim();
        break;
      }
    }
    
    // If no good name from title, try to extract from domain
    if (!companyName || companyName.length < 3) {
      const domainParts = domain.split('.');
      companyName = domainParts[0]
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
    }
    
    // Clean up the company name
    companyName = companyName
      .replace(/\b(Inc|LLC|Corp|Ltd|Company|Co)\b\.?/gi, '')
      .replace(/[^\w\s&]/g, '')
      .trim();
    
    return companyName || domain;
  }

  private extractDescription(content: string): string {
    // Extract first meaningful sentence as description
    const sentences = content.split('.').filter(s => s.trim().length > 20);
    return sentences[0]?.trim() + '.' || 'No description available';
  }

  private calculateRelevanceScore(result: any, task: DiscoveryTask): number {
    let score = 0.5; // Base score

    // Boost score based on content relevance
    if (task.keywords) {
      const content = (result.title + ' ' + result.content).toLowerCase();
      const matchingKeywords = task.keywords.filter(keyword => 
        content.includes(keyword.toLowerCase())
      );
      score += (matchingKeywords.length / task.keywords.length) * 0.3;
    }

    // Boost score for commercial domains
    if (result.url.includes('.com') && !result.url.includes('wikipedia')) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  private identifySimilarityReasons(result: any, task: DiscoveryTask): string[] {
    const reasons: string[] = [];
    
    if (task.industry) {
      reasons.push(`Same industry: ${task.industry}`);
    }

    if (task.keywords) {
      const content = (result.title + ' ' + result.content).toLowerCase();
      const matchingKeywords = task.keywords.filter(keyword => 
        content.includes(keyword.toLowerCase())
      );
      if (matchingKeywords.length > 0) {
        reasons.push(`Matching keywords: ${matchingKeywords.join(', ')}`);
      }
    }

    return reasons;
  }

  private categorizeSource(url: string): string {
    const domain = url.toLowerCase();
    
    if (domain.includes('news') || domain.includes('reuters') || domain.includes('bloomberg')) {
      return 'news';
    } else if (domain.includes('blog') || domain.includes('medium')) {
      return 'blog';
    } else if (domain.includes('directory') || domain.includes('list')) {
      return 'directory';
    } else if (domain.includes('twitter') || domain.includes('linkedin') || domain.includes('facebook')) {
      return 'social';
    }
    
    return 'blog'; // Default to blog
  }

  private isReliableSource(url: string): boolean {
    const reliableDomains = [
      'reuters.com', 'bloomberg.com', 'techcrunch.com', 'forbes.com',
      'wsj.com', 'ft.com', 'economist.com', 'cnbc.com'
    ];
    
    const domain = new URL(url).hostname.replace('www.', '');
    return reliableDomains.some(reliable => domain.includes(reliable)) ||
           !url.includes('spam') && !url.includes('ads');
  }

  private deduplicateAndScore(competitors: CompetitorDiscoveryResult['competitors'], task: DiscoveryTask): CompetitorDiscoveryResult['competitors'] {
    const seen = new Set<string>();
    return competitors
      .filter(competitor => {
        if (seen.has(competitor.domain)) {
          return false;
        }
        seen.add(competitor.domain);
        return true;
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private deduplicateSources(sources: CompetitorDiscoveryResult['sources']): CompetitorDiscoveryResult['sources'] {
    const seen = new Set<string>();
    return sources.filter(source => {
      if (seen.has(source.url)) {
        return false;
      }
      seen.add(source.url);
      return true;
    });
  }

  private extractIndustryInsights(results: any[], query: string): string[] {
    // Simplified insight extraction - in reality, this would use NLP
    return results
      .flatMap(result => result.content.split('.'))
      .filter(sentence => sentence.length > 20)
      .slice(0, 5);
  }

  private categorizeSourceTypes(sources: CompetitorDiscoveryResult['sources']): Record<string, number> {
    const types: Record<string, number> = {};
    sources.forEach(source => {
      types[source.type] = (types[source.type] || 0) + 1;
    });
    return types;
  }

  private async notifyCrawlingAgent(competitors: CompetitorDiscoveryResult['competitors']): Promise<void> {
    // Notify the crawling agent about new competitors to crawl
    await this.sendMessage('crawling_agent', 'task', {
      type: 'new_competitors',
      competitors: competitors.slice(0, 10) // Send top 10 for immediate crawling
    });
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case 'task':
        const result = await this.execute(message.payload);
        await this.sendMessage(message.from, 'result', result);
        break;
      case 'status':
        await this.sendMessage(message.from, 'status', this.getStatus());
        break;
      default:
        console.log(`Discovery Agent received unknown message type: ${message.type}`);
    }
  }
} 