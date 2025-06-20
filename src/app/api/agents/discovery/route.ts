import { NextRequest, NextResponse } from 'next/server';
import { agentManager } from '@/lib/agents/AgentManager';

export async function POST(request: NextRequest) {
  try {
    const { industry, keywords, region } = await request.json();

    // Validate input
    if (!industry && !keywords) {
      return NextResponse.json(
        { error: 'Either industry or keywords must be provided' },
        { status: 400 }
      );
    }

    // Initialize agent system if not already done
    if (!agentManager.isInitialized()) {
      await agentManager.initialize();
    }

    // Trigger competitor discovery
    const result = await agentManager.discoverCompetitors(industry, keywords);

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        ...result.metadata,
        timestamp: new Date().toISOString(),
        agentUsed: 'discovery_agent'
      }
    });

  } catch (error) {
    console.error('Discovery API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to discover competitors',
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

    const agentStatus = agentManager.getAgentStatus('discovery_agent');
    
    return NextResponse.json({
      agent: 'discovery_agent',
      status: agentStatus,
      capabilities: [
        'Industry Analysis',
        'Competitor Discovery', 
        'Source Identification',
        'Market Research',
        'Relevance Scoring'
      ],
      apiEndpoints: {
        discover: 'POST /api/agents/discovery',
        status: 'GET /api/agents/discovery'
      }
    });

  } catch (error) {
    console.error('Discovery status error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get agent status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 