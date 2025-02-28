<script lang="ts">
  import { goto } from '$app/navigation';
  import FileUpload from '$lib/components/FileUpload.svelte';
  import type { CourseFile } from '$lib/types';
  
  let synopsis = '';
  let isLoading = false;
  let error = '';
  let syllabusId = '';
  let files: CourseFile[] = [];
  
  async function handleSubmit() {
    if (!synopsis.trim()) {
      error = 'Please enter a course synopsis';
      return;
    }
    
    try {
      isLoading = true;
      error = '';
      
      const response = await fetch('/api/generate-syllabus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          synopsis,
          files
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate syllabus');
      }
      
      const result = await response.json();
      syllabusId = result.syllabus.id;
      
      // Navigate to the generated syllabus
      goto(`/syllabus/${syllabusId}`);
    } catch (err) {
      console.error('Error generating syllabus:', err);
      error = err instanceof Error ? err.message : 'Failed to generate syllabus';
    } finally {
      isLoading = false;
    }
  }
  
  function handleFilesAdded(event: CustomEvent<{ files: CourseFile[] }>) {
    files = [...files, ...event.detail.files];
  }
</script>

<svelte:head>
  <title>OpenSyllabus - Generate Course Syllabus</title>
</svelte:head>

<section class="hero">
  <h1>Create Comprehensive Course Syllabi with AI</h1>
  <p>
    Enter a course synopsis and optional materials to instantly generate a complete syllabus with 
    video resources, detailed explanations, and learning assessments.
  </p>
</section>

<section class="syllabus-form">
  <div class="card">
    <h2>Generate Your Syllabus</h2>
    
    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="synopsis">Course Synopsis</label>
        <textarea
          id="synopsis"
          bind:value={synopsis}
          rows="6"
          placeholder="Enter a detailed description of your course, including the main topics, target audience, and learning objectives..."
          required
        ></textarea>
      </div>
      
      {#if syllabusId}
        <FileUpload syllabusId={syllabusId} on:filesAdded={handleFilesAdded} />
      {:else}
        <p class="upload-note">
          You can upload supplementary materials after generating the initial syllabus.
        </p>
      {/if}
      
      {#if error}
        <div class="error-message">{error}</div>
      {/if}
      
      <button type="submit" class="generate-button" disabled={isLoading}>
        {isLoading ? 'Generating...' : 'Generate Syllabus'}
      </button>
    </form>
  </div>
</section>

<section class="features">
  <h2>How OpenSyllabus Works</h2>
  
  <div class="features-grid">
    <div class="feature">
      <h3>1. Describe Your Course</h3>
      <p>Enter a detailed description of your course, including the main topics, target audience, and learning objectives.</p>
    </div>
    
    <div class="feature">
      <h3>2. Upload Materials (Optional)</h3>
      <p>Upload existing course materials, references, or resources to enhance the generated syllabus.</p>
    </div>
    
    <div class="feature">
      <h3>3. Generate & Customize</h3>
      <p>Our AI creates a comprehensive syllabus with video resources, detailed explanations, and learning assessments.</p>
    </div>
  </div>
</section>

<style>
  section {
    margin-bottom: 3rem;
  }
  
  .hero {
    text-align: center;
    padding: 2rem 0;
  }
  
  .hero h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #0066cc;
  }
  
  .hero p {
    font-size: 1.2rem;
    max-width: 800px;
    margin: 0 auto;
    color: #666;
  }
  
  .card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    padding: 2rem;
  }
  
  h2 {
    color: #0066cc;
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  
  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: inherit;
    resize: vertical;
  }
  
  .upload-note {
    background-color: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    border-left: 4px solid #0066cc;
    margin-bottom: 1.5rem;
  }
  
  .error-message {
    color: #dc3545;
    margin-bottom: 1rem;
  }
  
  .generate-button {
    background-color: #0066cc;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .generate-button:hover:not(:disabled) {
    background-color: #0056b3;
  }
  
  .generate-button:disabled {
    background-color: #66a3e0;
    cursor: not-allowed;
  }
  
  .features {
    text-align: center;
  }
  
  .features h2 {
    margin-bottom: 2rem;
  }
  
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }
  
  .feature {
    background-color: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  
  .feature h3 {
    color: #0066cc;
    margin-top: 0;
  }
  
  @media (max-width: 768px) {
    .hero h1 {
      font-size: 2rem;
    }
    
    .hero p {
      font-size: 1.1rem;
    }
  }
</style>
