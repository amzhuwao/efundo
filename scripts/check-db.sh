#!/usr/bin/env bash
# Quick check that PostgreSQL is reachable before starting the API
set -euo pipefail

HOST="${1:-localhost}"
PORT="${2:-5432}"

if command -v pg_isready &>/dev/null; then
  if pg_isready -h "$HOST" -p "$PORT" -q 2>/dev/null; then
    echo "PostgreSQL is running on ${HOST}:${PORT}"
    exit 0
  fi
fi

# Fallback: try TCP connect without pg_isready
if (echo >/dev/tcp/"$HOST"/"$PORT") 2>/dev/null; then
  echo "PostgreSQL is reachable on ${HOST}:${PORT}"
  exit 0
fi

echo ""
echo "ERROR: PostgreSQL is not running on ${HOST}:${PORT}"
echo ""
echo "Install and set up the database:"
echo "  cd ~/Projects/efundo"
echo "  sudo ./scripts/install-postgres.sh"
echo ""
echo "Or if PostgreSQL is already installed:"
echo "  sudo systemctl start postgresql"
echo "  ./scripts/setup-postgres.sh"
echo ""
echo "Then run:"
echo "  npm run db:migrate && npm run db:seed"
echo ""
exit 1
