import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { runDeepResearch } from '$lib/server/deepResearchClient';
import { parseResearchContent } from '$lib/server/research-parser';
import { getSyllabus, updateComponent } from '$lib/server/db';
import { searchEducationalVideos } from '$lib/server/youtube-service';
import type { RegenerateComponentRequest } from '$lib/types';

export async function POST({ request }: RequestEvent) {
  try {
    console.time('regenerate-component-total');
    const { syllabusId, componentId, feedback }: RegenerateComponentRequest = await request.json();
    
    if (!syllabusId || !componentId) {
      return json({ error: 'Syllabus ID and component ID are required' }, { status: 400 });
    }
    
    // Get the syllabus
    const syllabus = await getSyllabus(syllabusId);
    
    if (!syllabus) {
      return json({ error: 'Syllabus not found' }, { status: 404 });
    }
    
    // Find the component
    const component = syllabus.components.find(c => c.id === componentId);
    
    if (!component) {
      return json({ error: 'Component not found' }, { status: 404 });
    }
    
    console.log(`Regenerating ${component.type} component with Deep Research for syllabus "${syllabus.title}" with feedback: "${feedback?.substring(0, 100) || 'none'}..."`);
    
    // Define fallback responses for each component type
    const fallbackResponses = {
      video: {
        idea: "A comprehensive video explaining key concepts with visual examples",
        link: ""
      },
      explanation: {
        content: "Detailed explanation covering fundamental concepts and practical applications",
        sections: ["Introduction", "Key Concepts", "Practical Applications", "Conclusion"]
      },
      assessment: {
        type: "knowledge_check",
        questions: [
          {
            type: "multiple_choice",
            question: "What are the key concepts covered in this section?",
            options: [
              "Option A",
              "Option B",
              "Option C",
              "Option D"
            ],
            correctAnswer: 0,
            explanation: "This is a placeholder question to test understanding of key concepts."
          },
          {
            type: "short_answer",
            question: "How would these concepts be applied in practice?",
            sampleAnswer: "This is a placeholder for a sample answer.",
            rubric: ["Understanding of concepts", "Application clarity", "Practical relevance"]
          }
        ]
      }
    };

    let regeneratedContent;
    try {
      // Build query based on component type and feedback
      let query = `Generate a ${component.type} component for a course syllabus with this synopsis: ${syllabus.synopsis}`;
      if (feedback) {
        query += `\nIncorporate this feedback: ${feedback}`;
      }

      // Run deep research with moderate depth since this is a component regeneration
      console.time('deep-research');
      const rawReport = await runDeepResearch(query, 2);
      console.timeEnd('deep-research');
      console.log(`Received raw research of length: ${rawReport.length} characters`);

      // Parse the research content
      console.time('parse-research');
      const parsedContent = await parseResearchContent(rawReport);
      console.timeEnd('parse-research');

      // Extract relevant content based on component type
      if (component.type === 'video') {
        // Generate video idea from research
        const videoIdea = `A video explaining ${parsedContent.keyTopics.join(', ')}`;
        
        // Search for relevant videos
        console.time('youtube-search');
        const searchQuery = `${parsedContent.keyTopics.slice(0, 3).join(' ')} ${parsedContent.difficulty} ${parsedContent.prerequisites[0] || ''}`.trim();
        const videos = await searchEducationalVideos(searchQuery);
        console.timeEnd('youtube-search');

        if (videos.length > 0) {
          // Use the most relevant video
          const bestVideo = videos[0];
          regeneratedContent = {
            idea: videoIdea,
            link: bestVideo.url,
            title: bestVideo.title,
            channel: bestVideo.channelTitle,
            duration: bestVideo.duration
          };
        } else {
          // Fallback to just the idea if no videos found
          regeneratedContent = {
            idea: videoIdea,
            link: ""
          };
        }
      } else if (component.type === 'explanation') {
        regeneratedContent = {
          content: parsedContent.explanation.content,
          sections: parsedContent.explanation.sections
        };
      } else {
        regeneratedContent = {
          type: parsedContent.difficulty === 'advanced' ? 'project' : 'knowledge_check',
          content: `Assessment covering key topics: ${parsedContent.keyTopics.join(', ')}\n\nPrerequisites: ${parsedContent.prerequisites.join(', ')}\n\n${parsedContent.explanation.content}`
        };
      }
      
      console.log('Successfully generated new content');
    } catch (regenerateError) {
      console.error('Error regenerating component:', regenerateError);
      
      // Use fallback response based on component type
      regeneratedContent = fallbackResponses[component.type];
      console.log(`Using fallback response for ${component.type} component`);
    }
    
    // Update the component in the database
    const updatedComponent = await updateComponent(
      componentId,
      JSON.stringify(regeneratedContent),
      false
    );
    
    if (!updatedComponent) {
      return json({ error: 'Failed to update component' }, { status: 500 });
    }
    
    console.timeEnd('regenerate-component-total');
    
    return json({
      component: updatedComponent,
      content: regeneratedContent
    });
  } catch (error) {
    console.error('Error regenerating component:', error);
    return json({ 
      error: error instanceof Error ? error.message : 'Failed to regenerate component' 
    }, { status: 500 });
  }
} 