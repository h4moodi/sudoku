import React from 'react';
import { HardcodedRank, UserRun } from '../types';
import { Trophy, Clock, Zap, Star } from 'lucide-react';

interface RankingListProps {
  currentDifficulty: string;
  userRuns: UserRun[];
  globalRankings: HardcodedRank[];
  onClearHistory?: () => void;
  isLoading?: boolean;
}

export default function RankingList({
  currentDifficulty,
  userRuns,
  globalRankings,
  onClearHistory,
  isLoading = false,
}: RankingListProps) {
  const [activeTab, setActiveTab] = React.useState<'global' | 'my-runs'>('global');

  // Format Helper for Time
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const ms = Math.floor((totalSeconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div id="rankings-container" className="flex flex-col h-full bg-[#1e1a23] rounded-lg border border-white/5 p-4 self-stretch font-sans">
      <div className="flex items-center justify-between mb-1">
        <h2 id="rankings-title" className="text-xs uppercase tracking-widest text-[#aa888f] font-mono font-bold">
          Rankings
        </h2>
        <span className="text-[10px] bg-neon-pink/10 text-neon-pink px-2 py-0.5 rounded-full border border-neon-pink/20 font-mono font-medium">
          {currentDifficulty.toUpperCase()}
        </span>
      </div>
      <p className="text-[11px] text-[#aa888f] mb-4">TOP PLAYERS - GLOBAL</p>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-4">
        <button
          id="tab-global"
          onClick={() => setActiveTab('global')}
          className={`pb-2 pr-4 text-xs font-bold tracking-wider transition-all duration-300 relative ${
            activeTab === 'global' ? 'text-neon-pink' : 'text-neon-muted hover:text-white'
          }`}
        >
          GLOBAL
          {activeTab === 'global' && (
            <span className="absolute bottom-0 left-0 right-4 h-0.5 bg-neon-pink animate-pulse" />
          )}
        </button>
        <button
          id="tab-my-runs"
          onClick={() => setActiveTab('my-runs')}
          className={`pb-2 px-4 text-xs font-bold tracking-wider transition-all duration-300 relative ${
            activeTab === 'my-runs' ? 'text-neon-pink' : 'text-neon-muted hover:text-white'
          }`}
        >
          MY STATS
          {activeTab === 'my-runs' && (
            <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-neon-pink animate-pulse" />
          )}
        </button>
      </div>

      {/* List container */}
      <div className="flex-1 overflow-y-auto space-y-2 max-h-[350px] pr-1">
        {isLoading && activeTab === 'global' ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-[#aa888f]">
            <div className="w-8 h-8 border-2 border-neon-pink border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs">SYNCING WITH GLOBAL NODE...</p>
          </div>
        ) : activeTab === 'global' ? (
          globalRankings.map((player) => (
            <div
              key={player.rank}
              className="flex items-center justify-between bg-[#15121a] hover:bg-[#2c2832]/80 transition-colors duration-200 p-3 rounded-lg border border-white/5"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-neon-pink-glow">
                  #{player.rank.toString().padStart(2, '0')}
                </span>
                
                {/* Custom glowing dynamic avatar */}
                <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-[#8f0045] to-[#ff4a8e] flex items-center justify-center border border-white/10 shadow-[0_0_10px_rgba(255,74,142,0.2)]">
                  <span className="text-[10px] font-bold text-white font-mono">
                    {player.username.substring(0, 2).toUpperCase()}
                  </span>
                  {player.rank === 1 && (
                    <Trophy className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[#ffd700] fill-[#ffd700] drop-shadow" />
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="font-mono text-xs font-bold text-white tracking-wide truncate max-w-[120px]">
                    {player.username}
                  </span>
                  <span className="text-[9px] text-neon-muted font-mono">
                    VERIFIED RUN
                  </span>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <span className="font-mono text-xs text-neon-muted">
                  {formatTime(player.timeSec)}
                </span>
                <span className="text-[8px] text-neon-green font-mono flex items-center gap-0.5">
                  <Zap className="w-2.4 h-2.4" /> 100% ACC
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-2">
            {userRuns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-[#aa888f]">
                <Star className="w-8 h-8 opacity-20 mb-2 text-neon-pink" />
                <p className="text-xs">No records on this browser yet.</p>
                <p className="text-[10px] mt-1">Complete a Sudoku game to record your time!</p>
              </div>
            ) : (
              userRuns.map((run, i) => (
                <div
                  key={run.id || i}
                  className="flex items-center justify-between bg-[#15121a] p-3 rounded-lg border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-neon-muted">
                      #{String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-medium text-white">
                        {run.difficulty} Difficulty
                      </span>
                      <span className="text-[9px] text-[#aa888f] font-mono">
                        {run.date}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-xs text-neon-green-glow font-bold">
                      {formatTime(run.timeSec)}
                    </p>
                    <p className="text-[9px] text-[#aa888f]">
                      Mistakes: {run.mistakes}/5
                    </p>
                  </div>
                </div>
              ))
            )}

            {userRuns.length > 0 && onClearHistory && (
              <button
                id="btn-clear-history"
                onClick={onClearHistory}
                className="w-full mt-4 text-[10px] text-red-400/60 hover:text-red-400 font-mono py-1 rounded bg-transparent border border-red-500/20 hover:bg-red-500/10 transition-colors"
              >
                CLEAR PERSONAL LIFETIME RUNS
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info Badge */}
      <div className="mt-4 p-3 bg-[#15121a]/60 rounded-lg border border-white/5 flex items-start gap-2">
        <Clock className="w-4 h-4 text-neon-pink shrink-0 mt-0.5" />
        <div className="text-[10px] text-neon-muted leading-relaxed font-sans">
          Your best local completion times are saved. Beat a global champion to insert your name!
        </div>
      </div>
    </div>
  );
}
