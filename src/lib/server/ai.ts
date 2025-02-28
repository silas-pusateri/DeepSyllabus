import OpenAI from 'openai';
import type { AIResponse, CourseFile, GenerateSyllabusRequest } from '$lib/types';
import { OPENAI_API_KEY } from '$env/static/private';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

/**
 * Generate a syllabus from a synopsis and optional course files
 */
export async function generateSyllabus(request: GenerateSyllabusRequest): Promise<AIResponse> {
  const { synopsis, files } = request;
  
  // Build the prompt including file information if available
  let filesContext = '';
  if (files && files.length > 0) {
    filesContext = `The following materials have been provided as reference:\n${files.map(file => 
      `- ${file.name} (${file.type})`).join('\n')}`;
  }
  
  // Create the system prompt
  const systemPrompt = `You are a specialized AI created to help educators generate comprehensive course syllabi.
Your task is to generate three key components for a course syllabus based on a provided synopsis.
Respond in JSON format with these three components:

1. A video resource suggestion - Include an idea for a video and possibly a link if you know one.
2. A detailed written explanation - Provide comprehensive content divided into logical sections.
3. A measure of learning - Create an assessment like a quiz, test, or demonstration.

${filesContext}`;

  // Create the user prompt
  const userPrompt = `Please generate a syllabus for the following course synopsis:
${synopsis}

Respond with a JSON object containing a video suggestion, a detailed explanation, and a learning assessment.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }
    });
    
    const content = response.choices[0]?.message?.content || '';
    const parsedResponse = JSON.parse(content);
    
    return {
      video: {
        idea: parsedResponse.video?.idea || '',
        link: parsedResponse.video?.link || ''
      },
      explanation: {
        content: parsedResponse.explanation?.content || '',
        sections: parsedResponse.explanation?.sections || []
      },
      assessment: {
        type: parsedResponse.assessment?.type || 'quiz',
        content: parsedResponse.assessment?.content || ''
      }
    };
  } catch (error) {
    console.error('Error generating syllabus:', error);
    throw new Error('Failed to generate syllabus components');
  }
}

/**
 * Regenerate a specific component of the syllabus
 */
export async function regenerateComponent(
  componentType: 'video' | 'explanation' | 'assessment',
  synopsis: string,
  feedback?: string
): Promise<any> {
  const componentPrompts = {
    video: 'Generate a video resource suggestion with an idea and optional link.',
    explanation: 'Generate a detailed written explanation divided into logical sections.',
    assessment: 'Generate a measure of learning such as a quiz, test, or demonstration.'
  };
  
  const systemPrompt = `You are a specialized AI created to help educators generate course syllabus components.
Your task is to generate a ${componentType} component for a course syllabus based on a provided synopsis.
${feedback ? `The user provided this feedback on a previous generation: ${feedback}` : ''}`;

  const userPrompt = `Please generate a ${componentType} component for the following course synopsis:
${synopsis}

${componentPrompts[componentType]}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }
    });
    
    const content = response.choices[0]?.message?.content || '';
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error regenerating ${componentType}:`, error);
    throw new Error(`Failed to regenerate ${componentType} component`);
  }
} 