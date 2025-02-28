import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { generateSyllabus } from '$lib/server/ai';
import { createSyllabus, createComponent } from '$lib/server/db';
import type { GenerateSyllabusRequest } from '$lib/types';

export async function POST({ request }: RequestEvent) {
  try {
    const requestData: GenerateSyllabusRequest = await request.json();
    const { synopsis, files } = requestData;
    
    if (!synopsis) {
      return json({ error: 'Synopsis is required' }, { status: 400 });
    }
    
    // Generate AI response
    const aiResponse = await generateSyllabus(requestData);
    
    // Create a new syllabus
    const title = synopsis.split('.')[0]; // Use the first sentence as title
    const syllabus = await createSyllabus(title, synopsis);
    
    // Create the components
    const videoComponent = await createComponent(
      syllabus.id,
      'video',
      JSON.stringify(aiResponse.video),
      false
    );
    
    const explanationComponent = await createComponent(
      syllabus.id,
      'explanation',
      JSON.stringify(aiResponse.explanation),
      false
    );
    
    const assessmentComponent = await createComponent(
      syllabus.id,
      'assessment',
      JSON.stringify(aiResponse.assessment),
      false
    );
    
    // Add the components to the syllabus object
    syllabus.components = [videoComponent, explanationComponent, assessmentComponent];
    
    return json({
      syllabus,
      aiResponse
    });
  } catch (error) {
    console.error('Error generating syllabus:', error);
    return json({ error: 'Failed to generate syllabus' }, { status: 500 });
  }
} 