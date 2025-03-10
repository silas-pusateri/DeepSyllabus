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
    if (component.type === 'explanation') {
      try {
        // For explanation, try to parse JSON but fall back to raw content
        parsedContent = JSON.parse(component.content);
      } catch (e) {
        parsedContent = component.content;
      }
    } else {
      try {
        parsedContent = JSON.parse(component.content);
      } catch (e) {
        console.error('Parse error:', e);
        parsedContent = null;
      }
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
        {#if parsedContent}
          <div class="content-text">
            <p>{parsedContent.content}</p>
          </div>
          {#if parsedContent.sections}
            <div class="sections">
              <h4>Outline</h4>
              <ul>
                {#each parsedContent.sections as section}
                  <li>{section}</li>
                {/each}
              </ul>
            </div>
          {/if}
        {:else}
          <p>No explanation content available</p>
        {/if}
      </div>
    {:else if component.type === 'assessment'}
      <div class="assessment-content">
        {#if parsedContent}
          <div class="assessment-sections">
            {#if parsedContent.content?.type === 'knowledge_check' && parsedContent.content?.questions}
              <div class="section">
                <h4>Knowledge Check</h4>
                <div class="questions">
                  {#each parsedContent.content.questions as question, i}
                    <div class="question neu-inset">
                      <p class="question-text">Q{i + 1}: {question.question}</p>
                      {#if question.type === 'multiple_choice' && question.options}
                        <ul class="options">
                          {#each question.options as option, j}
                            <li class="option">
                              <span class="option-letter">{String.fromCharCode(97 + j)})</span> {option}
                            </li>
                          {/each}
                        </ul>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {:else if parsedContent.content?.type === 'implementation_challenge' && parsedContent.content?.challenge}
              <div class="section">
                <h4>Implementation Challenge</h4>
                <div class="challenge neu-inset">
                  <h5>{parsedContent.content.challenge.title}</h5>
                  <p class="description">{parsedContent.content.challenge.description}</p>
                  {#if parsedContent.content.challenge.requirements}
                    <div class="requirements">
                      <h6>Requirements:</h6>
                      <ul>
                        {#each parsedContent.content.challenge.requirements as req}
                          <li>{req}</li>
                        {/each}
                      </ul>
                    </div>
                  {/if}
                  {#if parsedContent.content.challenge.starterCode}
                    <div class="starter-code">
                      <h6>Starter Code:</h6>
                      <pre><code>{parsedContent.content.challenge.starterCode}</code></pre>
                    </div>
                  {/if}
                </div>
              </div>
            {:else}
              <div class="raw-content" style="white-space: pre-wrap;">
                {JSON.stringify(parsedContent, null, 2)}
              </div>
            {/if}
          </div>
        {:else}
          <p>No assessment content available</p>
        {/if}
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
    margin-top: 2rem;
    padding: 1.5rem;
    border-radius: 8px;
    background-color: var(--background-color);
    box-shadow: inset 2px 2px 5px var(--shadow-dark),
                inset -2px -2px 5px var(--shadow-light);
  }
  
  textarea {
    width: 100%;
    margin: 0.8rem 0 1.2rem;
    font-family: inherit;
    resize: vertical;
    color: var(--text-color);
  }
  
  .regenerate-button {
    margin-top: 1rem;
    width: 100%;
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
  
  .section {
    margin-bottom: 2rem;
  }
  
  .section h4 {
    color: var(--primary-color);
    margin-bottom: 1rem;
    font-size: 1.2rem;
  }
  
  .section h5 {
    color: var(--primary-dark);
    margin-bottom: 0.8rem;
    font-size: 1.1rem;
  }
  
  .section h6 {
    color: var(--text-color);
    margin-bottom: 0.5rem;
    font-size: 1rem;
  }
  
  .question, .challenge {
    margin-bottom: 1.5rem;
    padding: 1.2rem;
  }
  
  .question-text {
    font-weight: 500;
    margin-bottom: 1rem;
  }
  
  .options {
    list-style-type: lower-alpha;
    padding-left: 1.5rem;
  }
  
  .options li {
    margin-bottom: 0.5rem;
  }
  
  .requirements {
    margin-top: 1rem;
  }
  
  .requirements ul {
    list-style-type: disc;
    padding-left: 1.5rem;
  }
  
  .requirements li {
    margin-bottom: 0.5rem;
  }
  
  .research-sections {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .section {
    padding: 1.5rem;
    background: var(--background-color);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-elevation-medium);
  }
  
  .section h4 {
    color: var(--primary-color);
    margin: 0 0 1rem;
    font-size: 1.3rem;
    font-weight: 600;
    border-bottom: 2px solid var(--primary-light);
    padding-bottom: 0.5rem;
  }
  
  .section p {
    margin: 0;
    line-height: 1.6;
    color: var(--text-color);
  }
  
  .overview-section {
    border-left: 4px solid var(--primary-color);
  }
  
  .conclusion-section {
    border-left: 4px solid var(--success-color);
  }
  
  .explanation-content {
    max-width: 100%;
    overflow-x: hidden;
  }
  
  .research-title {
    font-size: 1.8rem;
    color: var(--primary-color);
    margin: 0 0 2rem;
    text-align: center;
    font-weight: 600;
  }
  
  .content-text {
    font-size: 1.1rem;
    line-height: 1.8;
    color: var(--text-color);
  }
  
  .content-text strong {
    color: var(--primary-dark);
    font-weight: 600;
  }
  
  .content-text li {
    margin-bottom: 0.8rem;
    line-height: 1.6;
    list-style-type: disc;
    margin-left: 1.5rem;
  }
  
  .content-text br + br {
    margin-top: 1rem;
  }
  
  .section {
    padding: 2rem;
    margin-bottom: 2rem;
    background: var(--background-color);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-elevation-medium);
  }
  
  .section h4 {
    color: var(--primary-color);
    font-size: 1.4rem;
    font-weight: 600;
    margin: 0 0 1.5rem;
    padding-bottom: 0.8rem;
    border-bottom: 2px solid var(--primary-light);
  }
  
  .overview-section {
    border-left: 4px solid var(--primary-color);
    background: linear-gradient(to right, var(--primary-light-transparent), var(--background-color));
  }
  
  .content-section {
    border-left: 4px solid var(--secondary-color);
  }
  
  .conclusion-section {
    border-left: 4px solid var(--success-color);
    background: linear-gradient(to right, var(--success-light-transparent), var(--background-color));
  }
  
  .assessment-content {
    margin-top: 1rem;
  }
  
  .question {
    background: var(--background-color);
    border-radius: var(--border-radius);
    margin-bottom: 1.5rem;
    padding: 1.5rem;
  }
  
  .question-text {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--primary-dark);
    margin-bottom: 1rem;
  }
  
  .option {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .option-letter {
    color: var(--primary-color);
    font-weight: 500;
  }
  
  .short-answer {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
  }
  
  .sample-answer {
    font-style: italic;
    color: var(--text-muted);
    margin: 0.5rem 0;
  }
  
  .rubric {
    margin-top: 1rem;
  }
  
  .description {
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }
  
  .requirements, .objectives, .deliverables, .evaluation, .timeline {
    margin-top: 1.5rem;
  }
  
  .test-cases {
    margin-top: 1.5rem;
  }
  
  .test-case {
    background: var(--background-light);
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: var(--border-radius);
  }
  
  .test-case code {
    background: var(--code-background);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: monospace;
  }
  
  .test-case .explanation {
    margin-top: 0.5rem;
    font-style: italic;
    color: var(--text-muted);
  }
  
  .starter-code {
    margin-top: 1.5rem;
  }
  
  .starter-code pre {
    background: var(--code-background);
    padding: 1rem;
    border-radius: var(--border-radius);
    overflow-x: auto;
  }
  
  .starter-code code {
    font-family: monospace;
    line-height: 1.4;
  }
  
  .key-points {
    margin-top: 0.5rem;
    padding-left: 1rem;
  }
  
  h6 {
    color: var(--text-color);
    font-size: 1rem;
    margin: 1rem 0 0.5rem;
  }
  
  ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }
  
  li {
    margin-bottom: 0.5rem;
    line-height: 1.4;
  }
</style> 