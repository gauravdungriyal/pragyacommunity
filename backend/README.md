# Pragya Connect - PHP & MySQL Backend

A lightweight, zero-external-dependency REST API backend built in native **PHP (PDO MySQL)** with **JWT Authentication** and 1:1 endpoint parity with the React / Vite frontend.

---

## Features

- **Native PHP & PDO MySQL**: Fast, secure, using prepared statements and BCrypt password hashing.
- **Pure PHP JWT Auth**: Built-in HMAC SHA-256 token generator and validation middleware without requiring third-party Composer packages.
- **Zero-Friction Deployment**: Runs smoothly on **XAMPP**, **WAMP**, **Laragon**, **cPanel/Apache**, **Nginx**, or the PHP CLI built-in web server.
- **Complete Feature Set**:
  - 🔐 **Authentication**: User Registration & JWT Login
  - 📰 **Community Feed**: Posts, Image attachments, Likes, and Nested Comments
  - 📅 **Events**: Workshop & Camp Schedule, User RSVP / Event Registration
  - 🧘 **Mentors**: Mentor profiles with ratings, expertise, and availability
  - 💬 **Messaging & Chat**: Direct threads, conversation history, unread counters, starred/pinned messages, and emoji reactions
  - 🔔 **Notifications**: Real-time alert feed, mark individual/all as read, and clear notifications
  - 📚 **Resources**: Curated yoga study guides and documents
  - 👤 **Profile**: View and update profile name, bio, and role
  - 🛡️ **Admin Suite**: User management, system metrics, reports, and administrative content moderation
  - 🌅 **Dashboard**: Daily inspirational yoga quotes and metrics

---

## Directory Structure

```
backend-php/
├── .htaccess                 # Apache rewrite rules
├── index.php                 # Main REST API entry point & router
├── router.php                # CLI router for PHP built-in server
├── config/
│   ├── db.php                # PDO connection with environment support
│   └── cors.php              # Global CORS headers and preflight handler
├── helpers/
│   ├── response.php          # JSON sendJson / sendError helpers
│   ├── jwt.php               # Native HMAC-SHA256 JWT class
│   └── auth_middleware.php   # Bearer token verification
├── controllers/
│   ├── AuthController.php
│   ├── PostController.php
│   ├── EventController.php
│   ├── MentorController.php
│   ├── MessageController.php
│   ├── NotificationController.php
│   ├── ResourceController.php
│   ├── ProfileController.php
│   ├── AdminController.php
│   └── DashboardController.php
├── db/
│   ├── schema.sql            # MySQL schema & default seed data
│   └── setup_db.php          # One-click DB installer & seeder
└── README.md
```

---

## Quick Start

### 1. Database Setup

Ensure MySQL is running (e.g. via XAMPP or local MySQL service).

#### Option A: One-click setup script (CLI)
```bash
php backend-php/db/setup_db.php
```

#### Option B: One-click setup via Browser (XAMPP)
Open your browser and navigate to:
```
http://localhost/pragyaConnect/backend-php/db/setup_db.php
```

#### Option C: Manual Import in phpMyAdmin
1. Open phpMyAdmin (`http://localhost/phpmyadmin`).
2. Click **Import**.
3. Select `backend-php/db/schema.sql` and execute.

---

### 2. Running the PHP API Server

#### Option A: PHP Built-in Web Server (Recommended for Development)
Run this command from the `backend-php/` directory:
```bash
cd backend-php
php -S 0.0.0.0:5000 router.php
```
The API is now live at `http://localhost:5000/api`.

#### Option B: XAMPP / Apache
1. Copy or link this project into your `C:\xampp\htdocs\` folder.
2. Apache will automatically use `.htaccess` to rewrite requests to `index.php`.

---

## Default Test Credentials

All demo accounts use the password: `password123`

| Role | Email | Password |
|------|-------|----------|
| **Student** | `student@pragya.org` | `password123` |
| **Mentor** | `mentor@pragya.org` | `password123` |
| **Admin** | `admin@pragya.org` | `password123` |

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check & engine status |
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT |
| `GET` | `/api/posts` | Get all feed posts with comments |
| `POST` | `/api/posts/create` | Create a new post |
| `PUT` | `/api/posts/edit/:id` | Edit post content |
| `DELETE` | `/api/posts/delete/:id` | Delete post |
| `PUT` | `/api/posts/like/:id` | Toggle like on post |
| `POST` | `/api/posts/comment` | Add comment |
| `DELETE` | `/api/posts/comment/:id` | Delete comment |
| `GET` | `/api/events/calendar` | List upcoming workshops & camps |
| `POST` | `/api/events/create` | Create an event |
| `POST` | `/api/events/register` | Register / RSVP for event |
| `GET` | `/api/mentors` | List mentors & teachers |
| `GET` | `/api/messages/conversations?user=...` | List conversations |
| `GET` | `/api/messages/history?user1=...&user2=...` | Chat thread history |
| `POST` | `/api/messages/send` | Send direct message |
| `PUT` | `/api/messages/read` | Mark conversation read |
| `PUT` | `/api/messages/pin/:id` | Toggle pin message |
| `PUT` | `/api/messages/star/:id` | Toggle star message |
| `PUT` | `/api/messages/react/:id` | Add or update emoji reaction |
| `GET` | `/api/notifications?user=...` | Get notifications |
| `PUT` | `/api/notifications/read-all` | Mark all notifications read |
| `PUT` | `/api/notifications/read/:id` | Mark single notification read |
| `DELETE` | `/api/notifications/clear-all?user=...` | Clear user notifications |
| `GET` | `/api/resources` | Get all resources |
| `POST` | `/api/resources/create` | Create resource |
| `GET` | `/api/profile/:id` | Get user profile |
| `PUT` | `/api/profile/:id` | Update user profile |
| `GET` | `/api/admin/users` | List all users (Admin) |
| `GET` | `/api/admin/stats` | Get system overview stats |
| `GET` | `/api/admin/reports` | Get reports counts |
| `GET` | `/api/dashboard/quote` | Daily inspirational yoga quote |
