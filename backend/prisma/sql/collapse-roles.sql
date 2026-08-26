-- Collapse Role to USER | SUPER_ADMIN without deleting users.
-- ADMIN      → SUPER_ADMIN (dashboard)
-- OPS_ADMIN  → USER (app)

DO $$
DECLARE
  has_user_table boolean;
  has_obsolete boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) INTO has_user_table;

  IF NOT has_user_table THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'Role'
      AND e.enumlabel NOT IN ('USER', 'SUPER_ADMIN')
  ) INTO has_obsolete;

  IF NOT has_obsolete THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'Role' AND e.enumlabel = 'ADMIN'
  ) THEN
    UPDATE "users" SET role = 'SUPER_ADMIN' WHERE role::text = 'ADMIN';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'Role' AND e.enumlabel = 'OPS_ADMIN'
  ) THEN
    UPDATE "users" SET role = 'USER' WHERE role::text = 'OPS_ADMIN';
  END IF;

  CREATE TYPE "Role_new" AS ENUM ('USER', 'SUPER_ADMIN');
  ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
  ALTER TABLE "users"
    ALTER COLUMN "role" TYPE "Role_new"
    USING (
      CASE
        WHEN role::text = 'SUPER_ADMIN' THEN 'SUPER_ADMIN'::"Role_new"
        ELSE 'USER'::"Role_new"
      END
    );
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER'::"Role_new";
  DROP TYPE "Role";
  ALTER TYPE "Role_new" RENAME TO "Role";
END $$;
