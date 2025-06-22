'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Brain, 
  User, 
  Bot, 
  Loader2, 
  Memory, 
  Clock,
  MessageSquare,
  Trash2,
  Download,
  Settings
} from 'lucide-react';
import { useToast } from './Toast';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  metadata?: {
    memoryEnhanced?: boolean;
    contextUsed?: boolean;
  };
}

interface MemoryStatus {
  memoryInitialized: boolean;
  agentSystemReady: boolean;
  capabilities: string[];
}

interface MemoryChatProps {
  userId: string;
  sessionId?: string;
  context?: {
    industry?: string;
    researchType?: string;
    domain?: string;
  };
  className?: string;
}

export default function MemoryChat({ 
  userId, 
  sessionId = `session_${Date.now()}`, 
  context = {},
  className = ''
}: MemoryChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [memoryStatus, setMemoryStatus] = useState<MemoryStatus | null>(null);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showSuccess, showError, showWarning } = useToast();

  // Load memory status on mount
  useEffect(() => {
    loadMemoryStatus();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMemoryStatus = async () => {
    try {
      const response = await fetch('/api/chat?operation=memory-status');
      if (response.ok) {
        const status = await response.json();
        setMemoryStatus(status);
        
        if (!status.memoryInitialized) {
          showWarning('Memory service not available. Chat will work without personalization.');
        }
      }
    } catch (error) {
      console.error('Failed to load memory status:', error);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      content: currentMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          userId,
          sessionId,
          context
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: `msg_${Date.now()}_assistant`,
          content: data.response,
          sender: 'assistant',
          timestamp: data.metadata.timestamp,
          metadata: {
            memoryEnhanced: data.metadata.memoryEnhanced,
            contextUsed: data.metadata.contextUsed
          }
        };

        setMessages(prev => [...prev, assistantMessage]);

        if (data.metadata.memoryEnhanced) {
          showSuccess('Response enhanced with your conversation history');
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      showError('Failed to send message. Please try again.');
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'assistant',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    showSuccess('Chat cleared');
  };

  const exportChat = () => {
    const chatData = {
      sessionId,
      userId,
      context,
      messages: messages.map(m => ({
        content: m.content,
        sender: m.sender,
        timestamp: m.timestamp
      })),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${sessionId}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Chat exported successfully');
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Memory-Enhanced Chat</h3>
          </div>
          {memoryStatus?.memoryInitialized && (
            <div className="flex items-center space-x-1 text-sm text-green-600">
              <Brain className="w-4 h-4" />
              <span>Memory Active</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMemoryPanel(!showMemoryPanel)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Memory Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={exportChat}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Export Chat"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={clearChat}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Memory Status Panel */}
      <AnimatePresence>
        {showMemoryPanel && memoryStatus && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 bg-gray-50 p-4"
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700 mb-2">System Status</div>
                <div className="space-y-1">
                  <div className={`flex items-center space-x-2 ${memoryStatus.memoryInitialized ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full ${memoryStatus.memoryInitialized ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>Memory Service</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${memoryStatus.agentSystemReady ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full ${memoryStatus.agentSystemReady ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>Agent System</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700 mb-2">Capabilities</div>
                <div className="text-xs text-gray-600 space-y-1">
                  {memoryStatus.capabilities.map((cap, idx) => (
                    <div key={idx}>• {cap}</div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Start a conversation</p>
            <p className="text-sm">
              {memoryStatus?.memoryInitialized 
                ? "I'll remember our conversation and provide personalized responses"
                : "I'm ready to help with your research and analysis"
              }
            </p>
          </div>
        )}

        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} space-x-2`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.sender === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <div className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-2 rounded-lg ${
                  message.sender === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                
                <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                  {message.metadata?.memoryEnhanced && (
                    <div className="flex items-center space-x-1 text-blue-600">
                      <Memory className="w-3 h-3" />
                      <span>Enhanced</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex space-x-2 max-w-[80%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                <span className="text-gray-500">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <textarea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!currentMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {context.industry && (
          <div className="mt-2 text-xs text-gray-500">
            Context: {context.industry} {context.researchType && `• ${context.researchType}`}
          </div>
        )}
      </div>
    </div>
  );
} 