# Native PostgreSQL setup for eFundo

eFundo uses **PostgreSQL installed on your machine**, not Docker.

## Install PostgreSQL (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

Verify it is running:

```bash
sudo systemctl status postgresql
pg_isready
```

## Create database and user

From the project root:

```bash
chmod +x scripts/setup-postgres.sh
./scripts/setup-postgres.sh
```

Or manually:

```bash
sudo -u postgres psql <<'SQL'
CREATE USER efundo WITH PASSWORD 'efundo';
CREATE DATABASE efundo OWNER efundo;
GRANT ALL PRIVILEGES ON DATABASE efundo TO efundo;
SQL

sudo -u postgres psql -d efundo -c "GRANT ALL ON SCHEMA public TO efundo;"
```

## Configure the API

Ensure `apps/api/.env` contains:

```env
DATABASE_URL=postgresql://efundo:efundo@localhost:5432/efundo?schema=public
```

## Run migrations and seed

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Useful commands

```bash
# Open psql shell
psql postgresql://efundo:efundo@localhost:5432/efundo

# Prisma Studio (GUI)
npm run db:studio

# Check connection
pg_isready -h localhost -p 5432
```

## Optional: Redis & MinIO via Docker

File storage (MinIO) and caching (Redis) are still optional Docker services for Phase 2+:

```bash
docker compose up -d
```

The API works without them for Phase 1 (auth, institutions, onboarding).

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Can't reach database server at localhost:5432` | `sudo systemctl start postgresql` |
| `password authentication failed` | Re-run `./scripts/setup-postgres.sh` |
| `Peer authentication failed` | Use connection URL with password, not Unix socket as wrong user |
| `permission denied for schema public` | Run the schema grant commands above |

## Production

Use a strong password and restrict network access. Example:

```env
DATABASE_URL=postgresql://efundo:STRONG_PASSWORD@localhost:5432/efundo?schema=public
```
