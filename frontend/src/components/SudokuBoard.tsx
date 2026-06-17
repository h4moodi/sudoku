import React from 'react';
import { SudokuCell } from '../types';

interface SudokuBoardProps {
  cells: SudokuCell[];
  selectedCell: { row: number; col: number } | null;
  onCellSelect: (row: number, col: number) => void;
  highlightNumber: number | null;
}

export default function SudokuBoard({
  cells,
  selectedCell,
  onCellSelect,
  highlightNumber,
}: SudokuBoardProps) {
  // Precalculate which numbers 1-9 are completed (all 9 correctly placed)
  const completedNumbers = React.useMemo(() => {
    const counts: Record<number, number> = {};
    for (let num = 1; num <= 9; num++) {
      counts[num] = cells.filter(c => c.value === num && c.value === c.correctValue).length;
    }
    return Object.entries(counts)
      .filter(([_, count]) => count === 9)
      .map(([numStr]) => parseInt(numStr));
  }, [cells]);

  // Helper to find a cell in our flat array of 81 cells
  const getCell = (row: number, col: number) => {
    return cells.find(c => c.row === row && c.col === col);
  };

  // Check if cell is in the same row/col/box as selected cell
  const isPeer = (r: number, c: number) => {
    if (!selectedCell) return false;
    if (selectedCell.row === r && selectedCell.col === c) return false; // self isn't a peer
    
    // Same row or col
    if (selectedCell.row === r || selectedCell.col === c) return true;
    
    // Same 3x3 box
    const selBoxR = Math.floor(selectedCell.row / 3);
    const selBoxC = Math.floor(selectedCell.col / 3);
    const cellBoxR = Math.floor(r / 3);
    const cellBoxC = Math.floor(c / 3);
    return selBoxR === cellBoxR && selBoxC === cellBoxC;
  };

  return (
    <div
      id="sudoku-grid-wrapper"
      className="relative p-1 bg-[#100d15] rounded-xl border border-neon-pink/30 shadow-[0_0_20px_rgba(255,74,142,0.15)] select-none"
    >
      {/* Empty state — shown briefly on first mount before puzzle is generated */}
      {cells.length === 0 ? (
        <div id="sudoku-main-grid" className="grid grid-cols-9 bg-[#15121a]">
          {Array.from({ length: 81 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-[#15121a] border border-[#5b3f46]/20 animate-pulse"
            />
          ))}
        </div>
      ) : (
      /* 9x9 Grid layout */
      <div id="sudoku-main-grid" className="grid grid-cols-9 bg-[#15121a]">
        {Array.from({ length: 9 }).map((_, r) => {
          return Array.from({ length: 9 }).map((_, c) => {
            const cell = getCell(r, c);
            const isSelected = selectedCell?.row === r && selectedCell?.col === c;
            const peer = isPeer(r, c);
            const hasSameValue =
              highlightNumber !== null &&
              highlightNumber !== 0 &&
              cell?.value === highlightNumber;

            // Compute border classes for 3x3 blocks to match high-fidelity neon styling
            const borderTop = r % 3 === 0 ? 'border-t-[3px] border-t-neon-pink' : 'border-t border-t-[#5b3f46]/30';
            const borderLeft = c % 3 === 0 ? 'border-l-[3px] border-l-neon-pink' : 'border-l border-l-[#5b3f46]/30';
            const borderBottom = r === 8 ? 'border-b-[3px] border-b-neon-pink' : '';
            const borderRight = c === 8 ? 'border-r-[3px] border-r-neon-pink' : '';

            // Compute cell state highlights
            let bgStyle = 'bg-[#15121a]';
            if (isSelected) {
              bgStyle = 'bg-[#ff4a8e]/20';
            } else if (hasSameValue) {
              bgStyle = 'bg-[#00dbe9]/20';
            } else if (peer) {
              bgStyle = 'bg-[#ff4a8e]/5';
            }

            // Cell text colors
            let textStyle = 'text-white';
            const isCompleted = cell && cell.value !== 0 && completedNumbers.includes(cell.value) && !cell.isError;

            if (cell?.isRevealed) {
              textStyle = 'text-[#00a2ff] font-extrabold font-sora text-glow-blue drop-shadow-[0_0_6px_#00a2ff]';
            } else if (isCompleted) {
              textStyle = 'text-neon-green font-extrabold font-sora text-glow-green drop-shadow-[0_0_6px_#2ff801]';
            } else if (cell?.isInitial) {
              textStyle = 'text-white font-bold font-sora';
            } else if (cell?.isError) {
              textStyle = 'text-red-400 font-bold animate-pulse';
            } else {
              textStyle = 'text-neon-cyan font-semibold';
            }

            return (
              <div
                id={`cell-${r}-${c}`}
                key={`${r}-${c}`}
                onClick={() => onCellSelect(r, c)}
                className={`
                  relative aspect-square flex items-center justify-center cursor-pointer transition-all duration-150 group
                  ${borderTop} ${borderLeft} ${borderBottom} ${borderRight} ${bgStyle}
                `}
              >
                {/* Visual hover guides */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors pointer-events-none" />

                {/* Selected Cell glowing target rings */}
                {isSelected && (
                  <div className="absolute inset-0 border-2 border-neon-pink-glow pointer-events-none glow-pink-sm" />
                )}

                {/* Content Rendering */}
                {cell && cell.value !== 0 ? (
                  <span className={`text-base sm:text-lg md:text-xl ${textStyle}`}>
                    {cell.value}
                  </span>
                ) : (
                  /* Render Notes (Pencil drafts) */
                  <div className="w-full h-full grid grid-cols-3 grid-rows-3 p-1 text-[9px] leading-none text-neon-muted font-mono font-medium">
                    {Array.from({ length: 9 }).map((_, noteIdx) => {
                      const num = noteIdx + 1;
                      const hasNote = cell?.notes.includes(num);
                      return (
                        <div
                          key={noteIdx}
                          className="flex items-center justify-center"
                        >
                          {hasNote ? num : ''}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Conflict/Mistake red corner flash indicator */}
                {cell?.isError && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </div>
            );
          });
        })}
      </div>
      )}
    </div>
  );
}
