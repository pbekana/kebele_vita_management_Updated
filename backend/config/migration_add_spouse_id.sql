-- Migration script to add spouse_id column to residents table
-- Run this script on existing databases to update the schema

USE kebele_vital_db;

-- Add spouse_id column if it doesn't exist
ALTER TABLE residents 
ADD COLUMN IF NOT EXISTS spouse_id INT NULL AFTER mother_name;

-- Add foreign key constraint if it doesn't exist
ALTER TABLE residents 
ADD CONSTRAINT IF NOT EXISTS fk_residents_spouse 
FOREIGN KEY (spouse_id) REFERENCES residents(id) ON DELETE SET NULL;
