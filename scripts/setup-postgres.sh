#!/usr/bin/env bash
# Set up native PostgreSQL for eFundo (Ubuntu/Debian)
set -euo pipefail

DB_USER="${EFUNDO_DB_USER:-efundo}"
DB_PASS="${EFUNDO_DB_PASSWORD:-efundo}"
DB_NAME="${EFUNDO_DB_NAME:-efundo}"

echo "==> eFundo PostgreSQL setup"
echo "    Database: $DB_NAME"
echo "    User:     $DB_USER"

if ! command -v psql &>/dev/null; then
  echo ""
  echo "PostgreSQL client not found. Install with:"
  echo "  sudo apt update && sudo apt install -y postgresql postgresql-contrib"
  exit 1
fi

if ! systemctl is-active --quiet postgresql 2>/dev/null; then
  echo ""
  echo "PostgreSQL service is not running. Start it with:"
  echo "  sudo systemctl enable --now postgresql"
  exit 1
fi

echo "==> Creating role and database (requires sudo postgres access)..."

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  ELSE
    ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec

GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

# PostgreSQL 15+ requires explicit schema grants
sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$DB_NAME" <<SQL
GRANT ALL ON SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};
SQL

echo ""
echo "==> PostgreSQL ready!"
echo ""
echo "Connection string:"
echo "  postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public"
echo ""
echo "Next steps (from project root):"
echo "  npm run db:migrate"
echo "  npm run db:seed"
echo "  npm run dev"
