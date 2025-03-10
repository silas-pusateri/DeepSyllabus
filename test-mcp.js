#!/usr/bin/env node

/**
 * DeepSyllabus MCP Server Test
 * 
 * This script tests the MCP server by sending commands via stdio
 * to ensure it's working correctly.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the MCP server script
const mcpServerPath = path.join(__dirname, 'mcp-server.js');

// Start the MCP server process
console.log(`Starting MCP server at ${mcpServerPath}...`);
const mcpProcess = spawn('node', [mcpServerPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Set up event listeners
mcpProcess.stdout.on('data', (data) => {
  const message = data.toString();
  console.log(`[MCP stdout]: ${message}`);
  
  try {
    // Try to parse as JSON if possible
    const json = JSON.parse(message);
    console.log('[Parsed JSON]:', JSON.stringify(json, null, 2));
  } catch (e) {
    // Not JSON, that's fine
  }
});

mcpProcess.stderr.on('data', (data) => {
  console.log(`[MCP stderr]: ${data}`);
});

mcpProcess.on('close', (code) => {
  console.log(`MCP server process exited with code ${code}`);
});

// Send a command to the server
function sendCommand(method, params = {}) {
  const message = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params
  };
  
  console.log(`\n[Sending]: ${method}`, params);
  mcpProcess.stdin.write(JSON.stringify(message) + '\n');
}

// Run a series of test commands
setTimeout(() => sendCommand('ping'), 1000);

setTimeout(() => {
  sendCommand('initialize-research', {
    query: 'What are the key concepts in machine learning?'
  });
}, 2000);

setTimeout(() => {
  sendCommand('complete-research', {
    query: 'Generate a syllabus for an introductory Python course',
    depth: 2,
    timeout: 5000
  });
}, 3000);

// Shutdown the server after all tests
setTimeout(() => {
  sendCommand('shutdown');
  console.log('Tests complete, shutting down MCP server');
}, 10000);