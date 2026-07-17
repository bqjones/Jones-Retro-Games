import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listLocalCompetitions } from '../../lib/sync/local';

export function CompeteHome() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const local = listLocalCompetitions();

  const join = () => {
    const c = code.trim().toUpperCase();
    if (c.length >= 4) navigate(`/compete/${c}`);
  };

  return (
    <div className="max-w-xl mx-auto text-center">
      <h2 className="font-pixel text-xl text-retro-gold text-glow mb-2 mt-4">COMPETITION</h2>
      <p className="font-retro text-2xl text-retro-cyan mb-10">
        Family tournament mode — stations, rotations, and one champion
      </p>

      <div className="bg-retro-dark border-2 border-retro-blue p-6 mb-8">
        <p className="font-pixel text-xs text-retro-cyan mb-4">HAVE A CODE? JOIN IN</p>
        <div className="flex gap-3 justify-center">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && join()}
            placeholder="CODE"
            maxLength={5}
            className="w-40 bg-retro-black border-2 border-retro-purple text-center font-pixel text-xl text-retro-green px-3 py-3 uppercase tracking-widest outline-none focus:border-retro-cyan"
          />
          <button onClick={join} className="btn-retro">
            Join
          </button>
        </div>
      </div>

      <Link to="/compete/new" className="btn-retro inline-block mb-10">
        + Set up a new competition
      </Link>

      {local.length > 0 && (
        <div className="text-left">
          <p className="font-pixel text-xs text-retro-cyan mb-3">ON THIS DEVICE</p>
          <div className="space-y-2">
            {local.map((c) => (
              <Link
                key={c.code}
                to={`/compete/${c.code}`}
                className="flex items-center justify-between bg-retro-dark border-2 border-retro-blue hover:border-retro-accent px-4 py-3"
              >
                <span className="font-retro text-2xl text-white">{c.name}</span>
                <span className="font-pixel text-xs text-retro-green">{c.code}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
