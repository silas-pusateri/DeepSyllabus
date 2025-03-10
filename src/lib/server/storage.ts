import { put, del } from '@vercel/blob';
import type { CourseFile } from '$lib/types';
import { addFile } from './db';
import { generateId } from '$lib/utils/helpers';
import { config, isDev } from './config';
import fs from 'node:fs';
import path from 'node:path';

// Local directory for file storage in development mode
const LOCAL_UPLOAD_DIR = 'local-uploads';

/**
 * Ensure the local uploads directory exists
 */
function ensureUploadDirExists() {
  const dir = path.join(process.cwd(), LOCAL_UPLOAD_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created local upload directory: ${dir}`);
  }
}

/**
 * Convert a File object to an ArrayBuffer
 */
async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Upload a file to storage and add it to the database
 */
export async function uploadFile(
  syllabusId: string,
  file: File
): Promise<CourseFile> {
  try {
    // Generate a unique filename
    const id = generateId();
    const filename = `${id}-${file.name}`;
    
    let url: string;
    
    // Determine if we should use local storage or Vercel Blob
    if (isDev()) {
      // Ensure upload directory exists
      ensureUploadDirExists();
      
      // Get file content as buffer
      const buffer = Buffer.from(await fileToArrayBuffer(file));
      
      // Create local filepath
      const filePath = path.join(process.cwd(), LOCAL_UPLOAD_DIR, filename);
      
      // Save file locally
      fs.writeFileSync(filePath, buffer);
      
      // Create a URL that will work in development
      url = `/local-uploads/${filename}`;
      console.log(`File saved locally at ${filePath}, accessible at ${url}`);
    } else {
      // Upload to Vercel Blob in production
      if (!config.storage.blobToken && process.env.NODE_ENV === 'production') {
        throw new Error('Blob storage token not available in production');
      }
      
      const blob = await put(filename, file, {
        access: 'public',
        addRandomSuffix: false
      });
      
      url = blob.url;
      console.log(`File uploaded to Vercel Blob: ${url}`);
    }
    
    // Add the file to the database
    const courseFile = await addFile(
      syllabusId,
      file.name,
      url,
      file.size,
      file.type
    );
    
    return courseFile;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(url: string): Promise<void> {
  try {
    // Handle local files
    if (url.startsWith('/local-uploads/')) {
      const filename = url.split('/').pop();
      if (!filename) {
        throw new Error('Invalid file URL');
      }
      
      const filePath = path.join(process.cwd(), LOCAL_UPLOAD_DIR, filename);
      
      // Check if file exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Local file deleted: ${filePath}`);
      } else {
        console.warn(`File not found for deletion: ${filePath}`);
      }
    } else {
      // Delete from Vercel Blob
      await del(url);
      console.log(`Vercel Blob file deleted: ${url}`);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}