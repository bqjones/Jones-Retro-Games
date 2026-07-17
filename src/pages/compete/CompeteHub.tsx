import { Link, useParams } from 'react-router-dom';
import { useCompetition } from '../../hooks/useCompetition';
import { getGameById } from '../../lib/games';
import { playersInGroup } from '../../lib/competition';
import { ConnectionBadge } from '../../components/compete/ConnectionBadge';

export function CompeteHub() {
  const { code = '' } = useParams();
  const { comp, connection } = useCompetition(code);

  if (!comp) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <p className="font-pixel text-sm text-retro-accent mb-4">
          {connection === 'local' ? 'COMPETITION NOT ON THIS DEVICE' : 'LOOKING FOR ' + code.toUpperCase() + '…'}
        </p>
        <p className="font-retro text-2xl text-retro-cyan mb-6">
          {connection === 'local'
            ? 'Without online sync set up, each device only sees competitions created on it. See SUPABASE.md to enable cross-device sync.'
            : 'If nothing loads, double-check the code.'}
        </p>
        <Link to="/compete" className="btn-retro">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8 mt-2">
        <h2 className="font-pixel text-lg text-retro-gold text-glow mb-3">{comp.name.toUpperCase()}</h2>
        <p className="font-retro text-2xl text-retro-cyan">
          Join code: <span className="font-pixel text-base text-retro-green">{comp.code}</span>
          <span className="mx-3">·</span>
          <ConnectionBadge connection={connection} />
        </p>
      </div>

      {/* Screens */}
      <div className="grid md:grid-cols-2 gap-3 mb-10">
        <Link to={`/compete/${comp.code}/tv`} className="bg-retro-dark border-2 border-retro-accent p-4 hover:shadow-[0_0_20px] hover:shadow-retro-accent">
          <span className="font-pixel text-sm text-retro-accent block mb-1">📺 TV DISPLAY</span>
          <span className="font-retro text-xl text-retro-cyan">
            The emcee. Put this on the big screen — code, timers, rotations, finale.
          </span>
        </Link>
        <Link to={`/compete/${comp.code}/host`} className="bg-retro-dark border-2 border-retro-gold p-4 hover:shadow-[0_0_20px] hover:shadow-retro-gold">
          <span className="font-pixel text-sm text-retro-gold block mb-1">🎙️ HOST REMOTE</span>
          <span className="font-retro text-xl text-retro-cyan">
            For the emcee-in-chief's phone. One button moves the night forward.
          </span>
        </Link>
        {comp.stations.map((s, i) => {
          const game = getGameById(s.gameId);
          return (
            <Link
              key={s.id}
              to={`/compete/${comp.code}/station/${s.id}`}
              className="bg-retro-dark border-2 border-retro-green p-4 hover:shadow-[0_0_20px] hover:shadow-retro-green"
            >
              <span className="font-pixel text-sm text-retro-green block mb-1">
                🕹️ STATION {i + 1}: {game?.title.toUpperCase()}
              </span>
              <span className="font-retro text-xl text-retro-cyan">
                Open on the laptop that runs {game?.title}.{' '}
                {s.metric === 'time' ? 'Fastest time wins.' : 'High score wins.'}
              </span>
            </Link>
          );
        })}
        <Link to={`/compete/${comp.code}/board`} className="bg-retro-dark border-2 border-retro-cyan p-4 hover:shadow-[0_0_20px] hover:shadow-retro-cyan">
          <span className="font-pixel text-sm text-retro-cyan block mb-1">📱 LEADERBOARD</span>
          <span className="font-retro text-xl text-retro-cyan">
            Live standings for everyone else's phone. Watch from the couch (or the dinner table).
          </span>
        </Link>
      </div>

      {/* Groups */}
      <div className="mb-12">
        <p className="font-pixel text-xs text-retro-cyan mb-3">GROUPS</p>
        <div className={`grid gap-3 ${comp.groups.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {comp.groups.map((g) => (
            <div key={g.id} className="bg-retro-dark border-2 p-3" style={{ borderColor: g.color }}>
              <p className="font-pixel text-xs mb-2" style={{ color: g.color }}>
                {g.name.toUpperCase()}
              </p>
              {playersInGroup(comp, g.id).map((p) => (
                <p key={p.id} className="font-retro text-xl text-white">
                  {p.name}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
