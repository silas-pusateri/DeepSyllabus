<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { SyllabusComponent, VideoComponent } from '$lib/types';

  export let component: SyllabusComponent;
  export let syllabusId: string;

  let isRegenerating = false;
  let isEditing = false;
  let feedback = '';
  let error = '';
  let newVideoUrl = '';
  let newVideoTitle = '';

  const dispatch = createEventDispatcher<{
    accepted: { component: SyllabusComponent };
    regenerated: { component: SyllabusComponent, content: any };
    edited: { component: SyllabusComponent };
  }>();

  // Parse the JSON content for display
  let parsedContent: VideoComponent & { videos?: VideoComponent[] } = {
    idea: '',
    link: '',
    videos: []
  };
  
  $: {
    try {
      const content = JSON.parse(component.content);
      // Convert single video to videos array format if needed
      if (content.link) {
        parsedContent = {
          idea: content.idea || '',
          link: '',
          videos: [{
            idea: content.idea || '',
            link: content.link,
            title: content.title || '',
            channel: content.channel || '',
            duration: content.duration || ''
          }]
        };
      } else {
        parsedContent = content;
      }
    } catch (e) {
      console.error('Parse error:', e);
      parsedContent = { idea: '', link: '', videos: [] };
    }
  }

  async function acceptComponent() {
    try {
      const response = await fetch(`/api/component/${component.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accepted: true })
      });
      
      if (!response.ok) {
        throw new Error('Failed to accept component');
      }
      
      const result = await response.json();
      component.accepted = true;
      
      dispatch('accepted', { component });
    } catch (err) {
      console.error('Error accepting component:', err);
      error = err instanceof Error ? err.message : 'Failed to accept component';
    }
  }

  async function regenerateComponent() {
    try {
      isRegenerating = true;
      error = '';
      
      const response = await fetch('/api/regenerate-component', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          syllabusId,
          componentId: component.id,
          feedback
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to regenerate component');
      }
      
      const result = await response.json();
      component = result.component;
      
      dispatch('regenerated', { 
        component: result.component,
        content: result.content
      });
      
      feedback = '';
    } catch (err) {
      console.error('Error regenerating component:', err);
      error = err instanceof Error ? err.message : 'Failed to regenerate component';
    } finally {
      isRegenerating = false;
    }
  }

  async function addVideo() {
    if (!newVideoUrl) return;

    try {
      // Extract video ID from URL
      const videoId = newVideoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
      
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Get video details from YouTube API
      const response = await fetch(`/api/youtube/video-details?id=${videoId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch video details');
      }

      const videoDetails = await response.json();
      
      // Add to videos array
      const updatedContent = {
        ...parsedContent,
        videos: [
          ...(parsedContent.videos || []),
          {
            idea: parsedContent.idea,
            link: newVideoUrl,
            title: videoDetails.title || newVideoTitle || 'Untitled Video',
            channel: videoDetails.channelTitle || '',
            duration: videoDetails.duration || ''
          }
        ]
      };

      // Save to database
      const saveResponse = await fetch(`/api/component/${component.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: JSON.stringify(updatedContent),
          accepted: component.accepted
        })
      });
      
      if (!saveResponse.ok) {
        throw new Error('Failed to save video');
      }
      
      const result = await saveResponse.json();
      component = result.component;
      
      dispatch('edited', { component });
      
      // Clear inputs
      newVideoUrl = '';
      newVideoTitle = '';
      error = '';
    } catch (err) {
      console.error('Error adding video:', err);
      error = err instanceof Error ? err.message : 'Failed to add video';
    }
  }

  async function removeVideo(index: number) {
    try {
      const updatedContent = {
        ...parsedContent,
        videos: parsedContent.videos?.filter((_, i) => i !== index)
      };

      const response = await fetch(`/api/component/${component.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: JSON.stringify(updatedContent),
          accepted: component.accepted
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove video');
      }
      
      const result = await response.json();
      component = result.component;
      
      dispatch('edited', { component });
      error = '';
    } catch (err) {
      console.error('Error removing video:', err);
      error = err instanceof Error ? err.message : 'Failed to remove video';
    }
  }
</script>

<div class="syllabus-component neu-card" class:accepted={component.accepted}>
  <div class="component-header">
    <h3>Video Resources</h3>
    
    <div class="action-buttons">
      {#if !component.accepted}
        <button class="neu-button accept-button" on:click={acceptComponent}>Accept</button>
      {/if}
      <button class="neu-button regenerate-button" on:click={regenerateComponent} disabled={isRegenerating}>
        {isRegenerating ? 'Regenerating...' : 'Regenerate'}
      </button>
    </div>
  </div>
  
  <div class="component-content neu-inset">
    <div class="video-content">
      <h4>Learning Objective</h4>
      <p>{parsedContent.idea || 'No video idea available'}</p>
      
      <div class="video-list">
        <h4>Reference Videos</h4>
        {#if parsedContent.videos && parsedContent.videos.length > 0}
          {#each parsedContent.videos as video, i}
            <div class="video-item neu-inset">
              <div class="video-info">
                <h5>{video.title || 'Untitled Video'}</h5>
                {#if video.channel}
                  <p class="channel">by {video.channel}</p>
                {/if}
                {#if video.duration}
                  <span class="duration">{video.duration}</span>
                {/if}
                <a href={video.link} target="_blank" rel="noopener noreferrer" class="video-link">
                  Watch Video
                </a>
              </div>
              <button class="neu-button remove-button" on:click={() => removeVideo(i)}>
                Remove
              </button>
            </div>
          {/each}
        {:else}
          <p class="no-videos">No videos added yet</p>
        {/if}

        <div class="add-video neu-inset">
          <h5>Add Video</h5>
          <div class="input-group">
            <input
              type="text"
              bind:value={newVideoUrl}
              placeholder="YouTube URL"
              class="neu-input"
            />
            <input
              type="text"
              bind:value={newVideoTitle}
              placeholder="Optional title"
              class="neu-input"
            />
            <button class="neu-button add-button" on:click={addVideo}>
              Add Video
            </button>
          </div>
        </div>
      </div>

      {#if error}
        <div class="error-message neu-inset">
          {error}
        </div>
      {/if}

      {#if !component.accepted}
        <div class="feedback-section">
          <h4>Regeneration Feedback</h4>
          <textarea
            bind:value={feedback}
            placeholder="Enter feedback for regeneration..."
            class="neu-input feedback-input"
            rows="3"
          ></textarea>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .syllabus-component {
    margin-bottom: 2rem;
    padding: 1.5rem;
    border-radius: 8px;
  }

  .accepted {
    border: 2px solid #4CAF50;
  }

  .component-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .component-content {
    padding: 1rem;
    border-radius: 6px;
  }

  .video-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .video-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .video-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-radius: 6px;
  }

  .video-info {
    flex: 1;
  }

  .video-info h5 {
    margin: 0 0 0.5rem 0;
  }

  .channel {
    color: #666;
    font-size: 0.9em;
    margin: 0.25rem 0;
  }

  .duration {
    font-size: 0.8em;
    color: #888;
  }

  .video-link {
    display: inline-block;
    margin-top: 0.5rem;
    color: #2196F3;
    text-decoration: none;
  }

  .video-link:hover {
    text-decoration: underline;
  }

  .add-video {
    padding: 1rem;
    border-radius: 6px;
  }

  .input-group {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .neu-input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9em;
  }

  .feedback-input {
    width: 100%;
    margin-top: 0.5rem;
  }

  .error-message {
    color: #f44336;
    padding: 0.5rem;
    border-radius: 4px;
    margin-top: 0.5rem;
  }

  .no-videos {
    color: #666;
    font-style: italic;
  }

  .remove-button {
    padding: 0.25rem 0.5rem;
    font-size: 0.8em;
    color: #f44336;
    border: 1px solid #f44336;
    background: none;
  }

  .remove-button:hover {
    background: #f443361a;
  }

  .add-button {
    white-space: nowrap;
  }

  .feedback-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
  }
</style> 