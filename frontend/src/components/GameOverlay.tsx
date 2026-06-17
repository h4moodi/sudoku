import React from 'react';
import { RefreshCw, Play, Trophy, AlertTriangle, Sparkles, Smile, Coffee } from 'lucide-react';
import { Difficulty } from '../types';

interface GameOverlayProps {
  status: 'paused' | 'gameover' | 'victory' | 'welcome' | null;
  difficulty: Difficulty;
  timeSec: number;
  onAction: () => void; // Resume, Restart, or Start Game
  onChangeDifficulty?: (diff: Difficulty) => void;
  onSubmitScore?: (name: string) => void;
}

export default function GameOverlay({
  status,
  difficulty,
  timeSec,
  onAction,
  onChangeDifficulty,
  onSubmitScore,
}: GameOverlayProps) {
  const [userName, setUserName] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  // Reset the submission state whenever the overlay status changes
  // (e.g. player wins again after already having submitted once)
  React.useEffect(() => {
    if (status !== 'victory') {
      setSubmitted(false);
      setUserName('');
    }
  }, [status]);

  if (!status) return null;

  // Format Time for high performance display
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const ms = Math.floor((totalSeconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const currentLeaderboardCutoff = 311.0; // 5m 11s

  return (
    <div
      id="game-overlay-backdrop"
      className="absolute inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md rounded-xl border border-neon-pink/30 animate-fade-in overflow-y-auto"
    >
      <div className="w-full max-w-sm text-center space-y-3 sm:space-y-5">
        {status === 'welcome' && (
          <div id="overlay-welcome" className="space-y-3">
            <div className="inline-flex p-2.5 sm:p-3 bg-neon-pink/10 rounded-full border border-neon-pink/30 shadow-[0_0_15px_rgba(255,74,142,0.2)]">
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-neon-pink animate-pulse" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-wider text-glow-pink">
              NEON SUDOKU
            </h2>
            <p className="text-xs text-neon-muted max-w-xs mx-auto">
              Welcome to the arcade-inspired logical matrix. Fill cells accurately to set records.
            </p>
            <div className="py-1">
              <span className="text-[10px] text-neon-muted block mb-2 uppercase tracking-widest">
                Select Skill Mode
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                {(['Easy', 'Medium', 'Hard', 'Expert', 'Master'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => onChangeDifficulty?.(d)}
                    className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all ${
                      difficulty === d
                        ? 'bg-neon-pink text-black shadow-[0_0_10px_#ff4a8e]'
                        : 'bg-[#1e1a23] hover:bg-[#2c2832] text-neon-muted border border-white/5'
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
              className="w-full bg-[#ff4a8e] hover:bg-[#ffb1c5] text-white hover:text-black font-semibold py-2.5 sm:py-3 px-6 rounded-lg transition-all duration-200 shadow-lg glow-pink font-display flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              LAUNCH ARENA
            </button>
          </div>
        )}

        {status === 'paused' && (
          <div id="overlay-paused" className="space-y-3">
            <div className="text-3xl sm:text-4xl text-neon-pink select-none animate-pulse">⏸</div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-widest text-glow-pink">
              GAME PAUSED
            </h2>
            <p className="text-xs text-neon-muted">
              Grid layout is hidden to prevent timing cheats. Hover variables cached.
            </p>
            <div className="py-1 flex items-center justify-center gap-2 font-mono text-xs text-neon-cyan/85">
              <span>ELAPSED:</span>
              <span className="font-bold underline">{formatTime(timeSec)}</span>
            </div>
            <button
              id="paused-resume"
              onClick={onAction}
              className="w-full bg-neon-pink text-[#65002f] hover:bg-neon-pink-glow font-bold py-2.5 sm:py-3 px-6 rounded-lg transition-all duration-150 shadow-md flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              RESUME SOLVING
            </button>
          </div>
        )}

        {status === 'gameover' && (
          <div id="overlay-gameover" className="space-y-3 animate-fade-in">
            <div className="inline-flex p-3 bg-[#ff4a8e]/10 rounded-full border border-neon-pink/30 shadow-[0_0_15px_rgba(255,177,197,0.15)]">
              <Coffee className="w-7 h-7 sm:w-8 sm:h-8 text-neon-pink-glow animate-pulse" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-white tracking-wide text-glow-pink uppercase">
              its okay kallee better luck next time
            </h2>
            <p className="text-xs text-neon-muted leading-relaxed max-w-xs mx-auto">
              No stress at all! You completed a wonderful attempt on {difficulty} mode.
            </p>
            
            <div className="bg-[#1e1a23] p-3 rounded-lg border border-white/5 space-y-1 text-center font-mono text-[11px] text-neon-muted">
              <div className="flex justify-between">
                <span>MISTAKES:</span>
                <span className="text-neon-pink-glow font-bold">5 / 5</span>
              </div>
              <div className="flex justify-between">
                <span>ELAPSED:</span>
                <span className="text-white font-bold">{formatTime(timeSec)}</span>
              </div>
            </div>

            <button
              id="gameover-retry"
              onClick={onAction}
              className="w-full bg-[#ff4a8e] hover:bg-[#ffb1c5] text-white hover:text-black font-semibold py-2.5 sm:py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 font-display"
            >
              <RefreshCw className="w-4 h-4" />
              BREW FRESH SUDOKU GRID
            </button>
          </div>
        )}

        {status === 'victory' && (
          <div id="overlay-victory" className="space-y-3">
            <div className="inline-flex p-2.5 sm:p-3 bg-neon-green/10 rounded-full border border-neon-green/30 shadow-[0_0_15px_rgba(47,248,1,0.2)]">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-[#2ff801]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#2ff801] tracking-wider text-glow-green">
              GRID COMPLETE!
            </h2>
            <p className="text-xs text-neon-muted">
              Excellent puzzle logic. You successfully solved {difficulty} Sudoku!
            </p>

            <div className="bg-[#15121a] py-2.5 px-3 sm:py-3 sm:px-4 rounded-lg border border-white/10 space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-neon-muted">
                <span>DIFFICULTY:</span>
                <span className="text-white font-bold">{difficulty.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-xs font-mono text-neon-muted">
                <span>COMPLETION TIME:</span>
                <span className="text-neon-green-glow font-bold tracking-widest">
                  {formatTime(timeSec)}
                </span>
              </div>
            </div>

            {/* Leaderboard submission */}
            {onSubmitScore && !submitted && (
              <form
                id="leaderboard-submit-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (userName.trim()) {
                    onSubmitScore(userName.trim());
                    setSubmitted(true);
                  }
                }}
                className="bg-[#1e1a23] p-3 rounded-lg border border-neon-pink/20 space-y-2"
              >
                <label className="block text-[10px] text-neon-muted font-mono font-bold uppercase tracking-wider text-left">
                  BEAT THE RECORD! ENTER NAME:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="CYBER_SOLVER_9"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value.toUpperCase())}
                    className="flex-1 min-w-0 bg-[#15121a] border border-white/10 text-white font-mono text-xs px-2 sm:px-3 py-1.5 rounded focus:outline-none focus:border-neon-pink"
                    required
                  />
                  <button
                    type="submit"
                    className="shrink-0 bg-neon-pink text-black text-xs font-bold px-3 py-1 rounded hover:bg-neon-pink-glow font-mono transition-all"
                  >
                    SUBMIT
                  </button>
                </div>
              </form>
            )}

            {submitted && (
              <div className="text-[11px] text-neon-green bg-neon-green/10 p-2 rounded border border-neon-green/20 font-mono">
                ✓ Recorded on public node list! Let's check the ranks!
              </div>
            )}

            <button
              id="victory-new-game"
              onClick={onAction}
              className="w-full bg-[#2ff801] hover:bg-[#79ff5b] text-[#053900] font-bold py-2.5 sm:py-3 px-6 rounded-lg transition-all duration-150 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              NEW MATRIX CHALLENGE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
