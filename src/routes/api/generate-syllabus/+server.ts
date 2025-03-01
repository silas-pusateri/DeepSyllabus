import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { generateSyllabus } from '$lib/server/ai';
import { createSyllabus, createComponent } from '$lib/server/db';
import type { GenerateSyllabusRequest } from '$lib/types';
import { createPool } from '@vercel/postgres';

const pool = createPool({
  connectionTimeoutMillis: 5000, // Lower timeout to fail fast
  max: 5 // Limit pool size
});

export async function POST({ request }: RequestEvent) {
  try {
    console.time('total-request');
    
    const requestData: GenerateSyllabusRequest = await request.json();
    const { synopsis, files } = requestData;
    
    if (!synopsis) {
      return json({ error: 'Synopsis is required' }, { status: 400 });
    }
    
    let aiResponse;
    try {
      // Generate AI response
      console.time('openai-call');
      aiResponse = await generateSyllabus(requestData);
      console.timeEnd('openai-call');
      
      // Validate AI response structure
      if (!aiResponse || !aiResponse.video || !aiResponse.explanation || !aiResponse.assessment) {
        throw new Error('Invalid AI response structure');
      }
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      return json({ 
        error: aiError instanceof Error ? aiError.message : 'Failed to generate AI content' 
      }, { status: 500 });
    }
    
    try {
      // Create a new syllabus
      console.time('database-call');
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
      console.timeEnd('database-call');
      
      console.timeEnd('total-request');
      
      // Return complete data as JSON
      return json({ syllabus, aiResponse });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return json({ 
        error: dbError instanceof Error ? dbError.message : 'Database operation failed' 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error processing syllabus:', error);
    return json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 });
  }
} 