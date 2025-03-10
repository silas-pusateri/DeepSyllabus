import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSyllabus, createComponent } from '$lib/server/db';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { title, synopsis, content } = await request.json();

        if (!title || !synopsis) {
            return json({ error: 'Title and synopsis are required' }, { status: 400 });
        }

        // Create the syllabus first
        const syllabus = await createSyllabus(title, synopsis);

        // Create components
        const components = await Promise.all([
            // Create explanation component
            createComponent(
                syllabus.id,
                'explanation',
                // Store the raw research content directly
                typeof content.explanation === 'string' 
                    ? content.explanation 
                    : JSON.stringify(content.explanation),
                false
            ),
            // Create assessment component
            createComponent(
                syllabus.id,
                'assessment',
                JSON.stringify(content.assessment),
                false
            )
        ]);

        // Add components to the syllabus object
        syllabus.components = components;

        return json({ syllabus });
    } catch (error) {
        console.error('Error creating syllabus:', error);
        return json({ error: 'Failed to create syllabus' }, { status: 500 });
    }
}; 