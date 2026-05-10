-- Migration 012: Add geolocation coordinates to circonscriptions table
-- Date: 2026-05-10
-- Description: Add latitude and longitude columns for map display

ALTER TABLE circonscriptions ADD COLUMN latitude FLOAT;
ALTER TABLE circonscriptions ADD COLUMN longitude FLOAT;

-- Index for spatial queries
CREATE INDEX idx_circonscriptions_latitude_longitude ON circonscriptions(latitude, longitude);
