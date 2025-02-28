import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { updateComponent } from '$lib/server/db';

export async function POST({ request, params }: RequestEvent) {
  try {
    const id = params.id;
    
    if (!id) {
      return json({ error: 'Component ID is required' }, { status: 400 });
    }
    
    const { accepted } = await request.json();
    
    if (typeof accepted !== 'boolean') {
      return json({ error: 'Accepted status is required' }, { status: 400 });
    }
    
    // Get the current component content (we don't want to change it)
    const component = await updateComponent(id, "", accepted);
    
    if (!component) {
      return json({ error: 'Component not found' }, { status: 404 });
    }
    
    return json({ component });
  } catch (error) {
    console.error('Error accepting component:', error);
    return json({ error: 'Failed to accept component' }, { status: 500 });
  }
} 