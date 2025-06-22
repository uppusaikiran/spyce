import { NextRequest, NextResponse } from 'next/server';
import { agentManager } from '@/lib/agents/AgentManager';
import { memoryService } from '@/lib/memory/MemoryService';

export async function POST(request: NextRequest) {
  try {
    const {
      type = 'deep_research',
      query,
      context,
      focusAreas,
      excludeTerms,
      languages,
      regions,
      customInstructions,
      userId,
      sessionId
    } = await request.json();

    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate task type
    const validTypes = [
      'deep_research',
      'competitive_analysis', 
      'market_intelligence',
      'trend_analysis',
      'source_verification',
      'contextual_research'
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid task type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Initialize agent system if not already done
    if (!agentManager.isInitialized()) {
      await agentManager.initialize();
    }

    // Construct research task
    const researchTask = {
      type,
      query: query.trim(),
      context: {
        industry: context?.industry,
        competitors: context?.competitors || [],
        timeframe: context?.timeframe || 'recent',
        depth: context?.depth || 'comprehensive',
        sources: context?.sources || 'all'
      },
      focusAreas: focusAreas || [],
      excludeTerms: excludeTerms || [],
      languages: languages || ['en'],
      regions: regions || [],
      customInstructions: customInstructions || ''
    };

    // Get relevant context from memory if userId is provided
    let memoryContext = '';
    if (userId && memoryService.isInitialized()) {
      const relevantMemories = await memoryService.getRelevantContext(
        query.trim(),
        {
          userId,
          sessionId,
          domain: context?.industry,
          researchType: type
        }
      );
      
      if (relevantMemories && relevantMemories.length > 0) {
        memoryContext = `\nRelevant previous research context:\n${relevantMemories}`;
        researchTask.customInstructions = (researchTask.customInstructions || '') + memoryContext;
      }
    }

    // Execute research via agent manager
    const result = await agentManager.getOrchestrator().executeTask('research_agent', researchTask);

    // Store research findings in memory if userId is provided
    console.log('🔍 Debug: Checking memory storage conditions...');
    console.log('🔍 Debug: userId:', userId);
    console.log('🔍 Debug: memoryService.isInitialized():', memoryService.isInitialized());
    console.log('🔍 Debug: result.data exists:', !!result.data);
    console.log('🔍 Debug: result.data structure:', result.data ? Object.keys(result.data) : 'no data');
    
    if (userId && memoryService.isInitialized() && result.data) {
      console.log('🔍 Debug: All conditions met, attempting to store research findings...');
      
      const memoryCtx = {
        userId,
        sessionId: sessionId || `research_${Date.now()}`,
        domain: context?.industry || 'general',
        researchType: type || 'general'
      };

      try {
        const memoryIds = await memoryService.storeResearchFindings(
          {
            query,
            summary: result.data.summary || '',
            keyFindings: result.data.keyFindings || [],
            insights: result.data.insights || [],
            competitors: result.data.competitors || []
          },
          memoryCtx
        );
        
        console.log('✅ Debug: Research findings stored in memory with IDs:', memoryIds);
        
        // Add memory information to the response
        (result as any).memoryIds = memoryIds;
        (result as any).memoryEnhanced = true;
      } catch (memoryError) {
        console.error('❌ Debug: Error storing research findings in memory:', memoryError);
        // Don't fail the request if memory storage fails
        (result as any).memoryError = 'Failed to store in memory';
      }
    } else {
      console.log('🔍 Debug: Memory storage skipped. Reasons:', {
        noUserId: !userId,
        memoryNotInitialized: !memoryService.isInitialized(),
        noResultData: !result.data
      });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        ...result.metadata,
        timestamp: new Date().toISOString(),
        agentUsed: 'research_agent',
        taskType: type,
        query: query.trim(),
        memoryEnhanced: !!memoryContext
      }
    });

  } catch (error) {
    console.error('Research API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to execute research task',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');

    // Initialize agent system if not already done
    if (!agentManager.isInitialized()) {
      await agentManager.initialize();
    }

    if (operation === 'capabilities') {
      return NextResponse.json({
        agent: 'research_agent',
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
        supportedTaskTypes: [
          {
            type: 'deep_research',
            description: 'Comprehensive research using multiple sources and AI analysis',
            parameters: ['query', 'context', 'focusAreas', 'depth']
          },
          {
            type: 'competitive_analysis',
            description: 'Detailed analysis of competitors and market positioning',
            parameters: ['query', 'competitors', 'industry', 'focusAreas']
          },
          {
            type: 'market_intelligence',
            description: 'Market trends, opportunities, and strategic insights',
            parameters: ['query', 'industry', 'timeframe', 'regions']
          },
          {
            type: 'trend_analysis',
            description: 'Identification and analysis of emerging trends',
            parameters: ['query', 'timeframe', 'industry', 'depth']
          },
          {
            type: 'source_verification',
            description: 'Verification of source credibility and fact-checking',
            parameters: ['query', 'sources', 'claims']
          },
          {
            type: 'contextual_research',
            description: 'Research within specific context or domain expertise',
            parameters: ['query', 'context', 'customInstructions']
          }
        ],
        apiEndpoints: {
          research: 'POST /api/agents/research',
          status: 'GET /api/agents/research',
          capabilities: 'GET /api/agents/research?operation=capabilities',
          examples: 'GET /api/agents/research?operation=examples'
        }
      });
    }

    if (operation === 'examples') {
      return NextResponse.json({
        examples: [
          {
            taskType: 'deep_research',
            example: {
              query: 'AI-powered customer service automation trends 2024',
              context: {
                industry: 'technology',
                depth: 'comprehensive',
                timeframe: 'recent'
              },
              focusAreas: ['market size', 'key players', 'technology trends', 'adoption rates']
            }
          },
          {
            taskType: 'competitive_analysis',
            example: {
              query: 'SaaS project management tools competitive landscape',
              context: {
                competitors: ['asana.com', 'trello.com', 'monday.com', 'notion.so'],
                industry: 'software',
                depth: 'comprehensive'
              },
              focusAreas: ['pricing', 'features', 'market share', 'user reviews']
            }
          },
          {
            taskType: 'market_intelligence',
            example: {
              query: 'Electric vehicle charging infrastructure market opportunities',
              context: {
                industry: 'automotive',
                regions: ['North America', 'Europe', 'Asia'],
                timeframe: 'yearly'
              },
              focusAreas: ['growth projections', 'regulatory environment', 'key players']
            }
          }
        ]
      });
    }

    // Default: return agent status
    const agentStatus = agentManager.getAgentStatus('research_agent');
    
    return NextResponse.json({
      agent: 'research_agent',
      status: agentStatus,
      description: 'Advanced research agent leveraging Tavily and Perplexity for comprehensive intelligence gathering',
      features: [
        'Multi-source research aggregation',
        'AI-powered analysis and synthesis',
        'Competitive intelligence gathering',
        'Trend identification and forecasting',
        'Source credibility assessment',
        'Real-time market intelligence',
        'Academic and industry research',
        'Contextual research with custom instructions'
      ],
      integrations: {
        tavily: {
          description: 'Advanced web search and content discovery',
          features: ['Deep web search', 'Content extraction', 'Source filtering']
        },
        perplexity: {
          description: 'AI-powered research and analysis',
          features: ['Intelligent synthesis', 'Citation tracking', 'Expert analysis']
        }
      },
      rateLimits: {
        tavily: '100 requests/hour',
        perplexity: '50 requests/hour'
      }
    });

  } catch (error) {
    console.error('Research status error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get research agent status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Additional endpoint for streaming research results (for long-running research tasks)
export async function PATCH(request: NextRequest) {
  try {
    const { taskId, action } = await request.json();

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Initialize agent system if not already done
    if (!agentManager.isInitialized()) {
      await agentManager.initialize();
    }

    switch (action) {
      case 'cancel':
        // Implementation would cancel running research task
        return NextResponse.json({
          success: true,
          message: `Research task ${taskId} has been cancelled`
        });
      
      case 'status':
        // Implementation would return task status
        return NextResponse.json({
          taskId,
          status: 'running', // This would be dynamic
          progress: 65, // This would be actual progress
          currentPhase: 'AI Analysis',
          estimatedCompletion: '2 minutes'
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: cancel, status' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Research task management error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to manage research task',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 