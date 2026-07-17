import type { ConnectionState } from '../../lib/sync/store';

export function ConnectionBadge({ connection }: { connection: ConnectionState }) {
  const label =
    connection === 'online' ? 'SYNCED' : connection === 'offline' ? 'OFFLINE — QUEUED' : 'THIS DEVICE ONLY';
  const color =
    connection === 'online'
      ? 'text-retro-green border-retro-green'
      : connection === 'offline'
        ? 'text-retro-gold border-retro-gold'
        : 'text-retro-blue border-retro-blue';
  return (
    <span className={`font-pixel text-[9px] border px-2 py-1 align-middle ${color}`} title="Sync status">
      {label}
    </span>
  );
}
