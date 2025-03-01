import OpenAI from 'openai';
import type { AIResponse, CourseFile, GenerateSyllabusRequest } from '$lib/types';
import { env } from '$env/dynamic/private';

// Check if we're in development mode
const isDevelopmentMode = !env.OPENAI_API_KEY || process.env.NODE_ENV === 'development';

let openai: OpenAI | null = null;

// Initialize OpenAI client if API key is available
if (!isDevelopmentMode) {
  openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY
  });
}

// Mock responses for development mode
const mockVideoResponse = {
  idea: "A comprehensive video explaining the key concepts of the course topic with visual aids and examples",
  link: "https://www.youtube.com/watch?v=example"
};

const mockExplanationResponse = {
  content: "This is a comprehensive explanation of the course topic. It covers all the necessary concepts and provides detailed information for students to understand the subject matter.",
  sections: ["Introduction to the Topic", "Key Concepts", "Practical Applications", "Advanced Techniques", "Summary and Next Steps"]
};

const mockAssessmentResponse = {
  type: "quiz",
  content: "1. What is the main concept covered in this course?\n2. Explain the relationship between the key topics.\n3. Apply the concepts to solve the following problem..."
};

/**
 * Generate a syllabus from a synopsis and optional course files
 */
export async function generateSyllabus(request: GenerateSyllabusRequest): Promise<AIResponse> {
  const { synopsis, files } = request;
  
  // Return mock data in development mode
  if (isDevelopmentMode) {
    console.log('[DEV] Using mock AI response for syllabus generation');
    return {
      video: mockVideoResponse,
      explanation: mockExplanationResponse,
      assessment: mockAssessmentResponse
    };
  }
  
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
    const response = await openai!.chat.completions.create({
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
  // Return mock data in development mode
  if (isDevelopmentMode) {
    console.log(`[DEV] Using mock AI response for ${componentType} regeneration`);
    
    if (componentType === 'video') {
      return mockVideoResponse;
    } else if (componentType === 'explanation') {
      return mockExplanationResponse;
    } else {
      return mockAssessmentResponse;
    }
  }
  
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
    const response = await openai!.chat.completions.create({
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