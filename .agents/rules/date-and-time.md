# Date, Time & TimeZone Architecture Rules

## Purpose & Authority

This document defines the **mandatory** architecture and standards for handling dates, times, timestamps, and timezones across this Express.js backend.

> [!IMPORTANT]
> **MANDATORY FOR ALL AI AGENTS & DEVELOPERS:**  
> All AI agents (Gemini, Claude, GPT, etc.) and developers working in this repository **MUST 100% FOLLOW** these rules without exception.  
> Never perform manual timezone arithmetic (e.g. adding 5.5 hours), never insert local time strings into MySQL, and never install external date libraries (e.g. `moment.js` or `date-fns`).

---

## 1. Core Principles & Philosophy

Modern multi-tier web applications follow the four-tier date standard:

```text
┌────────────────────────────────────────────────────────┐
│ 1. Storage: STRICT UTC (+00:00) in MySQL Database      │
├────────────────────────────────────────────────────────┤
│ 2. Processing: UTC in Node.js Backend Engine           │
├────────────────────────────────────────────────────────┤
│ 3. Transfer: ISO 8601 UTC Format ("...Z") in API JSON  │
├────────────────────────────────────────────────────────┤
│ 4. Presentation: Local User TimeZone on the Frontend   │
└────────────────────────────────────────────────────────┘
```

### Why UTC Storage & Transfer?
- **Immunity to Daylight Saving Time (DST)**: Prevents overlapping or skipped hours.
- **Server Independence**: Works identically regardless of whether code runs on a developer's local machine (e.g. Windows in `+05:30` IST), inside Docker (`UTC`), or in cloud servers across different regions.
- **Reliable Expirations**: OTPs, JWT tokens, cart reservations, and password reset links expire with exact precision.
- **Frontend Flexibility**: Frontend clients can format UTC ISO-8601 strings into the user's localized browser timezone with native JavaScript `toLocaleDateString()` or libraries like `dayjs`.

---

## 2. Mandatory Rules

### Rule 1: Database Storage is Always UTC
- All database columns storing timestamps (`created_at`, `updated_at`, `expires_at`, `deleted_at`) must contain values in **UTC (`+00:00`)**.
- Knex migrations must use `table.timestamps(true, true)` for automatic `CURRENT_TIMESTAMP` in UTC.
- Never store pre-formatted local time strings (e.g. `'2026-09-08 12:30:00'`) in database columns.

### Rule 2: MySQL Connection & Session UTC Lock
- In `knexfile.js`, the connection configuration must specify:
  ```javascript
  timezone: process.env.DB_TIMEZONE || '+00:00'
  ```
- The Knex pool `afterCreate` hook must execute `SET time_zone = '+00:00';` on each MySQL connection to prevent the host database server's global timezone from affecting `NOW()` or `CURRENT_TIMESTAMP`.

### Rule 3: Expiration & Comparison Logic in UTC
- All expiration checks must evaluate strictly against UTC:
  - In Knex query builders:
    ```javascript
    .where('expires_at', '>', db.fn.now())
    ```
  - In application code:
    ```javascript
    DateHelper.isExpired(expires_at)
    ```
- Never add manual hours (e.g. `+ 5.5 * 3600 * 1000`) before saving into expiration columns.

### Rule 4: API Response Serialization
- All API endpoints must return dates serialized as standard **ISO 8601 UTC strings** ending with `Z`:
  ```json
  {
    "created_at": "2026-09-08T06:40:00.000Z",
    "updated_at": "2026-09-08T06:40:00.000Z"
  }
  ```
- Do not convert dates to local formatted strings inside API JSON payloads.

### Rule 5: Localized Formatting via `helpers/dateHelper.js`
- When the backend needs to produce human-readable dates for outbound communications (e.g. welcome emails, password reset notifications, invoice receipts, PDF generation):
  - Always use `DateHelper.formatAppDate(date)` from `#helpers/dateHelper`.
  - It utilizes native `Intl.DateTimeFormat` with `process.env.APP_TIMEZONE || 'Asia/Kolkata'`.
- **Zero Third-Party Bloat**: Do NOT install `moment.js` or `date-fns`. Native `Intl` and `#helpers/dateHelper` cover all requirements.

---

## 3. Code Reference & Examples

### ✅ Correct Usage
```javascript
const DateHelper = require('#helpers/dateHelper');

// 1. Calculate future expiration in UTC
const expiresAt = DateHelper.addMinutes(new Date(), 10);

// 2. Check if a timestamp is expired
if (DateHelper.isExpired(tokenRecord.expires_at)) {
  // Token is expired
}

// 3. Format localized date for email body or receipt
const formattedDate = DateHelper.formatAppDate(new Date());
// Output => "Sep 08, 2026, 12:08:00 PM GMT+5:30"

// 4. Convert date to standard ISO 8601 UTC string
const isoString = DateHelper.toUTCISO(new Date());
// Output => "2026-09-08T06:38:00.000Z"
```

### ❌ Prohibited Anti-Patterns
```javascript
// ❌ WRONG: Adding manual offsets for local time
const localDate = new Date(Date.now() + 5.5 * 60 * 60 * 1000);

// ❌ WRONG: Custom date string formats in API responses
res.status(HTTP_STATUS.OK).json({
  created_at: "08-09-2026 12:00 PM"
});

// ❌ WRONG: Installing heavy third-party date packages
// npm install moment
```
