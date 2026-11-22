# Production Deployment Guide — NutriVisionAI

This guide details deployment of NutriVisionAI for the target architecture:
- **Frontend**: [Vercel](https://vercel.com/)
- **Backend**: [Render](https://render.com/)
- **Database**: [Supabase](https://supabase.com/) (Managed PostgreSQL)

---

## 1 · Database Setup (Supabase PostgreSQL)

1. Create a new project in [Supabase](https://supabase.com/).
2. In Supabase Dashboard, navigate to **Project Settings** → **Database**.
3. Under **Connection string**, select **URI**:
   - For direct connections (Render long-running servers): Use **Direct connection** (port `5432`):
     ```text
     postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require
     ```
   - For IPv4/pooled connections: Use **Transaction pooler** (port `6543`):
     ```text
     postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
     ```
4. **SSL is automatically supported**: The backend code detects Supabase connection strings and enables `dialectOptions.ssl = { require: true, rejectUnauthorized: false }`.
5. **Initial Schema Sync**: When the backend starts up, Sequelize automatically initializes the schema with `force: false, alter: true` (no existing tables or data are ever dropped).
6. Optional sample data: Run `node backend/seed_data.js` with your `DATABASE_URL` set to seed initial test foods and goals.

---

## 2 · Backend Deployment (Render Web Service)

1. In [Render Dashboard](https://dashboard.render.com/), click **New** → **Web Service**.
2. Connect your GitHub repository: `https://github.com/likithg2/NutriVisionAI`.
3. Configure the service settings:
   - **Name**: `nutrivisionai-backend`
   - **Region**: Choose region closest to your Supabase database (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (or Starter for 24/7 zero-spin-down)
4. Add the **Health Check Path**: `/health` (or `/api/health`).
5. In **Environment Variables**, add:

| Key | Value / Instructions |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your Supabase connection string (`...sslmode=require`) |
| `DB_CA_CERT_PATH` | (Optional) Path to CA cert for strict verification (e.g. `/etc/secrets/prod-ca-2021.crt`). If omitted, standard cloud SSL (`rejectUnauthorized: false`) is used. |
| `JWT_SECRET` | 64+ char random string (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` (your actual Vercel domain) |
| `ALLOWED_ORIGINS` | `https://your-frontend.vercel.app` |
| `GEMINI_API_KEY` | Your Google Gemini API Key |
| `USDA_API_KEY` | Your USDA API Key (or `DEMO_KEY`) |
| `WEB_PUSH_PUBLIC_VAPID_KEY` | (Optional) VAPID public key for push notifications |
| `WEB_PUSH_PRIVATE_VAPID_KEY` | (Optional) VAPID private key |
| `WEB_PUSH_CONTACT` | (Optional) `mailto:your-email@domain.com` |

> [!NOTE]
> Render provides `PORT` automatically; the server listens on `0.0.0.0` at `process.env.PORT`.

---

## 3 · Frontend Deployment (Vercel)

1. In [Vercel Dashboard](https://vercel.com/dashboard), click **Add New** → **Project**.
2. Import your GitHub repository: `https://github.com/likithg2/NutriVisionAI`.
3. Configure the build settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Add **Environment Variables**:
   - `VITE_API_BASE_URL` = `https://your-backend-name.onrender.com` (your Render backend URL without trailing slash)
5. **SPA Routing**: `frontend/vercel.json` is included in the project to route all client-side navigation (`/kitchen`, `/calories`, `/login`) to `/index.html` without 404 errors.

---

## 4 · File Uploads & Avatars Notice

- Food scanner images (`POST /api/ai/scan`) use in-memory buffers sent directly to the Gemini Vision API and never touch server disk.
- User profile avatars (`POST /api/users/me/avatar`) are currently stored locally in `backend/public/uploads/avatars/`.
- On Render's Free tier, the filesystem is ephemeral (uploaded images reset when the service spins down or restarts).
- For persistent avatar storage across restarts on Render:
  - Option A: Add a Render **Persistent Disk** mounted at `/var/data/uploads` and set environment variable `UPLOADS_DIR=/var/data/uploads`.
  - Option B: Integrate cloud object storage (e.g. Supabase Storage, AWS S3, or Cloudinary).
