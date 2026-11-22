# Deployment Guide — NutriVisionAI

## Architecture Overview

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React + Vite | Deploy to Vercel / Netlify |
| Backend | Node.js + Express | Deploy to Railway / Render / Fly.io |
| Database | PostgreSQL | Neon / Supabase / Railway Postgres |
| File Storage | Local disk (avatars) | ⚠️ See note below |

---

## 1 · Backend (Railway / Render / Fly.io)

### Environment variables

Copy `backend/.env.example` → `backend/.env` for local dev.  
On your host, set all variables via the platform's dashboard (never commit `.env`).

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Full PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Long random string (64+ bytes) |
| `FRONTEND_URL` | ✅ | Deployed frontend URL (CORS) — comma-separate multiple |
| `PORT` | auto | Usually set by host; defaults to `5000` |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `OPENAI_API_KEY` | optional | Fallback AI |
| `NEMOTRON_API_KEY` | optional | Fallback AI |
| `USDA_API_KEY` | ✅ | get a free key at https://fdc.nal.usda.gov/api-key-signup.html |
| `SMTP_*` | optional | Email notifications |
| `VAPID_*` | optional | Web push notifications |

### Database migrations

The server runs `sequelize.sync({ alter: true })` on startup — tables are auto-created/altered.  
For first-run seeding: `node backend/seed_data.js`

> [!IMPORTANT]
> `connectDB()` now **throws** on failure, so the server process will exit (non-zero) if PostgreSQL is unreachable. Your host will show the error in logs and not mark the deploy as healthy.

---

## 2 · Frontend (Vercel)

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | see below | Backend URL |

**Same-origin deployment** (Vercel rewrite or unified host): leave `VITE_API_BASE_URL` unset — the axios client defaults to `"/"` and Vite's proxy handles `/api` in dev.

**Separate-origin deployment** (frontend on Vercel, backend on Railway):
1. Set `VITE_API_BASE_URL=https://your-backend.railway.app` in Vercel project settings.
2. Add a `vercel.json` rewrite OR set CORS on the backend to allow your Vercel domain.

#### Vercel rewrite approach (recommended — keeps same origin)

```json
// frontend/vercel.json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://your-backend.railway.app/api/:path*" },
    { "source": "/uploads/:path*", "destination": "https://your-backend.railway.app/uploads/:path*" }
  ]
}
```

With this in place, `VITE_API_BASE_URL` can remain unset.

---

## 3 · File Uploads (Avatar images) ⚠️

Currently avatars are stored on the **backend server's local filesystem** (`public/uploads/avatars/`).

**Problem**: Most PaaS hosts (Railway, Render, Fly.io) have **ephemeral filesystems** — files are wiped on each redeploy or restart.

**Options**:

| Option | Effort | Cost |
|--------|--------|------|
| ✅ **Cloudinary** (recommended) | Low | Free tier available |
| AWS S3 / Cloudflare R2 | Medium | Cheap |
| Persistent volume (Railway / Fly.io) | Low | Small monthly fee |

Until cloud storage is wired up, avatar uploads will work locally but **will not persist across backend redeployments**.

---

## 4 · CORS checklist

Before going live:
- [ ] Set `FRONTEND_URL` on the backend host to your exact Vercel URL (e.g. `https://nutrivision.vercel.app`)
- [ ] Remove or gate the local dev origins in production if desired (`NODE_ENV=production` check)

---

## 5 · Quick-start (local)

```bash
# Backend
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev            # starts on :5000

# Frontend
cd frontend
cp .env.example .env   # optional — only needed for separate-origin
npm install
npm run dev            # starts on :5173, proxies /api → :5000
```
