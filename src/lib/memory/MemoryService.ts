import { MemoryClient } from 'mem0ai';

export interface MemoryContext {
  userId: string;
  sessionId?: string;
  domain?: string;
  researchType?: string;
}

export interface ResearchFindings {
  query: string;
  summary: string;
  keyFindings: string[];
  insights: string[];
  competitors?: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * MemoryService - A service for managing AI memory using Mem0
 * Handles storing and retrieving memories for personalized AI interactions
 */
class MemoryService {
  private static instance: MemoryService;
  private client: MemoryClient | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  /**
   * Initialize the memory service with Mem0 client
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const apiKey = process.env.MEM0_API_KEY;
      if (!apiKey) {
        console.warn('MEM0_API_KEY not found. Memory features will be disabled.');
        return;
      }

      console.log('🔧 Initializing Mem0 with API key:', apiKey.substring(0, 8) + '...');

      // Initialize Mem0 client with API key (correct constructor for v2.1.32)
      this.client = new MemoryClient({ apiKey });
      this.initialized = true;

      console.log('✅ Mem0 client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Mem0 client:', error);
      this.client = null;
      this.initialized = false;
    }
  }

  /**
   * Check if the memory service is properly initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.client !== null;
  }

  /**
   * Store a memory with context using the correct Mem0 API
   */
  async addMemory(
    memory: string, 
    context: MemoryContext,
    metadata?: Record<string, any>
  ): Promise<string | null> {
    console.log('🔍 Debug: addMemory called with:', {
      memoryLength: memory.length,
      memoryPreview: memory.substring(0, 100) + '...',
      context,
      metadata
    });

    if (!this.isInitialized()) {
      console.warn('🔍 Debug: Memory service not initialized in addMemory');
      return null;
    }

    if (!this.client) {
      console.error('🔍 Debug: Mem0 client is null in addMemory');
      return null;
    }

    try {
      // Create messages array as expected by Mem0 API v2.1.32
      const messages = [
        { role: 'user' as const, content: memory }
      ];

      // Create options object for Mem0 API (correct format from docs)
      const options = {
        user_id: context.userId,
        ...(context.sessionId && { run_id: context.sessionId }),
        ...(metadata && { 
          metadata: {
            ...metadata,
            sessionId: context.sessionId,
            domain: context.domain,
            researchType: context.researchType,
            timestamp: new Date().toISOString()
          }
        })
      };

      console.log('🔍 Debug: Calling Mem0 client.add with:', {
        messagesCount: messages.length,
        options
      });

      // Call Mem0 API with correct format (based on official TypeScript docs)
      const result = await this.client.add(messages, options);
      
      console.log('🔍 Debug: Mem0 add result:', result);

      // Extract memory ID from result (handle array response)
      let memoryId: string | null = null;
      if (Array.isArray(result) && result.length > 0) {
        memoryId = result[0].id || null;
      } else if (result && typeof result === 'object') {
        memoryId = (result as any).id || null;
      }
      
      if (memoryId) {
        console.log('✅ Memory stored successfully with ID:', memoryId);
      } else {
        console.log('✅ Memory stored successfully (no ID returned)');
        return 'success'; // Return success even if no ID
      }

      return memoryId;
    } catch (error) {
      console.error('🔍 Debug: Error in Mem0 addMemory:', error);
      return null;
    }
  }

  /**
   * Search for relevant memories
   */
  async searchMemories(
    query: string,
    context: MemoryContext,
    limit: number = 5
  ): Promise<string[]> {
    console.log('🔍 Debug: searchMemories called with:', {
      query,
      context,
      limit
    });

    if (!this.isInitialized()) {
      console.warn('🔍 Debug: Memory service not initialized in searchMemories');
      return [];
    }

    if (!this.client) {
      console.error('🔍 Debug: Mem0 client is null in searchMemories');
      return [];
    }

    try {
      // Create search options (correct format from docs)
      const searchOptions = {
        user_id: context.userId,
        limit,
        ...(context.sessionId && { run_id: context.sessionId })
      };

      console.log('🔍 Debug: Calling Mem0 client.search with:', {
        query,
        searchOptions
      });

      const result = await this.client.search(query, searchOptions);
      
      console.log('🔍 Debug: Mem0 search result:', {
        resultsCount: Array.isArray(result) ? result.length : (result as any)?.results?.length || 0,
        results: Array.isArray(result) ? result.slice(0, 2) : (result as any)?.results?.slice(0, 2) || []
      });

      // Extract memory content from results (handle both formats)
      let memories: string[] = [];
      if (Array.isArray(result)) {
        memories = result.map((item: any) => item.memory || item.text || item.content).filter(Boolean);
      } else if (result && (result as any).results) {
        memories = (result as any).results.map((item: any) => item.memory || item.text || item.content).filter(Boolean);
      }
      
      console.log('🔍 Debug: Extracted memories:', memories);

      return memories;
    } catch (error) {
      console.error('🔍 Debug: Error in Mem0 searchMemories:', error);
      return [];
    }
  }

  /**
   * Get all memories for a user
   */
  async getAllMemories(context: MemoryContext): Promise<any[]> {
    console.log('🔍 Debug: getAllMemories called with:', context);

    if (!this.isInitialized()) {
      console.warn('🔍 Debug: Memory service not initialized in getAllMemories');
      return [];
    }

    if (!this.client) {
      console.error('🔍 Debug: Mem0 client is null in getAllMemories');
      return [];
    }

    try {
      const getAllOptions = {
        user_id: context.userId,
        ...(context.sessionId && { run_id: context.sessionId })
      };

      console.log('🔍 Debug: Calling Mem0 client.getAll with:', getAllOptions);

      const result = await this.client.getAll(getAllOptions);

      console.log('🔍 Debug: Mem0 getAll result:', {
        resultsCount: Array.isArray(result) ? result.length : (result as any)?.results?.length || 0
      });

      // Handle both array and object response formats
      if (Array.isArray(result)) {
        return result;
      }
      return (result as any)?.results || [];
    } catch (error) {
      console.error('🔍 Debug: Error in Mem0 getAllMemories:', error);
      return [];
    }
  }

  /**
   * Store research findings and insights
   */
  async storeResearchFindings(
    findings: ResearchFindings,
    context: MemoryContext
  ): Promise<string[]> {
    console.log('🔍 Debug: storeResearchFindings called with:', {
      query: findings.query,
      summaryLength: findings.summary.length,
      keyFindingsCount: findings.keyFindings.length,
      insightsCount: findings.insights.length,
      competitorsCount: findings.competitors?.length || 0,
      context
    });

    if (!this.isInitialized()) {
      console.warn('🔍 Debug: Memory service not initialized in storeResearchFindings');
      return [];
    }

    const memoryIds: string[] = [];

    try {
      // Store main research summary
      const summaryMemory = `Research on "${findings.query}": ${findings.summary}`;
      const summaryId = await this.addMemory(
        summaryMemory,
        context,
        { 
          type: 'research_summary',
          query: findings.query,
          category: 'research'
        }
      );
      if (summaryId) memoryIds.push(summaryId);

      // Store key findings
      for (const finding of findings.keyFindings) {
        const findingId = await this.addMemory(
          `Key finding from research on "${findings.query}": ${finding}`,
          context,
          { 
            type: 'research_finding',
            query: findings.query,
            category: 'research'
          }
        );
        if (findingId) memoryIds.push(findingId);
      }

      // Store insights
      for (const insight of findings.insights) {
        const insightId = await this.addMemory(
          `Insight from research on "${findings.query}": ${insight}`,
          context,
          { 
            type: 'research_insight',
            query: findings.query,
            category: 'research'
          }
        );
        if (insightId) memoryIds.push(insightId);
      }

      // Store competitor information if available
      if (findings.competitors && findings.competitors.length > 0) {
        const competitorMemory = `Competitors identified in research on "${findings.query}": ${findings.competitors.join(', ')}`;
        const competitorId = await this.addMemory(
          competitorMemory,
          context,
          { 
            type: 'research_competitors',
            query: findings.query,
            category: 'research'
          }
        );
        if (competitorId) memoryIds.push(competitorId);
      }

      console.log('✅ Research findings stored successfully. Memory IDs:', memoryIds);
      return memoryIds;
    } catch (error) {
      console.error('🔍 Debug: Error in storeResearchFindings:', error);
      return memoryIds;
    }
  }

  /**
   * Store chat conversation context
   */
  async storeChatContext(
    messages: ChatMessage[],
    context: MemoryContext
  ): Promise<string | null> {
    console.log('🔍 Debug: storeChatContext called with:', {
      messagesCount: messages.length,
      context
    });

    if (!this.isInitialized()) {
      console.warn('🔍 Debug: Memory service not initialized in storeChatContext');
      return null;
    }

    try {
      // Format messages for Mem0 (correct Message interface)
      const mem0Messages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      const options = {
        user_id: context.userId,
        ...(context.sessionId && { run_id: context.sessionId }),
        metadata: {
          type: 'chat_conversation',
          domain: context.domain,
          timestamp: new Date().toISOString()
        }
      };

      console.log('🔍 Debug: Storing chat context with Mem0');

      const result = await this.client!.add(mem0Messages, options);
      
      // Extract memory ID (handle array response)
      let memoryId: string | null = null;
      if (Array.isArray(result) && result.length > 0) {
        memoryId = result[0].id || null;
      } else if (result && typeof result === 'object') {
        memoryId = (result as any).id || null;
      }
      
      if (memoryId) {
        console.log('✅ Chat context stored successfully with ID:', memoryId);
      } else {
        console.log('✅ Chat context stored successfully (no ID returned)');
        return 'success';
      }

      return memoryId;
    } catch (error) {
      console.error('🔍 Debug: Error in storeChatContext:', error);
      return null;
    }
  }

  /**
   * Get relevant context for a query
   */
  async getRelevantContext(
    query: string,
    context: MemoryContext,
    limit: number = 5
  ): Promise<string> {
    console.log('🔍 Debug: getRelevantContext called with:', {
      query,
      context,
      limit
    });

    if (!this.isInitialized()) {
      console.warn('🔍 Debug: Memory service not initialized in getRelevantContext');
      return '';
    }

    try {
      const memories = await this.searchMemories(query, context, limit);
      
      if (memories.length === 0) {
        console.log('🔍 Debug: No relevant memories found');
        return '';
      }

      const contextString = memories.join('\n\n');
      console.log('🔍 Debug: Built context string with', memories.length, 'memories');
      
      return contextString;
    } catch (error) {
      console.error('🔍 Debug: Error in getRelevantContext:', error);
      return '';
    }
  }
}

// Export singleton instance
export const memoryService = MemoryService.getInstance(); 