<script lang="ts">
  import { onMount } from 'svelte';
  import type { Syllabus } from '$lib/types';
  import { formatDate, truncate } from '$lib/utils/helpers';
  
  let syllabi: Syllabus[] = [];
  let isLoading = true;
  let error = '';
  
  onMount(async () => {
    await fetchSyllabi();
  });
  
  async function fetchSyllabi() {
    try {
      isLoading = true;
      error = '';
      
      const response = await fetch('/api/syllabi');
      
      if (!response.ok) {
        throw new Error('Failed to fetch syllabi');
      }
      
      const result = await response.json();
      syllabi = result.syllabi;
    } catch (err) {
      console.error('Error fetching syllabi:', err);
      error = err instanceof Error ? err.message : 'Failed to fetch syllabi';
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>My Syllabi | OpenSyllabus</title>
</svelte:head>

<div class="syllabi-container">
  <header class="page-header">
    <h1>My Syllabi</h1>
    <a href="/" class="neu-button primary">Create New Syllabus</a>
  </header>
  
  {#if isLoading}
    <div class="loading neu-card">
      <p>Loading syllabi...</p>
    </div>
  {:else if error}
    <div class="error-container neu-card">
      <h2>Error</h2>
      <p>{error}</p>
      <button class="neu-button retry-button" on:click={fetchSyllabi}>Retry</button>
    </div>
  {:else if syllabi.length === 0}
    <div class="empty-state neu-card">
      <h2>No Syllabi Found</h2>
      <p>You haven't created any syllabi yet. Get started by creating your first syllabus!</p>
      <a href="/" class="neu-button primary">Create New Syllabus</a>
    </div>
  {:else}
    <div class="syllabi-grid">
      {#each syllabi as syllabus}
        <a href={`/syllabus/${syllabus.id}`} class="syllabus-card neu-card">
          <h2>{syllabus.title}</h2>
          <p class="synopsis">{truncate(syllabus.synopsis, 120)}</p>
          <div class="card-footer">
            <span class="date">Created: {formatDate(new Date(syllabus.created))}</span>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .syllabi-container {
    margin-bottom: 3rem;
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  h1 {
    font-size: 2.5rem;
    margin: 0;
    color: var(--primary-color);
    text-shadow: 1px 1px 1px var(--shadow-light), 
                -1px -1px 1px var(--shadow-dark);
  }
  
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
  }
  
  .retry-button {
    margin-top: 1rem;
  }
  
  .empty-state {
    text-align: center;
    padding: 3rem;
    border-radius: var(--border-radius);
  }
  
  .empty-state h2 {
    color: var(--primary-color);
    margin-top: 0;
  }
  
  .empty-state .neu-button {
    margin-top: 1.5rem;
  }
  
  .syllabi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .syllabus-card {
    display: block;
    border-radius: var(--border-radius);
    padding: 1.5rem;
    color: inherit;
    text-decoration: none;
    transition: all 0.3s ease;
  }
  
  .syllabus-card:hover {
    transform: translateY(-5px);
    box-shadow: 9px 9px 18px var(--shadow-dark), 
                -9px -9px 18px var(--shadow-light);
  }
  
  .syllabus-card h2 {
    font-size: 1.5rem;
    margin-top: 0;
    margin-bottom: 0.75rem;
    color: var(--primary-color);
    font-family: 'Montserrat', sans-serif;
  }
  
  .synopsis {
    color: var(--text-color);
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }
  
  .card-footer {
    color: var(--text-muted);
    font-size: 0.9rem;
  }
  
  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    h1 {
      font-size: 2rem;
    }
    
    .syllabi-grid {
      grid-template-columns: 1fr;
    }
  }
</style> 