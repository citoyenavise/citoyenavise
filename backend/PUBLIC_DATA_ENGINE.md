# 🏛️ PUBLIC DATA ENGINE (PDE)
## L'Infra Officielle Citoyenavise pour les Données Publiques

**Version:** 1.0.0  
**Statut:** Architecture de Production  
**Dernière mise à jour:** 2026-05-10

---

## 📋 TABLE DES MATIÈRES

1. [Vision Générale](#vision-générale)
2. [Architecture du PDE](#architecture-du-pde)
3. [Schéma Standardisé](#schéma-standardisé)
4. [Cycle de Vie des Données](#cycle-de-vie-des-données)
5. [Endpoints & APIs](#endpoints--apis)
6. [Intégrations Automatiques](#intégrations-automatiques)
7. [Invariants & Garanties](#invariants--garanties)
8. [Exemples de Datasets](#exemples-de-datasets)
9. [Roadmap](#roadmap)

---

## 🎯 VISION GÉNÉRALE

### Le Problème
- **Milliers d'établissements** à importer (hôpitaux, écoles, députés, services, etc.)
- **Sources hétérogènes** (CSV, API, JSON, Excel, scraping, données manuelles)
- **Formats différents** (colonnes différentes, structures différentes, encodages différents)
- **Granularités variées** (par ville, par région, par type, par influence)
- **Objectif:** Une carte qui affiche TOUT + des pages publiques pour TOUT + des données réutilisables partout

### La Solution
Un **moteur unique, universal, automatisé** capable de :

✅ Ingérer n'importe quel dataset  
✅ Normaliser en format standard Citoyenavise  
✅ Relier automatiquement aux autres modules (MAP, IDEAS, FEED, ANALYTICS, PAGES)  
✅ Publier partout (API, carte, flux, pages publiques)  
✅ Gérer le versioning et l'historique  
✅ Valider la cohérence et l'intégrité  
✅ Suivre les transformations et les liens  

**Ça s'appelle : Public Data Engine (PDE)**

---

## 🔧 ARCHITECTURE DU PDE

### Les 4 Piliers du PDE

```
RAW DATA
(CSV, JSON, API, Excel, Scraping)
    ↓
[A] INGESTION LAYER
    • Format detection
    • Source validation
    • Schema mapping
    ↓
[B] NORMALIZATION LAYER
    • Field standardization
    • Geo-coding
    • Type casting
    • Deduplication
    ↓
[C] LINKING LAYER
    • Auto-relate to map
    • Auto-relate to ideas
    • Auto-relate to deputies
    • Auto-relate to regions
    • Auto-relate to services
    ↓
[D] PUBLICATION LAYER
    • API endpoints
    • MAP integration
    • FEED generation
    • PUBLIC PAGES
    • ANALYTICS
    ↓
PUBLISHED DATA
(Everywhere in Citoyenavise)
```

### 4 Sous-Modules Internes

#### A. INGESTION Module
**Responsable :** Recevoir les données brutes

**Formats supportés :**
- CSV (avec detection d'en-têtes)
- JSON (arrays ou objects)
- JSON Lines (.jsonl)
- Excel (.xlsx avec multi-sheets)
- API REST (pagination auto)
- XML (avec mapping)
- Données manuelles (formulaire web)
- Scraping web (avec rules)

**Workflow :**
```
1. Recevoir fichier/API/données
2. Détecter format automatiquement
3. Valider structure basique
4. Parser les données
5. Créer dataset RAW (non normalisé)
6. Logger source + date + nombre d'enregistrements
```

**Output :** Dataset RAW avec metadata

---

#### B. NORMALIZATION Module
**Responsable :** Convertir tout en format standard Citoyenavise

**Standard Format :**
```json
{
  "id": "uuid-v4",
  "dataset_id": "hospitals_qc_2026",
  "type": "hospital|school|deputy|service|institution|municipality",
  
  "name": "string",
  "description": "string (long form)",
  "short_description": "string (one-liner)",
  
  "address": "string",
  "postal_code": "string",
  "city": "string",
  "region": "string",
  "country": "CA",
  "coordinates": {
    "lat": 45.5017,
    "lng": -73.5673,
    "accuracy": "address|postal|city|region",
    "geocoded_at": "timestamp"
  },
  
  "contact": {
    "phone": "string",
    "email": "string",
    "website": "url",
    "fax": "string",
    "hours": { "mon": "09:00-17:00", ... }
  },
  
  "classification": {
    "type": "hospital",
    "subtype": "general_hospital|specialized|clinic",
    "category": "public|private|non_profit",
    "jurisdiction": "federal|provincial|municipal",
    "tags": ["emergency", "pediatrics", "surgery"]
  },
  
  "metadata": {
    "budget": "number",
    "employees": "number",
    "services": ["service1", "service2"],
    "parent_organization": "uuid",
    "affiliated_deputy": "uuid",
    "capacity": "number",
    "established_year": "number",
    "official_status": "active|inactive|closed"
  },
  
  "source": {
    "name": "gouv.qc.ca",
    "url": "string",
    "last_updated": "timestamp",
    "reliability": "verified|trusted|user_submitted"
  },
  
  "versioning": {
    "version": "1.0",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "changed_fields": ["name", "hours"]
  },
  
  "status": "raw|normalized|published|archived"
}
```

**Regles de Normalisation :**

| Champ | Règle |
|-------|-------|
| id | UUID auto-généré, unique, immutable |
| name | Trim + capitalize first letter |
| city | Lookup dans table cities canonical |
| region | Lookup dans table regions canonical |
| coordinates | Geocoding auto via address |
| tags | Lowercase, slugified, max 10 |
| hours | Format HH:MM-HH:MM, validated |
| type | Enum strict (hospital, school, deputy, ...) |
| status | Auto-set based on workflow |

**Output :** Dataset NORMALIZED avec full validation

---

#### C. LINKING Module
**Responsable :** Relier automatiquement aux autres modules

**Liens Automatiques :**

| Source Type | Liens Auto | Logique |
|-------------|-----------|---------|
| Hospital | → MAP, FEED, IDEAS, REGION | Afficher sur la carte + dans le feed régional |
| School | → MAP, FEED, EDUCATION | Afficher sur la carte + section éducation |
| Deputy | → POLITICS, REGION, IDEAS | Afficher dans module politique + région |
| Service | → IDEA, INSTITUTION | Relier aux institutions qui les offrent |
| Municipality | → REGION, MAP | Afficher région + carte |

**Linking Rules :**

```
IF type = "hospital" THEN
  → Create point on MAP with layer "healthcare"
  → Create feed entry in regional FEED
  → Link to regional IDEAS about healthcare
  → Add to ANALYTICS dashboard "health"
  
IF type = "deputy" AND region = X THEN
  → Create profile in POLITICS module
  → Link to all IDEAS in region X
  → Link to all institutions in region X
  → Add to ANALYTICS dashboard "politics"
  
IF classification.parent_organization = Y THEN
  → Auto-link to parent entity
  → Inherit parent metadata if missing
  → Create hierarchical relationship
  
IF institution_type = "public" THEN
  → Make searchable on public site
  → Add to governance transparency pages
  → Include in civic analytics
```

**Output :** Dataset LINKED avec all relationships established

---

#### D. PUBLICATION Layer
**Responsable :** Exposer les données normalisées et liées

**Canaux de Publication :**

| Canal | Format | Access | Exemple |
|-------|--------|--------|---------|
| **API** | JSON REST | Public/Auth | GET /api/v1/institutions |
| **MAP** | GeoJSON | Public | Carte interactive |
| **FEED** | JSON Timeline | Public | /feed/healthcare, /feed/politics |
| **PAGES** | HTML + JSON | Public SEO | /institutions/hospitals-qc |
| **ANALYTICS** | JSON Aggregates | Auth | Dashboards, stats |
| **EXPORT** | CSV + JSON | Public | Download datasets |

**Output :** Dataset PUBLISHED et disponible partout

---

## 📊 SCHÉMA STANDARDISÉ

### PublicEntity (Entité Publique)

**Core Fields (Required)**

```typescript
interface PublicEntity {
  // Identification
  id: UUID;                              // UUID immutable
  dataset_id: string;                    // Lequel dataset belongs to
  version: string;                       // Semantic versioning
  
  // Naming
  name: string;                          // Primary name
  name_fr?: string;                      // French variant
  name_en?: string;                      // English variant
  aliases?: string[];                    // Historical names
  
  // Classification
  type: EntityType;                      // enum: hospital, school, deputy, service, ...
  subtype?: string;                      // More specific type
  category?: string;                     // public, private, non_profit
  jurisdiction?: string;                 // federal, provincial, municipal
}

type EntityType = 
  | 'hospital'
  | 'school'
  | 'university'
  | 'deputy'
  | 'municipality'
  | 'institution'
  | 'service'
  | 'organization'
  | 'facility';
```

**Location Fields (Required for map)**

```typescript
interface Location {
  address: string;                       // Full address
  postal_code: string;
  city: string;
  region: string;
  country: string;                       // Default: 'CA'
  
  coordinates: {
    lat: number;
    lng: number;
    accuracy: 'address' | 'postal' | 'city' | 'region';
    geocoded_at: ISO8601;
    geocoder: string;                    // 'google', 'mapbox', 'osm', etc.
  };
}
```

**Contact Fields**

```typescript
interface Contact {
  phone?: string;                        // Formatted E.164
  email?: string;                        // Validated
  website?: URL;
  fax?: string;
  hours?: OpeningHours;                  // { mon: "09:00-17:00", ... }
  social_media?: {
    facebook?: URL;
    twitter?: URL;
    linkedin?: URL;
  };
}
```

**Metadata Fields (Flexible)**

```typescript
interface Metadata {
  [key: string]: any;
  budget?: number;
  employees?: number;
  capacity?: number;
  established_year?: number;
  services?: string[];
  parent_organization?: UUID;
  affiliated_deputy?: UUID;
  official_status?: 'active' | 'inactive' | 'closed';
  tags?: string[];
  documents?: {
    name: string;
    url: URL;
    type: string;
  }[];
}
```

**Source & Versioning**

```typescript
interface Source {
  name: string;                          // 'gouv.qc.ca', 'statcan', etc.
  url: URL;
  dataset_version: string;
  last_updated: ISO8601;
  reliability: 'verified' | 'trusted' | 'user_submitted';
  license?: string;
}

interface Versioning {
  version: string;                       // e.g. "1.2.3"
  created_at: ISO8601;
  updated_at: ISO8601;
  updated_by?: UUID;                     // User or system
  change_log?: Change[];
}

interface Change {
  field: string;
  old_value: any;
  new_value: any;
  changed_at: ISO8601;
  changed_by: string;                    // 'system' or user UUID
}
```

---

## 🔄 CYCLE DE VIE DES DONNÉES

### State Machine : RAW → PUBLISHED

```
                    ┌─────────────┐
                    │   CREATED   │
                    └──────┬──────┘
                           │
                    (ingestion successful)
                           │
                           ▼
                    ┌─────────────┐
                    │     RAW     │ ◄─── Données brutes, non validées
                    └──────┬──────┘
                           │
                    (normalization)
                           │
                           ▼
                    ┌─────────────┐
                    │ NORMALIZED  │ ◄─── Format standard, validé
                    └──────┬──────┘
                           │
                    (validation & linking)
                           │
                           ▼
                    ┌─────────────┐
                    │   LINKED    │ ◄─── Relations établies
                    └──────┬──────┘
                           │
                    (manual review/approval)
                           │
                           ▼
                    ┌─────────────┐
                    │ PUBLISHED   │ ◄─── Visible partout
                    └──────┬──────┘
                           │
                    (update or archive)
                           │
                           ▼
                    ┌─────────────┐
                    │  ARCHIVED   │ ◄─── Historique
                    └─────────────┘

Transitions:
CREATED → RAW (auto)
RAW → NORMALIZED (auto)
NORMALIZED → LINKED (auto)
LINKED → PUBLISHED (manual approval)
PUBLISHED ⇄ NORMALIZED (updates)
PUBLISHED → ARCHIVED (end of life)
```

**Events Associated:**

| State | Event | Trigger |
|-------|-------|---------|
| RAW | created | Dataset imported |
| RAW | parsed | Parsed successfully |
| NORMALIZED | validated | All validations passed |
| NORMALIZED | validation_error | Failed validation |
| LINKED | relationships_created | Auto-linking complete |
| PUBLISHED | approved | Manual review passed |
| PUBLISHED | updated | Fields changed |
| ARCHIVED | deprecated | End of life |

---

## 🔌 ENDPOINTS & APIs

### Import Endpoints

**POST `/api/v1/public-data/import`**

```bash
curl -X POST http://localhost:5000/api/v1/public-data/import \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_name": "hospitals_qc_2026",
    "type": "hospital",
    "source": "gouv.qc.ca",
    "source_url": "https://gouv.qc.ca/hospitals.csv",
    "description": "All hospitals in Quebec 2026",
    "data": [
      {
        "name": "CHU Sainte-Justine",
        "address": "3175 Chemin de la Côte-Sainte-Catherine",
        "city": "Montreal",
        "province": "QC",
        "phone": "(514) 345-4931",
        "website": "https://www.chusj.org",
        "services": ["pediatrics", "emergency", "surgery"]
      },
      ...
    ]
  }'

Response 201:
{
  "dataset_id": "hospitals_qc_2026",
  "status": "importing",
  "imported_count": 0,
  "total_count": 427,
  "processing_job_id": "job_abc123",
  "estimated_completion": "2 minutes"
}
```

### Query Endpoints

**GET `/api/v1/public-data/institutions`**

```bash
curl "http://localhost:5000/api/v1/public-data/institutions?type=hospital&region=Montreal&limit=20"

Response 200:
{
  "total": 427,
  "page": 1,
  "limit": 20,
  "data": [
    {
      "id": "uuid",
      "name": "CHU Sainte-Justine",
      "type": "hospital",
      "address": "3175 Chemin de la Côte-Sainte-Catherine",
      "city": "Montreal",
      "region": "Quebec",
      "coordinates": { "lat": 45.5017, "lng": -73.5673 },
      "status": "published"
    },
    ...
  ]
}
```

### Attachment Endpoints

**POST `/api/v1/public-data/:id/attach`**

```bash
curl -X POST http://localhost:5000/api/v1/public-data/uuid123/attach \
  -H "Content-Type: application/json" \
  -d '{
    "type": "idea",
    "idea_id": "idea_456",
    "relation": "offers_service",
    "metadata": { "confidence": 0.95 }
  }'

Response 200:
{
  "id": "uuid123",
  "attachments": [
    {
      "type": "idea",
      "target_id": "idea_456",
      "relation": "offers_service",
      "attached_at": "2026-05-10T..."
    }
  ]
}
```

### List All Datasets

**GET `/api/v1/public-data/datasets`**

```bash
curl http://localhost:5000/api/v1/public-data/datasets

Response 200:
{
  "datasets": [
    {
      "id": "hospitals_qc_2026",
      "name": "Hospitals in Quebec",
      "type": "hospital",
      "source": "gouv.qc.ca",
      "total_records": 427,
      "status": "published",
      "created_at": "2026-01-15T...",
      "last_updated": "2026-05-10T..."
    },
    {
      "id": "schools_qc_2026",
      "name": "Schools in Quebec",
      ...
    },
    ...
  ]
}
```

---

## 🔗 INTÉGRATIONS AUTOMATIQUES

### MAP Module Integration

**Automatic Behavior:**

```
WHEN entity type = hospital OR school OR municipality
THEN
  1. Create GeoJSON feature with coordinates
  2. Add to appropriate map layer (healthcare, education, municipal)
  3. Add popup with entity info
  4. Add click action → entity detail page
  5. Add filters for map users
```

**Example:**
```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [-73.5673, 45.5017]
  },
  "properties": {
    "id": "hospital_uuid",
    "name": "CHU Sainte-Justine",
    "type": "hospital",
    "layer": "healthcare",
    "popup": "<b>CHU Sainte-Justine</b><br>Emergency • Pediatrics"
  }
}
```

### IDEAS Module Integration

**Automatic Behavior:**

```
WHEN new hospital OR school is published
THEN
  1. Search for related IDEAS in same region
  2. Create bidirectional links
  3. Add entity to idea detail page
  4. Enable citizen comments on entity page
```

### FEED Module Integration

**Automatic Behavior:**

```
WHEN entity is published
THEN
  1. Create feed entry in regional feed
  2. Categorize by type (healthcare, education, etc.)
  3. Add to citizen's personalized feed
  4. Add to analytics dashboard
```

### DEPUTY Module Integration

**Automatic Behavior:**

```
WHEN entity has affiliated_deputy = deputy_uuid
THEN
  1. Link to deputy profile
  2. Add entity to deputy's jurisdiction page
  3. Enable deputy to comment/claim entity
  4. Track responsibility relationships
```

### ANALYTICS Module Integration

**Automatic Behavior:**

```
WHEN entities are published
THEN
  1. Create aggregates by region, type, category
  2. Track updates and changes
  3. Generate heatmaps (concentration of services)
  4. Calculate coverage metrics
  5. Enable dashboards
```

---

## ✅ INVARIANTS & GARANTIES

### Data Integrity Invariants

1. **Immutability of ID**
   - Every entity has a UUID that never changes
   - Links use this UUID as reference
   - If data changes, version updates, not ID

2. **Unique Dataset Per Type**
   - No two datasets with same `dataset_id`
   - Prevents duplicate imports

3. **Normalized Coordinates or None**
   - Every entity either has valid {lat, lng} OR is marked as "geo_pending"
   - No partial coordinates allowed

4. **Temporal Consistency**
   - created_at ≤ updated_at always
   - All timestamps in UTC ISO8601

5. **Source Attribution**
   - Every entity must reference its source
   - Source must be valid (verified, trusted, or user_submitted)

6. **Type Validity**
   - type must be from official enum
   - No custom/unknown types allowed

### Validation Guarantees

| Field | Validation | Constraint |
|-------|-----------|-----------|
| id | UUID v4 format | Immutable |
| type | Enum | Must be in allowed types |
| name | String, non-empty | Max 255 chars |
| email | RFC 5322 | Or null |
| phone | E.164 format | Or null |
| coordinates | {lat, lng} | -90 to 90, -180 to 180 |
| status | Enum | Only valid transitions |
| version | Semantic | Major.Minor.Patch |

### Processing Guarantees

- **At-least-once processing** — Entity will be imported at least once (idempotent with deduplication)
- **Atomic transitions** — State changes are atomic, no partial transitions
- **Audit trail** — All changes are logged with timestamp and source
- **Linking consistency** — If A→B link is created, reverse relationship B→A is created immediately
- **Publication consistency** — Entity only published if all validations pass and all links established

---

## 📚 EXEMPLES DE DATASETS

### Dataset 1: Hospitals Quebec 2026

```json
{
  "dataset_id": "hospitals_qc_2026",
  "source": "gouv.qc.ca/health",
  "type": "hospital",
  "total_records": 427,
  "fields_mapping": {
    "nom": "name",
    "adresse": "address",
    "ville": "city",
    "code_postal": "postal_code",
    "telephone": "phone",
    "site_web": "website",
    "services": "metadata.services",
    "nombre_employes": "metadata.employees",
    "budget": "metadata.budget"
  }
}
```

### Dataset 2: Schools Quebec 2026

```json
{
  "dataset_id": "schools_qc_2026",
  "source": "education.gouv.qc.ca",
  "type": "school",
  "total_records": 3847,
  "fields_mapping": {
    "nom_ecole": "name",
    "adresse": "address",
    "municipalite": "city",
    "niveau": "metadata.level",
    "directeur": "metadata.principal",
    "nombre_eleves": "metadata.students"
  }
}
```

### Dataset 3: Deputies Canada 2026

```json
{
  "dataset_id": "deputies_canada_2026",
  "source": "parl.gc.ca",
  "type": "deputy",
  "total_records": 338,
  "fields_mapping": {
    "nom": "name",
    "circonscription": "metadata.constituency",
    "province": "region",
    "parti": "metadata.party",
    "contact_email": "contact.email",
    "bureau_adresse": "address"
  }
}
```

### Dataset 4: Municipal Services

```json
{
  "dataset_id": "municipal_services_2026",
  "source": "cities.gouv.qc.ca",
  "type": "service",
  "total_records": 12450,
  "fields_mapping": {
    "nom_service": "name",
    "type_service": "subtype",
    "ville": "city",
    "contact": "contact.email",
    "horaires": "contact.hours"
  }
}
```

---

## 🚀 ROADMAP

### Phase 1: Core Infrastructure (DONE)
- [x] Define PDE architecture
- [x] Define standardized schema
- [x] Define state machine
- [x] Define APIs
- [x] Create module structure

### Phase 2: Implementation (TO DO)
- [ ] Implement Ingestion module
- [ ] Implement Normalization module
- [ ] Implement Linking module
- [ ] Implement Publication layer
- [ ] Add validations
- [ ] Add error handling

### Phase 3: Integration (TO DO)
- [ ] MAP module integration
- [ ] IDEAS module integration
- [ ] FEED module integration
- [ ] DEPUTY module integration
- [ ] ANALYTICS module integration

### Phase 4: Data Loading (TO DO)
- [ ] Load hospitals_qc_2026 (427 records)
- [ ] Load schools_qc_2026 (3847 records)
- [ ] Load deputies_canada_2026 (338 records)
- [ ] Load municipal_services_2026 (12450 records)
- [ ] Load additional datasets as needed

### Phase 5: Public Interfaces (TO DO)
- [ ] Public pages for each entity type
- [ ] MAP visualization
- [ ] Search & filter
- [ ] Analytics dashboards
- [ ] Export functionality

---

## 📖 UTILISATION PRATIQUE

### Pour Importer un Nouveau Dataset

1. **Préparer les données** (CSV, JSON, API, etc.)
2. **Mapper les champs** vers le schéma standard
3. **Appeler POST `/api/v1/public-data/import`**
4. **Système fait automatiquement :**
   - Ingère
   - Normalise
   - Valide
   - Lie à la carte
   - Lie aux idées
   - Publie
5. **Données disponibles partout :** carte, API, feed, pages publiques

### Pour Attacher des Informations

```bash
# Attacher une idée à un hôpital
curl -X POST /api/v1/public-data/hospital_uuid/attach \
  -d '{"type": "idea", "idea_id": "idea_uuid"}'

# Attacher un document
curl -X POST /api/v1/public-data/school_uuid/attach \
  -d '{"type": "document", "url": "https://...", "title": "..."}'

# Attacher un service
curl -X POST /api/v1/public-data/hospital_uuid/attach \
  -d '{"type": "service", "service_id": "service_uuid"}'
```

---

## 🎯 RÉSUMÉ

Le PDE est l'infrastructure **unique et officielle** pour :

✅ Importer **n'importe quel dataset** public  
✅ Normaliser automatiquement en format standard  
✅ Lier automatiquement aux autres modules  
✅ Publier partout dans Citoyenavise  
✅ Gérer versioning et historique  
✅ Garantir cohérence et intégrité  

**Un seul moteur. Scalable. Versionné. Professionnel.**

C'est comment on fait en 2026 🚀
