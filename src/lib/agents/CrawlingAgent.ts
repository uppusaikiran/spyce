import { BaseAgent, AgentConfig, AgentMessage, AgentResult } from './index';

interface CrawlingTask {
  type: 'crawl_domain' | 'batch_crawl' | 'monitor_changes' | 'new_competitors';
  domains?: string[];
  competitors?: Array<{
    domain: string;
    name: string;
    sections?: string[];
  }>;
  sections?: string[];
  priority?: 'high' | 'medium' | 'low';
  frequency?: 'daily' | 'weekly' | 'monthly';
  antiDetection?: boolean;
  maxConcurrency?: number;
  changeDetection?: boolean;
  targetSections?: string[];
}

interface CrawlingResult {
  success: boolean;
  domain: string;
  data?: {
    title: string;
    content: string;
    metadata: {
      lastModified?: string;
      contentType: string;
      wordCount: number;
      links: string[];
      images: string[];
    };
    sections: Record<string, string>;
    changes?: {
      type: 'new' | 'modified' | 'removed';
      details: string[];
    };
  };
  error?: string;
  crawlMetrics: {
    responseTime: number;
    statusCode: number;
    contentSize: number;
    timestamp: string;
  };
}

interface BatchCrawlingResult {
  successful: number;
  failed: number;
  results: CrawlingResult[];
  summary: {
    totalCrawled: number;
    successRate: number;
  };
}

export class CrawlingAgent extends BaseAgent {
  private rateLimits: Map<string, { lastRequest: number; requestCount: number }> = new Map();
  private proxies: string[] = [];
  private antiDetectionDomains = new Set(['cloudflare.com', 'amazonaws.com', 'fastly.com']);
  private apiKeys: {
    tavily?: string;
  } = {};

  constructor() {
    const config: AgentConfig = {
      id: 'crawling_agent',
      name: 'Intelligent Web Crawling Agent',
      role: 'Web crawling, content extraction, and site monitoring',
      capabilities: [
        'Anti-Detection Crawling',
        'Tavily API Integration',
        'Rate Limiting & Proxy Management',
        'Content Extraction & Processing',
        'Change Detection & Monitoring',
        'Batch Processing'
      ],
      status: 'idle'
    };
    
    super(config);
    
    // Initialize API keys from environment
    this.apiKeys = {
      tavily: process.env.TAVILY_API_KEY,
    };
  }

  async execute(task: CrawlingTask): Promise<AgentResult> {
    try {
      this.config.status = 'working';
      
      switch (task.type) {
        case 'crawl_domain':
          return await this.crawlSingleDomain(task);
        case 'batch_crawl':
          return await this.batchCrawl(task);
        case 'monitor_changes':
          return await this.monitorChanges(task);
        case 'new_competitors':
          return await this.handleNewCompetitors(task);
        default:
          throw new Error(`Unknown crawling task type: ${task.type}`);
      }
    } catch (error) {
      this.config.status = 'error';
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown crawling error occurred'
      };
    } finally {
      this.config.status = 'idle';
    }
  }

  private async crawlSingleDomain(task: CrawlingTask): Promise<AgentResult> {
    if (!task.domains || task.domains.length === 0) {
      return {
        success: false,
        error: 'No domain specified for crawling'
      };
    }

    const domain = task.domains[0];
    const crawlResult = await this.performCrawl(domain, task);
    
    if (crawlResult.success && crawlResult.data) {
      // Notify analysis agent about new content
      await this.sendMessage('analysis_agent', 'task', {
        type: 'analyze_content',
        domain,
        content: crawlResult.data,
        priority: task.priority || 'medium'
      });
    }

    return {
      success: crawlResult.success,
      data: crawlResult,
      metadata: {
        domain,
        crawlTime: new Date().toISOString(),
        antiDetectionUsed: task.antiDetection || false
      }
    };
  }

  private async batchCrawl(task: CrawlingTask): Promise<AgentResult> {
    if (!task.domains || task.domains.length === 0) {
      return {
        success: false,
        error: 'No domains specified for batch crawling'
      };
    }

    const results: CrawlingResult[] = [];
    const concurrencyLimit = 3; // Limit concurrent crawls to avoid detection
    
    for (let i = 0; i < task.domains.length; i += concurrencyLimit) {
      const batch = task.domains.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(domain => this.performCrawl(domain, task));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            domain: batch[index],
            error: result.reason?.message || 'Unknown error',
            crawlMetrics: {
              responseTime: 0,
              statusCode: 0,
              contentSize: 0,
              timestamp: new Date().toISOString()
            }
          });
        }
      });

      // Add delay between batches to avoid rate limiting
      if (i + concurrencyLimit < task.domains.length) {
        await this.delay(2000); // 2 second delay between batches
      }
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    // Notify analysis agent about successful crawls
    if (successful.length > 0) {
      await this.sendMessage('analysis_agent', 'task', {
        type: 'batch_analyze',
        results: successful,
        priority: task.priority || 'medium'
      });
    }

    return {
      success: successful.length > 0,
      data: {
        successful: successful.length,
        failed: failed.length,
        results,
        summary: {
          totalCrawled: results.length,
          successRate: (successful.length / results.length) * 100
        }
      },
      metadata: {
        batchSize: task.domains.length,
        crawlTime: new Date().toISOString()
      }
    };
  }

  private async monitorChanges(task: CrawlingTask): Promise<AgentResult> {
    if (!task.domains) {
      return {
        success: false,
        error: 'No domains specified for change monitoring'
      };
    }

    const changes: Array<{
      domain: string;
      changes: { type: 'new' | 'modified' | 'removed'; details: string[] };
      content?: CrawlingResult['data'];
    }> = [];

    for (const domain of task.domains) {
      try {
        const currentResult = await this.performCrawl(domain, task);
        if (currentResult.success && currentResult.data) {
          const detectedChanges = await this.detectChanges(domain, currentResult.data);
          
          if (detectedChanges && detectedChanges.details.length > 0) {
            changes.push({
              domain,
              changes: detectedChanges,
              content: currentResult.data
            });

            // Notify alert agent about changes
            await this.sendMessage('alert_agent', 'task', {
              type: 'competitor_change',
              domain,
              changes: detectedChanges,
              priority: this.calculateChangePriority(detectedChanges)
            });
          }
        }
      } catch (error) {
        console.error(`Error monitoring changes for ${domain}:`, error);
      }
    }

    return {
      success: true,
      data: {
        totalMonitored: task.domains.length,
        changesDetected: changes.length,
        changes
      },
      metadata: {
        monitoringTime: new Date().toISOString(),
        nextCheck: this.calculateNextCheckTime(task.frequency || 'daily')
      }
    };
  }

  private async handleNewCompetitors(task: CrawlingTask): Promise<AgentResult> {
    if (!task.competitors || task.competitors.length === 0) {
      return {
        success: false,
        error: 'No competitors specified'
      };
    }

    const crawlResults: CrawlingResult[] = [];

    for (const competitor of task.competitors) {
      try {
        const crawlTask: CrawlingTask = {
          type: 'crawl_domain',
          domains: [competitor.domain],
          sections: competitor.sections || ['/', '/about', '/pricing', '/blog'],
          priority: 'high', // New competitors get high priority
          antiDetection: true
        };

        const result = await this.crawlSingleDomain(crawlTask);
        if (result.success && result.data) {
          crawlResults.push(result.data as CrawlingResult);
        }
      } catch (error) {
        console.error(`Error crawling new competitor ${competitor.domain}:`, error);
      }
    }

    return {
      success: crawlResults.length > 0,
      data: {
        competitorsCrawled: crawlResults.length,
        results: crawlResults
      },
      metadata: {
        newCompetitorsCount: task.competitors.length,
        successfulCrawls: crawlResults.length
      }
    };
  }

  private async performCrawl(domain: string, task: CrawlingTask): Promise<CrawlingResult> {
    const startTime = Date.now();
    
    try {
      // Check rate limits
      if (!this.checkRateLimit(domain)) {
        await this.delay(this.calculateDelayForDomain(domain));
      }

      // Clean domain for crawling
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const url = `https://${cleanDomain}`;

      // Update rate limit
      this.updateRateLimit(cleanDomain);

      let crawlData;
      let lastError: Error | null = null;

      // Try Tavily Extract API first
      if (this.apiKeys.tavily) {
        try {
          crawlData = await this.crawlWithTavily(url);
          if (crawlData) {
            const responseTime = Date.now() - startTime;
            return {
              success: true,
              domain: cleanDomain,
              data: this.processContent(crawlData.raw_content || '', url, task),
              crawlMetrics: {
                responseTime,
                statusCode: 200,
                contentSize: crawlData.raw_content?.length || 0,
                timestamp: new Date().toISOString()
              }
            };
          }
        } catch (error) {
          lastError = error as Error;
          console.log(`Tavily failed for ${url}:`, error);
        }
      }

      // Fallback to basic crawling
      try {
        crawlData = await this.basicCrawl(url);
        if (crawlData) {
          const responseTime = Date.now() - startTime;
          return {
            success: true,
            domain: cleanDomain,
            data: this.processContent(crawlData, url, task),
            crawlMetrics: {
              responseTime,
              statusCode: 200,
              contentSize: crawlData.length,
              timestamp: new Date().toISOString()
            }
          };
        }
      } catch (error) {
        lastError = error as Error;
        console.log(`Basic crawl failed for ${url}:`, error);
      }

      // If all methods fail
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        domain: cleanDomain,
        error: lastError?.message || 'All crawling methods failed',
        crawlMetrics: {
          responseTime,
          statusCode: 0,
          contentSize: 0,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        domain: domain,
        error: error instanceof Error ? error.message : 'Unknown error',
        crawlMetrics: {
          responseTime,
          statusCode: 0,
          contentSize: 0,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  private async crawlWithTavily(url: string): Promise<any> {
    if (!this.apiKeys.tavily) {
      throw new Error('Tavily API key not configured');
    }

    const response = await fetch('https://api.tavily.com/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKeys.tavily}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: [url], // Tavily expects an array of URLs
        include_images: false,
        extract_depth: 'basic',
        format: 'markdown'
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check if we have successful results
    if (data.results && data.results.length > 0) {
      return data.results[0]; // Return the first result
    }
    
    // Check for failed results
    if (data.failed_results && data.failed_results.length > 0) {
      throw new Error(`Tavily extraction failed: ${data.failed_results[0].error}`);
    }
    
    throw new Error('No content extracted from Tavily');
  }

  private async basicCrawl(url: string): Promise<string> {
    const userAgent = this.getRandomUserAgent();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  }

  private processContent(htmlContent: string, url: string, task: CrawlingTask): CrawlingResult['data'] {
    try {
      // Basic HTML parsing using regex since we don't have a full DOM parser
      const titleMatch = htmlContent.match(/<title[^>]*>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      // Extract meta description
      const metaDescMatch = htmlContent.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
      const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';
      
      // Remove script, style, nav, footer, and other non-content tags
      let cleanContent = htmlContent
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, ''); // Remove comments
      
      // Extract main content areas (prioritize main, article, content divs)
      const mainContentMatch = cleanContent.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                              cleanContent.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                              cleanContent.match(/<div[^>]*(?:class|id)=["'][^"']*(?:content|main|article)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
      
      if (mainContentMatch) {
        cleanContent = mainContentMatch[1];
      }
      
      // Remove remaining HTML tags and clean up
      cleanContent = cleanContent
        .replace(/<[^>]+>/g, ' ') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\n\s*\n/g, '\n') // Remove excessive line breaks
        .trim();
      
      // Add meta description to beginning if available
      if (metaDescription && !cleanContent.toLowerCase().includes(metaDescription.toLowerCase().substring(0, 50))) {
        cleanContent = `${metaDescription}\n\n${cleanContent}`;
      }
      
      // Extract links (filter out common non-content links)
      const linkMatches = htmlContent.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi) || [];
      const links = linkMatches
        .map(link => {
          const hrefMatch = link.match(/href=["']([^"']+)["']/i);
          return hrefMatch ? hrefMatch[1] : null;
        })
        .filter((link): link is string => Boolean(link))
        .filter(link => {
          // Filter out common non-content links
          const href = link.toLowerCase();
          return !href.includes('javascript:') && 
                 !href.includes('mailto:') && 
                 !href.includes('#') &&
                 !href.includes('facebook.com') &&
                 !href.includes('twitter.com') &&
                 !href.includes('linkedin.com') &&
                 !href.includes('instagram.com');
        });
      
      // Extract images (filter out common non-content images)
      const imageMatches = htmlContent.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) || [];
      const images = imageMatches
        .map(img => {
          const srcMatch = img.match(/src=["']([^"']+)["']/i);
          return srcMatch ? srcMatch[1] : null;
        })
        .filter((src): src is string => Boolean(src))
        .filter(src => {
          // Filter out common non-content images
          const imgSrc = src.toLowerCase();
          return !imgSrc.includes('logo') && 
                 !imgSrc.includes('icon') && 
                 !imgSrc.includes('button') &&
                 !imgSrc.includes('pixel') &&
                 !imgSrc.includes('tracking');
        });

      return {
        title,
        content: cleanContent.substring(0, 8000), // Increased content size
        metadata: {
          lastModified: new Date().toISOString(),
          contentType: 'text/html',
          wordCount: cleanContent.split(/\s+/).filter(word => word.length > 0).length,
          links: links.slice(0, 50), // Limit number of links
          images: images.slice(0, 20) // Limit number of images
        },
        sections: this.extractSections(cleanContent, task.targetSections || ['/'])
      };
    } catch (error) {
      console.error('Error processing content:', error);
      return {
        title: '',
        content: htmlContent.substring(0, 1000),
        metadata: {
          lastModified: new Date().toISOString(),
          contentType: 'text/html',
          wordCount: 0,
          links: [],
          images: []
        },
        sections: {}
      };
    }
  }

  private extractSections(content: string, sections: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    
    // If sections include '/', return the full content
    if (sections.includes('/')) {
      result['/'] = content;
      return result;
    }
    
    // Try to extract specific sections based on keywords
    for (const section of sections) {
      const keywords = section.toLowerCase().split(/[,\s]+/);
      const sectionContent: string[] = [];
      
      // Look for content that contains these keywords
      const sentences = content.split(/[.!?]+/);
      for (const sentence of sentences) {
        const lowerSentence = sentence.toLowerCase();
        if (keywords.some(keyword => lowerSentence.includes(keyword))) {
          sectionContent.push(sentence.trim());
        }
      }
      
      if (sectionContent.length > 0) {
        result[section] = sectionContent.join('. ').substring(0, 2000); // Limit section size
      }
    }
    
    // If no specific sections found, return a summary
    if (Object.keys(result).length === 0) {
      result['summary'] = content.substring(0, 1000);
    }
    
    return result;
  }

  private async detectChanges(domain: string, currentData: CrawlingResult['data']): Promise<{ type: 'new' | 'modified' | 'removed'; details: string[] } | null> {
    // This would typically compare with stored previous crawl data
    // For now, we'll simulate change detection
    const changeTypes: Array<'new' | 'modified' | 'removed'> = ['new', 'modified'];
    const randomChangeType = changeTypes[Math.floor(Math.random() * changeTypes.length)];
    
    return {
      type: randomChangeType,
      details: [
        `Content ${randomChangeType} in ${domain}`,
        `Word count: ${currentData?.metadata.wordCount || 0}`,
        `Last check: ${new Date().toISOString()}`
      ]
    };
  }

  private calculateChangePriority(changes: { type: 'new' | 'modified' | 'removed'; details: string[] } | null): 'high' | 'medium' | 'low' {
    if (!changes) return 'low';
    
    if (changes.type === 'new' || changes.details.length > 5) {
      return 'high';
    } else if (changes.type === 'modified') {
      return 'medium';
    }
    
    return 'low';
  }

  private calculateNextCheckTime(frequency: string): string {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
    }
    return now.toISOString();
  }

  private checkRateLimit(domain: string): boolean {
    const now = Date.now();
    const limit = this.rateLimits.get(domain);
    
    if (!limit) return true;
    
    // Reset counter if more than 1 minute has passed
    if (now - limit.lastRequest > 60000) {
      this.rateLimits.set(domain, { lastRequest: now, requestCount: 1 });
      return true;
    }
    
    // Check if we're under the rate limit (max 10 requests per minute)
    return limit.requestCount < 10;
  }

  private calculateDelayForDomain(domain: string): number {
    const limit = this.rateLimits.get(domain);
    if (!limit) return 0;
    
    const timeSinceLastRequest = Date.now() - limit.lastRequest;
    const minDelay = 6000; // 6 seconds minimum between requests
    
    return Math.max(0, minDelay - timeSinceLastRequest);
  }

  private requiresAntiDetection(domain: string): boolean {
    return Array.from(this.antiDetectionDomains).some(pattern => domain.includes(pattern));
  }

  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateRateLimit(domain: string): void {
    const now = Date.now();
    const limit = this.rateLimits.get(domain);
    
    if (!limit || now - limit.lastRequest > 60000) {
      this.rateLimits.set(domain, { lastRequest: now, requestCount: 1 });
    } else {
      this.rateLimits.set(domain, { 
        lastRequest: now, 
        requestCount: limit.requestCount + 1 
      });
    }
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
        console.log(`Crawling Agent received unknown message type: ${message.type}`);
    }
  }
} 