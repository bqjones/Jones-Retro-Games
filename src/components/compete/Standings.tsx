import type { Competition, Standing } from '../../types/competition';

interface StandingsProps {
  comp: Competition;
  standings: Standing[];
  /** Larger text for the TV. */
  big?: boolean;
  limit?: number;
  /** Highlight these player ids (e.g. finalists). */
  highlight?: string[];
}

export function Standings({ comp, standings, big = false, limit, highlight = [] }: StandingsProps) {
  const rows = limit ? standings.slice(0, limit) : standings;
  const groupById = new Map(comp.groups.map((g) => [g.id, g]));

  return (
    <div className="space-y-1">
      {rows.map((s) => {
        const group = groupById.get(s.groupId);
        const isTop = s.rank === 1 && s.totalPoints > 0;
        const hl = highlight.includes(s.playerId);
        return (
          <div
            key={s.playerId}
            className={`flex items-center gap-3 border-2 px-3 ${big ? 'py-2' : 'py-1.5'} ${
              isTop
                ? 'border-retro-gold bg-retro-purple'
                : hl
                  ? 'border-retro-cyan bg-retro-purple'
                  : 'border-retro-blue bg-retro-dark'
            }`}
          >
            <span
              className={`font-pixel ${big ? 'text-base w-10' : 'text-xs w-7'} text-right ${
                isTop ? 'text-retro-gold' : 'text-retro-cyan'
              }`}
            >
              {s.rank}
            </span>
            <span
              className="inline-block w-3 h-3 shrink-0"
              style={{ backgroundColor: group?.color }}
              title={group?.name}
            />
            <span className={`font-retro truncate flex-1 ${big ? 'text-3xl' : 'text-xl'} text-white`}>
              {s.name}
            </span>
            {s.finalePoints > 0 && (
              <span className={`font-retro ${big ? 'text-xl' : 'text-sm'} text-retro-accent`}>
                +{s.finalePoints}
              </span>
            )}
            <span className={`font-pixel ${big ? 'text-base' : 'text-xs'} ${isTop ? 'text-retro-gold' : 'text-retro-green'}`}>
              {s.totalPoints} PTS
            </span>
          </div>
        );
      })}
      {rows.length === 0 && (
        <p className="font-retro text-xl text-retro-blue text-center py-4">No scores yet</p>
      )}
    </div>
  );
}
