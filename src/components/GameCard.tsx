import { Link } from 'react-router-dom';
import type { Game } from '../types/game';

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  return (
    <Link to={`/play/${game.id}`} className="game-card block group">
      {/* Cover Art */}
      <div className="aspect-[3/4] bg-retro-purple rounded mb-3 overflow-hidden relative">
        {game.coverArt ? (
          <img
            src={game.coverArt}
            alt={game.title}
            className="w-full h-full object-cover pixelated"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-50">🎮</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-retro-accent/0 group-hover:bg-retro-accent/20 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 font-pixel text-xs text-white bg-retro-accent px-3 py-2 transition-opacity">
            PLAY
          </span>
        </div>
      </div>

      {/* Game Info */}
      <h3 className="font-pixel text-xs text-white mb-1 leading-relaxed">
        {game.title}
      </h3>
      <div className="flex items-center gap-2 text-retro-cyan font-retro text-sm">
        <span>{game.year}</span>
        <span className="text-retro-purple">•</span>
        <span className="uppercase text-xs">{game.platform}</span>
      </div>
      <p className="text-retro-blue font-retro text-sm mt-2 line-clamp-2">
        {game.publisher}
      </p>
    </Link>
  );
}
