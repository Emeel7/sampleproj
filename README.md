# Simple Notes Backend Project

A RESTful backend for managing user accounts and notes using Node.js, Express, TypeScript, and Firebase Firestore.

This project also serves as a foundation for setting up other backend projects with structured routing, validation, error handling, authentication, and session management.

---

## Table of Contents

1. [Overview](#overview)
2. [Database Structure](#database-structure)
3. [API Endpoints](#api-endpoints)
4. [Features](#features)
5. [Tech Stack](#tech-stack)
6. [Folder Structure](#folder-structure)
7. [Installation](#installation)
8. [Configuring Environment Variables](#configuring-environment-variables)
9. [Usage](#usage)
10. [Middleware](#middleware)
11. [Error Handling](#error-handling)
12. [Deployment](#deployment)
13. [Contributing](#contributing)
14. [License](#license)
15. [References](#references)

---

## Overview

Version 3 introduces user accounts and basic session management alongside the existing note-management functionality.

The backend consists of two primary entities:

- `User` — represents an account and its authentication information.
- `Note` — represents a note belonging to a specific user.

Authenticated requests are associated with a user through session-based authentication.

---

## Database Structure

### Entity: `Note`

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Unique identifier for the note |
| `userId` | string | Identifier of the user who owns the note |
| `title` | string | Title of the note |
| `content` | string | Main body of the note |
| `createdAt` | timestamp | Time at which the note was created |
| `updatedAt` | timestamp | Time at which the note was last updated |

### Entity: `User`

| Field | Type | Description |
| --- | --- | --- |
| `username` | string | Unique username associated with the account |
| `email` | string | Email address associated with the account |
| `auth.password` | string | Password-related authentication data |
| `auth.sessionToken` | string | Token used for session authentication |

The `auth` field groups authentication-related information:

```text
auth
├─ password
└─ sessionToken
```

---

## API Endpoints

### Authentication — `/auth`

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Register a new account |
| `POST` | `/auth/login` | Authenticate a user and establish a session |
| `POST` | `/auth/refresh` | Refresh the current session token |
| `POST` | `/auth/logout` | Log out the current user and invalidate the session |
| `POST` | `/auth/update-password` | Update the authenticated user's password |

### Users — `/users`

| Method | Route | Authentication | Description |
| --- | --- | --- | --- |
| `GET` | `/users` | Not required | Retrieve all users |
| `GET` | `/users/:id` | Required | Retrieve a user by ID |
| `PATCH` | `/users/:id` | Required | Update a user's username or email |
| `DELETE` | `/users/:id` | Required | Delete an account |

### Notes — `/notes`

All note routes require authentication. Notes are associated with the authenticated user.

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/notes` | Retrieve all notes belonging to the authenticated user |
| `POST` | `/notes` | Create a new note |
| `GET` | `/notes/:id` | Retrieve a specific note belonging to the user |
| `PATCH` | `/notes/:id` | Update a specific note |
| `DELETE` | `/notes/:id` | Delete a specific note |

---

## Features

### User Features

- Account creation
- User login
- User logout
- Session management
- Session token refresh
- Password updates
- Username and email updates
- Account deletion

### Note Features

- Create notes
- Retrieve notes belonging to a user
- Retrieve individual notes
- Update notes
- Delete notes

### Other Features

- Structured logging
- Request validation and parsing
- Authentication middleware
- Structured error handling
- Firebase Firestore integration

---

## Tech Stack

- Node.js
- Express.js
- TypeScript
- Firebase Firestore
- `tsx`
- Vercel
- Other libraries and tools as required

The project uses Node.js ESM / NodeNext module configuration.

---

## Folder Structure

```text
project-root/
├─ docs/
├─ logs/ (runtime)
├─ dist/ (runtime: build output)
├─ src/
│  ├─ tests/
│  ├─ config/
│  ├─ controllers/
│  │  └─ parsers/
│  ├─ logs/
│  ├─ middleware/
│  │  └─ authenticate.ts
│  ├─ models/
│  ├─ resources/
│  ├─ routes/
│  ├─ types/
│  ├─ utils/
│  └─ server.ts
├─ .gitignore
├─ jest.config.js
├─ package.json
├─ package-lock.json
├─ tsconfig.json
├─ README.md
└─ CHANGELOG.md
```

### Notable Directories

**`controllers/parsers/`**

Contains parsers responsible for schema-validating incoming request data, including:

- `req.params`
- `req.query`
- `req.body`

These parsers extract the required data or throw an appropriate error when the supplied data is invalid.

**`middleware/authenticate.ts`**

Provides session authentication by validating the user's session token and associating the authenticated user with the request.

**`types/`**

Contains TypeScript type definitions used throughout the application.

**`utils/`**

Contains reusable utility functions used by different parts of the backend.

**`tests/`**

Contains automated tests for the application.

---

## Installation

```bash
# Clone the repository
git clone "https://github.com/BrianKamauKahara/SimpleProjectBackend"

# Navigate to the project
cd <project-folder>

# Install dependencies
npm install
```

---

## Configuring Environment Variables

The environment configuration remains unchanged from the previous version.

The backend requires Firebase credentials and an optional preferred port number.

```bash
PORT=<preferred_port_number>
FIREBASE_CRED=<parsed_json_credential>
```

### Setting Firebase Credentials

1. Create a Firestore project through Firebase.
2. Download the project's credentials JSON file.
3. Parse the credentials using `JSON.stringify`.
4. Store the resulting value in the `.env` file as `FIREBASE_CRED`.
5. Remove the surrounding quotation marks from the stored value.

---

## Usage

Run the project locally using:

```bash
# Run the server locally
npm start

# Or run with hot reload
npm run dev
```

---

## Middleware

The backend uses middleware for database connectivity, logging, error handling, and authentication.

- **Database Connector (`dbConn`)** — ensures that a connection to Firestore is available.
- **EventLogger** — records incoming requests.
- **ErrorLogger** — catches, logs, and responds to errors using structured error messages.
- **Authentication Middleware (`authenticate.ts`)** — authenticates user sessions and provides the authenticated user to protected routes.

Protected user and note operations require successful authentication before the corresponding controller is executed.

---

## Error Handling

Errors are returned using a structured format:

```json
{
  "error": {
    "name": "Name of the error that occurred",
    "message": "Description of the error",
    "code": "Error code"
  }
}
```

The primary application errors include:

| Error | Code | Meaning |
| --- | ---: | --- |
| `BadRequestError` | 400 | The request contains invalid parameters, query data, or body data |
| `ValidationError` | 400 | The supplied data does not satisfy the required schema |
| `AuthenticationError` | 401 | Authentication failed, such as when an incorrect password is supplied |
| `ForbiddenError` | 403 | The authenticated user is not authorized to access the requested resource |
| `DocumentNotFoundError` | 404 | A document with the specified identifier does not exist |
| `ConflictError` | 409 | A request conflicts with an existing resource, such as attempting to use an already-existing username |
| `InternalServerError` | 500 | An unexpected internal error occurred, such as a failure to connect to Firestore |

---

## Deployment

The project can be deployed to Vercel.

Recommended deployment procedure:

1. Push the repository to GitHub.
2. Connect the repository to Vercel.
3. Configure the required environment variables in the Vercel dashboard.
4. Deploy the project.
5. Review the serverless logs for deployment or runtime errors.

---

## Contributing

Contributions are welcome.

To contribute:

- Fork the repository and create a new branch for your feature or bug fix.
- Make the required changes and test them locally.
- Submit a Pull Request describing what was changed and why.
- For bugs or feature requests, open an Issue with a clear description.

---

## License

MIT License

Copyright (c) 2026 Emerald

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## References

- [Firebase Documentation](https://firebase.google.com/docs)
- [Express Documentation](https://expressjs.com)
- [Vercel Documentation](https://vercel.com/docs)