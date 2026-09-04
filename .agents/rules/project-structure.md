# Express Application Architecture & Directory Rules

## Project Structure

All AI agents and developers must strictly adhere to the following directory structure when creating, modifying, or refactoring files in this repository:

```text
express-app/
│
├── constants/                 # Centralized constants & status codes
│   └── httpStatus.js          # HTTP_STATUS constants (avoid magic numbers)
│
├── database/
│   ├── db.js                  # Knex connection pool instance
│   ├── migrations/            # Database migration files (Knex)
│   └── seeds/                 # Database seeders (Knex)
│
├── controllers/               # Request handling & response logic (Resource style)
│   ├── Auth/
│   │   └── LoginController.js # store (login), delete/destroy (logout)
│   └── ProfileController.js   # show/index (profile)
│
├── middleware/                # Express request interceptors & guards
│   └── auth.js                # JWT & database-backed token authentication guard
│
├── routes/                    # API route declarations
│   └── api.js                 # Central API route definitions
│
├── models/                    # Data access layer & Knex query models
│   ├── User.js                # Users query model
│   └── Token.js               # Database-backed personal access tokens model
│
├── tests/                     # Automated Test Suite (Laravel Style)
│   ├── Feature/               # End-to-end HTTP API integration tests (Supertest)
│   │   └── AuthTest.test.js
│   └── Unit/                  # Model & logic unit tests (Jest)
│       ├── TokenTest.test.js
│       └── UserTest.test.js
│
├── .env                       # Environment variables (git-ignored)
├── knexfile.js                # Knex database configuration
├── index.js                   # Express app setup, middleware & route mounting
└── package.json               # Dependencies and scripts
```

---

## Directory Responsibilities

### 1. `constants/`
- **`constants/httpStatus.js`**: Frozen HTTP status code constants (`HTTP_STATUS.OK`, `HTTP_STATUS.UNAUTHORIZED`, `HTTP_STATUS.UNPROCESSABLE_ENTITY`, etc.).
- **Rule:** **Never use hardcoded magic numbers (e.g., `200`, `401`, `422`, `500`)** in controllers, middleware, or test assertions. Always import and use `HTTP_STATUS`.
- **Response Format:** Standardize API responses with `{ success: boolean, message: string, ... }`.

### 2. `database/`
- **`database/db.js`**: Central Knex instance configured with environment settings.
- **`database/migrations/`**: Contains Knex migration files. Must follow timestamp prefixes (`YYYYMMDDHHMMSS_create_tablename_table.js`).
- **`database/seeds/`**: Contains database seeders. Must follow deterministic numeric prefixes (e.g., `01_roles_seeder.js`, `02_users_seeder.js`) and use upsert (`onConflict().merge()`) where applicable.

### 3. `controllers/`
- **Naming:** PascalCase with `Controller` suffix (e.g., `LoginController.js`, `ProfileController.js`).
- **Resource Controller Convention (Laravel Style):**
  - `index(req, res)`: Display a listing of the resource.
  - `store(req, res)`: Store a newly created resource in storage (e.g., `POST /api/login` session store).
  - `show(req, res)`: Display the specified resource (e.g., `GET /api/profile`).
  - `update(req, res)`: Update the specified resource.
  - `delete(req, res)` or `destroy(req, res)`: Remove the specified resource (e.g., `DELETE /api/logout` session delete).
- **Rule:** Do not write raw SQL or complex database queries directly in controllers; delegate data operations to models.

### 4. `middleware/`
- **Naming:** camelCase or lowercase (e.g., `auth.js`, `validate.js`).
- **Responsibility:** Request preprocessing, JWT authentication checks, token revocation, role/permission verification, and error handling.
- **Rule:** Must call `next()` on success or return an early error response with `HTTP_STATUS` constants.

### 5. `routes/`
- **Naming:** `routes/api.js` for API endpoints.
- **Responsibility:** Thin routing layer mapping HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) and URL paths to controller actions and middleware guards.
- **Rule:** Do not embed business or database logic directly inside route callbacks.

### 6. `models/`
- **Naming:** Singular PascalCase (e.g., `User.js`, `Token.js`, `Role.js`).
- **Responsibility:** Knex query builders, table associations, scopes, and database access methods.

### 7. `tests/`
- **`tests/Unit/`**: Tests focusing on individual models, functions, and isolated business logic.
- **`tests/Feature/`**: End-to-end integration tests using `supertest` verifying full HTTP request-response lifecycles, status codes, and database state.

---

## Agent Execution Guidelines

1. **Strict Placement:** When asked to create a new endpoint, feature, or logic:
   - Declare the route in `routes/api.js`.
   - Implement resource methods (`index`, `store`, `show`, `update`, `delete`) in `controllers/`.
   - Place database queries in `models/`.
   - Place auth/validation interceptors in `middleware/`.
   - Use `HTTP_STATUS` constants for all response status codes and assertions.
   - Add corresponding test cases in `tests/Feature/` and `tests/Unit/`.
2. **Never use magic numbers:** Always use `HTTP_STATUS.<CODE>` from `constants/httpStatus.js`.
3. **Never create ad-hoc root directories:** Do not create top-level folders outside this specified structure.
4. **Database Paths:** Knex configurations in `knexfile.js` must target `database/migrations` and `database/seeds`.
