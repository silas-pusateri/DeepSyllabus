import { json } from '@sveltejs/kit';
import { runDeepResearch } from '$lib/server/deepResearchClient';
import { parseResearchContent } from '$lib/server/research-parser';
import { generateAssessment } from '$lib/server/assessment-generator';
import { createSyllabus, createComponent } from '$lib/server/db';
import type { RequestHandler } from './$types';
import type { AssessmentType } from '$lib/server/assessment-generator';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { synopsis, depth = 3, assessmentType, title } = await request.json();

        if (!synopsis) {
            return json(
                { error: 'Synopsis is required' },
                { status: 400 }
            );
        }

        try {
            // 1. Create syllabus first
            const syllabus = await createSyllabus(title || 'New Syllabus', synopsis);

            // 2. Get raw research content from MCP
            console.log('Starting deep research...');
            const rawReport = await runDeepResearch(synopsis, depth);
            console.log(`Received raw research of length: ${rawReport.length} characters`);

            // 3. Parse the raw content into structured format
            console.log('Parsing research content...');
            const structuredContent = await parseResearchContent(rawReport);
            console.log('Successfully parsed research content');

            // 4. Generate appropriate assessment
            console.log('Generating assessment...');
            const assessment = await generateAssessment(
                synopsis,
                structuredContent.keyTopics,
                structuredContent.difficulty,
                assessmentType as AssessmentType | undefined
            );
            console.log('Successfully generated assessment');

            // 5. Create components
            // Create explanation component
            await createComponent(
                syllabus.id,
                'explanation',
                JSON.stringify(structuredContent),
                false
            );

            // Create assessment component
            await createComponent(
                syllabus.id,
                'assessment',
                JSON.stringify(assessment),
                false
            );

            // Create video component with initial empty state
            await createComponent(
                syllabus.id,
                'video',
                JSON.stringify({
                    learningObjective: 'Enhance understanding through curated video resources',
                    videos: []
                }),
                false
            );

            // 6. Return complete content and syllabus ID
            return json({
                success: true,
                syllabusId: syllabus.id,
                structured: structuredContent,
                assessment
            }, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json'
                }
            });

        } catch (processingError) {
            console.error('Error processing syllabus:', processingError);
            
            // Return specific error based on where it failed
            if (processingError instanceof Error) {
                const errorMessage = processingError.message;
                if (errorMessage.includes('research')) {
                    return json({ 
                        success: false, 
                        error: 'Failed to complete research. Please try again.' 
                    }, { status: 500 });
                }
                if (errorMessage.includes('parse')) {
                    return json({ 
                        success: false, 
                        error: 'Failed to process research results. Please try again.' 
                    }, { status: 500 });
                }
                if (errorMessage.includes('assessment')) {
                    return json({ 
                        success: false, 
                        error: 'Failed to generate assessment. Please try again.' 
                    }, { status: 500 });
                }
            }
            
            throw processingError; // Re-throw unexpected errors
        }

    } catch (error) {
        console.error('Unexpected error generating syllabus:', error);
        
        return json(
            { 
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred'
            },
            { status: 500 }
        );
    }
}; 