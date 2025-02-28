export interface CourseFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploaded: Date;
}

export interface SyllabusComponent {
  id: string;
  type: 'video' | 'explanation' | 'assessment';
  content: string;
  accepted: boolean;
  created: Date;
  modified: Date;
}

export interface Syllabus {
  id: string;
  title: string;
  synopsis: string;
  components: SyllabusComponent[];
  files: CourseFile[];
  created: Date;
  modified: Date;
}

export interface GenerateSyllabusRequest {
  synopsis: string;
  files: CourseFile[];
  preferences?: {
    videoStyle?: string;
    explainationStyle?: string;
    assessmentStyle?: string;
  };
}

export interface RegenerateComponentRequest {
  syllabusId: string;
  componentId: string;
  feedback?: string;
}

export interface AIResponse {
  video: {
    idea: string;
    link?: string;
  };
  explanation: {
    content: string;
    sections?: string[];
  };
  assessment: {
    type: string;
    content: string;
  };
} 