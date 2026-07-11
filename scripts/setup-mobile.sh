#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/apps/mobile"

if ! command -v flutter >/dev/null 2>&1; then
  echo "Flutter SDK not found."
  echo "Install from https://docs.flutter.dev/get-started/install/linux"
  echo "  sudo snap install flutter --classic"
  echo "  flutter doctor"
  exit 1
fi

cd "$MOBILE"

if [ ! -d android ] || [ ! -d ios ] || [ ! -d linux ] || [ ! -d web ]; then
  echo "Generating platform projects…"
  flutter create . \
    --org co.zw.efundo \
    --project-name efundo_mobile \
    --platforms=android,ios,linux,web
fi

flutter pub get
flutter analyze

echo ""
echo "Mobile app ready. Run with:"
echo "  cd apps/mobile"
echo "  flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001/api/v1"
