const { Client, Databases, Permission, Role, ID } = require('node-appwrite');
require('dotenv').config();

// Configuration
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.NEXT_PUBLIC_DATABASE_ID || 'intelai_database';

if (!projectId || !apiKey) {
  console.error('❌ Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID or APPWRITE_API_KEY in environment variables');
  process.exit(1);
}

// Initialize Appwrite
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function setupDatabase() {
  try {
    console.log('🚀 Setting up AgentHub database...');

    // Try to get existing database, create if it doesn't exist
    let database;
    try {
      database = await databases.get(databaseId);
      console.log('✅ Database exists:', database.name);
    } catch (error) {
      if (error.code === 404) {
        console.log('📝 Creating database...');
        database = await databases.create(databaseId, 'AgentHub Database');
        console.log('✅ Database created:', database.name);
      } else {
        throw error;
      }
    }

    // Setup domains collection
    console.log('📝 Setting up domains collection...');
    try {
      const domainsCollection = await databases.getCollection(databaseId, 'domains');
      console.log('✅ Domains collection exists');
    } catch (error) {
      if (error.code === 404) {
        const domainsCollection = await databases.createCollection(
          databaseId,
          'domains',
          'Competitor Domains',
          [
            Permission.create(Role.users()),
            Permission.read(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users())
          ]
        );

        // Create attributes for domains collection
        const domainAttributes = [
          { key: 'userId', type: 'string', size: 255, required: true },
          { key: 'domain', type: 'url', required: true },
          { key: 'name', type: 'string', size: 255, required: true },
          { key: 'description', type: 'string', size: 1000, required: false },
          { key: 'crawlFrequency', type: 'string', size: 50, required: false },
          { key: 'targetSections', type: 'string', size: 5000, required: false },
          { key: 'isActive', type: 'boolean', required: false },
          { key: 'status', type: 'string', size: 50, required: false },
          { key: 'lastCrawled', type: 'datetime', required: false },
          { key: 'crawlData', type: 'string', size: 65535, required: false },
          { key: 'createdAt', type: 'datetime', required: true },
          { key: 'updatedAt', type: 'datetime', required: true }
        ];

        for (const attr of domainAttributes) {
          try {
            if (attr.type === 'string') {
              await databases.createStringAttribute(databaseId, 'domains', attr.key, attr.size, attr.required);
            } else if (attr.type === 'url') {
              await databases.createUrlAttribute(databaseId, 'domains', attr.key, attr.required);
            } else if (attr.type === 'boolean') {
              await databases.createBooleanAttribute(databaseId, 'domains', attr.key, attr.required);
            } else if (attr.type === 'datetime') {
              await databases.createDatetimeAttribute(databaseId, 'domains', attr.key, attr.required);
            }
            console.log(`✅ Created domains attribute: ${attr.key}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between attributes
          } catch (attrError) {
            console.log(`⚠️ Attribute ${attr.key} might already exist or error:`, attrError.message);
          }
        }

        // Create indexes for domains collection
        try {
          await databases.createIndex(databaseId, 'domains', 'userId_index', 'key', ['userId']);
          console.log('✅ Created userId index for domains');
        } catch (indexError) {
          console.log('⚠️ UserId index might already exist for domains');
        }

        console.log('✅ Domains collection created successfully');
      } else {
        throw error;
      }
    }

    // Setup jobs collection
    console.log('📝 Setting up jobs collection...');
    try {
      const jobsCollection = await databases.getCollection(databaseId, 'jobs');
      console.log('✅ Jobs collection exists');
    } catch (error) {
      if (error.code === 404) {
        const jobsCollection = await databases.createCollection(
          databaseId,
          'jobs',
          'Agent Jobs',
          [
            Permission.create(Role.users()),
            Permission.read(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users())
          ]
        );

        // Create attributes for jobs collection
        const jobAttributes = [
          { key: 'userId', type: 'string', size: 255, required: true },
          { key: 'type', type: 'string', size: 50, required: true },
          { key: 'status', type: 'string', size: 50, required: true },
          { key: 'domain', type: 'string', size: 255, required: false },
          { key: 'industry', type: 'string', size: 255, required: false },
          { key: 'parameters', type: 'string', size: 65535, required: false }, // JSON string
          { key: 'result', type: 'string', size: 65535, required: false }, // JSON string
          { key: 'error', type: 'string', size: 2000, required: false },
          { key: 'progress', type: 'integer', required: false },
          { key: 'createdAt', type: 'datetime', required: true },
          { key: 'updatedAt', type: 'datetime', required: true },
          { key: 'completedAt', type: 'datetime', required: false }
        ];

        for (const attr of jobAttributes) {
          try {
            if (attr.type === 'string') {
              await databases.createStringAttribute(databaseId, 'jobs', attr.key, attr.size, attr.required);
            } else if (attr.type === 'boolean') {
              await databases.createBooleanAttribute(databaseId, 'jobs', attr.key, attr.required);
            } else if (attr.type === 'datetime') {
              await databases.createDatetimeAttribute(databaseId, 'jobs', attr.key, attr.required);
            } else if (attr.type === 'integer') {
              await databases.createIntegerAttribute(databaseId, 'jobs', attr.key, attr.required);
            }
            console.log(`✅ Created jobs attribute: ${attr.key}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between attributes
          } catch (attrError) {
            console.log(`⚠️ Attribute ${attr.key} might already exist or error:`, attrError.message);
          }
        }

        // Create indexes for jobs collection
        try {
          await databases.createIndex(databaseId, 'jobs', 'userId_index', 'key', ['userId']);
          console.log('✅ Created userId index for jobs');
        } catch (indexError) {
          console.log('⚠️ UserId index might already exist for jobs');
        }

        try {
          await databases.createIndex(databaseId, 'jobs', 'status_index', 'key', ['status']);
          console.log('✅ Created status index for jobs');
        } catch (indexError) {
          console.log('⚠️ Status index might already exist for jobs');
        }

        try {
          await databases.createIndex(databaseId, 'jobs', 'type_index', 'key', ['type']);
          console.log('✅ Created type index for jobs');
        } catch (indexError) {
          console.log('⚠️ Type index might already exist for jobs');
        }

        try {
          await databases.createIndex(databaseId, 'jobs', 'created_index', 'key', ['createdAt'], ['desc']);
          console.log('✅ Created createdAt index for jobs');
        } catch (indexError) {
          console.log('⚠️ CreatedAt index might already exist for jobs');
        }

        console.log('✅ Jobs collection created successfully');
      } else {
        throw error;
      }
    }

    console.log('🎉 Database setup completed successfully!');
    console.log('\n📋 Collections created:');
    console.log('  • domains - For storing competitor domains');
    console.log('  • jobs - For storing agent job queue');
    console.log('\n🔧 Next steps:');
    console.log('  1. Update your .env.local file with:');
    console.log(`     NEXT_PUBLIC_DATABASE_ID=${databaseId}`);
    console.log('     NEXT_PUBLIC_DOMAINS_COLLECTION_ID=domains');
    console.log('     NEXT_PUBLIC_JOBS_COLLECTION_ID=jobs');
    console.log('  2. Start your application');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase(); 