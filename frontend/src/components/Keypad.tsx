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
  remainingNumbers: Record<number, number>;
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
                relative flex flex-col items-center justify-center py-1 sm:py-1.5 focus:outline-none rounded-lg border transition-all duration-150 h-9 sm:h-11 md:h-13
                ${
                  isSelected
                    ? 'bg-brown-deep text-sand border-brown-deep shadow-md'
                    : isCompleted
                      ? 'bg-sand text-brown-mute/30 border-brown-light/10 cursor-not-allowed'
                      : 'bg-[#fffcf8]/55 text-brown-mid border-brown-light/25 hover:border-sky-text hover:bg-sky/20'
                }
              `}
              disabled={isCompleted}
            >
              <span className="text-sm sm:text-base font-bold font-sans">{num}</span>
              
              {countLeft > 0 && (
                <span className="text-[7px] opacity-75 font-sans">
                  {countLeft}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Control Utility Buttons */}
      <div id="control-buttons-grid" className="flex flex-wrap items-center justify-center gap-2 w-full">
        {/* Toggle Pencil Mode */}
        <button
          id="btn-toggle-notes"
          onClick={onToggleNotesMode}
          type="button"
          title="Toggle Pencil Drafts Mode"
          className={`
            flex items-center gap-2 py-2 px-3 sm:px-4 rounded-lg text-xs font-bold font-sans border transition-all duration-150 h-10
            ${
              isNotesMode
                ? 'bg-sky/20 border-sky-mid text-sky-text'
                : 'bg-[#fffcf8]/55 border-brown-light/30 text-brown-mute hover:text-brown-deep hover:bg-sky/15'
            }
          `}
        >
          <Edit className="w-4 h-4 text-sky-text" />
          <span>NOTES: {isNotesMode ? 'ACTIVE' : 'OFF'}</span>
        </button>

        {/* Delete cell value */}
        <button
          id="btn-delete"
          onClick={onClearCell}
          type="button"
          title="Delete selected cell value"
          className="flex items-center justify-center bg-[#fffcf8]/55 hover:bg-terracotta/15 hover:border-terracotta border border-brown-light/30 text-brown-deep hover:text-terracotta p-2.5 rounded-lg transition-all duration-150 w-11 h-10"
        >
          <Delete className="w-4 h-4" />
        </button>

        {/* Clear All / Reset Board */}
        <button
          id="btn-clear-all"
          onClick={onClearAll}
          type="button"
          title="Reset board to starting layout"
          className="flex items-center justify-center bg-[#fffcf8]/55 hover:bg-terracotta/15 hover:border-terracotta border border-brown-light/30 text-brown-deep hover:text-terracotta p-2.5 rounded-lg transition-all duration-150 w-11 h-10"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Hints system button */}
        <button
          id="btn-hint"
          onClick={onGetHint}
          type="button"
          className="flex-1 min-w-[90px] sm:min-w-[110px] flex items-center justify-center gap-2 bg-sky hover:bg-sky/80 text-sky-text font-bold py-2 px-3 rounded-lg transition-all duration-200 outline-none h-10 border border-sky-mid/20 transform hover:scale-[1.03] active:scale-95"
        >
          <Lightbulb className="w-4 h-4 fill-current shrink-0" />
          <span className="font-sans tracking-wide text-xs uppercase">
            HINT
          </span>
        </button>

        {/* Show Solution Button */}
        <button
          id="btn-show-solution"
          onClick={onShowSolution}
          type="button"
          className="flex-1 min-w-[90px] sm:min-w-[110px] flex items-center justify-center gap-2 bg-terracotta hover:bg-terracotta/90 text-white font-bold py-2 px-3 rounded-lg transition-all duration-200 outline-none h-10 transform hover:scale-[1.03] active:scale-95"
        >
          <Eye className="w-4 h-4 shrink-0" />
          <span className="font-sans tracking-wide text-xs uppercase">
            SOLUTION
          </span>
        </button>
      </div>
    </div>
  );
}
