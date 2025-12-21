# Lowcode Designer Version History Feature - Design Document

## Overview

The Lowcode Designer Version History feature provides comprehensive version control for low-code pages. It automatically creates versions on save, enables rollback to previous versions, and provides a complete management interface in the admin panel. The design ensures data consistency across database, Docker, and Prisma seed data.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Designer UI          │  Admin Panel UI                      │
│  - Version Panel      │  - Version List                      │
│  - Rollback Dialog    │  - Version Comparison                │
│  - Save Handler       │  - Rollback Management               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (REST)                          │
├─────────────────────────────────────────────────────────────┤
│  GET    /lowcode/pages/:id/versions                         │
│  POST   /lowcode/pages/:id/versions                         │
│  GET    /lowcode/pages/:id/versions/:versionId              │
│  POST   /lowcode/pages/:id/versions/:versionId/rollback     │
│  GET    /lowcode/pages/:id/versions/compare                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Application Layer (CQRS)                    │
├─────────────────────────────────────────────────────────────┤
│  Commands:                                                   │
│  - LowcodePageVersionCreateCommand                           │
│  - LowcodePageVersionRollbackCommand                         │
│                                                              │
│  Queries:                                                    │
│  - GetLowcodePageVersionsQuery                               │
│  - GetLowcodePageVersionByIdQuery                            │
│  - CompareVersionsQuery                                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Domain Layer (Repositories)                 │
├─────────────────────────────────────────────────────────────┤
│  LowcodePageVersionRepository                                │
│  - create(version)                                           │
│  - findById(id)                                              │
│  - findByPageId(pageId, pagination)                          │
│  - update(version)                                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Data Layer (Prisma)                         │
├─────────────────────────────────────────────────────────────┤
│  SysLowcodePageVersion                                       │
│  SysLowcodePage                                              │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Backend Components

#### 1. Version Management Service
- **Purpose**: Orchestrate version creation, retrieval, and rollback operations
- **Responsibilities**:
  - Auto-increment version numbers
  - Create version snapshots
  - Manage rollback operations
  - Validate version integrity

#### 2. Version Repository
- **Purpose**: Data access layer for version operations
- **Methods**:
  - `create(pageId, schema, changelog, userId)`: Create new version
  - `findByPageId(pageId, pagination)`: Get paginated versions
  - `findById(versionId)`: Get specific version
  - `findLatestVersion(pageId)`: Get latest version

#### 3. Version Controller
- **Purpose**: Handle HTTP requests for version management
- **Endpoints**:
  - `GET /lowcode/pages/:id/versions` - List versions
  - `POST /lowcode/pages/:id/versions` - Create manual version
  - `GET /lowcode/pages/:id/versions/:versionId` - Get version details
  - `POST /lowcode/pages/:id/versions/:versionId/rollback` - Rollback to version
  - `GET /lowcode/pages/:id/versions/compare` - Compare versions

### Frontend Components

#### 1. Designer Version Panel
- **Location**: `lowcode-designer/src/designer/plugins/plugin-left-versions-manage/`
- **Features**:
  - Display version list with timestamps
  - Show creator information
  - Provide rollback button
  - Display changelog

#### 2. Admin Version Management Page
- **Location**: `frontend/src/views/lowcode-version-management/`
- **Features**:
  - Version list with pagination
  - Version details viewer
  - Version comparison interface
  - Rollback confirmation dialog

## Data Models

### Database Schema

#### SysLowcodePageVersion Table

```sql
CREATE TABLE sys_lowcode_page_version (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES sys_lowcode_page(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  schema JSONB NOT NULL,
  changelog TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(36) NOT NULL,
  
  UNIQUE(page_id, version),
  INDEX(page_id, created_at DESC)
);
```

#### SysLowcodePage Table (Updated)

```sql
ALTER TABLE sys_lowcode_page ADD COLUMN IF NOT EXISTS current_version VARCHAR(20);
```

### Data Structures

#### Version Entity
```typescript
interface LowcodePageVersion {
  id: string;                    // UUID
  pageId: string;                // UUID
  version: string;               // Semantic version (e.g., 1.0.0)
  schema: Record<string, any>;   // AMIS JSON schema
  changelog: string | null;      // Change description
  createdAt: Date;               // Creation timestamp
  createdBy: string;             // User ID
}
```

#### Version Response DTO
```typescript
interface VersionResponseDto {
  id: string;
  version: string;
  changelog: string | null;
  createdAt: string;
  createdBy: string;
  createdByName: string;         // User display name
}
```

#### Version List Response
```typescript
interface VersionListResponse {
  total: number;
  current: number;
  size: number;
  versions: VersionResponseDto[];
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Version Number Monotonicity
*For any* lowcode page, when multiple versions are created sequentially, each new version number SHALL be greater than the previous version number according to semantic versioning rules.

**Validates: Requirements 1.2**

### Property 2: Version Immutability
*For any* version that has been created, the schema and changelog fields SHALL remain unchanged after creation.

**Validates: Requirements 1.1, 1.4**

### Property 3: Rollback Creates New Version
*For any* rollback operation to a previous version, the system SHALL create a new version record with the rolled-back schema and a changelog indicating the rollback action.

**Validates: Requirements 3.2, 3.3**

### Property 4: Version Retrieval Completeness
*For any* lowcode page with N versions, querying the version list SHALL return exactly N version records with all required fields (id, version, schema, changelog, createdAt, createdBy).

**Validates: Requirements 2.1, 2.2**

### Property 5: Referential Integrity
*For any* version record, the associated page record SHALL exist in the database, and deleting a page SHALL cascade-delete all associated versions.

**Validates: Requirements 5.5**

### Property 6: Version Uniqueness Per Page
*For any* lowcode page, no two versions SHALL have the same version number.

**Validates: Requirements 1.2, 5.1**

### Property 7: Creator Tracking
*For any* version, the createdBy field SHALL contain a valid user ID, and the createdAt timestamp SHALL be set to the time of version creation.

**Validates: Requirements 1.3**

### Property 8: Rollback State Consistency
*For any* rollback operation, after the operation completes, the current page schema SHALL exactly match the schema of the target version.

**Validates: Requirements 3.1**

## Error Handling

### Error Scenarios

1. **Invalid Version Number**
   - Error: Version number format invalid
   - Response: 400 Bad Request with error message
   - Recovery: Validate version format before creation

2. **Page Not Found**
   - Error: Referenced page does not exist
   - Response: 404 Not Found
   - Recovery: Verify page ID before version operations

3. **Version Not Found**
   - Error: Requested version does not exist
   - Response: 404 Not Found
   - Recovery: Return available versions in error response

4. **Concurrent Modification**
   - Error: Page modified during version creation
   - Response: 409 Conflict
   - Recovery: Retry version creation with latest schema

5. **Unauthorized Access**
   - Error: User lacks permission for version operation
   - Response: 403 Forbidden
   - Recovery: Check user roles and permissions

### Error Response Format

```typescript
interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}
```

## Testing Strategy

### Unit Testing

Unit tests verify specific examples and edge cases:

- Version number generation and validation
- Semantic version comparison logic
- Changelog formatting
- Version entity creation and validation
- Repository CRUD operations
- Error handling for invalid inputs

### Property-Based Testing

Property-based tests verify universal properties that should hold across all inputs:

- Version monotonicity across multiple creations
- Version immutability after creation
- Referential integrity between pages and versions
- Rollback state consistency
- Version uniqueness per page
- Creator tracking accuracy
- Rollback creates new version record

### Test Configuration

- **Framework**: Jest with fast-check for property-based testing
- **Minimum Iterations**: 100 per property test
- **Coverage Target**: >90% for version management logic
- **Test Location**: Co-located with source files using `.test.ts` suffix

### Test Execution

```bash
# Unit tests
npm run test -- --testPathPattern="version"

# Property-based tests
npm run test -- --testPathPattern="version.*property"

# All tests with coverage
npm run test:cov -- --testPathPattern="version"
```

