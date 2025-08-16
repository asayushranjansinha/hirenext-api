# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]
### Added
- Description of new features added but not yet released.

### Changed
- Description of changes to existing functionality.

### Fixed
- Description of bug fixes.

### Removed
- Description of removed features or code.

---

## [0.2.0] - 2025-08-16
### Added
- Job module with services, controllers, and utilities for job management.
- Company module with services, controllers, and utilities for company management.
- Redis cache tagging for jobs and companies to support efficient cache invalidation.
- `COMPANY_ALL` tag to invalidate both company details and its related jobs in one go.
- Tag-based caching in `findById` (job service) to link job details to the parent company for automatic invalidation.
- Unified cache tagging constants across company and job services for consistency.
- Updated `findById` in job service to store job details with both global jobs tag and company-specific tag.

### Fixed
- Redis caching in job service now correctly associates cache entries with their company, ensuring stale job data is cleared when a company is deleted.

---

## [0.1.0] - 2025-08-14
### Added
- Initial project setup.
- User module with `/user/me` route.
- Redis caching utility `getOrSetCache`.


### Fixed
- Bug in `getOrSetCache` that returned `null` on the first call.

### Changed
- Any modifications to existing functionality (optional).

### Removed
- Any removed features (optional).

---

## [Previous Version] - YYYY-MM-DD
- Add previous versions here if applicable.
