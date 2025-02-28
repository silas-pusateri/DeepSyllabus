import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { initDatabase } from '$lib/server/db';

export async function POST({ request }: RequestEvent) {
  try {
    await initDatabase();
    return json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Error initializing database:', error);
    return json({ error: 'Failed to initialize database' }, { status: 500 });
  }
} 