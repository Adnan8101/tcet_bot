#!/bin/bash

# Navigate to script directory to ensure relative paths work
cd "$(dirname "$0")"

echo "Building the bot..."
# Assuming build script is 'npm run build' which runs 'tsc'
npm run build

if [ $? -ne 0 ]; then
  echo "Build failed. Exiting."
  exit 1
fi

APP_NAME="alumni-bot"

# Check if pm2 process exists
pm2 describe $APP_NAME > /dev/null 2>&1
RUNNING=$?

if [ "${RUNNING}" -ne 0 ]; then
  echo "Starting new pm2 process for $APP_NAME..."
  pm2 start dist/index.js --name $APP_NAME
else
  echo "Restarting existing pm2 process for $APP_NAME..."
  pm2 restart $APP_NAME
fi

echo "Saving pm2 configuration..."
pm2 save

echo "Bot deployed successfully!"
