-- AlterEnum Role
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SECURITY_OPERATOR';

-- AlterEnum ScheduledJobType
ALTER TYPE "ScheduledJobType" ADD VALUE IF NOT EXISTS 'PROMO_EXPIRE';
ALTER TYPE "ScheduledJobType" ADD VALUE IF NOT EXISTS 'PREMIUM_EXPIRE';
ALTER TYPE "ScheduledJobType" ADD VALUE IF NOT EXISTS 'LOCATION_REQUEST_EXPIRE';

-- Telemetry: stop inventing battery level
ALTER TABLE "telemetry_points" ALTER COLUMN "batteryLevel" DROP DEFAULT;
ALTER TABLE "telemetry_points" ALTER COLUMN "batteryLevel" DROP NOT NULL;

-- Journal media snapshot for citizen incident history
ALTER TABLE "journals" ADD COLUMN IF NOT EXISTS "mediaItems" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "journals" ADD COLUMN IF NOT EXISTS "alertId" TEXT;
CREATE INDEX IF NOT EXISTS "journals_alertId_idx" ON "journals"("alertId");

-- Bystander one-time + outbound delivery tracking
ALTER TABLE "bystander_relays" ADD COLUMN IF NOT EXISTS "outboundChannel" TEXT;
ALTER TABLE "bystander_relays" ADD COLUMN IF NOT EXISTS "outboundStatus" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "bystander_relays_senderUserId_groupId_targetPhoneDigits_key"
  ON "bystander_relays"("senderUserId", "groupId", "targetPhoneDigits");

-- Device push tokens for FCM/APNs pipeline
CREATE TABLE IF NOT EXISTS "device_push_tokens" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "platform" TEXT NOT NULL DEFAULT 'unknown',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "device_push_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "device_push_tokens_userId_token_key"
  ON "device_push_tokens"("userId", "token");
CREATE INDEX IF NOT EXISTS "device_push_tokens_userId_idx" ON "device_push_tokens"("userId");

DO $$ BEGIN
  ALTER TABLE "device_push_tokens"
    ADD CONSTRAINT "device_push_tokens_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
