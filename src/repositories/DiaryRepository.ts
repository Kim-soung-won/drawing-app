import * as SQLite from 'expo-sqlite';
import { File, Directory, Paths } from 'expo-file-system';
import { DiaryEntry, DrawingData } from '../types/diary';

const DB_NAME = 'pubdiary.db';

let db: SQLite.SQLiteDatabase | null = null;

function getDrawingsDir(): Directory {
  return new Directory(Paths.document, 'drawings');
}

function getThumbnailsDir(): Directory {
  return new Directory(Paths.document, 'thumbnails');
}

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS diary (
        id TEXT PRIMARY KEY,
        title TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        drawing_path TEXT NOT NULL,
        thumbnail_path TEXT
      );
    `);
  }
  return db;
}

function ensureDirectories(): void {
  const drawingsDir = getDrawingsDir();
  if (!drawingsDir.exists) {
    drawingsDir.create({ intermediates: true });
  }
  const thumbnailsDir = getThumbnailsDir();
  if (!thumbnailsDir.exists) {
    thumbnailsDir.create({ intermediates: true });
  }
}

export const DiaryRepository = {
  async init(): Promise<void> {
    await getDb();
    ensureDirectories();
  },

  async getAll(): Promise<DiaryEntry[]> {
    const database = await getDb();
    const rows = await database.getAllAsync<{
      id: string;
      title: string;
      created_at: number;
      updated_at: number;
      drawing_path: string;
      thumbnail_path: string | null;
    }>('SELECT * FROM diary ORDER BY updated_at DESC');

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      drawingPath: row.drawing_path,
      thumbnailPath: row.thumbnail_path,
    }));
  },

  async getById(id: string): Promise<DiaryEntry | null> {
    const database = await getDb();
    const row = await database.getFirstAsync<{
      id: string;
      title: string;
      created_at: number;
      updated_at: number;
      drawing_path: string;
      thumbnail_path: string | null;
    }>('SELECT * FROM diary WHERE id = ?', [id]);

    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      drawingPath: row.drawing_path,
      thumbnailPath: row.thumbnail_path,
    };
  },

  async save(entry: DiaryEntry, drawingData: DrawingData): Promise<void> {
    const database = await getDb();
    ensureDirectories();

    const drawingFile = new File(getDrawingsDir(), `${entry.id}.json`);
    drawingFile.write(JSON.stringify(drawingData));

    const drawingPath = drawingFile.uri;

    await database.runAsync(
      `INSERT OR REPLACE INTO diary (id, title, created_at, updated_at, drawing_path, thumbnail_path)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.title,
        entry.createdAt,
        entry.updatedAt,
        drawingPath,
        entry.thumbnailPath,
      ],
    );
  },

  loadDrawing(drawingPath: string): DrawingData | null {
    const drawingFile = new File(drawingPath);
    if (!drawingFile.exists) return null;

    const content = drawingFile.textSync();
    return JSON.parse(content) as DrawingData;
  },

  saveThumbnail(id: string, base64: string): string {
    ensureDirectories();
    const thumbnailFile = new File(getThumbnailsDir(), `${id}.png`);
    thumbnailFile.write(base64, { encoding: 'base64' });
    return thumbnailFile.uri;
  },

  async delete(id: string): Promise<void> {
    const database = await getDb();
    const entry = await this.getById(id);

    if (entry) {
      const drawingFile = new File(entry.drawingPath);
      if (drawingFile.exists) {
        drawingFile.delete();
      }
      if (entry.thumbnailPath) {
        const thumbFile = new File(entry.thumbnailPath);
        if (thumbFile.exists) {
          thumbFile.delete();
        }
      }
    }

    await database.runAsync('DELETE FROM diary WHERE id = ?', [id]);
  },
};
