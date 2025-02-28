import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { uploadFile } from '$lib/server/files';

export async function POST({ request }: RequestEvent) {
  try {
    const formData = await request.formData();
    const syllabusId = formData.get('syllabusId') as string;
    const file = formData.get('file') as File;
    
    if (!syllabusId) {
      return json({ error: 'Syllabus ID is required' }, { status: 400 });
    }
    
    if (!file || !(file instanceof File)) {
      return json({ error: 'File is required' }, { status: 400 });
    }
    
    // Upload the file
    const uploadedFile = await uploadFile(syllabusId, file);
    
    return json({ file: uploadedFile });
  } catch (error) {
    console.error('Error uploading file:', error);
    return json({ error: 'Failed to upload file' }, { status: 500 });
  }
} 