# 🚀 Deployment Guide: Hospital OS on Vercel

Since we have migrated your project to **Next.js and Prisma**, the deployment to Vercel is highly streamlined. Follow these steps to take your project live.

## 1. Database Setup (CRITICAL)
Vercel's serverless environment does not support local SQLite files (`dev.db`). You must use a hosted database.
- **Recommended**: [Vercel Postgres](https://vercel.com/storage/postgres) or [Supabase](https://supabase.com/).
- **Step**: Create a database and copy the **Connection String** (starts with `postgres://...` or `postgresql://...`).

## 2. Prepare `schema.prisma`
In your `prisma/schema.prisma` file, change the provider to match your new database:
```prisma
datasource db {
  provider = "postgresql" // or "mysql"
  url      = env("DATABASE_URL")
}
```

## 3. Environment Variables
You must set these in the **Vercel Dashboard** (Settings > Environment Variables):
- `DATABASE_URL`: Your new database connection string.
- `JWT_SECRET`: A long, random string for secure sessions.
- `ENCRYPTION_KEY`: A 32-character string for AES-256 data encryption.

## 4. Deploying via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and click **"Add New"** > **"Project"**.
2. Import your GitHub repository: `MuhammadUmer2004-sys/GDPR-Compliant-Mini-Hospital-Management-System`.
3. In **Build & Development Settings**, Vercel will automatically detect Next.js.
4. Expand **"Environment Variables"** and add the keys from Step 3.
5. Click **"Deploy"**.

## 5. Initialize the Database
Once deployed, you need to push your schema and seed the initial users (admin, doctor, etc.):
1. Open the Vercel CLI or use the **"Logs"** / **"Deployment"** tab.
2. Alternatively, you can run these locally once pointing to the remote DB:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

## ✅ Why Vercel?
- **Serverless Backend**: Your API routes (`/api/patients`, etc.) automatically scale.
- **Global Edge Network**: Your professional UI will load instantly worldwide.
- **Auto-SSL**: Vercel handles all HTTPS certificates for GDPR compliance.

---
**Your GitHub is already updated with the latest code.** You can start the Vercel import right now!
