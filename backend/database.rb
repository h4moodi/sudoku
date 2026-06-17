# frozen_string_literal: true

# backend/database.rb
# SQLite3 configuration for leaderboards with exact schema:
# id, username, time_spent_seconds, difficulty, created_at
require 'sqlite3'
require 'fileutils'

module SudokuDatabase
  DB_PATH = File.expand_path('sudoku.db', __dir__)

  def self.init_db!
    db = SQLite3::Database.new(DB_PATH)
    db.results_as_hash = true
    db.execute("PRAGMA foreign_keys = ON;")

    db.execute <<-SQL
      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        time_spent_seconds INTEGER NOT NULL,
        difficulty TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    SQL

    # Index for faster leaderboard queries
    db.execute <<-SQL
      CREATE INDEX IF NOT EXISTS idx_scores_difficulty_time 
      ON scores (difficulty, time_spent_seconds ASC);
    SQL

    db.close
  end

  def self.connection
    db = SQLite3::Database.new(DB_PATH)
    db.results_as_hash = true
    db.execute("PRAGMA foreign_keys = ON;")
    db
  end

  def self.insert_score(username, time_spent_seconds, difficulty)
    cleaned_username = username.to_s.strip
    return false if cleaned_username.empty?

    db = connection
    begin
      db.execute(
        "INSERT INTO scores (username, time_spent_seconds, difficulty) VALUES (?, ?, ?);",
        [cleaned_username, time_spent_seconds.to_i, difficulty.to_s.downcase]
      )
      true
    rescue SQLite3::Exception => e
      warn "Database error inserting score: #{e.message}"
      false
    ensure
      db.close if db
    end
  end

  def self.fetch_leaderboard(difficulty, limit = 10)
    db = connection
    begin
      db.execute(
        "SELECT id, username, time_spent_seconds, difficulty, created_at 
         FROM scores 
         WHERE difficulty = ? 
         ORDER BY time_spent_seconds ASC 
         LIMIT ?;",
        [difficulty.to_s.downcase, limit]
      )
    rescue SQLite3::Exception => e
      warn "Database error fetching leaderboard: #{e.message}"
      []
    ensure
      db.close if db
    end
  end
end

# Auto-initialize when loaded
SudokuDatabase.init_db!