# Environment Setup Guide

## Node.js Requirements

- Version: Node.js 18 or later
- Check version: `node -v`

## Database Setup (MySQL/MariaDB)

1. **Create Database:**
   ```sql
   CREATE DATABASE atc_platform;
   ```
2. **Create User:**
   ```sql
   CREATE USER 'atc_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON atc_platform.* TO 'atc_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

## Environment Variables (.env)

Create a `.env` file in the root directory based on `.env.example`.

### Required Variables:

- **Database:**
  - `DATABASE_HOST`: Hostname (e.g., localhost)
  - `DATABASE_PORT`: Port (default: 3306)
  - `DATABASE_NAME`: Database name (e.g., atc_platform)
  - `DATABASE_USER`: Database user
  - `DATABASE_PASSWORD`: Database password

- **Authentication:**
  - `JWT_SECRET`: Random string for JWT signing
  - `REFRESH_TOKEN_SECRET`: Random string for refresh tokens

- **Storage:**
  - `STORAGE_DRIVER`: 'fs' (local file system) or 's3' (if configured)
  - `UPLOADS_DIR`: Path to uploads (e.g., storage/uploads)

## Running Migrations

Run the migrations to set up the database schema:

```bash
npm run db:migrate
```

## Running Seeds (Optional)

To seed initial data:

```bash
npm run db:seed
```

## Verify Setup

Check connection and status:

```bash
npm run check:deploy
```
