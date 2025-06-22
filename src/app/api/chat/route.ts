import { NextRequest, NextResponse } from 'next/server';
import { memoryService } from '@/lib/memory/MemoryService';
import { agentManager } from '@/lib/agents/AgentManager';

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      userId,
      sessionId,
      context = {}
    } = await request.json();

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required for personalized chat' },
        { status: 400 }
      );
    }

    // Initialize services if not already done
    if (!agentManager.isInitialized()) {
      await agentManager.initialize();
    }

    // Get chat context from memory
    let chatContext = '';
    let relevantContext: string[] = [];
    
    if (memoryService.isInitialized()) {
      // Get previous conversation context
      chatContext = await memoryService.getChatContext(userId, sessionId, 5);
      
      // Get relevant memories based on the current message
      relevantContext = await memoryService.getRelevantMemories(
        message.trim(),
        {
          userId,
          sessionId,
          industry: context.industry,
          researchType: context.researchType
        },
        3
      );
    }

    // Construct enhanced prompt with memory context
    let enhancedPrompt = message.trim();
    
    if (chatContext && chatContext !== "No previous conversation context found.") {
      enhancedPrompt = `${chatContext}\n\nCurrent message: ${message.trim()}`;
    }
    
    if (relevantContext.length > 0) {
      enhancedPrompt += `\n\nRelevant previous research:\n${relevantContext.join('\n\n')}`;
    }

    // For now, create a simple response (you can integrate with your preferred LLM)
    // This could be OpenAI, Anthropic, or any other LLM service
    const response = await generateChatResponse(enhancedPrompt, context);

    // Store the conversation in memory
    if (memoryService.isInitialized()) {
      await memoryService.storeChatInteraction(
        message.trim(),
        response,
        {
          userId,
          sessionId,
          industry: context.industry,
          researchType: context.researchType
        }
      );
    }

    return NextResponse.json({
      success: true,
      response,
      metadata: {
        timestamp: new Date().toISOString(),
        memoryEnhanced: memoryService.isInitialized(),
        contextUsed: !!chatContext || relevantContext.length > 0,
        sessionId
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Simple response generator (replace with your preferred LLM integration)
async function generateChatResponse(prompt: string, context: any): Promise<string> {
  // This is a placeholder - integrate with your preferred LLM
  // For example: OpenAI, Anthropic, local models, etc.
  
  // Simple rule-based responses for demonstration
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('competitor') || lowerPrompt.includes('competition')) {
    return "I can help you analyze competitors. I have access to your previous research and can provide contextual insights based on your past queries. What specific competitive analysis would you like me to perform?";
  }
  
  if (lowerPrompt.includes('research') || lowerPrompt.includes('analyze')) {
    return "I can conduct deep research using multiple sources and AI analysis. Based on your conversation history, I'll provide relevant context and insights. What topic would you like me to research?";
  }
  
  if (lowerPrompt.includes('memory') || lowerPrompt.includes('remember')) {
    return "I have access to your research history and previous conversations. I can recall past insights, findings, and provide continuity across sessions. What would you like me to remember or recall?";
  }
  
  // Default response with memory context awareness
  return `I understand your message and have access to your previous research context. I'm here to help with competitive intelligence, market research, and analysis. Based on your history, I can provide personalized insights. How can I assist you today?`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    const userId = searchParams.get('userId');

    if (operation === 'memory-status') {
      return NextResponse.json({
        memoryInitialized: memoryService.isInitialized(),
        agentSystemReady: agentManager.isInitialized(),
        capabilities: [
          'Conversational Memory',
          'Research Context Retention',
          'Personalized Responses',
          'Session Continuity',
          'Cross-Session Learning'
        ]
      });
    }

    if (operation === 'user-memories' && userId) {
      if (!memoryService.isInitialized()) {
        return NextResponse.json({
          error: 'Memory service not initialized'
        }, { status: 503 });
      }

      const memories = await memoryService.getUserMemories(userId, 20);
      return NextResponse.json({
        userId,
        totalMemories: memories.length,
        memories: memories.map(m => ({
          id: m.id,
          preview: m.memory.substring(0, 100) + (m.memory.length > 100 ? '...' : ''),
          created_at: m.created_at,
          type: m.metadata?.type || 'general'
        }))
      });
    }

    return NextResponse.json({
      error: 'Invalid operation or missing parameters'
    }, { status: 400 });

  } catch (error) {
    console.error('Chat GET API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 