import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Test the research API with userId to trigger memory storage
    const testRequest = {
      query: "AI trends in 2024 for healthcare applications",
      userId: "test-user-123",
      sessionId: "test-session-456", 
      type: "deep_research",
      context: {
        industry: "healthcare",
        depth: "moderate"
      }
    };

    console.log('🧪 Test: Calling research API with memory integration:', testRequest);

    // Call our own research API
    const response = await fetch(`${request.nextUrl.origin}/api/agents/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });

    const result = await response.json();

    console.log('🧪 Test: Research API response:', {
      success: result.success,
      hasData: !!result.data,
      memoryEnhanced: result.metadata?.memoryEnhanced,
      memoryIds: (result as any).memoryIds,
      memoryError: (result as any).memoryError
    });

    return NextResponse.json({
      testStatus: 'completed',
      researchResult: result,
      memoryIntegration: {
        attempted: true,
        successful: !!(result as any).memoryIds,
        error: (result as any).memoryError || null
      },
      instructions: {
        next: "Check your Mem0 dashboard at https://app.mem0.ai/dashboard to see if memories were stored",
        note: "If no memories appear, check that MEM0_API_KEY is set correctly in your environment"
      }
    });

  } catch (error) {
    console.error('🧪 Test: Error in test endpoint:', error);
    
    return NextResponse.json({
      testStatus: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: "Check that your dev server is running and MEM0_API_KEY is configured"
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Research Memory Integration Test",
    usage: "POST to this endpoint to test memory storage",
    steps: [
      "1. Ensure MEM0_API_KEY is set in your .env file",
      "2. POST to this endpoint",
      "3. Check response for memory integration status",
      "4. Visit https://app.mem0.ai/dashboard to verify memories were stored"
    ]
  });
} 