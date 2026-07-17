import { useEffect, useRef, useState, type ReactNode } from 'react';
import { getGameById } from '../../lib/games';
import { getSettings } from '../../lib/storage';

interface GameFrameProps {
  gameId: string;
  /** Rendered at the right end of the top bar (timer, end-run button…). */
  barContent?: ReactNode;
  label?: string;
}

const BAR_HEIGHT = 44;

/** Embedded emulator with a slim competition bar on top. Fills its parent. */
export function GameFrame({ gameId, barContent, label }: GameFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const game = getGameById(gameId);
  const [volume, setVolume] = useState(80);

  useEffect(() => {
    getSettings().then((s) => setVolume(s.volume));
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const onLoad = () => {
      iframe.focus();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.postMessage({ type: 'jrg-volume', value: volume / 100 }, '*');
    };
    iframe.addEventListener('load', onLoad);
    // Also apply immediately in case the iframe is already loaded.
    iframe.contentWindow?.postMessage({ type: 'jrg-volume', value: volume / 100 }, '*');
    return () => iframe.removeEventListener('load', onLoad);
  }, [gameId, volume]);

  if (!game) return null;

  return (
    <div className="w-full h-full flex flex-col bg-black">
      <div
        className="shrink-0 bg-retro-dark border-b-2 border-retro-purple px-3 flex items-center justify-between gap-3"
        style={{ height: BAR_HEIGHT }}
      >
        <span className="font-pixel text-xs text-white truncate">
          {label ?? game.title}
        </span>
        <div className="flex items-center gap-3">{barContent}</div>
      </div>
      <iframe
        ref={iframeRef}
        src={`/test-jsdos.html?v=${game.id}#${game.romPath}`}
        onClick={() => iframeRef.current?.contentWindow?.focus()}
        className="flex-1 w-full border-0"
        title={`Playing ${game.title}`}
        allow="autoplay"
      />
    </div>
  );
}
