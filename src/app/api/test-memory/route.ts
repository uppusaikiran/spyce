import { NextRequest, NextResponse } from 'next/server';
import { memoryService } from '@/lib/memory/MemoryService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId = 'test-user-123', query = 'AI trends' } = body;

    // Initialize memory service
    await memoryService.initialize();
    
    if (!memoryService.isInitialized()) {
      return NextResponse.json({
        status: 'error',
        message: 'Memory service not initialized. Check MEM0_API_KEY in environment.'
      });
    }

    if (action === 'search') {
      console.log('🔍 Testing memory search for:', query);
      
      const memories = await memoryService.searchMemories(
        query,
        {
          userId,
          sessionId: 'test-session',
          domain: 'general'
        }
      );

      return NextResponse.json({
        status: 'success',
        action: 'search',
        query,
        userId,
        memoriesFound: memories.length,
        memories: memories.slice(0, 5) // Show first 5 results
      });
    }

    if (action === 'getAll') {
      console.log('🔍 Getting all memories for user:', userId);
      
      const allMemories = await memoryService.getAllMemories({
        userId,
        domain: 'general'
      });

      return NextResponse.json({
        status: 'success',
        action: 'getAll',
        userId,
        totalMemories: allMemories.length,
        memories: allMemories.slice(0, 10) // Show first 10 results
      });
    }

    if (action === 'add') {
      const testMemory = body.memory || `Test memory added at ${new Date().toISOString()}: AI research about ${query}`;
      
      console.log('🔍 Adding test memory:', testMemory.substring(0, 50) + '...');
      
      const memoryId = await memoryService.addMemory(
        testMemory,
        {
          userId,
          sessionId: 'test-session',
          domain: 'test'
        },
        {
          type: 'test',
          timestamp: new Date().toISOString()
        }
      );

      return NextResponse.json({
        status: 'success',
        action: 'add',
        memoryId,
        memory: testMemory
      });
    }

    return NextResponse.json({
      status: 'error',
      message: 'Invalid action. Use: search, getAll, or add'
    });

  } catch (error) {
    console.error('🔍 Test memory error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Check MEM0_API_KEY and network connection'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Memory Service Test Endpoint",
    usage: "POST with action parameter",
    actions: {
      search: {
        description: "Search memories by query",
        payload: { action: "search", query: "your search query", userId: "optional-user-id" }
      },
      getAll: {
        description: "Get all memories for a user",
        payload: { action: "getAll", userId: "optional-user-id" }
      },
      add: {
        description: "Add a test memory",
        payload: { action: "add", memory: "your memory content", userId: "optional-user-id" }
      }
    }
  });
} 