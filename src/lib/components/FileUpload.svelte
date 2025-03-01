<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import DropZone from 'svelte-dropzone';
  import type { CourseFile } from '$lib/types';
  import { formatFileSize } from '$lib/utils/helpers';

  export let syllabusId: string;
  export let existingFiles: CourseFile[] = [];

  const dispatch = createEventDispatcher<{
    filesAdded: { files: CourseFile[] };
  }>();

  let files: CourseFile[] = [...existingFiles];
  let dropzoneRef: DropZone;
  let isUploading = false;
  let uploadProgress = 0;
  let error = '';

  async function handleFileDrop(e: CustomEvent) {
    try {
      isUploading = true;
      error = '';
      const droppedFiles = e.detail.acceptedFiles;
      
      if (droppedFiles.length === 0) return;
      
      const newFiles: CourseFile[] = [];
      
      for (const file of droppedFiles) {
        const formData = new FormData();
        formData.append('syllabusId', syllabusId);
        formData.append('file', file);
        
        const response = await fetch('/api/upload-file', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Failed to upload file: ${file.name}`);
        }
        
        const result = await response.json();
        newFiles.push(result.file);
      }
      
      files = [...files, ...newFiles];
      dispatch('filesAdded', { files: newFiles });
    } catch (err) {
      console.error('Error uploading files:', err);
      error = err instanceof Error ? err.message : 'Failed to upload files';
    } finally {
      isUploading = false;
      uploadProgress = 0;
    }
  }

  function handleRemoveFile(id: string) {
    files = files.filter(file => file.id !== id);
  }
</script>

<div class="file-upload neu-card">
  <h3>Upload Course Materials</h3>
  
  <DropZone
    bind:this={dropzoneRef}
    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md"
    multiple={true}
    on:drop={handleFileDrop}
    disabled={isUploading}
    containerClasses="dropzone-container"
    activeClasses="dropzone-active"
    disabledClasses="dropzone-disabled"
    acceptClasses="dropzone-accept"
    rejectClasses="dropzone-reject"
  >
    <div class="dropzone-content">
      {#if isUploading}
        <div class="uploading">
          <p>Uploading... {uploadProgress}%</p>
          <progress value={uploadProgress} max="100" class="neu-inset"></progress>
        </div>
      {:else}
        <div class="dropzone-text">
          <p>Drag & drop files here, or click to select files</p>
          <p class="subtext">Supports PDF, Word, PowerPoint, TXT, and Markdown files</p>
        </div>
      {/if}
    </div>
  </DropZone>
  
  {#if error}
    <div class="error-message neu-inset">{error}</div>
  {/if}
  
  {#if files.length > 0}
    <div class="files-list neu-inset">
      <h4>Uploaded Files</h4>
      <ul>
        {#each files as file}
          <li>
            <span class="file-name">{file.name}</span>
            <span class="file-size">({formatFileSize(file.size)})</span>
            <button class="remove-button neu-button" on:click={() => handleRemoveFile(file.id)}>
              Remove
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  .file-upload {
    margin-bottom: 2.5rem;
  }
  
  h3 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    font-family: 'Montserrat', sans-serif;
    color: var(--primary-color);
    text-shadow: 1px 1px 1px var(--shadow-light), 
                -1px -1px 1px var(--shadow-dark);
    text-align: center;
  }
  
  h4 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
    font-family: 'Montserrat', sans-serif;
    color: var(--primary-dark);
  }
  
  :global(.dropzone-container) {
    border: 2px dashed var(--shadow-dark);
    border-radius: var(--border-radius);
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: var(--bg-color);
  }
  
  :global(.dropzone-container:hover) {
    border-color: var(--primary-color);
    box-shadow: inset 3px 3px 7px var(--shadow-dark), 
                inset -3px -3px 7px var(--shadow-light);
  }
  
  .dropzone-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 130px;
  }

  .dropzone-text p {
    margin: 0.5rem 0;
    color: var(--text-color);
    font-weight: 500;
  }
  
  .subtext {
    font-size: 0.9rem;
    color: var(--text-muted);
  }
  
  :global(.dropzone-active) {
    border-color: var(--primary-color);
    box-shadow: inset 3px 3px 7px var(--shadow-dark), 
                inset -3px -3px 7px var(--shadow-light);
  }
  
  :global(.dropzone-accept) {
    border-color: var(--success-color);
    box-shadow: inset 3px 3px 7px var(--shadow-dark), 
                inset -3px -3px 7px var(--shadow-light);
  }
  
  :global(.dropzone-reject) {
    border-color: var(--danger-color);
    box-shadow: inset 3px 3px 7px var(--shadow-dark), 
                inset -3px -3px 7px var(--shadow-light);
  }
  
  :global(.dropzone-disabled) {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .uploading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    min-height: 130px;
  }
  
  .uploading p {
    color: var(--primary-color);
    font-weight: 500;
  }
  
  progress {
    width: 100%;
    height: 10px;
    border-radius: 5px;
    overflow: hidden;
  }
  
  progress::-webkit-progress-bar {
    background-color: var(--bg-color);
  }
  
  progress::-webkit-progress-value {
    background-color: var(--primary-color);
  }
  
  progress::-moz-progress-bar {
    background-color: var(--primary-color);
  }
  
  .error-message {
    color: var(--danger-color);
    margin-top: 1rem;
    padding: 1rem;
    font-weight: 500;
  }
  
  .files-list {
    margin-top: 1.5rem;
    padding: 1.5rem;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  li {
    display: flex;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--shadow-dark);
    transition: background-color 0.2s;
  }
  
  li:last-child {
    border-bottom: none;
  }
  
  li:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }
  
  .file-name {
    flex-grow: 1;
    font-weight: 500;
    color: var(--text-color);
  }
  
  .file-size {
    color: var(--text-muted);
    margin: 0 1.5rem;
    font-size: 0.9rem;
  }
  
  .remove-button {
    color: var(--danger-color);
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
</style> 