import { sql } from '@vercel/postgres';
import type { Syllabus, SyllabusComponent, CourseFile } from '$lib/types';
import { generateId } from '$lib/utils/helpers';

/**
 * Initialize database tables if they don't exist
 */
export async function initDatabase() {
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
}

/**
 * Create a new syllabus
 */
export async function createSyllabus(title: string, synopsis: string): Promise<Syllabus> {
  const id = generateId();
  const now = new Date();
  const nowIso = now.toISOString();
  
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