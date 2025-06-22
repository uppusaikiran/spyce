'use client';

import { useEffect, useState } from 'react';

export default function ConfigCheckPage() {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const checkConfig = () => {
      const configData = {
        endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'NOT SET',
        projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'NOT SET',
        nodeEnv: process.env.NODE_ENV || 'NOT SET',
        timestamp: new Date().toISOString()
      };
      
      console.log('🔍 Config Check:', configData);
      setConfig(configData);
    };

    checkConfig();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Configuration Check</h1>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables Status</h2>
          
          {config && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Appwrite Endpoint
                  </label>
                  <div className={`mt-1 p-2 rounded border ${
                    config.endpoint !== 'NOT SET' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <code className="text-sm">{config.endpoint}</code>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Project ID
                  </label>
                  <div className={`mt-1 p-2 rounded border ${
                    config.projectId !== 'NOT SET' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <code className="text-sm">
                      {config.projectId !== 'NOT SET' ? 
                        config.projectId.substring(0, 8) + '...' : 
                        config.projectId
                      }
                    </code>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Environment
                  </label>
                  <div className="mt-1 p-2 rounded border border-gray-200">
                    <code className="text-sm">{config.nodeEnv}</code>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Check Time
                  </label>
                  <div className="mt-1 p-2 rounded border border-gray-200">
                    <code className="text-sm">{new Date(config.timestamp).toLocaleString()}</code>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">Debug Instructions:</h3>
                <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                  <li>Check if all environment variables show valid values (not "NOT SET")</li>
                  <li>If variables are missing, add them in Netlify: Site Settings → Environment Variables</li>
                  <li>After adding variables, redeploy your site</li>
                  <li>Check browser console for additional error messages</li>
                </ol>
              </div>
              
              {(config.endpoint === 'NOT SET' || config.projectId === 'NOT SET') && (
                <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
                  <h3 className="font-medium text-red-900 mb-2">❌ Configuration Error</h3>
                  <p className="text-sm text-red-800">
                    Missing required environment variables. This will cause authentication to fail.
                  </p>
                </div>
              )}
              
              {config.endpoint !== 'NOT SET' && config.projectId !== 'NOT SET' && (
                <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200">
                  <h3 className="font-medium text-green-900 mb-2">✅ Configuration Looks Good</h3>
                  <p className="text-sm text-green-800">
                    Environment variables are set. If you're still having issues, check the Appwrite console for platform settings.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 