CREATE TABLE IF NOT EXISTS "care_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"staff_id" varchar NOT NULL,
	"responsible_id" varchar,
	"plan_content" text DEFAULT '',
	"goals" text DEFAULT '',
	"interventions" text DEFAULT '',
	"evaluation_criteria" text,
	"received_date" varchar,
	"entered_journal_date" varchar,
	"staff_notified_date" varchar,
	"status" varchar DEFAULT 'received',
	"is_active" boolean DEFAULT true,
	"comment" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"initials" varchar NOT NULL,
	"staff_id" varchar NOT NULL,
	"personal_number" varchar DEFAULT '',
	"notes" text DEFAULT '',
	"status" varchar DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "implementation_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"staff_id" varchar NOT NULL,
	"care_plan_id" varchar,
	"plan_content" text DEFAULT '',
	"goals" text DEFAULT '',
	"activities" text DEFAULT '',
	"follow_up_schedule" text DEFAULT '',
	"status" varchar DEFAULT 'pending',
	"is_active" boolean DEFAULT true,
	"followup1" boolean DEFAULT false,
	"followup2" boolean DEFAULT false,
	"created_date" timestamp DEFAULT now(),
	"comments" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"due_date" timestamp,
	"completed_date" timestamp,
	"sent_date" timestamp,
	"plan_type" varchar DEFAULT '1'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monthly_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"staff_id" varchar NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"content" text DEFAULT '',
	"report_content" text DEFAULT '',
	"status" varchar DEFAULT 'not_started',
	"comment" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"quality" varchar DEFAULT 'pending',
	"submission_date" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"initials" varchar NOT NULL,
	"personnummer" varchar DEFAULT '',
	"telefon" varchar DEFAULT '',
	"epost" varchar DEFAULT '',
	"adress" varchar DEFAULT '',
	"anställningsdatum" varchar DEFAULT '',
	"roll" varchar DEFAULT '',
	"avdelning" varchar DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar NOT NULL,
	"role" varchar DEFAULT 'staff' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vimsa_time" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"staff_id" varchar NOT NULL,
	"year" integer NOT NULL,
	"week" integer NOT NULL,
	"monday" integer DEFAULT 0,
	"tuesday" integer DEFAULT 0,
	"wednesday" integer DEFAULT 0,
	"thursday" integer DEFAULT 0,
	"friday" integer DEFAULT 0,
	"saturday" integer DEFAULT 0,
	"sunday" integer DEFAULT 0,
	"total_hours" integer DEFAULT 0,
	"status" varchar DEFAULT 'not_started',
	"approved" boolean DEFAULT false,
	"comments" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"matches_documentation" boolean DEFAULT false,
	"hours_worked" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "weekly_documentation" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"staff_id" varchar NOT NULL,
	"year" integer NOT NULL,
	"week" integer NOT NULL,
	"content" text DEFAULT '',
	"monday_status" varchar DEFAULT 'not_done',
	"tuesday_status" varchar DEFAULT 'not_done',
	"wednesday_status" varchar DEFAULT 'not_done',
	"thursday_status" varchar DEFAULT 'not_done',
	"friday_status" varchar DEFAULT 'not_done',
	"saturday_status" varchar DEFAULT 'not_done',
	"sunday_status" varchar DEFAULT 'not_done',
	"monday_documented" boolean DEFAULT false NOT NULL,
	"tuesday_documented" boolean DEFAULT false NOT NULL,
	"wednesday_documented" boolean DEFAULT false NOT NULL,
	"thursday_documented" boolean DEFAULT false NOT NULL,
	"friday_documented" boolean DEFAULT false NOT NULL,
	"saturday_documented" boolean DEFAULT false NOT NULL,
	"sunday_documented" boolean DEFAULT false NOT NULL,
	"documentation" text DEFAULT '',
	"approved" boolean DEFAULT false NOT NULL,
	"comments" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"quality_assessment" varchar DEFAULT 'pending'
);
