#!/usr/bin/env bash
set -euo pipefail
npm --prefix justice-dashboard ci
npm --prefix justice-dashboard run build
rm -rf public/dashboard
mkdir -p public
cp -R justice-dashboard/dist public/dashboard
echo "✅ Published Vite dashboard to public/dashboard"
