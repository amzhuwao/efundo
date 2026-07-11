# eFundo Mobile (Flutter)

Phase 5 companion app for Android and iOS. Shares the same NestJS API as the web app.

## Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) 3.24+
- Android Studio and/or Xcode for emulators
- API running locally (`npm run dev:api`) or a deployed API URL

## First-time setup

```bash
chmod +x scripts/setup-mobile.sh
./scripts/setup-mobile.sh
```

This runs `flutter create` for platform folders (if missing) and `flutter pub get`.

## API base URL

| Environment | `API_BASE_URL` |
|-------------|----------------|
| Android emulator | `http://10.0.2.2:3001/api/v1` |
| iOS simulator | `http://localhost:3001/api/v1` |
| Physical device | `http://<your-lan-ip>:3001/api/v1` |

```bash
cd apps/mobile
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001/api/v1
```

## Features (Phase 5)

- Login and registration with persistent token storage
- JWT refresh (same flow as web)
- Bottom navigation: Home, Library, Learn, Practice, Profile
- Library browse and resource detail
- Lesson catalog by subject
- Practice quizzes and mock exams list + **in-app quiz taking** with timer and results
- Offline file downloads to device storage (library resources)

## Project layout

```
apps/mobile/lib/
├── config/          # API URL and constants
├── core/            # API client, auth, theme
├── models/          # Dart data classes
├── providers/       # Riverpod state
├── router/          # go_router routes
├── features/        # Screens by domain
└── widgets/         # Shared UI
```

## Troubleshooting

### Connection refused on Android emulator

Use `10.0.2.2` instead of `localhost` — that is the host machine from the emulator.

### Cleartext HTTP blocked (Android)

The generated `android/app/src/main/AndroidManifest.xml` may need `android:usesCleartextTraffic="true"` on the `<application>` tag for local dev HTTP.

### Login works on web but not mobile

Confirm the API listens on `0.0.0.0` (default NestJS) and your firewall allows port 3001 from the device network.

### Downloads fail on Android emulator

The API returns file URLs using `API_PUBLIC_URL` (defaults to `http://localhost:3001`). On the emulator, set in `apps/api/.env`:

```
API_PUBLIC_URL=http://10.0.2.2:3001
```

Restart the API after changing this.
