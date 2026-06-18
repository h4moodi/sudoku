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
  // Precalculate completed numbers
  const completedNumbers = React.useMemo(() => {
    const counts: Record<number, number> = {};
    for (let num = 1; num <= 9; num++) {
      counts[num] = cells.filter(c => c.value === num && c.value === c.correctValue).length;
    }
    return Object.entries(counts)
      .filter(([_, count]) => count === 9)
      .map(([numStr]) => parseInt(numStr));
  }, [cells]);

  const getCell = (row: number, col: number) => {
    return cells.find(c => c.row === row && c.col === col);
  };

  const isPeer = (r: number, c: number) => {
    if (!selectedCell) return false;
    if (selectedCell.row === r && selectedCell.col === c) return false;

    if (selectedCell.row === r || selectedCell.col === c) return true;

    const selBoxR = Math.floor(selectedCell.row / 3);
    const selBoxC = Math.floor(selectedCell.col / 3);
    const cellBoxR = Math.floor(r / 3);
    const cellBoxC = Math.floor(c / 3);
    return selBoxR === cellBoxR && selBoxC === cellBoxC;
  };

  return (
    <div
      id="sudoku-grid-wrapper"
      className="relative p-1.5 sm:p-3 bg-cream rounded-xl border border-brown-light/25 select-none"
    >
      {cells.length === 0 ? (
        <div id="sudoku-main-grid" className="grid grid-cols-9 bg-[#fffcf8]/40 border-2 border-brown-light rounded-lg overflow-hidden">
          {Array.from({ length: 81 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-[#fffcf8]/40 border border-[#b49b87]/20 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div
          id="sudoku-main-grid"
          className="grid grid-cols-9 border-2 border-brown-light rounded-lg overflow-hidden bg-[#fffcf8]/40"
        >
          {Array.from({ length: 9 }).map((_, r) => {
            return Array.from({ length: 9 }).map((_, c) => {
              const cell = getCell(r, c);
              const isSelected = selectedCell?.row === r && selectedCell?.col === c;
              const peer = isPeer(r, c);
              const hasSameValue =
                highlightNumber !== null &&
                highlightNumber !== 0 &&
                cell?.value === highlightNumber;

              // Grid 3x3 box borders matching Playfair template
              const borderRightClass = c === 8 ? '' : (c === 2 || c === 5 ? 'border-r-[1.8px] border-r-brown-light' : 'border-r border-r-brown-light/18');
              const borderBottomClass = r === 8 ? '' : (r === 2 || r === 5 ? 'border-b-[1.8px] border-b-brown-light' : 'border-b border-b-brown-light/18');

              // Background highlight styling
              let bgStyle = 'bg-[#fffcf8]/55';
              if (isSelected) {
                bgStyle = 'bg-sky/38';
              } else if (hasSameValue) {
                bgStyle = 'bg-sky/15';
              } else if (peer) {
                bgStyle = 'bg-sky/8';
              }

              // Text Color logic based on status
              let textStyle = 'text-brown-mid';
              const isCompleted = cell && cell.value !== 0 && completedNumbers.includes(cell.value) && !cell.isError;

              if (cell?.isRevealed) {
                // revealed solution turns sky-blue/blue
                textStyle = 'text-sky-text font-extrabold font-display italic';
              } else if (isCompleted) {
                textStyle = 'text-sky-mid font-extrabold';
              } else if (cell?.isInitial) {
                textStyle = 'text-brown-deep font-bold';
              } else if (cell?.isError) {
                textStyle = 'text-terracotta font-bold animate-pulse';
              } else {
                textStyle = 'text-brown-mid font-semibold';
              }

              return (
                <div
                  id={`cell-${r}-${c}`}
                  key={`${r}-${c}`}
                  onClick={() => onCellSelect(r, c)}
                  className={`
                    relative aspect-square flex items-center justify-center cursor-pointer transition-colors duration-150 group select-none
                    ${borderRightClass} ${borderBottomClass} ${bgStyle}
                    ${cell?.isInitial ? 'given' : 'hover:bg-sky/18'}
                  `}
                >
                  {/* Selected cell outline */}
                  {isSelected && (
                    <div className="absolute inset-0 border-2 border-sky-text pointer-events-none" />
                  )}

                  {cell && cell.value !== 0 ? (
                    <span className={`text-base sm:text-lg md:text-xl ${textStyle}`}>
                      {cell.value}
                    </span>
                  ) : (
                    /* Render Notes (Pencil Drafts) */
                    <div className="w-full h-full grid grid-cols-3 grid-rows-3 p-1 text-[9px] leading-none text-brown-mute font-sans font-medium">
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

                  {/* Corner error alert */}
                  {cell?.isError && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
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
