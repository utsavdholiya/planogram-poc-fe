#!/usr/bin/env bash
set -euo pipefail

BUCKET="planogram-poc-web"
PROFILE="planogram-poc"

echo "Building project..."
npm run build

echo "Syncing dist/ to s3://${BUCKET} using profile '${PROFILE}'..."
aws s3 sync dist/ "s3://${BUCKET}" \
  --profile "${PROFILE}" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

# Upload index.html with no-cache so updates are picked up immediately
aws s3 cp dist/index.html "s3://${BUCKET}/index.html" \
  --profile "${PROFILE}" \
  --cache-control "no-cache, no-store, must-revalidate"

echo "Deploy complete → s3://${BUCKET}"
