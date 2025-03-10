import { env } from '$env/dynamic/private';
import { createPool } from '@vercel/postgres';
import { join } from 'path';

// Get environment variables with fallbacks
const getEnvBool = (name: string, defaultValue: boolean = false): boolean => {
  const value = env[name];
  return value === undefined ? defaultValue : value.toLowerCase() === 'true';
};

// Function to check if we're in development mode
export const isDev = () => {
  return process.env.NODE_ENV === 'development';
};

// Check if we should use mock implementations (useful for development without external services)
export const shouldUseMock = () => {
  return getEnvBool('USE_MOCK', isDev());
};

// Check if OpenAI mock should be used (separate option for OpenAI)
export const shouldMockOpenAI = () => {
  return getEnvBool('MOCK_OPENAI', shouldUseMock());
};

// Configure connection based on environment
export const config = {
  // Database settings
  database: {
    url: env.POSTGRES_URL || (isDev() ? 'postgresql://postgres:postgres@localhost:5432/deepsyllabus' : undefined),
    urlNonPooling: env.POSTGRES_URL_NON_POOLING
  },
  
  // Storage settings
  storage: {
    // For local dev, store files in the 'local-uploads' directory
    uploadDir: isDev() ? 'local-uploads' : undefined,
    blobToken: env.BLOB_READ_WRITE_TOKEN
  },
  
  // AI settings
  ai: {
    openaiApiKey: env.OPENAI_API_KEY,
    defaultModel: env.DEFAULT_MODEL || 'gpt-3.5-turbo',
    agentModel: env.AGENT_MODEL || 'gpt-4o'
  },
  
  // MCP settings
  mcp: {
    enabled: getEnvBool('MCP_ENABLED', !shouldUseMock()),
    host: env.MCP_HOST || 'localhost',
    port: Number(env.MCP_PORT) || 3000,
    scriptPath: env.MCP_SCRIPT_PATH || join(process.cwd(), 'mcp-server.js'),
    useMock: shouldUseMock()
  },

  // YouTube API settings
  youtube: {
    apiKey: env.YOUTUBE_API_KEY || '',
    maxResults: 3,
    preferredDuration: 'long' // 'any', 'short', 'medium', 'long'
  }
};

// Create a database pool
let pool: any;

export function getPool() {
  if (!pool) {
    try {
      // If no URL is available in production, this will throw
      if (!config.database.url && process.env.NODE_ENV === 'production') {
        throw new Error('Database URL not provided in production environment');
      }
      
      // Create the pool with configuration
      pool = createPool({
        connectionString: config.database.url,
        max: 5,
        connectionTimeoutMillis: 5000
      });
    } catch (error) {
      console.error('Failed to create database pool:', error);
      throw error;
    }
  }
  
  return pool;
}

// Helper function to check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const p = getPool();
    const result = await p.query('SELECT NOW() as time');
    return !!result;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}