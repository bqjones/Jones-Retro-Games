import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCompetition } from '../../hooks/useCompetition';
import { getGameById } from '../../lib/games';
import {
  formatValue,
  groupAtStation,
  makeRun,
  nextUp,
  playersInGroup,
  runsForStationRound,
  totalRounds,
} from '../../lib/competition';
import { Countdown } from '../../components/compete/Countdown';
import { ScorePad } from '../../components/compete/ScorePad';
import { GameFrame } from '../../components/compete/GameFrame';
import { ConnectionBadge } from '../../components/compete/ConnectionBadge';

type Mode = { kind: 'queue' } | { kind: 'playing'; playerId: string; round: number } | { kind: 'entering'; playerId: string; round: number };

export function StationView() {
  const { code = '', stationId = '' } = useParams();
  const api = useCompetition(code);
  const { comp, runs } = api;
  const [mode, setMode] = useState<Mode>({ kind: 'queue' });

  if (!comp) {
    return (
      <div className="h-screen flex items-center justify-center bg-retro-black">
        <p className="font-pixel text-sm text-retro-accent">COMPETITION NOT FOUND ON THIS DEVICE</p>
      </div>
    );
  }

  const station = comp.stations.find((s) => s.id === stationId);
  const stationIndex = comp.stations.findIndex((s) => s.id === stationId);
  if (!station) {
    return (
      <div className="h-screen flex items-center justify-center bg-retro-black">
        <p className="font-pixel text-sm text-retro-accent">UNKNOWN STATION</p>
      </div>
    );
  }
  const game = getGameById(station.gameId);
  const inRotation = comp.phase === 'rotation';
  const round = comp.currentRound;
  const group = groupAtStation(comp, station.id, round);
  const members = group ? playersInGroup(comp, group.id) : [];
  const roundRuns = runsForStationRound(runs, station.id, round);
  const upNext = nextUp(comp, runs, station.id, round);
  const byId = new Map(comp.players.map((p) => [p.id, p]));

  // ── Playing: full-screen game with bar ──
  if (mode.kind === 'playing') {
    const player = byId.get(mode.playerId);
    return (
      <div className="h-screen bg-retro-black">
        <GameFrame
          gameId={station.gameId}
          label={`${player?.name} — GO!`}
          barContent={
            <>
              <Countdown comp={comp} className="text-sm" />
              <button
                onClick={() => setMode({ kind: 'entering', playerId: mode.playerId, round: mode.round })}
                className="font-pixel text-[10px] text-retro-black bg-retro-green px-3 py-1.5"
              >
                RUN OVER — ENTER {station.metric === 'time' ? 'TIME' : 'SCORE'}
              </button>
            </>
          }
        />
      </div>
    );
  }

  // ── Entering: score pad ──
  if (mode.kind === 'entering') {
    const player = byId.get(mode.playerId);
    return (
      <div className="h-screen flex items-center justify-center bg-retro-black px-6">
        <ScorePad
          metric={station.metric}
          playerName={player?.name ?? ''}
          gameTitle={game?.title ?? ''}
          onSubmit={(value, dnf) => {
            api.addRun(makeRun(comp.code, mode.playerId, station.id, mode.round, value, dnf));
            setMode({ kind: 'queue' });
          }}
          onCancel={() => setMode({ kind: 'queue' })}
        />
      </div>
    );
  }

  // ── Queue / idle screen ──
  return (
    <div className="h-screen flex flex-col bg-retro-black">
      <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b-2 border-retro-purple bg-retro-dark">
        <span className="font-pixel text-sm text-retro-green">
          STATION {stationIndex + 1}: {game?.title.toUpperCase()}
        </span>
        <div className="flex items-center gap-4">
          <ConnectionBadge connection={api.connection} />
          {inRotation && <Countdown comp={comp} className="text-2xl" />}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 overflow-y-auto">
        {!inRotation ? (
          <div className="text-center">
            <p className="font-pixel text-lg text-retro-cyan mb-4 animate-pulse">
              {comp.phase === 'lobby' || comp.phase === 'rotate' ? 'WAITING FOR THE HOST…' : 'ROTATIONS ARE DONE'}
            </p>
            {(comp.phase === 'lobby' || comp.phase === 'rotate') && (
              <p className="font-retro text-3xl text-white">
                {(() => {
                  const nextRound = comp.phase === 'lobby' ? 0 : Math.min(comp.currentRound + 1, totalRounds(comp) - 1);
                  const g = groupAtStation(comp, station.id, nextRound);
                  return g ? `${g.name} plays here next` : '';
                })()}
              </p>
            )}
            {(comp.phase === 'group' || comp.phase === 'finaleReveal' || comp.phase === 'finale' || comp.phase === 'trophy') && (
              <p className="font-retro text-3xl text-retro-cyan">Head to the TV!</p>
            )}
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="font-pixel text-xs mb-2" style={{ color: group?.color }}>
                {group?.name.toUpperCase()} — ROTATION {round + 1} OF {totalRounds(comp)}
              </p>
              <p className="font-retro text-4xl text-white">
                Up now: <span className="text-retro-green">{upNext?.name}</span>
              </p>
              <p className="font-retro text-xl text-retro-blue mt-1">
                {station.metric === 'time' ? 'Fastest time wins' : 'Best score counts'} — tap another name if someone else is ready
              </p>
            </div>

            <button
              onClick={() => upNext && setMode({ kind: 'playing', playerId: upNext.id, round })}
              disabled={!upNext}
              className="btn-retro text-lg px-10 py-5"
            >
              ▶ Start {upNext?.name}'s run
            </button>

            <div className="w-full max-w-md space-y-2">
              {members.map((p) => {
                const pRuns = roundRuns.filter((r) => r.playerId === p.id);
                const best = pRuns.reduce<number | null>((acc, r) => {
                  if (r.dnf) return acc;
                  if (acc == null) return r.value;
                  return station.metric === 'time' ? Math.min(acc, r.value) : Math.max(acc, r.value);
                }, null);
                const isNext = p.id === upNext?.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setMode({ kind: 'playing', playerId: p.id, round })}
                    className={`w-full flex items-center justify-between border-2 px-4 py-2 ${
                      isNext ? 'border-retro-green bg-retro-purple' : 'border-retro-blue bg-retro-dark'
                    }`}
                  >
                    <span className="font-retro text-2xl text-white">{p.name}</span>
                    <span className="font-pixel text-xs text-retro-cyan">
                      {pRuns.length === 0
                        ? 'NOT YET'
                        : best == null
                          ? 'DNF'
                          : formatValue(station.metric, best)}
                      {pRuns.length > 1 ? ` (${pRuns.length}x)` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
