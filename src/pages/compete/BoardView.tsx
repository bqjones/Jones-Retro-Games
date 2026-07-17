import { useParams } from 'react-router-dom';
import { useCompetition } from '../../hooks/useCompetition';
import { getGameById } from '../../lib/games';
import { stationForGroup, totalRounds } from '../../lib/competition';
import { Countdown } from '../../components/compete/Countdown';
import { Standings } from '../../components/compete/Standings';
import { ConnectionBadge } from '../../components/compete/ConnectionBadge';
import { ExitButton } from '../../components/compete/ExitButton';

/** Read-only live leaderboard for phones and iPads on the couch. */
export function BoardView() {
  const { code = '' } = useParams();
  const { comp, standings, connection } = useCompetition(code);

  if (!comp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-retro-black px-6 text-center">
        <p className="font-pixel text-sm text-retro-accent">COMPETITION NOT FOUND ON THIS DEVICE</p>
      </div>
    );
  }

  const phaseLine = () => {
    switch (comp.phase) {
      case 'lobby':
        return 'Waiting to start…';
      case 'rotation':
        return `Rotation ${comp.currentRound + 1} of ${totalRounds(comp)}`;
      case 'rotate':
        return 'Groups are rotating!';
      case 'group':
        return `${getGameById(comp.config.groupGameId)?.title} — everyone at the TV`;
      case 'finaleReveal':
        return 'Finalists being revealed…';
      case 'finale':
        return `${getGameById(comp.config.finaleGameId)?.title} finale!`;
      case 'trophy':
        return `🏆 Champion: ${standings[0]?.name ?? ''}`;
    }
  };

  return (
    <div className="min-h-screen bg-retro-black px-4 py-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <ExitButton code={comp.code} variant="link" />
          <span className="font-pixel text-[10px] text-retro-gold">{comp.name.toUpperCase()}</span>
        </div>
        <ConnectionBadge connection={connection} />
      </div>
      <div className="flex items-center justify-between mb-4">
        <p className="font-retro text-2xl text-retro-cyan">{phaseLine()}</p>
        {comp.phase === 'rotation' && <Countdown comp={comp} className="text-2xl" />}
      </div>

      {comp.phase === 'rotation' && (
        <div className="mb-4 space-y-1">
          {comp.groups.map((g) => {
            const station = stationForGroup(comp, g.id, comp.currentRound);
            const game = station ? getGameById(station.gameId) : undefined;
            return (
              <p key={g.id} className="font-retro text-xl">
                <span style={{ color: g.color }}>{g.name}</span>
                <span className="text-white"> → {game?.title}</span>
              </p>
            );
          })}
        </div>
      )}

      <Standings comp={comp} standings={standings} highlight={comp.finalists} />
    </div>
  );
}
