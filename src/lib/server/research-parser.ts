import OpenAI from 'openai';
import { config } from './config';

// Define the structure of our parsed content
interface ParsedResearch {
    explanation: {
        content: string;
        sections: string[];
    };
    keyTopics: string[];
    prerequisites: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: config.ai.openaiApiKey
});

/**
 * Parse raw research content into structured components using GPT-4
 */
export async function parseResearchContent(rawContent: string): Promise<ParsedResearch> {
    console.log(`Parsing research content of length: ${rawContent.length} characters`);

    // If content is too long, truncate it to a reasonable size while keeping structure
    const maxLength = 32000; // GPT-4's approximate limit
    let processedContent = rawContent;
    
    if (rawContent.length > maxLength) {
        console.log(`Content exceeds maximum length, truncating from ${rawContent.length} to ${maxLength} characters`);
        
        // Split into paragraphs and select key ones to maintain coherence
        const paragraphs = rawContent.split('\n\n');
        let truncated = '';
        let currentLength = 0;
        
        // Always include the first paragraph (usually contains important context)
        truncated += paragraphs[0] + '\n\n';
        currentLength += paragraphs[0].length + 2;
        
        // Add paragraphs until we approach the limit
        for (let i = 1; i < paragraphs.length && currentLength < maxLength - 1000; i++) {
            // Skip very short paragraphs (likely not substantial content)
            if (paragraphs[i].length < 50) continue;
            
            truncated += paragraphs[i] + '\n\n';
            currentLength += paragraphs[i].length + 2;
        }
        
        processedContent = truncated.trim();
        console.log(`Truncated content length: ${processedContent.length} characters`);
    }

    const systemPrompt = `You are an expert educational content analyzer. Your task is to analyze raw research content and structure it into a comprehensive learning format.

Parse the content and return a JSON object with the following structure:
{
    "explanation": {
        "content": "A clear, well-organized explanation of the main content",
        "sections": ["Array of 3-7 logical section titles that break down the content"]
    },
    "keyTopics": ["Array of 4-8 key topics covered"],
    "prerequisites": ["Array of any prerequisite knowledge or skills needed"],
    "difficulty": "One of: beginner, intermediate, or advanced"
}

Guidelines:
1. The explanation content should be comprehensive but concise
2. Section titles should follow a logical progression
3. Key topics should be specific and actionable
4. Prerequisites should be realistic and relevant
5. Difficulty should be based on content complexity and prerequisites

If the content is truncated or partial, focus on extracting the most important concepts and maintaining coherence.`;

    const userPrompt = `Please analyze and structure the following research content into a learning format:

${processedContent}

Return the analysis in the specified JSON format.`;

    try {
        console.log('Sending content to OpenAI for analysis...');
        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            console.error('No content received from OpenAI');
            throw new Error('No content received from OpenAI');
        }

        console.log('Successfully received OpenAI response, parsing JSON...');
        const parsedContent = JSON.parse(content) as ParsedResearch;

        // Validate the parsed content
        if (!parsedContent.explanation?.content || 
            !Array.isArray(parsedContent.explanation.sections) ||
            !Array.isArray(parsedContent.keyTopics) ||
            !Array.isArray(parsedContent.prerequisites) ||
            !['beginner', 'intermediate', 'advanced'].includes(parsedContent.difficulty)) {
            console.error('Invalid response structure:', parsedContent);
            throw new Error('Invalid response format from OpenAI');
        }

        console.log('Successfully parsed and validated research content');
        return parsedContent;
    } catch (error) {
        console.error('Error in parseResearchContent:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to parse research content: ${error.message}`);
        }
        throw new Error('Failed to parse research content');
    }
} 