# frozen_string_literal: true

# backend/database.rb
# PostgreSQL configuration for leaderboards.
# Schema: id, username, time_spent_seconds, difficulty, created_at
# Connects via DATABASE_URL environment variable (provided by Render).
require 'pg'

module SudokuDatabase
  def self.connection
    PG.connect(ENV.fetch('DATABASE_URL'))
  end

  def self.init_db!
    db = connection
    db.exec(<<-SQL)
      CREATE TABLE IF NOT EXISTS scores (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        time_spent_seconds FLOAT NOT NULL,
        difficulty TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    SQL

    db.exec(<<-SQL)
      CREATE INDEX IF NOT EXISTS idx_scores_difficulty_time
      ON scores (difficulty, time_spent_seconds ASC);
    SQL

    db.close
  rescue => e
    warn "Database init warning: #{e.message}"
  end

  def self.insert_score(username, time_spent_seconds, difficulty)
    cleaned_username = username.to_s.strip
    return false if cleaned_username.empty?

    db = connection
    begin
      db.exec_params(
        "INSERT INTO scores (username, time_spent_seconds, difficulty) VALUES ($1, $2, $3);",
        [cleaned_username, time_spent_seconds.to_f, difficulty.to_s.downcase]
      )
      true
    rescue PG::Error => e
      warn "Database error inserting score: #{e.message}"
      false
    ensure
      db&.close
    end
  end

  def self.fetch_leaderboard(difficulty, limit = 10)
    db = connection
    begin
      result = db.exec_params(
        "SELECT id, username, time_spent_seconds, difficulty, created_at
         FROM scores
         WHERE difficulty = $1
         ORDER BY time_spent_seconds ASC
         LIMIT $2;",
        [difficulty.to_s.downcase, limit]
      )
      result.map { |row| row }
    rescue PG::Error => e
      warn "Database error fetching leaderboard: #{e.message}"
      []
    ensure
      db&.close
    end
  end
end

# Auto-initialize table when loaded
SudokuDatabase.init_db!