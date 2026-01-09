# Changelog

All notable changes to the HIMS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive deployment guide in `docs/deployment/DEPLOYMENT.md`
- New deployment helper script `deploy-helper.sh` with commands: setup, deploy, rollback, status, logs
- Redis-based distributed rate limiting with automatic fallback to in-memory
- Request ID tracing for error correlation and debugging
- Structured logging with JSON format in production
- Input sanitization and validation utilities
- Request size validation (10MB limit)
- Email format validation
- Enhanced GitHub Actions CI/CD with:
  - Separate build and deploy jobs
  - Retry logic (3 attempts with backoff)
  - Health check monitoring
  - Better error messaging
  - Build artifact caching

### Changed
- **BREAKING**: Removed 23 redundant deployment scripts
- **BREAKING**: Removed 10 duplicate deployment documentation files
- Enhanced error handling with better categorization and context
- Improved API middleware with request tracking and validation
- Reorganized documentation structure:
  - Moved security docs to `docs/security/`
  - Moved guides to `docs/guides/`
  - Moved reference docs to `docs/reference/`
  - Consolidated deployment docs in `docs/deployment/`
- Updated README with streamlined deployment instructions
- Enhanced `.gitignore` with better coverage

### Removed
- Removed unused `jspdf` package (security vulnerability CVE-2024-XXXX)
- Removed 23 redundant deployment scripts:
  - DEPLOY_*.sh variants (8 scripts)
  - deploy-*.sh variants (8 scripts)
  - setup-*.sh variants (3 scripts)
  - Various helper scripts (4 scripts)
- Removed 10 duplicate deployment documentation files
- Removed obsolete text files and manifests

### Fixed
- Fixed TypeScript compilation issues in API middleware
- Fixed potential XSS vulnerabilities through input sanitization
- Fixed missing session checks (already secured in previous updates)

### Security
- Removed vulnerable jspdf package
- Added comprehensive input sanitization
- Implemented request size limits
- Enhanced rate limiting with distributed support
- Added security audit documentation

## [0.1.0] - 2025-12-21

### Initial Release
- Complete maritime crew management system
- Role-based access control (6 roles)
- AES-256-GCM encryption for sensitive data
- External compliance integration (KOSMA, Dephub, Schengen Visa NL)
- Dashboard with real-time widgets
- Comprehensive modules: Crewing, HR, Accounting, Quality/ISO
- Docker deployment support
- PostgreSQL database with Prisma ORM
- NextAuth.js authentication

---

## Categories

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

## Links

- [Documentation](docs/)
- [Deployment Guide](docs/deployment/DEPLOYMENT.md)
- [Security Audit](docs/security/)
