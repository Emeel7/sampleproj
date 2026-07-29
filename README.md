# Simple Notes Backend Project

A RESTful backend for managing notes using Node.js, Express, and Firestore

This project also serves as a base for easy setup of other backend projects

You can access the live application here:

https://notes-react-app-seven.vercel.app/

---

## Table of Contents

1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Folder Structure](#folder-structure)
5. [Installation](#installation)
6. [Configuring Environment Variables](#configuring-environment-variables)
7. [Usage](#usage)
10. [Error Handling](#error-handling)
11. [Deployment](#deployment)
12. [Contributing](#contributing)
13. [License](#license)
14. [References](#references)

---

## Overview

The overview of the backend is pretty simple. It's goal is to store notes which are of the following structure:

**Entity: `Note`**

| Field     | Type      | Required | Description                |
| --------- | --------- | -------- | -------------------------- |
| id        | string    | Yes      | Unique identifier          |
| title     | string    | Yes      | Short title of the note    |
| content   | string    | Yes      | Main note body             |
| createdAt | timestamp | Yes      | Time note was created      |
| updatedAt | timestamp | Yes      | Time note was last updated |

---

## API Endpoints

| Method | Route | Description | Body / Params |
| ------ | ----- | ----------- | ------------- |
| GET    | /notes     | Fetch notes in a batch | Query params: `startDocId` (optional), `limit` (optional, default 2), `order` (optional, default `asc`) |
| POST   | /notes     | Create a new note | `title` (non-empty string), `content` (non-empty string) |
| GET    | /notes/:id | Get a note by ID | `id` |
| PATCH    | /notes/:id | Update note by ID | `id` + note body |
| DELETE | /notes/:id | Delete note by ID | |

--- 

## Features

- CRUD Notes
- Firebase Firestore Integration
- Structured Logging (For Development; see *********)
- Pagination Support

---

## Tech Stack

- Node.js (ESM / Nodenext )
- Express.js
- Typescript
- Firebase (Firestore)
- tsx (dev runtime)
- Vercel (serverless deployment)
- Other libraries/tools as needed

---

## Folder Structure

```
project-root/
├─ docs/
├─ logs/ (runtime)
├─ dist/ (runtime: build output)
├─ src/
│ ├─ __test__/
│ ├─ config/
│ ├─ controllers/
│ ├─ logs/
│ ├─ middleware/
│ ├─ models/
│ ├─ resources/
│ ├─ routes/
│ └─ server.ts
├─ .gitignore
├─ jest.config.js
├─ package.json
├─ package-lock.json
├─ tsconfig.json
├─ README.md
└─ CHANGELOG.md


```

---

## Installation

```bash
# Clone the repo
git clone "https://github.com/BrianKamauKahara/SimpleProjectBackend"

# Navigate to project
cd <project-folder>

# Install dependencies
npm install

```

## Configuring Environment Variables

Environment Variables: Firebase Credentials (FIREBASE_CRED) and Preferred port number (PORT, default 5000) 

Setting Firebase Credentials
You will only need your own firebase credentials as the environment variable.
To accomplish this, follow the steps below:
1. Go to the [firebase website](https://firebase.google.com/products/firestore) and create your own firestore project
2. Download your credentials JSON file
3. Stringify the credential file using JSON.stringify and store the result in the .env. Make sure to remove the quotation marks

```bash
PORT=<preferred_port_number>
FIREBASE_CRED=<parsed_json_credential>
```

---

## Usage

This is how you will run the project locally

```bash
# Run server locally
npm start

# Or with hot reload
npm run dev

```


## Middleware

- **Database Connector (dbConn.js)**: ensures Firestore is connected  
- **EventLogger**: logs all incoming requests  
- **ErrorLogger**: catches, logs and responds with structured error messages


## Error Handling

Errors from the bad requests, invalid requests, internal and other are formatted as follows:

```json

"error": {
  "name": "Name of the error that occurred",
  "message": "Description of error",
  "code": "Error code. Check example codes below"
}

```

There are four main types of errors, as indicated in the following table

| Error | Code | Message / Meaning | 
| ----- | ---- | ----------------- | 
| DocumentNotFoundError | 404 | Document of a certain ID has not been found / does not exist | 
| BadRequestError | 400 | Request Body / Query / Parameters of invalid type | 
| ValidationError | 400 | Document structure is invalid | 
| InternalServerError | 500 | Something went wrong internally, e.g. failed to connect to firestore | 


---


## Deployment

If you wish to also deploy on vercel, I would recommend:

1. Push repo to GitHub  
2. Connect GitHub repo to Vercel  
3. Configure environment variables in Vercel dashboard  
4. Deploy → check serverless logs for any issues

I have worked to fix the issues that happen during deployment. If you face any feel free to contact me


## Contributing

I'd be happy to see your contributions. If you wish to contribute:

- Fork the repository and create a new branch for your feature or bug fix.  
- Make your changes and test them locally.  
- Submit a Pull Request describing what you changed and why.  
- For bugs or feature requests, open an Issue with a clear description.  

## Legacy (v1)
See: `legacy/v1.md`

## Changelog
See: `CHANGELOG.md`

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


## References

- [Firebase Docs](https://firebase.google.com/docs)  
- [Express Docs](https://expressjs.com)  
- [Vercel Docs](https://vercel.com/docs)
