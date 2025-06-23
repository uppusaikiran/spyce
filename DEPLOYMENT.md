# Vercel Deployment Guide

This guide will help you deploy your Spyce Intelligence application to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. All required API keys and environment variables

## Deployment Steps

### 1. Connect Your Repository

1. Log in to your Vercel dashboard
2. Click "New Project"
3. Import your Git repository
4. Select your project and click "Import"

### 2. Configure Environment Variables

In your Vercel project settings, add these environment variables:

#### Required Variables:
```
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_API_KEY=your_api_key_here
NEXT_PUBLIC_APPWRITE_DATABASE_ID=intelai_database
NEXT_PUBLIC_APPWRITE_DOMAINS_COLLECTION_ID=domains
```

#### API Keys (add the ones you're using):
```
TAVILY_API_KEY=your_tavily_api_key_here
KEYWORDS_AI_API_KEY=your_keywords_ai_api_key_here
MEM0_API_KEY=your_mem0_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
SERPER_API_KEY=your_serper_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY=your_copilotkit_public_api_key_here
```

### 3. Build Settings

Vercel should automatically detect your Next.js application and use these settings:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 4. Function Configuration

Your API routes are configured with a 60-second timeout in `vercel.json`. This should be sufficient for most operations.

### 5. Deploy

1. Click "Deploy" to start your first deployment
2. Vercel will build and deploy your application
3. You'll get a unique URL for your deployment

## Post-Deployment Steps

### 1. Set up Appwrite Database

After deployment, you'll need to run the database setup:

```bash
# Clone your repository locally
git clone your-repo-url
cd your-project

# Install dependencies
npm install

# Set up your .env file with the same variables as Vercel
cp env.example .env
# Edit .env with your actual values

# Run the database setup script
npm run setup-db
```

### 2. Update CORS Settings

If you're using external APIs, make sure to add your Vercel deployment URL to their CORS whitelist.

### 3. Test Your Deployment

Visit your Vercel URL and test:
- [ ] Authentication works
- [ ] API routes respond correctly
- [ ] Database operations function properly
- [ ] All agent endpoints are accessible

## Troubleshooting

### Common Issues:

1. **Environment Variables**: Make sure all required environment variables are set in Vercel
2. **API Timeouts**: Increase function timeout if needed (current: 60s)
3. **Build Errors**: Check the build logs in Vercel dashboard
4. **CORS Issues**: Verify CORS headers in `next.config.js`

### Checking Logs:

- View function logs in Vercel dashboard under "Functions" tab
- Use `console.log` in your API routes for debugging
- Check the "Deployments" tab for build logs

## Domain Configuration

### Custom Domain:

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Configure DNS records as instructed by Vercel

## Security Considerations

1. **Environment Variables**: Never commit real API keys to your repository
2. **CORS**: Configure CORS properly for production
3. **Rate Limiting**: Consider implementing rate limiting for your API routes
4. **Authentication**: Ensure your authentication is properly configured

## Performance Optimization

1. **Edge Functions**: Consider using Vercel Edge Functions for frequently accessed endpoints
2. **Caching**: Implement proper caching strategies
3. **Image Optimization**: Use Next.js Image component for optimized images
4. **Bundle Analysis**: Regularly check your bundle size

## Monitoring

1. Set up Vercel Analytics for performance monitoring
2. Configure error tracking (Sentry, Bugsnag, etc.)
3. Monitor API response times and error rates

## Rollback

If you need to rollback a deployment:
1. Go to "Deployments" in your Vercel dashboard
2. Find the previous working deployment
3. Click "Promote to Production" 