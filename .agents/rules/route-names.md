# Route Naming Rules & Standards

## Purpose & Authority

This document defines the **mandatory** standards for declaring, updating, and consuming route paths, endpoints, and media URLs across the entire application.

> [!CAUTION]
> **MANDATORY FOR ALL AI AGENTS & MODELS ACROSS ALL IDEs:**  
> All AI agents, AI models (Gemini, Claude, GPT, etc.), and human developers working in any IDE (Antigravity IDE, VS Code, Cursor, JetBrains, Windsurf, etc.) **MUST 100% FOLLOW** these rules without exception.  
> **NEVER hardcode URL strings or path patterns in ANY application file.**

---

## 1. Scope of Enforcement: Files Covered

Hardcoding URL strings (such as `'/api/login'`, `'/api/profile'`, `'/media/:id/{*path}'`, `'/'`, etc.) is **STRICTLY PROHIBITED** in all of the following file types and layers:

| Layer / File Category | Directory / Files | Rule & Usage |
| :--- | :--- | :--- |
| **1. Controller Files** | `controllers/**/*.js` | Redirects, route checks, response URL building, pagination links. |
| **2. Service Files** | `services/**/*.js` | Notification links, emails, webhook callbacks, integration endpoints. |
| **3. Model Files** | `models/**/*.js` | Resource formatters (e.g. `Attachment.formatWithUrl`), URL mutators. |
| **4. Route Files** | `routes/**/*.js` (`api.js`, `web.js`) | Route handler definitions (`router.get`, `router.post`, `router.put`, etc.). |
| **5. Middleware Files** | `middleware/**/*.js` | Route exclusion checks, auth guards, path-based filters. |
| **6. Test Files** | `tests/**/*.test.js` (`Feature/`, `Unit/`) | Supertest request endpoints (`.post(routes.api.login)`, `.get(routes.mediaUrl(...))`). |
| **7. Application Entrypoint** | `index.js`, `app.js`, `server.js` | Top-level route bindings (`app.get(routes.web.home, ...)`). |
| **8. Seeder & Migration Files** | `database/seeds/**/*.js`, `database/migrations/**/*.js` | Seed records containing endpoint paths or system routes. |
| **9. Helpers & Utilities** | `helpers/**/*.js`, `utils/**/*.js` | URL formatting helpers, link builders, response serializers. |

---

## 2. Centralized Source of Truth: `routes/routeNames.js`

All application route paths and dynamic URL generators must be defined exclusively in [routes/routeNames.js](file:///d:/express-js/routes/routeNames.js).

### Canonical File Structure:

```javascript
/**
 * Application Route URLs and Endpoints
 * Centralized mapping for route paths used across route declarations and test suites.
 */
const routes = Object.freeze({
  // All JSON API endpoints starting with /api/
  api: Object.freeze({
    login: '/api/login',
    profile: '/api/profile',
    logout: '/api/logout',
  }),

  // All Web / Static / Stream routes
  web: Object.freeze({
    home: '/',
    media: '/media/:id/{*path}',
  }),

  /**
   * Helper functions for dynamic/parameterized URLs
   * @param {number|string} id Attachment ID
   * @param {string} path Relative storage path
   * @returns {string}
   */
  mediaUrl: (id, path) => `/media/${id}/${path}`,
});

module.exports = routes;
```

---

## 3. Namespace Organization Rules

1. **`routes.api`**:
   - Reserved strictly for API endpoints prefixed with `/api/`.
   - Keys must be concise, lowerCamelCase descriptors (e.g., `login`, `profile`, `logout`).
   - Values must be frozen string paths.

2. **`routes.web`**:
   - Reserved for non-API, browser-facing, HTML, or media streaming routes (e.g., `home: '/'`, `media: '/media/:id/{*path}'`).
   - Keys must be lowerCamelCase descriptors.

3. **Dynamic URL Helpers (Functions)**:
   - When an endpoint requires dynamic parameters (e.g., `/media/12/storage/app/...`), define a helper function on `routes` (e.g., `routes.mediaUrl(id, path)`).
   - Use helper functions in models, controllers, services, and tests.
   - Do NOT construct parameterized URLs via ad-hoc string concatenation across files.

---

## 4. How to Add a New Route (Step-by-Step Workflow)

Whenever adding a new endpoint, follow this exact sequence:

### Step 1: Add the URL to `routes/routeNames.js`
```javascript
// In routes/routeNames.js
const routes = Object.freeze({
  api: Object.freeze({
    login: '/api/login',
    profile: '/api/profile',
    logout: '/api/logout',
    register: '/api/register', // <-- ADD HERE
  }),
  ...
});
```

### Step 2: Use in Router (`routes/api.js` or `routes/web.js`)
```javascript
// In routes/api.js
const routes = require('./routeNames');
const RegisterController = require('../controllers/Auth/RegisterController');

router.post(routes.api.register, RegisterController.store);
```

### Step 3: Use in Tests (`tests/Feature/...`)
```javascript
// In tests/Feature/RegisterTest.test.js
const routes = require('../../routes/routeNames');

const response = await request(app)
  .post(routes.api.register)
  .send({ ... });
```

---

## 5. How to Update an Existing Route

When changing a route path (e.g., changing `/api/profile` to `/api/v1/profile`):

1. **Modify ONLY the string value in `routes/routeNames.js`:**
   ```javascript
   // Change path value only:
   profile: '/api/v1/profile',
   ```
2. **Do NOT rename the key** unless there is a broader refactoring requirement. This ensures zero breakage across controllers, models, services, and tests.
3. If a key must be renamed:
   - Run grep across the repository to identify all references.
   - Update all references simultaneously.

---

## 6. Correct vs. Incorrect Usage Across File Layers

### In Route Files (`routes/api.js`, `routes/web.js`):
```javascript
// ❌ INCORRECT (Hardcoded string):
router.post('/api/login', LoginController.store);
router.get('/media/:id/{*path}', AttachmentController.index);

// ✅ CORRECT:
const routes = require('./routeNames');
router.post(routes.api.login, LoginController.store);
router.get(routes.web.media, AttachmentController.index);
```

### In Application Entrypoint (`index.js`):
```javascript
// ❌ INCORRECT:
app.get('/', (req, res) => { ... });

// ✅ CORRECT:
const routes = require('./routes/routeNames');
app.get(routes.web.home, (req, res) => { ... });
```

### In Models & Services (`models/Attachment.js`, `services/...`):
```javascript
// ❌ INCORRECT:
const url = `${baseUrl}/media/${attachment.id}/${cleanPath}`;

// ✅ CORRECT:
const routes = require('../routes/routeNames');
const url = `${baseUrl}${routes.mediaUrl(attachment.id, cleanPath)}`;
```

### In Automated Tests (`tests/Feature/*.test.js`):
```javascript
// ❌ INCORRECT:
const res = await request(app).post('/api/login').send({ ... });
const mediaRes = await request(app).get(`/media/${id}/${path}`);

// ✅ CORRECT:
const routes = require('../../routes/routeNames');
const res = await request(app).post(routes.api.login).send({ ... });
const mediaRes = await request(app).get(routes.mediaUrl(id, path));
```

### In Middleware (`middleware/*.js`):
```javascript
// ❌ INCORRECT:
if (req.path === '/api/login') return next();

// ✅ CORRECT:
const routes = require('../routes/routeNames');
if (req.path === routes.api.login) return next();
```

---

## 7. Pre-Commit Checklist for AI Agents

Before submitting code or committing changes, all AI agents must verify:

- [ ] Every new route URL is declared in `routes/routeNames.js`.
- [ ] No hardcoded `/api/...`, `/media/...`, or root URL string literals exist in controllers, services, models, routes, middleware, entrypoints, or tests.
- [ ] Dynamic URLs use helper functions defined in `routes/routeNames.js`.
- [ ] `routes/routeNames.js` and all nested objects are sealed with `Object.freeze()`.
- [ ] All tests pass inside Docker (`docker compose exec app npm test`).
