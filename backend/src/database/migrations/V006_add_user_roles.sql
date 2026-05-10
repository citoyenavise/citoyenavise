-- V006: Add User Roles
-- Adds role-based access control to users table
-- Date: 2026-05-10

-- Create user_role enum type
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('citizen', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add role column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'citizen';

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add role column to profiles if it exists
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'citizen';
