<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import SyllabusComponent from '$lib/components/SyllabusComponent.svelte';
  import FileUpload from '$lib/components/FileUpload.svelte';
  import type { Syllabus, CourseFile, SyllabusComponent as SyllabusComponentType } from '$lib/types';
  import { formatDate } from '$lib/utils/helpers';
  
  let syllabus: Syllabus | null = null;
  let isLoading = true;
  let error = '';
  
  onMount(async () => {
    await fetchSyllabus();
  });
  
  async function fetchSyllabus() {
    try {
      isLoading = true;
      error = '';
      
      const response = await fetch(`/api/syllabus/${$page.params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch syllabus');
      }
      
      const result = await response.json();
      syllabus = result.syllabus;
    } catch (err) {
      console.error('Error fetching syllabus:', err);
      error = err instanceof Error ? err.message : 'Failed to fetch syllabus';
    } finally {
      isLoading = false;
    }
  }
  
  function handleComponentUpdated(event: CustomEvent) {
    if (!syllabus) return;
    
    // Update the component in the syllabus
    const updatedComponent = event.detail.component;
    const index = syllabus.components.findIndex(c => c.id === updatedComponent.id);
    
    if (index !== -1) {
      syllabus.components[index] = updatedComponent;
    }
  }
  
  function handleFilesAdded(event: CustomEvent<{ files: CourseFile[] }>) {
    if (!syllabus) return;
    
    // Add the files to the syllabus
    syllabus.files = [...syllabus.files, ...event.detail.files];
  }
  
  function getComponentByType(type: 'video' | 'explanation' | 'assessment'): SyllabusComponentType | undefined {
    if (!syllabus) return undefined;
    return syllabus.components.find(c => c.type === type);
  }
</script>

<svelte:head>
  <title>{syllabus ? syllabus.title : 'Loading Syllabus'} | OpenSyllabus</title>
</svelte:head>

{#if isLoading}
  <div class="loading neu-card">
    <p>Loading syllabus...</p>
  </div>
{:else if error}
  <div class="error-container neu-card">
    <h2>Error</h2>
    <p>{error}</p>
    <button class="neu-button retry-button" on:click={fetchSyllabus}>Retry</button>
  </div>
{:else if syllabus}
  <div class="syllabus-container">
    <header class="syllabus-header neu-card">
      <h1>{syllabus.title}</h1>
      <div class="metadata">
        <p>Created: {formatDate(new Date(syllabus.created))}</p>
        <p>Last modified: {formatDate(new Date(syllabus.modified))}</p>
      </div>
      <div class="synopsis neu-inset">
        <h3>Course Synopsis</h3>
        <p>{syllabus.synopsis}</p>
      </div>
    </header>
    
    <section class="files-section">
      <FileUpload 
        syllabusId={syllabus.id} 
        existingFiles={syllabus.files}
        on:filesAdded={handleFilesAdded}
      />
    </section>
    
    <section class="components-section">
      {#if getComponentByType('video')}
        <SyllabusComponent 
          component={getComponentByType('video')!} 
          syllabusId={syllabus.id}
          on:accepted={handleComponentUpdated}
          on:regenerated={handleComponentUpdated}
          on:edited={handleComponentUpdated}
        />
      {/if}
      
      {#if getComponentByType('explanation')}
        <SyllabusComponent 
          component={getComponentByType('explanation')!} 
          syllabusId={syllabus.id}
          on:accepted={handleComponentUpdated}
          on:regenerated={handleComponentUpdated}
          on:edited={handleComponentUpdated}
        />
      {/if}
      
      {#if getComponentByType('assessment')}
        <SyllabusComponent 
          component={getComponentByType('assessment')!} 
          syllabusId={syllabus.id}
          on:accepted={handleComponentUpdated}
          on:regenerated={handleComponentUpdated}
          on:edited={handleComponentUpdated}
        />
      {/if}
    </section>
    
    <section class="export-section neu-card">
      <h3 class="section-title">Export Options</h3>
      <div class="export-buttons">
        <button class="neu-button primary export-button">Download as PDF</button>
        <button class="neu-button export-button">Copy Shareable Link</button>
      </div>
    </section>
  </div>
{/if}

<style>
  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
    font-size: 1.2rem;
    color: var(--text-muted);
  }
  
  .error-container {
    text-align: center;
    padding: 2rem;
    border-radius: var(--border-radius);
  }
  
  .error-container h2 {
    color: var(--danger-color);
    margin-top: 0;
  }
  
  .retry-button {
    margin-top: 1rem;
  }
  
  .syllabus-container {
    margin-bottom: 3rem;
  }
  
  .syllabus-header {
    margin-bottom: 2rem;
    padding: 2rem;
  }
  
  .syllabus-header h1 {
    font-size: 2.5rem;
    margin: 0 0 1rem;
    color: var(--primary-color);
    text-shadow: 1px 1px 1px var(--shadow-light), 
                -1px -1px 1px var(--shadow-dark);
  }
  
  .metadata {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    color: var(--text-muted);
    font-size: 0.9rem;
  }
  
  .metadata p {
    margin: 0;
  }
  
  .synopsis {
    padding: 1.5rem;
  }
  
  .synopsis h3 {
    margin-top: 0;
    color: var(--primary-dark);
    font-size: 1.3rem;
  }
  
  .synopsis p {
    margin-bottom: 0;
    line-height: 1.6;
  }
  
  .files-section, .components-section {
    margin-bottom: 3rem;
  }
  
  .components-section {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .section-title {
    font-size: 1.8rem;
    margin: 0 0 1.5rem;
    color: var(--primary-color);
    text-shadow: 1px 1px 1px var(--shadow-light), 
                -1px -1px 1px var(--shadow-dark);
  }
  
  .export-section {
    padding: 2rem;
  }
  
  .export-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .export-button {
    min-width: 180px;
  }
  
  @media (max-width: 768px) {
    .metadata {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .syllabus-header h1 {
      font-size: 2rem;
    }
    
    .section-title {
      font-size: 1.5rem;
    }
    
    .export-buttons {
      flex-direction: column;
      align-items: stretch;
    }
    
    .export-button {
      width: 100%;
      min-width: auto;
    }
  }
</style> 