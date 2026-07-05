#!/usr/bin/env bash
# Install and configure native PostgreSQL for eFundo (run once with sudo)
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Run with sudo:"
  echo "  sudo ./scripts/install-postgres.sh"
  exit 1
fi

echo "==> Installing PostgreSQL..."
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib

echo "==> Starting PostgreSQL..."
systemctl enable postgresql
systemctl start postgresql

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EFUNDO_DB_USER=efundo EFUNDO_DB_PASSWORD=efundo EFUNDO_DB_NAME=efundo \
  bash "$SCRIPT_DIR/setup-postgres.sh"

echo ""
echo "==> Done! From project root, run:"
echo "  npm run db:migrate"
echo "  npm run db:seed"
echo "  npm run dev"
