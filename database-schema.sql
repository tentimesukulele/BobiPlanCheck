-- BobiPlan Family App Database Schema

-- Family members table
CREATE TABLE family_members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    role VARCHAR(20) DEFAULT 'member', -- 'parent', 'child', 'member'
    avatar_color VARCHAR(7) DEFAULT '#007AFF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert family members
INSERT INTO family_members (name, role) VALUES
('Marko', 'parent'),
('Jasna', 'parent'),
('Anže', 'child'),
('David', 'child'),
('Filip', 'child');

-- Tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES family_members(id),
    assigned_to INTEGER REFERENCES family_members(id),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'disputed'
    task_type VARCHAR(20) DEFAULT 'one_time', -- 'one_time', 'weekly'
    weekly_start_date DATE, -- For weekly tasks
    weekly_end_date DATE, -- For weekly tasks
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task disputes table
CREATE TABLE task_disputes (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id),
    disputed_by INTEGER REFERENCES family_members(id),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'resolved', 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- School schedules table (A/B weeks for elementary school)
CREATE TABLE school_schedules (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES family_members(id),
    week_type VARCHAR(1) NOT NULL, -- 'A' or 'B'
    day_of_week INTEGER NOT NULL, -- 1-7 (Monday-Sunday)
    subject VARCHAR(100),
    start_time TIME,
    end_time TIME,
    teacher VARCHAR(100),
    classroom VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Family calendar events
CREATE TABLE calendar_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    location VARCHAR(255),
    event_type VARCHAR(50) DEFAULT 'appointment', -- 'appointment', 'reminder', 'meeting'
    created_by INTEGER REFERENCES family_members(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calendar event participants (many-to-many)
CREATE TABLE calendar_participants (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES calendar_events(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES family_members(id),
    response VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Push notification tokens
CREATE TABLE notification_tokens (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES family_members(id),
    token VARCHAR(255) NOT NULL,
    platform VARCHAR(20) DEFAULT 'ios', -- 'ios', 'android'
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_school_schedules_student ON school_schedules(student_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_participants_event ON calendar_participants(event_id);
CREATE INDEX idx_calendar_participants_member ON calendar_participants(member_id);