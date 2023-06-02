# List available just recipes for this project
list:
  just --list

# Format the code
format:
  npm run format

# Check code formatting
check-format:
  npm run check-format

# Start local database server
db-start:
  docker-compose up --detach

# Stop local database server
db-stop:
  docker-compose stop

# Run server
dev:
  npm run start
