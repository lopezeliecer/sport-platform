-- ============================================================================
-- Sports Platform - PostgreSQL Database Schema
-- Version: 1.0.0
-- Date: 2025-01-09
-- Description: Complete database schema for multi-tenant sports management platform
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================================
-- ENUMS AND CUSTOM TYPES
-- ============================================================================

-- User roles enumeration
CREATE TYPE user_role AS ENUM (
    'COACH',
    'ADMIN', 
    'ATHLETE',
    'PARENT',
    'MEDICAL',
    'DIRECTOR'
);

-- Gender enumeration
CREATE TYPE gender AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER'
);

-- Sports enumeration
CREATE TYPE sport AS ENUM (
    'SWIMMING',
    'TRACK_FIELD',
    'SOCCER',
    'BASKETBALL',
    'TENNIS'
);

-- Athlete level enumeration
CREATE TYPE athlete_level AS ENUM (
    'BEGINNER',
    'INTERMEDIATE',
    'ADVANCED',
    'ELITE'
);

-- Session status enumeration
CREATE TYPE session_status AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'POSTPONED'
);

-- Assignment status enumeration
CREATE TYPE assignment_status AS ENUM (
    'ASSIGNED',
    'CONFIRMED',
    'DECLINED',
    'CANCELLED'
);

-- Attendance status enumeration
CREATE TYPE attendance_status AS ENUM (
    'SCHEDULED',
    'PRESENT',
    'ABSENT',
    'LATE',
    'EARLY_DEPARTURE'
);

-- Payment status enumeration
CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PAID',
    'OVERDUE',
    'CANCELLED',
    'REFUNDED',
    'PARTIAL'
);

-- Payment type enumeration
CREATE TYPE payment_type AS ENUM (
    'MEMBERSHIP',
    'TRAINING',
    'COMPETITION',
    'EQUIPMENT',
    'FACILITY',
    'OTHER'
);

-- Communication type enumeration
CREATE TYPE communication_type AS ENUM (
    'ANNOUNCEMENT',
    'REMINDER',
    'ALERT',
    'NEWSLETTER',
    'PERSONAL_MESSAGE',
    'EMERGENCY'
);

-- Communication channel enumeration
CREATE TYPE communication_channel AS ENUM (
    'IN_APP',
    'EMAIL',
    'SMS',
    'PUSH_NOTIFICATION',
    'ALL_CHANNELS'
);

-- Message priority enumeration
CREATE TYPE message_priority AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);

-- Medical record type enumeration
CREATE TYPE medical_record_type AS ENUM (
    'PHYSICAL_EXAM',
    'MEDICAL_CLEARANCE',
    'INJURY_REPORT',
    'ALLERGY_INFO',
    'MEDICATION',
    'NUTRITION_PLAN',
    'FITNESS_ASSESSMENT',
    'EMERGENCY_INFO'
);

-- Confidentiality level enumeration
CREATE TYPE confidentiality_level AS ENUM (
    'PUBLIC',
    'RESTRICTED',
    'CONFIDENTIAL'
);

-- Competition type enumeration
CREATE TYPE competition_type AS ENUM (
    'INTERNAL',
    'REGIONAL',
    'NATIONAL',
    'INTERNATIONAL'
);

-- File category enumeration
CREATE TYPE file_category AS ENUM (
    'PROFILE_PICTURE',
    'MEDICAL_DOCUMENT',
    'TRAINING_VIDEO',
    'COMPETITION_PHOTO',
    'CERTIFICATE',
    'INVOICE',
    'REPORT',
    'OTHER'
);

-- ============================================================================
-- CORE DOMAIN TABLES
-- ============================================================================

-- Users table (People with system access)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    name VARCHAR(200) NOT NULL,
    profile_picture TEXT,
    phone VARCHAR(50),
    emergency_contact JSONB,
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_name_check CHECK (LENGTH(TRIM(name)) >= 2)
);

-- Clubs table (Organizations - Multi-tenant)
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo TEXT,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website TEXT,
    founded_year INTEGER,
    sports sport[] DEFAULT '{SWIMMING}',
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',
    language VARCHAR(10) DEFAULT 'en',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    subscription_tier VARCHAR(50) DEFAULT 'FREE',
    max_athletes INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT clubs_name_check CHECK (LENGTH(TRIM(name)) >= 2),
    CONSTRAINT clubs_slug_check CHECK (slug ~* '^[a-z0-9-]+$'),
    CONSTRAINT clubs_email_check CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT clubs_founded_year_check CHECK (founded_year IS NULL OR (founded_year >= 1800 AND founded_year <= EXTRACT(YEAR FROM NOW()))),
    CONSTRAINT clubs_max_athletes_check CHECK (max_athletes > 0)
);

-- User Club Roles table (Permissions per club)
CREATE TABLE user_club_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    permissions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, club_id, role),
    CONSTRAINT ucr_expires_at_check CHECK (expires_at IS NULL OR expires_at > assigned_at)
);

-- Athletes table (Sport profiles per club)
CREATE TABLE athletes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    athlete_number VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    nickname VARCHAR(100),
    date_of_birth DATE,
    gender gender,
    profile_picture TEXT,
    sport sport NOT NULL DEFAULT 'SWIMMING',
    category VARCHAR(100),
    level athlete_level DEFAULT 'BEGINNER',
    joined_at DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    personal_bests JSONB DEFAULT '{}',
    goals JSONB DEFAULT '{}',
    notes TEXT,
    parent_id UUID REFERENCES users(id),
    emergency_contacts JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(club_id, athlete_number),
    CONSTRAINT athletes_name_check CHECK (LENGTH(TRIM(first_name)) >= 1 AND LENGTH(TRIM(last_name)) >= 1),
    CONSTRAINT athletes_dob_check CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE),
    CONSTRAINT athletes_joined_check CHECK (joined_at <= CURRENT_DATE)
);

-- ============================================================================
-- SPORTS DOMAIN TABLES
-- ============================================================================

-- Training Templates table (Reusable workouts)
CREATE TABLE training_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sport sport NOT NULL,
    category VARCHAR(100) NOT NULL,
    level athlete_level,
    duration INTEGER, -- Duration in minutes
    structure JSONB NOT NULL DEFAULT '{}',
    equipment TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id),
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT tt_name_check CHECK (LENGTH(TRIM(name)) >= 2),
    CONSTRAINT tt_duration_check CHECK (duration IS NULL OR duration > 0),
    CONSTRAINT tt_rating_check CHECK (rating >= 0.0 AND rating <= 5.0)
);

-- Training Sessions table (Scheduled workouts)
CREATE TABLE training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    template_id UUID REFERENCES training_templates(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    sport sport NOT NULL,
    category VARCHAR(100) NOT NULL,
    level athlete_level,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL, -- Duration in minutes
    location VARCHAR(200),
    max_participants INTEGER,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB,
    status session_status DEFAULT 'SCHEDULED',
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    workout JSONB DEFAULT '{}',
    equipment TEXT[] DEFAULT '{}',
    notes TEXT,
    coach_id UUID NOT NULL REFERENCES users(id),
    assistant_coaches UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT ts_title_check CHECK (LENGTH(TRIM(title)) >= 2),
    CONSTRAINT ts_duration_check CHECK (duration > 0),
    CONSTRAINT ts_max_participants_check CHECK (max_participants IS NULL OR max_participants > 0),
    CONSTRAINT ts_actual_times_check CHECK (
        (actual_start_time IS NULL AND actual_end_time IS NULL) OR
        (actual_start_time IS NOT NULL AND actual_end_time IS NOT NULL AND actual_end_time > actual_start_time)
    )
);

-- Training Assignments table (Who attends what)
CREATE TABLE training_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status assignment_status DEFAULT 'ASSIGNED',
    attendance_status attendance_status DEFAULT 'SCHEDULED',
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_out_at TIMESTAMP WITH TIME ZONE,
    modifications JSONB DEFAULT '{}',
    coach_notes TEXT,
    athlete_notes TEXT,
    rating INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(session_id, athlete_id),
    CONSTRAINT ta_rating_check CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    CONSTRAINT ta_checkin_checkout_check CHECK (
        (checked_in_at IS NULL AND checked_out_at IS NULL) OR
        (checked_in_at IS NOT NULL AND (checked_out_at IS NULL OR checked_out_at >= checked_in_at))
    )
);

-- Performance Data table (Flexible metrics)
CREATE TABLE performance_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
    competition_id UUID, -- Will reference competitions table
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_by UUID NOT NULL REFERENCES users(id),
    sport sport NOT NULL,
    event VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    metrics JSONB NOT NULL,
    conditions JSONB DEFAULT '{}',
    equipment JSONB DEFAULT '{}',
    is_personal_best BOOLEAN DEFAULT false,
    is_season_best BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    video_url TEXT,
    validated BOOLEAN DEFAULT false,
    validated_by UUID REFERENCES users(id),
    validated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT pd_event_check CHECK (LENGTH(TRIM(event)) >= 2),
    CONSTRAINT pd_validation_check CHECK (
        (validated = false) OR 
        (validated = true AND validated_by IS NOT NULL AND validated_at IS NOT NULL)
    )
) PARTITION BY RANGE (recorded_at);

-- Create partitions for performance data (by year)
CREATE TABLE performance_data_2024 PARTITION OF performance_data
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE performance_data_2025 PARTITION OF performance_data
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE performance_data_2026 PARTITION OF performance_data
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- ============================================================================
-- COMPETITION DOMAIN TABLES
-- ============================================================================

-- Competitions table
CREATE TABLE competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type competition_type NOT NULL,
    sport sport NOT NULL,
    level VARCHAR(100),
    venue TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_deadline DATE NOT NULL,
    max_participants INTEGER,
    age_categories TEXT[] DEFAULT '{}',
    events TEXT[] DEFAULT '{}',
    entry_fee DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'UPCOMING',
    results JSONB DEFAULT '{}',
    organizer VARCHAR(200),
    contact_info JSONB DEFAULT '{}',
    rules JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT comp_name_check CHECK (LENGTH(TRIM(name)) >= 2),
    CONSTRAINT comp_dates_check CHECK (end_date >= start_date AND registration_deadline <= start_date),
    CONSTRAINT comp_entry_fee_check CHECK (entry_fee IS NULL OR entry_fee >= 0),
    CONSTRAINT comp_max_participants_check CHECK (max_participants IS NULL OR max_participants > 0)
);

-- Competition Entries table
CREATE TABLE competition_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    events TEXT[] NOT NULL,
    category VARCHAR(100),
    seed_times JSONB DEFAULT '{}',
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    registered_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'PENDING',
    payment_status payment_status DEFAULT 'PENDING',
    confirmation_number VARCHAR(100),
    special_requests TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(competition_id, athlete_id),
    CONSTRAINT ce_events_check CHECK (array_length(events, 1) > 0)
);

-- ============================================================================
-- ADMINISTRATIVE DOMAIN TABLES
-- ============================================================================

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Payer
    type payment_type NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    description TEXT NOT NULL,
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    status payment_status DEFAULT 'PENDING',
    method VARCHAR(50),
    reference VARCHAR(200),
    notes TEXT,
    recurring_schedule JSONB,
    discounts JSONB DEFAULT '{}',
    taxes JSONB DEFAULT '{}',
    invoice_number VARCHAR(100),
    receipt_url TEXT,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT pay_amount_check CHECK (amount > 0),
    CONSTRAINT pay_description_check CHECK (LENGTH(TRIM(description)) >= 2),
    CONSTRAINT pay_payment_check CHECK (
        (status != 'PAID') OR 
        (status = 'PAID' AND paid_at IS NOT NULL)
    )
);

-- Communications table
CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    type communication_type NOT NULL,
    channel communication_channel NOT NULL,
    sender_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    recipients JSONB NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'DRAFT',
    priority message_priority DEFAULT 'NORMAL',
    tags TEXT[] DEFAULT '{}',
    attachments JSONB DEFAULT '{}',
    read_receipts JSONB DEFAULT '{}',
    responses JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    is_emergency BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT comm_title_check CHECK (LENGTH(TRIM(title)) >= 2),
    CONSTRAINT comm_content_check CHECK (LENGTH(TRIM(content)) >= 1)
);

-- Medical Records table
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    type medical_record_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    data JSONB DEFAULT '{}',
    record_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT true,
    restrictions TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    attachments JSONB DEFAULT '{}',
    confidentiality confidentiality_level DEFAULT 'RESTRICTED',
    recorded_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    notes TEXT,
    emergency_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT mr_title_check CHECK (LENGTH(TRIM(title)) >= 2),
    CONSTRAINT mr_dates_check CHECK (expiry_date IS NULL OR expiry_date >= record_date)
);

-- Files table
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    file_name VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path TEXT NOT NULL,
    category file_category NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT files_name_check CHECK (LENGTH(TRIM(file_name)) >= 1),
    CONSTRAINT files_size_check CHECK (file_size > 0)
);

-- User Sessions table (JWT management)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT us_expires_check CHECK (expires_at > created_at),
    UNIQUE(token_hash)
);

-- Audit Logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT al_action_check CHECK (LENGTH(TRIM(action)) >= 2),
    CONSTRAINT al_entity_type_check CHECK (LENGTH(TRIM(entity_type)) >= 2)
) PARTITION BY RANGE (timestamp);

-- Create partitions for audit logs (by month)
CREATE TABLE audit_logs_2024_12 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE audit_logs_2025_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Primary indexes for foreign keys
CREATE INDEX idx_user_club_roles_user_id ON user_club_roles(user_id);
CREATE INDEX idx_user_club_roles_club_id ON user_club_roles(club_id);
CREATE INDEX idx_athletes_user_id ON athletes(user_id);
CREATE INDEX idx_athletes_parent_id ON athletes(parent_id);
CREATE INDEX idx_training_templates_club_id ON training_templates(club_id);
CREATE INDEX idx_training_templates_created_by ON training_templates(created_by);
CREATE INDEX idx_training_sessions_club_id ON training_sessions(club_id);
CREATE INDEX idx_training_sessions_template_id ON training_sessions(template_id);
CREATE INDEX idx_training_sessions_coach_id ON training_sessions(coach_id);
CREATE INDEX idx_training_assignments_session_id ON training_assignments(session_id);
CREATE INDEX idx_training_assignments_athlete_id ON training_assignments(athlete_id);
CREATE INDEX idx_performance_data_athlete_id ON performance_data(athlete_id);
CREATE INDEX idx_performance_data_session_id ON performance_data(session_id);
CREATE INDEX idx_competitions_club_id ON competitions(club_id);
CREATE INDEX idx_competition_entries_competition_id ON competition_entries(competition_id);
CREATE INDEX idx_competition_entries_athlete_id ON competition_entries(athlete_id);
CREATE INDEX idx_payments_club_id ON payments(club_id);
CREATE INDEX idx_payments_athlete_id ON payments(athlete_id);
CREATE INDEX idx_communications_club_id ON communications(club_id);
CREATE INDEX idx_communications_sender_id ON communications(sender_id);
CREATE INDEX idx_medical_records_athlete_id ON medical_records(athlete_id);
CREATE INDEX idx_files_club_id ON files(club_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

-- Multi-tenant optimization indexes
CREATE INDEX idx_athletes_club_active ON athletes(club_id, is_active);
CREATE INDEX idx_training_sessions_club_date ON training_sessions(club_id, scheduled_at);
CREATE INDEX idx_training_sessions_club_status ON training_sessions(club_id, status);
CREATE INDEX idx_performance_data_club_athlete_date ON performance_data(club_id, athlete_id, recorded_at);
CREATE INDEX idx_payments_club_status_due ON payments(club_id, status, due_date);
CREATE INDEX idx_communications_club_type_sent ON communications(club_id, type, sent_at);
CREATE INDEX idx_medical_records_club_athlete_active ON medical_records(club_id, athlete_id, is_active);

-- JSONB GIN indexes for flexible queries
CREATE INDEX idx_performance_data_metrics_gin ON performance_data USING GIN (metrics);
CREATE INDEX idx_athletes_personal_bests_gin ON athletes USING GIN (personal_bests);
CREATE INDEX idx_athletes_goals_gin ON athletes USING GIN (goals);
CREATE INDEX idx_clubs_settings_gin ON clubs USING GIN (settings);
CREATE INDEX idx_training_sessions_workout_gin ON training_sessions USING GIN (workout);
CREATE INDEX idx_training_templates_structure_gin ON training_templates USING GIN (structure);
CREATE INDEX idx_competitions_results_gin ON competitions USING GIN (results);

-- Performance optimization indexes for common queries
CREATE INDEX idx_training_assignments_club_attendance ON training_assignments(club_id, attendance_status);
CREATE INDEX idx_user_club_roles_club_role_active ON user_club_roles(club_id, role, is_active);
CREATE INDEX idx_athletes_club_sport_level ON athletes(club_id, sport, level) WHERE is_active = true;
CREATE INDEX idx_training_sessions_coach_date ON training_sessions(coach_id, scheduled_at) WHERE status != 'CANCELLED';

-- Partial indexes for active records only
CREATE INDEX idx_active_athletes ON athletes(club_id, sport) WHERE is_active = true;
CREATE INDEX idx_active_user_roles ON user_club_roles(user_id, club_id) WHERE is_active = true;
CREATE INDEX idx_upcoming_sessions ON training_sessions(club_id, scheduled_at) WHERE status = 'SCHEDULED';
CREATE INDEX idx_pending_payments ON payments(club_id, due_date) WHERE status = 'PENDING';

-- Text search indexes
CREATE INDEX idx_athletes_name_trgm ON athletes USING GIN ((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX idx_training_sessions_title_trgm ON training_sessions USING GIN (title gin_trgm_ops);
CREATE INDEX idx_clubs_name_trgm ON clubs USING GIN (name gin_trgm_ops);

-- Unique indexes for business constraints
CREATE UNIQUE INDEX idx_athletes_club_number_active ON athletes(club_id, athlete_number) WHERE is_active = true;
CREATE UNIQUE INDEX idx_user_sessions_active_token ON user_sessions(token_hash) WHERE is_active = true;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on multi-tenant tables
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for club isolation
CREATE POLICY club_isolation_athletes ON athletes
    FOR ALL TO authenticated
    USING (club_id = current_setting('app.current_club_id', true)::UUID);

CREATE POLICY club_isolation_training_sessions ON training_sessions
    FOR ALL TO authenticated
    USING (club_id = current_setting('app.current_club_id', true)::UUID);

CREATE POLICY club_isolation_training_assignments ON training_assignments
    FOR ALL TO authenticated
    USING (club_id = current_setting('app.current_club_id', true)::UUID);

CREATE POLICY club_isolation_performance_data ON performance_data
    FOR ALL TO authenticated
    USING (club_id = current_setting('app.current_club_id', true)::UUID);

CREATE POLICY club_isolation_competitions ON competitions
    FOR ALL TO authenticated
    USING (club_id = current_setting('app.current_club_id', true)::UUID);

CREATE POLICY club_isolation_competition_entries ON competition_entries
    FOR ALL TO authenticated
    USING (club_id = current_setting('app.current_club_id', true)::UUID);

CREATE POLICY club_isolation_payments ON payments
    FOR ALL TO authenticated
    USING (club_id = current_setting('app.current_club_id', true)::UUID);

CREATE POLICY club_isolation_communications ON communications
    FOR ALL TO authenticated
    USING (club_id = current_setting('app.current_club_id', true)::UUID);

CREATE POLICY club_isolation_medical_records ON medical_records
    FOR ALL TO authenticated
    USING (club_id = current_setting('app.current_club_id', true)::UUID);

CREATE POLICY club_isolation_files ON files
    FOR ALL TO authenticated
    USING (club_id = current_setting('app.current_club_id', true)::UUID);

CREATE POLICY club_isolation_audit_logs ON audit_logs
    FOR ALL TO authenticated
    USING (club_id = current_setting('app.current_club_id', true)::UUID);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_club_roles_updated_at BEFORE UPDATE ON user_club_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_athletes_updated_at BEFORE UPDATE ON athletes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_templates_updated_at BEFORE UPDATE ON training_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON training_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_assignments_updated_at BEFORE UPDATE ON training_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_data_updated_at BEFORE UPDATE ON performance_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON competitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competition_entries_updated_at BEFORE UPDATE ON competition_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communications_updated_at BEFORE UPDATE ON communications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update personal bests
CREATE OR REPLACE FUNCTION update_personal_bests()
RETURNS TRIGGER AS $$
DECLARE
    current_pb JSONB;
    event_key TEXT;
    new_time NUMERIC;
    pb_time NUMERIC;
BEGIN
    -- Only process if this is swimming performance with time metric
    IF NEW.sport = 'SWIMMING' AND NEW.metrics ? 'time' THEN
        event_key := NEW.event;
        new_time := (NEW.metrics->>'time')::NUMERIC;
        
        -- Get current personal best for this event
        SELECT personal_bests->event_key INTO current_pb
        FROM athletes 
        WHERE id = NEW.athlete_id;
        
        -- If no previous record or new time is better (lower)
        IF current_pb IS NULL OR (current_pb->>'time')::NUMERIC > new_time THEN
            -- Update personal bests
            UPDATE athletes 
            SET personal_bests = personal_bests || jsonb_build_object(event_key, NEW.metrics)
            WHERE id = NEW.athlete_id;
            
            -- Mark this performance as personal best
            NEW.is_personal_best = true;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply personal best trigger
CREATE TRIGGER update_personal_bests_trigger 
    BEFORE INSERT ON performance_data
    FOR EACH ROW EXECUTE FUNCTION update_personal_bests();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    club_id_val UUID;
    user_id_val UUID;
BEGIN
    -- Extract club_id from the record
    IF TG_OP = 'DELETE' THEN
        old_data = to_jsonb(OLD);
        club_id_val = OLD.club_id;
        user_id_val = current_setting('app.current_user_id', true)::UUID;
    ELSE
        new_data = to_jsonb(NEW);
        club_id_val = NEW.club_id;
        user_id_val = current_setting('app.current_user_id', true)::UUID;
        IF TG_OP = 'UPDATE' THEN
            old_data = to_jsonb(OLD);
        END IF;
    END IF;
    
    -- Insert audit log
    INSERT INTO audit_logs (
        club_id,
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        ip_address,
        user_agent
    ) VALUES (
        club_id_val,
        user_id_val,
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        old_data,
        new_data,
        current_setting('app.client_ip', true)::INET,
        current_setting('app.user_agent', true)
    );
    
    RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_athletes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON athletes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_performance_data_trigger
    AFTER INSERT OR UPDATE OR DELETE ON performance_data
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_medical_records_trigger
    AFTER INSERT OR UPDATE OR DELETE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_payments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for active athletes with user information
CREATE VIEW active_athletes_view AS
SELECT 
    a.id,
    a.club_id,
    a.athlete_number,
    a.first_name,
    a.last_name,
    a.nickname,
    a.date_of_birth,
    a.gender,
    a.sport,
    a.level,
    a.personal_bests,
    u.email,
    u.phone,
    p.name as parent_name,
    p.email as parent_email
FROM athletes a
LEFT JOIN users u ON a.user_id = u.id
LEFT JOIN users p ON a.parent_id = p.id
WHERE a.is_active = true;

-- View for upcoming training sessions with assignments
CREATE VIEW upcoming_sessions_view AS
SELECT 
    ts.id,
    ts.club_id,
    ts.title,
    ts.scheduled_at,
    ts.duration,
    ts.location,
    ts.status,
    u.name as coach_name,
    COUNT(ta.id) as assigned_athletes,
    COUNT(CASE WHEN ta.attendance_status = 'PRESENT' THEN 1 END) as attended_athletes
FROM training_sessions ts
LEFT JOIN users u ON ts.coach_id = u.id
LEFT JOIN training_assignments ta ON ts.id = ta.session_id
WHERE ts.scheduled_at >= NOW()
GROUP BY ts.id, ts.club_id, ts.title, ts.scheduled_at, ts.duration, ts.location, ts.status, u.name;

-- View for athlete performance summary
CREATE VIEW athlete_performance_summary AS
SELECT 
    pd.athlete_id,
    pd.club_id,
    pd.sport,
    pd.event,
    COUNT(*) as total_performances,
    MIN((pd.metrics->>'time')::NUMERIC) as best_time,
    AVG((pd.metrics->>'time')::NUMERIC) as average_time,
    MAX(pd.recorded_at) as last_performance_date
FROM performance_data pd
WHERE pd.metrics ? 'time'
GROUP BY pd.athlete_id, pd.club_id, pd.sport, pd.event;

-- ============================================================================
-- SAMPLE DATA INSERTION (FOR TESTING)
-- ============================================================================

-- Insert sample club
INSERT INTO clubs (id, name, slug, description, address, email) VALUES 
(
    '123e4567-e89b-12d3-a456-426614174000',
    'Aquatic Excellence Club',
    'aquatic-excellence',
    'Premier swimming club focused on competitive excellence',
    '123 Pool Lane, Swimming City, SC 12345',
    'info@aquaticexcellence.com'
);

-- Insert sample users
INSERT INTO users (id, email, name) VALUES 
(
    '123e4567-e89b-12d3-a456-426614174001',
    'coach@example.com',
    'John Coach'
),
(
    '123e4567-e89b-12d3-a456-426614174002', 
    'parent@example.com',
    'Mary Parent'
),
(
    '123e4567-e89b-12d3-a456-426614174003',
    'athlete@example.com', 
    'Sarah Swimmer'
);

-- Insert sample user club roles
INSERT INTO user_club_roles (user_id, club_id, role) VALUES
(
    '123e4567-e89b-12d3-a456-426614174001',
    '123e4567-e89b-12d3-a456-426614174000',
    'COACH'
),
(
    '123e4567-e89b-12d3-a456-426614174002',
    '123e4567-e89b-12d3-a456-426614174000', 
    'PARENT'
);

-- Insert sample athletes
INSERT INTO athletes (id, club_id, user_id, athlete_number, first_name, last_name, date_of_birth, gender, sport, level, parent_id) VALUES
(
    '123e4567-e89b-12d3-a456-426614174004',
    '123e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174003',
    'SW001',
    'Sarah',
    'Swimmer', 
    '2010-05-15',
    'FEMALE',
    'SWIMMING',
    'INTERMEDIATE',
    '123e4567-e89b-12d3-a456-426614174002'
);

-- ============================================================================
-- PERFORMANCE OPTIMIZATION SETTINGS
-- ============================================================================

-- Recommended PostgreSQL configuration for sports platform
/*
-- postgresql.conf optimizations:

# Memory settings
shared_buffers = 256MB                    # 25% of available RAM
effective_cache_size = 1GB               # 75% of available RAM  
work_mem = 4MB                           # Per operation memory
maintenance_work_mem = 64MB              # For maintenance operations

# Connection settings
max_connections = 100                    # Adjust based on connection pooling
idle_in_transaction_session_timeout = 300000  # 5 minutes

# Query optimization
default_statistics_target = 100         # Better query planning
random_page_cost = 1.1                  # For SSD storage
effective_io_concurrency = 200          # For SSD storage

# WAL settings
wal_buffers = 16MB
checkpoint_completion_target = 0.9
wal_compression = on

# Logging
log_min_duration_statement = 1000       # Log slow queries (1 second)
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on

# Autovacuum tuning for high-write tables
autovacuum_max_workers = 3
autovacuum_naptime = 30s
autovacuum_vacuum_scale_factor = 0.1
autovacuum_analyze_scale_factor = 0.05

*/

-- ============================================================================
-- MONITORING QUERIES
-- ============================================================================

-- Monitor table sizes
CREATE VIEW table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor index usage
CREATE VIEW index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Monitor slow queries (requires pg_stat_statements extension)
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create function to analyze performance data metrics
CREATE OR REPLACE FUNCTION analyze_performance_metrics(
    p_athlete_id UUID,
    p_event TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    recorded_at TIMESTAMP WITH TIME ZONE,
    time_seconds NUMERIC,
    improvement_seconds NUMERIC,
    improvement_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH performance_with_lag AS (
        SELECT 
            pd.recorded_at,
            (pd.metrics->>'time')::NUMERIC as time_seconds,
            LAG((pd.metrics->>'time')::NUMERIC) OVER (ORDER BY pd.recorded_at) as previous_time
        FROM performance_data pd
        WHERE pd.athlete_id = p_athlete_id 
        AND pd.event = p_event
        AND pd.metrics ? 'time'
        ORDER BY pd.recorded_at DESC
        LIMIT p_limit
    )
    SELECT 
        pwl.recorded_at,
        pwl.time_seconds,
        CASE 
            WHEN pwl.previous_time IS NOT NULL 
            THEN pwl.previous_time - pwl.time_seconds 
            ELSE NULL 
        END as improvement_seconds,
        CASE 
            WHEN pwl.previous_time IS NOT NULL AND pwl.previous_time > 0
            THEN ROUND(((pwl.previous_time - pwl.time_seconds) / pwl.previous_time * 100)::NUMERIC, 2)
            ELSE NULL 
        END as improvement_percentage
    FROM performance_with_lag pwl
    ORDER BY pwl.recorded_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- BACKUP AND MAINTENANCE PROCEDURES
-- ============================================================================

-- Function to cleanup old audit logs (keep last 2 years)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs 
    WHERE timestamp < NOW() - INTERVAL '2 years';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old performance data (keep last 5 years)
CREATE OR REPLACE FUNCTION cleanup_old_performance_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM performance_data 
    WHERE recorded_at < NOW() - INTERVAL '5 years';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEMA VALIDATION
-- ============================================================================

-- Function to validate JSONB schemas for performance metrics
CREATE OR REPLACE FUNCTION validate_swimming_metrics(metrics JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check required fields for swimming metrics
    IF NOT (metrics ? 'time' AND metrics ? 'distance' AND metrics ? 'stroke') THEN
        RETURN FALSE;
    END IF;
    
    -- Validate data types and ranges
    IF NOT (
        (metrics->>'time')::NUMERIC > 0 AND
        (metrics->>'distance')::NUMERIC > 0 AND
        (metrics->>'stroke') IN ('freestyle', 'backstroke', 'breaststroke', 'butterfly', 'medley')
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to validate swimming performance metrics
ALTER TABLE performance_data 
ADD CONSTRAINT valid_swimming_metrics 
CHECK (
    sport != 'SWIMMING' OR 
    validate_swimming_metrics(metrics)
);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- Verify schema creation
DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM pg_tables WHERE schemaname = 'public';
    SELECT COUNT(*) INTO index_count FROM pg_indexes WHERE schemaname = 'public';
    SELECT COUNT(*) INTO function_count FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public';
    
    RAISE NOTICE '✅ Sports Platform Database Schema Created Successfully!';
    RAISE NOTICE '📊 Tables: %, Indexes: %, Functions: %', table_count, index_count, function_count;
    RAISE NOTICE '🏊‍♂️ Ready for sports management platform deployment!';
END $$;