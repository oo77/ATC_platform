# 🚀 Quick Deployment Guide

## 1. Preparation

Run the deployment check script to ensure everything is ready:

```bash
npm run check:deploy
```

Fix any errors or warnings reported.

## 2. Build the Project

Create a production build:

```bash
npm run build
```

This will generate the `.output` directory.

## 3. Create Deployment Package

Run the script to package only the necessary files:

```powershell
./scripts/create-deploy-minimal.ps1
```

This will create a `deploy-minimal` folder and a zip archive.

## 4. Upload to Server

1. Upload the generated zip file to your cPanel hosting at `/home/intrauz1/atc/`.
2. Extract the archive.

## 5. Install Dependencies on Server

SSH into your server and run:

```bash
cd /home/intrauz1/atc/server
npm install --omit=dev --omit=optional --no-package-lock
```

_Note: This installs only production dependencies, keeping the size small._

## 6. Configure Environment

1. Setup your `.env` file in the root directory if not already present.
2. Ensure database credentials and JWT secrets are correct.

## 7. Restart Application

Touch the restart file to trigger a reload:

```bash
touch /home/intrauz1/atc/tmp/restart.txt
```

## 8. Verify

Visit your site URL to verify the deployment.
If you see errors, check the logs in cPanel or `server/logs` (if configured).
