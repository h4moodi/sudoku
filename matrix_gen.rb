# frozen_string_literal: true

# matrix_gen.rb
# Pure Ruby logic for Sudoku generation, validation, and difficulty settings.
module SudokuEngine
  EMPTY = 0

  # Generates a puzzle and its solution based on the difficulty.
  # Returns: [puzzle_board, solution_board]
  # Difficulty levels:
  # - easy:   ~45 clues remaining
  # - medium: ~35 clues remaining
  # - hard:   ~26 clues remaining
  def self.generate(difficulty)
    # 1. Generate a complete, fully solved valid Sudoku board
    solution_board = Array.new(9) { Array.new(9, EMPTY) }
    fill_board(solution_board)

    # 2. Duplicate the solution board to create the puzzle board
    puzzle_board = solution_board.map(&:dup)

    # 3. Determine target clue count based on difficulty
    target_clues = case difficulty.to_s.downcase.to_sym
                   when :easy then 45
                   when :medium then 35
                   when :hard then 26
                   else 35
                   end

    cells_to_remove = 81 - target_clues

    # Shuffle coordinates to randomize the removal process
    coords = (0..80).to_a.shuffle
    removed_count = 0

    coords.each do |idx|
      break if removed_count >= cells_to_remove

      row = idx / 9
      col = idx % 9
      next if puzzle_board[row][col] == EMPTY

      backup = puzzle_board[row][col]
      puzzle_board[row][col] = EMPTY

      # Verify that the puzzle still has a unique solution.
      # Since we know the current board is solvable (with backup),
      # we just check if any other number is valid and can solve the board.
      if unique_solution?(puzzle_board, row, col, backup)
        removed_count += 1
      else
        # Revert if removing this number creates multiple solutions
        puzzle_board[row][col] = backup
      end
    end

    [puzzle_board, solution_board]
  end

  # Fills the board with a valid Sudoku solution using backtracking
  def self.fill_board(board)
    empty = find_empty(board)
    return true unless empty # Board is fully filled

    row, col = empty
    (1..9).to_a.shuffle.each do |num|
      if valid?(board, row, col, num)
        board[row][col] = num
        return true if fill_board(board)
        board[row][col] = EMPTY
      end
    end
    false
  end

  # Checks if placing a number is valid under Sudoku rules
  def self.valid?(board, row, col, num)
    # Check row
    return false if board[row].include?(num)

    # Check column
    return false if board.any? { |r| r[col] == num }

    # Check 3x3 subgrid
    box_row = (row / 3) * 3
    box_col = (col / 3) * 3
    3.times do |r|
      3.times do |c|
        return false if board[box_row + r][box_col + c] == num
      end
    end

    true
  end

  # Solves the Sudoku board using standard backtracking
  # Modifies the board and returns true if a solution is found
  def self.solve!(board)
    empty = find_empty(board)
    return true unless empty

    row, col = empty
    (1..9).each do |num|
      if valid?(board, row, col, num)
        board[row][col] = num
        return true if solve!(board)
        board[row][col] = EMPTY
      end
    end
    false
  end

  # Helper to find the first empty cell on the board
  def self.find_empty(board)
    9.times do |row|
      9.times do |col|
        return [row, col] if board[row][col] == EMPTY
      end
    end
    nil
  end

  # Verifies if a board has exactly one unique solution.
  # Since we are removing the value at [row, col] which was `backup`, we check
  # whether setting [row, col] to any OTHER valid value can produce a complete solution.
  # If no other value works, then the puzzle has a unique solution.
  def self.unique_solution?(board, row, col, backup)
    (1..9).each do |num|
      next if num == backup
      next unless valid?(board, row, col, num)

      # Attempt to solve with this alternative value
      temp_board = board.map(&:dup)
      temp_board[row][col] = num
      if solve!(temp_board)
        # Found an alternative solution! Uniqueness is violated.
        return false
      end
    end
    true
  end
end
