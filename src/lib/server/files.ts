import { put, del } from '@vercel/blob';
import type { CourseFile } from '$lib/types';
import { addFile } from './db';
import { generateId } from '$lib/utils/helpers';

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
    await del(url);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
} 