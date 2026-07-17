import { Link, Outlet, useLocation } from 'react-router-dom';

export function Layout() {
  const location = useLocation();
  // Full-bleed competition screens (TV, stations, host phone, leaderboard) manage their own chrome
  const isFullscreenCompete = /^\/compete\/[^/]+\/(tv|station|host|board)/.test(location.pathname);
  const isPlaying = location.pathname.startsWith('/play/') || isFullscreenCompete;

  return (
    <div className={`bg-retro-black flex flex-col ${isPlaying ? 'h-screen' : 'min-h-screen'}`}>
      {/* Header - hidden during gameplay since Player has its own bar */}
      {!isPlaying && (
        <header className="shrink-0 border-b-2 border-retro-purple bg-retro-dark">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 md:gap-3 group">
              <span className="text-2xl md:text-3xl">🕹️</span>
              <h1 className="font-pixel text-[10px] md:text-sm text-retro-accent group-hover:text-glow transition-all">
                JONES RETRO GAMES
              </h1>
            </Link>

            <nav className="flex gap-2 md:gap-4">
              <Link
                to="/"
                className={`font-pixel text-xs uppercase tracking-wider transition-colors ${
                  location.pathname === '/'
                    ? 'text-retro-accent'
                    : 'text-retro-cyan hover:text-retro-accent'
                }`}
              >
                Library
              </Link>
              <Link
                to="/compete"
                className={`font-pixel text-xs uppercase tracking-wider transition-colors ${
                  location.pathname.startsWith('/compete')
                    ? 'text-retro-gold'
                    : 'text-retro-cyan hover:text-retro-gold'
                }`}
              >
                Compete
              </Link>
              <Link
                to="/settings"
                className={`font-pixel text-xs uppercase tracking-wider transition-colors ${
                  location.pathname === '/settings'
                    ? 'text-retro-accent'
                    : 'text-retro-cyan hover:text-retro-accent'
                }`}
              >
                Settings
              </Link>
            </nav>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className={isPlaying ? 'flex-1 min-h-0 flex flex-col' : 'max-w-6xl mx-auto px-4 py-8'}>
        <Outlet />
      </main>

      {/* Footer */}
      {!isPlaying && (
        <footer className="border-t-2 border-retro-purple mt-auto">
          <div className="max-w-6xl mx-auto px-4 py-4 text-center">
            <p className="font-retro text-retro-blue text-sm">
              Jones Retro Games - A personal DOS game collection
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
