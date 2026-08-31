# Pragya Connect

A community platform for the Pragya Yog community — bringing students, teachers, and mentors together in one place.

Members can share posts in a community feed, discover mentors, register for yoga workshops and events, browse curated learning resources, chat with each other, and manage their profiles. Admins get a dedicated panel for user management, content moderation, and broadcasts.

## Features

- 🔐 **Authentication** — registration and JWT login with access + refresh tokens
- 📰 **Community Feed** — posts with images, likes, and comments
- 🧘 **Mentors** — mentor directory with expertise, availability, and ratings
- 📅 **Events** — workshop/camp calendar with RSVP and favorites
- 📚 **Resources** — curated yoga guides and documents
- 💬 **Messages** — direct chat with reactions, pins, and stars
- 🔔 **Notifications** — alert feed with read/clear controls
- 👤 **Profile & Settings** — profile editing, password change, notification preferences, dark mode
- 🛡️ **Admin Panel** — user management, stats, reports, moderation, broadcasts

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Axios |
| Backend | PHP (native, no framework) with PDO |
| Database | MySQL |
| Auth | JWT (HMAC-SHA256, dependency-free implementation) |

## Project Structure

```
pragyacommunity/
├── frontend/          # React + TypeScript + Vite app
│   ├── src/
│   │   ├── api/       # Axios client & typed API services
│   │   ├── components/# Layout, guards, shared UI
│   │   ├── context/   # Auth, Theme (dark mode), Notifications
│   │   └── pages/     # Feature pages (dashboard, feed, events, ...)
│   └── public/        # Fonts & static assets
├── backend/           # PHP REST API + action dispatcher
│   ├── controllers/   # One controller per feature
│   ├── config/        # DB connection & CORS
│   ├── helpers/       # JWT, responses, auth middleware
│   └── db/            # schema.sql + setup script
└── docs/branding/     # Logo & colour palette
```

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **PHP** 8+ (XAMPP works fine on Windows)
- **MySQL** 5.7+ / MariaDB (e.g. via XAMPP)

### 1. Install dependencies

```bash
npm install            # root tooling (concurrently)
npm run install:all    # frontend dependencies
```

### 2. Configure environment

```bash
cp frontend/.env.example frontend/.env
```

The backend reads `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` from the environment and falls back to `127.0.0.1:3306`, database `pragya_connect`, user `root` with an empty password (XAMPP defaults).

### 3. Set up the database

Make sure MySQL is running, then:

```bash
npm run setup:db
```

This creates the `pragya_connect` database, all tables, and demo seed data.

### 4. Run the app

```bash
npm run dev
```

This starts both servers:

- **Backend API** — http://localhost:5000 (PHP built-in server)
- **Frontend** — http://localhost:5173 (Vite dev server, proxies `/api*` to the backend)

Or run them separately with `npm run dev:backend` / `npm run dev:frontend`.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Student | `student@pragya.org` | `password123` |
| Mentor | `mentor@pragya.org` | `password123` |
| Admin | `admin@pragya.org` | `password123` |

## API

The backend exposes two API styles side by side:

- **REST routes** under `/api/...` (see [`backend/README.md`](backend/README.md) for the full endpoint table)
- **Action-based dispatcher** at `/api.php` / `/api_v2.php` (POST with an `action` field), matching the live production protocol

## Building for Production

```bash
npm run build
```

Type-checks and builds the frontend into `frontend/dist/`. Deploy the `backend/` folder to any PHP host (Apache/Nginx/cPanel — an `.htaccess` is included).
