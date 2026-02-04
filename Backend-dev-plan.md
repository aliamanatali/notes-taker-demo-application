# Backend Development Plan

## Star Wars Notes App ("Galactic Archives")

# 1) Executive Summary

Building a FastAPI backend to replace localStorage functionality for a Star Wars-themed notes application. The frontend currently manages "Holocrons" (notes) with basic CRUD operations, search, and Star Wars theming. Backend will provide persistent storage via MongoDB Atlas, user authentication, and RESTful API endpoints.

Constraints honored: FastAPI with Python 3.12, MongoDB Atlas with Motor and Pydantic v2, no Docker, frontend-driven manual testing, single `main` branch workflow.

Sprint count: 4 sprints (S0-S3) to cover environment setup, authentication, core note operations, and search functionality.

# 2) In-scope & Success Criteria

**In-scope:**

- User registration and authentication with JWT tokens
- CRUD operations for notes (Holocrons)
- Search functionality across note title and content
- MongoDB Atlas integration for data persistence
- CORS configuration for frontend integration
- Health check endpoint with database connectivity

**Success criteria:**

- All frontend features work with backend API instead of localStorage
- Users can register, login, and manage their personal notes
- Search works across all user notes
- Each sprint passes manual tests via the UI
- Push to `main` after successful testing

# 3) API Design

**Conventions:**

- Base path: `/api/v1`
- JWT authentication for protected endpoints
- Consistent JSON error responses: `{"error": "message", "detail": "optional_detail"}`
- ISO 8601 datetime format for timestamps

**Endpoints:**

**Health & Status:**

- `GET /healthz` - Health check with DB connectivity status

**Authentication:**

- `POST /api/v1/auth/register` - User registration
  - Request: `{"email": "string", "password": "string"}`
  - Response: `{"message": "User created successfully"}`
- `POST /api/v1/auth/login` - User login
  - Request: `{"email": "string", "password": "string"}`
  - Response: `{"access_token": "jwt_token", "token_type": "bearer"}`
- `GET /api/v1/auth/me` - Get current user info
  - Response: `{"id": "string", "email": "string", "created_at": "datetime"}`

**Notes (Holocrons):**

- `GET /api/v1/notes` - Get all user notes
  - Query params: `search` (optional) - search in title and content
  - Response: `[{"id": "string", "title": "string", "content": "string", "created_at": "datetime", "updated_at": "datetime"}]`
- `POST /api/v1/notes` - Create new note
  - Request: `{"title": "string", "content": "string"}`
  - Response: `{"id": "string", "title": "string", "content": "string", "created_at": "datetime", "updated_at": "datetime"}`
- `GET /api/v1/notes/{note_id}` - Get specific note
  - Response: `{"id": "string", "title": "string", "content": "string", "created_at": "datetime", "updated_at": "datetime"}`
- `PUT /api/v1/notes/{note_id}` - Update note
  - Request: `{"title": "string", "content": "string"}`
  - Response: `{"id": "string", "title": "string", "content": "string", "created_at": "datetime", "updated_at": "datetime"}`
- `DELETE /api/v1/notes/{note_id}` - Delete note
  - Response: `{"message": "Note deleted successfully"}`

**Key validation:**

- Email format validation for registration/login
- Password minimum 6 characters
- Note title and content cannot both be empty
- User can only access their own notes

# 4) Data Model (MongoDB Atlas)

**Collections:**

**users:**

- `_id`: ObjectId (MongoDB default)
- `email`: string, required, unique, indexed
- `password_hash`: string, required (Argon2 hashed)
- `created_at`: datetime, required
- `updated_at`: datetime, required

Example document:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "jedi@rebellion.com",
  "password_hash": "$argon2id$v=19$m=65536,t=3,p=4$...",
  "created_at": "2025-09-25T08:45:00Z",
  "updated_at": "2025-09-25T08:45:00Z"
}
```

**notes:**

- `_id`: ObjectId (MongoDB default)
- `user_id`: ObjectId, required, indexed, references users.\_id
- `title`: string, required
- `content`: string, required
- `created_at`: datetime, required
- `updated_at`: datetime, required

Example document:

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "user_id": "507f1f77bcf86cd799439011",
  "title": "Jedi Training Notes",
  "content": "Remember to trust in the Force...",
  "created_at": "2025-09-25T08:45:00Z",
  "updated_at": "2025-09-25T08:45:00Z"
}
```

# 5) Frontend Audit & Feature Map

**Routes/Components observed:**

- **Index.tsx** (main route `/`): Main application page with note management

  - Purpose: Display all notes, handle CRUD operations, search functionality
  - Backend capability: `GET /api/v1/notes`, `POST /api/v1/notes`, `PUT /api/v1/notes/{id}`, `DELETE /api/v1/notes/{id}`
  - Auth requirement: Yes (all note operations)

- **NoteEditor.tsx**: Create/edit note form

  - Purpose: Form for creating new notes or editing existing ones
  - Backend capability: `POST /api/v1/notes`, `PUT /api/v1/notes/{id}`
  - Auth requirement: Yes

- **NoteCard.tsx**: Individual note display

  - Purpose: Display note summary with edit/delete actions
  - Backend capability: `PUT /api/v1/notes/{id}`, `DELETE /api/v1/notes/{id}`
  - Auth requirement: Yes

- **SearchBar.tsx**: Search input component

  - Purpose: Filter notes by title/content
  - Backend capability: `GET /api/v1/notes?search=term`
  - Auth requirement: Yes

- **EmptyState.tsx**: No notes placeholder
  - Purpose: Encourage first note creation
  - Backend capability: `POST /api/v1/notes`
  - Auth requirement: Yes

**Current frontend features needing backend support:**

- Note CRUD operations (currently using localStorage)
- Search across notes (currently client-side filtering)
- Auto-save functionality (needs real-time API calls)
- User session management (needs authentication)

# 6) Configuration & ENV Vars (core only)

- `APP_ENV` - environment name (development)
- `PORT` - HTTP port (8000)
- `MONGODB_URI` - Atlas connection string (user will provide)
- `JWT_SECRET` - token signing secret (generate random 32-char string)
- `JWT_EXPIRES_IN` - access token lifetime in seconds (86400 = 24 hours)
- `CORS_ORIGINS` - allowed origins (http://localhost:5173 for Vite dev server)

# 7) Testing Strategy (Manual via Frontend)

**Policy:** Validate all functionality through the frontend UI by navigating screens, submitting forms, and observing Network tab in DevTools for API calls.

**Per-sprint approach:**

- Complete backend implementation for sprint features
- Start frontend development server
- Test all user flows through the UI
- Verify API responses in Network tab
- If tests pass: commit and push to `main`
- If tests fail: fix issues and retest before pushing

# 8) Dynamic Sprint Plan & Backlog (S0-S3)

## S0 - Environment Setup & Frontend Connection

**Objectives:**

- Create FastAPI skeleton with `/api/v1` base and `/healthz` endpoint
- Set up MongoDB Atlas connection with Motor
- Implement health check with DB connectivity test
- Enable CORS for frontend origin
- Initialize Git repository and GitHub setup
- Wire frontend to backend (replace localStorage calls)

**User Stories:**

- As a developer, I need a working FastAPI server so I can build the API
- As a developer, I need database connectivity so I can store data
- As a user, I want the app to connect to a real backend instead of localStorage

**Tasks:**

- Install FastAPI, Motor, Pydantic v2, python-jose, passlib[argon2]
- Create main.py with FastAPI app and CORS middleware
- Implement `/healthz` endpoint with MongoDB ping test
- Set up MongoDB Atlas connection using Motor
- Create basic project structure (routers, models, database)
- Initialize Git: `git init`, create `.gitignore`, first commit
- Create GitHub repository, set `main` as default branch, initial push
- Update frontend API calls to use backend endpoints

**Definition of Done:**

- Backend runs on localhost:8000
- `/healthz` responds with 200 and shows DB connectivity status
- Frontend can call backend endpoints successfully
- Repository exists on GitHub with `main` branch
- CORS allows frontend origin

**Manual Test Checklist (Frontend):**

- Set `MONGODB_URI` environment variable
- Start backend server: `python main.py`
- Start frontend: `npm run dev`
- Open browser to frontend URL
- Check browser Network tab shows successful call to `/healthz`
- Verify health check response includes database status

**User Test Prompt:**

```
1. Open the Star Wars Notes app in your browser
2. Open Developer Tools → Network tab
3. Refresh the page
4. Look for a call to `/healthz` - it should return status 200
5. The response should show database connectivity is working
```

**Post-sprint:**

- Commit all changes: `git add . && git commit -m "S0: Environment setup and health check"`
- Push to main: `git push origin main`

## S1 - Basic Auth (signup, login, logout)

**Objectives:**

- Implement user registration and login endpoints
- Add JWT token generation and validation
- Create authentication middleware for protected routes
- Update frontend to handle authentication flow
- Protect at least one route to verify auth works

**User Stories:**

- As a user, I want to create an account so I can save my notes securely
- As a user, I want to log in so I can access my personal notes
- As a user, I want my notes to be private and secure

**Endpoints:**

- `POST /api/v1/auth/register` - User registration with email/password
- `POST /api/v1/auth/login` - User login returning JWT token
- `GET /api/v1/auth/me` - Get current user information

**Tasks:**

- Create User Pydantic model and MongoDB collection
- Implement password hashing with Argon2
- Create JWT token generation and validation utilities
- Build authentication router with register/login endpoints
- Add authentication dependency for protected routes
- Create middleware to extract and validate JWT tokens
- Update frontend to handle login/register forms
- Add token storage and API request authentication
- Protect `/api/v1/auth/me` endpoint as test

**Definition of Done:**

- Users can register new accounts via frontend
- Users can log in and receive JWT tokens
- Protected endpoints require valid authentication
- Frontend stores and uses JWT tokens for API calls
- Authentication errors are handled gracefully

**Manual Test Checklist (Frontend):**

- Create registration form in frontend (temporary or permanent)
- Register a new user account
- Log in with the created account
- Verify JWT token is stored (check localStorage/sessionStorage)
- Access a protected endpoint and verify it works
- Try accessing protected endpoint without token (should fail)
- Log out and verify token is cleared

**User Test Prompt:**

```
1. Open the app and create a new account with email/password
2. Log in with your credentials
3. Verify you can access the main notes interface
4. Open Developer Tools → Application → Local Storage
5. Confirm you see an authentication token stored
6. Refresh the page - you should remain logged in
```

**Post-sprint:**

- Commit changes: `git add . && git commit -m "S1: User authentication with JWT"`
- Push to main: `git push origin main`

## S2 - Core Note Operations (CRUD)

**Objectives:**

- Implement full CRUD operations for notes
- Connect frontend note management to backend API
- Replace all localStorage functionality with API calls
- Ensure notes are user-specific and secure

**User Stories:**

- As a user, I want to create new Holocrons so I can record my thoughts
- As a user, I want to edit my existing Holocrons so I can update information
- As a user, I want to delete Holocrons I no longer need
- As a user, I want to view all my Holocrons in one place

**Endpoints:**

- `GET /api/v1/notes` - Get all user notes
- `POST /api/v1/notes` - Create new note
- `GET /api/v1/notes/{note_id}` - Get specific note
- `PUT /api/v1/notes/{note_id}` - Update note
- `DELETE /api/v1/notes/{note_id}` - Delete note

**Tasks:**

- Create Note Pydantic models for requests/responses
- Implement notes router with all CRUD endpoints
- Add user_id filtering to ensure note privacy
- Handle note ownership validation
- Update frontend to use API instead of localStorage
- Replace all storage.ts functions with API calls
- Update NoteEditor to call POST/PUT endpoints
- Update NoteCard delete functionality
- Handle API errors and loading states in frontend

**Definition of Done:**

- All note operations work through the backend API
- Users can only access their own notes
- Frontend no longer uses localStorage for notes
- Create, edit, delete, and view operations work seamlessly
- Error handling works for failed API calls

**Manual Test Checklist (Frontend):**

- Log in to the application
- Create a new Holocron with title and content
- Verify the note appears in the notes list
- Edit an existing note and save changes
- Verify changes are persisted after page refresh
- Delete a note and confirm it's removed
- Create multiple notes and verify they all display
- Log out and log back in - notes should persist

**User Test Prompt:**

```
1. Log in to your account
2. Create 3 different Holocrons with various titles and content
3. Edit one of the notes and change both title and content
4. Delete one of the notes
5. Refresh the browser page
6. Verify you have 2 notes remaining with correct content
7. Log out and log back in - notes should still be there
```

**Post-sprint:**

- Commit changes: `git add . && git commit -m "S2: Complete CRUD operations for notes"`
- Push to main: `git push origin main`

## S3 - Search Functionality

**Objectives:**

- Implement server-side search across note titles and content
- Replace frontend client-side filtering with API search
- Optimize search performance for user experience
- Maintain existing search UI behavior

**User Stories:**

- As a user, I want to search my Holocrons so I can quickly find specific information
- As a user, I want search to work across both titles and content
- As a user, I want search results to be fast and accurate

**Endpoints:**

- `GET /api/v1/notes?search=term` - Search notes by title/content

**Tasks:**

- Add search parameter to GET /api/v1/notes endpoint
- Implement MongoDB text search or regex search
- Update notes query to filter by search term
- Modify frontend SearchBar to trigger API calls
- Add debouncing to search input to reduce API calls
- Update notes list to show search results
- Handle empty search results gracefully
- Maintain search term in URL/state for better UX

**Definition of Done:**

- Search works across note titles and content
- Search results update in real-time as user types
- Empty search shows all notes
- Search performance is acceptable (< 1 second)
- Search state is maintained during session

**Manual Test Checklist (Frontend):**

- Log in and ensure you have several notes with different content
- Use the search bar to search for text that appears in note titles
- Verify only matching notes are displayed
- Search for text that appears in note content
- Verify content-based search works correctly
- Clear the search term and verify all notes reappear
- Search for text that doesn't exist - verify empty state shows
- Test search with partial words and verify results

**User Test Prompt:**

```
1. Log in and create 5 notes with different titles and content
2. Use the search bar to search for a word from one note's title
3. Verify only that note appears in results
4. Search for a word that appears in multiple notes' content
5. Verify all matching notes appear
6. Clear the search and verify all notes reappear
7. Search for "xyz123" (non-existent) and verify empty state
```

**Post-sprint:**

- Commit changes: `git add . && git commit -m "S3: Search functionality implementation"`
- Push to main: `git push origin main`

# Development Complete

After S3 completion, the backend will fully support all frontend features:

- User authentication and secure note management
- Complete CRUD operations for notes
- Real-time search functionality
- Persistent data storage via MongoDB Atlas
- RESTful API design following best practices

The application will be ready for production deployment with all core features working through the backend API instead of localStorage.
