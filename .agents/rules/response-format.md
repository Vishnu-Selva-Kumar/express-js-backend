# API Response Parameter Format Rules

## Purpose & Authority

This document defines the **mandatory** standards for HTTP response payloads across all controllers, middleware, and route handlers.

> [!CAUTION]
> **MANDATORY FOR ALL AI AGENTS & DEVELOPERS:**  
> All AI agents (Gemini, Claude, GPT, etc.) and human developers working on this project **MUST 100% FOLLOW** these rules without exception.  
> **Frontend client logic evaluates success or failure exclusively using HTTP Response Status Codes** (`200`, `201`, `400`, `401`, `403`, `404`, `422`, `500`).  
> **NEVER include a `success` boolean parameter (`success: true` or `success: false`) in ANY API response body.**

---

## 1. Response Structure Rules

### Rule 1: No `success` Boolean Parameter in Any API Response
- The Frontend evaluates HTTP status codes (`2xx` for success, `4xx`/`5xx` for failure).
- Including `success: true` or `success: false` in response payloads is prohibited across all endpoints.
- Error responses (4xx, 5xx) must only contain a clear `message` and optional `errors` object (for validation errors).
- Success responses (2xx) must only contain `message` and the relevant payload (e.g. `data`, `token`, `user`, etc.).

### Rule 2: Validation Error Responses (`HTTP_STATUS.UNPROCESSABLE_ENTITY` - 422)
When request payload validation fails:
```javascript
// ❌ INCORRECT:
return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
  success: false,
  message: 'Validation failed.',
  errors
});

// ✅ CORRECT:
return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
  message: 'Validation failed.',
  errors
});
```

### Rule 3: Client & Server Error Responses (`400`, `401`, `403`, `404`, `500`)
For unauthorized, forbidden, not found, or server error responses:
```javascript
// ❌ INCORRECT:
return res.status(HTTP_STATUS.NOT_FOUND).json({
  success: false,
  message: 'Category not found.'
});

// ✅ CORRECT:
return res.status(HTTP_STATUS.NOT_FOUND).json({
  message: 'Category not found.'
});
```

```javascript
// ❌ INCORRECT:
return res.status(HTTP_STATUS.FORBIDDEN).json({
  success: false,
  message: 'Forbidden: Admin access required.'
});

// ✅ CORRECT:
return res.status(HTTP_STATUS.FORBIDDEN).json({
  message: 'Forbidden: Admin access required.'
});
```

### Rule 4: Success Responses (`HTTP_STATUS.OK` - 200, `HTTP_STATUS.CREATED` - 201)
Success responses contain a human-readable `message` and `data` (or resource key):
```javascript
// ✅ Single Resource (Show / Store / Update):
return res.status(HTTP_STATUS.OK).json({
  message: 'Category retrieved successfully.',
  data: category
});

// ✅ Resource List (Index):
return res.status(HTTP_STATUS.OK).json({
  message: 'Categories retrieved successfully.',
  data: categories
});

// ✅ Resource Deleted (Delete):
return res.status(HTTP_STATUS.OK).json({
  message: 'Category deleted successfully.'
});
```

---

## 2. Summary of Response Schemas

| HTTP Status | Category | Response Body Format |
| :--- | :--- | :--- |
| **`200 OK`** | Success | `{ "message": "...", "data": ... }` |
| **`201 CREATED`** | Created | `{ "message": "...", "data": ... }` |
| **`400 BAD_REQUEST`** | Client Error | `{ "message": "..." }` |
| **`401 UNAUTHORIZED`** | Auth Error | `{ "message": "..." }` |
| **`403 FORBIDDEN`** | Permission Error | `{ "message": "..." }` |
| **`404 NOT_FOUND`** | Not Found | `{ "message": "..." }` |
| **`422 UNPROCESSABLE_ENTITY`**| Validation Error | `{ "message": "Validation failed.", "errors": { ... } }` |
| **`500 INTERNAL_SERVER_ERROR`**| Server Error | `{ "message": "..." }` |

---

## 3. Checklist for Controllers & Middleware

- [ ] Does any response return `success: true` or `success: false`? If yes, **remove the `success` parameter**.
- [ ] Are HTTP status codes set using `HTTP_STATUS` constants (no magic numbers)?
- [ ] Do validation error responses return `{ message, errors }`?
- [ ] Do general error responses return `{ message }`?
