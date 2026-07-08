# eFundo

Learning platform for Zimbabwean students — past exam papers, notes, textbooks, lessons, and practice tests.

## Stack

| Layer | Technology |
|-------|------------|
| Web | Next.js 15, TypeScript, Tailwind CSS, TanStack Query |
| API | NestJS, Prisma, PostgreSQL (native) |
| Storage | MinIO (S3-compatible, optional Docker) |
| Cache | Redis (optional Docker) |

## Project structure

```
efundo/
├── apps/
│   ├── api/          # NestJS REST API
│   └── web/          # Next.js web app
├── packages/
│   └── shared-types/ # Shared TypeScript types
└── scripts/
    └── setup-postgres.sh   # Native PostgreSQL setup
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (native install)
- Docker (optional — only for Redis & MinIO in later phases)

## Quick start

### 1. Install dependencies

```bash
cd ~/Projects/efundo
npm install
```

### 2. Install and configure PostgreSQL

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
chmod +x scripts/setup-postgres.sh
./scripts/setup-postgres.sh
```

See [docs/DATABASE.md](docs/DATABASE.md) for full details and troubleshooting.

### 3. Set up the database schema

```bash
cp .env.example apps/api/.env   # if not already present
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Start development servers

```bash
npm run dev
```

- **Web:** http://localhost:3000
- **API:** http://localhost:3001
- **Swagger:** http://localhost:3001/api/docs

### Optional: Redis & MinIO (Phase 2+)

```bash
docker compose up -d
```

- **MinIO Console:** http://localhost:9001 (efundo / efundominio)

## Default accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@efundo.co.zw | Admin123! |

## Seeded institutions

- University of Zimbabwe (UZ)
- Midlands State University (MSU)
- NUST
- Chinhoyi University of Technology (CUT)
- Great Zimbabwe University (GZU)
- Mutare Teachers College (MTC)

Each institution includes a sample BSc Computer Science course with Year 1–4 subjects.

## API endpoints (Phase 1)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Student registration |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh token |
| GET | `/api/v1/users/me` | Current user profile |
| PATCH | `/api/v1/users/me` | Update profile / onboarding |
| GET | `/api/v1/institutions` | List institutions |
| GET | `/api/v1/institutions/:id/courses` | Courses by institution |
| GET | `/api/v1/courses/:id/subjects` | Subjects by course |

## Development phases

- [x] **Phase 0** — Monorepo, native PostgreSQL, CI-ready structure
- [x] **Phase 1** — Auth, institutions, onboarding, admin shell
- [x] **Phase 1.1** — Admin CRUD forms (institutions, catalog, users)
- [x] **Phase 2** — Digital library (upload, search, downloads, bookmarks, moderation)
- [x] **Phase 3** — LMS (lessons, progress, forums, AI tutor, lesson authoring)
- [ ] **Phase 4** — Assessment engine (quizzes, mock exams) *(in progress)*
- [ ] **Phase 5** — Flutter mobile app
- [ ] **Phase 6** — Premium subscriptions & AI assistant

## Troubleshooting

### `Cannot GET /login` (JSON 404)

That response comes from the **API** (NestJS), not the web app. The login page lives on the Next.js server.

| Use this | Not this |
|----------|----------|
| http://localhost:3000/login | http://localhost:3001/login |

Run both servers with `npm run dev`. If you only started the API (`npm run dev:api`), start the web app too: `npm run dev:web`.

After the latest API update, hitting `/login` on port 3001 redirects to the web app automatically.

## Scripts

```bash
npm run dev          # Start API + web concurrently
npm run dev:api      # API only
npm run dev:web      # Web only
npm run build        # Build all packages
npm run db:setup       # Create PostgreSQL user & database (native)
npm run db:migrate     # Apply migrations (non-interactive)
npm run db:migrate:dev # Create/apply migrations during development
npm run db:seed      # Seed institutions & admin
npm run db:studio    # Open Prisma Studio
```

## License

Private — all rights reserved.

## Google AdSense

The marketing site includes Privacy Policy, Terms, About, Contact, cookie consent, `ads.txt`, sitemap, and optional AdSense script loading. See [docs/ADSENSE.md](docs/ADSENSE.md) for the full approval checklist.
