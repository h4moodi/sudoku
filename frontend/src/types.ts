export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Master';

export interface SudokuCell {
  row: number;         // 0 - 8
  col: number;         // 0 - 8
  value: number;       // 0 for empty, 1-9 for filled
  correctValue: number; // The pre-solved correct value
  isInitial: boolean;  // True if given from start
  isError: boolean;    // True if user value is wrong
  notes: number[];     // Pencil marks (1-9)
}

export interface HardcodedRank {
  rank: number;
  username: string;
  timeSec: number;
  avatarUrl: string;
}

export interface UserRun {
  id: string;
  difficulty: Difficulty;
  timeSec: number;
  date: string;
  mistakes: number;
  completed: boolean;
}
