import type { Syllabus, SyllabusComponent, CourseFile } from '$lib/types';
import { generateId } from '$lib/utils/helpers';
import { getPool, isDev } from './config';
import fs from 'fs';
import path from 'path';

// We'll use a simpler in-memory database for development
const inMemoryDB = {
  syllabi: new Map<string, any>(),
  components: new Map<string, any>(),
  files: new Map<string, any>()
};
let db: any = null;

/**
 * Get or initialize the in-memory database
 */
function getInMemoryDB() {
  // Database is already initialized as a global variable
  return inMemoryDB;
}

/**
 * Initialize database tables if they don't exist
 */
export async function initDatabase() {
  try {
    if (isDev()) {
      // In-memory database
      console.log('Using in-memory database for development');
      return;
    }
    
    // Production Postgres
    const pool = getPool();
    
    // Create syllabi table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS syllabi (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        synopsis TEXT NOT NULL,
        created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create components table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS components (
        id TEXT PRIMARY KEY,
        syllabus_id TEXT NOT NULL REFERENCES syllabi(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('video', 'explanation', 'assessment')),
        content TEXT NOT NULL,
        accepted BOOLEAN DEFAULT FALSE,
        created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create files table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        syllabus_id TEXT NOT NULL REFERENCES syllabi(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        size INTEGER NOT NULL,
        type TEXT NOT NULL,
        uploaded TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database tables initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

/**
 * Create a new syllabus
 */
export async function createSyllabus(title: string, synopsis: string): Promise<Syllabus> {
  const id = generateId();
  const now = new Date();
  const nowIso = now.toISOString();
  
  if (isDev()) {
    // In-memory database
    const db = getInMemoryDB();
    
    db.syllabi.set(id, {
      id,
      title,
      synopsis,
      created: nowIso,
      modified: nowIso
    });
    
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
  
  // Production Postgres
  const pool = getPool();
  await pool.query(`
    INSERT INTO syllabi (id, title, synopsis, created, modified)
    VALUES ($1, $2, $3, $4, $5)
  `, [id, title, synopsis, nowIso, nowIso]);
  
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
  if (isDev()) {
    // In-memory database
    const db = getInMemoryDB();
    
    // Get syllabus
    const syllabus = db.syllabi.get(id);
    if (!syllabus) return null;
    
    // Get components
    const components: any[] = [];
    db.components.forEach((component: any) => {
      if (component.syllabus_id === id) {
        components.push(component);
      }
    });
    
    // Get files
    const files: any[] = [];
    db.files.forEach((file: any) => {
      if (file.syllabus_id === id) {
        files.push(file);
      }
    });
    
    return {
      id: syllabus.id,
      title: syllabus.title,
      synopsis: syllabus.synopsis,
      components: components.map(row => ({
        id: row.id,
        type: row.type as 'video' | 'explanation' | 'assessment',
        content: row.content,
        accepted: Boolean(row.accepted),
        created: new Date(row.created),
        modified: new Date(row.modified)
      })),
      files: files.map(row => ({
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
  
  // Production Postgres
  const pool = getPool();
  
  // Get syllabus
  const syllabusResult = await pool.query(`
    SELECT * FROM syllabi WHERE id = $1
  `, [id]);
  
  if (syllabusResult.rows.length === 0) {
    return null;
  }
  
  const syllabus = syllabusResult.rows[0];
  
  // Get components
  const componentsResult = await pool.query(`
    SELECT * FROM components WHERE syllabus_id = $1
  `, [id]);
  
  // Get files
  const filesResult = await pool.query(`
    SELECT * FROM files WHERE syllabus_id = $1
  `, [id]);
  
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
  if (isDev()) {
    // In-memory database
    const db = getInMemoryDB();
    
    const syllabi = Array.from(db.syllabi.values());
    
    return syllabi.map(row => ({
      id: row.id,
      title: row.title,
      synopsis: row.synopsis,
      components: [],
      files: [],
      created: new Date(row.created),
      modified: new Date(row.modified)
    }));
  }
  
  // Production Postgres
  const pool = getPool();
  
  const result = await pool.query(`
    SELECT id, title, synopsis, created, modified FROM syllabi
  `);
  
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
  
  if (isDev()) {
    // In-memory database
    const db = getInMemoryDB();
    
    db.components.set(id, {
      id,
      syllabus_id: syllabusId,
      type,
      content,
      accepted,
      created: nowIso,
      modified: nowIso
    });
    
    return {
      id,
      type,
      content,
      accepted,
      created: now,
      modified: now
    };
  }
  
  // Production Postgres
  const pool = getPool();
  
  await pool.query(`
    INSERT INTO components (id, syllabus_id, type, content, accepted, created, modified)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [id, syllabusId, type, content, accepted, nowIso, nowIso]);
  
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
  
  if (isDev()) {
    // In-memory database
    const db = getInMemoryDB();
    
    const component = db.components.get(id);
    if (!component) return null;
    
    component.content = content;
    component.accepted = accepted;
    component.modified = nowIso;
    
    db.components.set(id, component);
    
    return {
      id: component.id,
      type: component.type as 'video' | 'explanation' | 'assessment',
      content: component.content,
      accepted: Boolean(component.accepted),
      created: new Date(component.created),
      modified: new Date(component.modified)
    };
  }
  
  // Production Postgres
  const pool = getPool();
  
  const result = await pool.query(`
    UPDATE components
    SET content = $1, accepted = $2, modified = $3
    WHERE id = $4
    RETURNING *
  `, [content, accepted, nowIso, id]);
  
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
  
  if (isDev()) {
    // In-memory database
    const db = getInMemoryDB();
    
    db.files.set(id, {
      id,
      syllabus_id: syllabusId,
      name,
      url,
      size,
      type,
      uploaded: nowIso
    });
    
    return {
      id,
      name,
      url,
      size,
      type,
      uploaded: now
    };
  }
  
  // Production Postgres
  const pool = getPool();
  
  await pool.query(`
    INSERT INTO files (id, syllabus_id, name, url, size, type, uploaded)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [id, syllabusId, name, url, size, type, nowIso]);
  
  return {
    id,
    name,
    url,
    size,
    type,
    uploaded: now
  };
}