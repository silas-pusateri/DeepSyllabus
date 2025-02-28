import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { updateComponent } from '$lib/server/db';

export async function PUT({ request, params }: RequestEvent) {
  try {
    const id = params.id;
    
    if (!id) {
      return json({ error: 'Component ID is required' }, { status: 400 });
    }
    
    const { content, accepted } = await request.json();
    
    if (typeof content !== 'string') {
      return json({ error: 'Content is required' }, { status: 400 });
    }
    
    if (typeof accepted !== 'boolean') {
      return json({ error: 'Accepted status is required' }, { status: 400 });
    }
    
    // Update the component
    const component = await updateComponent(id, content, accepted);
    
    if (!component) {
      return json({ error: 'Component not found' }, { status: 404 });
    }
    
    return json({ component });
  } catch (error) {
    console.error('Error updating component:', error);
    return json({ error: 'Failed to update component' }, { status: 500 });
  }
} 