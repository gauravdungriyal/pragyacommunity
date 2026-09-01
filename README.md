# Pragya Connect

A community platform for the Pragya Yog community — bringing students, teachers, and mentors together in one place.

Members can share posts in a community feed, discover mentors, register for yoga workshops and events, browse curated learning resources, chat with each other, and manage their profiles. Admins get a dedicated panel for user management, content moderation, and broadcasts.

## Features

- 🔐 **Authentication** — JWT login with access + refresh tokens. Accounts are created by the Pragya team; there is no public sign-up.
- 🏠 **Dashboard** — the member's own day: classes they booked for today, next sessions, enrolled courses, a recent-activity trail and personal counters
- 🎓 **Courses** — each course has its own resource shelf and group chat; admins create courses and assign mentors
- 📚 **Resource Library** — course material grouped by course, plus an open "Extra Resources" shelf for everyone. Admins manage the category filters.
- 📅 **Events** — browsed by scope (upcoming, today, my bookings, favourites, past), each with its own page and instant booking
- 📰 **Community Feed** — posts with images, one like per member, comments and shareable links
- 💬 **Messages** — course group chats and one-to-one conversations side by side
- 🔔 **Notifications** — delivered in-app and as browser push; scoped platform-wide, per course (sent by mentors) or to one individual. Full history with search and CSV export.
- 🧘 **Mentors** — directory with expertise and availability; session requests go straight to the mentor's inbox
- 👤 **Profile & Settings** — profile editing synced with the API, password change, notification preferences, dark mode
- 🛡️ **Admin Panel** — members, courses, content moderation and targeted announcements

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

The seed data creates these accounts for local development (password `password123` for all):

| Role | Email |
|------|-------|
| Student | `student@pragya.org` |
| Mentor | `mentor@pragya.org` |
| Teacher | `aarya@pragya.com` |
| Admin | `admin@pragya.org` |

Roles decide what is visible: mentors and teachers can publish events and upload course material, and admins additionally manage members, courses, library filters and announcements.

## API

The backend exposes two API styles side by side:

- **REST routes** under `/api/...` (see [`backend/README.md`](backend/README.md) for the full endpoint table)
- **Action-based dispatcher** at `/api.php` / `/api_v2.php` (POST with an `action` field), matching the live production protocol

## Building for Production

```bash
npm run build
```

Type-checks and builds the frontend into `frontend/dist/`. Deploy the `backend/` folder to any PHP host (Apache/Nginx/cPanel — an `.htaccess` is included).
