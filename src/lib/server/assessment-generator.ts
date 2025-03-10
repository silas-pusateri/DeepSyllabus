import OpenAI from 'openai';
import { config } from './config';

// Types of assessments we support
export type AssessmentType = 
    | 'knowledge_check' 
    | 'implementation_challenge' 
    | 'project_based' 
    | 'research_task'
    | 'case_study';

// Structure for multiple choice questions
interface MultipleChoiceQuestion {
    type: 'multiple_choice';
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

// Structure for short answer questions
interface ShortAnswerQuestion {
    type: 'short_answer';
    question: string;
    sampleAnswer: string;
    rubric: string[];
}

// Structure for implementation challenges
interface ImplementationChallenge {
    type: 'implementation';
    title: string;
    description: string;
    requirements: string[];
    starterCode: string;
    testCases: {
        input: string;
        expectedOutput: string;
        explanation: string;
    }[];
    hints: string[];
    solution: string;
}

// Structure for project-based assessments
interface ProjectAssessment {
    type: 'project';
    title: string;
    description: string;
    objectives: string[];
    deliverables: string[];
    evaluationCriteria: string[];
    timeline: string;
    resources: string[];
}

// Structure for research tasks
interface ResearchTask {
    type: 'research';
    topic: string;
    objectives: string[];
    requiredSources: number;
    suggestedAreas: string[];
    deliverables: string[];
    evaluationCriteria: string[];
}

// Structure for case studies
interface CaseStudy {
    type: 'case_study';
    scenario: string;
    background: string;
    questions: {
        question: string;
        points: string[];
        sampleResponse: string;
    }[];
}

// Union type for all assessment content types
type AssessmentContent = 
    | { type: 'knowledge_check', questions: (MultipleChoiceQuestion | ShortAnswerQuestion)[] }
    | { type: 'implementation_challenge', challenge: ImplementationChallenge }
    | { type: 'project_based', project: ProjectAssessment }
    | { type: 'research_task', task: ResearchTask }
    | { type: 'case_study', study: CaseStudy };

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: config.ai.openaiApiKey
});

/**
 * Determine the most appropriate assessment type based on the topic and content
 */
async function determineAssessmentType(
    synopsis: string,
    keyTopics: string[],
    difficulty: string
): Promise<AssessmentType> {
    const systemPrompt = `You are an expert in educational assessment design. Analyze the given course synopsis and key topics to determine the most appropriate type of assessment from these options:
- knowledge_check: Best for theoretical concepts and foundational knowledge
- implementation_challenge: Best for programming and technical skills
- project_based: Best for applied learning and complex skills
- research_task: Best for analytical and research skills
- case_study: Best for problem-solving and real-world application

Consider:
1. The nature of the subject matter
2. The learning objectives
3. The practical applicability
4. The difficulty level`;

    const userPrompt = `Please determine the most appropriate assessment type for:

Synopsis: ${synopsis}
Key Topics: ${keyTopics.join(', ')}
Difficulty: ${difficulty}

Return ONLY ONE of: knowledge_check, implementation_challenge, project_based, research_task, or case_study`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.3
    });

    const assessmentType = response.choices[0]?.message?.content?.trim().toLowerCase() as AssessmentType;
    
    if (!assessmentType || !['knowledge_check', 'implementation_challenge', 'project_based', 'research_task', 'case_study'].includes(assessmentType)) {
        return 'knowledge_check'; // Default to knowledge check if invalid response
    }

    return assessmentType;
}

/**
 * Generate assessment content based on the determined type
 */
async function generateAssessmentContent(
    type: AssessmentType,
    synopsis: string,
    keyTopics: string[],
    difficulty: string
): Promise<AssessmentContent> {
    const systemPrompt = `You are an expert in creating educational assessments. Create a detailed ${type} assessment based on the provided course content.

The assessment should:
1. Match the difficulty level
2. Cover the key topics thoroughly
3. Include clear instructions and criteria
4. Provide comprehensive feedback/solutions
5. Be engaging and practical

Return the assessment in valid JSON format matching the type-specific structure.`;

    const formatInstructions = type === 'knowledge_check' 
        ? `Include a mix of multiple choice and short answer questions. Format:
{
    "type": "knowledge_check",
    "questions": [
        {
            "type": "multiple_choice",
            "question": "...",
            "options": ["...", "...", "...", "..."],
            "correctAnswer": 0,
            "explanation": "..."
        },
        {
            "type": "short_answer",
            "question": "...",
            "sampleAnswer": "...",
            "rubric": ["...", "..."]
        }
    ]
}`
        : type === 'implementation_challenge'
        ? `Create a programming challenge with starter code and test cases. Format:
{
    "type": "implementation_challenge",
    "challenge": {
        "title": "...",
        "description": "...",
        "requirements": ["..."],
        "starterCode": "...",
        "testCases": [
            {
                "input": "...",
                "expectedOutput": "...",
                "explanation": "..."
            }
        ],
        "hints": ["..."],
        "solution": "..."
    }
}`
        : type === 'project_based'
        ? `Create a project-based assessment. Format:
{
    "type": "project_based",
    "project": {
        "title": "...",
        "description": "...",
        "objectives": ["..."],
        "deliverables": ["..."],
        "evaluationCriteria": ["..."],
        "timeline": "...",
        "resources": ["..."]
    }
}`
        : type === 'research_task'
        ? `Create a research-based assessment. Format:
{
    "type": "research_task",
    "task": {
        "topic": "...",
        "objectives": ["..."],
        "requiredSources": 5,
        "suggestedAreas": ["..."],
        "deliverables": ["..."],
        "evaluationCriteria": ["..."]
    }
}`
        : `Create a case study assessment. Format:
{
    "type": "case_study",
    "study": {
        "scenario": "...",
        "background": "...",
        "questions": [
            {
                "question": "...",
                "points": ["..."],
                "sampleResponse": "..."
            }
        ]
    }
}`;

    const userPrompt = `Create a ${difficulty} level assessment for:

Synopsis: ${synopsis}
Key Topics: ${keyTopics.join(', ')}

${formatInstructions}`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
        throw new Error('No content received from OpenAI');
    }

    return JSON.parse(content) as AssessmentContent;
}

/**
 * Generate an appropriate assessment based on the course content
 */
export async function generateAssessment(
    synopsis: string,
    keyTopics: string[],
    difficulty: string,
    forceType?: AssessmentType
): Promise<{
    type: AssessmentType;
    content: AssessmentContent;
}> {
    try {
        // Determine assessment type (unless forced)
        const assessmentType = forceType || await determineAssessmentType(synopsis, keyTopics, difficulty);

        // Generate the assessment content
        const assessmentContent = await generateAssessmentContent(
            assessmentType,
            synopsis,
            keyTopics,
            difficulty
        );

        return {
            type: assessmentType,
            content: assessmentContent
        };
    } catch (error) {
        console.error('Error generating assessment:', error);
        throw new Error('Failed to generate assessment');
    }
} 