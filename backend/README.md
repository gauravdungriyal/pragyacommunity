# Pragya Connect - PHP & MySQL Backend

A lightweight, zero-external-dependency REST API backend built in native **PHP (PDO MySQL)** with **JWT Authentication** and 1:1 endpoint parity with the React / Vite frontend.

---

## Features

- **Native PHP & PDO MySQL**: Fast, secure, using prepared statements and BCrypt password hashing.
- **Pure PHP JWT Auth**: Built-in HMAC SHA-256 token generator and validation middleware without requiring third-party Composer packages.
- **Zero-Friction Deployment**: Runs smoothly on **XAMPP**, **WAMP**, **Laragon**, **cPanel/Apache**, **Nginx**, or the PHP CLI built-in web server.
- **Complete Feature Set**:
  - 🔐 **Authentication**: JWT login with access & refresh tokens (accounts are created by an administrator)
  - 🎓 **Courses**: Course records, enrolments, per-course group chat and course-specific material
  - 📚 **Resources**: Course material plus a general shelf, with admin-managed category filters
  - 📅 **Events**: Scoped listings, per-event detail, idempotent booking and cancellation, favourites
  - 📰 **Community Feed**: Posts, images, one-like-per-member, and nested comments
  - 💬 **Messaging & Chat**: Direct threads and course group chats, unread counters, starred/pinned messages, emoji reactions
  - 🔔 **Notifications**: Platform-wide, course-scoped and individual delivery, with read/clear controls
  - 🧘 **Mentors**: Mentor profiles with expertise and availability
  - 👤 **Profile**: Read and update name, phone, bio, expertise, skills and notification preferences
  - 🛡️ **Admin Suite**: Member and course management, moderation, and targeted announcements
  - 🌅 **Dashboard**: Per-member summary of today's classes, courses, activity and counters

---

## Directory Structure

```
backend/
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
├── api.php                   # Action-based dispatcher (/api_v2.php protocol)
├── controllers/
│   ├── AuthController.php
│   ├── PostController.php
│   ├── EventController.php
│   ├── CourseController.php  # Courses, enrolments, and the activity log
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
php backend/db/setup_db.php
```

#### Option B: One-click setup via Browser (XAMPP)
Open your browser and navigate to:
```
http://localhost/pragyacommunity/backend/db/setup_db.php
```

#### Option C: Manual Import in phpMyAdmin
1. Open phpMyAdmin (`http://localhost/phpmyadmin`).
2. Click **Import**.
3. Select `backend/db/schema.sql` and execute.

---

### 2. Running the PHP API Server

#### Option A: PHP Built-in Web Server (Recommended for Development)
Run this command from the `backend/` directory:
```bash
cd backend
php -S 0.0.0.0:5000 router.php
```
The API is now live at `http://localhost:5000/api`.

#### Option B: XAMPP / Apache
1. Copy or link this project into your `C:\xampp\htdocs\` folder.
2. Apache will automatically use `.htaccess` to rewrite requests to `index.php`.

---

## Default Test Credentials

All seeded accounts use the password: `password123`

| Role | Email |
|------|-------|
| **Student** | `student@pragya.org` |
| **Mentor** | `mentor@pragya.org` |
| **Teacher** | `aarya@pragya.com` |
| **Admin** | `admin@pragya.org` |

---

## API Endpoints Summary

Endpoints marked **auth** read the caller from the `Authorization: Bearer` token
rather than trusting an id in the request body. **staff** means Mentor, Teacher
or Admin; **admin** means Admin only.

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/health` | Health check & engine status | — |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT | — |
| `GET` | `/api/dashboard/summary` | Today's classes, courses, activity, counters | auth |
| `GET` | `/api/dashboard/quote` | Daily inspirational yoga quote | — |
| `GET` | `/api/posts` | Feed posts with comments and the caller's like state | — |
| `POST` | `/api/posts/create` | Create a post | auth |
| `PUT` | `/api/posts/edit/:id` | Edit post content | auth |
| `DELETE` | `/api/posts/delete/:id` | Delete post | auth |
| `PUT` | `/api/posts/like/:id` | Toggle the caller's like (one per member) | auth |
| `POST` | `/api/posts/comment` | Add comment | auth |
| `DELETE` | `/api/posts/comment/:id` | Delete comment | auth |
| `GET` | `/api/events?scope=…` | Events by scope: `upcoming` (default), `today`, `past`, `mine`, `favorites`, `all`. Supports `limit`/`offset`. | — |
| `GET` | `/api/events/:id` | Single event, with booking & favourite state | — |
| `GET` | `/api/events/my-registrations` | Events the caller has booked | auth |
| `POST` | `/api/events/create` | Create an event | staff |
| `POST` | `/api/events/register` | Book a place (idempotent) | auth |
| `DELETE` | `/api/events/register/:id` | Cancel a booking | auth |
| `DELETE` | `/api/events/:id` | Delete an event | staff |
| `GET` | `/api/courses` | All courses, flagged with the caller's enrolment | — |
| `GET` | `/api/courses/mine` | Courses the caller is enrolled on or teaches | auth |
| `POST` | `/api/courses/create` | Create a course | staff |
| `PUT` | `/api/courses/:id/enroll` | Join or leave a course | auth |
| `GET` | `/api/courses/:id/members` | Enrolled members | auth |
| `DELETE` | `/api/courses/:id` | Delete a course | admin |
| `GET` | `/api/resources` | Resources; filter with `course_id`, `category`, `search` | — |
| `POST` | `/api/resources/create` | Upload a resource (course-specific or general) | staff |
| `PUT` | `/api/resources/:id` | Update a resource | staff |
| `DELETE` | `/api/resources/:id` | Delete a resource | staff |
| `GET` | `/api/resources/categories` | Library filters | — |
| `POST` | `/api/resources/categories` | Create a filter | admin |
| `DELETE` | `/api/resources/categories/:id` | Delete a filter | admin |
| `GET` | `/api/mentors` | List mentors & teachers | — |
| `GET` | `/api/messages/conversations?user=...` | Direct conversations | — |
| `GET` | `/api/messages/history?user1=...&user2=...` | Direct thread history | — |
| `POST` | `/api/messages/send` | Send a direct message | — |
| `PUT` | `/api/messages/read` | Mark a conversation read | — |
| `GET` | `/api/messages/groups` | Course group chats, with unread counts | auth |
| `GET` | `/api/messages/group/:courseId` | Group chat history (marks it read) | auth |
| `POST` | `/api/messages/group/send` | Post into a course group chat | auth |
| `PUT` | `/api/messages/pin/:id` | Toggle pin message | — |
| `PUT` | `/api/messages/star/:id` | Toggle star message | — |
| `PUT` | `/api/messages/react/:id` | Add or update emoji reaction | — |
| `GET` | `/api/notifications` | The caller's notifications | auth |
| `PUT` | `/api/notifications/read-all` | Mark all read | auth |
| `PUT` | `/api/notifications/read/:id` | Mark one read | auth |
| `DELETE` | `/api/notifications/clear-all` | Clear all | auth |
| `POST` | `/api/notifications/course` | Notify everyone enrolled on a course | staff |
| `GET` | `/api/profile/:id` | Get user profile | — |
| `PUT` | `/api/profile/:id` | Update user profile | — |
| `GET` | `/api/admin/users` | List all members | admin |
| `DELETE` | `/api/admin/user/:id` | Delete a member | admin |
| `GET` | `/api/admin/stats` | System overview stats | admin |
| `POST` | `/api/admin/broadcast` | Announcement to everyone (`target: all`) or one member (`target: user` + `user_id`) | admin |

### Action-based endpoint

The React app also posts to `/api_v2.php` (and `/api.php`) with an `action`
field, matching the live production protocol. Actions include `login`,
`check-token`, `get-profile`, `edit_user_details`, `passwrod_change`,
`update-notification-settings`, `welcome-seen`, `emergency-contact`, `wallet`,
`upcoming-events`, `upcoming-event-detail`, `event-toggle-favorite`,
`event-favorites`, `get-notification` and `del-notification`.
