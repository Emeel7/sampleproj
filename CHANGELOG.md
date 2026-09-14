**# Simple Notes Backend Project**

**## [v2.0.0] - Latest**

**### Added**

- TypeScript support across the entire codebase

- Unit tests (Jest) for query parameters and request validation

**### Changed**

- Refactored project structure to support TypeScript architecture

- Redesigned Firestore model abstraction for better scalability

- Improved error handling flow for clearer and more consistent responses

**---**

**## [Unreleased]**

**### Planned**

- User routes (creation, authentication, authorization)

- Extended note interactions (likes, replies, feedback)

- Ability to connect to a logging service

**---**

## [v3.0.0] - Current

### Added

- User entity and account management
- User authentication and session management
- Session token refresh and logout functionality
- Authentication middleware
- Request parsers for validating and extracting request data
- `types` and `utils` directories
- Additional authentication and authorization errors

### Changed

- Extended the database structure to support users and user-owned notes
- Updated note routes to require authentication
- Added user-specific note access
- Expanded API routes for user and authentication operations
- Corrected test directory structure to `tests`

---

**## [v1.0.0] - Legacy**

**### Initial Release**

- JavaScript-based backend

- Core CRUD functionality for notes

See: `docs/legacy/v1.md`
