import { NextRequest, NextResponse } from 'next/server';
import { agentManager } from '@/lib/agents/AgentManager';

export async function POST(request: NextRequest) {
  try {
    const { domains, priority = 'medium', antiDetection = false, sections } = await request.json();

    // Validate input
    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return NextResponse.json(
        { error: 'Domains array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Initialize agent system if not already done
    if (!agentManager.isInitialized()) {
      await agentManager.initialize();
    }

    // Trigger domain crawling
    const result = await agentManager.crawlDomains(domains, {
      priority,
      antiDetection,
      sections
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        ...result.metadata,
        timestamp: new Date().toISOString(),
        agentUsed: 'crawling_agent'
      }
    });

  } catch (error) {
    console.error('Crawling API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to crawl domains',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Initialize agent system if not already done
    if (!agentManager.isInitialized()) {
      await agentManager.initialize();
    }

    const agentStatus = agentManager.getAgentStatus('crawling_agent');
    
    return NextResponse.json({
      agent: 'crawling_agent',
      status: agentStatus,
      capabilities: [
        'Anti-Detection Crawling',
        'Distributed Processing',
        'Rate Limiting',
        'Content Extraction',
        'Change Detection',
        'Proxy Management'
      ],
      apiEndpoints: {
        crawl: 'POST /api/agents/crawl',
        monitor: 'POST /api/agents/crawl/monitor',
        status: 'GET /api/agents/crawl'
      }
    });

  } catch (error) {
    console.error('Crawling status error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get agent status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 