'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, User } from '@/lib/auth';
import { CompetitorDomain, databaseService } from '@/lib/database';
import AddDomainForm from '@/components/AddDomainForm';
import DomainList from '@/components/DomainList';

export default function DomainsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [domains, setDomains] = useState<CompetitorDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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

        // Load user's domains
        const userDomains = await databaseService.getUserDomains(currentUser.$id);
        setDomains(userDomains);
      } catch (error) {
        console.error('Error initializing domains page:', error);
        setError('Failed to load domains. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [router]);

  const handleDomainAdded = (newDomain: CompetitorDomain) => {
    setDomains(prev => [newDomain, ...prev]);
    setShowAddForm(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
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
              <h1 className="text-xl font-semibold text-gray-900">IntelAI</h1>
              <nav className="flex space-x-4">
                <a href="/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </a>
                <a href="/dashboard/domains" className="text-blue-600 bg-blue-50 px-3 py-2 rounded-md text-sm font-medium">
                  Domains
                </a>
              </nav>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Competitor Domains</h2>
              <p className="text-gray-600">Manage and monitor your competitor websites</p>
            </div>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add Domain
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-600">{error}</div>
            </div>
          )}

          {/* Add Domain Form */}
          {showAddForm && (
            <div className="mb-6">
              <AddDomainForm
                userId={user!.$id}
                onDomainAdded={handleDomainAdded}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">🌐</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Domains</dt>
                      <dd className="text-lg font-medium text-gray-900">{domains.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">✅</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Domains</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {domains.filter(d => d.isActive).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">📊</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Daily Crawls</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {domains.filter(d => d.crawlFrequency === 'daily' && d.isActive).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Domain List */}
          <DomainList
            domains={domains}
            onDomainUpdated={handleDomainUpdated}
            onDomainDeleted={handleDomainDeleted}
          />
        </div>
      </main>
    </div>
  );
} 