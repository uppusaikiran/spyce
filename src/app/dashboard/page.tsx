'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, User } from '@/lib/auth';
import { CompetitorDomain, databaseService } from '@/lib/database';
import AddDomainForm from '@/components/AddDomainForm';
import DomainList from '@/components/DomainList';
import AgentDashboard from '@/components/AgentDashboard';
import { CopilotSidebar } from '@copilotkit/react-ui';
import { CopilotTextarea } from '@copilotkit/react-textarea';
import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core';
import { 
  Brain, 
  Sparkles, 
  MessageSquare, 
  TrendingUp,
  Search,
  Target,
  BarChart3 
} from 'lucide-react';

type TabType = 'domains' | 'alerts' | 'agents';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [domains, setDomains] = useState<CompetitorDomain[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('domains');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const router = useRouter();

  // State to store the pending query for the chat
  const [pendingChatQuery, setPendingChatQuery] = useState<string>('');

  // Auto-open AI assistant when user starts interacting with AI features
  const handleAiInteraction = () => {
    if (!showAiAssistant) {
      // Small delay to make the interaction feel natural
      setTimeout(() => {
        setShowAiAssistant(true);
      }, 300);
    }
  };

  // Make domains and user data available to CopilotKit
  useCopilotReadable({
    description: "Current user information and monitored competitor domains",
    value: {
      user: user ? {
        id: user.$id,
        name: user.name,
        email: user.email
      } : null,
      domains: domains.map(d => ({
        id: d.$id,
        domain: d.domain,
        name: d.name,
        description: d.description,
        status: d.status,
        lastCrawled: d.lastCrawled
      })),
      totalDomains: domains.length,
      activeDomains: domains.filter(d => d.status === 'active').length
    },
  });

  // CopilotKit Actions for competitive intelligence
  useCopilotAction({
    name: "analyzeCompetitor",
    description: "Analyze a specific competitor domain for insights and recommendations",
    parameters: [
      {
        name: "domain",
        type: "string",
        description: "The competitor domain to analyze",
        required: true,
      },
      {
        name: "analysisType",
        type: "string",
        description: "Type of analysis: 'content', 'pricing', 'features', 'seo', or 'all'",
        required: true,
      },
    ],
    handler: async ({ domain, analysisType }) => {
      // Find the domain in the user's monitored list
      const competitorDomain = domains.find(d => 
        d.domain.toLowerCase().includes(domain.toLowerCase()) ||
        d.name.toLowerCase().includes(domain.toLowerCase())
      );

      if (!competitorDomain) {
        return `Domain "${domain}" not found in your monitored competitors. Available domains: ${domains.map(d => d.domain).join(', ')}`;
      }

      // Return analysis based on available data
      return `Analysis for ${competitorDomain.name} (${competitorDomain.domain}):
      
📊 **Current Status**: ${competitorDomain.status}
📅 **Last Crawled**: ${competitorDomain.lastCrawled || 'Never'}
📝 **Description**: ${competitorDomain.description || 'No description available'}

🔍 **Recommended Actions**:
- Set up automated crawling for this domain
- Enable content change alerts
- Monitor pricing updates
- Track new product announcements

💡 **AI Insights**: Based on the domain status, I recommend initiating a comprehensive crawl to gather current data for analysis.`;
    },
  });

  useCopilotAction({
    name: "suggestCompetitors",
    description: "Suggest new competitors to monitor based on industry or company description",
    parameters: [
      {
        name: "industry",
        type: "string",
        description: "Industry or business type to find competitors for",
        required: true,
      },
    ],
    handler: async ({ industry }) => {
      return `Here are competitor discovery suggestions for "${industry}":

🎯 **Discovery Strategy**:
1. Use the Discovery Agent to find industry leaders
2. Analyze indirect competitors and adjacent markets
3. Monitor emerging startups in the space

🔍 **Recommended Search Terms**:
- "${industry} leaders"
- "${industry} software platforms"
- "${industry} market share"
- "best ${industry} tools"

📈 **Next Steps**:
1. Go to the AI Agents tab
2. Use the Discovery Agent with industry: "${industry}"
3. Review discovered competitors
4. Add promising domains to monitoring

This will help you build a comprehensive competitive landscape!`;
    },
  });

  useCopilotAction({
    name: "generateResearchPlan",
    description: "Create a strategic research plan for competitive intelligence",
    parameters: [
      {
        name: "businessGoal",
        type: "string", 
        description: "Your primary business goal or challenge",
        required: true,
      },
      {
        name: "timeframe",
        type: "string",
        description: "Timeline for the research (e.g., '1 month', '1 quarter')",
        required: true,
      },
    ],
    handler: async ({ businessGoal, timeframe }) => {
      return `📋 **Strategic Research Plan** (${timeframe})

🎯 **Goal**: ${businessGoal}

**Phase 1: Discovery & Setup**
- Use Discovery Agent to identify key competitors
- Set up domain monitoring for top 5-10 competitors
- Configure alerts for critical changes

**Phase 2: Data Collection**
- Schedule weekly crawls for all monitored domains
- Enable automated content change notifications
- Set up pricing monitoring alerts

**Phase 3: Analysis & Insights**
- Use Advanced Research Intelligence for deep analysis
- Generate monthly competitive reports
- Track trends and pattern changes

**Phase 4: Action & Optimization**
- Implement insights into your strategy
- Adjust monitoring based on findings
- Expand competitor list as needed

🎯 **Success Metrics**: Track competitor activity, identify opportunities, and stay ahead of market changes.`;
    },
  });

  // Keyboard shortcut to toggle AI assistant (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setShowAiAssistant(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-send pending query to chat when sidebar opens
  useEffect(() => {
    if (showAiAssistant && pendingChatQuery) {
      const attemptToSendMessage = (attempts = 0) => {
        if (attempts > 15) {
          console.log('Max attempts reached, could not send message to chat');
          setPendingChatQuery('');
          return;
        }
        
        console.log(`Attempt ${attempts + 1} to send message to chat`);
        
        // Try multiple possible selectors for the chat input
        const possibleSelectors = [
          'textarea[placeholder*="Message"]',
          'textarea[placeholder*="message"]', 
          'textarea[placeholder*="Type"]',
          'textarea[placeholder*="type"]',
          'textarea[placeholder*="Ask"]',
          'textarea[placeholder*="ask"]',
          'textarea[placeholder*="Chat"]',
          'textarea[placeholder*="chat"]',
          'input[type="text"][placeholder*="Message"]',
          'input[type="text"][placeholder*="message"]',
          '[data-testid="chat-input"]',
          '[data-testid="copilot-chat-input"]',
          '.copilot-chat-input',
          'textarea:not([readonly]):not([disabled])',
          'input[type="text"]:not([readonly]):not([disabled])'
        ];
        
        let chatInput: HTMLElement | null = null;
        
        // Try each selector until we find a suitable input
        for (const selector of possibleSelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            // Get the last matching element (likely the chat input)
            for (let i = elements.length - 1; i >= 0; i--) {
              const element = elements[i] as HTMLElement;
              if (element && (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement)) {
                // Check if the element is visible and not in a hidden container
                const rect = element.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  chatInput = element;
                  console.log(`Found chat input with selector: ${selector}`);
                  break;
                }
              }
            }
            if (chatInput) break;
          } catch (e) {
            // Ignore selector errors and continue
          }
        }
        
        if (chatInput && (chatInput instanceof HTMLTextAreaElement || chatInput instanceof HTMLInputElement)) {
          try {
            // Set the value using React's way
            const descriptor = Object.getOwnPropertyDescriptor(chatInput, 'value') || 
                            Object.getOwnPropertyDescriptor(Object.getPrototypeOf(chatInput), 'value');
            if (descriptor && descriptor.set) {
              descriptor.set.call(chatInput, pendingChatQuery);
            }
            chatInput.value = pendingChatQuery;
            
            // Focus and trigger events
            chatInput.focus();
            
            // Trigger multiple events to ensure React recognizes the change
            ['input', 'change', 'keyup', 'keydown'].forEach(eventType => {
              const event = new Event(eventType, { bubbles: true });
              chatInput!.dispatchEvent(event);
            });
            
            console.log('Successfully set chat input value:', pendingChatQuery);
            
            // Try to find and click the send button
            setTimeout(() => {
              const sendSelectors = [
                'button[type="submit"]',
                'button[aria-label*="Send"]',
                'button[aria-label*="send"]',
                'button[title*="Send"]',
                'button[title*="send"]',
                'button:has(svg)',
                'button svg',
                '[data-testid="send-button"]',
                '.send-button',
                'button:not([disabled])'
              ];
              
              let sendButton: HTMLElement | null = null;
              for (const selector of sendSelectors) {
                try {
                  const elements = document.querySelectorAll(selector);
                                     for (const element of Array.from(elements)) {
                    const btn = element.closest('button') || (element.tagName === 'BUTTON' ? element : null);
                    if (btn && !btn.hasAttribute('disabled') && btn.getAttribute('disabled') !== 'true') {
                      // Check if button is visible
                      const rect = btn.getBoundingClientRect();
                      if (rect.width > 0 && rect.height > 0) {
                        sendButton = btn as HTMLElement;
                        break;
                      }
                    }
                  }
                  if (sendButton) {
                    console.log(`Found send button with selector: ${selector}`);
                    break;
                  }
                } catch (e) {
                  // Ignore selector errors and continue
                }
              }
              
              if (sendButton) {
                sendButton.click();
                console.log('Successfully clicked send button');
                setPendingChatQuery('');
              } else {
                // Fallback: simulate Enter key press
                console.log('No send button found, trying Enter key');
                const enterEvent = new KeyboardEvent('keydown', { 
                  key: 'Enter', 
                  code: 'Enter', 
                  keyCode: 13,
                  which: 13,
                  bubbles: true,
                  cancelable: true
                });
                chatInput.dispatchEvent(enterEvent);
                
                // Also try keypress and keyup
                const keypressEvent = new KeyboardEvent('keypress', { 
                  key: 'Enter', 
                  code: 'Enter', 
                  keyCode: 13,
                  which: 13,
                  bubbles: true,
                  cancelable: true
                });
                chatInput.dispatchEvent(keypressEvent);
                
                const keyupEvent = new KeyboardEvent('keyup', { 
                  key: 'Enter', 
                  code: 'Enter', 
                  keyCode: 13,
                  which: 13,
                  bubbles: true,
                  cancelable: true
                });
                chatInput.dispatchEvent(keyupEvent);
                
                console.log('Attempted to send via keyboard events');
                setPendingChatQuery('');
              }
            }, 300);
          } catch (error) {
            console.error('Error setting chat input value:', error);
            // Retry after a short delay
            setTimeout(() => attemptToSendMessage(attempts + 1), 800);
          }
        } else {
          console.log('Chat input not found, retrying...');
          // Retry after a short delay
          setTimeout(() => attemptToSendMessage(attempts + 1), 800);
        }
      };
      
      // Start attempting to send the message with a longer initial delay
      const timer = setTimeout(() => attemptToSendMessage(), 1500);
      
      return () => clearTimeout(timer);
    }
  }, [showAiAssistant, pendingChatQuery]);

  useEffect(() => {
    const initializePage = async () => {
      try {
        // Check authentication
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        // Load user's domains from database
        const userDomains = await databaseService.getUserDomains(currentUser.$id);
        setDomains(userDomains);
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        setError('Failed to load dashboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [router]);

  const handleDomainAdded = (newDomain: CompetitorDomain) => {
    setDomains(prev => [newDomain, ...prev]);
  };

  const handleDomainUpdated = (updatedDomain: CompetitorDomain) => {
    setDomains(prev => 
      prev.map(domain => 
        domain.$id === updatedDomain.$id ? updatedDomain : domain
      )
    );
  };

  const handleDomainDeleted = (domainId: string) => {
    setDomains(prev => prev.filter(domain => domain.$id !== domainId));
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const tabs = [
    { id: 'domains' as TabType, label: 'Competitor Domains', icon: '🏢' },
    { id: 'alerts' as TabType, label: 'Alerts', icon: '🔔' },
    { id: 'agents' as TabType, label: 'AI Agents', icon: '🤖' },
  ];

  const renderTabContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case 'domains':
        return (
          <div className="space-y-6">
            {/* AI Assistant Quick Access */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Sparkles className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">AI Research Assistant</h3>
                    <p className="text-gray-600">Get intelligent insights about your competitors</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiAssistant(!showAiAssistant)}
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                    showAiAssistant 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {showAiAssistant ? '✓ Assistant Active' : 'Open AI Chat'}
                </button>
              </div>
              
              {/* Smart Query Input */}
              <div className="mt-4">
                <CopilotTextarea
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ask me anything about your competitors... (e.g., 'Analyze pricing strategies for SaaS competitors') - Press Enter to send directly to AI chat"
                  rows={2}
                  value={aiQuery}
                  onChange={(e) => {
                    setAiQuery(e.target.value);
                    // Auto-open sidebar when user starts typing
                    if (e.target.value.length > 0) {
                      handleAiInteraction();
                    }
                  }}
                  onFocus={handleAiInteraction}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (aiQuery.trim()) {
                        const queryToSend = aiQuery.trim();
                        // Open chat sidebar if not already open
                        if (!showAiAssistant) {
                          setShowAiAssistant(true);
                        }
                        // Store the query to be sent to chat
                        setPendingChatQuery(queryToSend);
                        // Clear the textarea since the query has been sent to chat
                        setAiQuery('');
                      }
                    }
                  }}
                  autosuggestionsConfig={{
                   textareaPurpose: "Competitive intelligence research query for analyzing competitors and market insights",
                   chatApiConfigs: {
                     suggestionsApiConfig: {},
                   },
                 }}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500">
                    AI will provide contextual suggestions as you type
                    {!showAiAssistant && (
                      <span className="ml-2 text-blue-600 font-medium">• Chat opens automatically when you start typing</span>
                    )}
                    <span className="ml-2 text-green-600 font-medium">• Press Enter to send directly to AI chat</span>
                    <span className="ml-2 text-gray-400">• Ctrl+K (⌘K) to toggle chat</span>
                  </p>
                  <div className="flex space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Brain className="w-3 h-3 mr-1" />
                      AI Powered
                    </span>
                    {!showAiAssistant && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Auto-Chat
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Competitor</h2>
              <AddDomainForm 
                onDomainAdded={handleDomainAdded} 
                userId={user.$id}
                onCancel={() => {}} 
              />
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Competitors</h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <DomainList 
                  domains={domains} 
                  onDomainUpdated={handleDomainUpdated}
                  onDomainDeleted={handleDomainDeleted}
                />
              )}
            </div>
          </div>
        );
      

      case 'alerts':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert Management</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">New Content Alerts</h3>
                  <p className="text-sm text-gray-600">Get notified when competitors publish new content</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Price Change Alerts</h3>
                  <p className="text-sm text-gray-600">Monitor competitor pricing changes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Weekly Reports</h3>
                  <p className="text-sm text-gray-600">Receive weekly competitive intelligence summaries</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        );
      
      case 'agents':
        return (
          <div className="space-y-6">
            {/* CopilotKit Features Banner */}
            <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-lg border border-purple-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Enhanced with CopilotKit AI</h3>
                  <p className="text-gray-600">Your agents are now powered by advanced AI capabilities</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2 text-sm">
                  <Search className="w-4 h-4 text-blue-600" />
                  <span>AI-Powered Discovery</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span>Intelligent Analysis</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Target className="w-4 h-4 text-red-600" />
                  <span>Strategic Recommendations</span>
                </div>
              </div>
            </div>

            {/* Enhanced Agent Dashboard */}
            <AgentDashboard userId={user.$id} />
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <img 
                  src="/spyce-logo.svg" 
                  alt="Spyce Intelligence" 
                  className="h-8 w-auto"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Spyce Intelligence Dashboard</h1>
          <p className="mt-2 text-gray-600">Advanced competitive intelligence platform powered by AI</p>
        </div>

        {/* Sponsor Section */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Powered by Leading AI & Infrastructure Partners</h2>
            <p className="text-sm text-gray-600">Built for the 100 Agents Hackathon</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
            {/* Mem0 */}
            <div className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-sm text-gray-900">Mem0</div>
                <div className="text-xs text-gray-500">AI Memory</div>
              </div>
            </div>

            {/* Tavily */}
            <div className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-sm text-gray-900">Tavily</div>
                <div className="text-xs text-gray-500">Web Search</div>
              </div>
            </div>

            {/* Appwrite */}
            <div className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-sm text-gray-900">Appwrite</div>
                <div className="text-xs text-gray-500">Backend</div>
              </div>
            </div>

            {/* CopilotKit */}
            <div className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-sm text-gray-900">CopilotKit</div>
                <div className="text-xs text-gray-500">AI Interface</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.id === 'agents' && (
                    <Sparkles className="w-4 h-4 text-purple-500" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>

      {/* CopilotKit Sidebar */}
      {showAiAssistant && (
        <CopilotSidebar
          instructions="You are an expert competitive intelligence assistant. Help users analyze competitors, discover market insights, identify trends, and develop strategic recommendations. Use the available data about their monitored domains and provide actionable advice for competitive advantage."
          labels={{
            title: "🔍 Intelligence Assistant",
            initial: pendingChatQuery || "Hi! I'm your AI research assistant. I can help you analyze competitors, discover market trends, and generate strategic insights. What would you like to explore?",
          }}
          defaultOpen={true}
          clickOutsideToClose={true}
          onSetOpen={(open) => {
            if (!open) {
              setShowAiAssistant(false);
              // Clear pending query when sidebar closes
              setPendingChatQuery('');
            }
          }}
        />
      )}
    </div>
  );
} 