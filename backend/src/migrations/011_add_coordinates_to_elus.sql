-- Migration 011: Add geolocation coordinates to elus table
-- Date: 2026-05-10
-- Description: Add latitude and longitude columns for map display

ALTER TABLE elus ADD COLUMN latitude FLOAT;
ALTER TABLE elus ADD COLUMN longitude FLOAT;

-- Index for spatial queries (future use with PostGIS)
CREATE INDEX idx_elus_latitude_longitude ON elus(latitude, longitude);
