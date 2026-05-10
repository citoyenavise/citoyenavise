-- V003: Public Data Engine (PDE) Schema
-- Creates tables for ingesting, normalizing, linking, and publishing public data
-- Date: 2026-05-10

-- Dataset metadata table
CREATE TABLE IF NOT EXISTS public_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- hospital, school, deputy, service, etc.
  source_name VARCHAR(255) NOT NULL,
  source_url TEXT,
  source_reliability VARCHAR(50) DEFAULT 'trusted', -- verified, trusted, user_submitted
  total_records INT DEFAULT 0,
  imported_records INT DEFAULT 0,
  processed_records INT DEFAULT 0,
  failed_records INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'created', -- created, importing, processing, published, archived
  license VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Public entities table (standardized entities)
CREATE TABLE IF NOT EXISTS public_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id VARCHAR(255) NOT NULL REFERENCES public_datasets(dataset_id) ON DELETE CASCADE,

  -- Identification
  entity_id VARCHAR(255), -- Original ID from source
  version VARCHAR(20) DEFAULT '1.0.0',

  -- Naming
  name VARCHAR(255) NOT NULL,
  name_fr VARCHAR(255),
  name_en VARCHAR(255),
  short_description TEXT,
  description TEXT,
  aliases TEXT[], -- JSON array of alternative names

  -- Classification
  type VARCHAR(50) NOT NULL, -- hospital, school, deputy, service, municipality, institution, organization, facility
  subtype VARCHAR(100),
  category VARCHAR(50), -- public, private, non_profit
  jurisdiction VARCHAR(50), -- federal, provincial, municipal
  tags TEXT[], -- Array of tags

  -- Location
  address VARCHAR(500),
  postal_code VARCHAR(10),
  city VARCHAR(100),
  region VARCHAR(100),
  country VARCHAR(2) DEFAULT 'CA',

  -- Geolocation
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_accuracy VARCHAR(20), -- address, postal, city, region
  geocoded_at TIMESTAMP,
  geocoder VARCHAR(50), -- google, mapbox, osm, etc.

  -- Contact information
  phone VARCHAR(20),
  email VARCHAR(100),
  website TEXT,
  fax VARCHAR(20),
  social_facebook TEXT,
  social_twitter TEXT,
  social_linkedin TEXT,

  -- Opening hours (JSON format: {"mon": "09:00-17:00", "tue": "09:00-17:00", ...})
  opening_hours JSONB,

  -- Metadata (flexible JSON field)
  metadata JSONB,

  -- Relationships
  parent_organization_id UUID REFERENCES public_entities(id) ON DELETE SET NULL,
  affiliated_deputy_id UUID REFERENCES public_entities(id) ON DELETE SET NULL,

  -- Source information
  source_name VARCHAR(255),
  source_url TEXT,
  source_last_updated TIMESTAMP,
  source_reliability VARCHAR(50),

  -- Status tracking
  status VARCHAR(50) DEFAULT 'raw', -- raw, normalized, linked, published, archived
  is_published BOOLEAN DEFAULT FALSE,

  -- Versioning
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  archived_at TIMESTAMP,

  -- Audit
  created_by VARCHAR(100),
  updated_by VARCHAR(100),

  INDEX idx_dataset_type (dataset_id, type),
  INDEX idx_city_region (city, region),
  INDEX idx_status (status),
  INDEX idx_type (type),
  INDEX idx_coordinates (latitude, longitude),
  UNIQUE(dataset_id, entity_id)
);

-- Entity relationships/attachments table (linking to other modules)
CREATE TABLE IF NOT EXISTS entity_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public_entities(id) ON DELETE CASCADE,

  -- Type of attachment
  attachment_type VARCHAR(50) NOT NULL, -- idea, petition, region, deputy, service, parent_entity
  target_id VARCHAR(255) NOT NULL, -- UUID or ID of target

  -- Relationship metadata
  relation_type VARCHAR(100), -- offers_service, located_in, governed_by, etc.
  confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
  metadata JSONB,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_entity_type (entity_id, attachment_type),
  INDEX idx_target (attachment_type, target_id)
);

-- Entity changelog/versioning table
CREATE TABLE IF NOT EXISTS entity_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public_entities(id) ON DELETE CASCADE,

  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  change_reason VARCHAR(255),
  changed_by VARCHAR(100),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_entity_date (entity_id, created_at)
);

-- Import jobs table (for tracking async import operations)
CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id VARCHAR(255) NOT NULL,

  status VARCHAR(50) DEFAULT 'queued', -- queued, processing, completed, failed
  total_records INT,
  processed_records INT DEFAULT 0,
  failed_records INT DEFAULT 0,
  error_message TEXT,

  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  estimated_completion TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_dataset_status (dataset_id, status)
);

-- Normalization rules table (for managing field mappings)
CREATE TABLE IF NOT EXISTS normalization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id VARCHAR(255) NOT NULL REFERENCES public_datasets(dataset_id) ON DELETE CASCADE,

  source_field VARCHAR(255) NOT NULL,
  target_field VARCHAR(255) NOT NULL,
  transformation_rule JSONB, -- { type: 'trim', 'uppercase', 'map', 'geocode', etc. }

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(dataset_id, source_field)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_public_entities_dataset_status ON public_entities(dataset_id, status);
CREATE INDEX IF NOT EXISTS idx_public_entities_type_status ON public_entities(type, status);
CREATE INDEX IF NOT EXISTS idx_public_entities_published ON public_entities(is_published, status);
CREATE INDEX IF NOT EXISTS idx_public_datasets_status ON public_datasets(status);
CREATE INDEX IF NOT EXISTS idx_entity_attachments_entity ON entity_attachments(entity_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created ON import_jobs(created_at);

-- Track schema version
INSERT INTO schema_versions (version_number, description)
VALUES (3, 'Add Public Data Engine (PDE) tables')
ON CONFLICT (version_number) DO NOTHING;
