import { gameLibrary } from '../lib/games';
import { GameCard } from '../components/GameCard';

export function Library() {
  return (
    <div>
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h2 className="font-pixel text-xl text-retro-green text-glow mb-4">
          GAME LIBRARY
        </h2>
        <p className="font-retro text-xl text-retro-cyan">
          Select a game to play from your collection
        </p>
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {gameLibrary.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {/* Empty State */}
      {gameLibrary.length === 0 && (
        <div className="text-center py-16">
          <span className="text-6xl mb-4 block">📦</span>
          <p className="font-pixel text-sm text-retro-blue">
            No games in library
          </p>
          <p className="font-retro text-retro-cyan mt-2">
            Add .jsdos bundles to the /public/roms folder
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-12 p-6 bg-retro-dark border-2 border-retro-purple rounded">
        <h3 className="font-pixel text-xs text-retro-gold mb-4">
          GETTING STARTED
        </h3>
        <div className="font-retro text-lg text-retro-cyan space-y-2">
          <p>
            1. Place your DOS game bundles (.jsdos) in the{' '}
            <code className="bg-retro-purple px-2 py-1 rounded text-white">
              /public/roms/
            </code>{' '}
            folder
          </p>
          <p>2. Click on a game card to launch the emulator</p>
          <p>3. Use keyboard controls to play - most DOS games use arrow keys + Enter</p>
        </div>
      </div>
    </div>
  );
}
