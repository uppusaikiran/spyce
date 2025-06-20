import { Client, Account, Databases, Storage } from 'appwrite';

// Validate environment variables
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

if (!endpoint) {
  throw new Error('NEXT_PUBLIC_APPWRITE_ENDPOINT is not set in environment variables');
}

if (!projectId) {
  throw new Error('NEXT_PUBLIC_APPWRITE_PROJECT_ID is not set in environment variables');
}

const client = new Client();

client
    .setEndpoint(endpoint) // Your API Endpoint
    .setProject(projectId); // Your project ID

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export default client; 