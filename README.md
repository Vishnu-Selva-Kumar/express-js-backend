# Express.js Docker & MySQL Boilerplate

A production-ready containerized Express.js application powered by MySQL 8.4, Knex.js for migrations, and phpMyAdmin for database management.

> **Note:** Node.js is **not required** on your host machine. All runtime, dependency installation, and migration commands run inside Docker containers.

---

## Tech Stack

- **Runtime:** Node.js 22 (Alpine Linux)
- **Framework:** Express.js
- **Database:** MySQL 8.4 (with container health checks)
- **Database Client & Migrations:** Knex.js (`mysql2`)
- **Database Management UI:** phpMyAdmin
- **Orchestration:** Docker & Docker Compose

---

## Services & Ports

| Service | Container Name | Host Port | Internal Port | URL / Access |
| :--- | :--- | :--- | :--- | :--- |
| **Express App** | `node-express-app` | `3000` | `3000` | [http://localhost:3000](http://localhost:3000) |
| **MySQL** | `node-mysql` | `3306` | `3306` | `localhost:3306` |
| **phpMyAdmin** | `node-phpmyadmin` | `8800` | `80` | [http://localhost:8800](http://localhost:8800) |

---

## Quick Start

### 1. Configure Environment Variables
Copy `.env.example` to `.env` (or configure your own):

```bash
cp .env.example .env
```

Default credentials in `.env`:
```env
PORT=3000
NODE_ENV=development

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=express_js
DB_USERNAME=express_js
DB_PASSWORD=password
MYSQL_ROOT_PASSWORD=password
```

### 2. Start the Application
Build and start all containers in detached mode:

```bash
docker compose up --build -d
```

Check the status of the containers:
```bash
docker compose ps
```

### 3. Run Database Migrations
Execute Knex migrations inside the container:

```bash
docker compose exec app npm run migrate
```

---

## Database Migrations (Knex.js)

All migration commands must be run through Docker:

| Action | Command |
| :--- | :--- |
| **Run pending migrations** | `docker compose exec app npm run migrate` |
| **Rollback last batch** | `docker compose exec app npm run migrate:rollback` |
| **Create a new migration** | `docker compose exec app npm run migrate:make <name>` |

---

## Development & Docker Commands

### Installing Packages
Do not run `npm install` on your host. Use Docker:

```bash
# Add a production dependency
docker compose exec app npm install <package_name>

# Add a development dependency
docker compose exec app npm install --save-dev <package_name>
```

### Viewing Logs
```bash
# Stream app logs
docker compose logs -f app

# Stream MySQL logs
docker compose logs -f mysql
```

### Accessing Containers Shell
```bash
# Express app shell
docker compose exec app sh

# MySQL CLI
docker compose exec mysql mysql -uexpress_js -ppassword express_js
```

### Restarting Services
```bash
docker compose restart app
```
