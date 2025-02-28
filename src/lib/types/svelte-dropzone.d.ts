declare module 'svelte-dropzone' {
  import { SvelteComponentTyped } from 'svelte';
  
  interface DropzoneProps {
    accept?: string;
    disabled?: boolean;
    multiple?: boolean;
    containerClasses?: string;
    activeClasses?: string;
    disabledClasses?: string;
    acceptClasses?: string;
    rejectClasses?: string;
  }
  
  interface DropzoneEvents {
    drop: CustomEvent<{acceptedFiles: File[], rejectedFiles: File[]}>;
  }
  
  export default class Dropzone extends SvelteComponentTyped<DropzoneProps, DropzoneEvents> {}
} 