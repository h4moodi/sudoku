# frozen_string_literal: true

# backend/app.rb
# Sinatra API server with CORS support for React Vite frontend
require 'sinatra'
require 'json'
require 'rack/cors'
require_relative 'database'

# CORS Middleware Configuration
use Rack::Cors do
  allow do
    origins 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'
    resource '/api/*',
      headers: :any,
      methods: [:get, :post, :options],
      credentials: true,
      max_age: 86400
  end
end

# Sinatra Configuration
configure do
  set :port, 4567
  set :bind, '0.0.0.0'
  set :show_exceptions, :after_handler
end

# JSON content type for all API responses
before '/api/*' do
  content_type :json
  headers['Access-Control-Allow-Origin'] = request.env['HTTP_ORIGIN'] || '*'
  headers['Access-Control-Allow-Credentials'] = 'true'
end

# Handle OPTIONS preflight requests
options '/api/*' do
  200
end

# Error handler
error do
  status 500
  { error: env['sinatra.error'].message }.to_json
end

# Health check endpoint
get '/api/health' do
  { status: 'ok', timestamp: Time.now.iso8601 }.to_json
end

# GET '/api/leaderboard?difficulty=type'
# Returns top 10 fastest times for the given difficulty
get '/api/leaderboard' do
  difficulty = params[:difficulty] || 'medium'

  unless %w[easy medium hard expert master].include?(difficulty.to_s.downcase)
    status 400
    return { error: "Invalid difficulty. Must be: easy, medium, hard, expert, master" }.to_json
  end

  begin
    scores = SudokuDatabase.fetch_leaderboard(difficulty, 10)
    scores.to_json
  rescue => e
    status 500
    { error: "Failed to retrieve leaderboard: #{e.message}" }.to_json
  end
end

# POST '/api/leaderboard'
# Persists a new high score
# Expected JSON: { "username": "string", "time": number, "difficulty": "string" }
post '/api/leaderboard' do
  begin
    request.body.rewind
    data = JSON.parse(request.body.read)
  rescue JSON::ParserError
    status 400
    return { error: "Invalid JSON format." }.to_json
  end

  username = data['username']
  time_spent = data['time']
  difficulty = data['difficulty']

  # Validate required fields
  if username.to_s.strip.empty? || time_spent.nil? || difficulty.to_s.strip.empty?
    status 400
    return { error: "Missing required fields: username, time, difficulty" }.to_json
  end

  # Validate time is a number
  unless time_spent.is_a?(Numeric)
    status 400
    return { error: "Time must be a number (seconds)." }.to_json
  end

  # Validate difficulty
  unless %w[easy medium hard expert master].include?(difficulty.to_s.downcase)
    status 400
    return { error: "Invalid difficulty. Must be: easy, medium, hard, expert, master" }.to_json
  end

  # Save to database
  success = SudokuDatabase.insert_score(username, time_spent, difficulty)

  if success
    status 201
    { message: "Score saved successfully." }.to_json
  else
    status 500
    { error: "Failed to save score to leaderboard." }.to_json
  end
end