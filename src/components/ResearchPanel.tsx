 'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  FileCheck, 
  Sparkles,
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Play,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Download,
  Copy,
  Eye,
  BarChart3,
  Lightbulb,
  Filter,
  Globe,
  Calendar,
  Layers,
  BookOpen,
  Shield
} from 'lucide-react';
import { Job, databaseService } from '@/lib/database';
import { useToast } from './Toast';
import { cn } from '@/lib/utils';

interface ResearchTask {
  type: 'deep_research' | 'competitive_analysis' | 'market_intelligence' | 'trend_analysis' | 'source_verification' | 'contextual_research';
  query: string;
  context?: {
    industry?: string;
    competitors?: string[];
    timeframe?: 'recent' | 'quarterly' | 'yearly' | 'all-time';
    depth?: 'surface' | 'moderate' | 'comprehensive' | 'exhaustive';
    sources?: 'academic' | 'news' | 'industry' | 'social' | 'all';
  };
  focusAreas?: string[];
  excludeTerms?: string[];
  customInstructions?: string;
}

interface ResearchResult {
  query: string;
  summary: string;
  keyFindings: string[];
  sources: Array<{
    url: string;
    title: string;
    content: string;
    credibilityScore: number;
    sourceType: string;
    relevanceScore: number;
    keyTopics: string[];
  }>;
  insights: Array<{
    category: string;
    insight: string;
    confidence: number;
    supportingSources: string[];
    actionableRecommendations: string[];
  }>;
  trends?: Array<{
    trend: string;
    direction: 'rising' | 'declining' | 'stable' | 'volatile';
    strength: number;
    timeframe: string;
    drivingFactors: string[];
  }>;
  recommendations: string[];
  confidenceScore: number;
  researchDepth: string;
  metadata: {
    sourcesAnalyzed: number;
    timeSpent: number;
    methodsUsed: string[];
    limitations: string[];
    lastUpdated: string;
  };
}

interface ResearchPanelProps {
  userId: string;
}

export default function ResearchPanel({ userId }: ResearchPanelProps) {
  const [researchJobs, setResearchJobs] = useState<Job[]>([]);
  const [activeTab, setActiveTab] = useState<ResearchTask['type']>('deep_research');
  const [query, setQuery] = useState('');
  const [industry, setIndustry] = useState('');
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState('');
  const [depth, setDepth] = useState<'surface' | 'moderate' | 'comprehensive' | 'exhaustive'>('comprehensive');
  const [timeframe, setTimeframe] = useState<'recent' | 'quarterly' | 'yearly' | 'all-time'>('recent');
  const [sources, setSources] = useState<'academic' | 'news' | 'industry' | 'social' | 'all'>('all');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [focusAreaInput, setFocusAreaInput] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { showSuccess, showError, showWarning } = useToast();

  // Load research jobs from database
  useEffect(() => {
    const loadResearchJobs = async () => {
      try {
        const userJobs = await databaseService.getUserJobs(userId);
        const researchJobsOnly = userJobs.filter(job => job.type === 'research');
        setResearchJobs(researchJobsOnly);
      } catch (error) {
        console.error('Error loading research jobs:', error);
      }
    };

    if (userId) {
      loadResearchJobs();
    }
  }, [userId]);

  // Poll for running research job updates
  useEffect(() => {
    const pollResearchJobs = async () => {
      try {
        const runningJobs = researchJobs.filter(job => job.status === 'running');
        if (runningJobs.length > 0) {
          const userJobs = await databaseService.getUserJobs(userId);
          const researchJobsOnly = userJobs.filter(job => job.type === 'research');
          setResearchJobs(researchJobsOnly);
        }
      } catch (error) {
        console.error('Error polling research jobs:', error);
      }
    };

    const interval = setInterval(pollResearchJobs, 2000);
    return () => clearInterval(interval);
  }, [researchJobs, userId]);

  const taskTypes = [
    {
      id: 'deep_research' as const,
      name: 'Deep Research',
      icon: Brain,
      description: 'Comprehensive multi-source research and analysis'
    },
    {
      id: 'competitive_analysis' as const,
      name: 'Competitive Analysis',
      icon: Target,
      description: 'Detailed competitor intelligence and positioning'
    },
    {
      id: 'market_intelligence' as const,
      name: 'Market Intelligence',
      icon: TrendingUp,
      description: 'Market trends, opportunities, and strategic insights'
    },
    {
      id: 'trend_analysis' as const,
      name: 'Trend Analysis',
      icon: BarChart3,
      description: 'Identification and analysis of emerging trends'
    },
    {
      id: 'source_verification' as const,
      name: 'Source Verification',
      icon: Shield,
      description: 'Verification of source credibility and fact-checking'
    },
    {
      id: 'contextual_research' as const,
      name: 'Contextual Research',
      icon: BookOpen,
      description: 'Research within specific context or domain expertise'
    }
  ];

  const addCompetitor = () => {
    if (competitorInput.trim() && !competitors.includes(competitorInput.trim())) {
      setCompetitors([...competitors, competitorInput.trim()]);
      setCompetitorInput('');
    }
  };

  const removeCompetitor = (competitor: string) => {
    setCompetitors(competitors.filter(c => c !== competitor));
  };

  const addFocusArea = () => {
    if (focusAreaInput.trim() && !focusAreas.includes(focusAreaInput.trim())) {
      setFocusAreas([...focusAreas, focusAreaInput.trim()]);
      setFocusAreaInput('');
    }
  };

  const removeFocusArea = (area: string) => {
    setFocusAreas(focusAreas.filter(a => a !== area));
  };

  const startResearch = async () => {
    if (!query.trim() || loading) return;

    setLoading(true);
    try {
      const researchTask: ResearchTask = {
        type: activeTab,
        query: query.trim(),
        context: {
          industry: industry || undefined,
          competitors: competitors.length > 0 ? competitors : undefined,
          timeframe,
          depth,
          sources
        },
        focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
        customInstructions: customInstructions || undefined
      };

      // Create job in database first
      const newJob = await databaseService.createJob({
        userId,
        type: 'research',
        status: 'pending',
        domain: `Research: ${query.slice(0, 50)}...`,
        parameters: researchTask
      });

      setResearchJobs(prev => [newJob, ...prev]);

      // Update job to running status
      const runningJob = await databaseService.updateJob(newJob.$id, { 
        status: 'running',
        progress: 10
      });
      setResearchJobs(prev => prev.map(job => job.$id === newJob.$id ? runningJob : job));

      showSuccess('Research task started successfully');

      // Make API call to research agent
      const response = await fetch('/api/agents/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(researchTask),
      });

      const data = await response.json();
      
      // Update job with result
      const completedJob = await databaseService.updateJob(newJob.$id, {
        status: data.success ? 'completed' : 'failed',
        result: data.success ? data.data : null,
        error: data.success ? undefined : (data.error || 'Research failed'),
        progress: 100
      });

      setResearchJobs(prev => prev.map(job => job.$id === newJob.$id ? completedJob : job));

      if (data.success) {
        showSuccess('Research completed successfully');
      } else {
        showError(data.error || 'Research failed');
      }

      // Reset form
      setQuery('');
      setCompetitors([]);
      setFocusAreas([]);
      setCustomInstructions('');

    } catch (error) {
      console.error('Research error:', error);
      showError('Failed to start research task');
    } finally {
      setLoading(false);
    }
  };

  const toggleJobExpansion = (jobId: string) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('Copied to clipboard');
    } catch (error) {
      showError('Failed to copy to clipboard');
    }
  };

  const downloadResult = (job: Job) => {
    if (!job.result) return;
    
    const result = job.result as ResearchResult;
    const content = `# Research Report: ${result.query}\n\n## Summary\n${result.summary}\n\n## Key Findings\n${result.keyFindings.map(f => `- ${f}`).join('\n')}\n\n## Recommendations\n${result.recommendations.map(r => `- ${r}`).join('\n')}\n\n## Sources\n${result.sources.map(s => `- [${s.title}](${s.url}) (Credibility: ${s.credibilityScore})`).join('\n')}`;
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-${result.query.replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatResearchResult = (job: Job, isExpanded: boolean = false) => {
    if (!job.result || !isExpanded) return null;

    const result = job.result as ResearchResult;

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mt-4 space-y-6"
      >
        {/* Executive Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
            <Brain className="w-4 h-4 mr-2" />
            Executive Summary
          </h4>
          <p className="text-blue-800 text-sm leading-relaxed">{result.summary}</p>
          <div className="mt-3 flex items-center space-x-4 text-xs text-blue-600">
            <span>Confidence: {Math.round((result.confidenceScore || 0) * 100)}%</span>
            <span>Sources: {result.metadata?.sourcesAnalyzed || result.sources?.length || 0}</span>
            <span>Depth: {result.researchDepth || 'Standard'}</span>
          </div>
        </div>

        {/* Key Findings */}
        {result.keyFindings && result.keyFindings.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-3 flex items-center">
              <Lightbulb className="w-4 h-4 mr-2" />
              Key Findings
            </h4>
            <ul className="space-y-2">
              {result.keyFindings.map((finding, index) => (
                <li key={index} className="text-green-800 text-sm flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  {finding}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Insights */}
        {result.insights && result.insights.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Insights
            </h4>
            <div className="space-y-3">
              {result.insights.slice(0, 3).map((insight, index) => (
                <div key={index} className="border-l-4 border-purple-400 pl-3">
                  <div className="font-medium text-purple-800 text-sm">{insight.category}</div>
                  <div className="text-purple-700 text-sm mt-1">{insight.insight}</div>
                  <div className="text-xs text-purple-600 mt-1">
                    Confidence: {Math.round(insight.confidence * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trends */}
        {result.trends && result.trends.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-900 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trend Analysis
            </h4>
            <div className="space-y-3">
              {result.trends.slice(0, 3).map((trend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-orange-800 text-sm">{trend.trend}</div>
                    <div className="text-xs text-orange-600">{trend.timeframe}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      "px-2 py-1 rounded-full text-xs",
                      trend.direction === 'rising' && "bg-green-100 text-green-700",
                      trend.direction === 'declining' && "bg-red-100 text-red-700",
                      trend.direction === 'stable' && "bg-blue-100 text-blue-700",
                      trend.direction === 'volatile' && "bg-yellow-100 text-yellow-700"
                    )}>
                      {trend.direction}
                    </div>
                    <div className="text-xs text-orange-600">
                      {Math.round(trend.strength * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {result.recommendations && result.recommendations.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-900 mb-3 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Recommendations
            </h4>
            <ul className="space-y-2">
              {result.recommendations.map((rec, index) => (
                <li key={index} className="text-indigo-800 text-sm flex items-start">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Top Sources */}
        {result.sources && result.sources.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              Top Sources
            </h4>
            <div className="space-y-2">
              {result.sources.slice(0, 5).map((source, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{source.title}</div>
                    <div className="text-gray-600 text-xs">{source.sourceType}</div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <div className="text-xs text-gray-500">
                      {Math.round(source.credibilityScore * 100)}%
                    </div>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => copyToClipboard(result.summary)}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>Copy Summary</span>
          </button>
          <button
            onClick={() => downloadResult(job)}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <Brain className="w-8 h-8 mr-3" />
              Advanced Research Intelligence
            </h2>
            <p className="text-purple-100 mt-1">
              Powered by Tavily & Perplexity AI for comprehensive research
            </p>
          </div>
          <div className="flex items-center space-x-2 text-purple-100">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm">AI-Enhanced</span>
          </div>
        </div>
      </div>

      {/* Task Type Selection */}
      <div className="p-6 border-b border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {taskTypes.map((taskType) => (
            <button
              key={taskType.id}
              onClick={() => setActiveTab(taskType.id)}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                activeTab === taskType.id
                  ? "border-purple-500 bg-purple-50 text-purple-900"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              )}
            >
              <taskType.icon className={cn(
                "w-6 h-6 mb-2",
                activeTab === taskType.id ? "text-purple-600" : "text-gray-500"
              )} />
              <div className="font-medium text-sm">{taskType.name}</div>
              <div className="text-xs text-gray-600 mt-1">{taskType.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Research Form */}
      <div className="p-6 space-y-6">
        {/* Query Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Research Query *
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to research? Be specific for better results..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        {/* Basic Context */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry Context
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Technology, Healthcare, Finance"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Research Depth
            </label>
            <select
              value={depth}
              onChange={(e) => setDepth(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="surface">Surface - Quick overview</option>
              <option value="moderate">Moderate - Balanced analysis</option>
              <option value="comprehensive">Comprehensive - Detailed insights</option>
              <option value="exhaustive">Exhaustive - Maximum depth</option>
            </select>
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Advanced Options</span>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Advanced Options */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 border-t border-gray-100 pt-4"
            >
              {/* Timeframe and Sources */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Timeframe
                  </label>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="recent">Recent (Last 6 months)</option>
                    <option value="quarterly">Quarterly (Last 3 months)</option>
                    <option value="yearly">Yearly (Last 12 months)</option>
                    <option value="all-time">All Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Layers className="w-4 h-4 inline mr-1" />
                    Source Types
                  </label>
                  <select
                    value={sources}
                    onChange={(e) => setSources(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Sources</option>
                    <option value="academic">Academic Papers</option>
                    <option value="news">News Articles</option>
                    <option value="industry">Industry Reports</option>
                    <option value="social">Social Media</option>
                  </select>
                </div>
              </div>

              {/* Competitors */}
              {(activeTab === 'competitive_analysis' || activeTab === 'market_intelligence') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Competitors
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={competitorInput}
                      onChange={(e) => setCompetitorInput(e.target.value)}
                      placeholder="Enter competitor domain or name"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && addCompetitor()}
                    />
                    <button
                      onClick={addCompetitor}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {competitors.map((competitor, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                      >
                        {competitor}
                        <button
                          onClick={() => removeCompetitor(competitor)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Focus Areas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Target className="w-4 h-4 inline mr-1" />
                  Focus Areas
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={focusAreaInput}
                    onChange={(e) => setFocusAreaInput(e.target.value)}
                    placeholder="e.g., pricing, features, market share"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && addFocusArea()}
                  />
                  <button
                    onClick={addFocusArea}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {focusAreas.map((area, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {area}
                      <button
                        onClick={() => removeFocusArea(area)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Custom Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Instructions
                </label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Any specific instructions or requirements for the research..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Research Button */}
        <button
          onClick={startResearch}
          disabled={!query.trim() || loading}
          className={cn(
            "w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-semibold transition-all duration-200",
            !query.trim() || loading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Starting Research...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Start {taskTypes.find(t => t.id === activeTab)?.name}</span>
            </>
          )}
        </button>
      </div>

      {/* Research Jobs History */}
      {researchJobs.length > 0 && (
        <div className="border-t border-gray-100">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Research History
            </h3>
            <div className="space-y-4">
              {researchJobs.slice(0, 10).map((job) => (
                <motion.div
                  key={job.$id}
                  layout
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleJobExpansion(job.$id)}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getStatusIcon(job.status)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {job.domain}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(job.$createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {job.status === 'running' && (
                        <div className="text-sm text-blue-600">
                          {job.progress || 0}%
                        </div>
                      )}
                      {expandedJobs.has(job.$id) ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedJobs.has(job.$id) && formatResearchResult(job, true)}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 