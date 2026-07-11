# eFundo Mobile

Flutter companion app for the eFundo learning platform.

## Setup

From the monorepo root:

```bash
npm run mobile:setup
```

## Run

Start the API first (`npm run dev:api`), then:

```bash
cd apps/mobile

# Linux desktop (easiest for local development)
flutter run -d linux

# Chrome
flutter run -d chrome

# Android emulator (use host loopback alias)
flutter run -d emulator-5554 --dart-define=API_BASE_URL=http://10.0.2.2:3001/api/v1
```

See [docs/MOBILE.md](../../docs/MOBILE.md) for API URL notes and troubleshooting.
