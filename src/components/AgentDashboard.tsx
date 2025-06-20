'use client';

import { useState, useEffect } from 'react';
import { CompetitorDomain, Job, databaseService } from '@/lib/database';
import { useToast, ToastContainer } from './Toast';

interface AgentStatus {
  id: string;
  name: string;
  status: 'idle' | 'working' | 'error';
  lastActivity?: string;
}

interface AgentDashboardProps {
  userId: string; // Only need userId now - we'll load domains from database
}

export default function AgentDashboard({ userId }: AgentDashboardProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [domains, setDomains] = useState<CompetitorDomain[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus[]>([]);
  const [discoveryInput, setDiscoveryInput] = useState('');
  const [crawlDomain, setCrawlDomain] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [addingDomain, setAddingDomain] = useState<string | null>(null);
  
  // Toast notifications
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast();

  // Load jobs and domains from database on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [userJobs, userDomains] = await Promise.all([
          databaseService.getUserJobs(userId),
          databaseService.getUserDomains(userId)
        ]);
        setJobs(userJobs);
        setDomains(userDomains);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    if (userId) {
      loadData();
    }
  }, [userId]);

  // Poll for agent status and job updates
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch('/api/agents/status');
        const data = await response.json();
        
        if (data.success && data.data) {
          setAgentStatus(data.data);
        }

        // Check for running jobs and update them
        const runningJobs = jobs.filter(job => job.status === 'running');
        if (runningJobs.length > 0) {
          // Reload jobs from database to get latest status
          const userJobs = await databaseService.getUserJobs(userId);
          setJobs(userJobs);
        }
      } catch (error) {
        console.error('Error polling agent status:', error);
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(pollStatus, 3000);
    pollStatus(); // Initial call

    return () => clearInterval(interval);
  }, [jobs, userId]);

  // Update polling state based on running jobs
  useEffect(() => {
    const hasRunningJobs = jobs.some(job => job.status === 'running');
    setIsPolling(hasRunningJobs);
  }, [jobs]);

  const startDiscovery = async () => {
    if (!discoveryInput.trim() || loading) return;

    setLoading(true);
    try {
      // Create job in database first
      const newJob = await databaseService.createJob({
        userId,
        type: 'discovery',
        status: 'pending',
        industry: discoveryInput,
        parameters: { industry: discoveryInput }
      });

      setJobs(prev => [newJob, ...prev]);
      setDiscoveryInput('');

      // Update job to running status
      const runningJob = await databaseService.updateJob(newJob.$id, { 
        status: 'running',
        progress: 10
      });
      setJobs(prev => prev.map(job => job.$id === newJob.$id ? runningJob : job));

      // Make API call
      const response = await fetch('/api/agents/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: discoveryInput }),
      });

      const data = await response.json();
      
      // Update job with result
      const completedJob = await databaseService.updateJob(newJob.$id, {
        status: data.success ? 'completed' : 'failed',
        result: data.success ? data.data : null,
        error: data.success ? undefined : (data.error || 'Discovery failed'),
        progress: 100
      });

      setJobs(prev => prev.map(job => job.$id === newJob.$id ? completedJob : job));
    } catch (error) {
      console.error('Discovery error:', error);
      // Handle error case - update the job in database if it exists
    } finally {
      setLoading(false);
    }
  };

  const startCrawling = async () => {
    if (!crawlDomain.trim() || loading) return;

    setLoading(true);
    try {
      // Create job in database first
      const newJob = await databaseService.createJob({
        userId,
        type: 'crawl',
        status: 'pending',
        domain: crawlDomain,
        parameters: { domains: [crawlDomain] }
      });

      setJobs(prev => [newJob, ...prev]);
      setCrawlDomain('');

      // Update job to running status
      const runningJob = await databaseService.updateJob(newJob.$id, { 
        status: 'running',
        progress: 10
      });
      setJobs(prev => prev.map(job => job.$id === newJob.$id ? runningJob : job));

      // Make API call
      const response = await fetch('/api/agents/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: [crawlDomain] }),
      });

      const data = await response.json();
      
      // Update job with result
      const completedJob = await databaseService.updateJob(newJob.$id, {
        status: data.success ? 'completed' : 'failed',
        result: data.success ? data.data : null,
        error: data.success ? undefined : (data.error || 'Crawling failed'),
        progress: 100
      });

      setJobs(prev => prev.map(job => job.$id === newJob.$id ? completedJob : job));
    } catch (error) {
      console.error('Crawling error:', error);
      // Handle error case
    } finally {
      setLoading(false);
    }
  };

  const addCompetitorToMonitoring = async (competitor: any) => {
    setAddingDomain(competitor.domain);
    try {
      // Check if domain already exists (normalize for comparison)
      const normalizeUrl = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
      const existingDomain = domains.find(d => 
        normalizeUrl(d.domain) === normalizeUrl(competitor.domain)
      );
      if (existingDomain) {
        showWarning('This domain is already being monitored!');
        return;
      }

      // Ensure domain is in URL format for Appwrite
      let cleanDomain = competitor.domain.toLowerCase().replace(/\/$/, '');
      if (!cleanDomain.startsWith('http://') && !cleanDomain.startsWith('https://')) {
        cleanDomain = `https://${cleanDomain}`;
      }

      // Create new domain in database
      const newDomain = await databaseService.createDomain({
        userId,
        domain: cleanDomain,
        name: competitor.name,
        description: competitor.description,
        crawlFrequency: 'weekly',
        isActive: true
      });

      // Update local state
      setDomains(prev => [newDomain, ...prev]);
      
      // Show success message
      showSuccess(`Successfully added "${competitor.name}" to monitoring!`);
    } catch (error) {
      console.error('Error adding competitor to monitoring:', error);
      showError('Failed to add competitor to monitoring. Please try again.');
    } finally {
      setAddingDomain(null);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle': return '💤';
      case 'working': return '⚡';
      case 'error': return '❌';
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const formatJobResult = (job: Job, isExpanded: boolean = false) => {
    if (!job.result) return null;

    if (job.type === 'discovery') {
      const competitors = job.result.competitors || [];
      const displayCount = isExpanded ? competitors.length : Math.min(5, competitors.length);
      
      return (
        <div className="bg-blue-50 p-4 rounded-lg mt-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-blue-900">🔍 Discovery Results</h4>
            {competitors.length > 5 && (
              <button
                onClick={() => toggleJobExpansion(job.$id)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {isExpanded ? `Show Less` : `Show All (${competitors.length})`}
              </button>
            )}
          </div>
          
          <p className="text-sm text-blue-800 mb-3">
            Found <strong>{competitors.length}</strong> potential competitors
          </p>
          
          {competitors.length > 0 && (
            <div className="space-y-2">
              {competitors.slice(0, displayCount).map((comp: any, idx: number) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-blue-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{comp.name}</div>
                      <div className="text-sm text-gray-600 truncate">{comp.domain}</div>
                      {comp.description && (
                        <div className="text-sm text-gray-500 mt-1 break-words">
                          {comp.description}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Score: {comp.relevanceScore}/10
                        </span>
                        {comp.industry && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            {comp.industry}
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => addCompetitorToMonitoring(comp)}
                      disabled={addingDomain === comp.domain || domains.some(d => {
                        const normalizeUrl = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
                        return normalizeUrl(d.domain) === normalizeUrl(comp.domain);
                      })}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex-shrink-0 self-start disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      {addingDomain === comp.domain ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                          <span>Adding...</span>
                        </>
                      ) : domains.some(d => {
                        const normalizeUrl = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
                        return normalizeUrl(d.domain) === normalizeUrl(comp.domain);
                      }) ? (
                        <span>Already monitoring</span>
                      ) : (
                        <span>Add to monitoring</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (job.type === 'crawl') {
      const results = job.result.results || [];
      const successful = results.filter((r: any) => r.success);
      const failed = results.filter((r: any) => !r.success);
      const displayCount = isExpanded ? successful.length : Math.min(3, successful.length);

      return (
        <div className="bg-green-50 p-4 rounded-lg mt-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-green-900">🕷️ Crawl Results</h4>
            {successful.length > 3 && (
              <button
                onClick={() => toggleJobExpansion(job.$id)}
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                {isExpanded ? `Show Less` : `Show All (${successful.length})`}
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-3 rounded-lg border border-green-100">
              <div className="text-lg font-semibold text-green-600">{successful.length}</div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-red-100">
              <div className="text-lg font-semibold text-red-600">{failed.length}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>
          
          {successful.length > 0 && (
            <div className="space-y-2">
              {successful.slice(0, displayCount).map((result: any, idx: number) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-green-100">
                  <div className="font-medium text-gray-900 mb-2 break-words">{result.domain}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-600 mb-2">
                    <span>📄 {result.data?.metadata?.wordCount || 0} words</span>
                    <span>⏱️ {result.crawlMetrics?.responseTime || 0}ms</span>
                    <span>📊 {result.crawlMetrics?.statusCode || 'N/A'}</span>
                    <span>📦 {result.crawlMetrics?.contentSize || 0}B</span>
                  </div>
                  {result.data?.title && (
                    <div className="text-sm text-gray-700 break-words mb-2">
                      <strong>Title:</strong> {result.data.title}
                    </div>
                  )}
                  {result.data?.content && (
                    <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <strong className="text-gray-700">Content Preview:</strong>
                        <span className="text-xs text-gray-500">
                          {result.data.content.length} characters
                        </span>
                      </div>
                      <div className={`whitespace-pre-wrap break-words text-gray-600 ${
                        isExpanded ? 'max-h-96' : 'max-h-32'
                      } overflow-y-auto border rounded p-2 bg-white`}>
                        {isExpanded 
                          ? result.data.content 
                          : `${result.data.content.substring(0, 300)}${result.data.content.length > 300 ? '...' : ''}`
                        }
                      </div>
                      {result.data.content.length > 300 && (
                        <button
                          onClick={() => toggleJobExpansion(job.$id)}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          {isExpanded ? 'Show Less' : 'Show Full Content'}
                        </button>
                      )}
                    </div>
                  )}
                  {result.data?.metadata && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                      <div className="grid grid-cols-2 gap-2 text-gray-600 mb-2">
                        <span>🔗 {result.data.metadata.links?.length || 0} links</span>
                        <span>🖼️ {result.data.metadata.images?.length || 0} images</span>
                      </div>
                      {isExpanded && result.data.metadata.links && result.data.metadata.links.length > 0 && (
                        <div className="mt-2">
                          <strong className="text-gray-700">Links found:</strong>
                          <div className="mt-1 max-h-24 overflow-y-auto">
                            {result.data.metadata.links.slice(0, 10).map((link: string, linkIdx: number) => (
                              <div key={linkIdx} className="truncate text-blue-600 hover:text-blue-800">
                                <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs">
                                  {link}
                                </a>
                              </div>
                            ))}
                            {result.data.metadata.links.length > 10 && (
                              <div className="text-gray-500 text-xs mt-1">
                                ... and {result.data.metadata.links.length - 10} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {failed.length > 0 && (
            <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-800">
              <strong>Failed domains ({failed.length}):</strong>
              <div className="mt-1">
                {failed.map((f: any, idx: number) => (
                  <div key={idx} className="break-words">
                    • {f.domain}: {f.error || 'Unknown error'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="space-y-6">
      {/* Agent Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🤖 AI Agent Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {agentStatus.length > 0 ? (
            agentStatus.map((agent) => (
              <div key={agent.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl mr-3">{getStatusIcon(agent.status)}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 truncate">{agent.name}</div>
                  <div className="text-sm text-gray-600 capitalize">{agent.status}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-4 text-gray-500">
              <div className="animate-pulse">Loading agent status...</div>
            </div>
          )}
        </div>
      </div>

      {/* Monitoring Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Monitoring Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{domains.length}</div>
            <div className="text-sm text-blue-800">Total Domains</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {domains.filter(d => d.isActive !== false).length}
            </div>
            <div className="text-sm text-green-800">Active</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {domains.filter(d => d.lastCrawled).length}
            </div>
            <div className="text-sm text-purple-800">Crawled</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{jobs.length}</div>
            <div className="text-sm text-orange-800">Total Jobs</div>
          </div>
        </div>
      </div>

      {/* Job Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Discovery */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Competitor Discovery</h3>
          <div className="space-y-3">
            <textarea
              value={discoveryInput}
              onChange={(e) => setDiscoveryInput(e.target.value)}
              placeholder="Enter industry or keywords (e.g., 'SaaS email marketing tools for small businesses')"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 resize-none"
              rows={3}
            />
            <button
              onClick={startDiscovery}
              disabled={!discoveryInput.trim() || loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Starting Discovery...
                </>
              ) : (
                'Start Discovery'
              )}
            </button>
          </div>
        </div>

        {/* Crawling */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🕷️ Web Crawling</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={crawlDomain}
              onChange={(e) => setCrawlDomain(e.target.value)}
              placeholder="Enter domain to crawl (e.g., competitor.com)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500"
            />
            <button
              onClick={startCrawling}
              disabled={!crawlDomain.trim() || loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Starting Crawl...
                </>
              ) : (
                'Start Crawling'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Job Queue */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">📋 Job Queue</h3>
          <div className="flex items-center space-x-4">
            {isPolling && (
              <div className="flex items-center text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Live updates active
              </div>
            )}
            <div className="text-sm text-gray-500">
              Total: {jobs.length} jobs
            </div>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🏃‍♂️</div>
            <p>No jobs yet. Start a discovery or crawling job above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const isExpanded = expandedJobs.has(job.$id);
              
              return (
                <div key={job.$id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <span className="text-xl flex-shrink-0">{getStatusIcon(job.status)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium capitalize">{job.type}</span>
                          <span className="text-sm text-gray-500 truncate">
                            {job.domain || job.industry}
                          </span>
                        </div>
                        {job.progress !== undefined && job.status === 'running' && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                              style={{ width: `${job.progress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex-shrink-0">
                      {new Date(job.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {job.error && (
                    <div className="bg-red-50 text-red-800 p-3 rounded text-sm mb-3 break-words">
                      ❌ {job.error}
                    </div>
                  )}

                  {job.status === 'completed' && job.result && formatJobResult(job, isExpanded)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </>
  );
} 