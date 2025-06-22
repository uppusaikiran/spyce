import { databases } from './appwrite';
import { ID, Query } from 'appwrite';

// Database and Collection IDs (you'll need to set these in your .env.local)
export const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID || 'intelai_database';
export const DOMAINS_COLLECTION_ID = process.env.NEXT_PUBLIC_DOMAINS_COLLECTION_ID || 'domains';
export const JOBS_COLLECTION_ID = process.env.NEXT_PUBLIC_JOBS_COLLECTION_ID || 'jobs';

export interface CompetitorDomain {
  $id: string;
  userId: string;
  domain: string;
  name: string;
  description?: string;
  crawlFrequency?: 'daily' | 'weekly' | 'monthly';
  targetSections?: string[];
  isActive?: boolean;
  status?: 'active' | 'inactive' | 'pending' | 'error';
  lastCrawled?: string | null;
  crawlData?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  $id: string;
  userId: string;
  type: 'discovery' | 'crawl' | 'research';
  status: 'pending' | 'running' | 'completed' | 'failed';
  domain?: string;
  industry?: string;
  parameters?: any; // Can be object (frontend) or string (database)
  result?: any; // Store full results - not truncated
  error?: string;
  progress?: number; // 0-100 percentage
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export class DatabaseService {
  // Helper function to safely parse JSON string
  private parseJsonField(jsonString?: string): any {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('Failed to parse JSON field:', jsonString);
      return null;
    }
  }

  // Helper function to transform job data after retrieval
  private transformJob(job: any): Job {
    return {
      ...job,
      parameters: this.parseJsonField(job.parameters),
      result: this.parseJsonField(job.result)
    } as Job;
  }
  // Create a new competitor domain
  async createDomain(domain: Omit<CompetitorDomain, '$id' | 'createdAt' | 'updatedAt'>): Promise<CompetitorDomain> {
    try {
      const now = new Date().toISOString();
      const domainData = {
        ...domain,
        // Ensure required fields have default values
        crawlFrequency: domain.crawlFrequency || 'weekly',
        isActive: domain.isActive !== undefined ? domain.isActive : true,
        createdAt: now,
        updatedAt: now,
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        DOMAINS_COLLECTION_ID,
        ID.unique(),
        domainData
      );

      return response as unknown as CompetitorDomain;
    } catch (error) {
      console.error('Error creating domain:', error);
      throw error;
    }
  }

  // Get all domains for a user
  async getUserDomains(userId: string): Promise<CompetitorDomain[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        DOMAINS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.orderDesc('createdAt')
        ]
      );

      return response.documents as unknown as CompetitorDomain[];
    } catch (error) {
      console.error('Error fetching user domains:', error);
      throw error;
    }
  }

  // Update a domain
  async updateDomain(domainId: string, updates: Partial<CompetitorDomain>): Promise<CompetitorDomain> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const response = await databases.updateDocument(
        DATABASE_ID,
        DOMAINS_COLLECTION_ID,
        domainId,
        updateData
      );

      return response as unknown as CompetitorDomain;
    } catch (error) {
      console.error('Error updating domain:', error);
      throw error;
    }
  }

  // Delete a domain
  async deleteDomain(domainId: string): Promise<void> {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        DOMAINS_COLLECTION_ID,
        domainId
      );
    } catch (error) {
      console.error('Error deleting domain:', error);
      throw error;
    }
  }

  // Get a single domain by ID
  async getDomain(domainId: string): Promise<CompetitorDomain> {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        DOMAINS_COLLECTION_ID,
        domainId
      );

      return response as unknown as CompetitorDomain;
    } catch (error) {
      console.error('Error fetching domain:', error);
      throw error;
    }
  }

  // Toggle domain active status
  async toggleDomainStatus(domainId: string, isActive: boolean): Promise<CompetitorDomain> {
    return this.updateDomain(domainId, { isActive });
  }

  // ========== JOB MANAGEMENT METHODS ==========
  
  // Create a new job
  async createJob(job: Omit<Job, '$id' | 'createdAt' | 'updatedAt'>): Promise<Job> {
    try {
      const now = new Date().toISOString();
      const jobData = {
        ...job,
        status: job.status || 'pending',
        progress: job.progress || 0,
        createdAt: now,
        updatedAt: now,
        // Convert parameters to JSON string if it's an object
        parameters: job.parameters && typeof job.parameters === 'object' 
          ? JSON.stringify(job.parameters)
          : job.parameters,
        // Convert result to JSON string if it's an object
        result: job.result && typeof job.result === 'object'
          ? JSON.stringify(job.result)
          : job.result
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        JOBS_COLLECTION_ID,
        ID.unique(),
        jobData
      );

      return this.transformJob(response);
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  }

  // Get all jobs for a user
  async getUserJobs(userId: string, limit: number = 50): Promise<Job[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        JOBS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.orderDesc('createdAt'),
          Query.limit(limit)
        ]
      );

      return response.documents.map(job => this.transformJob(job));
    } catch (error) {
      console.error('Error fetching user jobs:', error);
      throw error;
    }
  }

  // Update a job
  async updateJob(jobId: string, updates: Partial<Job>): Promise<Job> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        // Convert parameters to JSON string if it's an object
        parameters: updates.parameters && typeof updates.parameters === 'object'
          ? JSON.stringify(updates.parameters)
          : updates.parameters,
        // Convert result to JSON string if it's an object
        result: updates.result && typeof updates.result === 'object'
          ? JSON.stringify(updates.result)
          : updates.result
      };

      // Set completedAt if status is changing to completed
      if (updates.status === 'completed' && !updates.completedAt) {
        updateData.completedAt = new Date().toISOString();
      }

      const response = await databases.updateDocument(
        DATABASE_ID,
        JOBS_COLLECTION_ID,
        jobId,
        updateData
      );

      return this.transformJob(response);
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  }

  // Get a single job by ID
  async getJob(jobId: string): Promise<Job> {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        JOBS_COLLECTION_ID,
        jobId
      );

      return this.transformJob(response);
    } catch (error) {
      console.error('Error fetching job:', error);
      throw error;
    }
  }

  // Delete a job
  async deleteJob(jobId: string): Promise<void> {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        JOBS_COLLECTION_ID,
        jobId
      );
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  }

  // Get running jobs for a user
  async getRunningJobs(userId: string): Promise<Job[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        JOBS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('status', 'running'),
          Query.orderDesc('createdAt')
        ]
      );

      return response.documents.map(job => this.transformJob(job));
    } catch (error) {
      console.error('Error fetching running jobs:', error);
      throw error;
    }
  }

  // Clean up old completed jobs (keep last 100)
  async cleanupOldJobs(userId: string): Promise<void> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        JOBS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('status', 'completed'),
          Query.orderDesc('createdAt'),
          Query.limit(1000) // Get more than we need
        ]
      );

      const jobs = response.documents as unknown as Job[];
      
      // Keep only the first 100, delete the rest
      if (jobs.length > 100) {
        const jobsToDelete = jobs.slice(100);
        const deletePromises = jobsToDelete.map(job => this.deleteJob(job.$id));
        await Promise.all(deletePromises);
      }
    } catch (error) {
      console.error('Error cleaning up old jobs:', error);
      // Don't throw - this is a cleanup operation
    }
  }
}

export const databaseService = new DatabaseService(); 