# 📡 Public Data Engine (PDE) — API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:5000/api/v1/public-data`

---

## 📋 Endpoints

### 1. IMPORT (Ingestion)

#### POST `/import`
Import raw data from any source.

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/public-data/import \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_name": "hospitals_qc_2026",
    "type": "hospital",
    "source_name": "gouvernement.qc.ca",
    "source_url": "https://gouv.qc.ca/hospitals.csv",
    "description": "All hospitals in Quebec 2026",
    "data": [
      {
        "name": "CHU Sainte-Justine",
        "adresse": "3175 Chemin de la Côte-Sainte-Catherine",
        "ville": "Montreal",
        "province": "QC",
        "telephone": "(514) 345-4931",
        "website": "https://www.chusj.org",
        "services": ["pediatrics", "emergency", "surgery"]
      }
    ]
  }'
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "dataset_id": "hospitals_qc_2026",
    "status": "importing",
    "imported_count": 0,
    "total_count": 1,
    "processing_job_id": "job_abc123",
    "estimated_completion": "2 minutes"
  }
}
```

---

### 2. NORMALIZATION

#### POST `/normalize/:dataset_id`
Normalize raw entities to standard format.

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/public-data/normalize/hospitals_qc_2026
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "dataset_id": "hospitals_qc_2026",
    "status": "normalizing",
    "normalized_count": 427
  }
}
```

---

### 3. LINKING

#### POST `/link/:dataset_id`
Create automatic links between entities and other modules.

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/public-data/link/hospitals_qc_2026
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "dataset_id": "hospitals_qc_2026",
    "status": "linking",
    "linked_count": 427
  }
}
```

---

### 4. PUBLICATION

#### POST `/publish/:dataset_id`
Publish linked entities (make them public).

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/public-data/publish/hospitals_qc_2026
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "dataset_id": "hospitals_qc_2026",
    "status": "published",
    "published_count": 427
  }
}
```

---

### 5. QUERY ENDPOINTS

#### GET `/institutions`
Get all published institutions with optional filters.

**Query Parameters:**
- `type` - Filter by type (hospital, school, deputy, service, etc.)
- `region` - Filter by region
- `city` - Filter by city
- `search` - Search by name or address
- `limit` - Results per page (default: 20, max: 100)
- `offset` - Pagination offset (default: 0)

**Request:**
```bash
curl "http://localhost:5000/api/v1/public-data/institutions?type=hospital&region=Quebec&limit=20"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1234",
      "name": "CHU Sainte-Justine",
      "type": "hospital",
      "address": "3175 Chemin de la Côte-Sainte-Catherine",
      "city": "Montreal",
      "region": "Quebec",
      "coordinates": {
        "lat": 45.5017,
        "lng": -73.5673
      },
      "phone": "(514) 345-4931",
      "email": "info@chusj.org",
      "website": "https://www.chusj.org",
      "status": "published"
    }
  ],
  "total": 427,
  "limit": 20,
  "offset": 0
}
```

---

#### GET `/institutions/:id`
Get institution detail with all attachments and metadata.

**Request:**
```bash
curl http://localhost:5000/api/v1/public-data/institutions/uuid-1234
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "dataset_id": "hospitals_qc_2026",
    "name": "CHU Sainte-Justine",
    "type": "hospital",
    "subtype": "pediatric_hospital",
    "category": "public",
    "description": "Leading pediatric hospital in Quebec",
    "address": "3175 Chemin de la Côte-Sainte-Catherine",
    "city": "Montreal",
    "region": "Quebec",
    "postal_code": "H3H 1P3",
    "latitude": 45.5017,
    "longitude": -73.5673,
    "phone": "(514) 345-4931",
    "email": "info@chusj.org",
    "website": "https://www.chusj.org",
    "opening_hours": {
      "mon": "09:00-17:00",
      "tue": "09:00-17:00",
      "wed": "09:00-17:00",
      "thu": "09:00-17:00",
      "fri": "09:00-17:00",
      "sat": "10:00-14:00",
      "sun": "closed"
    },
    "metadata": {
      "budget": 500000000,
      "employees": 2500,
      "capacity": 400,
      "services": ["emergency", "pediatrics", "surgery", "oncology"],
      "official_status": "active"
    },
    "attachments": [
      {
        "attachment_type": "map",
        "target_id": "healthcare-layer",
        "relation_type": "appears_on",
        "confidence_score": 1.0
      },
      {
        "attachment_type": "feed",
        "target_id": "healthcare-Quebec",
        "relation_type": "featured_in",
        "confidence_score": 0.95
      }
    ],
    "status": "published",
    "published_at": "2026-05-10T14:30:00Z"
  }
}
```

---

#### GET `/search`
Full-text search for institutions.

**Query Parameters:**
- `q` - Search query (min 2 characters)
- `limit` - Results limit (default: 50, max: 200)

**Request:**
```bash
curl "http://localhost:5000/api/v1/public-data/search?q=hospital&limit=10"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1234",
      "name": "CHU Sainte-Justine",
      "type": "hospital",
      "city": "Montreal",
      "region": "Quebec",
      "latitude": 45.5017,
      "longitude": -73.5673
    }
  ],
  "count": 1
}
```

---

### 6. MAP ENDPOINTS

#### GET `/map/geojson`
Get GeoJSON for map visualization (Leaflet, Mapbox, etc.).

**Query Parameters:**
- `type` - Filter by type
- `region` - Filter by region
- `city` - Filter by city

**Request:**
```bash
curl "http://localhost:5000/api/v1/public-data/map/geojson?type=hospital&region=Quebec"
```

**Response:** `200 OK`
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-73.5673, 45.5017]
      },
      "properties": {
        "id": "uuid-1234",
        "name": "CHU Sainte-Justine",
        "type": "hospital",
        "city": "Montreal",
        "region": "Quebec",
        "phone": "(514) 345-4931",
        "website": "https://www.chusj.org"
      }
    }
  ]
}
```

---

#### GET `/map/bounds`
Get institutions within geographic bounds.

**Query Parameters (Required):**
- `minLat` - Minimum latitude
- `maxLat` - Maximum latitude
- `minLng` - Minimum longitude
- `maxLng` - Maximum longitude
- `type` - (Optional) Filter by type

**Request:**
```bash
curl "http://localhost:5000/api/v1/public-data/map/bounds?minLat=45.4&maxLat=45.6&minLng=-73.7&maxLng=-73.4&type=hospital"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1234",
      "name": "CHU Sainte-Justine",
      "type": "hospital",
      "latitude": 45.5017,
      "longitude": -73.5673,
      "city": "Montreal",
      "region": "Quebec",
      "phone": "(514) 345-4931",
      "website": "https://www.chusj.org"
    }
  ],
  "count": 1
}
```

---

### 7. DATASET MANAGEMENT

#### GET `/datasets`
List all datasets.

**Request:**
```bash
curl http://localhost:5000/api/v1/public-data/datasets
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-abc",
      "dataset_id": "hospitals_qc_2026",
      "name": "Hospitals in Quebec",
      "type": "hospital",
      "source_name": "gouvernement.qc.ca",
      "total_records": 427,
      "imported_records": 427,
      "processed_records": 427,
      "status": "published",
      "created_at": "2026-05-10T14:00:00Z",
      "updated_at": "2026-05-10T14:30:00Z"
    }
  ]
}
```

---

#### GET `/datasets/:dataset_id`
Get dataset status and metadata.

**Request:**
```bash
curl http://localhost:5000/api/v1/public-data/datasets/hospitals_qc_2026
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid-abc",
    "dataset_id": "hospitals_qc_2026",
    "name": "Hospitals in Quebec",
    "type": "hospital",
    "source_name": "gouvernement.qc.ca",
    "total_records": 427,
    "imported_records": 427,
    "processed_records": 427,
    "status": "published"
  }
}
```

---

### 8. STATISTICS

#### GET `/statistics`
Get aggregated statistics about all public data.

**Request:**
```bash
curl http://localhost:5000/api/v1/public-data/statistics
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "total": {
      "total_institutions": 2500,
      "dataset_count": 5,
      "type_count": 4,
      "region_count": 17,
      "city_count": 98
    },
    "by_type": [
      {
        "type": "hospital",
        "count": 427
      },
      {
        "type": "school",
        "count": 1800
      },
      {
        "type": "deputy",
        "count": 273
      }
    ],
    "by_region": [
      {
        "region": "Quebec",
        "count": 800
      },
      {
        "region": "Montreal",
        "count": 600
      }
    ]
  }
}
```

---

### 9. EXPORT

#### GET `/export/:dataset_id`
Export dataset as CSV or JSON.

**Query Parameters:**
- `format` - Export format: `csv` or `json` (default: csv)

**Request:**
```bash
curl "http://localhost:5000/api/v1/public-data/export/hospitals_qc_2026?format=csv" -o hospitals_qc_2026.csv
```

**Response:** CSV file (Content-Type: text/csv)
```csv
id,name,type,address,city,region,phone,email,website
uuid-1,CHU Sainte-Justine,hospital,3175 Chemin de la Côte-Sainte-Catherine,Montreal,Quebec,(514) 345-4931,info@chusj.org,https://www.chusj.org
```

---

## 🔄 Complete Workflow Example

### Step-by-step example: Import → Normalize → Link → Publish

```bash
# 1. IMPORT raw data
curl -X POST http://localhost:5000/api/v1/public-data/import \
  -H "Content-Type: application/json" \
  -d @hospitals_import.json

# 2. NORMALIZE (convert to standard format)
curl -X POST http://localhost:5000/api/v1/public-data/normalize/hospitals_qc_2026

# 3. LINK (create automatic relationships)
curl -X POST http://localhost:5000/api/v1/public-data/link/hospitals_qc_2026

# 4. PUBLISH (make public)
curl -X POST http://localhost:5000/api/v1/public-data/publish/hospitals_qc_2026

# 5. QUERY (verify success)
curl "http://localhost:5000/api/v1/public-data/institutions?type=hospital&limit=5"

# 6. EXPORT (download for reuse)
curl "http://localhost:5000/api/v1/public-data/export/hospitals_qc_2026?format=csv" -o hospitals.csv
```

---

## 📊 Sample Data Format for Import

```json
{
  "dataset_name": "hospitals_qc_2026",
  "type": "hospital",
  "source_name": "gouvernement.qc.ca",
  "source_url": "https://gouv.qc.ca/hospitals.csv",
  "description": "All hospitals in Quebec 2026",
  "reliability": "trusted",
  "data": [
    {
      "id": "hosp_001",
      "name": "CHU Sainte-Justine",
      "adresse": "3175 Chemin de la Côte-Sainte-Catherine",
      "ville": "Montreal",
      "province": "QC",
      "code_postal": "H3H 1P3",
      "telephone": "(514) 345-4931",
      "email": "info@chusj.org",
      "website": "https://www.chusj.org",
      "type": "hospital",
      "categorie": "public",
      "jurisdiction": "provincial",
      "services": ["emergency", "pediatrics", "surgery", "oncology"],
      "employees": 2500,
      "capacity": 400,
      "official_status": "active"
    }
  ]
}
```

---

## ✅ Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET, POST) |
| 201 | Created (POST /import) |
| 400 | Bad Request (missing fields) |
| 404 | Not Found |
| 500 | Server Error |

---

## 🔐 Notes

- All endpoints are currently **public** (no authentication required)
- For production, consider adding authentication to `/import`, `/normalize`, `/link`, `/publish`
- Data is normalized and validated automatically
- Geographic coordinates are optional but recommended for map functionality
- Search is case-insensitive and supports partial matches

---

## 📚 Related Documentation

- [PUBLIC_DATA_ENGINE.md](./PUBLIC_DATA_ENGINE.md) — Architecture and design
- [CLAUDE.md](../.claude/CLAUDE.md) — Project guidelines
- [DEPLOYMENT.md](../DEPLOYMENT.md) — Deployment instructions
