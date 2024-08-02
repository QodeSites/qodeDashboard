#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

echo "Navigating to project directory..."
cd /var/www/www.dashboard.com || { echo "Failed to navigate to project directory"; exit 1; }

echo "Stashing local changes..."
git stash || { echo "Failed to stash local changes"; exit 1; }

echo "Pulling latest changes..."
git pull origin main || { echo "Failed to pull latest changes"; exit 1; }

echo "Installing dependencies..."
npm install || { echo "Failed to install dependencies"; exit 1; }

echo "Building the React project..."
npm run build || { echo "Failed to build the React project"; exit 1; }

echo "Restarting the application with PM2..."
pm2 restart react-app || pm2 start serve --name "react-app" -- -s build || { echo "Failed to restart/start the application with PM2"; exit 1; }

echo "Reapplying stashed changes..."
git stash pop || { echo "Failed to reapply stashed changes"; exit 1; }

echo "Deployment script completed."
