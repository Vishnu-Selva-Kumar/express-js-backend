# Development Commands & Cheatsheet

Helpful Docker and local commands used throughout the development lifecycle of this project.

---

## 1. Initial Setup Without Local Node.js

Run a disposable Node.js container to initialize `package.json` and install core packages:

```bash
# Windows Command Prompt (%cd%)
docker run --rm -v "%cd%:/app" -w /app node:22-alpine npm init -y
docker run --rm -v "%cd%:/app" -w /app node:22-alpine npm install express mysql2 dotenv

# Linux / macOS / PowerShell (${PWD} or $(pwd))
docker run --rm -v "${PWD}:/app" -w /app node:22-alpine npm init -y
docker run --rm -v "${PWD}:/app" -w /app node:22-alpine npm install express mysql2 dotenv
```

---

## 2. Docker Compose Commands

### Install Dependencies Inside Running App Container
```bash
docker compose exec app npm install --save-dev knex
```

### Database Migrations
```bash
# Run latest migrations
docker compose exec app npm run migrate

# Rollback last migration batch
docker compose exec app npm run migrate:rollback
```

### Seeders
```bash
# Execute database seeders
docker compose exec app npm run seed
```

### Run Tests
```bash
docker compose exec app npm test
```

### Restart Server
```bash
# Restart the app container (e.g. after backend code changes)
docker compose restart app
```

---

## 3. Commands Without Docker (Local Machine)

If Node.js and MySQL are installed locally:

```bash
# Run migrations
npx knex migrate:latest

# Rollback migrations
npx knex migrate:rollback

# Run seeders
npx knex seed:run
```

---

## 4. Database Verification (MySQL CLI via Docker)

Inspect database tables and seed data directly in the MySQL container:

```bash
docker compose exec mysql mysql -uexpress_js -ppassword -e "USE express_js; SELECT * FROM roles; SELECT id, role_id, name, email, password FROM users;"
```
