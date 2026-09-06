# Route Naming Rules & Standards

## Purpose & Authority

This document defines the **mandatory** standards for declaring, updating, and consuming route paths and endpoint URLs in this Express.js application.

> **MANDATORY FOR ALL AI AGENTS & MODELS ACROSS ALL IDEs:**  
> All AI agents, models (Gemini, Claude, GPT, etc.), and developers working in any IDE (Antigravity IDE, VS Code, Cursor, JetBrains, Windsurf, etc.) **MUST 100% FOLLOW** these rules without exception.  
> **NEVER hardcode URL strings directly in route files or test suites.**

---

## 1. Centralized Source of Truth: `routes/routeNames.js`

All route URLs must be defined exclusively in [routes/routeNames.js](file:///d:/express-js/routes/routeNames.js).

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

## 2. Namespace Organization Rules

1. **`routes.api`**:
   - Reserved strictly for API endpoints prefixed with `/api/`.
   - Keys must be concise, lowerCamelCase descriptors of the resource or action (e.g., `login`, `profile`, `userRegistration`).
   - Values must be frozen strings representing the exact URL path.

2. **`routes.web`**:
   - Reserved for non-API, browser-facing, HTML, or media streaming routes (e.g., `/media/:id/{*path}`).
   - Keys must be lowerCamelCase descriptors.

3. **Dynamic URL Helpers (Functions)**:
   - When a route requires dynamic path parameters (e.g., `/media/12/storage/app/...`), create a helper function on `routes` (e.g., `routes.mediaUrl(id, path)`).
   - Use helper functions in tests and client-facing URL formatters.
   - Do not construct parameterized URLs via ad-hoc string concatenations in tests.

---

## 3. How to Add a New Route (3-Step Workflow)

Whenever adding a new endpoint or feature, follow this exact sequence:

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

### Step 2: Use in Router File (`routes/api.js` or `routes/web.js`)
```javascript
// In routes/api.js
const routes = require('./routeNames');
const RegisterController = require('../controllers/Auth/RegisterController');

router.post(routes.api.register, RegisterController.store);
```

### Step 3: Use in Test Suites (`tests/Feature/...`)
```javascript
// In tests/Feature/RegisterTest.test.js
const routes = require('../../routes/routeNames');

const response = await request(app)
  .post(routes.api.register)
  .send({ ... });
```

---

## 4. How to Update an Existing Route

When changing a route path (e.g., changing `/api/profile` to `/api/v1/profile`):

1. **Modify ONLY the string value in `routes/routeNames.js`:**
   ```javascript
   // Change value only:
   profile: '/api/v1/profile',
   ```
2. **Do NOT rename the key** unless there is an architectural refactor. Keeping the key consistent ensures zero breakage in route files, controllers, and tests.
3. If the key must be renamed:
   - Use grep to find all references across `routes/` and `tests/`.
   - Update all references simultaneously.

---

## 5. Correct vs. Incorrect Usage Examples

### Route Declarations:
```javascript
// ❌ INCORRECT (Hardcoded magic strings):
router.post('/api/login', LoginController.store);
router.get('/media/:id/{*path}', AttachmentController.index);

// ✅ CORRECT (Using routes constant):
const routes = require('./routeNames');
router.post(routes.api.login, LoginController.store);
router.get(routes.web.media, AttachmentController.index);
```

### Automated Tests (Supertest):
```javascript
// ❌ INCORRECT:
const res = await request(app).post('/api/login').send({ ... });
const mediaRes = await request(app).get(`/media/${id}/${path}`);

// ✅ CORRECT:
const routes = require('../../routes/routeNames');
const res = await request(app).post(routes.api.login).send({ ... });
const mediaRes = await request(app).get(routes.mediaUrl(id, path));
```

---

## 6. Pre-Commit Checklist for AI Agents

Before declaring any coding task complete or committing changes, AI agents must verify:

- [ ] Every new route URL is declared in `routes/routeNames.js`.
- [ ] No hardcoded `/api/...` or `/media/...` string literals exist in `routes/api.js` or `routes/web.js`.
- [ ] All Supertest calls in `tests/Feature/` use `routes.api.*`, `routes.web.*`, or dynamic route helpers.
- [ ] `routes/routeNames.js` and its sub-objects remain wrapped in `Object.freeze()`.
- [ ] All tests pass via `docker compose exec app npm test`.
