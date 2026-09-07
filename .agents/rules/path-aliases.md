# Path Aliases & Module Import Rules

## Purpose & Authority

This document defines the **mandatory** standards for requiring and importing application modules across the codebase.

> [!CAUTION]
> **MANDATORY FOR ALL AI AGENTS & DEVELOPERS:**  
> All AI agents (Gemini, Claude, GPT, etc.) and human developers working in any IDE **MUST 100% FOLLOW** these rules without exception.  
> **NEVER use brittle relative directory traversal paths (e.g., `../../models/User`, `../../../constants/httpStatus`) when importing cross-directory modules.** Always use the native `#*` subpath import aliases configured in `package.json`.

---

## 1. Registered Subpath Aliases

All root-level project domains are mapped via the native Node.js `imports` field in `package.json`:

| Alias Prefix | Target Directory | Common Examples |
| :--- | :--- | :--- |
| **`#app`** | `./index.js` | `const app = require('#app');` |
| **`#models/*`** | `./models/*.js` | `const User = require('#models/User');`<br>`const Role = require('#models/Role');` |
| **`#controllers/*`** | `./controllers/*.js` | `const LoginController = require('#controllers/Auth/LoginController');` |
| **`#middleware/*`** | `./middleware/*.js` | `const auth = require('#middleware/auth');`<br>`const { uploadProfile } = require('#middleware/upload');` |
| **`#constants/*`** | `./constants/*.js` | `const HTTP_STATUS = require('#constants/httpStatus');` |
| **`#routes/*`** | `./routes/*.js` | `const routes = require('#routes/routeNames');` |
| **`#config/*`** | `./config/*.js` | `const mail = require('#config/mail');` |
| **`#database/*`** | `./database/*.js` | `const db = require('#database/db');` |

---

## 2. Import Rules & Standards

1. **No Extension in Alias Imports**:
   - Always omit the `.js` extension when importing using `#*` aliases:
     - ✅ `require('#models/User')`
     - ❌ `require('#models/User.js')`
2. **No Relative Cross-Directory Traversal**:
   - Never use `../` or `../../` to reach out to a different top-level directory:
     - ❌ `require('../../models/User')`
     - ❌ `require('../constants/httpStatus')`
     - ❌ `require('../../database/db')`
3. **Same-Directory Imports**:
   - Relative imports (`./sibling`) are permitted ONLY within the same directory level (e.g. `./upload` from within `middleware/` or `./routeNames` from within `routes/`), but `#routes/routeNames` is preferred for uniformity.
4. **Test Files**:
   - Automated tests in `tests/Feature/` and `tests/Unit/` must use `#*` aliases for models, constants, database, and routes rather than chaining `../../`.

---

## 3. Correct vs. Incorrect Usage Examples

### In Controllers (`controllers/**/*.js`):
```javascript
// ❌ INCORRECT (Fragile relative paths):
const User = require('../../models/User');
const Role = require('../../models/Role');
const HTTP_STATUS = require('../../constants/httpStatus');
const routes = require('../../routes/routeNames');
const mail = require('../../config/mail');

// ✅ CORRECT (Native subpath aliases):
const User = require('#models/User');
const Role = require('#models/Role');
const HTTP_STATUS = require('#constants/httpStatus');
const routes = require('#routes/routeNames');
const mail = require('#config/mail');
```

### In Models (`models/**/*.js`):
```javascript
// ❌ INCORRECT:
const db = require('../database/db');
const Role = require('./Role');

// ✅ CORRECT:
const db = require('#database/db');
const Role = require('#models/Role');
```

### In Routes (`routes/**/*.js`):
```javascript
// ❌ INCORRECT:
const LoginController = require('../controllers/Auth/LoginController');
const auth = require('../middleware/auth');
const routes = require('./routeNames');

// ✅ CORRECT:
const LoginController = require('#controllers/Auth/LoginController');
const auth = require('#middleware/auth');
const routes = require('#routes/routeNames');
```

### In Middleware (`middleware/**/*.js`):
```javascript
// ❌ INCORRECT:
const HTTP_STATUS = require('../constants/httpStatus');
const User = require('../models/User');

// ✅ CORRECT:
const HTTP_STATUS = require('#constants/httpStatus');
const User = require('#models/User');
```

### In Automated Tests (`tests/**/*.test.js`):
```javascript
// ❌ INCORRECT:
const app = require('../../index');
const db = require('../../database/db');
const routes = require('../../routes/routeNames');
const HTTP_STATUS = require('../../constants/httpStatus');
const User = require('../../models/User');

// ✅ CORRECT:
const app = require('#app');
const db = require('#database/db');
const routes = require('#routes/routeNames');
const HTTP_STATUS = require('#constants/httpStatus');
const User = require('#models/User');
```

---

## 4. Pre-Commit Checklist for AI Agents

Before committing changes, all AI agents must verify:

- [ ] No `../../` cross-directory relative require paths exist in new or modified files.
- [ ] All cross-directory imports use `#app`, `#models/*`, `#controllers/*`, `#middleware/*`, `#constants/*`, `#routes/*`, `#config/*`, or `#database/*`.
- [ ] No `.js` extension is appended to `#*` alias paths.
- [ ] All tests pass inside Docker (`docker compose exec app npm test`).
