import { Client, Account, Databases, Storage } from 'appwrite';

// Validate environment variables
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

console.log('🔍 Appwrite Config Debug:', {
  endpoint: endpoint ? endpoint : 'MISSING',
  projectId: projectId ? projectId.substring(0, 8) + '...' : 'MISSING',
  nodeEnv: process.env.NODE_ENV
});

if (!endpoint) {
  const errorMsg = 'NEXT_PUBLIC_APPWRITE_ENDPOINT is not set in environment variables';
  console.error('❌', errorMsg);
  throw new Error(errorMsg);
}

if (!projectId) {
  const errorMsg = 'NEXT_PUBLIC_APPWRITE_PROJECT_ID is not set in environment variables';
  console.error('❌', errorMsg);
  throw new Error(errorMsg);
}

const client = new Client();

client
    .setEndpoint(endpoint) // Your API Endpoint
    .setProject(projectId); // Your project ID

console.log('✅ Appwrite client initialized successfully');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export default client; 