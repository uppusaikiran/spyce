import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const diagnostics = {
      environment: {
        isNetlify: process.env.NETLIFY === 'true',
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        netlifyContext: process.env.CONTEXT,
        deployId: process.env.DEPLOY_ID,
      },
      apiKeys: {
        tavilyConfigured: !!process.env.TAVILY_API_KEY,
        tavilyKeyLength: process.env.TAVILY_API_KEY?.length || 0,
        serperConfigured: !!process.env.SERPER_API_KEY,
        serperKeyLength: process.env.SERPER_API_KEY?.length || 0,
      },
      networkTest: {
        timestamp: new Date().toISOString(),
        userAgent: 'AgentHub Discovery Diagnostic'
      },
      limits: {
        functionTimeout: process.env.NETLIFY === 'true' ? '10 seconds (free) / 26 seconds (pro)' : 'No limit',
        memoryLimit: process.env.NETLIFY === 'true' ? '1024 MB' : 'System dependent',
        coldStart: process.env.NETLIFY === 'true' ? 'Yes' : 'No'
      }
    };

    // Test external API connectivity
    let tavilyConnectivity = 'not tested';
    if (process.env.TAVILY_API_KEY) {
      try {
        const testResponse = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: 'test connectivity',
            max_results: 1
          }),
        });
        
        tavilyConnectivity = testResponse.ok ? 'connected' : `error: ${testResponse.status}`;
      } catch (error) {
        tavilyConnectivity = `failed: ${error instanceof Error ? error.message : 'unknown error'}`;
      }
    } else {
      tavilyConnectivity = 'api key not configured';
    }

    return NextResponse.json({
      status: 'ok',
      diagnostics,
      connectivity: {
        tavily: tavilyConnectivity
      },
      recommendations: {
        netlify: process.env.NETLIFY === 'true' ? [
          'Check that TAVILY_API_KEY is set in Netlify environment variables',
          'Verify function timeout settings in netlify.toml',
          'Monitor function logs for timeout or memory issues',
          'Consider upgrading to Pro plan for longer function timeouts'
        ] : [
          'Environment appears to be local development',
          'Netlify-specific optimizations will not apply'
        ]
      }
    });

  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown diagnostic error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 