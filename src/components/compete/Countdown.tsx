import { useEffect, useRef } from 'react';
import type { Competition } from '../../types/competition';
import { formatClock, timeRemaining } from '../../lib/competition';
import { useNow } from '../../hooks/useCompetition';
import { playRotationChime, playWarning } from '../../lib/sound';

interface CountdownProps {
  comp: Competition;
  /** Only one screen (the TV) should own the audio cues. */
  withSound?: boolean;
  className?: string;
}

export function Countdown({ comp, withSound = false, className = '' }: CountdownProps) {
  const now = useNow(250);
  const remaining = timeRemaining(comp, now);
  const warned = useRef(false);
  const chimed = useRef(false);

  // Reset cue latches when a new timer starts
  const endsAt = comp.phaseEndsAt;
  useEffect(() => {
    warned.current = false;
    chimed.current = false;
  }, [endsAt]);

  useEffect(() => {
    if (!withSound || comp.phaseEndsAt == null || comp.paused) return;
    if (remaining <= 60_000 && remaining > 0 && !warned.current) {
      warned.current = true;
      playWarning();
    }
    if (remaining === 0 && !chimed.current) {
      chimed.current = true;
      playRotationChime();
    }
  }, [remaining, withSound, comp.phaseEndsAt, comp.paused]);

  if (comp.phaseEndsAt == null && !comp.paused) return null;

  const low = remaining <= 60_000 && remaining > 0;
  const done = remaining === 0;

  return (
    <div
      className={`font-pixel tabular-nums ${
        done ? 'text-retro-accent animate-pulse' : low ? 'text-retro-gold' : 'text-retro-green'
      } ${className}`}
    >
      {comp.paused ? 'PAUSED' : done ? 'TIME!' : formatClock(remaining)}
    </div>
  );
}
