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

<div class="file-upload">
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
          <progress value={uploadProgress} max="100"></progress>
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
    <div class="error-message">{error}</div>
  {/if}
  
  {#if files.length > 0}
    <div class="files-list">
      <h4>Uploaded Files</h4>
      <ul>
        {#each files as file}
          <li>
            <span class="file-name">{file.name}</span>
            <span class="file-size">({formatFileSize(file.size)})</span>
            <button class="remove-button" on:click={() => handleRemoveFile(file.id)}>
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
    margin-bottom: 2rem;
  }
  
  h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
  
  h4 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
  }
  
  :global(.dropzone-container) {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s;
  }
  
  :global(.dropzone-container:hover) {
    border-color: #0066cc;
  }
  
  .dropzone-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 120px;
  }
  
  .subtext {
    font-size: 0.9rem;
    color: #666;
    margin-top: 0.5rem;
  }
  
  :global(.dropzone-active) {
    border-color: #0066cc;
    background-color: rgba(0, 102, 204, 0.05);
  }
  
  :global(.dropzone-accept) {
    border-color: #28a745;
    background-color: rgba(40, 167, 69, 0.05);
  }
  
  :global(.dropzone-reject) {
    border-color: #dc3545;
    background-color: rgba(220, 53, 69, 0.05);
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
    gap: 0.5rem;
  }
  
  progress {
    width: 100%;
    height: 8px;
  }
  
  .error-message {
    color: #dc3545;
    margin-top: 0.5rem;
  }
  
  .files-list {
    margin-top: 1.5rem;
  }
  
  ul {
    list-style: none;
    padding: 0;
  }
  
  li {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    border-bottom: 1px solid #eee;
  }
  
  .file-name {
    flex-grow: 1;
  }
  
  .file-size {
    color: #666;
    margin: 0 1rem;
  }
  
  .remove-button {
    background: none;
    border: none;
    color: #dc3545;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    font-size: 0.9rem;
  }
  
  .remove-button:hover {
    text-decoration: underline;
  }
</style> 