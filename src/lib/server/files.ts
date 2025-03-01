import { put, del } from '@vercel/blob';
import type { CourseFile } from '$lib/types';
import { addFile } from './db';
import { generateId } from '$lib/utils/helpers';
import { env } from '$env/dynamic/private';

// Check if we're in development mode without database credentials
const isDevelopmentMode = !env.POSTGRES_URL && process.env.NODE_ENV !== 'production';

/**
 * Upload a file to Vercel Blob storage and add it to the database
 */
export async function uploadFile(
  syllabusId: string,
  file: File
): Promise<CourseFile> {
  try {
    // Generate a unique filename
    const id = generateId();
    const filename = `${id}-${file.name}`;
    
    // In development mode, create a mock URL
    if (isDevelopmentMode) {
      const mockUrl = `/mock-uploads/${filename}`;
      
      // Add the file to the database
      const courseFile = await addFile(
        syllabusId,
        file.name,
        mockUrl,
        file.size,
        file.type
      );
      
      return courseFile;
    }
    
    // Upload the file to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false
    });
    
    // Add the file to the database
    const courseFile = await addFile(
      syllabusId,
      file.name,
      blob.url,
      file.size,
      file.type
    );
    
    return courseFile;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Delete a file from Vercel Blob storage
 */
export async function deleteFile(url: string): Promise<void> {
  try {
    // Skip actual deletion in development mode
    if (isDevelopmentMode) {
      console.log(`[DEV] Would delete file: ${url}`);
      return;
    }
    
    await del(url);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
} 