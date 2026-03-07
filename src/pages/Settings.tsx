import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../lib/storage';
import type { GameSettings } from '../types/game';

export function Settings() {
  const [settings, setSettings] = useState<GameSettings>({
    volume: 80,
    scanlines: true,
    aspectRatio: '4:3',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    await saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="font-pixel text-xl text-retro-green text-glow mb-8 text-center">
        SETTINGS
      </h2>

      <div className="bg-retro-dark border-2 border-retro-purple rounded p-6 space-y-6">
        {/* Volume */}
        <div>
          <label className="font-pixel text-xs text-retro-cyan block mb-3">
            VOLUME: {settings.volume}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.volume}
            onChange={(e) =>
              setSettings((s) => ({ ...s, volume: Number(e.target.value) }))
            }
            className="w-full accent-retro-accent"
          />
        </div>

        {/* Scanlines */}
        <div className="flex items-center justify-between">
          <label className="font-pixel text-xs text-retro-cyan">
            CRT SCANLINES
          </label>
          <button
            onClick={() =>
              setSettings((s) => ({ ...s, scanlines: !s.scanlines }))
            }
            className={`font-pixel text-xs px-4 py-2 border-2 transition-colors ${
              settings.scanlines
                ? 'border-retro-green text-retro-green'
                : 'border-retro-blue text-retro-blue'
            }`}
          >
            {settings.scanlines ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="font-pixel text-xs text-retro-cyan block mb-3">
            ASPECT RATIO
          </label>
          <div className="flex gap-2">
            {(['4:3', '16:9', 'stretch'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setSettings((s) => ({ ...s, aspectRatio: ratio }))}
                className={`font-pixel text-xs px-4 py-2 border-2 transition-colors ${
                  settings.aspectRatio === ratio
                    ? 'border-retro-accent text-retro-accent bg-retro-accent/10'
                    : 'border-retro-blue text-retro-blue hover:border-retro-cyan'
                }`}
              >
                {ratio.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-retro-purple">
          <button onClick={handleSave} className="btn-retro w-full">
            {saved ? '✓ SAVED!' : 'SAVE SETTINGS'}
          </button>
        </div>
      </div>

      {/* About Section */}
      <div className="mt-8 p-6 bg-retro-dark border-2 border-retro-purple rounded">
        <h3 className="font-pixel text-xs text-retro-gold mb-4">ABOUT</h3>
        <div className="font-retro text-lg text-retro-cyan space-y-2">
          <p>
            <strong className="text-white">Jones Retro Games</strong> - A
            personal DOS game emulator
          </p>
          <p>Powered by js-dos (DOSBox in JavaScript)</p>
          <p className="text-retro-blue text-sm mt-4">
            Add your legally owned DOS games to play them in the browser.
          </p>
        </div>
      </div>
    </div>
  );
}
