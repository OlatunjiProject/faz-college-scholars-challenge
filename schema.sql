-- Production-Ready Schema Setup for Neon.tech PostgreSQL Database
-- Netlify/Serverless Online Examination Engine Schema

-- 1. Create Admins Table
CREATE TABLE IF NOT EXISTS admins (
    username VARCHAR(100) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'sub_admin',
    recovery_email VARCHAR(255) NOT NULL DEFAULT 'admin@fazcollege.com.ng',
    recovery_question VARCHAR(255) NOT NULL DEFAULT 'What is your favorite academic subject?',
    recovery_answer VARCHAR(255) NOT NULL DEFAULT 'Mathematics'
);

-- 2. Create Users (Students) Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    dob VARCHAR(100), -- Stored as VARCHAR to prevent parsing exceptions with varied date/string formats
    parent_name VARCHAR(255) NOT NULL,
    parent_email VARCHAR(255) NOT NULL,
    parent_phone VARCHAR(50),
    school VARCHAR(255),
    student_class VARCHAR(100),
    teacher_name VARCHAR(255),
    teacher_email VARCHAR(255),
    teacher_phone VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    score INT NOT NULL DEFAULT 0
);

-- 3. Create Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(255) NOT NULL DEFAULT 'General',
    text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct VARCHAR(50) NOT NULL,
    round INT NOT NULL DEFAULT 2
);

-- 4. Create Settings Table
-- Restricted to a single row config using PRIMARY KEY and CHECK constraints to guarantee single global state
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    round INT NOT NULL DEFAULT 2,
    question_count INT NOT NULL DEFAULT 10,
    time_minutes INT NOT NULL DEFAULT 30,
    is_live BOOLEAN NOT NULL DEFAULT FALSE
);

-- 5. Seed default administrator with Bcrypt pre-hashed 'admin22' credentials
-- Seed credentials match the fallback local configuration
INSERT INTO admins (username, password, role, recovery_email, recovery_question, recovery_answer)
VALUES (
    'admin', 
    '$2a$10$vY30hAit3Z6H9WInCOrZ0.bZ7vXWzXFmG1R3M2SbyUHevHwE5g0S.', -- Hash of 'admin22' with salt round 10
    'main_admin', 
    'admin@fazcollege.com.ng', 
    'What is your favorite academic subject?', 
    'Mathematics'
)
ON CONFLICT (username) DO NOTHING;

-- 6. Seed default settings state
INSERT INTO settings (id, round, question_count, time_minutes, is_live)
VALUES (1, 2, 10, 30, FALSE)
ON CONFLICT (id) DO NOTHING;
