export interface VideoComponent {
  idea: string;
  link: string;
  title?: string;
  channel?: string;
  duration?: string;
}

export interface SyllabusComponent {
  id: string;
  type: 'video' | 'explanation' | 'assessment';
  content: string;
  accepted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface Syllabus {
  id: string;
  title: string;
  synopsis: string;
  created: string;
  modified: string;
  components: SyllabusComponent[];
  files: CourseFile[];
} 