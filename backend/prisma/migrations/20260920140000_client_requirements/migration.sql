-- CreateEnum
CREATE TYPE "ContactGroupKind" AS ENUM ('FAMILY_FRIENDS', 'GENERAL');
CREATE TYPE "SafetyCountdownStatus" AS ENUM ('ACTIVE', 'CONFIRMED_SAFE', 'CANCELLED', 'ESCALATED');
CREATE TYPE "ScheduledJobType" AS ENUM ('COUNTDOWN_EXPIRE', 'ALERT_FOLLOW_UP');
CREATE TYPE "ScheduledJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED', 'CANCELLED');
CREATE TYPE "LocationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'EXPIRED');
CREATE TYPE "PromoCodeStatus" AS ENUM ('ACTIVE', 'DISABLED', 'EXPIRED');
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'NONE');

-- AlterEnum NotificationType
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SAFETY_COUNTDOWN';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FOLLOW_UP_ALERT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LOCATION_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BYSTANDER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PROMO';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'COUNTDOWN_ESCALATED';

-- AlterTable contact_groups
ALTER TABLE "contact_groups" ADD COLUMN IF NOT EXISTS "kind" "ContactGroupKind" NOT NULL DEFAULT 'GENERAL';
UPDATE "contact_groups" SET "kind" = 'FAMILY_FRIENDS' WHERE LOWER("name") LIKE '%family%';

-- AlterTable group_invitations
ALTER TABLE "group_invitations" ADD COLUMN IF NOT EXISTS "token" TEXT;
ALTER TABLE "group_invitations" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "group_invitations" ADD COLUMN IF NOT EXISTS "maxUses" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "group_invitations" ADD COLUMN IF NOT EXISTS "useCount" INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS "group_invitations_token_key" ON "group_invitations"("token");
CREATE INDEX IF NOT EXISTS "group_invitations_token_idx" ON "group_invitations"("token");

-- AlterTable alerts
ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "followUpSentAt" TIMESTAMP(3);

-- AlterTable live_messages
ALTER TABLE "live_messages" ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT;
ALTER TABLE "live_messages" ADD COLUMN IF NOT EXISTS "mediaType" "MediaType" NOT NULL DEFAULT 'NONE';
ALTER TABLE "live_messages" ADD COLUMN IF NOT EXISTS "mimeType" TEXT;

-- CreateTable safety_countdowns
CREATE TABLE IF NOT EXISTS "safety_countdowns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SafetyCountdownStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "alertId" TEXT,
    "notes" TEXT,
    CONSTRAINT "safety_countdowns_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "safety_countdowns_userId_status_idx" ON "safety_countdowns"("userId", "status");
CREATE INDEX IF NOT EXISTS "safety_countdowns_expiresAt_status_idx" ON "safety_countdowns"("expiresAt", "status");

-- CreateTable scheduled_jobs
CREATE TABLE IF NOT EXISTS "scheduled_jobs" (
    "id" TEXT NOT NULL,
    "type" "ScheduledJobType" NOT NULL,
    "refId" TEXT NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL,
    "status" "ScheduledJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "scheduled_jobs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "scheduled_jobs_type_refId_key" ON "scheduled_jobs"("type", "refId");
CREATE INDEX IF NOT EXISTS "scheduled_jobs_status_runAt_idx" ON "scheduled_jobs"("status", "runAt");

-- CreateTable location_requests
CREATE TABLE IF NOT EXISTS "location_requests" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "status" "LocationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "location_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "location_requests_targetUserId_status_idx" ON "location_requests"("targetUserId", "status");
CREATE INDEX IF NOT EXISTS "location_requests_requesterId_status_idx" ON "location_requests"("requesterId", "status");
CREATE INDEX IF NOT EXISTS "location_requests_groupId_idx" ON "location_requests"("groupId");

-- CreateTable promo_codes
CREATE TABLE IF NOT EXISTS "promo_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "maxRedemptions" INTEGER NOT NULL DEFAULT 1,
    "redemptionCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "status" "PromoCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "promo_codes_code_key" ON "promo_codes"("code");
CREATE INDEX IF NOT EXISTS "promo_codes_status_idx" ON "promo_codes"("status");

-- CreateTable promo_redemptions
CREATE TABLE IF NOT EXISTS "promo_redemptions" (
    "id" TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedUntil" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "promo_redemptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "promo_redemptions_promoCodeId_userId_key" ON "promo_redemptions"("promoCodeId", "userId");
CREATE INDEX IF NOT EXISTS "promo_redemptions_userId_idx" ON "promo_redemptions"("userId");

-- CreateTable dashboard_coverage
CREATE TABLE IF NOT EXISTS "dashboard_coverage" (
    "id" TEXT NOT NULL,
    "operatorUserId" TEXT NOT NULL,
    "subscriberUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dashboard_coverage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "dashboard_coverage_operatorUserId_subscriberUserId_key" ON "dashboard_coverage"("operatorUserId", "subscriberUserId");
CREATE INDEX IF NOT EXISTS "dashboard_coverage_operatorUserId_idx" ON "dashboard_coverage"("operatorUserId");
CREATE INDEX IF NOT EXISTS "dashboard_coverage_subscriberUserId_idx" ON "dashboard_coverage"("subscriberUserId");

-- CreateTable conversations
CREATE TABLE IF NOT EXISTS "conversations" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "conversations_userAId_userBId_key" ON "conversations"("userAId", "userBId");
CREATE INDEX IF NOT EXISTS "conversations_userAId_idx" ON "conversations"("userAId");
CREATE INDEX IF NOT EXISTS "conversations_userBId_idx" ON "conversations"("userBId");

-- CreateTable direct_messages
CREATE TABLE IF NOT EXISTS "direct_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "mediaUrl" TEXT,
    "mediaType" "MediaType" NOT NULL DEFAULT 'NONE',
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "direct_messages_conversationId_createdAt_idx" ON "direct_messages"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "direct_messages_senderUserId_idx" ON "direct_messages"("senderUserId");

-- CreateTable bystander_relays
CREATE TABLE IF NOT EXISTS "bystander_relays" (
    "id" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "targetPhone" TEXT NOT NULL,
    "targetPhoneDigits" TEXT NOT NULL,
    "targetName" TEXT,
    "groupId" TEXT NOT NULL,
    "alertId" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bystander_relays_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "bystander_relays_senderUserId_idx" ON "bystander_relays"("senderUserId");
CREATE INDEX IF NOT EXISTS "bystander_relays_groupId_idx" ON "bystander_relays"("groupId");
CREATE INDEX IF NOT EXISTS "bystander_relays_alertId_idx" ON "bystander_relays"("alertId");

-- Foreign keys
ALTER TABLE "safety_countdowns" DROP CONSTRAINT IF EXISTS "safety_countdowns_userId_fkey";
ALTER TABLE "safety_countdowns" ADD CONSTRAINT "safety_countdowns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_countdowns" DROP CONSTRAINT IF EXISTS "safety_countdowns_alertId_fkey";
ALTER TABLE "safety_countdowns" ADD CONSTRAINT "safety_countdowns_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "alerts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "location_requests" DROP CONSTRAINT IF EXISTS "location_requests_requesterId_fkey";
ALTER TABLE "location_requests" ADD CONSTRAINT "location_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "location_requests" DROP CONSTRAINT IF EXISTS "location_requests_targetUserId_fkey";
ALTER TABLE "location_requests" ADD CONSTRAINT "location_requests_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "location_requests" DROP CONSTRAINT IF EXISTS "location_requests_groupId_fkey";
ALTER TABLE "location_requests" ADD CONSTRAINT "location_requests_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "contact_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "promo_redemptions" DROP CONSTRAINT IF EXISTS "promo_redemptions_promoCodeId_fkey";
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "promo_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "promo_redemptions" DROP CONSTRAINT IF EXISTS "promo_redemptions_userId_fkey";
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dashboard_coverage" DROP CONSTRAINT IF EXISTS "dashboard_coverage_operatorUserId_fkey";
ALTER TABLE "dashboard_coverage" ADD CONSTRAINT "dashboard_coverage_operatorUserId_fkey" FOREIGN KEY ("operatorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dashboard_coverage" DROP CONSTRAINT IF EXISTS "dashboard_coverage_subscriberUserId_fkey";
ALTER TABLE "dashboard_coverage" ADD CONSTRAINT "dashboard_coverage_subscriberUserId_fkey" FOREIGN KEY ("subscriberUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "conversations_userAId_fkey";
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "conversations_userBId_fkey";
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "direct_messages" DROP CONSTRAINT IF EXISTS "direct_messages_conversationId_fkey";
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "direct_messages" DROP CONSTRAINT IF EXISTS "direct_messages_senderUserId_fkey";
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bystander_relays" DROP CONSTRAINT IF EXISTS "bystander_relays_senderUserId_fkey";
ALTER TABLE "bystander_relays" ADD CONSTRAINT "bystander_relays_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bystander_relays" DROP CONSTRAINT IF EXISTS "bystander_relays_targetUserId_fkey";
ALTER TABLE "bystander_relays" ADD CONSTRAINT "bystander_relays_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bystander_relays" DROP CONSTRAINT IF EXISTS "bystander_relays_groupId_fkey";
ALTER TABLE "bystander_relays" ADD CONSTRAINT "bystander_relays_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "contact_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bystander_relays" DROP CONSTRAINT IF EXISTS "bystander_relays_alertId_fkey";
ALTER TABLE "bystander_relays" ADD CONSTRAINT "bystander_relays_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "alerts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "contact_groups_kind_idx" ON "contact_groups"("kind");
