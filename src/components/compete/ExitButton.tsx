import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ExitButtonProps {
  code: string;
  /**
   * discreet: small ✕ that asks for confirmation before leaving. Used on the
   * TV and station kiosk screens so a curious kid can't knock the screen
   * offline with one tap. Plain: a visible back link for trusted screens.
   */
  variant: 'discreet' | 'link';
  className?: string;
}

export function ExitButton({ code, variant, className = '' }: ExitButtonProps) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const leave = () => navigate(`/compete/${code}`);

  // Auto-cancel the confirm prompt if it isn't acted on
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(t);
  }, [confirming]);

  if (variant === 'link') {
    return (
      <button
        onClick={leave}
        className={`font-pixel text-xs text-retro-cyan hover:text-retro-accent transition-colors ${className}`}
      >
        &larr; MENU
      </button>
    );
  }

  if (confirming) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="font-pixel text-[9px] text-retro-gold">LEAVE THIS SCREEN?</span>
        <button
          onClick={leave}
          className="font-pixel text-[9px] text-retro-black bg-retro-accent px-2 py-1"
        >
          YES
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="font-pixel text-[9px] text-retro-cyan border border-retro-blue px-2 py-1"
        >
          NO
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      aria-label="Leave this screen"
      title="Leave this screen"
      className={`font-pixel text-sm text-retro-blue hover:text-retro-accent transition-colors ${className}`}
    >
      ✕
    </button>
  );
}
