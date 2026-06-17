import { Difficulty, SudokuCell } from './types';

// Helper to check if val is valid in r, c on the board
export function isValid(board: number[][], r: number, c: number, val: number): boolean {
  for (let i = 0; i < 9; i++) {
    // Check row
    if (board[r][i] === val) return false;
    // Check col
    if (board[i][c] === val) return false;
    // Check 3x3 box
    const boxRow = 3 * Math.floor(r / 3) + Math.floor(i / 3);
    const boxCol = 3 * Math.floor(c / 3) + (i % 3);
    if (board[boxRow][boxCol] === val) return false;
  }
  return true;
}

// Recursively solves a sudoku board while shuffling options to randomize
function solveSudokuRandom(board: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        // Shuffle numbers 1-9
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        for (const val of nums) {
          if (isValid(board, r, c, val)) {
            board[r][c] = val;
            if (solveSudokuRandom(board)) return true;
            board[r][c] = 0;
          }
        }
        return false; // backtrack
      }
    }
  }
  return true;
}

// Generate a random sudoku solved and initial play puzzle
export function generateSudoku(difficulty: Difficulty): {
  puzzleCells: SudokuCell[];
  solution: number[][];
} {
  // 1. Create empty board and fill it
  const solution: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
  solveSudokuRandom(solution);

  // 2. Clone solution board and remove cells based on difficulty
  const puzzle: number[][] = solution.map(row => [...row]);
  
  // Decide target clue count
  // Easy: 42, Medium: 35, Hard: 28, Expert: 23, Master: 17
  let cluesToKeep = 35;
  switch (difficulty) {
    case 'Easy':
      cluesToKeep = 43;
      break;
    case 'Medium':
      cluesToKeep = 35;
      break;
    case 'Hard':
      cluesToKeep = 28;
      break;
    case 'Expert':
      cluesToKeep = 23;
      break;
    case 'Master':
      cluesToKeep = 17;
      break;
  }

  const cellsToRemove = 81 - cluesToKeep;
  let removedCount = 0;

  // Generate symmetrical cell list for selection
  const allCellIndices: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      // Avoid duplicate pairs in our initial selection pool
      if (r < 4 || (r === 4 && c <= 4)) {
        allCellIndices.push([r, c]);
      }
    }
  }

  // Shuffle indices
  allCellIndices.sort(() => Math.random() - 0.5);

  for (const [r, c] of allCellIndices) {
    if (removedCount >= cellsToRemove) break;

    const opR = 8 - r;
    const opC = 8 - c;

    if (puzzle[r][c] !== 0) {
      if (r === opR && c === opC) {
        // Center cell
        puzzle[r][c] = 0;
        removedCount++;
      } else {
        // Symmetrical pair
        puzzle[r][c] = 0;
        puzzle[opR][opC] = 0;
        removedCount += 2;
      }
    }
  }

  // 3. Form SudokuCells
  const puzzleCells: SudokuCell[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = puzzle[r][c];
      puzzleCells.push({
        row: r,
        col: c,
        value: val,
        correctValue: solution[r][c],
        isInitial: val !== 0,
        isError: false,
        notes: []
      });
    }
  }

  return {
    puzzleCells,
    solution
  };
}
