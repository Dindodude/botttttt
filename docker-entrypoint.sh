#!/bin/sh
set -e

mkdir -p /app/data/backups

echo "Starting Kaiju Reincarnated bot"
echo "Working directory: $(pwd)"
echo "Command: $*"
echo "Node version: $(node --version)"

if [ "$#" -eq 0 ]; then
  exec node /bot/index.js
fi

exec "$@"
