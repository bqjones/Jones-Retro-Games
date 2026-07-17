// CompetitionStore: single source of truth for one competition on this device.
//
// Reads and writes always hit local storage first (instant, offline-safe),
// then sync to Supabase when configured. Failed pushes land in a persistent
// queue and flush automatically when the connection returns — a Starlink blip
// costs staleness, never data.

import type { Competition, Run } from '../../types/competition';
import {
  deleteLocalRun,
  onLocalChange,
  readLocalComp,
  readLocalRuns,
  upsertLocalRun,
  writeLocalComp,
} from './local';
import * as remote from './supabase';

export type ConnectionState = 'local' | 'online' | 'offline';

type QueueItem =
  | { kind: 'comp' }
  | { kind: 'run'; run: Run }
  | { kind: 'deleteRun'; runId: string };

const QUEUE_PREFIX = 'jrg-queue:';
const FLUSH_INTERVAL_MS = 5000;

export class CompetitionStore {
  readonly code: string;
  private listeners = new Set<() => void>();
  private unsubLocal: (() => void) | null = null;
  private unsubRemote: (() => void) | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;

  comp: Competition | null = null;
  runs: Run[] = [];
  connection: ConnectionState = remote.supabaseConfigured ? 'offline' : 'local';
  /** Monotonic change counter for useSyncExternalStore snapshots. */
  version = 0;

  constructor(code: string) {
    this.code = code.toUpperCase();
  }

  start(): void {
    this.comp = readLocalComp(this.code);
    this.runs = readLocalRuns(this.code);
    this.unsubLocal = onLocalChange(this.code, () => this.reloadLocal());

    if (remote.supabaseConfigured) {
      void this.pullRemote();
      void remote
        .subscribeRemote(
          this.code,
          (kind) => void this.pullRemote(kind),
          (connected) => {
            this.connection = connected ? 'online' : 'offline';
            if (connected) void this.flushQueue();
            this.notify();
          }
        )
        .then((unsub) => {
          this.unsubRemote = unsub;
        })
        .catch(() => {
          this.connection = 'offline';
          this.notify();
        });
      this.flushTimer = setInterval(() => void this.flushQueue(), FLUSH_INTERVAL_MS);
      window.addEventListener('online', this.onOnline);
    }
  }

  stop(): void {
    this.unsubLocal?.();
    this.unsubRemote?.();
    if (this.flushTimer) clearInterval(this.flushTimer);
    window.removeEventListener('online', this.onOnline);
    this.listeners.clear();
  }

  private onOnline = () => void this.flushQueue();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private notify(): void {
    this.version++;
    for (const l of this.listeners) l();
  }

  private reloadLocal(): void {
    this.comp = readLocalComp(this.code);
    this.runs = readLocalRuns(this.code);
    this.notify();
  }

  /** Apply a mutation to the competition doc and sync it out. */
  updateComp(mutate: (comp: Competition) => void): void {
    if (!this.comp) return;
    const next = structuredClone(this.comp);
    mutate(next);
    next.rev = this.comp.rev + 1;
    this.comp = next;
    writeLocalComp(next);
    this.notify();
    this.pushOrQueue({ kind: 'comp' });
  }

  /** Seed a freshly created competition into the store. */
  createComp(comp: Competition): void {
    this.comp = comp;
    writeLocalComp(comp);
    this.notify();
    this.pushOrQueue({ kind: 'comp' });
  }

  addRun(run: Run): void {
    upsertLocalRun(run);
    this.runs = readLocalRuns(this.code);
    this.notify();
    this.pushOrQueue({ kind: 'run', run });
  }

  /** Amend an existing run (host fix-a-score). */
  upsertRun(run: Run): void {
    this.addRun(run);
  }

  deleteRun(runId: string): void {
    deleteLocalRun(this.code, runId);
    this.runs = readLocalRuns(this.code);
    this.notify();
    this.pushOrQueue({ kind: 'deleteRun', runId });
  }

  // ── Remote sync ──

  private async pullRemote(kind?: 'comp' | 'runs'): Promise<void> {
    try {
      if (kind !== 'runs') {
        const remoteComp = await remote.fetchComp(this.code);
        if (remoteComp && (!this.comp || remoteComp.rev > this.comp.rev)) {
          this.comp = remoteComp;
          writeLocalComp(remoteComp, false);
        } else if (this.comp && (!remoteComp || remoteComp.rev < this.comp.rev)) {
          // We have newer local state (e.g. created/edited offline) — push it up.
          this.pushOrQueue({ kind: 'comp' });
        }
      }
      if (kind !== 'comp') {
        const remoteRuns = await remote.fetchRuns(this.code);
        // Merge: remote is authoritative for runs it has; keep queued local-only runs.
        const byId = new Map(remoteRuns.map((r) => [r.id, r]));
        const queuedIds = new Set(
          this.readQueue()
            .filter((q): q is Extract<QueueItem, { kind: 'run' }> => q.kind === 'run')
            .map((q) => q.run.id)
        );
        for (const r of this.runs) {
          if (!byId.has(r.id) && queuedIds.has(r.id)) byId.set(r.id, r);
        }
        this.runs = [...byId.values()];
        localStorage.setItem(`jrg-runs:${this.code}`, JSON.stringify(this.runs));
      }
      this.connection = 'online';
      this.notify();
    } catch {
      this.connection = 'offline';
      this.notify();
    }
  }

  private readQueue(): QueueItem[] {
    try {
      const raw = localStorage.getItem(QUEUE_PREFIX + this.code);
      return raw ? (JSON.parse(raw) as QueueItem[]) : [];
    } catch {
      return [];
    }
  }

  private writeQueue(queue: QueueItem[]): void {
    localStorage.setItem(QUEUE_PREFIX + this.code, JSON.stringify(queue));
  }

  private pushOrQueue(item: QueueItem): void {
    if (!remote.supabaseConfigured) return;
    // Comp pushes always send latest state, so collapse duplicates.
    const queue = this.readQueue();
    if (item.kind !== 'comp' || !queue.some((q) => q.kind === 'comp')) {
      queue.push(item);
    }
    this.writeQueue(queue);
    void this.flushQueue();
  }

  private async flushQueue(): Promise<void> {
    if (!remote.supabaseConfigured || this.flushing) return;
    this.flushing = true;
    try {
      let queue = this.readQueue();
      while (queue.length > 0) {
        const item = queue[0];
        if (item.kind === 'comp') {
          if (this.comp) await remote.pushComp(this.comp);
        } else if (item.kind === 'run') {
          await remote.pushRun(item.run);
        } else {
          await remote.removeRun(this.code, item.runId);
        }
        queue = this.readQueue().slice(1);
        this.writeQueue(queue);
      }
      if (this.connection !== 'online') {
        this.connection = 'online';
        this.notify();
      }
    } catch {
      if (this.connection !== 'offline') {
        this.connection = 'offline';
        this.notify();
      }
    } finally {
      this.flushing = false;
    }
  }
}

// One store instance per code, shared across components.
const stores = new Map<string, { store: CompetitionStore; refs: number }>();

export function acquireStore(code: string): CompetitionStore {
  const key = code.toUpperCase();
  let entry = stores.get(key);
  if (!entry) {
    const store = new CompetitionStore(key);
    store.start();
    entry = { store, refs: 0 };
    stores.set(key, entry);
  }
  entry.refs++;
  return entry.store;
}

export function releaseStore(code: string): void {
  const key = code.toUpperCase();
  const entry = stores.get(key);
  if (!entry) return;
  entry.refs--;
  if (entry.refs <= 0) {
    entry.store.stop();
    stores.delete(key);
  }
}
