// Supabase backend, active only when VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY are set (see SUPABASE.md). Loaded dynamically so the
// dependency stays out of the bundle in local-only mode.

import type { Competition, Run } from '../../types/competition';

type SupabaseClient = import('@supabase/supabase-js').SupabaseClient;

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);

let clientPromise: Promise<SupabaseClient> | null = null;

async function client(): Promise<SupabaseClient> {
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(url!, anonKey!)
    );
  }
  return clientPromise;
}

export async function fetchComp(code: string): Promise<Competition | null> {
  const sb = await client();
  const { data, error } = await sb.from('competitions').select('data').eq('code', code).maybeSingle();
  if (error) throw error;
  return (data?.data as Competition) ?? null;
}

export async function pushComp(comp: Competition): Promise<void> {
  const sb = await client();
  const { error } = await sb
    .from('competitions')
    .upsert({ code: comp.code, data: comp, rev: comp.rev, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function fetchRuns(code: string): Promise<Run[]> {
  const sb = await client();
  const { data, error } = await sb.from('runs').select('data').eq('code', code);
  if (error) throw error;
  return (data ?? []).map((row) => row.data as Run);
}

export async function pushRun(run: Run): Promise<void> {
  const sb = await client();
  const { error } = await sb.from('runs').upsert({ id: run.id, code: run.code, data: run, ts: run.ts });
  if (error) throw error;
}

export async function removeRun(code: string, runId: string): Promise<void> {
  const sb = await client();
  const { error } = await sb.from('runs').delete().eq('id', runId).eq('code', code);
  if (error) throw error;
}

/** Subscribe to remote changes for a competition. Calls back with the kind of data that changed. */
export async function subscribeRemote(
  code: string,
  cb: (kind: 'comp' | 'runs') => void,
  onStatus: (connected: boolean) => void
): Promise<() => void> {
  const sb = await client();
  const channel = sb
    .channel(`comp-${code}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'competitions', filter: `code=eq.${code}` },
      () => cb('comp')
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'runs', filter: `code=eq.${code}` },
      () => cb('runs')
    )
    .subscribe((status) => {
      onStatus(status === 'SUBSCRIBED');
    });
  return () => {
    void sb.removeChannel(channel);
  };
}
