import { useParams, useNavigate } from 'react-router-dom';
import { useRef, useEffect, useCallback, useState } from 'react';
import { getGameById } from '../lib/games';
import { getSettings, saveSettings } from '../lib/storage';
import type { GameSettings } from '../types/game';

const TOP_BAR_HEIGHT = 48;

export function Player() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const game = gameId ? getGameById(gameId) : undefined;

  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [muted, setMuted] = useState(false);
  const volume = settings?.volume ?? 80;

  const focusIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.focus();
      iframe.contentWindow?.focus();
    }
  }, []);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    // Focus iframe once it loads
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', focusIframe);
      return () => iframe.removeEventListener('load', focusIframe);
    }
  }, [focusIframe]);

  // Push volume into the emulator iframe — now and on every (re)load.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const send = () =>
      iframe.contentWindow?.postMessage(
        { type: 'jrg-volume', value: muted ? 0 : volume / 100 },
        '*'
      );
    send();
    iframe.addEventListener('load', send);
    return () => iframe.removeEventListener('load', send);
  }, [muted, volume]);

  const changeVolume = (v: number) => {
    setMuted(false);
    setSettings((s) => {
      const next: GameSettings = { ...(s ?? { volume: 80, scanlines: true, aspectRatio: '4:3' }), volume: v };
      void saveSettings(next);
      return next;
    });
  };

  const toggleMute = () => {
    setMuted((m) => !m);
    focusIframe(); // keep playing without a second tap
  };

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

  const isSilent = muted || volume === 0;
  // Volume must NOT be in the URL — it's reactive state, and changing the src
  // reloads the iframe (restarting the game). Volume is applied via postMessage.
  const playerUrl = `/test-jsdos.html?v=${game.id}#${game.romPath || '/roms/digger.jsdos'}`;

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

        {/* Volume / mute */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            aria-label={isSilent ? 'Unmute' : 'Mute'}
            title={isSilent ? 'Unmute' : 'Mute'}
            className="text-lg leading-none hover:opacity-70 transition-opacity"
          >
            {isSilent ? '🔇' : '🔊'}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={muted ? 0 : volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            aria-label="Volume"
            className="w-20 md:w-28 accent-retro-accent"
          />
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
