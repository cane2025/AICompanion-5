-- Initial database schema for care planning system
-- This migration creates all the necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR NOT NULL UNIQUE,
  email VARCHAR NOT NULL UNIQUE,
  password_hash VARCHAR NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'staff', -- admin, staff, viewer
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  initials VARCHAR NOT NULL,
  personnummer VARCHAR DEFAULT '',
  telefon VARCHAR DEFAULT '',
  epost VARCHAR DEFAULT '',
  adress VARCHAR DEFAULT '',
  anställningsdatum VARCHAR DEFAULT '',
  roll VARCHAR DEFAULT '',
  avdelning VARCHAR DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- for soft delete support
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  initials VARCHAR NOT NULL,
  staff_id VARCHAR NOT NULL,
  personal_number VARCHAR DEFAULT '',
  notes TEXT DEFAULT '',
  status VARCHAR DEFAULT 'active', -- active, inactive
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- for soft delete support
);

-- Weekly documentation
CREATE TABLE IF NOT EXISTS weekly_documentation (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR NOT NULL,
  staff_id VARCHAR NOT NULL,
  year INTEGER NOT NULL,
  week INTEGER NOT NULL,
  content TEXT DEFAULT '',
  monday_status VARCHAR DEFAULT 'not_done',
  tuesday_status VARCHAR DEFAULT 'not_done',
  wednesday_status VARCHAR DEFAULT 'not_done',
  thursday_status VARCHAR DEFAULT 'not_done',
  friday_status VARCHAR DEFAULT 'not_done',
  saturday_status VARCHAR DEFAULT 'not_done',
  sunday_status VARCHAR DEFAULT 'not_done',
  monday_documented BOOLEAN DEFAULT false NOT NULL,
  tuesday_documented BOOLEAN DEFAULT false NOT NULL,
  wednesday_documented BOOLEAN DEFAULT false NOT NULL,
  thursday_documented BOOLEAN DEFAULT false NOT NULL,
  friday_documented BOOLEAN DEFAULT false NOT NULL,
  saturday_documented BOOLEAN DEFAULT false NOT NULL,
  sunday_documented BOOLEAN DEFAULT false NOT NULL,
  documentation TEXT DEFAULT '',
  approved BOOLEAN DEFAULT false NOT NULL,
  comments TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  quality_assessment VARCHAR DEFAULT 'pending' -- for quality status badges
);

-- Monthly reports
CREATE TABLE IF NOT EXISTS monthly_reports (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR NOT NULL,
  staff_id VARCHAR NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  content TEXT DEFAULT '',
  report_content TEXT DEFAULT '',
  status VARCHAR DEFAULT 'not_started', -- not_started, in_progress, completed
  comment TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  quality VARCHAR DEFAULT 'pending', -- quality evaluation
  submission_date TIMESTAMP -- date of submission
);

-- Care plans
CREATE TABLE IF NOT EXISTS care_plans (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR NOT NULL,
  staff_id VARCHAR NOT NULL,
  responsible_id VARCHAR, -- optional responsible staff separate from creator
  plan_content TEXT DEFAULT '',
  goals TEXT DEFAULT '',
  interventions TEXT DEFAULT '',
  evaluation_criteria TEXT,
  received_date VARCHAR,
  entered_journal_date VARCHAR,
  staff_notified_date VARCHAR,
  status VARCHAR DEFAULT 'received', -- received, staff_notified, in_progress, completed
  is_active BOOLEAN DEFAULT true,
  comment TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Implementation plans (GFP)
CREATE TABLE IF NOT EXISTS implementation_plans (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR NOT NULL,
  staff_id VARCHAR NOT NULL,
  care_plan_id VARCHAR,
  plan_content TEXT DEFAULT '',
  goals TEXT DEFAULT '',
  activities TEXT DEFAULT '',
  follow_up_schedule TEXT DEFAULT '',
  status VARCHAR DEFAULT 'pending', -- pending, in_progress, completed
  is_active BOOLEAN DEFAULT true,
  followup1 BOOLEAN DEFAULT false,
  followup2 BOOLEAN DEFAULT false,
  created_date TIMESTAMP DEFAULT NOW(),
  comments TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  due_date TIMESTAMP,
  completed_date TIMESTAMP,
  sent_date TIMESTAMP,
  plan_type VARCHAR DEFAULT '1'
);

-- Vimsa time tracking
CREATE TABLE IF NOT EXISTS vimsa_time (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR NOT NULL,
  staff_id VARCHAR NOT NULL,
  year INTEGER NOT NULL,
  week INTEGER NOT NULL,
  monday INTEGER DEFAULT 0,
  tuesday INTEGER DEFAULT 0,
  wednesday INTEGER DEFAULT 0,
  thursday INTEGER DEFAULT 0,
  friday INTEGER DEFAULT 0,
  saturday INTEGER DEFAULT 0,
  sunday INTEGER DEFAULT 0,
  total_hours INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'not_started', -- not_started, in_progress, completed
  approved BOOLEAN DEFAULT false,
  comments TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  matches_documentation BOOLEAN DEFAULT false, -- comparison flag
  hours_worked INTEGER DEFAULT 0 -- explicit hours worked (separate from totalHours calc)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_staff_id ON clients(staff_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON clients(deleted_at);

CREATE INDEX IF NOT EXISTS idx_staff_deleted_at ON staff(deleted_at);

CREATE INDEX IF NOT EXISTS idx_care_plans_client_id ON care_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_care_plans_staff_id ON care_plans(staff_id);
CREATE INDEX IF NOT EXISTS idx_care_plans_status ON care_plans(status);

CREATE INDEX IF NOT EXISTS idx_implementation_plans_client_id ON implementation_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_implementation_plans_staff_id ON implementation_plans(staff_id);
CREATE INDEX IF NOT EXISTS idx_implementation_plans_status ON implementation_plans(status);

CREATE INDEX IF NOT EXISTS idx_weekly_documentation_client_id ON weekly_documentation(client_id);
CREATE INDEX IF NOT EXISTS idx_weekly_documentation_staff_id ON weekly_documentation(staff_id);
CREATE INDEX IF NOT EXISTS idx_weekly_documentation_year_week ON weekly_documentation(year, week);

CREATE INDEX IF NOT EXISTS idx_monthly_reports_client_id ON monthly_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_staff_id ON monthly_reports(staff_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_year_month ON monthly_reports(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_status ON monthly_reports(status);

CREATE INDEX IF NOT EXISTS idx_vimsa_time_client_id ON vimsa_time(client_id);
CREATE INDEX IF NOT EXISTS idx_vimsa_time_staff_id ON vimsa_time(staff_id);
CREATE INDEX IF NOT EXISTS idx_vimsa_time_year_week ON vimsa_time(year, week);

-- Create a default admin user (password: admin123)
INSERT INTO users (id, username, email, password_hash, role) 
VALUES (
  'admin_default',
  'admin',
  'admin@vardplanering.se',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash of 'admin123'
  'admin'
) ON CONFLICT (username) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_documentation_updated_at BEFORE UPDATE ON weekly_documentation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_reports_updated_at BEFORE UPDATE ON monthly_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_plans_updated_at BEFORE UPDATE ON care_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_implementation_plans_updated_at BEFORE UPDATE ON implementation_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vimsa_time_updated_at BEFORE UPDATE ON vimsa_time
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
