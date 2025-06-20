'use client';

import { useState } from 'react';
import { CompetitorDomain, databaseService } from '@/lib/database';

interface AddDomainFormProps {
  userId: string;
  onDomainAdded: (domain: CompetitorDomain) => void;
  onCancel: () => void;
}

export default function AddDomainForm({ userId, onDomainAdded, onCancel }: AddDomainFormProps) {
  const [formData, setFormData] = useState({
    domain: '',
    name: '',
    description: '',
    crawlFrequency: 'weekly' as const,
    targetSections: [] as string[],
    isActive: true,
  });
  const [sectionInput, setSectionInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateDomain = (domain: string): boolean => {
    // Remove protocol and trailing slash for validation
    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
    return domainRegex.test(cleanDomain);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.domain.trim()) {
      setError('Domain is required');
      setLoading(false);
      return;
    }

    if (!validateDomain(formData.domain)) {
      setError('Please enter a valid domain (e.g., example.com)');
      setLoading(false);
      return;
    }

    if (!formData.name.trim()) {
      setError('Competitor name is required');
      setLoading(false);
      return;
    }

    try {
      // Ensure domain is in URL format for Appwrite
      let cleanDomain = formData.domain.toLowerCase().replace(/\/$/, '');
      if (!cleanDomain.startsWith('http://') && !cleanDomain.startsWith('https://')) {
        cleanDomain = `https://${cleanDomain}`;
      }

      const newDomain = await databaseService.createDomain({
        ...formData,
        userId,
        domain: cleanDomain,
      });

      onDomainAdded(newDomain);
    } catch (error: any) {
      console.error('Error adding domain:', error);
      setError(error.message || 'Failed to add domain. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addSection = () => {
    if (sectionInput.trim() && !formData.targetSections.includes(sectionInput.trim())) {
      setFormData(prev => ({
        ...prev,
        targetSections: [...prev.targetSections, sectionInput.trim()]
      }));
      setSectionInput('');
    }
  };

  const removeSection = (section: string) => {
    setFormData(prev => ({
      ...prev,
      targetSections: prev.targetSections.filter(s => s !== section)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === e.currentTarget) {
      e.preventDefault();
      addSection();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Competitor Domain</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
            Domain *
          </label>
          <input
            type="text"
            id="domain"
            placeholder="example.com"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.domain}
            onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
            required
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Competitor Name *
          </label>
          <input
            type="text"
            id="name"
            placeholder="Competitor Inc."
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            placeholder="Brief description of this competitor..."
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        <div>
          <label htmlFor="crawlFrequency" className="block text-sm font-medium text-gray-700">
            Crawl Frequency
          </label>
          <select
            id="crawlFrequency"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.crawlFrequency}
            onChange={(e) => setFormData(prev => ({ ...prev, crawlFrequency: e.target.value as any }))}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Sections
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="e.g., /blog, /pricing, /products"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={sectionInput}
              onChange={(e) => setSectionInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              type="button"
              onClick={addSection}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.targetSections.map((section, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {section}
                <button
                  type="button"
                  onClick={() => removeSection(section)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Domain'}
          </button>
        </div>
      </form>
    </div>
  );
} 