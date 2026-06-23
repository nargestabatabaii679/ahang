/**
 * Job store backed by a local SQLite file (data/jobs.db).
 * Drop-in replacement for the Supabase-backed version — same exports,
 * same behaviour, zero external services required.
 */

import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { join } from "path";
import { Job, JobStatus, StageId, StageStatus, STAGE_ORDER } from "./types";

// Keep the DB file next to the project root, outside src/
const DB_DIR =
  process.env.NODE_ENV === "production" ? "/app/data" : join(process.cwd(), "data");
mkdirSync(DB_DIR, { recursive: true });
const DB_PATH = join(DB_DIR, "jobs.db");

let _db: Database.Database | null = null;
function db(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("synchronous = NORMAL");
    _db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id          TEXT PRIMARY KEY,
        status      TEXT NOT NULL DEFAULT 'queued',
        brief       TEXT NOT NULL,
        stages      TEXT NOT NULL,
        progress    INTEGER NOT NULL DEFAULT 0,
        error       TEXT,
        result      TEXT NOT NULL DEFAULT '{}',
        created_at  INTEGER NOT NULL
      )
    `);
  }
  return _db;
}

type Row = {
  id: string;
  status: JobStatus;
  brief: string;
  stages: string;
  progress: number;
  error: string | null;
  result: string;
  created_at: number;
};

function rowToJob(row: Row): Job {
  return {
    id: row.id,
    status: row.status,
    brief: JSON.parse(row.brief),
    stages: JSON.parse(row.stages),
    progress: row.progress,
    error: row.error ?? undefined,
    result: JSON.parse(row.result),
    createdAt: row.created_at,
  };
}

export async function createJob(job: Job): Promise<Job> {
  db().prepare(`
    INSERT INTO jobs (id, status, brief, stages, progress, error, result, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    job.id,
    job.status,
    JSON.stringify(job.brief),
    JSON.stringify(job.stages),
    job.progress,
    job.error ?? null,
    JSON.stringify(job.result ?? {}),
    job.createdAt,
  );
  return job;
}

export async function getJob(id: string): Promise<Job | undefined> {
  const row = db().prepare("SELECT * FROM jobs WHERE id = ?").get(id) as Row | undefined;
  return row ? rowToJob(row) : undefined;
}

export async function updateJob(id: string, patch: Partial<Job>) {
  const row = db().prepare("SELECT * FROM jobs WHERE id = ?").get(id) as Row | undefined;
  if (!row) return;
  const merged: Row = {
    ...row,
    status:   (patch.status   ?? row.status) as JobStatus,
    brief:    patch.brief  !== undefined ? JSON.stringify(patch.brief)   : row.brief,
    stages:   patch.stages !== undefined ? JSON.stringify(patch.stages)  : row.stages,
    progress: patch.progress ?? row.progress,
    error:    patch.error !== undefined ? (patch.error ?? null) : row.error,
    result:   patch.result !== undefined ? JSON.stringify(patch.result)  : row.result,
  };
  db().prepare(`
    UPDATE jobs SET status=?, brief=?, stages=?, progress=?, error=?, result=?
    WHERE id=?
  `).run(merged.status, merged.brief, merged.stages, merged.progress, merged.error, merged.result, id);
}

export async function setStage(id: string, stage: StageId, status: StageStatus) {
  const job = await getJob(id);
  if (!job) return;
  const stages = job.stages.map((s) => (s.id === stage ? { ...s, status } : s));
  const total = STAGE_ORDER.length;
  const done = stages.filter((x) => x.status === "done").length;
  const running = stages.filter((x) => x.status === "running").length;
  const progress = Math.round(((done + running * 0.5) / total) * 100);
  await updateJob(id, { stages, progress });
}

export async function setJobStatus(id: string, status: JobStatus, error?: string) {
  const patch: Partial<Job> = { status };
  if (error) patch.error = error;
  if (status === "done") patch.progress = 100;
  await updateJob(id, patch);
}
