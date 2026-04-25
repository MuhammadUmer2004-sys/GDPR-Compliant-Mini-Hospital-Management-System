# GDPR-Compliant Hospital Management System (Vercel Edition)

This is a modern, professional migration of the original Hospital Management System. It features a Next.js frontend with premium glassmorphism design and a Serverless Node.js backend.

## 🚀 Deployment to Vercel

1. **Push this repository to GitHub.**
2. **Connect to Vercel**: Import the project in Vercel.
3. **Database Setup**:
   - Vercel uses a serverless environment, so the local SQLite `dev.db` will not work.
   - Go to the **Storage** tab in your Vercel project and create a **Vercel Postgres** database.
   - Vercel will automatically add the `POSTGRES_URL` and other environment variables.
4. **Environment Variables**:
   - Add `JWT_SECRET` (any random string).
   - Add `ENCRYPTION_KEY` (a 32-character string for AES-256).
   - Change `DATABASE_URL` in your `.env` (or Vercel settings) to point to the Postgres URL.
5. **Switch to Postgres**:
   - In `prisma/schema.prisma`, change the provider from `"sqlite"` to `"postgresql"`.
   - Change the `url` to `env("POSTGRES_PRISMA_URL")` or `env("DATABASE_URL")` as provided by Vercel.
6. **Deploy**:
   - Vercel will run `prisma generate` and `next build`.
   - You can run `npx prisma db push` or `npx prisma migrate deploy` via the Vercel CLI or as a build step to sync the schema.

## 🛠 Local Development

1. Install dependencies: `npm install`
2. Sync database: `npx prisma db push`
3. Seed users: `npx prisma db seed`
4. Run dev server: `npm run dev`

## 🔐 Security Features

- **RBAC**: Admin, Doctor, and Receptionist roles with restricted views.
- **GDPR Compliance**: 
  - Deterministic anonymization of names.
  - Masking of contact numbers.
  - AES-256 encryption for sensitive data.
  - Audit logging of all actions.
- **Modern UI**: Clean, premium design with glassmorphism and animated transitions.

---
Original Python project files are located in the `legacy_python/` directory.
