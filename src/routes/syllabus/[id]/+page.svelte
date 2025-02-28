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
  <div class="loading">
    <p>Loading syllabus...</p>
  </div>
{:else if error}
  <div class="error-container">
    <h2>Error</h2>
    <p>{error}</p>
    <button class="retry-button" on:click={fetchSyllabus}>Retry</button>
  </div>
{:else if syllabus}
  <div class="syllabus-container">
    <header class="syllabus-header">
      <h1>{syllabus.title}</h1>
      <div class="metadata">
        <p>Created: {formatDate(new Date(syllabus.created))}</p>
        <p>Last modified: {formatDate(new Date(syllabus.modified))}</p>
      </div>
      <div class="synopsis">
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
    
    <section class="export-section">
      <h3>Export Options</h3>
      <div class="export-buttons">
        <button class="export-button">Download as PDF</button>
        <button class="export-button">Copy Shareable Link</button>
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
    color: #666;
  }
  
  .error-container {
    text-align: center;
    padding: 2rem;
    background-color: #fff3f3;
    border-radius: 8px;
    border: 1px solid #ffcdd2;
  }
  
  .retry-button {
    background-color: #0066cc;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    cursor: pointer;
    margin-top: 1rem;
  }
  
  .syllabus-container {
    margin-bottom: 3rem;
  }
  
  .syllabus-header {
    margin-bottom: 2rem;
  }
  
  .syllabus-header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: #0066cc;
  }
  
  .metadata {
    display: flex;
    gap: 1.5rem;
    color: #666;
    margin-bottom: 1.5rem;
  }
  
  .metadata p {
    margin: 0;
  }
  
  .synopsis {
    background-color: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .synopsis h3 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    color: #0066cc;
  }
  
  .synopsis p {
    margin: 0;
    line-height: 1.6;
  }
  
  .files-section, .components-section, .export-section {
    margin-bottom: 2rem;
  }
  
  .export-section {
    background-color: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .export-section h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #0066cc;
  }
  
  .export-buttons {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .export-button {
    background-color: #0066cc;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .export-button:hover {
    background-color: #0056b3;
  }
  
  @media (max-width: 768px) {
    .syllabus-header h1 {
      font-size: 2rem;
    }
    
    .metadata {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .export-buttons {
      flex-direction: column;
    }
    
    .export-button {
      width: 100%;
    }
  }
</style> 