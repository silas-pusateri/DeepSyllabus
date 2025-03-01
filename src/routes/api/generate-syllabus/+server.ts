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
  // Initialize response
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  
  // Start processing in the background
  console.time('total-request');
  console.time('openai-call');
  processSyllabus(request, writer).catch(error => {
    console.error('Error processing syllabus:', error);
  });
  console.timeEnd('openai-call');
  console.time('database-call');
  await writer.close();
  console.timeEnd('database-call');
  console.timeEnd('total-request');
  
  // Return the stream immediately
  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

async function processSyllabus(request, writer) {
  try {
    const requestData: GenerateSyllabusRequest = await request.json();
    const { synopsis, files } = requestData;
    
    if (!synopsis) {
      await writer.write(new TextEncoder().encode(JSON.stringify({ status: 'error', message: 'Synopsis is required' }) + '\n\n'));
      return;
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
    
    await writer.write(new TextEncoder().encode(JSON.stringify({ status: 'processing' }) + '\n\n'));
    
    await writer.write(new TextEncoder().encode(JSON.stringify({ status: 'complete', data: { syllabus, aiResponse } }) + '\n\n'));
  } catch (error) {
    await writer.write(new TextEncoder().encode(JSON.stringify({ status: 'error', message: error.message }) + '\n\n'));
  } finally {
    await writer.close();
  }
} 