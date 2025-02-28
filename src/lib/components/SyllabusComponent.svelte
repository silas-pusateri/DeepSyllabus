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

<div class="syllabus-component" class:accepted={component.accepted}>
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
        <button class="accept-button" on:click={acceptComponent}>Accept</button>
      {/if}
      <button class="edit-button" on:click={startEditing}>Edit</button>
    </div>
  </div>
  
  <div class="component-content">
    {#if component.type === 'video'}
      <div class="video-content">
        <h4>Video Idea</h4>
        <p>{parsedContent.idea || 'No video idea available'}</p>
        
        {#if parsedContent.link}
          <div class="video-link">
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
      ></textarea>
      
      <button 
        class="regenerate-button" 
        on:click={regenerateComponent}
        disabled={isRegenerating}
      >
        {isRegenerating ? 'Regenerating...' : 'Regenerate'}
      </button>
    </div>
  {/if}
  
  {#if isEditing}
    <div class="edit-modal">
      <div class="edit-modal-content">
        <h3>Edit {component.type} Component</h3>
        
        <textarea 
          bind:value={editedContent}
          rows="10"
        ></textarea>
        
        <div class="edit-buttons">
          <button class="cancel-button" on:click={cancelEdit}>Cancel</button>
          <button class="save-button" on:click={saveEdit}>Save Changes</button>
        </div>
      </div>
    </div>
  {/if}
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
</div>

<style>
  .syllabus-component {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    transition: all 0.3s ease;
  }
  
  .syllabus-component.accepted {
    border-left: 4px solid #28a745;
  }
  
  .component-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #eee;
  }
  
  h3 {
    font-size: 1.5rem;
    margin: 0;
  }
  
  h4 {
    font-size: 1.2rem;
    margin: 1rem 0 0.5rem;
  }
  
  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }
  
  button {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .accept-button {
    background-color: #28a745;
    color: white;
    border: none;
  }
  
  .accept-button:hover {
    background-color: #218838;
  }
  
  .edit-button {
    background-color: #6c757d;
    color: white;
    border: none;
  }
  
  .edit-button:hover {
    background-color: #5a6268;
  }
  
  .component-content {
    margin-bottom: 1.5rem;
  }
  
  .video-content, .explanation-content, .assessment-content {
    line-height: 1.6;
  }
  
  .video-link {
    margin-top: 1rem;
  }
  
  .video-link a {
    color: #0066cc;
    text-decoration: none;
    word-break: break-all;
  }
  
  .video-link a:hover {
    text-decoration: underline;
  }
  
  .explanation-sections ul {
    list-style-type: disc;
    padding-left: 1.5rem;
  }
  
  .regenerate-section {
    border-top: 1px solid #eee;
    padding-top: 1rem;
  }
  
  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin: 0.5rem 0 1rem;
    font-family: inherit;
    resize: vertical;
  }
  
  .regenerate-button {
    background-color: #0066cc;
    color: white;
    border: none;
  }
  
  .regenerate-button:hover:not(:disabled) {
    background-color: #0056b3;
  }
  
  .regenerate-button:disabled {
    background-color: #66a3e0;
    cursor: not-allowed;
  }
  
  .error-message {
    color: #dc3545;
    margin-top: 1rem;
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
  }
  
  .edit-modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    width: 80%;
    max-width: 800px;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .edit-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .cancel-button {
    background-color: #6c757d;
    color: white;
    border: none;
  }
  
  .save-button {
    background-color: #28a745;
    color: white;
    border: none;
  }
</style> 