'use client';

import { useState } from 'react';
import { CompetitorDomain, databaseService } from '@/lib/database';
import { useToast, ToastContainer } from './Toast';
import ConfirmModal from './ConfirmModal';

interface DomainListProps {
  domains: CompetitorDomain[];
  onDomainUpdated?: (domain: CompetitorDomain) => void;
  onDomainDeleted?: (domainId: string) => void;
}

export default function DomainList({ domains, onDomainUpdated, onDomainDeleted }: DomainListProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CompetitorDomain | null>(null);
  
  // Toast notifications
  const { toasts, removeToast, showError } = useToast();

  if (domains.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">🏢</div>
        <p className="text-lg font-medium">No competitors added yet</p>
        <p className="text-sm">Add your first competitor above to start monitoring!</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (domain: CompetitorDomain) => {
    const isActive = domain.isActive !== false;
    const hasBeenCrawled = domain.lastCrawled !== null;
    
    if (!isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <span className="w-1.5 h-1.5 mr-1 bg-gray-400 rounded-full"></span>
          Inactive
        </span>
      );
    }
    
    if (hasBeenCrawled) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="w-1.5 h-1.5 mr-1 bg-green-400 rounded-full animate-pulse"></span>
          Monitored
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <span className="w-1.5 h-1.5 mr-1 bg-yellow-400 rounded-full"></span>
        Pending
      </span>
    );
  };

  const startMonitoring = async (domain: CompetitorDomain) => {
    setLoading(domain.$id);
    try {
      const response = await fetch('/api/agents/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: [domain.domain] }),
      });
      
      if (response.ok) {
        // Update domain to show it's being monitored
        const updatedDomain = await databaseService.updateDomain(domain.$id, {
          lastCrawled: new Date().toISOString()
        });
        
        if (onDomainUpdated) {
          onDomainUpdated(updatedDomain);
        }
        
        console.log('Crawling started for:', domain.domain);
      }
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    } finally {
      setLoading(null);
    }
  };

  const toggleDomainStatus = async (domain: CompetitorDomain) => {
    setLoading(domain.$id);
    try {
      const updatedDomain = await databaseService.toggleDomainStatus(domain.$id, !domain.isActive);
      
      if (onDomainUpdated) {
        onDomainUpdated(updatedDomain);
      }
    } catch (error) {
      console.error('Failed to toggle domain status:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteClick = (domain: CompetitorDomain) => {
    setConfirmDelete(domain);
  };

  const deleteDomain = async (domain: CompetitorDomain) => {
    setLoading(domain.$id);
    try {
      await databaseService.deleteDomain(domain.$id);
      
      if (onDomainDeleted) {
        onDomainDeleted(domain.$id);
      }
    } catch (error) {
      console.error('Failed to delete domain:', error);
      showError('Failed to delete domain. Please try again.');
    } finally {
      setLoading(null);
      setConfirmDelete(null);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Delete Domain"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={() => confirmDelete && deleteDomain(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
      <div className="space-y-3">
      {domains.map((domain) => (
        <div key={domain.$id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {domain.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {domain.name}
                    </h3>
                    {getStatusBadge(domain)}
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <p className="text-sm text-gray-600 truncate">
                      <a 
                        href={domain.domain.startsWith('http') ? domain.domain : `https://${domain.domain}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 transition-colors"
                      >
                        {domain.domain.replace(/^https?:\/\//, '')}
                      </a>
                    </p>
                    <span className="text-xs text-gray-400">
                      Added {formatDate(domain.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0 flex items-center space-x-2">
              {domain.lastCrawled && (
                <div className="text-xs text-gray-500">
                  <div>Last crawled</div>
                  <div className="font-medium">{formatDate(domain.lastCrawled)}</div>
                </div>
              )}
              
              <div className="flex space-x-1">
                {!domain.lastCrawled && domain.isActive !== false && (
                  <button 
                    onClick={() => startMonitoring(domain)}
                    disabled={loading === domain.$id}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-1"
                  >
                    {loading === domain.$id ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    <span>Start Monitoring</span>
                  </button>
                )}
                
                <button 
                  onClick={() => toggleDomainStatus(domain)}
                  disabled={loading === domain.$id}
                  className={`p-2 rounded-lg transition-colors ${
                    domain.isActive 
                      ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50' 
                      : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={domain.isActive ? 'Pause monitoring' : 'Resume monitoring'}
                >
                  {loading === domain.$id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
                
                <button 
                  onClick={() => startMonitoring(domain)}
                  disabled={loading === domain.$id}
                  className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Refresh data"
                >
                  {loading === domain.$id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </button>
                
                <button 
                  onClick={() => handleDeleteClick(domain)}
                  disabled={loading === domain.$id}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Delete domain"
                >
                  {loading === domain.$id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {domain.description && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600">{domain.description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
    </>
  );
} 