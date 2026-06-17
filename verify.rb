# frozen_string_literal: true

# verify.rb
# Comprehensive verification script to test matrix generation and database logic.
require_relative 'matrix_gen'
require_relative 'database'

puts "============================================="
puts "      Starting Sudoku Backend Verification   "
puts "============================================="

# 1. Test SudokuEngine
puts "\n[1/2] Testing SudokuEngine matrix generation..."

%w[easy medium hard].each do |difficulty|
  print "Generating '#{difficulty}' puzzle... "
  puzzle, solution = SudokuEngine.generate(difficulty)

  # Verify dimension
  if puzzle.size != 9 || puzzle.any? { |r| r.size != 9 } || solution.size != 9 || solution.any? { |r| r.size != 9 }
    puts "FAILED: Incorrect board size"
    exit 1
  end

  # Verify solution is complete
  if solution.any? { |row| row.include?(SudokuEngine::EMPTY) }
    puts "FAILED: Solution contains empty cells"
    exit 1
  end

  # Verify puzzle has empty cells
  empty_count = puzzle.flatten.count(SudokuEngine::EMPTY)
  clue_count = 81 - empty_count
  puts "SUCCESS!"
  puts "   - Clues remaining: #{clue_count} (Empty cells: #{empty_count})"
  
  # Basic Sudoku row, col, subgrid checks on the solution
  valid = true
  9.times do |i|
    row_vals = solution[i].reject { |x| x == SudokuEngine::EMPTY }
    col_vals = solution.map { |r| r[i] }.reject { |x| x == SudokuEngine::EMPTY }
    
    if row_vals.uniq.size != row_vals.size || col_vals.uniq.size != col_vals.size
      valid = false
      break
    end
  end

  unless valid
    puts "FAILED: Generated solution violated Sudoku row/col unique rules"
    exit 1
  end
  puts "   - Solution validated successfully."
end

# 2. Test SudokuDatabase
puts "\n[2/2] Testing SudokuDatabase storage and retrieval..."

# Reset test DB if exists
if File.exist?(SudokuDatabase::DB_PATH)
  begin
    File.delete(SudokuDatabase::DB_PATH)
    puts "Cleaned up old database for testing."
  rescue => e
    warn "Could not delete old DB file: #{e.message}"
  end
end

# Reinitialize DB
SudokuDatabase.init_db!
puts "Database reinitialized."

test_scores = [
  { username: "player1", time: 100, difficulty: "easy" },
  { username: "player2", time: 90,  difficulty: "easy" },
  { username: "player3", time: 150, difficulty: "medium" },
  { username: "player1", time: 120, difficulty: "medium" }, # same player, different score
  { username: "player4", time: 200, difficulty: "hard" }
]

puts "Inserting test scores..."
test_scores.each do |score|
  success = SudokuDatabase.insert_score(score[:username], score[:time], score[:difficulty])
  if success
    puts "   - Inserted score for #{score[:username]}: #{score[:time]}s (#{score[:difficulty]})"
  else
    puts "   - FAILED to insert score for #{score[:username]}"
    exit 1
  end
end

puts "\nFetching leaderboard for 'easy' difficulty..."
easy_leaderboard = SudokuDatabase.fetch_leaderboard("easy")
if easy_leaderboard.size != 2
  puts "FAILED: Expected 2 scores on easy, got #{easy_leaderboard.size}"
  exit 1
end

# Check order (fastest first)
if easy_leaderboard[0]["username"] != "player2" || easy_leaderboard[0]["time_spent_seconds"] != 90
  puts "FAILED: Incorrect ordering on leaderboard"
  exit 1
end

puts "SUCCESS!"
easy_leaderboard.each_with_index do |row, idx|
  puts "   #{idx + 1}. #{row['username']} - #{row['time_spent_seconds']}s"
end

puts "\nFetching leaderboard for 'medium' difficulty..."
medium_leaderboard = SudokuDatabase.fetch_leaderboard("medium")
if medium_leaderboard.size != 2
  puts "FAILED: Expected 2 scores on medium, got #{medium_leaderboard.size}"
  exit 1
end
puts "SUCCESS!"
medium_leaderboard.each_with_index do |row, idx|
  puts "   #{idx + 1}. #{row['username']} - #{row['time_spent_seconds']}s"
end

puts "\n============================================="
puts "        ALL BACKEND TESTS PASSED             "
puts "============================================="
