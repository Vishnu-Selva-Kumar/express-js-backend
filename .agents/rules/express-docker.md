# Express Docker Execution Rules

## Environment Setup
- Local Node.js and npm are **NOT** installed on the host system.
- All CLI commands related to Node.js, npm, npx, Knex, and Testing **MUST** be executed inside the running Docker container shell.

## Docker Execution Context
- **Target container:** `node-express-app` (or service `app` via Docker Compose)
- **Database container:** `node-mysql`
- **Non-interactive (automated) syntax:** `docker exec node-express-app <command>` or `docker compose exec app <command>`
- **Interactive shell syntax:** `docker exec -it node-express-app sh`

## Command Standards

### npm / Package Management Commands
```bash
# DO NOT run on host:
npm install <package>
npm run <script>

# DO run inside container:
docker exec node-express-app npm install <package>
docker exec node-express-app npm install --save-dev <package>
docker exec node-express-app npm run <script>
# or using docker compose:
docker compose exec app npm install <package>
```

### Knex & Migration Commands
```bash
# DO NOT run on host:
npx knex migrate:latest
npx knex migrate:make <migration_name>
npx knex migrate:rollback

# DO run inside container:
docker exec node-express-app npm run migrate
docker exec node-express-app npx knex migrate:latest
docker exec node-express-app npx knex migrate:make <migration_name>
docker exec node-express-app npx knex migrate:rollback
# or using docker compose:
docker compose exec app npm run migrate
```

### Database Inspection Commands (MySQL)
```bash
# DO NOT attempt local mysql CLI on host.

# DO run inside MySQL container:
docker exec -i node-mysql mysql -uexpress_js -ppassword -e "USE express_js; SHOW TABLES;"
docker exec -i node-mysql mysql -uexpress_js -ppassword -e "USE express_js; DESCRIBE <table_name>;"
```

### Running Tests
```bash
# DO NOT run on host:
npm test

# DO run inside container:
docker exec node-express-app npm test
# or using docker compose:
docker compose exec app npm test
```

## Agent Execution Guidelines
1. **Always verify the container is running first:** `docker ps --filter name=node-express-app`
2. **Wrap every Node/npm/npx/Knex command** inside `docker exec node-express-app ...` or `docker compose exec app ...`
3. The host project workspace root is volume-synced to `/app` inside the container.
4. **Never attempt `node`, `npm`, or `npx` directly on the host shell.**
