# Lowcode Designer Version History Feature - Implementation Plan

## Overview

This implementation plan provides a series of discrete, manageable coding steps to build the lowcode version history feature. Each step builds incrementally on previous steps, ensuring core functionality is validated early through tests.

---

## Phase 1: Database Schema and Seed Data

- [ ] 1. Update Prisma schema for version management
  - Add `currentVersion` field to `SysLowcodePage` model
  - Verify `SysLowcodePageVersion` model structure is correct
  - Create Prisma migration for schema changes
  - _Requirements: 5.1, 5.4_

- [ ]* 1.1 Write property test for referential integrity
  - **Feature: lowcode-version-history, Property 5: Referential Integrity**
  - **Validates: Requirements 5.5**

- [ ] 2. Create Prisma seed data for version history
  - Add seed data for sample lowcode pages with multiple versions
  - Ensure seed data includes version history for demo pages
  - Verify seed data structure matches schema
  - _Requirements: 5.2_

- [ ]* 2.1 Write example test for seed data initialization
  - **Feature: lowcode-version-history, Property 5: Referential Integrity**
  - **Validates: Requirements 5.2, 5.3**

- [ ] 3. Update Docker configuration for seed data
  - Verify docker-compose.yml includes seed data execution
  - Test Docker build and initialization
  - Validate seed data is loaded correctly in Docker environment
  - _Requirements: 5.3_

- [ ] 4. Checkpoint - Ensure all database tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 2: Backend Domain Layer

- [ ] 5. Create version number generation utility
  - Implement semantic version increment logic (1.0.0 → 1.0.1 → 1.1.0 → 2.0.0)
  - Handle version comparison and validation
  - Create utility functions for version operations
  - _Requirements: 1.2_

- [ ]* 5.1 Write property test for version monotonicity
  - **Feature: lowcode-version-history, Property 1: Version Number Monotonicity**
  - **Validates: Requirements 1.2**

- [ ] 6. Create LowcodePageVersion domain entity
  - Define LowcodePageVersion class with validation
  - Implement immutability for schema and changelog fields
  - Add methods for version comparison and metadata
  - _Requirements: 1.1, 1.3, 1.4_

- [ ]* 6.1 Write property test for version immutability
  - **Feature: lowcode-version-history, Property 2: Version Immutability**
  - **Validates: Requirements 1.1, 1.4**

- [ ]* 6.2 Write property test for creator tracking
  - **Feature: lowcode-version-history, Property 7: Creator Tracking**
  - **Validates: Requirements 1.3**

- [ ] 7. Create version repository interface and implementation
  - Define `ILowcodePageVersionRepository` interface
  - Implement Prisma-based repository with CRUD operations
  - Add methods: create, findById, findByPageId, findLatestVersion
  - _Requirements: 2.1, 2.2, 2.5_

- [ ]* 7.1 Write property test for version retrieval completeness
  - **Feature: lowcode-version-history, Property 4: Version Retrieval Completeness**
  - **Validates: Requirements 2.1, 2.2**

- [ ] 8. Create version service for business logic
  - Implement version creation with auto-increment
  - Implement rollback logic with new version creation
  - Add changelog generation for rollback operations
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3_

- [ ]* 8.1 Write property test for rollback creates new version
  - **Feature: lowcode-version-history, Property 3: Rollback Creates New Version**
  - **Validates: Requirements 3.2**

- [ ]* 8.2 Write property test for rollback state consistency
  - **Feature: lowcode-version-history, Property 8: Rollback State Consistency**
  - **Validates: Requirements 3.1**

- [ ] 9. Checkpoint - Ensure all domain layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 3: Backend CQRS Layer

- [ ] 10. Create version-related commands
  - Implement `LowcodePageVersionCreateCommand`
  - Implement `LowcodePageVersionRollbackCommand`
  - Add command handlers with validation
  - _Requirements: 1.1, 3.1, 3.2_

- [ ] 11. Create version-related queries
  - Implement `GetLowcodePageVersionsQuery` with pagination
  - Implement `GetLowcodePageVersionByIdQuery`
  - Implement `CompareVersionsQuery` for version comparison
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 11.1 Write property test for version uniqueness per page
  - **Feature: lowcode-version-history, Property 6: Version Uniqueness Per Page**
  - **Validates: Requirements 1.2, 5.1**

- [ ] 12. Update existing page commands to create versions
  - Modify `LowcodePageUpdateCommand` to auto-create versions
  - Ensure version creation on every page save
  - Add changelog parameter to update command
  - _Requirements: 1.1, 1.4_

- [ ] 13. Checkpoint - Ensure all CQRS tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 4: Backend API Layer

- [ ] 14. Create version DTOs and response models
  - Define `VersionResponseDto` with all required fields
  - Define `VersionListResponse` with pagination
  - Define `ComparisonResultDto` for version comparison
  - _Requirements: 2.2, 4.4_

- [ ] 15. Extend LowcodePageController with version endpoints
  - Implement `GET /lowcode/pages/:id/versions` endpoint
  - Implement `POST /lowcode/pages/:id/versions` endpoint
  - Implement `GET /lowcode/pages/:id/versions/:versionId` endpoint
  - Implement `POST /lowcode/pages/:id/versions/:versionId/rollback` endpoint
  - Implement `GET /lowcode/pages/:id/versions/compare` endpoint
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ]* 15.1 Write property test for API version list response
  - **Feature: lowcode-version-history, Property 4: Version Retrieval Completeness**
  - **Validates: Requirements 7.1**

- [ ] 16. Add authentication and authorization checks
  - Verify JWT token on all version endpoints
  - Check user permissions for version operations
  - Add error handling for unauthorized access
  - _Requirements: 7.5_

- [ ]* 16.1 Write example test for authentication validation
  - **Feature: lowcode-version-history, Property 7: API Endpoints**
  - **Validates: Requirements 7.5**

- [ ] 17. Checkpoint - Ensure all API tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 5: Frontend Designer Integration

- [ ] 18. Update designer version panel component
  - Modify `plugin-left-versions-manage/plugin.tsx` to use new API
  - Update version list display with new data structure
  - Add version details display with changelog
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 19. Implement designer rollback functionality
  - Add rollback button to version list items
  - Implement rollback confirmation dialog
  - Update designer schema on successful rollback
  - _Requirements: 6.4, 6.5_

- [ ] 20. Update designer save handler
  - Modify save handler to include changelog input
  - Ensure version is created on every save
  - Display version creation feedback to user
  - _Requirements: 1.1, 1.4_

- [ ] 21. Checkpoint - Ensure designer version features work
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 6: Frontend Admin Panel

- [ ] 22. Create version management page structure
  - Create new page component at `frontend/src/views/lowcode-version-management/`
  - Set up page layout with version list and details sections
  - Add routing for version management page
  - _Requirements: 4.1_

- [ ] 23. Implement version list display
  - Create version list table component
  - Display version number, creation date, creator, changelog
  - Add pagination controls
  - _Requirements: 4.1, 4.2_

- [ ] 24. Implement version details viewer
  - Create read-only schema editor component
  - Display full version information
  - Add copy-to-clipboard functionality for schema
  - _Requirements: 4.3_

- [ ] 25. Implement version comparison interface
  - Create version comparison component
  - Display side-by-side schema comparison
  - Highlight differences between versions
  - _Requirements: 4.4_

- [ ]* 25.1 Write property test for version comparison logic
  - **Feature: lowcode-version-history, Property 4: Version Comparison**
  - **Validates: Requirements 4.4**

- [ ] 26. Implement rollback functionality in admin panel
  - Add rollback button to version list
  - Implement rollback confirmation dialog
  - Display rollback success/error messages
  - _Requirements: 4.5, 3.1, 3.2_

- [ ] 27. Add version filtering and search
  - Implement version number filter
  - Implement date range filter
  - Implement creator filter
  - _Requirements: 2.3, 2.4_

- [ ] 28. Checkpoint - Ensure admin panel version features work
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 7: Integration and Validation

- [ ] 29. End-to-end test: Designer save and version creation
  - Test saving page in designer creates new version
  - Verify version number increments correctly
  - Verify version history is accessible
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 30. End-to-end test: Designer rollback
  - Test rollback from designer version panel
  - Verify page schema is restored correctly
  - Verify new version is created for rollback
  - _Requirements: 3.1, 3.2, 6.4_

- [ ] 31. End-to-end test: Admin panel version management
  - Test viewing version list in admin panel
  - Test viewing version details
  - Test comparing versions
  - Test rollback from admin panel
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 32. End-to-end test: API endpoints
  - Test all version API endpoints
  - Verify pagination works correctly
  - Verify filtering works correctly
  - Verify error handling
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 33. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Optional tasks (marked with `*`) focus on testing and can be skipped for MVP
- Each checkpoint ensures core functionality is working before proceeding
- Property-based tests should run minimum 100 iterations
- All tests should be co-located with source files using `.test.ts` suffix
- Docker environment should be tested after seed data implementation

