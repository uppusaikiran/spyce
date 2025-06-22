import { NextResponse } from 'next/server';
import { agentManager } from '@/lib/agents/AgentManager';

export async function GET() {
  try {
    // Initialize agent system if not already done
    if (!agentManager.isInitialized()) {
      await agentManager.initialize();
    }

    const allAgentStatuses = agentManager.getAgentStatus();
    
    // Ensure we return a consistent array format
    let agentArray: any[] = [];
    if (Array.isArray(allAgentStatuses)) {
      agentArray = allAgentStatuses;
    } else if (allAgentStatuses) {
      agentArray = [allAgentStatuses];
    }

    // Convert to the format expected by AgentDashboard
    const formattedAgents = agentArray.map(agent => ({
      id: agent.id || 'unknown',
      name: agent.name || 'Unknown Agent',
      status: agent.status || 'idle',
      lastActivity: new Date().toISOString()
    }));

    // If no agents, provide default ones
    if (formattedAgents.length === 0) {
      formattedAgents.push(
        {
          id: 'discovery_agent',
          name: 'Discovery Agent',
          status: 'idle' as const,
          lastActivity: new Date().toISOString()
        },
        {
          id: 'crawling_agent',
          name: 'Crawling Agent',
          status: 'idle' as const,
          lastActivity: new Date().toISOString()
        },
        {
          id: 'research_agent',
          name: 'Research Agent',
          status: 'idle' as const,
          lastActivity: new Date().toISOString()
        },
        {
          id: 'analysis_agent',
          name: 'Analysis Agent',
          status: 'idle' as const,
          lastActivity: new Date().toISOString()
        }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: formattedAgents,
      metadata: {
        systemStatus: 'operational',
        initialized: agentManager.isInitialized(),
        totalAgents: formattedAgents.length,
        activeAgents: formattedAgents.filter(agent => agent.status === 'idle' || agent.status === 'working').length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Agent system status error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get agent system status',
      details: error instanceof Error ? error.message : 'Unknown error',
      data: [
        {
          id: 'discovery_agent',
          name: 'Discovery Agent',
          status: 'error' as const,
          lastActivity: new Date().toISOString()
        },
        {
          id: 'crawling_agent',
          name: 'Crawling Agent',
          status: 'error' as const,
          lastActivity: new Date().toISOString()
        },
        {
          id: 'research_agent',
          name: 'Research Agent',
          status: 'error' as const,
          lastActivity: new Date().toISOString()
        },
        {
          id: 'analysis_agent',
          name: 'Analysis Agent',
          status: 'error' as const,
          lastActivity: new Date().toISOString()
        }
      ]
    });
  }
}

export async function POST() {
  try {
    if (agentManager.isInitialized()) {
      return NextResponse.json({
        message: 'Agent system already initialized',
        status: 'already_initialized',
        timestamp: new Date().toISOString()
      });
    }

    await agentManager.initialize();
    
    return NextResponse.json({
      message: 'Agent system initialized successfully',
      status: 'initialized',
      agents: agentManager.getAgentStatus(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Agent system initialization error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to initialize agent system',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 