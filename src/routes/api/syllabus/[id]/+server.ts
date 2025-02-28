import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getSyllabus } from '$lib/server/db';

export async function GET({ params }: RequestEvent) {
  try {
    const id = params.id;
    
    if (!id) {
      return json({ error: 'Syllabus ID is required' }, { status: 400 });
    }
    
    // Get the syllabus
    const syllabus = await getSyllabus(id);
    
    if (!syllabus) {
      return json({ error: 'Syllabus not found' }, { status: 404 });
    }
    
    return json({ syllabus });
  } catch (error) {
    console.error('Error retrieving syllabus:', error);
    return json({ error: 'Failed to retrieve syllabus' }, { status: 500 });
  }
} 