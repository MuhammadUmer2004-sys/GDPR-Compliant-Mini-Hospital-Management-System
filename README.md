# GDPR-Compliant Hospital Management System (Vercel Edition)

This is a modern, professional migration of the original Hospital Management System. It features a Next.js frontend with premium glassmorphism design and a Serverless Node.js backend.

## 🚀 Deployment to Vercel

1. **Push this repository to GitHub.**
2. **Connect to Vercel**: Import the project in Vercel.
3. **Database Setup**:
   - This project uses **MongoDB Atlas**.
   - Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Get your connection string (e.g., `mongodb+srv://...`).
4. **Environment Variables**:
   - Go to **Settings > Environment Variables** in Vercel.
   - Add `DATABASE_URL`: Your MongoDB connection string.
   - Add `JWT_SECRET`: A long, random string.
   - Add `ENCRYPTION_KEY`: A 32-character string for AES-256 data encryption.
5. **IP Whitelisting**:
   - In MongoDB Atlas, go to **Network Access** and select **"Allow Access from Anywhere"** (0.0.0.0/0) to allow Vercel to connect.
6. **Deploy**:
   - Vercel will automatically run `prisma generate` and `next build`.


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
