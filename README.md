# Spyce - Advanced Competitive Intelligence Platform

<div align="center">
  <img src="public/spyce-logo.svg" alt="Spyce Intelligence" width="200" />
</div>

> 🏆 **CopilotKit Contest Entry** - Enhanced with AI-powered features using CopilotKit

**Spyce** is an advanced competitive intelligence platform that empowers businesses to monitor competitors, analyze market trends, and gain strategic insights. Enhanced with **CopilotKit integration** for next-level AI assistance and intelligent automation.

## 🚀 Key Features

### Core Intelligence Platform
- **Competitor Monitoring**: Automated crawling and analysis of competitor websites
- **Market Research**: AI-driven insights and trend identification  
- **Strategic Planning**: Data-driven recommendations for business strategy
- **Real-time Alerts**: Notifications for competitor changes and market updates

### 🤖 NEW: CopilotKit AI Enhancement
- **AI Assistant Sidebar**: Contextual help and intelligent conversations
- **Smart Text Completion**: AI-powered autocomplete for research queries
- **Custom AI Actions**: Specialized competitive intelligence functions
- **Enhanced Dashboard**: Seamlessly integrated AI features in existing interface

## 🎯 CopilotKit Integration Highlights

This project showcases how CopilotKit can enhance existing applications **without breaking functionality**:

- ✅ **Zero Disruption**: All existing features remain exactly the same
- ✅ **Contextual AI**: Assistant understands your competitive landscape  
- ✅ **Smart Actions**: Custom AI functions for competitor analysis
- ✅ **Enhanced UX**: Optional AI assistance that improves workflows
- ✅ **Real Business Value**: Practical competitive intelligence insights

## 🛠 Quick Start

### Prerequisites
```bash
# Required environment variables
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY=your_copilotkit_public_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
SERPER_API_KEY=your_serper_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd agenthub

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your actual API keys (never commit this file!)

# Start development server
npm run dev
```

### 🔒 Security Note
- Never commit your `.env` file with real API keys
- The `.env` file is already in `.gitignore` for security
- Replace placeholder values in `.env` with your actual API keys

### Testing CopilotKit Features
1. Visit `http://localhost:3000/dashboard`
2. Login or signup for an account
3. Click "Show AI Assistant" to enable the CopilotKit sidebar
4. Try the smart text completion in research queries
5. Ask the AI assistant about competitive intelligence

## 🏗 Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **AI Integration**: CopilotKit (React Core, UI, Textarea, Runtime)
- **Backend**: Next.js API Routes, Appwrite Database
- **Research APIs**: Perplexity AI, Tavily Search, Serper API
- **Authentication**: Appwrite Auth
- **Animations**: Framer Motion

## 📁 Project Structure

```
src/
├── app/
│   ├── dashboard/          # Main dashboard with CopilotKit integration
│   ├── api/
│   │   ├── copilotkit/     # CopilotKit backend runtime
│   │   └── agents/         # Research agent APIs
│   └── layout.tsx          # CopilotKit provider setup
├── components/
│   ├── AgentDashboard.tsx  # Enhanced with AI context
│   └── [other components]
├── lib/
│   ├── agents/             # Research agents and AI processing
│   └── [other utilities]
```

## 🤖 CopilotKit Implementation

### Core Integration Points

1. **App Layout** (`src/app/layout.tsx`): CopilotKit provider wrapper
2. **Dashboard** (`src/app/dashboard/page.tsx`): Enhanced with AI features
3. **API Runtime** (`src/app/api/copilotkit/route.ts`): Backend AI processing
4. **Custom Actions**: Specialized competitive intelligence functions

### Custom AI Actions

- **`analyzeCompetitor`**: Deep analysis of specific competitors
- **`suggestCompetitors`**: Intelligent competitor discovery  
- **`generateResearchPlan`**: Strategic research planning assistance

## 🎯 Contest Entry Details

This project demonstrates **Best AI Copilot Integration** by:

- **Enhancing Existing Workflows**: CopilotKit improves rather than replaces
- **Domain-Specific Intelligence**: AI understands competitive intelligence needs
- **Seamless User Experience**: Optional AI assistance with zero learning curve
- **Real Business Application**: Solves actual competitive intelligence challenges
- **Technical Excellence**: Production-ready implementation with proper error handling

## 📖 Documentation

- [CopilotKit Integration Guide](./COPILOTKIT_INTEGRATION.md) - Detailed technical implementation
- [API Documentation](./docs/api.md) - Research agent and backend APIs
- [User Guide](./docs/user-guide.md) - How to use the platform effectively

## 🚀 Development

### Local Development with CopilotKit CLI
```bash
# Install CopilotKit CLI
npm install -g @copilotkit/cli

# Start your local server
npm run dev

# Create secure tunnel (in another terminal)
npx copilotkit dev --port 3000 --project your_project_id
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test CopilotKit integration
5. Submit a pull request

## 🏆 CopilotKit Contest

This project is submitted for the **Best AI Copilot** contest with a focus on:
- Practical real-world application
- Seamless integration without breaking changes  
- Enhanced user experience through AI assistance
- Technical excellence in implementation
- Business value for competitive intelligence

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Built with ❤️ and enhanced with CopilotKit for the Best AI Copilot Contest** 