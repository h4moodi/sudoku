import React from 'react';
import { RefreshCw, Play, Trophy, Sparkles, Smile, Coffee, Eye } from 'lucide-react';
import { Difficulty } from '../types';

interface GameOverlayProps {
  status: 'paused' | 'gameover' | 'victory' | 'welcome' | null;
  difficulty: Difficulty;
  timeSec: number;
  onAction: () => void; // Resume, Restart, or Start Game
  onChangeDifficulty?: (diff: Difficulty) => void;
  onSubmitScore?: (name: string) => void;
  onDismiss?: () => void; // Close victory modal to inspect board
}

export default function GameOverlay({
  status,
  difficulty,
  timeSec,
  onAction,
  onChangeDifficulty,
  onSubmitScore,
  onDismiss,
}: GameOverlayProps) {
  const [userName, setUserName] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (status !== 'victory') {
      setSubmitted(false);
      setUserName('');
    }
  }, [status]);

  if (!status) return null;

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const ms = Math.floor((totalSeconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="game-overlay-backdrop"
      className="absolute inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-6 bg-brown-deep/35 backdrop-blur-md rounded-xl border border-brown-light/20 animate-fade-in overflow-y-auto select-none"
    >
      <div className="w-full max-w-sm text-center space-y-4 sm:space-y-5 bg-sand/95 border border-brown-light/40 rounded-2xl p-6 sm:p-8 shadow-xl">
        
        {status === 'welcome' && (
          <div id="overlay-welcome" className="space-y-4 text-center">
            <div className="eyebrow text-brown-mute text-[10px] tracking-[0.22em] uppercase font-bold">
              made just for you ✦
            </div>
            <h2 className="title font-display italic font-bold text-3xl sm:text-4xl text-brown-deep leading-tight">
              <span className="block text-sm sm:text-base font-sans font-normal text-brown-mute not-italic mb-1">
                sudoku for
              </span>
              kallee
            </h2>


            <div className="py-2 space-y-2">
              <span className="text-[10px] text-brown-mute block font-bold uppercase tracking-widest">
                Select Skill Mode
              </span>
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                {(['Easy', 'Medium', 'Hard', 'Expert', 'Master'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => onChangeDifficulty?.(d)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                      difficulty === d
                        ? 'bg-terracotta text-white shadow-sm'
                        : 'bg-[#fffcf8]/65 hover:bg-[#fffcf8]/90 text-brown-mute border border-brown-light/20'
                    }`}
                  >
                    {d.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="welcome-start"
              onClick={onAction}
              className="w-full bg-brown-deep hover:bg-brown-mid text-sand font-semibold py-2.5 sm:py-3 px-6 rounded-full transition-all duration-200 shadow font-sans tracking-widest text-xs uppercase flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              LAUNCH ARENA
            </button>
          </div>
        )}

        {status === 'paused' && (
          <div id="overlay-paused" className="space-y-4">
            <div className="text-3xl sm:text-4xl text-brown-mute select-none animate-pulse">⏸</div>
            <h2 className="text-xl sm:text-2xl font-display italic font-bold text-brown-deep tracking-wide">
              GAME PAUSED
            </h2>
            <p className="text-xs text-brown-mute leading-relaxed">
              Grid layout is hidden to prevent timing cheats.
            </p>
            <div className="py-1 flex items-center justify-center gap-2 font-mono text-xs text-sky-text">
              <span>ELAPSED:</span>
              <span className="font-bold underline">{formatTime(timeSec)}</span>
            </div>
            <button
              id="paused-resume"
              onClick={onAction}
              className="w-full bg-brown-deep hover:bg-brown-mid text-sand font-bold py-2.5 sm:py-3 px-6 rounded-full transition-all duration-150 shadow flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              RESUME SOLVING
            </button>
          </div>
        )}

        {status === 'gameover' && (
          <div id="overlay-gameover" className="space-y-4 animate-fade-in">
            <div className="inline-flex p-2 bg-terracotta/10 rounded-full border border-terracotta/20">
              <Coffee className="w-7 h-7 sm:w-8 sm:h-8 text-terracotta" />
            </div>
            <h2 className="text-lg sm:text-xl font-display italic font-bold text-brown-deep uppercase">
              its okay kallee better luck next time
            </h2>
            <p className="text-xs text-brown-mute leading-relaxed max-w-xs mx-auto">
              No stress at all! You completed a wonderful attempt on {difficulty} mode.
            </p>
            
            <div className="bg-[#fffcf8]/45 p-3 rounded-lg border border-brown-light/20 space-y-1 text-center font-mono text-[11px] text-brown-mute">
              <div className="flex justify-between">
                <span>ELAPSED:</span>
                <span className="text-brown-deep font-bold">{formatTime(timeSec)}</span>
              </div>
            </div>

            <button
              id="gameover-retry"
              onClick={onAction}
              className="w-full bg-terracotta hover:bg-terracotta/90 text-white font-semibold py-2.5 sm:py-3 px-6 rounded-full transition-all duration-200 shadow flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              BREW FRESH GRID
            </button>
          </div>
        )}

        {status === 'victory' && (
          <div id="overlay-victory" className="space-y-4">
            <div className="inline-flex p-3 bg-sky/20 rounded-full border border-sky-mid/30">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-sky-text" />
            </div>
            <h2 className="text-xl sm:text-2xl font-display italic font-bold text-brown-deep tracking-wider">
              you did it ♡
            </h2>
            <p className="text-xs text-brown-mute italic leading-relaxed max-w-xs mx-auto">
              see i knew you were smart as hell
            </p>

            <div className="bg-[#fffcf8]/55 py-2.5 px-3 sm:py-3 sm:px-4 rounded-lg border border-brown-light/20 space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-brown-mute">
                <span>DIFFICULTY:</span>
                <span className="text-brown-deep font-bold">{difficulty.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-xs font-mono text-brown-mute">
                <span>COMPLETION TIME:</span>
                <span className="text-sky-text font-bold tracking-wider">
                  {formatTime(timeSec)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full pt-2">
              {onDismiss && (
                <button
                  id="victory-view-board"
                  type="button"
                  onClick={onDismiss}
                  className="flex-1 bg-[#fffcf8]/55 hover:bg-sky/15 border border-brown-light/30 text-brown-deep font-bold py-2.5 sm:py-3 px-4 rounded-full transition-all duration-150 flex items-center justify-center gap-2 text-xs font-sans cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-sky-text shrink-0" />
                  VIEW COMPLETED BOARD
                </button>
              )}

              <button
                id="victory-new-game"
                onClick={onAction}
                className="flex-1 bg-brown-deep hover:bg-brown-mid text-sand font-bold py-2.5 sm:py-3 px-4 rounded-full transition-all duration-150 flex items-center justify-center gap-2 text-xs tracking-wider cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 shrink-0" />
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
