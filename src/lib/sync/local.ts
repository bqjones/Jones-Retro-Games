// Local persistence + cross-tab notification. This is both the standalone
// "local mode" backend (multi-tab dry runs on one machine) and the offline
// cache when Supabase sync is configured.

import type { Competition, Run } from '../../types/competition';

const COMP_PREFIX = 'jrg-comp:';
const RUNS_PREFIX = 'jrg-runs:';
const CHANNEL = 'jrg-sync';

const bc: BroadcastChannel | null =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;

export function readLocalComp(code: string): Competition | null {
  try {
    const raw = localStorage.getItem(COMP_PREFIX + code);
    return raw ? (JSON.parse(raw) as Competition) : null;
  } catch {
    return null;
  }
}

export function writeLocalComp(comp: Competition, notify = true): void {
  localStorage.setItem(COMP_PREFIX + comp.code, JSON.stringify(comp));
  if (notify) bc?.postMessage({ kind: 'comp', code: comp.code });
}

export function readLocalRuns(code: string): Run[] {
  try {
    const raw = localStorage.getItem(RUNS_PREFIX + code);
    return raw ? (JSON.parse(raw) as Run[]) : [];
  } catch {
    return [];
  }
}

export function upsertLocalRun(run: Run, notify = true): void {
  const runs = readLocalRuns(run.code);
  const i = runs.findIndex((r) => r.id === run.id);
  if (i >= 0) runs[i] = run;
  else runs.push(run);
  localStorage.setItem(RUNS_PREFIX + run.code, JSON.stringify(runs));
  if (notify) bc?.postMessage({ kind: 'runs', code: run.code });
}

export function deleteLocalRun(code: string, runId: string, notify = true): void {
  const runs = readLocalRuns(code).filter((r) => r.id !== runId);
  localStorage.setItem(RUNS_PREFIX + code, JSON.stringify(runs));
  if (notify) bc?.postMessage({ kind: 'runs', code });
}

/** Notify other tabs (and this one) that local data for `code` changed. */
export function broadcastChange(kind: 'comp' | 'runs', code: string): void {
  bc?.postMessage({ kind, code });
}

/** Listen for changes from other tabs (BroadcastChannel) and other windows (storage events). */
export function onLocalChange(code: string, cb: (kind: 'comp' | 'runs') => void): () => void {
  const onMessage = (e: MessageEvent) => {
    if (e.data?.code === code) cb(e.data.kind);
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === COMP_PREFIX + code) cb('comp');
    else if (e.key === RUNS_PREFIX + code) cb('runs');
  };
  bc?.addEventListener('message', onMessage);
  window.addEventListener('storage', onStorage);
  return () => {
    bc?.removeEventListener('message', onMessage);
    window.removeEventListener('storage', onStorage);
  };
}

/** Codes of competitions stored on this device, newest first. */
export function listLocalCompetitions(): Competition[] {
  const comps: Competition[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(COMP_PREFIX)) {
      const comp = readLocalComp(key.slice(COMP_PREFIX.length));
      if (comp) comps.push(comp);
    }
  }
  return comps.sort((a, b) => b.createdAt - a.createdAt);
}
