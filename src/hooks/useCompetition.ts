import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { Competition, Run } from '../types/competition';
import { computeStandings } from '../lib/competition';
import { acquireStore, releaseStore, type ConnectionState } from '../lib/sync/store';
import type { Standing } from '../types/competition';

export interface CompetitionApi {
  comp: Competition | null;
  runs: Run[];
  standings: Standing[];
  connection: ConnectionState;
  updateComp: (mutate: (comp: Competition) => void) => void;
  addRun: (run: Run) => void;
  upsertRun: (run: Run) => void;
  deleteRun: (runId: string) => void;
}

export function useCompetition(code: string): CompetitionApi {
  const store = useMemo(() => acquireStore(code), [code]);

  useEffect(() => {
    return () => releaseStore(code);
  }, [code]);

  const snapshot = useSyncExternalStore(store.subscribe, () => store.version);

  const { comp, runs, connection } = store;

  const standings = useMemo(
    () => (comp ? computeStandings(comp, runs) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [comp, runs, snapshot]
  );

  return {
    comp,
    runs,
    standings,
    connection,
    updateComp: (mutate) => store.updateComp(mutate),
    addRun: (run) => store.addRun(run),
    upsertRun: (run) => store.upsertRun(run),
    deleteRun: (runId) => store.deleteRun(runId),
  };
}

/** Ticks every second; returns current epoch ms. For countdown displays. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
