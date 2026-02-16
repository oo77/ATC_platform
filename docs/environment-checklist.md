# Application Deployment Checklist

## Environment

- [ ] Node.js v18+ installed on the server
- [ ] SSH access configured
- [ ] Database (MySQL/MariaDB) created and accessible
- [ ] Environment Variables (`.env`) copied and configured
  - [ ] `DATABASE_HOST` (e.g., localhost)
  - [ ] `DATABASE_PORT` (e.g., 3306)
  - [ ] `DATABASE_NAME` (e.g., atc_platform)
  - [ ] `DATABASE_USER`
  - [ ] `DATABASE_PASSWORD`
  - [ ] `JWT_SECRET` (Use a strong random string)
  - [ ] `REFRESH_TOKEN_SECRET` (Use a strong random string)
  - [ ] `NITRO_PRESET` set to `node-server` if using Passenger

## Files & Folders

- [ ] `server/` folder uploaded
- [ ] `.output/` contents in place (if using build)
- [ ] `public/` folder uploaded (for static assets)
- [ ] `.htaccess` configured for Passenger (if cPanel)
- [ ] `package.json` referencing production start script

## Application Setup

- [ ] `npm install --omit=dev` runs successfully
- [ ] `npm run check:deploy` reports no critical errors locally
- [ ] Application starts successfully (`npm run start` or via Passenger)
- [ ] Database migrations run (`npm run db:migrate`)

## Post-Deployment

- [ ] Verify site loads correctly
- [ ] Check console for errors
- [ ] Verify API endpoints are responding
- [ ] Verify database connection via logs or app functionality
