import { CopilotRuntime, OpenAIAdapter, copilotRuntimeNextJSAppRouterEndpoint } from "@copilotkit/runtime";
import OpenAI from "openai";
import { NextRequest } from "next/server";

// Initialize OpenAI (fallback) or use CopilotKit Cloud
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create CopilotRuntime with research-focused actions
const runtime = new CopilotRuntime({
  actions: [
    {
      name: "analyzeCompetitor",
      description: "Analyze competitor information and generate insights",
      parameters: [
        {
          name: "competitorName",
          type: "string",
          description: "Name of the competitor to analyze",
          required: true,
        },
        {
          name: "analysisType",
          type: "string",
          description: "Type of analysis: 'pricing', 'features', 'marketing', 'positioning'",
          required: true,
        },
      ],
      handler: async ({ competitorName, analysisType }: { competitorName: string; analysisType: string }) => {
        // This would integrate with your existing research logic
        return {
          competitor: competitorName,
          analysisType,
          insights: [
            `Analysis for ${competitorName} focusing on ${analysisType}`,
            "This would connect to your existing research engine",
            "Generated competitive intelligence insights would appear here"
          ],
          timestamp: new Date().toISOString(),
        };
      },
    },
    {
      name: "generateResearchReport",
      description: "Generate a comprehensive research report based on analysis",
      parameters: [
        {
          name: "topic",
          type: "string",
          description: "Research topic or company to investigate",
          required: true,
        },
        {
          name: "reportType",
          type: "string",
          description: "Type of report: 'competitive-analysis', 'market-trends', 'swot-analysis'",
          required: true,
        },
      ],
      handler: async ({ topic, reportType }: { topic: string; reportType: string }) => {
        return {
          topic,
          reportType,
          sections: [
            "Executive Summary",
            "Market Overview", 
            "Competitive Landscape",
            "Key Insights",
            "Recommendations"
          ],
          generatedAt: new Date().toISOString(),
        };
      },
    },
    {
      name: "identifyTrends",
      description: "Identify market trends and competitive patterns",
      parameters: [
        {
          name: "industry",
          type: "string", 
          description: "Industry or market segment to analyze",
          required: true,
        },
        {
          name: "timeframe",
          type: "string",
          description: "Time period for trend analysis: 'last-month', 'last-quarter', 'last-year'",
          required: true,
        },
      ],
      handler: async ({ industry, timeframe }: { industry: string; timeframe: string }) => {
        return {
          industry,
          timeframe,
          trends: [
            "Emerging competitive strategies",
            "Market positioning shifts",
            "Technology adoption patterns",
            "Consumer behavior changes"
          ],
          confidence: "high",
          updatedAt: new Date().toISOString(),
        };
      },
    },
  ],
});

const serviceAdapter = new OpenAIAdapter({ openai });

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
}; 