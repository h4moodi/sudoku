import React from 'react';
import { Delete, Lightbulb, Edit, Eye, RotateCcw } from 'lucide-react';

interface KeypadProps {
  activeNumber: number | null;
  onNumberSelect: (num: number) => void;
  onClearCell: () => void;
  onGetHint: () => void;
  onShowSolution: () => void;
  onClearAll: () => void;
  isNotesMode: boolean;
  onToggleNotesMode: () => void;
  remainingNumbers: Record<number, number>; // Maps 1-9 to remaining empty counts (to display progress!)
}

export default function Keypad({
  activeNumber,
  onNumberSelect,
  onClearCell,
  onGetHint,
  onShowSolution,
  onClearAll,
  isNotesMode,
  onToggleNotesMode,
  remainingNumbers,
}: KeypadProps) {
  return (
    <div id="keypad-container" className="flex flex-col items-center gap-3 sm:gap-4 w-full select-none">
      {/* 1 - 9 Number Slots */}
      <div id="number-buttons-grid" className="grid grid-cols-9 gap-1 sm:gap-2 w-full">
        {Array.from({ length: 9 }).map((_, idx) => {
          const num = idx + 1;
          const isSelected = activeNumber === num;
          const countLeft = remainingNumbers[num] ?? 0;
          const isCompleted = countLeft === 0;

          return (
            <button
              id={`keypad-number-${num}`}
              key={num}
              onClick={() => onNumberSelect(num)}
              type="button"
              className={`
                relative flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 focus:outline-none rounded-lg border transition-all duration-150 h-10 sm:h-12 md:h-14
                ${
                  isSelected
                    ? 'bg-[#ff4a8e] text-white border-neon-pink shadow-[0_0_12px_rgba(255,74,142,0.6)]'
                    : isCompleted
                      ? 'bg-[#15121a] text-neon-muted/35 border-[#5b3f46]/10 cursor-not-allowed'
                      : 'bg-[#1e1a23] text-neon-text border-[#5b3f46]/30 hover:border-neon-pink/50 hover:bg-[#2c2832]'
                }
              `}
              disabled={isCompleted}
            >
              <span className="text-sm sm:text-base font-bold font-display">{num}</span>
              
              {/* Optional dynamic bubble for completion counter */}
              {countLeft > 0 && (
                <span className="text-[7px] opacity-75 font-mono">
                  {countLeft}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Control Utility Buttons */}
      <div id="control-buttons-grid" className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full">
        {/* Toggle Normal vs Notes Mode */}
        <button
          id="btn-toggle-notes"
          onClick={onToggleNotesMode}
          type="button"
          title="Toggle Pencil Drafts Mode"
          className={`
            flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-bold font-mono border transition-all duration-150 h-11
            ${
              isNotesMode
                ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_10px_rgba(0,219,233,0.3)]'
                : 'bg-[#1e1a23] border-[#5b3f46]/40 text-neon-muted hover:text-white hover:bg-[#2c2832]'
            }
          `}
        >
          <Edit className="w-4 h-4 text-neon-cyan" />
          <span>NOTES: {isNotesMode ? 'ACTIVE' : 'OFF'}</span>
        </button>

        {/* Delete button (Backspace element) */}
        <button
          id="btn-delete"
          onClick={onClearCell}
          type="button"
          title="Delete current cell value"
          className="flex items-center justify-center bg-[#1e1a23] hover:bg-red-500/20 hover:border-red-500/50 border border-[#5b3f46]/40 text-neon-text hover:text-red-400 p-3 rounded-lg transition-all duration-150 w-12 h-11"
        >
          <Delete className="w-4 h-4" />
        </button>

        {/* Clear All / Reset Board button */}
        <button
          id="btn-clear-all"
          onClick={onClearAll}
          type="button"
          title="Reset the board to starting state"
          className="flex items-center justify-center bg-[#1e1a23] hover:bg-red-500/20 hover:border-red-500/50 border border-[#5b3f46]/40 text-neon-text hover:text-red-400 p-3 rounded-lg transition-all duration-150 w-12 h-11"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Large Premium Green "HINT" Button */}
        <button
          id="btn-hint"
          onClick={onGetHint}
          type="button"
          className="flex-1 min-w-[100px] sm:min-w-[120px] flex items-center justify-center gap-2 bg-[#2ff801] hover:bg-[#79ff5b] text-[#053900] font-bold py-2 sm:py-2.5 px-4 rounded-lg transition-all duration-200 outline-none h-11 glow-green transform hover:scale-105 active:scale-95"
        >
          <Lightbulb className="w-4 h-4 fill-current shrink-0" />
          <span className="font-display tracking-wider text-xs uppercase">
            HINT
          </span>
        </button>

        {/* Premium Cyan "SHOW SOLUTION" Button */}
        <button
          id="btn-show-solution"
          onClick={onShowSolution}
          type="button"
          className="flex-1 min-w-[100px] sm:min-w-[120px] flex items-center justify-center gap-2 bg-[#00dbe9] hover:bg-[#7effff] text-[#003c40] font-bold py-2 sm:py-2.5 px-4 rounded-lg transition-all duration-200 outline-none h-11 glow-cyan transform hover:scale-105 active:scale-95"
        >
          <Eye className="w-4 h-4 shrink-0" />
          <span className="font-display tracking-wider text-xs uppercase">
            SOLUTION
          </span>
        </button>
      </div>
    </div>
  );
}
