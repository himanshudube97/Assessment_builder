-- FlowForm Database Initialization
-- This runs automatically when PostgreSQL container starts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- Create Enums
-- ============================================
DO $$ BEGIN
    CREATE TYPE user_plan AS ENUM ('free', 'pro', 'agency');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assessment_status AS ENUM ('draft', 'published', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- Create Tables
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    plan user_plan NOT NULL DEFAULT 'free',
    plan_expires_at TIMESTAMPTZ,
    response_count_this_month INTEGER NOT NULL DEFAULT 0,
    response_count_reset_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    stripe_customer_id VARCHAR(255),
    google_sheets_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status assessment_status NOT NULL DEFAULT 'draft',
    nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    edges JSONB NOT NULL DEFAULT '[]'::jsonb,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    google_sheet_id VARCHAR(255),
    google_sheet_name VARCHAR(255),
    response_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ
);

-- Responses table
CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    score INTEGER,
    max_score INTEGER,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Create Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_responses_assessment_id ON responses(assessment_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- ============================================
-- Create Triggers for updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assessments_updated_at ON assessments;
CREATE TRIGGER update_assessments_updated_at
    BEFORE UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Seed System User and Demo Assessment
-- ============================================
INSERT INTO users (id, email, name, plan, response_count_reset_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'system@flowform.dev',
    'System User',
    'agency',
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO assessments (id, user_id, title, description, status, nodes, edges, settings)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Welcome Survey',
    'A sample assessment to get you started',
    'draft',
    '[
        {
            "id": "start-node",
            "type": "start",
            "position": {"x": 250, "y": 50},
            "data": {
                "title": "Welcome!",
                "description": "Thank you for taking this survey. It will only take a minute.",
                "buttonText": "Get Started"
            }
        },
        {
            "id": "question-1",
            "type": "question",
            "position": {"x": 250, "y": 200},
            "data": {
                "questionType": "multiple_choice_single",
                "questionText": "How did you hear about us?",
                "description": null,
                "required": true,
                "options": [
                    {"id": "opt-1", "text": "Search Engine"},
                    {"id": "opt-2", "text": "Social Media"},
                    {"id": "opt-3", "text": "Friend/Colleague"},
                    {"id": "opt-4", "text": "Other"}
                ]
            }
        },
        {
            "id": "question-2",
            "type": "question",
            "position": {"x": 250, "y": 400},
            "data": {
                "questionType": "rating",
                "questionText": "How likely are you to recommend us?",
                "description": "On a scale of 1-5",
                "required": true,
                "minValue": 1,
                "maxValue": 5,
                "minLabel": "Not likely",
                "maxLabel": "Very likely"
            }
        },
        {
            "id": "end-node",
            "type": "end",
            "position": {"x": 250, "y": 600},
            "data": {
                "title": "Thank You!",
                "description": "Your feedback helps us improve.",
                "showScore": false,
                "redirectUrl": null
            }
        }
    ]'::jsonb,
    '[
        {"id": "edge-1", "source": "start-node", "target": "question-1", "sourceHandle": null, "condition": null},
        {"id": "edge-2", "source": "question-1", "target": "question-2", "sourceHandle": null, "condition": null},
        {"id": "edge-3", "source": "question-2", "target": "end-node", "sourceHandle": null, "condition": null}
    ]'::jsonb,
    '{
        "primaryColor": "#6366F1",
        "backgroundColor": "#FFFFFF",
        "showProgressBar": true,
        "allowBackNavigation": true,
        "redirectUrl": null,
        "redirectDelaySeconds": 3,
        "maxResponses": null,
        "openAt": null,
        "closeAt": null,
        "password": null,
        "scoringEnabled": false
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ FlowForm database initialized successfully!';
    RAISE NOTICE '📧 System User: system@flowform.dev';
    RAISE NOTICE '🔑 System User ID: 00000000-0000-0000-0000-000000000001';
    RAISE NOTICE '📋 Demo Assessment ID: 00000000-0000-0000-0000-000000000002';
END $$;
