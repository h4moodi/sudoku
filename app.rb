# frozen_string_literal: true

# app.rb
# Main server configuration and API routes for the Sudoku game.
require 'sinatra'
require 'json'
require 'rack/cors'
require_relative 'matrix_gen'
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

# Configure Sinatra settings
configure do
  enable :sessions
  # Set a session secret for session security (should be changed in production)
  set :session_secret, ENV.fetch('SESSION_SECRET', '5242fafe3a757da62106ebd01f8769a558521d354714872c1a4236394a43e7d3')
  set :show_exceptions, :after_handler
end

# Handle OPTIONS preflight requests
options '/api/*' do
  200
end

# Ensure we return JSON content type for API endpoints
before '/api/*' do
  content_type :json
  headers['Access-Control-Allow-Origin'] = request.env['HTTP_ORIGIN'] || '*'
  headers['Access-Control-Allow-Credentials'] = 'true'
end

# Error handler for internal server errors
error do
  status 500
  { error: env['sinatra.error'].message }.to_json
end

# GET '/' -> Renders a clean index view with API documentation
get '/' do
  erb :index
end

# GET '/api/puzzle?difficulty=type'
# Calls SudokuEngine, stores the full solution in the session, and returns the puzzle matrix.
get '/api/puzzle' do
  difficulty = params[:difficulty] || 'medium'
  
  # Validate difficulty input
  unless %w[easy medium hard expert master].include?(difficulty.to_s.downcase)
    status 400
    return { error: "Invalid difficulty level. Must be 'easy', 'medium', 'hard', 'expert', or 'master'." }.to_json
  end

  begin
    puzzle, solution = SudokuEngine.generate(difficulty)

    # Store full solution in session for verification
    session[:solution] = solution
    session[:difficulty] = difficulty

    # Return the puzzle matrix and current difficulty
    {
      puzzle: puzzle,
      difficulty: difficulty
    }.to_json
  rescue => e
    status 500
    { error: "Failed to generate puzzle: #{e.message}" }.to_json
  end
end

# GET '/api/leaderboard?difficulty=type'
# Returns the top scores from the database.
get '/api/leaderboard' do
  difficulty = params[:difficulty] || 'medium'

  unless %w[easy medium hard expert master].include?(difficulty.to_s.downcase)
    status 400
    return { error: "Invalid difficulty level. Must be 'easy', 'medium', 'hard', 'expert', or 'master'." }.to_json
  end

  begin
    scores = SudokuDatabase.fetch_leaderboard(difficulty)
    scores.to_json
  rescue => e
    status 500
    { error: "Failed to retrieve leaderboard: #{e.message}" }.to_json
  end
end

# POST '/api/leaderboard'
# Receives username, time, and difficulty via JSON, and saves it to the DB.
post '/api/leaderboard' do
  # Parse JSON request body
  begin
    request.body.rewind
    data = JSON.parse(request.body.read)
  rescue JSON::ParserError
    status 400
    return { error: "Invalid JSON format." }.to_json
  end

  username = data['username']
  time_spent = data['time'] # Expected in seconds
  difficulty = data['difficulty']

  # Validate presence of fields
  if username.to_s.strip.empty? || time_spent.nil? || difficulty.to_s.strip.empty?
    status 400
    return { error: "Missing required fields. Provide 'username', 'time', and 'difficulty'." }.to_json
  end

  # Validate field types/constraints
  unless time_spent.is_a?(Numeric)
    status 400
    return { error: "Time must be an integer representing seconds." }.to_json
  end

  unless %w[easy medium hard expert master].include?(difficulty.to_s.downcase)
    status 400
    return { error: "Invalid difficulty level. Must be 'easy', 'medium', 'hard', 'expert', or 'master'." }.to_json
  end

  # Save to Database
  success = SudokuDatabase.insert_score(username, time_spent, difficulty)

  if success
    status 201
    { message: "Score saved successfully." }.to_json
  else
    status 500
    { error: "Failed to save score to leaderboard." }.to_json
  end
end
