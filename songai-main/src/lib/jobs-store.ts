import { Job, JobStatus, StageId, StageStatus, STAGE_ORDER } from "./types";

/**
 * Simple in-memory job store. Survives HMR in dev via globalThis.
 * For production you'd swap this for Redis/DB — the interface stays the same.
 */
const store: Map<string, Job> =
  (globalThis as any).__songai_jobs ?? new Map<string, Job>();
(globalThis as any).__songai_jobs = store;

export function createJob(job: Job) {
  store.set(job.id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return store.get(id);
}

export function updateJob(id: string, patch: Partial<Job>) {
  const job = store.get(id);
  if (!job) return;
  Object.assign(job, patch);
  store.set(id, job);
  return job;
}

export function setStage(id: string, stage: StageId, status: StageStatus) {
  const job = store.get(id);
  if (!job) return;
  const s = job.stages.find((x) => x.id === stage);
  if (s) s.status = status;

  // overall progress = (done + 0.5*running) / total
  const total = STAGE_ORDER.length;
  const done = job.stages.filter((x) => x.status === "done").length;
  const running = job.stages.filter((x) => x.status === "running").length;
  job.progress = Math.round(((done + running * 0.5) / total) * 100);
  store.set(id, job);
}

export function setJobStatus(id: string, status: JobStatus, error?: string) {
  const job = store.get(id);
  if (!job) return;
  job.status = status;
  if (error) job.error = error;
  if (status === "done") job.progress = 100;
  store.set(id, job);
}
