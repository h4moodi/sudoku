import React from 'react';
import { Trophy, Clock, History } from 'lucide-react';
import { UserRun, HardcodedRank } from '../types';

interface RankingListProps {
  currentDifficulty: string;
  userRuns: UserRun[];
  globalRankings: HardcodedRank[];
  isLoading?: boolean;
  onClearHistory?: () => void;
}

export default function RankingList({
  currentDifficulty,
  userRuns,
  globalRankings,
  isLoading = false,
  onClearHistory,
}: RankingListProps) {
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const ms = Math.floor((totalSeconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="leaderboard-panel"
      className="bg-[#fffcf8]/55 border border-brown-light/25 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 w-full h-full select-none"
    >
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-brown-light/15 pb-2.5 sm:pb-3">
        <Trophy className="w-4 h-4 text-terracotta" />
        <h3 className="font-display italic text-lg sm:text-xl font-bold text-brown-deep">
          Personal Solve History
        </h3>
      </div>

      {/* Local Solve Contents */}
      <div className="flex-1 overflow-y-auto max-h-[300px] lg:max-h-[460px] pr-1">
        <div className="space-y-2">
          {userRuns.length === 0 ? (
            <div className="text-center py-8 text-xs italic text-brown-mute flex flex-col items-center gap-2">
              <History className="w-7 h-7 opacity-35" />
              <span>No local solves cached on this device yet.</span>
            </div>
          ) : (
            userRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between bg-[#fffcf8]/50 p-2.5 rounded-lg border border-brown-light/15"
              >
                <div className="flex flex-col">
                  <span className="font-sans text-xs font-bold text-brown-deep">
                    {run.difficulty} Mode
                  </span>
                  <span className="text-[9px] text-brown-mute font-mono">
                    {run.date}
                  </span>
                </div>

                <div className="text-right">
                  <p className="font-mono text-xs text-sky-text font-bold">
                    {formatTime(run.timeSec)}
                  </p>
                  <p className="text-[9px] text-sky-mid font-semibold">
                    Solved successfully!
                  </p>
                </div>
              </div>
            ))
          )}

          {userRuns.length > 0 && onClearHistory && (
            <button
              id="btn-clear-history"
              onClick={onClearHistory}
              className="w-full mt-4 text-[10px] text-terracotta/70 hover:text-terracotta border border-terracotta/20 hover:bg-terracotta/5 font-sans py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              CLEAR PERSONAL LIFETIME RUNS
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
