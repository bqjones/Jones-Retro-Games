import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCompetition } from '../../hooks/useCompetition';
import { getGameById } from '../../lib/games';
import {
  assignGroups,
  formatValue,
  pickFinalists,
  timeRemaining,
  totalRounds,
} from '../../lib/competition';
import type { Competition, Run } from '../../types/competition';
import { Countdown } from '../../components/compete/Countdown';
import { ConnectionBadge } from '../../components/compete/ConnectionBadge';

/** What the one big button does next, given the current phase. */
function nextAction(comp: Competition): {
  label: string;
  hint: string;
  /** Low-stakes actions skip the tap-again confirmation. */
  confirm?: boolean;
  apply: (c: Competition, runs: Run[]) => void;
} | null {
  const rounds = totalRounds(comp);
  switch (comp.phase) {
    case 'lobby':
      return {
        label: 'START ROTATION 1',
        hint: 'Groups head to their first station',
        apply: (c) => {
          c.phase = 'rotation';
          c.currentRound = 0;
          c.phaseEndsAt = Date.now() + c.config.rotationMinutes * 60_000;
          c.paused = false;
          c.pausedRemainingMs = null;
        },
      };
    case 'rotation': {
      const last = comp.currentRound >= rounds - 1;
      return {
        label: `END ROTATION ${comp.currentRound + 1}`,
        hint: last ? 'Then everyone gathers at the TV' : 'The TV will tell groups where to go next',
        apply: (c) => {
          c.phase = 'rotate';
          c.phaseEndsAt = null;
          c.paused = false;
          c.pausedRemainingMs = null;
        },
      };
    }
    case 'rotate': {
      const nextRound = comp.currentRound + 1;
      if (nextRound < rounds) {
        return {
          label: `START ROTATION ${nextRound + 1}`,
          hint: 'When every group is at its new station',
          apply: (c) => {
            c.phase = 'rotation';
            c.currentRound = nextRound;
            c.phaseEndsAt = Date.now() + c.config.rotationMinutes * 60_000;
          },
        };
      }
      return {
        label: `START ${getGameById(comp.config.groupGameId)?.title.toUpperCase() ?? 'GROUP GAME'}`,
        hint: 'Whole family plays together on the TV',
        apply: (c) => {
          c.phase = 'group';
          c.phaseEndsAt = null;
        },
      };
    }
    case 'group':
      return {
        label: 'START FINALE REVEAL',
        hint: 'Locks in the finalists from the standings',
        apply: (c, runs) => {
          c.finalists = pickFinalists(c, runs);
          c.revealedCount = 0;
          c.phase = 'finaleReveal';
        },
      };
    case 'finaleReveal':
      if (comp.revealedCount < comp.finalists.length) {
        return {
          label: 'REVEAL NEXT FINALIST',
          hint: `${comp.finalists.length - comp.revealedCount} still hidden — build the drama`,
          confirm: false,
          apply: (c) => {
            c.revealedCount++;
          },
        };
      }
      return {
        label: 'START THE FINALE',
        hint: `Finalists play ${getGameById(comp.config.finaleGameId)?.title} on the TV, lowest seed first`,
        apply: (c) => {
          c.phase = 'finale';
        },
      };
    case 'finale':
      return {
        label: 'CROWN THE CHAMPION',
        hint: 'Trophy screen + confetti. No going back after the glory.',
        apply: (c) => {
          c.phase = 'trophy';
        },
      };
    case 'trophy':
      return null;
  }
}

/** Reverse transition for accidental taps. */
function goBack(c: Competition): void {
  switch (c.phase) {
    case 'rotation':
      if (c.currentRound === 0) {
        c.phase = 'lobby';
      } else {
        c.phase = 'rotate';
        c.currentRound = c.currentRound - 1;
      }
      c.phaseEndsAt = null;
      break;
    case 'rotate':
      c.phase = 'rotation';
      c.phaseEndsAt = Date.now(); // restart expired; host can add time
      break;
    case 'group':
      c.phase = 'rotate';
      c.currentRound = totalRounds(c) - 1;
      break;
    case 'finaleReveal':
      c.phase = 'group';
      c.finalists = [];
      c.revealedCount = 0;
      break;
    case 'finale':
      c.phase = 'finaleReveal';
      break;
    case 'trophy':
      c.phase = 'finale';
      break;
    case 'lobby':
      break;
  }
}

const PHASE_LABEL: Record<Competition['phase'], string> = {
  lobby: 'Lobby — waiting to start',
  rotation: 'Rotation in progress',
  rotate: 'Groups are rotating',
  group: 'Group game on the TV',
  finaleReveal: 'Revealing finalists',
  finale: 'Finale in progress',
  trophy: 'Champion crowned!',
};

export function HostView() {
  const { code = '' } = useParams();
  const api = useCompetition(code);
  const { comp, runs } = api;
  const [armed, setArmed] = useState(false);
  const [showFix, setShowFix] = useState(false);
  const [editingRun, setEditingRun] = useState<Run | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(t);
  }, [armed]);

  if (!comp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-retro-black px-6 text-center">
        <p className="font-pixel text-sm text-retro-accent">COMPETITION NOT FOUND ON THIS DEVICE</p>
      </div>
    );
  }

  const action = nextAction(comp);
  const inRotation = comp.phase === 'rotation';
  const byId = new Map(comp.players.map((p) => [p.id, p]));
  const gameName = (stationId: string) =>
    stationId === 'finale'
      ? 'Finale'
      : getGameById(comp.stations.find((s) => s.id === stationId)?.gameId ?? '')?.title ?? '?';

  const bigTap = () => {
    if (!action) return;
    if (action.confirm !== false && !armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    api.updateComp((c) => action.apply(c, runs));
  };

  return (
    <div className="min-h-screen bg-retro-black px-4 py-4 max-w-md mx-auto">
      {/* Status */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-pixel text-[10px] text-retro-gold">HOST REMOTE</span>
        <ConnectionBadge connection={api.connection} />
      </div>
      <p className="font-retro text-2xl text-retro-cyan mb-1">{PHASE_LABEL[comp.phase]}</p>
      {inRotation && <Countdown comp={comp} className="text-4xl mb-2" />}

      {/* The one big button */}
      {action ? (
        <button
          onClick={bigTap}
          className={`w-full font-pixel text-base px-4 py-8 border-4 mb-2 transition-colors ${
            armed
              ? 'border-retro-accent bg-retro-accent text-white animate-pulse'
              : 'border-retro-green bg-retro-purple text-retro-green'
          }`}
        >
          {armed ? 'TAP AGAIN TO CONFIRM' : action.label}
        </button>
      ) : (
        <p className="font-pixel text-sm text-retro-gold text-center py-8">
          🏆 THAT'S A WRAP! GREAT HOSTING.
        </p>
      )}
      {action && <p className="font-retro text-xl text-retro-blue text-center mb-6">{action.hint}</p>}

      {/* Timer tools */}
      {inRotation && (
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            onClick={() =>
              api.updateComp((c) => {
                if (c.paused) {
                  c.phaseEndsAt = Date.now() + (c.pausedRemainingMs ?? 0);
                  c.paused = false;
                  c.pausedRemainingMs = null;
                } else {
                  c.pausedRemainingMs = timeRemaining(c, Date.now());
                  c.paused = true;
                }
              })
            }
            className="font-pixel text-xs text-retro-cyan border-2 border-retro-blue py-3"
          >
            {comp.paused ? '▶ RESUME' : '⏸ PAUSE'}
          </button>
          <button
            onClick={() =>
              api.updateComp((c) => {
                if (c.paused) {
                  c.pausedRemainingMs = (c.pausedRemainingMs ?? 0) + 120_000;
                } else {
                  c.phaseEndsAt = Math.max(c.phaseEndsAt ?? Date.now(), Date.now()) + 120_000;
                }
              })
            }
            className="font-pixel text-xs text-retro-cyan border-2 border-retro-blue py-3"
          >
            +2 MIN
          </button>
        </div>
      )}

      {/* Lobby tools */}
      {comp.phase === 'lobby' && (
        <button
          onClick={() =>
            api.updateComp((c) => {
              const { players, groups } = assignGroups(
                c.players.map((p) => p.name),
                c.stations.length
              );
              c.players = players;
              c.groups = groups;
            })
          }
          className="w-full font-pixel text-xs text-retro-cyan border-2 border-retro-blue py-3 mb-6"
        >
          🔀 RESHUFFLE GROUPS
        </button>
      )}

      {/* Fix a score */}
      <button
        onClick={() => setShowFix(!showFix)}
        className="w-full font-pixel text-xs text-retro-gold border-2 border-retro-gold py-3 mb-3"
      >
        {showFix ? 'HIDE SCORE FIXER' : '🔧 FIX A SCORE'}
      </button>
      {showFix && (
        <div className="space-y-2 mb-6">
          {[...runs]
            .sort((a, b) => b.ts - a.ts)
            .slice(0, 15)
            .map((r) =>
              editingRun?.id === r.id ? (
                <div key={r.id} className="border-2 border-retro-gold bg-retro-dark p-3">
                  <p className="font-retro text-xl text-white mb-2">
                    {byId.get(r.playerId)?.name} — {gameName(r.stationId)}
                  </p>
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
                    inputMode="numeric"
                    className="w-full bg-retro-black border-2 border-retro-blue font-pixel text-lg text-retro-green px-3 py-2 mb-2"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        const v = parseInt(editValue || '0', 10);
                        api.upsertRun({ ...r, value: v, dnf: false });
                        setEditingRun(null);
                      }}
                      className="font-pixel text-[10px] text-retro-black bg-retro-green py-2"
                    >
                      SAVE
                    </button>
                    <button
                      onClick={() => {
                        api.deleteRun(r.id);
                        setEditingRun(null);
                      }}
                      className="font-pixel text-[10px] text-white bg-retro-accent py-2"
                    >
                      DELETE
                    </button>
                    <button
                      onClick={() => setEditingRun(null)}
                      className="font-pixel text-[10px] text-retro-cyan border border-retro-blue py-2"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  key={r.id}
                  onClick={() => {
                    setEditingRun(r);
                    setEditValue(String(r.value));
                  }}
                  className="w-full flex justify-between items-center border-2 border-retro-blue bg-retro-dark px-3 py-2"
                >
                  <span className="font-retro text-xl text-white truncate">
                    {byId.get(r.playerId)?.name} · {gameName(r.stationId)}
                  </span>
                  <span className="font-pixel text-[10px] text-retro-green">
                    {r.dnf ? 'DNF' : formatValue(r.stationId === 'finale' ? 'score' : (comp.stations.find((s) => s.id === r.stationId)?.metric ?? 'score'), r.value)}
                  </span>
                </button>
              )
            )}
          {runs.length === 0 && (
            <p className="font-retro text-xl text-retro-blue text-center">No runs recorded yet</p>
          )}
        </div>
      )}

      {/* Oops */}
      {comp.phase !== 'lobby' && (
        <button
          onClick={() => api.updateComp((c) => goBack(c))}
          className="w-full font-pixel text-[10px] text-retro-blue border border-retro-blue py-2 opacity-70"
        >
          ← OOPS, GO BACK A STEP
        </button>
      )}
    </div>
  );
}
