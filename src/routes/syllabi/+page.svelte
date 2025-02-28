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
    <a href="/" class="create-button">Create New Syllabus</a>
  </header>
  
  {#if isLoading}
    <div class="loading">
      <p>Loading syllabi...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <h2>Error</h2>
      <p>{error}</p>
      <button class="retry-button" on:click={fetchSyllabi}>Retry</button>
    </div>
  {:else if syllabi.length === 0}
    <div class="empty-state">
      <h2>No Syllabi Found</h2>
      <p>You haven't created any syllabi yet. Get started by creating your first syllabus!</p>
      <a href="/" class="create-button">Create New Syllabus</a>
    </div>
  {:else}
    <div class="syllabi-grid">
      {#each syllabi as syllabus}
        <a href={`/syllabus/${syllabus.id}`} class="syllabus-card">
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
    color: #0066cc;
  }
  
  .create-button {
    display: inline-block;
    background-color: #0066cc;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .create-button:hover {
    background-color: #0056b3;
  }
  
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
  
  .empty-state {
    text-align: center;
    padding: 3rem;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .empty-state h2 {
    color: #0066cc;
    margin-top: 0;
  }
  
  .empty-state .create-button {
    margin-top: 1.5rem;
  }
  
  .syllabi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .syllabus-card {
    display: block;
    background-color: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    color: inherit;
    text-decoration: none;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .syllabus-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
  
  .syllabus-card h2 {
    font-size: 1.5rem;
    margin-top: 0;
    margin-bottom: 0.75rem;
    color: #0066cc;
  }
  
  .synopsis {
    color: #666;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }
  
  .card-footer {
    color: #888;
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