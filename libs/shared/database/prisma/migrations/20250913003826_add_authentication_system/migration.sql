-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "public"."user_role" AS ENUM ('CLUB_ADMIN', 'COACH', 'ATHLETE', 'MEDICAL_STAFF', 'PARENT', 'CLUB_DIRECTOR');

-- CreateEnum
CREATE TYPE "public"."auth_provider" AS ENUM ('GOOGLE', 'EMAIL', 'APPLE');

-- CreateEnum
CREATE TYPE "public"."auth_session_status" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."sport" AS ENUM ('SWIMMING', 'TRACK_FIELD', 'SOCCER', 'BASKETBALL', 'TENNIS');

-- CreateEnum
CREATE TYPE "public"."athlete_level" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE');

-- CreateEnum
CREATE TYPE "public"."session_status" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "public"."assignment_status" AS ENUM ('ASSIGNED', 'CONFIRMED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."attendance_status" AS ENUM ('SCHEDULED', 'PRESENT', 'ABSENT', 'LATE', 'EARLY_DEPARTURE');

-- CreateEnum
CREATE TYPE "public"."payment_status" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "public"."payment_type" AS ENUM ('MEMBERSHIP', 'TRAINING', 'COMPETITION', 'EQUIPMENT', 'FACILITY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."communication_type" AS ENUM ('ANNOUNCEMENT', 'REMINDER', 'ALERT', 'NEWSLETTER', 'PERSONAL_MESSAGE', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "public"."communication_channel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH_NOTIFICATION', 'ALL_CHANNELS');

-- CreateEnum
CREATE TYPE "public"."message_priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."medical_record_type" AS ENUM ('PHYSICAL_EXAM', 'MEDICAL_CLEARANCE', 'INJURY_REPORT', 'ALLERGY_INFO', 'MEDICATION', 'NUTRITION_PLAN', 'FITNESS_ASSESSMENT', 'EMERGENCY_INFO');

-- CreateEnum
CREATE TYPE "public"."confidentiality_level" AS ENUM ('PUBLIC', 'RESTRICTED', 'CONFIDENTIAL');

-- CreateEnum
CREATE TYPE "public"."competition_type" AS ENUM ('INTERNAL', 'REGIONAL', 'NATIONAL', 'INTERNATIONAL');

-- CreateEnum
CREATE TYPE "public"."file_category" AS ENUM ('PROFILE_PICTURE', 'MEDICAL_DOCUMENT', 'TRAINING_VIDEO', 'COMPETITION_PHOTO', 'CERTIFICATE', 'INVOICE', 'REPORT', 'OTHER');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" TEXT NOT NULL,
    "google_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "profile_picture" TEXT,
    "phone" TEXT,
    "emergency_contact" JSONB,
    "preferred_language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "auth_provider" "public"."auth_provider" NOT NULL DEFAULT 'GOOGLE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "password_reset_token" TEXT,
    "password_reset_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clubs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "founded_year" INTEGER,
    "sports" "public"."sport"[] DEFAULT ARRAY['SWIMMING']::"public"."sport"[],
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "language" TEXT NOT NULL DEFAULT 'en',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "subscription_tier" TEXT NOT NULL DEFAULT 'FREE',
    "max_athletes" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_club_roles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "role" "public"."user_role" NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "assigned_by" UUID,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_club_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."athletes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "club_id" UUID NOT NULL,
    "user_id" UUID,
    "athlete_number" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "nickname" TEXT,
    "date_of_birth" DATE,
    "gender" "public"."gender",
    "profile_picture" TEXT,
    "sport" "public"."sport" NOT NULL DEFAULT 'SWIMMING',
    "category" TEXT,
    "level" "public"."athlete_level" NOT NULL DEFAULT 'BEGINNER',
    "joined_at" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "personal_bests" JSONB NOT NULL DEFAULT '{}',
    "goals" JSONB NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "parent_id" UUID,
    "emergency_contacts" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athletes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."training_templates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "club_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sport" "public"."sport" NOT NULL,
    "category" TEXT NOT NULL,
    "level" "public"."athlete_level",
    "duration" INTEGER,
    "structure" JSONB NOT NULL DEFAULT '{}',
    "equipment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."training_sessions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "club_id" UUID NOT NULL,
    "template_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sport" "public"."sport" NOT NULL,
    "category" TEXT NOT NULL,
    "level" "public"."athlete_level",
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "location" TEXT,
    "max_participants" INTEGER,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_pattern" JSONB,
    "status" "public"."session_status" NOT NULL DEFAULT 'SCHEDULED',
    "actual_start_time" TIMESTAMP(3),
    "actual_end_time" TIMESTAMP(3),
    "workout" JSONB NOT NULL DEFAULT '{}',
    "equipment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "coach_id" UUID NOT NULL,
    "assistant_coaches" UUID[] DEFAULT ARRAY[]::UUID[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."training_assignments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "club_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "athlete_id" UUID NOT NULL,
    "assigned_by" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."assignment_status" NOT NULL DEFAULT 'ASSIGNED',
    "attendance_status" "public"."attendance_status" NOT NULL DEFAULT 'SCHEDULED',
    "checked_in_at" TIMESTAMP(3),
    "checked_out_at" TIMESTAMP(3),
    "modifications" JSONB NOT NULL DEFAULT '{}',
    "coach_notes" TEXT,
    "athlete_notes" TEXT,
    "rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."performance_data" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "club_id" UUID NOT NULL,
    "athlete_id" UUID NOT NULL,
    "session_id" UUID,
    "competition_id" UUID,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" UUID NOT NULL,
    "sport" "public"."sport" NOT NULL,
    "event" TEXT NOT NULL,
    "category" TEXT,
    "metrics" JSONB NOT NULL,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "equipment" JSONB NOT NULL DEFAULT '{}',
    "is_personal_best" BOOLEAN NOT NULL DEFAULT false,
    "is_season_best" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "video_url" TEXT,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "validated_by" UUID,
    "validated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."competitions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "club_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."competition_type" NOT NULL,
    "sport" "public"."sport" NOT NULL,
    "level" TEXT,
    "venue" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "registration_deadline" DATE NOT NULL,
    "max_participants" INTEGER,
    "age_categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "entry_fee" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "results" JSONB NOT NULL DEFAULT '{}',
    "organizer" TEXT,
    "contact_info" JSONB NOT NULL DEFAULT '{}',
    "rules" JSONB NOT NULL DEFAULT '{}',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."competition_entries" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "club_id" UUID NOT NULL,
    "competition_id" UUID NOT NULL,
    "athlete_id" UUID NOT NULL,
    "events" TEXT[],
    "category" TEXT,
    "seed_times" JSONB NOT NULL DEFAULT '{}',
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registered_by" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_status" "public"."payment_status" NOT NULL DEFAULT 'PENDING',
    "confirmation_number" TEXT,
    "special_requests" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competition_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "club_id" UUID NOT NULL,
    "athlete_id" UUID,
    "user_id" UUID,
    "type" "public"."payment_type" NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT NOT NULL,
    "due_date" DATE NOT NULL,
    "paid_at" TIMESTAMP(3),
    "status" "public"."payment_status" NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "recurring_schedule" JSONB,
    "discounts" JSONB NOT NULL DEFAULT '{}',
    "taxes" JSONB NOT NULL DEFAULT '{}',
    "invoice_number" TEXT,
    "receipt_url" TEXT,
    "processed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."communications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "club_id" UUID NOT NULL,
    "type" "public"."communication_type" NOT NULL,
    "channel" "public"."communication_channel" NOT NULL,
    "sender_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "recipients" JSONB NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "priority" "public"."message_priority" NOT NULL DEFAULT 'NORMAL',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attachments" JSONB NOT NULL DEFAULT '{}',
    "read_receipts" JSONB NOT NULL DEFAULT '{}',
    "responses" JSONB NOT NULL DEFAULT '{}',
    "expires_at" TIMESTAMP(3),
    "is_emergency" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medical_records" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "club_id" UUID NOT NULL,
    "athlete_id" UUID NOT NULL,
    "type" "public"."medical_record_type" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "record_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiry_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "restrictions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attachments" JSONB NOT NULL DEFAULT '{}',
    "confidentiality" "public"."confidentiality_level" NOT NULL DEFAULT 'RESTRICTED',
    "recorded_by" UUID NOT NULL,
    "approved_by" UUID,
    "notes" TEXT,
    "emergency_info" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."files" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "club_id" UUID NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "file_path" TEXT NOT NULL,
    "category" "public"."file_category" NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "last_accessed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_sessions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "current_club_id" UUID,
    "session_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "device_info" JSONB NOT NULL DEFAULT '{}',
    "ip_address" INET,
    "user_agent" TEXT,
    "device_fingerprint" TEXT,
    "status" "public"."auth_session_status" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "refresh_expires_at" TIMESTAMP(3) NOT NULL,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "revoked_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "club_id" UUID,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "old_values" JSONB,
    "new_values" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ip_address" INET,
    "user_agent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "public"."users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "clubs_slug_key" ON "public"."clubs"("slug");

-- CreateIndex
CREATE INDEX "user_club_roles_club_id_role_is_active_idx" ON "public"."user_club_roles"("club_id", "role", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_club_roles_user_id_club_id_role_key" ON "public"."user_club_roles"("user_id", "club_id", "role");

-- CreateIndex
CREATE INDEX "athletes_club_id_is_active_idx" ON "public"."athletes"("club_id", "is_active");

-- CreateIndex
CREATE INDEX "athletes_club_id_sport_level_idx" ON "public"."athletes"("club_id", "sport", "level");

-- CreateIndex
CREATE UNIQUE INDEX "athletes_club_id_athlete_number_key" ON "public"."athletes"("club_id", "athlete_number");

-- CreateIndex
CREATE INDEX "training_templates_club_id_sport_category_idx" ON "public"."training_templates"("club_id", "sport", "category");

-- CreateIndex
CREATE INDEX "training_templates_club_id_is_public_idx" ON "public"."training_templates"("club_id", "is_public");

-- CreateIndex
CREATE INDEX "training_sessions_club_id_scheduled_at_idx" ON "public"."training_sessions"("club_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "training_sessions_club_id_status_idx" ON "public"."training_sessions"("club_id", "status");

-- CreateIndex
CREATE INDEX "training_sessions_coach_id_scheduled_at_idx" ON "public"."training_sessions"("coach_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "training_assignments_club_id_attendance_status_idx" ON "public"."training_assignments"("club_id", "attendance_status");

-- CreateIndex
CREATE INDEX "training_assignments_athlete_id_assigned_at_idx" ON "public"."training_assignments"("athlete_id", "assigned_at");

-- CreateIndex
CREATE UNIQUE INDEX "training_assignments_session_id_athlete_id_key" ON "public"."training_assignments"("session_id", "athlete_id");

-- CreateIndex
CREATE INDEX "performance_data_athlete_id_recorded_at_idx" ON "public"."performance_data"("athlete_id", "recorded_at");

-- CreateIndex
CREATE INDEX "performance_data_club_id_recorded_at_idx" ON "public"."performance_data"("club_id", "recorded_at");

-- CreateIndex
CREATE INDEX "performance_data_club_id_sport_event_idx" ON "public"."performance_data"("club_id", "sport", "event");

-- CreateIndex
CREATE INDEX "competitions_club_id_start_date_idx" ON "public"."competitions"("club_id", "start_date");

-- CreateIndex
CREATE INDEX "competitions_club_id_type_idx" ON "public"."competitions"("club_id", "type");

-- CreateIndex
CREATE INDEX "competition_entries_club_id_competition_id_idx" ON "public"."competition_entries"("club_id", "competition_id");

-- CreateIndex
CREATE UNIQUE INDEX "competition_entries_competition_id_athlete_id_key" ON "public"."competition_entries"("competition_id", "athlete_id");

-- CreateIndex
CREATE INDEX "payments_club_id_status_due_date_idx" ON "public"."payments"("club_id", "status", "due_date");

-- CreateIndex
CREATE INDEX "payments_club_id_type_idx" ON "public"."payments"("club_id", "type");

-- CreateIndex
CREATE INDEX "communications_club_id_type_sent_at_idx" ON "public"."communications"("club_id", "type", "sent_at");

-- CreateIndex
CREATE INDEX "communications_club_id_priority_idx" ON "public"."communications"("club_id", "priority");

-- CreateIndex
CREATE INDEX "medical_records_club_id_athlete_id_is_active_idx" ON "public"."medical_records"("club_id", "athlete_id", "is_active");

-- CreateIndex
CREATE INDEX "medical_records_club_id_type_idx" ON "public"."medical_records"("club_id", "type");

-- CreateIndex
CREATE INDEX "files_club_id_category_idx" ON "public"."files"("club_id", "category");

-- CreateIndex
CREATE INDEX "files_club_id_entity_type_entity_id_idx" ON "public"."files"("club_id", "entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_session_token_key" ON "public"."user_sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refresh_token_key" ON "public"."user_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_status_idx" ON "public"."user_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_sessions_session_token_idx" ON "public"."user_sessions"("session_token");

-- CreateIndex
CREATE INDEX "user_sessions_refresh_token_idx" ON "public"."user_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "public"."user_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "audit_logs_club_id_timestamp_idx" ON "public"."audit_logs"("club_id", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_timestamp_idx" ON "public"."audit_logs"("user_id", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "public"."audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "public"."user_club_roles" ADD CONSTRAINT "user_club_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_club_roles" ADD CONSTRAINT "user_club_roles_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."athletes" ADD CONSTRAINT "athletes_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."athletes" ADD CONSTRAINT "athletes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."athletes" ADD CONSTRAINT "athletes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_templates" ADD CONSTRAINT "training_templates_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_sessions" ADD CONSTRAINT "training_sessions_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_sessions" ADD CONSTRAINT "training_sessions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."training_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_sessions" ADD CONSTRAINT "training_sessions_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_assignments" ADD CONSTRAINT "training_assignments_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_assignments" ADD CONSTRAINT "training_assignments_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_assignments" ADD CONSTRAINT "training_assignments_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_assignments" ADD CONSTRAINT "training_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."performance_data" ADD CONSTRAINT "performance_data_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."performance_data" ADD CONSTRAINT "performance_data_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."performance_data" ADD CONSTRAINT "performance_data_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."training_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."performance_data" ADD CONSTRAINT "performance_data_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."performance_data" ADD CONSTRAINT "performance_data_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."performance_data" ADD CONSTRAINT "performance_data_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."competitions" ADD CONSTRAINT "competitions_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."competitions" ADD CONSTRAINT "competitions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."competition_entries" ADD CONSTRAINT "competition_entries_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."competition_entries" ADD CONSTRAINT "competition_entries_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."competition_entries" ADD CONSTRAINT "competition_entries_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."competition_entries" ADD CONSTRAINT "competition_entries_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communications" ADD CONSTRAINT "communications_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communications" ADD CONSTRAINT "communications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_records" ADD CONSTRAINT "medical_records_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_records" ADD CONSTRAINT "medical_records_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_records" ADD CONSTRAINT "medical_records_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_records" ADD CONSTRAINT "medical_records_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."files" ADD CONSTRAINT "files_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."files" ADD CONSTRAINT "files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_sessions" ADD CONSTRAINT "user_sessions_current_club_id_fkey" FOREIGN KEY ("current_club_id") REFERENCES "public"."clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_sessions" ADD CONSTRAINT "user_sessions_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
