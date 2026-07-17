import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameLibrary, getGameById } from '../../lib/games';
import { createCompetition, metricForGame } from '../../lib/competition';
import { acquireStore, releaseStore } from '../../lib/sync/store';

const DEFAULT_STATIONS = ['digger', 'snipes', 'castle-adventure'];

export function SetupWizard() {
  const navigate = useNavigate();
  const [name, setName] = useState('Jones Family Showdown');
  const [names, setNames] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [stationGames, setStationGames] = useState<string[]>(DEFAULT_STATIONS);
  const [rotationMinutes, setRotationMinutes] = useState(15);
  const [groupGameId, setGroupGameId] = useState('oregon-trail');
  const [finaleGameId, setFinaleGameId] = useState('digger');
  const [error, setError] = useState('');

  const addName = () => {
    const n = nameInput.trim();
    if (!n) return;
    if (names.some((x) => x.toLowerCase() === n.toLowerCase())) {
      setError(`${n} is already on the roster`);
      return;
    }
    setError('');
    setNames([...names, n]);
    setNameInput('');
  };

  const toggleStation = (gameId: string) => {
    setError('');
    if (stationGames.includes(gameId)) {
      setStationGames(stationGames.filter((g) => g !== gameId));
    } else if (stationGames.length < 3) {
      setStationGames([...stationGames, gameId]);
    } else {
      setError('Max 3 stations — remove one first');
    }
  };

  const create = () => {
    if (names.length < 2) {
      setError('Add at least 2 players');
      return;
    }
    if (stationGames.length < 2) {
      setError('Pick 2 or 3 station games');
      return;
    }
    const comp = createCompetition(name.trim() || 'Family Showdown', names, stationGames, {
      rotationMinutes,
      groupGameId,
      finaleGameId,
      finalistCount: Math.min(5, names.length),
    });
    const store = acquireStore(comp.code);
    store.createComp(comp);
    releaseStore(comp.code);
    navigate(`/compete/${comp.code}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="font-pixel text-lg text-retro-gold text-glow mb-8 mt-2 text-center">
        NEW COMPETITION
      </h2>

      {/* Event name */}
      <section className="mb-8">
        <label className="font-pixel text-xs text-retro-cyan block mb-2">EVENT NAME</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-retro-dark border-2 border-retro-blue font-retro text-2xl text-white px-4 py-2 outline-none focus:border-retro-cyan"
        />
      </section>

      {/* Roster */}
      <section className="mb-8">
        <label className="font-pixel text-xs text-retro-cyan block mb-2">
          PLAYERS ({names.length})
        </label>
        <div className="flex gap-2 mb-3">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addName()}
            placeholder="Add a player name…"
            className="flex-1 bg-retro-dark border-2 border-retro-blue font-retro text-2xl text-white px-4 py-2 outline-none focus:border-retro-cyan"
          />
          <button onClick={addName} className="btn-retro">
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {names.map((n) => (
            <button
              key={n}
              onClick={() => setNames(names.filter((x) => x !== n))}
              title="Remove"
              className="font-retro text-xl text-white bg-retro-purple border-2 border-retro-blue px-3 py-1 hover:border-retro-accent hover:text-retro-accent"
            >
              {n} ✕
            </button>
          ))}
        </div>
        <p className="font-retro text-lg text-retro-blue mt-2">
          Groups are assigned automatically — one group per station. Tap a name to remove it.
        </p>
      </section>

      {/* Stations */}
      <section className="mb-8">
        <label className="font-pixel text-xs text-retro-cyan block mb-2">
          ROTATION STATIONS ({stationGames.length}/3) — one laptop or iPad each
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {gameLibrary.map((g) => {
            const selected = stationGames.includes(g.id);
            return (
              <button
                key={g.id}
                onClick={() => toggleStation(g.id)}
                className={`text-left border-2 p-2 ${
                  selected
                    ? 'border-retro-green bg-retro-purple'
                    : 'border-retro-blue bg-retro-dark opacity-70'
                }`}
              >
                <span className="font-retro text-xl text-white block truncate">{g.title}</span>
                <span className={`font-pixel text-[9px] ${selected ? 'text-retro-green' : 'text-retro-blue'}`}>
                  {selected ? (metricForGame(g.id) === 'time' ? 'FASTEST TIME' : 'HIGH SCORE') : 'TAP TO ADD'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Round length + special games */}
      <section className="mb-8 grid md:grid-cols-3 gap-6">
        <div>
          <label className="font-pixel text-xs text-retro-cyan block mb-2">ROUND LENGTH</label>
          <div className="flex gap-2">
            {[10, 12, 15, 20].map((m) => (
              <button
                key={m}
                onClick={() => setRotationMinutes(m)}
                className={`font-pixel text-xs px-3 py-2 border-2 ${
                  rotationMinutes === m
                    ? 'border-retro-green text-retro-green'
                    : 'border-retro-blue text-retro-blue'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="font-pixel text-xs text-retro-cyan block mb-2">GROUP GAME (ON TV)</label>
          <select
            value={groupGameId}
            onChange={(e) => setGroupGameId(e.target.value)}
            className="w-full bg-retro-dark border-2 border-retro-blue font-retro text-xl text-white px-3 py-2"
          >
            {gameLibrary.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-pixel text-xs text-retro-cyan block mb-2">FINALE GAME</label>
          <select
            value={finaleGameId}
            onChange={(e) => setFinaleGameId(e.target.value)}
            className="w-full bg-retro-dark border-2 border-retro-blue font-retro text-xl text-white px-3 py-2"
          >
            {gameLibrary.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Summary + create */}
      <section className="mb-12 text-center">
        {stationGames.length >= 2 && (
          <p className="font-retro text-xl text-retro-cyan mb-4">
            {stationGames.length} rounds of {rotationMinutes} min, then{' '}
            {getGameById(groupGameId)?.title} together, then a {getGameById(finaleGameId)?.title}{' '}
            finale for the top {Math.min(5, Math.max(2, names.length))}.
          </p>
        )}
        {error && <p className="font-pixel text-xs text-retro-accent mb-4">{error}</p>}
        <button onClick={create} className="btn-retro text-base px-8 py-4">
          Create competition
        </button>
      </section>
    </div>
  );
}
