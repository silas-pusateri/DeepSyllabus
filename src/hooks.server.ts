import { isDev } from '$lib/server/config';
import fs from 'node:fs';
import path from 'node:path';
import { initDatabase } from '$lib/server/db';

// Initialize local uploads directory if in development
if (isDev()) {
  const uploadDir = path.join(process.cwd(), 'local-uploads');
  if (!fs.existsSync(uploadDir)) {
    console.log(`Creating local uploads directory: ${uploadDir}`);
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

/**
 * Handles local file uploads in development mode
 */
async function handleLocalUploads(reqPath: string) {
  // Only handle paths that start with /local-uploads/
  if (!reqPath.startsWith('/local-uploads/')) {
    return null;
  }
  
  // Extract filename from path
  const filename = reqPath.substring('/local-uploads/'.length);
  
  // Check for file traversal attempts
  if (filename.includes('..')) {
    return new Response('Not Found', { status: 404 });
  }
  
  // Get file path
  const filePath = path.join(process.cwd(), 'local-uploads', filename);
  
  try {
    // Check if file exists
    const fileExists = fs.existsSync(filePath);
    if (!fileExists) {
      return new Response('Not Found', { status: 404 });
    }
    
    // Read file
    const data = fs.readFileSync(filePath);
    
    // Determine content type based on file extension
    const extension = reqPath.split('.').pop() || '';
    const contentType = getContentType(extension);
    
    // Return file contents
    return new Response(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error(`Error serving local file ${filePath}:`, error);
    return new Response('Not Found', { status: 404 });
  }
}

/**
 * Gets content type based on file extension
 */
function getContentType(extension: string): string {
  const contentTypes: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'zip': 'application/zip',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  
  return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
}

export async function handle({ event, resolve }) {
  // Initialize database on first request
  await initDatabase();

  // Handle local uploads in development mode
  if (isDev() && event.url.pathname.startsWith('/local-uploads/')) {
    const response = await handleLocalUploads(event.url.pathname);
    if (response) {
      return response;
    }
  }

  const response = await resolve(event);
  return response;
}