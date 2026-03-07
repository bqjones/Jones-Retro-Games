import { useParams, useNavigate } from 'react-router-dom';
import { useRef, useEffect, useCallback } from 'react';
import { getGameById } from '../lib/games';

const TOP_BAR_HEIGHT = 48;

export function Player() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const game = gameId ? getGameById(gameId) : undefined;

  const focusIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.focus();
      iframe.contentWindow?.focus();
    }
  }, []);

  useEffect(() => {
    // Focus iframe once it loads
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', focusIframe);
      return () => iframe.removeEventListener('load', focusIframe);
    }
  }, [focusIframe]);

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="text-6xl mb-4">?</span>
        <h2 className="font-pixel text-sm text-retro-accent mb-4">
          GAME NOT FOUND
        </h2>
        <button onClick={() => navigate('/')} className="btn-retro">
          Back to Library
        </button>
      </div>
    );
  }

  const playerUrl = `/test-jsdos.html?v=${Date.now()}#${game.romPath || '/roms/digger.jsdos'}`;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 9999,
        background: '#000',
      }}
    >
      {/* Top bar */}
      <div
        className="bg-retro-dark border-b-2 border-retro-purple px-4 flex items-center justify-between"
        style={{ height: TOP_BAR_HEIGHT, paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="font-pixel text-xs text-retro-cyan hover:text-retro-accent transition-colors"
          >
            &larr; EXIT
          </button>
          <div className="h-4 w-px bg-retro-purple" />
          <h2 className="font-pixel text-xs text-white">{game.title}</h2>
        </div>
      </div>

      {/* Emulator via iframe */}
      <iframe
        ref={iframeRef}
        src={playerUrl}
        onClick={focusIframe}
        style={{
          display: 'block',
          width: '100vw',
          height: `calc(100dvh - ${TOP_BAR_HEIGHT}px)`,
          border: 'none',
        }}
        title={`Playing ${game.title}`}
        allow="autoplay"
      />
    </div>
  );
}
