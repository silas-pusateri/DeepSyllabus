import { sql } from '@vercel/postgres';
import type { Syllabus, SyllabusComponent, CourseFile } from '$lib/types';
import { generateId } from '$lib/utils/helpers';
import { env } from '$env/dynamic/private';

// In-memory data store for local development
const inMemoryDB = {
  syllabi: new Map<string, any>(),
  components: new Map<string, any>(),
  files: new Map<string, any>()
};

// Check if we're in development mode without database credentials
const isDevelopmentMode = !env.POSTGRES_URL && process.env.NODE_ENV !== 'production';

/**
 * Initialize database tables if they don't exist
 */
export async function initDatabase() {
  try {
    if (isDevelopmentMode) {
      console.log('Running in development mode with in-memory database');
      return;
    }
    
    // Create syllabi table
    await sql`
      CREATE TABLE IF NOT EXISTS syllabi (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        synopsis TEXT NOT NULL,
        created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create components table
    await sql`
      CREATE TABLE IF NOT EXISTS components (
        id TEXT PRIMARY KEY,
        syllabus_id TEXT NOT NULL REFERENCES syllabi(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('video', 'explanation', 'assessment')),
        content TEXT NOT NULL,
        accepted BOOLEAN DEFAULT FALSE,
        created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create files table
    await sql`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        syllabus_id TEXT NOT NULL REFERENCES syllabi(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        size INTEGER NOT NULL,
        type TEXT NOT NULL,
        uploaded TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
  } catch (error) {
    console.error('Database initialization error:', error);
    if (!env.POSTGRES_URL && process.env.NODE_ENV === 'production') {
      throw new Error('Missing POSTGRES_URL in production environment');
    }
    // Switch to development mode if database connection fails
    console.log('Switching to development mode with in-memory database');
  }
}

/**
 * Create a new syllabus
 */
export async function createSyllabus(title: string, synopsis: string): Promise<Syllabus> {
  const id = generateId();
  const now = new Date();
  const nowIso = now.toISOString();
  
  if (isDevelopmentMode) {
    const syllabus = {
      id,
      title,
      synopsis,
      created: now,
      modified: now
    };
    inMemoryDB.syllabi.set(id, syllabus);
    return {
      id,
      title,
      synopsis,
      components: [],
      files: [],
      created: now,
      modified: now
    };
  }
  
  await sql`
    INSERT INTO syllabi (id, title, synopsis, created, modified)
    VALUES (${id}, ${title}, ${synopsis}, ${nowIso}, ${nowIso})
  `;
  
  return {
    id,
    title,
    synopsis,
    components: [],
    files: [],
    created: now,
    modified: now
  };
}

/**
 * Get a syllabus by ID
 */
export async function getSyllabus(id: string): Promise<Syllabus | null> {
  if (isDevelopmentMode) {
    const syllabus = inMemoryDB.syllabi.get(id);
    if (!syllabus) return null;
    
    // Get components and files from in-memory DB
    const components: SyllabusComponent[] = [];
    const files: CourseFile[] = [];
    
    inMemoryDB.components.forEach((component) => {
      if (component.syllabus_id === id) {
        components.push({
          id: component.id,
          type: component.type,
          content: component.content,
          accepted: component.accepted,
          created: new Date(component.created),
          modified: new Date(component.modified)
        });
      }
    });
    
    inMemoryDB.files.forEach((file) => {
      if (file.syllabus_id === id) {
        files.push({
          id: file.id,
          name: file.name,
          url: file.url,
          size: file.size,
          type: file.type,
          uploaded: new Date(file.uploaded)
        });
      }
    });
    
    return {
      ...syllabus,
      components,
      files
    };
  }
  
  // Get syllabus
  const syllabusResult = await sql`
    SELECT * FROM syllabi WHERE id = ${id}
  `;
  
  if (syllabusResult.rows.length === 0) {
    return null;
  }
  
  const syllabus = syllabusResult.rows[0];
  
  // Get components
  const componentsResult = await sql`
    SELECT * FROM components WHERE syllabus_id = ${id}
  `;
  
  // Get files
  const filesResult = await sql`
    SELECT * FROM files WHERE syllabus_id = ${id}
  `;
  
  return {
    id: syllabus.id,
    title: syllabus.title,
    synopsis: syllabus.synopsis,
    components: componentsResult.rows.map(row => ({
      id: row.id,
      type: row.type,
      content: row.content,
      accepted: row.accepted,
      created: new Date(row.created),
      modified: new Date(row.modified)
    })),
    files: filesResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      url: row.url,
      size: row.size,
      type: row.type,
      uploaded: new Date(row.uploaded)
    })),
    created: new Date(syllabus.created),
    modified: new Date(syllabus.modified)
  };
}

/**
 * Get all syllabi
 */
export async function getAllSyllabi(): Promise<Syllabus[]> {
  if (isDevelopmentMode) {
    return Array.from(inMemoryDB.syllabi.values()).map(syllabus => ({
      ...syllabus,
      components: [],
      files: []
    }));
  }
  
  const result = await sql`
    SELECT id, title, synopsis, created, modified FROM syllabi
  `;
  
  return result.rows.map(row => ({
    id: row.id,
    title: row.title,
    synopsis: row.synopsis,
    components: [],
    files: [],
    created: new Date(row.created),
    modified: new Date(row.modified)
  }));
}

/**
 * Create a new component
 */
export async function createComponent(
  syllabusId: string,
  type: 'video' | 'explanation' | 'assessment',
  content: string,
  accepted: boolean = false
): Promise<SyllabusComponent> {
  const id = generateId();
  const now = new Date();
  const nowIso = now.toISOString();
  
  if (isDevelopmentMode) {
    const component = {
      id,
      syllabus_id: syllabusId,
      type,
      content,
      accepted,
      created: now,
      modified: now
    };
    inMemoryDB.components.set(id, component);
    return {
      id,
      type,
      content,
      accepted,
      created: now,
      modified: now
    };
  }
  
  await sql`
    INSERT INTO components (id, syllabus_id, type, content, accepted, created, modified)
    VALUES (${id}, ${syllabusId}, ${type}, ${content}, ${accepted}, ${nowIso}, ${nowIso})
  `;
  
  return {
    id,
    type,
    content,
    accepted,
    created: now,
    modified: now
  };
}

/**
 * Update a component
 */
export async function updateComponent(
  id: string,
  content: string,
  accepted: boolean
): Promise<SyllabusComponent | null> {
  const now = new Date();
  const nowIso = now.toISOString();
  
  if (isDevelopmentMode) {
    const component = inMemoryDB.components.get(id);
    if (!component) return null;
    
    if (content) component.content = content;
    component.accepted = accepted;
    component.modified = now;
    
    inMemoryDB.components.set(id, component);
    
    return {
      id: component.id,
      type: component.type,
      content: component.content,
      accepted: component.accepted,
      created: new Date(component.created),
      modified: new Date(component.modified)
    };
  }
  
  const result = await sql`
    UPDATE components
    SET content = ${content}, accepted = ${accepted}, modified = ${nowIso}
    WHERE id = ${id}
    RETURNING *
  `;
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  
  return {
    id: row.id,
    type: row.type,
    content: row.content,
    accepted: row.accepted,
    created: new Date(row.created),
    modified: new Date(row.modified)
  };
}

/**
 * Add a file
 */
export async function addFile(
  syllabusId: string,
  name: string,
  url: string,
  size: number,
  type: string
): Promise<CourseFile> {
  const id = generateId();
  const now = new Date();
  const nowIso = now.toISOString();
  
  if (isDevelopmentMode) {
    const file = {
      id,
      syllabus_id: syllabusId,
      name,
      url,
      size,
      type,
      uploaded: now
    };
    inMemoryDB.files.set(id, file);
    return {
      id,
      name,
      url,
      size,
      type,
      uploaded: now
    };
  }
  
  await sql`
    INSERT INTO files (id, syllabus_id, name, url, size, type, uploaded)
    VALUES (${id}, ${syllabusId}, ${name}, ${url}, ${size}, ${type}, ${nowIso})
  `;
  
  return {
    id,
    name,
    url,
    size,
    type,
    uploaded: now
  };
} 