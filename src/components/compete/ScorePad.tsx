import { useState } from 'react';
import type { Metric } from '../../types/competition';
import { playClick } from '../../lib/sound';

interface ScorePadProps {
  metric: Metric;
  playerName: string;
  gameTitle: string;
  onSubmit: (value: number, dnf: boolean) => void;
  onCancel?: () => void;
}

/**
 * Big touch-friendly entry pad. Scores type as plain digits; times type
 * microwave-style (e.g. 1-3-0 → 1:30). Time stations get a DNF option.
 */
export function ScorePad({ metric, playerName, gameTitle, onSubmit, onCancel }: ScorePadProps) {
  const [digits, setDigits] = useState('');

  const press = (d: string) => {
    playClick();
    if (digits.length >= (metric === 'time' ? 4 : 8)) return;
    setDigits(digits === '' && d === '0' ? digits : digits + d);
  };

  const backspace = () => {
    playClick();
    setDigits(digits.slice(0, -1));
  };

  const display = () => {
    if (digits === '') return metric === 'time' ? '0:00' : '0';
    if (metric === 'time') {
      const padded = digits.padStart(3, '0');
      const secs = padded.slice(-2);
      const mins = padded.slice(0, -2);
      return `${parseInt(mins, 10)}:${secs}`;
    }
    return parseInt(digits, 10).toLocaleString();
  };

  const value = () => {
    if (digits === '') return 0;
    if (metric === 'time') {
      const padded = digits.padStart(3, '0');
      const secs = parseInt(padded.slice(-2), 10);
      const mins = parseInt(padded.slice(0, -2), 10);
      return (mins * 60 + secs) * 1000;
    }
    return parseInt(digits, 10);
  };

  const timeInvalid = metric === 'time' && digits !== '' && parseInt(digits.padStart(3, '0').slice(-2), 10) >= 60;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
      <div className="text-center">
        <p className="font-pixel text-xs text-retro-cyan mb-1">{gameTitle}</p>
        <p className="font-retro text-3xl text-white">
          {playerName} — enter your {metric === 'time' ? 'time' : 'score'}
        </p>
      </div>

      <div className="w-full border-4 border-retro-green bg-retro-black px-4 py-3 text-center">
        <span className="font-pixel text-3xl text-retro-green tabular-nums">{display()}</span>
      </div>
      {timeInvalid && (
        <p className="font-retro text-lg text-retro-accent">Seconds must be under 60</p>
      )}

      <div className="grid grid-cols-3 gap-2 w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            onClick={() => press(d)}
            className="font-pixel text-xl text-white bg-retro-purple border-2 border-retro-blue py-4 active:bg-retro-blue"
          >
            {d}
          </button>
        ))}
        <button
          onClick={backspace}
          className="font-pixel text-xl text-retro-accent bg-retro-purple border-2 border-retro-blue py-4 active:bg-retro-blue"
        >
          ←
        </button>
        <button
          onClick={() => press('0')}
          className="font-pixel text-xl text-white bg-retro-purple border-2 border-retro-blue py-4 active:bg-retro-blue"
        >
          0
        </button>
        <button
          onClick={() => !timeInvalid && onSubmit(value(), false)}
          disabled={timeInvalid || digits === ''}
          className="font-pixel text-sm text-retro-black bg-retro-green border-2 border-retro-green py-4 disabled:opacity-30 active:brightness-75"
        >
          OK
        </button>
      </div>

      <div className="flex gap-3 w-full">
        {metric === 'time' && (
          <button
            onClick={() => onSubmit(0, true)}
            className="flex-1 font-pixel text-xs text-retro-gold border-2 border-retro-gold py-3 active:bg-retro-purple"
          >
            DIDN'T FINISH
          </button>
        )}
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 font-pixel text-xs text-retro-cyan border-2 border-retro-blue py-3 active:bg-retro-purple"
          >
            CANCEL
          </button>
        )}
      </div>
    </div>
  );
}
