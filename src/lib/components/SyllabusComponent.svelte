<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { SyllabusComponent } from '$lib/types';

  export let component: SyllabusComponent;
  export let syllabusId: string;

  let isRegenerating = false;
  let isEditing = false;
  let feedback = '';
  let editedContent = '';
  let error = '';

  const dispatch = createEventDispatcher<{
    accepted: { component: SyllabusComponent };
    regenerated: { component: SyllabusComponent, content: any };
    edited: { component: SyllabusComponent };
  }>();

  // Parse the JSON content for display
  let parsedContent: any = {};
  
  $: {
    try {
      parsedContent = JSON.parse(component.content);
    } catch (e) {
      parsedContent = { content: component.content };
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

  function startEditing() {
    editedContent = component.content;
    isEditing = true;
  }

  async function saveEdit() {
    try {
      const response = await fetch(`/api/component/${component.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: editedContent,
          accepted: component.accepted
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save edits');
      }
      
      const result = await response.json();
      component = result.component;
      
      dispatch('edited', { component });
      isEditing = false;
    } catch (err) {
      console.error('Error saving edits:', err);
      error = err instanceof Error ? err.message : 'Failed to save edits';
    }
  }

  function cancelEdit() {
    isEditing = false;
  }
</script>

<div class="syllabus-component neu-card" class:accepted={component.accepted}>
  <div class="component-header">
    <h3>
      {#if component.type === 'video'}
        Video Resource
      {:else if component.type === 'explanation'}
        Written Explanation
      {:else if component.type === 'assessment'}
        Learning Assessment
      {/if}
    </h3>
    
    <div class="action-buttons">
      {#if !component.accepted}
        <button class="neu-button accept-button" on:click={acceptComponent}>Accept</button>
      {/if}
      <button class="neu-button edit-button" on:click={startEditing}>Edit</button>
    </div>
  </div>
  
  <div class="component-content neu-inset">
    {#if component.type === 'video'}
      <div class="video-content">
        <h4>Video Idea</h4>
        <p>{parsedContent.idea || 'No video idea available'}</p>
        
        {#if parsedContent.link}
          <div class="video-link neu-inset">
            <h4>Reference Video</h4>
            <a href={parsedContent.link} target="_blank" rel="noopener noreferrer">
              {parsedContent.link}
            </a>
          </div>
        {/if}
      </div>
    {:else if component.type === 'explanation'}
      <div class="explanation-content">
        <div class="explanation-text">
          {#if typeof parsedContent.content === 'string'}
            <p>{parsedContent.content}</p>
          {:else}
            <p>No explanation content available</p>
          {/if}
        </div>
        
        {#if parsedContent.sections && parsedContent.sections.length > 0}
          <div class="explanation-sections">
            <h4>Sections</h4>
            <ul>
              {#each parsedContent.sections as section}
                <li>{section}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    {:else if component.type === 'assessment'}
      <div class="assessment-content">
        <h4>Assessment Type: {parsedContent.type || 'Quiz'}</h4>
        
        <div class="assessment-text">
          {#if typeof parsedContent.content === 'string'}
            <p>{parsedContent.content}</p>
          {:else}
            <p>No assessment content available</p>
          {/if}
        </div>
      </div>
    {/if}
  </div>
  
  {#if !component.accepted}
    <div class="regenerate-section">
      <h4>Not satisfied? Provide feedback and regenerate</h4>
      
      <textarea 
        bind:value={feedback}
        placeholder="What would you like to improve about this component? (optional)"
        rows="3"
        class="neu-input"
      ></textarea>
      
      <button 
        class="neu-button primary regenerate-button" 
        on:click={regenerateComponent}
        disabled={isRegenerating}
      >
        {isRegenerating ? 'Regenerating...' : 'Regenerate'}
      </button>
    </div>
  {/if}
  
  {#if isEditing}
    <div class="edit-modal">
      <div class="edit-modal-content neu-card">
        <h3>Edit {component.type} Component</h3>
        
        <textarea 
          bind:value={editedContent}
          rows="10"
          class="neu-input"
        ></textarea>
        
        <div class="edit-buttons">
          <button class="neu-button cancel-button" on:click={cancelEdit}>Cancel</button>
          <button class="neu-button primary save-button" on:click={saveEdit}>Save Changes</button>
        </div>
      </div>
    </div>
  {/if}
  
  {#if error}
    <div class="error-message neu-inset">{error}</div>
  {/if}
</div>

<style>
  .syllabus-component {
    margin-bottom: 3rem;
    transition: all 0.3s ease;
    overflow: hidden;
  }
  
  .syllabus-component.accepted {
    position: relative;
  }
  
  .syllabus-component.accepted::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 6px;
    background: var(--success-color);
    border-radius: var(--border-radius) 0 0 var(--border-radius);
  }
  
  .component-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 0.8rem;
    border-bottom: 1px solid var(--shadow-dark);
  }
  
  h3 {
    font-size: 1.5rem;
    margin: 0;
    color: var(--primary-color);
    font-family: 'Montserrat', sans-serif;
    text-shadow: 1px 1px 1px var(--shadow-light), 
                -1px -1px 1px var(--shadow-dark);
  }
  
  h4 {
    font-size: 1.2rem;
    margin: 1rem 0 0.8rem;
    font-family: 'Montserrat', sans-serif;
    color: var(--primary-dark);
  }
  
  .action-buttons {
    display: flex;
    gap: 1rem;
  }
  
  .accept-button {
    color: var(--success-color);
  }
  
  .edit-button {
    color: var(--primary-color);
  }
  
  .component-content {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }
  
  .video-content, .explanation-content, .assessment-content {
    line-height: 1.6;
  }
  
  .video-link {
    margin-top: 1.5rem;
    padding: 1rem;
  }
  
  .video-link a {
    color: var(--primary-color);
    text-decoration: none;
    word-break: break-all;
    transition: color 0.2s;
  }
  
  .video-link a:hover {
    color: var(--primary-dark);
    text-decoration: underline;
  }
  
  .explanation-sections ul {
    list-style-type: disc;
    padding-left: 1.5rem;
  }
  
  .regenerate-section {
    padding-top: 1rem;
    border-top: 1px solid var(--shadow-dark);
  }
  
  textarea {
    width: 100%;
    margin: 0.8rem 0 1.2rem;
    font-family: inherit;
    resize: vertical;
    color: var(--text-color);
  }
  
  .regenerate-button {
    margin-top: 0.5rem;
  }
  
  .error-message {
    color: var(--danger-color);
    margin-top: 1.5rem;
    padding: 1rem;
  }
  
  .edit-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  
  .edit-modal-content {
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .edit-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  .cancel-button {
    color: var(--text-muted);
  }
  
  .save-button {
    color: #fff;
  }
</style> 