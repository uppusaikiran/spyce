import { NextRequest, NextResponse } from 'next/server';
import { memoryService } from '@/lib/memory/MemoryService';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug: Testing memory service...');
    
    // Initialize memory service
    await memoryService.initialize();
    console.log('🔍 Debug: Memory service initialized:', memoryService.isInitialized());
    
    const body = await request.json();
    const { action, userId = 'test-user', memory = 'Test memory content' } = body;
    
    if (action === 'test-add') {
      console.log('🔍 Debug: Attempting to add memory:', memory);
      
      const memoryId = await memoryService.addMemory(
        memory,
        {
          userId,
          sessionId: 'debug-session',
          industry: 'test',
          researchType: 'debug'
        },
        { debug: true }
      );
      
      console.log('🔍 Debug: Memory added with ID:', memoryId);
      
      return NextResponse.json({
        success: true,
        memoryId,
        initialized: memoryService.isInitialized(),
        message: 'Memory added successfully'
      });
    }
    
    if (action === 'test-search') {
      console.log('🔍 Debug: Searching memories for user:', userId);
      
      const memories = await memoryService.getUserMemories(userId, 10);
      console.log('🔍 Debug: Found memories:', memories.length);
      
      return NextResponse.json({
        success: true,
        memories,
        count: memories.length,
        initialized: memoryService.isInitialized()
      });
    }
    
    if (action === 'test-search-query') {
      const query = body.query || 'test';
      console.log('🔍 Debug: Searching with query:', query);
      
      const memories = await memoryService.searchMemories(
        query,
        { userId },
        10
      );
      
      console.log('🔍 Debug: Search results:', memories.length);
      
      return NextResponse.json({
        success: true,
        memories,
        count: memories.length,
        query,
        initialized: memoryService.isInitialized()
      });
    }
    
    return NextResponse.json({
      error: 'Invalid action. Use test-add, test-search, or test-search-query'
    }, { status: 400 });
    
  } catch (error) {
    console.error('🔍 Debug: Memory test error:', error);
    
    return NextResponse.json({
      error: 'Memory test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = process.env.MEM0_API_KEY;
    
    return NextResponse.json({
      memoryServiceInitialized: memoryService.isInitialized(),
      apiKeyPresent: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'Not set',
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('🔍 Debug: Memory status check error:', error);
    
    return NextResponse.json({
      error: 'Failed to check memory status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 