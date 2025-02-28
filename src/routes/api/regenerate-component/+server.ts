import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { regenerateComponent } from '$lib/server/ai';
import { getSyllabus, updateComponent } from '$lib/server/db';
import type { RegenerateComponentRequest } from '$lib/types';

export async function POST({ request }: RequestEvent) {
  try {
    const { syllabusId, componentId, feedback }: RegenerateComponentRequest = await request.json();
    
    if (!syllabusId || !componentId) {
      return json({ error: 'Syllabus ID and component ID are required' }, { status: 400 });
    }
    
    // Get the syllabus
    const syllabus = await getSyllabus(syllabusId);
    
    if (!syllabus) {
      return json({ error: 'Syllabus not found' }, { status: 404 });
    }
    
    // Find the component
    const component = syllabus.components.find(c => c.id === componentId);
    
    if (!component) {
      return json({ error: 'Component not found' }, { status: 404 });
    }
    
    // Regenerate the component
    const regeneratedContent = await regenerateComponent(
      component.type,
      syllabus.synopsis,
      feedback
    );
    
    // Update the component in the database
    const updatedComponent = await updateComponent(
      componentId,
      JSON.stringify(regeneratedContent),
      false
    );
    
    if (!updatedComponent) {
      return json({ error: 'Failed to update component' }, { status: 500 });
    }
    
    return json({
      component: updatedComponent,
      content: regeneratedContent
    });
  } catch (error) {
    console.error('Error regenerating component:', error);
    return json({ error: 'Failed to regenerate component' }, { status: 500 });
  }
} 