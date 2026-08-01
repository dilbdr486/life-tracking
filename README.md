# LifeFlow

Personal **Time & Money Management** app built with **Next.js** (App Router), **Server Actions**, **Auth.js**, **MongoDB + Mongoose**, and **Tailwind CSS**. Designed for free-tier **Vercel** deployment.

## Features (Phase 1 MVP)

- Authentication: register, login, forgot/reset password, profile
- Dashboard: today's stats, activities, expenses, budget remaining, quick adds
- Activity tracker: CRUD, auto duration, daily/weekly/monthly views
- Expense tracker: CRUD, search, category filter
- Budget: income, monthly budget, category budgets, savings goal
- Reports & charts: pie/bar/line for time and money
- Notifications: reminders, budget warnings, goal alerts
- Dark / light mode (system-aware)

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions) |
| Auth | Auth.js (NextAuth v5) credentials + JWT |
| Database | MongoDB + Mongoose |
| UI | Tailwind CSS 4 + Recharts |
| Theme | `next-themes` |

## Local setup

1. Start MongoDB (Docker example):

```bash
docker run -d --name lifeflow-mongo -p 27017:27017 mongo:7
```

Or use a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster and set `MONGODB_URI` in `.env`.

2. Install and run:

```bash
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create an account from **Register**.

Generate a strong `AUTH_SECRET` for production:

```bash
openssl rand -base64 32
```

## Deploy on Vercel (free)

1. Create a free MongoDB Atlas cluster and database user.
2. Allow network access (`0.0.0.0/0` for Vercel, or Atlas VPC options).
3. Copy the connection string into Vercel env as `MONGODB_URI`.
4. Also set:

- `AUTH_SECRET`
- `AUTH_URL` / `NEXTAUTH_URL` → your Vercel URL

```bash
npx vercel
```

## Project structure

```
src/
  actions/          # Server Actions (CRUD + auth)
  app/              # Routes (landing, auth, dashboard)
  components/       # UI, charts, feature managers
  lib/              # db, auth, stats, validations
  models/           # Mongoose models
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start local server |
| `npm run build` | Production build |
