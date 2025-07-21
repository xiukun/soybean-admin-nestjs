# Enhanced Code Generation System

## Overview

The Enhanced Code Generation System is a comprehensive solution for generating high-quality, production-ready code from metadata definitions. It features intelligent field categorization, enhanced template rendering, comprehensive validation, and robust caching mechanisms.

## Key Features

### 🚀 Intelligent Code Generation
- **Smart Field Categorization**: Automatically categorizes fields as searchable, filterable, sortable, etc.
- **Enhanced Type Mapping**: Comprehensive TypeScript and Prisma type mapping
- **Template Context Enhancement**: Rich context with field metadata and relationships
- **Validation Rules Generation**: Automatic validation rule creation based on field types

### 🎯 Advanced Template Engine
- **Handlebars Integration**: Powerful template rendering with custom helpers
- **Template Variables**: Support for dynamic template variables with validation
- **Partial Templates**: Reusable template components
- **Error Handling**: Comprehensive error handling and reporting

### 📊 Metadata Aggregation
- **Default Fields**: Automatic injection of system fields (id, createdAt, updatedAt, etc.)
- **Field Enhancement**: Enrichment of field metadata with TypeScript and Prisma types
- **Relationship Mapping**: Comprehensive entity relationship handling
- **Caching**: Performance-optimized metadata caching

### 🔧 Validation & Quality
- **Template Validation**: Comprehensive template variable validation
- **Entity Structure Validation**: Entity structure integrity checks
- **Type Safety**: Strong typing throughout the generation process
- **Error Reporting**: Detailed error messages and validation feedback

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Code Generation API                      │
├─────────────────────────────────────────────────────────────┤
│  IntelligentCodeGeneratorService                           │
│  ├── Template Management                                    │
│  ├── File Generation                                        │
│  ├── Validation                                            │
│  └── Context Building                                       │
├─────────────────────────────────────────────────────────────┤
│  MetadataAggregatorService                                 │
│  ├── Project Metadata                                       │
│  ├── Entity Metadata                                        │
│  ├── Field Enhancement                                      │
│  └── Caching                                               │
├─────────────────────────────────────────────────────────────┤
│  TemplateEngineService                                     │
│  ├── Handlebars Integration                                 │
│  ├── Custom Helpers                                         │
│  ├── Partial Templates                                      │
│  └── Error Handling                                         │
├─────────────────────────────────────────────────────────────┤
│                    Database Layer                           │
│  ├── Projects                                              │
│  ├── Entities                                              │
│  ├── Fields                                                │
│  ├── Templates                                             │
│  └── Relationships                                          │
└─────────────────────────────────────────────────────────────┘
```

## Services

### IntelligentCodeGeneratorService

The core service responsible for orchestrating the code generation process.

**Key Methods:**
- `generateFiles(request: GenerationRequest): Promise<GeneratedFile[]>`
- `validateTemplateVariables(templateId: string, variables: Record<string, any>): Promise<ValidationResult>`
- `getTemplates(templateIds: string[]): Promise<TemplateMetadata[]>`

**Features:**
- Enhanced field categorization (searchable, filterable, sortable)
- Comprehensive template context building
- Intelligent type mapping (TypeScript, Prisma)
- Validation rule generation
- Error handling and reporting

### MetadataAggregatorService

Responsible for aggregating and enhancing metadata from the database.

**Key Methods:**
- `getProjectMetadata(projectId: string, useCache?: boolean): Promise<ProjectMetadata>`
- `getEntityMetadata(entityId: string, useCache?: boolean): Promise<EntityMetadata>`
- `validateEntityStructure(entityId: string): Promise<ValidationResult>`

**Features:**
- Automatic default field injection
- Field metadata enhancement
- Relationship mapping
- Performance-optimized caching
- Structure validation

### TemplateEngineService

Advanced template rendering engine with Handlebars integration.

**Key Methods:**
- `compileTemplate(templatePath: string, data: any): Promise<string>`
- `compileTemplateFromString(templateString: string, data: any): Promise<string>`
- `registerPartial(name: string, template: string): void`

**Features:**
- Custom Handlebars helpers
- Partial template support
- Error handling
- Template caching

## Field Categorization

The system automatically categorizes fields based on their properties:

### Searchable Fields
Fields that can be used in search operations:
- STRING, TEXT, UUID types
- Non-system fields

### Filterable Fields
Fields that can be used in filter operations:
- STRING, TEXT, INTEGER, BOOLEAN, DATE, DATETIME, TIMESTAMP, UUID types

### Sortable Fields
Fields that can be used for sorting:
- STRING, TEXT, INTEGER, BIGINT, DECIMAL, DATE, DATETIME, TIMESTAMP types

### System Fields
Automatically injected fields:
- `id`: Primary key (UUID)
- `createdAt`: Creation timestamp
- `updatedAt`: Update timestamp
- `tenantId`: Multi-tenancy support
- `createdBy`: Creator user ID
- `updatedBy`: Last updater user ID

## Template Context

Templates receive a rich context object with the following structure:

```typescript
interface TemplateContext {
  // Entity information
  entity: EntityMetadata;
  entityName: string;
  entityCode: string;
  tableName: string;
  
  // Enhanced fields
  fields: FieldMetadata[];
  
  // Field categories
  primaryKeyField: FieldMetadata;
  systemFields: FieldMetadata[];
  businessFields: FieldMetadata[];
  requiredFields: FieldMetadata[];
  optionalFields: FieldMetadata[];
  uniqueFields: FieldMetadata[];
  searchableFields: FieldMetadata[];
  filterableFields: FieldMetadata[];
  sortableFields: FieldMetadata[];
  dateFields: FieldMetadata[];
  enumFields: FieldMetadata[];
  relationFields: FieldMetadata[];
  
  // Relationships
  relationships: RelationshipMetadata;
  hasRelationships: boolean;
  
  // Generation options
  options: GenerationOptions;
  
  // Metadata flags
  hasSearchableFields: boolean;
  hasFilterableFields: boolean;
  hasDateFields: boolean;
  hasEnumFields: boolean;
  hasUniqueFields: boolean;
  
  // Utility data
  timestamp: string;
  generatedBy: string;
  
  // Custom variables
  [key: string]: any;
}
```

## Usage Examples

### Basic Code Generation

```typescript
const generationRequest: GenerationRequest = {
  projectId: 'my-project',
  templateIds: ['nestjs-service-template'],
  entityIds: ['user-entity'],
  variables: {
    entityName: 'User',
    tableName: 'users',
  },
  options: {
    overwriteExisting: true,
    generateTests: true,
    generateDocs: true,
    architecture: 'base-biz',
    framework: 'nestjs',
  },
};

const generatedFiles = await codeGeneratorService.generateFiles(generationRequest);
```

### Template Variable Validation

```typescript
const validation = await codeGeneratorService.validateTemplateVariables(
  'my-template-id',
  {
    entityName: 'User',
    tableName: 'users',
    generateCrud: true,
  }
);

if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}
```

### Metadata Retrieval

```typescript
// Get project metadata with caching
const projectMetadata = await metadataService.getProjectMetadata('my-project', true);

// Get entity metadata without caching
const entityMetadata = await metadataService.getEntityMetadata('user-entity', false);

// Validate entity structure
const structureValidation = await metadataService.validateEntityStructure('user-entity');
```

## Template Helpers

The system provides numerous Handlebars helpers for template development:

### String Transformation
- `{{camelCase str}}` - Convert to camelCase
- `{{pascalCase str}}` - Convert to PascalCase
- `{{kebabCase str}}` - Convert to kebab-case
- `{{snakeCase str}}` - Convert to snake_case
- `{{upperCase str}}` - Convert to UPPERCASE
- `{{lowerCase str}}` - Convert to lowercase

### Conditional Helpers
- `{{#if condition}}...{{/if}}` - Conditional rendering
- `{{#unless condition}}...{{/unless}}` - Negative conditional
- `{{#each items}}...{{/each}}` - Iteration

### Field Helpers
- `{{#isSearchable field}}...{{/isSearchable}}` - Check if field is searchable
- `{{#isRequired field}}...{{/isRequired}}` - Check if field is required
- `{{#isPrimaryKey field}}...{{/isPrimaryKey}}` - Check if field is primary key

### Type Helpers
- `{{tsType field}}` - Get TypeScript type
- `{{prismaType field}}` - Get Prisma type
- `{{validationRules field}}` - Get validation rules

## Error Handling

The system provides comprehensive error handling:

### Validation Errors
- Missing required template variables
- Invalid variable types
- Invalid entity structure
- Missing templates or entities

### Generation Errors
- Template compilation failures
- File system errors
- Database connection issues
- Invalid metadata

### Error Response Format
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface GenerationError {
  type: string;
  message: string;
  details?: any;
}
```

## Performance Optimization

### Caching Strategy
- **Metadata Caching**: Project and entity metadata cached for performance
- **Template Caching**: Compiled templates cached for reuse
- **Selective Cache Invalidation**: Granular cache invalidation

### Database Optimization
- **Efficient Queries**: Optimized database queries with proper indexing
- **Batch Operations**: Bulk operations for better performance
- **Connection Pooling**: Database connection pooling

## Testing

The system includes comprehensive test coverage:

### Unit Tests
- Service method testing
- Field categorization testing
- Template context building
- Validation logic testing

### Integration Tests
- End-to-end generation workflows
- Database integration testing
- API endpoint testing
- Error scenario testing

### Performance Tests
- Load testing for large projects
- Memory usage optimization
- Cache performance validation

## Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/lowcode

# JWT Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Cache Configuration
CACHE_TTL=3600
CACHE_MAX_SIZE=1000

# Template Configuration
TEMPLATE_CACHE_ENABLED=true
TEMPLATE_CACHE_TTL=1800
```

### Service Configuration
```typescript
// In your module
@Module({
  providers: [
    IntelligentCodeGeneratorService,
    MetadataAggregatorService,
    TemplateEngineService,
    // ... other providers
  ],
})
export class CodeGenerationModule {}
```

## Best Practices

### Template Development
1. Use semantic variable names
2. Include proper error handling
3. Validate template variables
4. Use partial templates for reusability
5. Document template variables

### Field Design
1. Use consistent naming conventions
2. Define proper field types
3. Set appropriate constraints
4. Document field purposes
5. Consider indexing requirements

### Performance
1. Enable caching for production
2. Use batch operations when possible
3. Optimize database queries
4. Monitor memory usage
5. Profile generation performance

## Troubleshooting

### Common Issues

**Template Compilation Errors**
- Check template syntax
- Verify variable names
- Ensure proper helper usage

**Metadata Loading Issues**
- Verify database connectivity
- Check entity relationships
- Validate field definitions

**Performance Issues**
- Enable caching
- Optimize database queries
- Check memory usage
- Profile slow operations

### Debug Mode
Enable debug logging for detailed information:
```bash
LOG_LEVEL=debug
```

## Contributing

When contributing to the code generation system:

1. Follow TypeScript best practices
2. Write comprehensive tests
3. Document new features
4. Update this documentation
5. Consider backward compatibility

## API Endpoints

### Code Generation

#### Generate Code
```http
POST /api/v1/code-generation/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "string",
  "templateIds": ["string"],
  "entityIds": ["string"],
  "variables": {
    "entityName": "string",
    "tableName": "string"
  },
  "options": {
    "overwriteExisting": true,
    "generateTests": false,
    "generateDocs": false,
    "architecture": "base-biz",
    "framework": "nestjs"
  }
}
```

**Response:**
```json
{
  "success": true,
  "generatedFiles": [
    {
      "filename": "user.service.ts",
      "path": "src/services/user.service.ts",
      "content": "...",
      "language": "TYPESCRIPT",
      "size": 1024
    }
  ],
  "metadata": {
    "projectId": "string",
    "templatesUsed": ["string"],
    "entitiesProcessed": ["string"],
    "generatedAt": "2024-01-01T00:00:00Z",
    "duration": 1500
  }
}
```

#### Validate Generation Request
```http
POST /api/v1/code-generation/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "string",
  "templateIds": ["string"],
  "entityIds": ["string"],
  "variables": {}
}
```

**Response:**
```json
{
  "valid": true,
  "issues": []
}
```

#### Get Generation History
```http
GET /api/v1/code-generation/history/project/{projectId}?current=1&size=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "projectId": "string",
      "templateIds": ["string"],
      "entityIds": ["string"],
      "status": "success",
      "filesGenerated": 5,
      "startTime": "2024-01-01T00:00:00Z",
      "endTime": "2024-01-01T00:00:02Z"
    }
  ],
  "total": 100,
  "current": 1,
  "size": 10
}
```

### Templates

#### Get Templates by Project
```http
GET /api/v1/templates/project/{projectId}/paginated?current=1&size=10
Authorization: Bearer <token>
```

#### Get Template by ID
```http
GET /api/v1/templates/{templateId}
Authorization: Bearer <token>
```

#### Create Template
```http
POST /api/v1/templates
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "string",
  "name": "string",
  "code": "string",
  "description": "string",
  "type": "ENTITY",
  "language": "TYPESCRIPT",
  "framework": "NESTJS",
  "category": "service",
  "content": "template content",
  "variables": [],
  "tags": ["string"],
  "version": "1.0.0"
}
```

### Entities

#### Get Entities by Project
```http
GET /api/v1/entities/project/{projectId}/paginated?current=1&size=10
Authorization: Bearer <token>
```

#### Get Entity by ID
```http
GET /api/v1/entities/{entityId}
Authorization: Bearer <token>
```

### Fields

#### Get Fields by Entity
```http
GET /api/v1/fields/entity/{entityId}
Authorization: Bearer <token>
```

## License

This enhanced code generation system is part of the Soybean Admin NestJS project.
