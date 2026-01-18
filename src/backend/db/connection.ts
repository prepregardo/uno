import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Создаём папку для БД если её нет
const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'winline.db');
const db = new Database(dbPath);

// Включаем foreign keys
db.pragma('foreign_keys = ON');

export function query<T>(sql: string, params: unknown[] = []): T[] {
  const stmt = db.prepare(sql);

  // Определяем тип запроса
  const sqlUpper = sql.trim().toUpperCase();
  const isSelect = sqlUpper.startsWith('SELECT') || sqlUpper.startsWith('WITH');

  if (isSelect) {
    return stmt.all(...params) as T[];
  } else {
    stmt.run(...params);
    return [] as T[];
  }
}

export function run(sql: string, params: unknown[] = []): Database.RunResult {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

export function getLastInsertId(): number {
  const result = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number };
  return result.id;
}

export function transaction<T>(callback: () => T): T {
  return db.transaction(callback)();
}

export default db;
