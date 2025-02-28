import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getAllSyllabi } from '$lib/server/db';

export async function GET({}: RequestEvent) {
  try {
    // Get all syllabi
    const syllabi = await getAllSyllabi();
    
    return json({ syllabi });
  } catch (error) {
    console.error('Error retrieving syllabi:', error);
    return json({ error: 'Failed to retrieve syllabi' }, { status: 500 });
  }
} 