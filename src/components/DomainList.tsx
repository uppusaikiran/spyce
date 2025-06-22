'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Eye, 
  EyeOff, 
  Trash2, 
  RefreshCw, 
  Play, 
  Pause, 
  Calendar, 
  ExternalLink,
  Building,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { CompetitorDomain, databaseService } from '@/lib/database';
import { useToast, ToastContainer } from './Toast';
import ConfirmModal from './ConfirmModal';
import { cn } from '@/lib/utils';

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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <Building className="w-10 h-10 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No competitors added yet</h3>
        <p className="text-sm text-gray-500">Add your first competitor above to start monitoring!</p>
      </motion.div>
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
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Pause className="w-3 h-3" />
          Inactive
        </span>
      );
    }
    
    if (hasBeenCrawled) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          Monitored
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3" />
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
      <div className="space-y-4">
      <AnimatePresence>
        {domains.map((domain, index) => (
          <motion.div 
            key={domain.$id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="relative w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <span className="text-blue-600 font-bold text-lg">
                          {domain.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          {domain.name}
                        </h3>
                        {getStatusBadge(domain)}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Globe className="w-4 h-4" />
                          <a 
                            href={domain.domain.startsWith('http') ? domain.domain : `https://${domain.domain}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-blue-600 transition-colors flex items-center gap-1 group"
                          >
                            {domain.domain.replace(/^https?:\/\//, '')}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          Added {formatDate(domain.createdAt)}
                        </div>
                      </div>
                      {domain.lastCrawled && (
                        <div className="flex items-center gap-2 text-xs text-green-600 mt-1">
                          <Activity className="w-3 h-3" />
                          Last crawled {formatDate(domain.lastCrawled)}
                        </div>
                      )}
                    </div>
                </div>
              </div>
            </div>
            
                            <div className="flex-shrink-0 flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                                    {!domain.lastCrawled && domain.isActive !== false && (
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => startMonitoring(domain)}
                        disabled={loading === domain.$id}
                        className={cn(
                          "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2",
                          loading === domain.$id
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg"
                        )}
                      >
                        {loading === domain.$id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        <span>Start Monitoring</span>
                      </motion.button>
                    )}
                
                                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleDomainStatus(domain)}
                      disabled={loading === domain.$id}
                      className={cn(
                        "p-2 rounded-lg transition-all duration-200",
                        domain.isActive 
                          ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' 
                          : 'text-gray-400 hover:text-green-600 hover:bg-green-50',
                        loading === domain.$id && 'opacity-50 cursor-not-allowed'
                      )}
                      title={domain.isActive ? 'Pause monitoring' : 'Resume monitoring'}
                    >
                      {loading === domain.$id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : domain.isActive ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </motion.button>
                
                                    <motion.button 
                      whileHover={{ scale: 1.1, rotate: 180 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => startMonitoring(domain)}
                      disabled={loading === domain.$id}
                      className={cn(
                        "p-2 rounded-lg transition-all duration-200",
                        "text-gray-400 hover:text-green-600 hover:bg-green-50",
                        loading === domain.$id && "opacity-50 cursor-not-allowed"
                      )}
                      title="Refresh data"
                    >
                      {loading === domain.$id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </motion.button>
                
                                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteClick(domain)}
                      disabled={loading === domain.$id}
                      className={cn(
                        "p-2 rounded-lg transition-all duration-200",
                        "text-gray-400 hover:text-red-600 hover:bg-red-50",
                        loading === domain.$id && "opacity-50 cursor-not-allowed"
                      )}
                      title="Delete domain"
                    >
                      {loading === domain.$id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </motion.button>
                  </div>
                </div>
              
              {domain.description && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-gray-200/50"
                >
                  <p className="text-sm text-gray-600 leading-relaxed">{domain.description}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
    </>
  );
} 