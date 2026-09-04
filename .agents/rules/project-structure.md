# Express Application Architecture & Directory Rules

## Project Structure

All AI agents and developers must strictly adhere to the following directory structure when creating, modifying, or refactoring files in this repository:

```text
express-app/
│
├── database/
│   ├── migrations/            # Database migration files (Knex)
│   └── seeds/                 # Database seeders (Knex)
│
├── controllers/               # Request handling & response logic
│   └── AuthController.js
│
├── middleware/                # Express request interceptors & guards
│   └── auth.js
│
├── routes/                    # API route declarations
│   └── auth.js
│
├── models/                    # Data access layer & Knex query models
│   └── User.js
│
├── .env                       # Environment variables (git-ignored)
├── knexfile.js                # Knex database configuration
├── app.js                     # Express app setup, middleware & route mounting
└── package.json               # Dependencies and scripts
```

---

## Directory Responsibilities

### 1. `database/`
- **`database/migrations/`**: Contains Knex migration files. Must follow timestamp prefixes (`YYYYMMDDHHMMSS_create_tablename_table.js`).
- **`database/seeds/`**: Contains database seeders. Must follow deterministic numeric prefixes (e.g., `01_roles_seeder.js`, `02_users_seeder.js`) and use upsert (`onConflict().merge()`) where applicable.

### 2. `controllers/`
- **Naming:** PascalCase with `Controller` suffix (e.g., `AuthController.js`, `UserController.js`).
- **Responsibility:** Extract request data (`req.body`, `req.params`, `req.query`), perform validation, call models/services, and return standardized JSON responses with appropriate HTTP status codes.
- **Rule:** Do not write raw SQL or complex database queries directly in controllers; delegate data operations to models.

### 3. `middleware/`
- **Naming:** camelCase or lowercase (e.g., `auth.js`, `validate.js`).
- **Responsibility:** Request preprocessing, JWT authentication checks, role/permission verification, rate-limiting, and error handling.
- **Rule:** Must call `next()` on success or return an early error response.

### 4. `routes/`
- **Naming:** camelCase or resource name (e.g., `auth.js`, `users.js`, `api.js`).
- **Responsibility:** Thin routing layer mapping HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) and URL paths to controller actions and middleware guards.
- **Rule:** Do not embed business or database logic directly inside route callbacks.

### 5. `models/`
- **Naming:** Singular PascalCase (e.g., `User.js`, `Role.js`).
- **Responsibility:** Knex query builders, table associations, scopes, and database access methods.

---

## Agent Execution Guidelines

1. **Strict Placement:** When asked to create a new endpoint, feature, or logic:
   - Create or update the route in `routes/`.
   - Create the handler in `controllers/`.
   - Create or update queries in `models/`.
   - Place auth/validation checks in `middleware/`.
2. **Never create ad-hoc root directories:** Do not create top-level folders outside this specified structure unless explicitly directed by the user.
3. **Database Paths:** Knex configurations in `knexfile.js` must target `database/migrations` and `database/seeds`.
