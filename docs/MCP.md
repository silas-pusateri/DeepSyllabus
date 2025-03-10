# Machine Control Protocol (MCP) Integration

## Overview

The Machine Control Protocol (MCP) integration in DeepSyllabus provides advanced research capabilities for generating comprehensive educational content. This document explains the architecture, components, and how to use MCP in the application.

## Architecture

DeepSyllabus uses a unified MCP architecture with multiple implementation options:

1. **External MCP Server** - A separate Node.js process that provides research capabilities via JSON-RPC
2. **Integrated OpenAI Client** - Direct OpenAI API integration as a fallback when the MCP server is unavailable
3. **Mock Implementation** - Pure mock responses for development and testing

The system automatically selects the best available implementation based on the environment and configuration.

## Components

### MCPClientFactory

The `MCPClientFactory` is the central point for obtaining MCP clients. It maintains a singleton instance and handles the selection of the appropriate implementation:

```typescript
// Get an MCP client instance
const client = await MCPClientFactory.getClient();
```

### IMCPClient Interface

All MCP client implementations follow the `IMCPClient` interface:

```typescript
interface IMCPClient {
  call(method: string, params?: any): Promise<any>;
  close(): void;
}
```

### RealMCPClient

This implementation spawns and communicates with an external MCP server via stdio. It handles:

- Starting the MCP server process
- Managing JSON-RPC communication
- Handling timeouts and errors
- Graceful shutdown

### OpenAIMCPClient

This implementation uses the OpenAI API directly to provide similar functionality to the MCP server. It's used as a fallback when the MCP server is unavailable but an OpenAI API key is present.

## Configuration

Configure MCP behavior using environment variables:

```
# Mock mode configuration
USE_MOCK=false  # Set to true to use mock implementations instead of real services
MOCK_OPENAI=false  # Set to true to use mock OpenAI responses (defaults to USE_MOCK value)

# MCP Configuration
MCP_ENABLED=true  # Set to false to disable MCP completely
MCP_SCRIPT_PATH=./mcp-server.js  # Path to the MCP server script
OPENAI_API_KEY=your_api_key  # OpenAI API key for all AI operations
```

## JSON-RPC API

The MCP server provides a JSON-RPC 2.0 API over stdio:

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `initialize-research` | `{ query: string, options?: object }` | Start a new research session |
| `execute-research-step` | `{ sessionId: string }` | Execute a step of an ongoing research |
| `generate-report` | `{ sessionId: string, format?: string }` | Generate a report from research findings |
| `complete-research` | `{ query: string, depth?: number, timeout?: number }` | One-shot research operation |
| `ping` | `{}` | Test connectivity |
| `shutdown` | `{}` | Gracefully shutdown the server |

### Response Format

Each method returns a response object. For research methods, the response typically includes:

```json
{
  "sessionId": "session-123456",
  "status": "completed",
  "findings": {
    "topicName": "Topic Title",
    "videoIdea": "Video description",
    "videoLink": "https://example.com/video",
    "mainContent": "Main course content text...",
    "sections": ["Section 1", "Section 2", "..."],
    "assessmentType": "quiz",
    "assessmentContent": "Assessment content..."
  }
}
```

## High-Level API

The application provides high-level functions in `mcp.ts` that abstract the MCP communication:

```typescript
// Generate a complete syllabus
const syllabus = await generateSyllabusWithResearch(synopsis, files);

// Regenerate a specific component with targeted research
const component = await regenerateComponentWithResearch(
  componentType, // 'video', 'explanation', or 'assessment'
  synopsis,
  feedback
);
```

## Error Handling

The MCP integration includes comprehensive error handling:

1. **Client-level fallbacks** - If the external MCP server fails, it automatically falls back to the OpenAI client
2. **Method-level fallbacks** - Individual method calls include error handling and fallbacks
3. **API-level fallbacks** - API endpoints handle errors and provide fallback responses to ensure the application never fails catastrophically

## Developing with MCP

For local development:

1. No environment variables are needed - everything works out of the box
2. By default, mock mode is enabled in development
3. To use a real MCP server, set `USE_MOCK=false` in your `.env` file
4. For direct OpenAI integration, set `MCP_ENABLED=false` and provide an `OPENAI_API_KEY`

## Best Practices

1. **Always use MCPClientFactory** - Never instantiate client implementations directly
2. **Handle errors gracefully** - Provide fallback behavior in case of MCP failures
3. **Test all implementations** - Ensure your code works with all MCP implementations
4. **Optimize queries** - Keep research queries focused and concise for best results