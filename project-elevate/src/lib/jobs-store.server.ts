/**
 * Persistent job store, backed by Lovable Cloud (Supabase).
 *
 * Server-only. Replaces the in-memory Map from the Next.js version —
 * Cloudflare Worker invocations are stateless across requests, so an
 * in-memory store would lose jobs as soon as the response was sent.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  Job,
  JobStatus,
  StageId,
  StageStatus,
  STAGE_ORDER,
} from "./types";

const TABLE = "jobs";

type Row = {
  id: string;
  status: JobStatus;
  brief: Job["brief"];
  stages: Job["stages"];
  progress: number;
  error: string | null;
  result: NonNullable<Job["result"]>;
  created_at: string;
};

function rowToJob(row: Row): Job {
  return {
    id: row.id,
    status: row.status,
    brief: row.brief,
    stages: row.stages,
    progress: row.progress,
    error: row.error ?? undefined,
    result: row.result,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function createJob(job: Job): Promise<Job> {
  const { error } = await supabaseAdmin.from(TABLE).insert({
    id: job.id,
    status: job.status,
    brief: job.brief as never,
    stages: job.stages as never,
    progress: job.progress,
    result: (job.result ?? {}) as never,
  });
  if (error) throw new Error(`createJob failed: ${error.message}`);
  return job;
}

export async function getJob(id: string): Promise<Job | undefined> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getJob failed: ${error.message}`);
  return data ? rowToJob(data as unknown as Row) : undefined;
}

export async function updateJob(id: string, patch: Partial<Job>) {
  const dbPatch: Record<string, unknown> = {};
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.brief !== undefined) dbPatch.brief = patch.brief;
  if (patch.stages !== undefined) dbPatch.stages = patch.stages;
  if (patch.progress !== undefined) dbPatch.progress = patch.progress;
  if (patch.error !== undefined) dbPatch.error = patch.error;
  if (patch.result !== undefined) dbPatch.result = patch.result;
  await supabaseAdmin.from(TABLE).update(dbPatch as never).eq("id", id);
}

export async function setStage(
  id: string,
  stage: StageId,
  status: StageStatus
) {
  const job = await getJob(id);
  if (!job) return;
  const stages = job.stages.map((s) =>
    s.id === stage ? { ...s, status } : s
  );
  const total = STAGE_ORDER.length;
  const done = stages.filter((x) => x.status === "done").length;
  const running = stages.filter((x) => x.status === "running").length;
  const progress = Math.round(((done + running * 0.5) / total) * 100);
  await updateJob(id, { stages, progress });
}

export async function setJobStatus(
  id: string,
  status: JobStatus,
  error?: string
) {
  const patch: Partial<Job> = { status };
  if (error) patch.error = error;
  if (status === "done") patch.progress = 100;
  await updateJob(id, patch);
}
