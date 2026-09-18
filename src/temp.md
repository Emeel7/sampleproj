## API Endpoints

### Authentication — `/auth`

| Method | Route                   | Description                                         |
| ------ | ----------------------- | --------------------------------------------------- |
| `POST` | `/auth/register`        | Register a new account                              |
| `POST` | `/auth/login`           | Authenticate a user and establish a session         |
| `POST` | `/auth/refresh`         | Refresh the current session token                   |
| `POST` | `/auth/logout`          | Log out the current user and invalidate the session |
| `POST` | `/auth/update-password` | Update the authenticated user's password            |

### Users — `/users`

| Method   | Route        | Authentication | Description                       |
| -------- | ------------ | -------------- | --------------------------------- |
| `GET`    | `/users`     | Not required   | Retrieve all users                |
| `GET`    | `/users/:id` | Required       | Retrieve a user by ID             |
| `PATCH`  | `/users/:id` | Required       | Update a user's username or email |
| `DELETE` | `/users/:id` | Required       | Delete an account                 |

### Notes — `/notes`

All note routes require authentication. Notes are associated with the authenticated user.

| Method   | Route        | Description                                            |
| -------- | ------------ | ------------------------------------------------------ |
| `GET`    | `/notes`     | Retrieve all notes belonging to the authenticated user |
| `POST`   | `/notes`     | Create a new note                                      |
| `GET`    | `/notes/:id` | Retrieve a specific note belonging to the user         |
| `PATCH`  | `/notes/:id` | Update a specific note                                 |
| `DELETE` | `/notes/:id` | Delete a specific note                                 |

Add the following, concerning the shapes of data sent to and expected from routes:
/auth
(POST) /register
required:{ username: ZodString;
email: ZodEmail;
password: ZodString;}
expect: {
username: string;
email: string;
userId: string;
}
status:204
need not send a sessionToken cookie / be authorized
you will receive cookie with the sessionToken

(POST) /login,
required: {
identifier: ZodString;
password: ZodString;
}
and you need not to be authorized
receive: only the cookie - new session token
(POST) /refresh,
required: authenticated request. No body, just sessiontoken in cookie
get: new sT, status 204

(POST) /update-password
required: {
oldPass: ZodString;
newPass: ZodString;
}
authorized (sessionToken cookie)
get: cookie, status 204

(POST) /logout
required: authenticated request
get: clears cookie, only status (204)

/users
default user output: {
username: string;
email: string;
id: string;
createdAt: FirebaseFirestore.Timestamp;
updatedAt: FirebaseFirestore.Timestamp;
}

(GET) /
query params: findAllQueryConfig = {
startDocId?: string;
limit?: number;
order?: "asc" | "desc";
}
gets: users[] 200

all the following requests must be authenticated from now on, including the notes ones

(GET) /:id
expects: userId in params
gets: user 200

(PATCH) /:id
expects: userId in params, {email:string} or {username:string}
gets: { success: true, message: `User ${field} updated successfully` }, 200

(DELETE) /:id
expects: userId in params, {
password: string
}
gets: 204, clears cookie, {
success: true;
}

/notes
Note: {
title: ZodString;
content: ZodString;
userId: ZodString;
}

(GET) /
query params: findAllQueryConfig = {
startDocId?: string;
limit?: number;
order?: "asc" | "desc";
}
get: 200 Note[]

(POST) /
expect: {
title: string,
content:string
}
get: 201 Note

(GET) /:id
expect: id in req.params
get: 200 Note[]

(PATCH) /:id
expect: id in req.params
get: 200 Note

(DELETE) /:id
expect: id in req.params
get: 204 nothing
