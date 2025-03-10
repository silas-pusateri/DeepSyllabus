# DeepSyllabus

DeepSyllabus is an AI-powered application that helps educators generate comprehensive course syllabi with video resources, detailed explanations, and learning assessments using DeepResearch capabilities.

## Features

- **DeepResearch-Powered Syllabi**: Enter a course synopsis and get a thoroughly researched syllabus with video resources, detailed explanations, and learning assessments.
- **File Upload**: Upload existing course materials to enhance the generated syllabus.
- **Component Regeneration**: Not satisfied with a component? Provide feedback and regenerate it with targeted research.
- **Component Editing**: Edit any component to customize it to your needs.
- **Component Acceptance**: Accept components to finalize your syllabus.
- **Syllabus Management**: View and manage all your syllabi in one place.

## Technology Stack

- **Frontend**: Svelte with SvelteKit
- **Backend**: SvelteKit API routes
- **Database**: Vercel Postgres
- **File Storage**: Vercel Blob
- **AI**: DeepResearch MCP (Machine Control Protocol)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Vercel account (for deployment)
- Local MCP server for DeepResearch
- OpenAI API key (fallback)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/deepsyllabus.git
   cd deepsyllabus
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file in the root directory based on the example:
   ```
   # Database connection
   POSTGRES_URL=
   POSTGRES_URL_NON_POOLING=

   # OpenAI API Key (only needed as fallback)
   OPENAI_API_KEY=

   # Blob Storage
   BLOB_READ_WRITE_TOKEN=

   # DeepResearch MCP Configuration
   MCP_ENABLED=true
   MCP_HOST=localhost
   MCP_PORT=8080
   ```

4. For local development without any external services:
   - No configuration is needed! The application will automatically use mock implementations.
   - If you have a local MCP server and want to use it, set `MCP_ENABLED=true` in your `.env` file.

5. Start the development server:
   ```bash
   pnpm dev
   ```

6. Open your browser and navigate to `http://localhost:5173`

### Local Development Mode

DeepSyllabus includes a robust local development environment that works without external services:

- **Local SQLite database** instead of Vercel Postgres
- **Local file storage** in the `local-uploads` directory instead of Vercel Blob
- **Unified MCP architecture** with graceful fallbacks to OpenAI or mock responses

No environment variables are needed for local development. Just start the development server and everything will work out of the box.

#### Mock Mode and Fallbacks

DeepSyllabus uses a unified approach to mocking and fallbacks:

1. **Configurable Mock Mode**:
   - Set `USE_MOCK=true` to use mock implementations for all services
   - Set `MOCK_OPENAI=true` to specifically mock OpenAI calls
   - In development mode, mock mode is enabled by default unless explicitly disabled

2. **Unified MCP Client**:
   - A single `MCPClientFactory` manages all implementations
   - Automatically selects the best available implementation:
     - External MCP server if available and enabled
     - Direct OpenAI integration if MCP server is unavailable but API key exists
     - Mock responses as a last resort

3. **Graceful Fallbacks**:
   - API endpoints handle errors by using fallback responses
   - No request will fail completely if the AI service is unavailable
   - Consistent error handling throughout the application

For production deployments, you'll need to configure:
- `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING` for database connection
- `BLOB_READ_WRITE_TOKEN` for Vercel Blob storage
- `OPENAI_API_KEY` for AI functionality

### DeepResearch MCP Integration

DeepSyllabus now runs its own MCP server as a separate Node.js process, connecting via stdio for improved stability and performance. The MCP server provides advanced research capabilities via the Firecrawl and OpenAI integrations.

#### Setup & Configuration

The MCP server runs automatically as part of the application:

1. The MCP server script is located at `mcp-server.js` in the project root
2. It's started automatically when DeepSyllabus needs its services
3. Configure via environment variables:
   - `MCP_ENABLED=true` to enable MCP (default)
   - `MCP_SCRIPT_PATH=/path/to/mcp-server.js` to customize the script location
   - `OPENAI_API_KEY=your_key` for the OpenAI integration

#### JSON-RPC API

The MCP server provides a JSON-RPC 2.0 API over stdio:

- Available methods:
  - `initialize-research(query, options)`: Start a new research session
  - `execute-research-step(sessionId)`: Execute a step of an ongoing research
  - `generate-report(sessionId, format)`: Generate a report from research findings
  - `complete-research(query, depth, timeout)`: One-shot research operation
  - `ping()`: Test connectivity
  - `shutdown()`: Gracefully shutdown the server

#### Using MCP in DeepSyllabus

The application backend provides a simple API to use MCP capabilities:

```typescript
// Generate a complete syllabus with research
const syllabus = await generateSyllabusWithResearch(synopsis, files);

// Regenerate a specific component with targeted research
const component = await regenerateComponentWithResearch(
  componentType, // 'video', 'explanation', or 'assessment'
  synopsis,
  feedback
);
```

## Deployment

This application is designed to be deployed on Vercel. Follow these steps to deploy:

1. Push your code to a GitHub repository.
2. Connect your repository to Vercel.
3. Set up the environment variables in the Vercel dashboard.
4. Deploy!

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- DeepResearch MCP for providing the advanced AI research capabilities
- Vercel for the hosting and database services
- The Svelte team for the amazing framework

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
