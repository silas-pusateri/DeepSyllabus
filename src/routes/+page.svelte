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
  <div class="neu-card form-card">
    <h2>Generate Your Syllabus</h2>
    
    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="synopsis">Course Synopsis</label>
        <textarea
          id="synopsis"
          bind:value={synopsis}
          rows="6"
          placeholder="Enter a detailed description of your course, including the main topics, target audience, and learning objectives..."
          class="neu-input"
          required
        ></textarea>
      </div>
      
      {#if syllabusId}
        <FileUpload syllabusId={syllabusId} on:filesAdded={handleFilesAdded} />
      {:else}
        <div class="upload-note neu-inset">
          <p>
            You can upload supplementary materials after generating the initial syllabus.
          </p>
        </div>
      {/if}
      
      {#if error}
        <div class="error-message neu-inset">{error}</div>
      {/if}
      
      <button type="submit" class="neu-button primary generate-button" disabled={isLoading}>
        {isLoading ? 'Generating...' : 'Generate Syllabus'}
      </button>
    </form>
  </div>
</section>

<section class="features">
  <h2>How OpenSyllabus Works</h2>
  
  <div class="features-grid">
    <div class="feature neu-card">
      <div class="feature-number">1</div>
      <h3>Describe Your Course</h3>
      <p>Enter a detailed description of your course, including the main topics, target audience, and learning objectives.</p>
    </div>
    
    <div class="feature neu-card">
      <div class="feature-number">2</div>
      <h3>Upload Materials (Optional)</h3>
      <p>Upload existing course materials, references, or resources to enhance the generated syllabus.</p>
    </div>
    
    <div class="feature neu-card">
      <div class="feature-number">3</div>
      <h3>Generate & Customize</h3>
      <p>Our AI creates a comprehensive syllabus with video resources, detailed explanations, and learning assessments.</p>
    </div>
  </div>
</section>

<style>
  section {
    margin-bottom: 4rem;
  }
  
  .hero {
    text-align: center;
    padding: 1rem 0 3rem;
  }
  
  .hero h1 {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    color: var(--primary-color);
    text-shadow: 1px 1px 1px var(--shadow-light), 
                -1px -1px 1px var(--shadow-dark);
  }
  
  .hero p {
    font-size: 1.2rem;
    max-width: 800px;
    margin: 0 auto;
    color: var(--text-muted);
    line-height: 1.7;
  }
  
  .form-card {
    margin-bottom: 2rem;
  }
  
  h2 {
    color: var(--primary-color);
    margin-top: 0;
    margin-bottom: 1.8rem;
    font-size: 1.8rem;
    text-shadow: 1px 1px 1px var(--shadow-light), 
                -1px -1px 1px var(--shadow-dark);
    text-align: center;
  }
  
  .form-group {
    margin-bottom: 1.8rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.8rem;
    font-weight: 600;
    color: var(--text-color);
    padding-left: 0.5rem;
  }
  
  textarea {
    width: 100%;
    font-family: inherit;
    resize: vertical;
    font-size: 1rem;
    color: var(--text-color);
  }
  
  .upload-note {
    padding: 1.5rem;
    margin-bottom: 1.8rem;
  }
  
  .upload-note p {
    margin: 0;
    color: var(--text-muted);
    text-align: center;
  }
  
  .error-message {
    color: var(--danger-color);
    margin-bottom: 1.5rem;
    padding: 1rem;
    font-weight: 500;
  }
  
  .generate-button {
    width: 100%;
    font-size: 1.1rem;
    padding: 1rem;
    margin-top: 0.5rem;
  }
  
  .features h2 {
    margin-bottom: 2.5rem;
  }
  
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2.5rem;
  }
  
  .feature {
    position: relative;
    padding-top: 3rem;
  }
  
  .feature-number {
    position: absolute;
    top: -20px;
    left: calc(50% - 20px);
    width: 40px;
    height: 40px;
    background: var(--primary-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.3rem;
    box-shadow: 3px 3px 7px rgba(0, 0, 0, 0.1),
                -3px -3px 7px rgba(255, 255, 255, 0.6);
  }
  
  .feature h3 {
    color: var(--primary-color);
    margin-top: 0;
    margin-bottom: 1rem;
    text-align: center;
    font-size: 1.4rem;
  }
  
  .feature p {
    color: var(--text-muted);
    margin: 0;
    text-align: center;
    line-height: 1.6;
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
