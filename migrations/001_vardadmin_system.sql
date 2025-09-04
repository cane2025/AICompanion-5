-- Migration för vårdadminsystem med versionsbara flöden
-- Datum: 2025-01-27

-- Ta bort gamla tabeller som inte behövs längre
DROP TABLE IF EXISTS vimsa_time CASCADE;

-- Uppdatera staff tabell (ta bort personnummerfält)
ALTER TABLE staff DROP COLUMN IF EXISTS personnummer;
ALTER TABLE staff DROP COLUMN IF EXISTS telefon;
ALTER TABLE staff DROP COLUMN IF EXISTS epost;
ALTER TABLE staff DROP COLUMN IF EXISTS adress;
ALTER TABLE staff DROP COLUMN IF EXISTS anställningsdatum;
ALTER TABLE staff DROP COLUMN IF EXISTS roll;
ALTER TABLE staff DROP COLUMN IF EXISTS avdelning;
ALTER TABLE staff DROP COLUMN IF EXISTS weekly_capacity_hours;
ALTER TABLE staff DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE staff DROP COLUMN IF EXISTS full_name;
ALTER TABLE staff DROP COLUMN IF EXISTS initials;

-- Lägg till nya kolumner för staff
ALTER TABLE staff ADD COLUMN IF NOT EXISTS role VARCHAR;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Uppdatera clients tabell (ta bort personnummerfält)
ALTER TABLE clients DROP COLUMN IF EXISTS personal_number;
ALTER TABLE clients DROP COLUMN IF EXISTS staff_id;
ALTER TABLE clients DROP COLUMN IF EXISTS notes;
ALTER TABLE clients DROP COLUMN IF EXISTS status;
ALTER TABLE clients DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE clients DROP COLUMN IF EXISTS initials;

-- Lägg till nya kolumner för clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS display_code VARCHAR NOT NULL DEFAULT 'CLIENT';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Uppdatera befintliga care_plans tabell
DROP TABLE IF EXISTS care_plans CASCADE;

-- Skapa ny care_plans tabell med versionshantering
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

-- Uppdatera befintliga implementation_plans tabell
DROP TABLE IF EXISTS implementation_plans CASCADE;

-- Skapa ny implementation_plans tabell med versionshantering
CREATE TABLE implementation_plans (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR NOT NULL,
  care_plan_index INTEGER NOT NULL,
  index INTEGER NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'Väntar',
  due_date VARCHAR,
  completed_date VARCHAR,
  sent_date VARCHAR,
  follow_ups TEXT DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, index)
);

-- Uppdatera befintliga weekly_documentation tabell
DROP TABLE IF EXISTS weekly_documentation CASCADE;

-- Skapa ny weekly_documentation tabell med dagvy
CREATE TABLE weekly_documentation (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR NOT NULL,
  year INTEGER NOT NULL,
  week INTEGER NOT NULL,
  days TEXT DEFAULT '{}',
  documented BOOLEAN DEFAULT false NOT NULL,
  quality_approved BOOLEAN DEFAULT false NOT NULL,
  on_time BOOLEAN DEFAULT true NOT NULL,
  delayed BOOLEAN DEFAULT false NOT NULL,
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, year, week)
);

-- Skapa ny staff_weekly_stats tabell för rapporter
CREATE TABLE staff_weekly_stats (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id VARCHAR NOT NULL,
  year INTEGER NOT NULL,
  week INTEGER NOT NULL,
  documented_count INTEGER DEFAULT 0,
  delayed_count INTEGER DEFAULT 0,
  not_approved_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(staff_id, year, week)
);

-- Lägg till index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_care_plans_client_id ON care_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_care_plans_index ON care_plans(client_id, index);
CREATE INDEX IF NOT EXISTS idx_implementation_plans_client_id ON implementation_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_implementation_plans_index ON implementation_plans(client_id, index);
CREATE INDEX IF NOT EXISTS idx_weekly_docs_client_year_week ON weekly_documentation(client_id, year, week);
CREATE INDEX IF NOT EXISTS idx_staff_stats_staff_year_week ON staff_weekly_stats(staff_id, year, week);

-- Lägg till foreign key constraints
ALTER TABLE care_plans ADD CONSTRAINT fk_care_plans_client_id FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE care_plans ADD CONSTRAINT fk_care_plans_assigned_staff_id FOREIGN KEY (assigned_staff_id) REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE implementation_plans ADD CONSTRAINT fk_implementation_plans_client_id FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE weekly_documentation ADD CONSTRAINT fk_weekly_docs_client_id FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE staff_weekly_stats ADD CONSTRAINT fk_staff_stats_staff_id FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE;