#!/bin/sh
set -e

echo "Applying Prisma schema to PostgreSQL..."
npx prisma db push --skip-generate --accept-data-loss

echo "Starting SafeAlert NestJS backend..."
exec "$@"
