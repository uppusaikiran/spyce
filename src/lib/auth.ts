import { account } from './appwrite';
import { ID } from 'appwrite';

export interface User {
  $id: string;
  name: string;
  email: string;
}

export class AuthService {
  // Create a new account
  async createAccount(email: string, password: string, name: string): Promise<User> {
    try {
      const newAccount = await account.create(ID.unique(), email, password, name);
      
      if (newAccount) {
        // Log the user in after creating account
        return this.login(email, password);
      } else {
        throw new Error('Account creation failed');
      }
    } catch (error) {
      console.error('Account creation error:', error);
      throw error;
    }
  }

  // Login user
  async login(email: string, password: string): Promise<User> {
    try {
      // First check if there's already an active session
      try {
        const currentUser = await this.getCurrentUser();
        if (currentUser) {
          // User is already logged in, return current user
          return currentUser;
        }
      } catch (error) {
        // No active session, continue with login
        console.log('No active session found, proceeding with login');
      }

      // If we get here, either there's no session or getCurrentUser failed
      // Clean up any existing sessions before creating a new one
      try {
        await account.deleteSessions();
      } catch (error) {
        // It's okay if there are no sessions to delete
        console.log('No existing sessions to clean up');
      }

      // Now create the new session
      await account.createEmailSession(email, password);
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('Failed to get user after login');
      }
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const currentAccount = await account.get();
      return {
        $id: currentAccount.$id,
        name: currentAccount.name,
        email: currentAccount.email,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await account.deleteSessions();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch (error) {
      return false;
    }
  }

  // Delete current session only (useful for single session logout)
  async deleteCurrentSession(): Promise<void> {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.error('Delete current session error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService(); 