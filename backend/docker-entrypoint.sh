#!/bin/sh
set -e

echo "Collapsing obsolete Role enum values..."
npx prisma db execute --file prisma/sql/collapse-roles.sql --schema prisma/schema.prisma || echo "Role collapse skipped (fresh database)"

echo "Applying Prisma schema to PostgreSQL..."
npx prisma db push --skip-generate --accept-data-loss

echo "Starting SafeAlert NestJS backend..."
exec "$@"
