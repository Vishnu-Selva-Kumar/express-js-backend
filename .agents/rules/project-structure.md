# Express Application Architecture & Directory Rules

## Project Structure

All AI agents and developers must strictly adhere to the following directory structure when creating, modifying, or refactoring files in this repository:

```text
express-app/
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
│   ├── auth.js                # JWT Bearer token authentication guard
│   └── blacklist.js           # In-memory token revocation registry
│
├── routes/                    # API route declarations
│   └── api.js                 # Central API route definitions
│
├── models/                    # Data access layer & Knex query models
│   └── User.js
│
├── tests/                     # Automated Test Suite (Laravel Style)
│   ├── Feature/               # End-to-end HTTP API integration tests (Supertest)
│   │   └── AuthTest.test.js
│   └── Unit/                  # Model & logic unit tests (Jest)
│       └── UserTest.test.js
│
├── .env                       # Environment variables (git-ignored)
├── knexfile.js                # Knex database configuration
├── index.js                   # Express app setup, middleware & route mounting
└── package.json               # Dependencies and scripts
```

---

## Directory Responsibilities

### 1. `database/`
- **`database/db.js`**: Central Knex instance configured with environment settings.
- **`database/migrations/`**: Contains Knex migration files. Must follow timestamp prefixes (`YYYYMMDDHHMMSS_create_tablename_table.js`).
- **`database/seeds/`**: Contains database seeders. Must follow deterministic numeric prefixes (e.g., `01_roles_seeder.js`, `02_users_seeder.js`) and use upsert (`onConflict().merge()`) where applicable.

### 2. `controllers/`
- **Naming:** PascalCase with `Controller` suffix (e.g., `LoginController.js`, `ProfileController.js`).
- **Resource Controller Convention (Laravel Style):**
  - `index(req, res)`: Display a listing of the resource.
  - `store(req, res)`: Store a newly created resource in storage (e.g., `POST /api/login` session store).
  - `show(req, res)`: Display the specified resource (e.g., `GET /api/profile`).
  - `update(req, res)`: Update the specified resource.
  - `delete(req, res)` or `destroy(req, res)`: Remove the specified resource (e.g., `DELETE /api/logout` session delete).
- **Rule:** Do not write raw SQL or complex database queries directly in controllers; delegate data operations to models.

### 3. `middleware/`
- **Naming:** camelCase or lowercase (e.g., `auth.js`, `blacklist.js`).
- **Responsibility:** Request preprocessing, JWT authentication checks, token revocation, role/permission verification, and error handling.
- **Rule:** Must call `next()` on success or return an early error response.

### 4. `routes/`
- **Naming:** `routes/api.js` for API endpoints.
- **Responsibility:** Thin routing layer mapping HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) and URL paths to controller actions and middleware guards.
- **Rule:** Do not embed business or database logic directly inside route callbacks.

### 5. `models/`
- **Naming:** Singular PascalCase (e.g., `User.js`, `Role.js`).
- **Responsibility:** Knex query builders, table associations, scopes, and database access methods.

### 6. `tests/`
- **`tests/Unit/`**: Tests focusing on individual models, functions, and isolated business logic.
- **`tests/Feature/`**: End-to-end integration tests using `supertest` verifying full HTTP request-response lifecycles, status codes, and database state.

---

## Agent Execution Guidelines

1. **Strict Placement:** When asked to create a new endpoint, feature, or logic:
   - Declare the route in `routes/api.js`.
   - Implement resource methods (`index`, `store`, `show`, `update`, `delete`) in `controllers/`.
   - Place database queries in `models/`.
   - Place auth/validation interceptors in `middleware/`.
   - Add corresponding test cases in `tests/Feature/` and `tests/Unit/`.
2. **Never create ad-hoc root directories:** Do not create top-level folders outside this specified structure.
3. **Database Paths:** Knex configurations in `knexfile.js` must target `database/migrations` and `database/seeds`.
