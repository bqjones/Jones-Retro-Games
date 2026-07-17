import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCompetition } from '../../hooks/useCompetition';
import { getGameById } from '../../lib/games';
import {
  formatValue,
  makeRun,
  playersInGroup,
  stationForGroup,
  totalRounds,
} from '../../lib/competition';
import type { Competition, Player, Run } from '../../types/competition';
import { Countdown } from '../../components/compete/Countdown';
import { Standings } from '../../components/compete/Standings';
import { GameFrame } from '../../components/compete/GameFrame';
import { ScorePad } from '../../components/compete/ScorePad';
import { ConnectionBadge } from '../../components/compete/ConnectionBadge';
import { ExitButton } from '../../components/compete/ExitButton';
import { playFanfare, playRotationChime, playStinger } from '../../lib/sound';
import type { Standing } from '../../types/competition';

export function TvView() {
  const { code = '' } = useParams();
  const api = useCompetition(code);
  const { comp, standings, connection } = api;
  const [audioReady, setAudioReady] = useState(false);

  // Browsers require a user gesture before audio; one click on the TV arms it.
  useEffect(() => {
    const arm = () => setAudioReady(true);
    window.addEventListener('pointerdown', arm, { once: true });
    return () => window.removeEventListener('pointerdown', arm);
  }, []);

  // Phase-entry sound cues
  const prevPhase = useRef<string | null>(null);
  const prevRevealed = useRef(0);
  useEffect(() => {
    if (!comp || !audioReady) return;
    if (prevPhase.current !== comp.phase) {
      if (comp.phase === 'rotate') playRotationChime();
      if (comp.phase === 'trophy') playFanfare();
      prevPhase.current = comp.phase;
    }
    if (comp.revealedCount > prevRevealed.current) playStinger();
    prevRevealed.current = comp.revealedCount;
  }, [comp, audioReady]);

  if (!comp) {
    return (
      <div className="h-screen flex items-center justify-center bg-retro-black">
        <p className="font-pixel text-sm text-retro-accent">COMPETITION {code.toUpperCase()} NOT FOUND ON THIS DEVICE</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-retro-black overflow-hidden crt-effect">
      {/* Top strip */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b-2 border-retro-purple bg-retro-dark">
        <span className="font-pixel text-sm text-retro-gold">{comp.name.toUpperCase()}</span>
        <div className="flex items-center gap-4">
          {!audioReady && (
            <span className="font-pixel text-[9px] text-retro-accent animate-pulse">CLICK ANYWHERE FOR SOUND</span>
          )}
          <ConnectionBadge connection={connection} />
          <span className="font-pixel text-sm text-retro-green">CODE: {comp.code}</span>
          <ExitButton code={comp.code} variant="discreet" />
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {comp.phase === 'lobby' && <LobbyScreen comp={comp} />}
        {(comp.phase === 'rotation' || comp.phase === 'rotate') && (
          <RotationScreen comp={comp} standings={standings} />
        )}
        {comp.phase === 'group' && <GroupScreen comp={comp} />}
        {comp.phase === 'finaleReveal' && <RevealScreen comp={comp} standings={standings} />}
        {comp.phase === 'finale' && (
          <FinaleScreen comp={comp} runs={api.runs} addRun={api.addRun} />
        )}
        {comp.phase === 'trophy' && <TrophyScreen comp={comp} standings={standings} />}
      </div>
    </div>
  );
}

// ── Lobby ──

function LobbyScreen({ comp }: { comp: Competition }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 px-8">
      <p className="font-pixel text-xl text-retro-cyan text-glow">GET READY TO PLAY</p>
      <div className="text-center">
        <p className="font-retro text-3xl text-retro-cyan mb-2">Join code</p>
        <p className="font-pixel text-6xl text-retro-green text-glow tracking-widest">{comp.code}</p>
      </div>
      <div className={`grid gap-6 w-full max-w-4xl ${comp.groups.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {comp.groups.map((g) => (
          <div key={g.id} className="bg-retro-dark border-4 p-4 text-center" style={{ borderColor: g.color }}>
            <p className="font-pixel text-sm mb-3" style={{ color: g.color }}>
              {g.name.toUpperCase()}
            </p>
            {playersInGroup(comp, g.id).map((p) => (
              <p key={p.id} className="font-retro text-3xl text-white">
                {p.name}
              </p>
            ))}
          </div>
        ))}
      </div>
      <p className="font-retro text-2xl text-retro-blue">First rotation starts when the host says go…</p>
    </div>
  );
}

// ── Rotation + rotate interstitial ──

function RotationScreen({ comp, standings }: { comp: Competition; standings: Standing[] }) {
  const rotating = comp.phase === 'rotate';
  const displayRound = rotating ? comp.currentRound + 1 : comp.currentRound;
  const isLastRound = comp.currentRound >= totalRounds(comp) - 1;

  return (
    <div className="h-full flex">
      {/* Left: round info + assignments */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
        {rotating ? (
          <>
            <p className="font-pixel text-4xl text-retro-accent text-glow animate-pulse">
              {isLastRound ? 'ROTATIONS DONE!' : 'ROTATE!'}
            </p>
            {!isLastRound && (
              <p className="font-retro text-3xl text-retro-cyan">Head to your next station:</p>
            )}
            {isLastRound && (
              <p className="font-retro text-3xl text-retro-cyan">
                Everyone to the TV for {getGameById(comp.config.groupGameId)?.title}!
              </p>
            )}
          </>
        ) : (
          <>
            <p className="font-pixel text-lg text-retro-cyan">
              ROTATION {comp.currentRound + 1} OF {totalRounds(comp)}
            </p>
            <Countdown comp={comp} withSound className="text-7xl" />
          </>
        )}

        {(!rotating || !isLastRound) && (
          <div className="w-full max-w-2xl space-y-3">
            {comp.groups.map((g) => {
              const station = stationForGroup(comp, g.id, rotating ? displayRound : comp.currentRound);
              const game = station ? getGameById(station.gameId) : undefined;
              const si = comp.stations.findIndex((s) => s.id === station?.id);
              return (
                <div key={g.id} className="flex items-center gap-4 bg-retro-dark border-2 px-5 py-3" style={{ borderColor: g.color }}>
                  <span className="font-pixel text-sm w-40" style={{ color: g.color }}>
                    {g.name.toUpperCase()}
                  </span>
                  <span className="font-retro text-3xl text-white flex-1">
                    → Station {si + 1}: {game?.title}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: standings */}
      <div className="w-[420px] shrink-0 border-l-2 border-retro-purple p-5 overflow-y-auto">
        <p className="font-pixel text-xs text-retro-gold mb-3">STANDINGS</p>
        <Standings comp={comp} standings={standings} />
      </div>
    </div>
  );
}

// ── Group game (Oregon Trail on the TV) ──

function GroupScreen({ comp }: { comp: Competition }) {
  const [started, setStarted] = useState(false);
  const game = getGameById(comp.config.groupGameId);

  if (!started) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-8 px-8 text-center">
        <p className="font-pixel text-2xl text-retro-gold text-glow">{game?.title.toUpperCase()}</p>
        <div className="max-w-2xl space-y-4">
          <p className="font-retro text-3xl text-retro-cyan">Everyone plays this one together!</p>
          <p className="font-retro text-3xl text-white">
            One driver on the keyboard at a time — switch drivers at every landmark or when the
            wagon stops. Everyone else: shout your advice.
          </p>
          <p className="font-retro text-2xl text-retro-gold">
            Pro tip from the old days: name your party after the grownups at dinner.
          </p>
        </div>
        <button onClick={() => setStarted(true)} className="btn-retro text-base px-8 py-4">
          Start the game
        </button>
      </div>
    );
  }

  return <GameFrame gameId={comp.config.groupGameId} label={`${game?.title} — whole family run`} />;
}

// ── Finale reveal ──

function RevealScreen({ comp, standings }: { comp: Competition; standings: Standing[] }) {
  const byId = new Map(standings.map((s) => [s.playerId, s]));
  const n = comp.finalists.length;
  // Reveal from lowest seed up: revealedCount=1 shows seed n, etc.
  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 px-8">
      <p className="font-pixel text-2xl text-retro-gold text-glow">THE FINALISTS</p>
      <p className="font-retro text-3xl text-retro-cyan">
        Top {n} move on to the {getGameById(comp.config.finaleGameId)?.title} finale…
      </p>
      <div className="w-full max-w-2xl space-y-3">
        {comp.finalists.map((pid, seedIdx) => {
          const revealed = seedIdx >= n - comp.revealedCount;
          const s = byId.get(pid);
          return (
            <div
              key={pid}
              className={`flex items-center gap-4 border-4 px-6 py-4 ${
                revealed ? 'border-retro-gold bg-retro-purple' : 'border-retro-blue bg-retro-dark'
              }`}
            >
              <span className="font-pixel text-lg text-retro-cyan w-12">#{seedIdx + 1}</span>
              <span className={`font-retro text-4xl flex-1 ${revealed ? 'text-white' : 'text-retro-blue'}`}>
                {revealed ? s?.name : '???'}
              </span>
              {revealed && (
                <span className="font-pixel text-sm text-retro-green">{s?.points} PTS</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Finale: play on the TV ──

function FinaleScreen({
  comp,
  runs,
  addRun,
}: {
  comp: Competition;
  runs: Run[];
  addRun: (run: Run) => void;
}) {
  const [entering, setEntering] = useState<Player | null>(null);
  const game = getGameById(comp.config.finaleGameId);

  const finaleRuns = runs.filter((r) => r.stationId === 'finale');
  const played = new Set(finaleRuns.map((r) => r.playerId));
  // Play in reverse seed order: worst seed first, champion contender last.
  const order = [...comp.finalists].reverse();
  const current = comp.players.find((p) => p.id === order.find((pid) => !played.has(pid)));
  const byId = new Map(comp.players.map((p) => [p.id, p]));

  if (entering) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <ScorePad
          metric="score"
          playerName={entering.name}
          gameTitle={game?.title ?? ''}
          onSubmit={(value) => {
            addRun(makeRun(comp.code, entering.id, 'finale', -1, value));
            setEntering(null);
          }}
          onCancel={() => setEntering(null)}
        />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6">
        <p className="font-pixel text-2xl text-retro-gold text-glow">ALL FINALE RUNS DONE</p>
        <div className="w-full max-w-xl space-y-2">
          {finaleRuns
            .sort((a, b) => b.value - a.value)
            .map((r) => (
              <div key={r.id} className="flex justify-between bg-retro-dark border-2 border-retro-blue px-5 py-2">
                <span className="font-retro text-3xl text-white">{byId.get(r.playerId)?.name}</span>
                <span className="font-pixel text-base text-retro-green">{formatValue('score', r.value)}</span>
              </div>
            ))}
        </div>
        <p className="font-retro text-2xl text-retro-cyan">Host: hit the trophy button!</p>
      </div>
    );
  }

  return (
    <GameFrame
      gameId={comp.config.finaleGameId}
      label={`FINALE — ${current.name}, you're up!`}
      barContent={
        <button
          onClick={() => setEntering(current)}
          className="font-pixel text-[10px] text-retro-black bg-retro-green px-3 py-1.5"
        >
          RUN OVER — ENTER SCORE
        </button>
      }
    />
  );
}

// ── Trophy ──

const CONFETTI_COLORS = ['#e94560', '#ffd700', '#39ff14', '#00fff7', '#ffffff'];

function TrophyScreen({ comp, standings }: { comp: Competition; standings: Standing[] }) {
  const champion = standings[0];
  return (
    <div className="h-full relative flex flex-col items-center justify-center gap-6 px-8 overflow-hidden">
      {/* Pixel confetti */}
      {Array.from({ length: 60 }).map((_, i) => (
        <span
          key={i}
          className="absolute w-2.5 h-2.5 animate-confetti"
          style={{
            left: `${(i * 137.5) % 100}%`,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${(i % 20) * 0.35}s`,
            animationDuration: `${3 + (i % 5)}s`,
          }}
        />
      ))}
      <p className="font-pixel text-xl text-retro-cyan">FAMILY CHAMPION</p>
      <p className="text-7xl">🏆</p>
      <p className="font-pixel text-4xl text-retro-gold text-glow text-center">{champion?.name}</p>
      <p className="font-retro text-3xl text-retro-green">{champion?.totalPoints} points</p>
      <div className="w-full max-w-xl max-h-[35vh] overflow-y-auto">
        <Standings comp={comp} standings={standings} />
      </div>
    </div>
  );
}
