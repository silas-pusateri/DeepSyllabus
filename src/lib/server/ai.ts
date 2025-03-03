import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources';
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

1. A video resource suggestion - Include an "idea" for a video and possibly a "link" field if you know one.
2. A detailed written explanation - Provide a "content" field with comprehensive text and a "sections" array of section titles.
3. A measure of learning - Create an assessment with "type" and "content" fields.

Your response must be valid JSON with this structure:
{
  "video": { "idea": "string", "link": "string" },
  "explanation": { "content": "string", "sections": ["string"] },
  "assessment": { "type": "string", "content": "string" }
}

${filesContext}`;

  // Create the user prompt
  const userPrompt = `Please generate a syllabus for the following course synopsis:
${synopsis}

Respond with a properly formatted JSON object containing a video suggestion, a detailed explanation, and a learning assessment.`;

  try {
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    // Always add a specific JSON instruction message to ensure the requirement is met
    messages.push({ role: 'user', content: 'Make sure to format your response as JSON.' });
    
    const response = await openai!.chat.completions.create({
      model: 'gpt-4-turbo',
      messages,
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
  
  const componentFormats = {
    video: `{
  "idea": "A clear description of the video content",
  "link": "Optional URL to a relevant video resource"
}`,
    explanation: `{
  "content": "The main comprehensive explanation text",
  "sections": ["Section 1 title", "Section 2 title", "Section 3 title"]
}`,
    assessment: `{
  "type": "Type of assessment (quiz, test, project, etc.)",
  "content": "The full text content of the assessment"
}`
  };
  
  const componentPrompts = {
    video: 'Generate a video resource suggestion with an idea for a video and an optional link. Return a JSON object with "idea" and "link" fields.',
    explanation: 'Generate a detailed written explanation divided into logical sections. Return a JSON object with "content" (text) and "sections" (array of section titles) fields.',
    assessment: 'Generate a measure of learning such as a quiz, test, or demonstration. Return a JSON object with "type" and "content" fields.'
  };
  
  const systemPrompt = `You are a specialized AI created to help educators generate course syllabus components.
Your task is to generate a ${componentType} component for a course syllabus based on a provided synopsis.
Return your response in JSON format exactly like this example:

${componentFormats[componentType]}

${feedback ? `The user provided this feedback on a previous generation: ${feedback}` : ''}`;

  const userPrompt = `Please generate a ${componentType} component for the following course synopsis:
${synopsis}

${componentPrompts[componentType]}
Format your response as valid JSON.`;

  try {
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    // Always add a specific JSON instruction message to ensure the requirement is met
    messages.push({ role: 'user', content: 'Make sure to format your response as JSON.' });
    
    const response = await openai!.chat.completions.create({
      model: 'gpt-4-turbo',
      messages,
      response_format: { type: 'json_object' }
    });
    
    const content = response.choices[0]?.message?.content || '';
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error regenerating ${componentType}:`, error);
    throw new Error(`Failed to regenerate ${componentType} component`);
  }
} 