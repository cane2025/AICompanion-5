-- Migration to update schema for new versioning system
-- Drop and recreate tables with new structure

-- First, backup existing data if any exists
CREATE TABLE IF NOT EXISTS care_plans_backup AS SELECT * FROM care_plans;
CREATE TABLE IF NOT EXISTS implementation_plans_backup AS SELECT * FROM implementation_plans;
CREATE TABLE IF NOT EXISTS weekly_documentation_backup AS SELECT * FROM weekly_documentation;

-- Drop old tables
DROP TABLE IF EXISTS care_plans CASCADE;
DROP TABLE IF EXISTS implementation_plans CASCADE;
DROP TABLE IF EXISTS weekly_documentation CASCADE;

-- Update clients table
ALTER TABLE clients DROP COLUMN IF EXISTS initials;
ALTER TABLE clients DROP COLUMN IF EXISTS staff_id;
ALTER TABLE clients DROP COLUMN IF EXISTS personal_number;
ALTER TABLE clients DROP COLUMN IF EXISTS notes;
ALTER TABLE clients DROP COLUMN IF EXISTS status;
ALTER TABLE clients DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS display_code VARCHAR NOT NULL DEFAULT '';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Update staff table
ALTER TABLE staff DROP COLUMN IF EXISTS full_name;
ALTER TABLE staff DROP COLUMN IF EXISTS initials;
ALTER TABLE staff DROP COLUMN IF EXISTS personnummer;
ALTER TABLE staff DROP COLUMN IF EXISTS telefon;
ALTER TABLE staff DROP COLUMN IF EXISTS epost;
ALTER TABLE staff DROP COLUMN IF EXISTS adress;
ALTER TABLE staff DROP COLUMN IF EXISTS anställningsdatum;
ALTER TABLE staff DROP COLUMN IF EXISTS roll;
ALTER TABLE staff DROP COLUMN IF EXISTS avdelning;
ALTER TABLE staff DROP COLUMN IF EXISTS weekly_capacity_hours;
ALTER TABLE staff DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS role VARCHAR;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Create new care_plans table
CREATE TABLE care_plans (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR NOT NULL,
    index INTEGER NOT NULL,
    received_date VARCHAR NOT NULL,
    entered_to_journal_date VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'Mottagen',
    assigned_staff_id VARCHAR,
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(client_id, index)
);

-- Create new implementation_plans table
CREATE TABLE implementation_plans (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR NOT NULL,
    care_plan_index INTEGER NOT NULL,
    index INTEGER NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'Väntar',
    due_date VARCHAR,
    completed_date VARCHAR,
    sent_date VARCHAR,
    follow_ups TEXT NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(client_id, index)
);

-- Create new weekly_documentation table
CREATE TABLE weekly_documentation (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id VARCHAR NOT NULL,
    year INTEGER NOT NULL,
    week INTEGER NOT NULL,
    days TEXT NOT NULL DEFAULT '{}',
    documented BOOLEAN DEFAULT false NOT NULL,
    quality_approved BOOLEAN DEFAULT false NOT NULL,
    on_time BOOLEAN DEFAULT true NOT NULL,
    delayed BOOLEAN DEFAULT false NOT NULL,
    comments TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(client_id, year, week)
);

-- Create new staff_weekly_stats table
CREATE TABLE staff_weekly_stats (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id VARCHAR NOT NULL,
    year INTEGER NOT NULL,
    week INTEGER NOT NULL,
    documented_count INTEGER DEFAULT 0 NOT NULL,
    delayed_count INTEGER DEFAULT 0 NOT NULL,
    not_approved_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(staff_id, year, week)
);

-- Create indexes for performance
CREATE INDEX idx_care_plans_client_id ON care_plans(client_id);
CREATE INDEX idx_implementation_plans_client_id ON implementation_plans(client_id);
CREATE INDEX idx_weekly_documentation_client_year_week ON weekly_documentation(client_id, year, week);
CREATE INDEX idx_staff_weekly_stats_staff_year_week ON staff_weekly_stats(staff_id, year, week);