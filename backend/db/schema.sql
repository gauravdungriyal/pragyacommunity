-- ==========================================================
-- Pragya Connect - MySQL Database Schema & Seed Data
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `pragya_connect` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `pragya_connect`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(191) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('Student', 'Teacher', 'Mentor', 'Admin') DEFAULT 'Student',
    `phone` VARCHAR(50) NULL DEFAULT '',
    `avatar` VARCHAR(255) DEFAULT 'default.jpg',
    `expertise` VARCHAR(255) DEFAULT 'Vedic Sciences & Asana',
    `skills` TEXT NULL,
    `bio` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Posts Table
CREATE TABLE IF NOT EXISTS `posts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `content` TEXT NOT NULL,
    `image` VARCHAR(500) DEFAULT '',
    `category` VARCHAR(100) DEFAULT 'Yoga & Asana',
    `likes` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Comments Table
CREATE TABLE IF NOT EXISTS `comments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `post_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `comment_text` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Events Table
CREATE TABLE IF NOT EXISTS `events` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `date` DATE NOT NULL,
    `time` VARCHAR(50) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) DEFAULT 'Yoga Workshops',
    `course_id` INT NULL,
    `is_free` TINYINT(1) DEFAULT 1,
    `amount` DECIMAL(10,2) DEFAULT 0.00,
    `image` VARCHAR(500) DEFAULT '',
    `likes_count` INT DEFAULT 0,
    `created_by` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Event Registrations Table
CREATE TABLE IF NOT EXISTS `event_registrations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `event_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Mentors Profile Table
CREATE TABLE IF NOT EXISTS `mentors` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL UNIQUE,
    `expertise` VARCHAR(255) NOT NULL,
    `availability` VARCHAR(100) NOT NULL,
    `bio` TEXT NOT NULL,
    `rating` DECIMAL(3,2) DEFAULT 0.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Messages Table
CREATE TABLE IF NOT EXISTS `messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `sender` VARCHAR(191) NOT NULL,
    `recipient` VARCHAR(191) NULL,
    `course_id` INT NULL,
    `text` TEXT,
    `attachments` JSON NULL,
    `reactions` JSON NULL,
    `is_read` TINYINT(1) DEFAULT 0,
    `pinned` TINYINT(1) DEFAULT 0,
    `starred` TINYINT(1) DEFAULT 0,
    `reply_to` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user` VARCHAR(191) NOT NULL,
    `user_id` INT NULL,
    `sender_id` INT NULL,
    `title` VARCHAR(255) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `scope` VARCHAR(20) NOT NULL DEFAULT 'individual',
    `course_id` INT NULL,
    `content` TEXT,
    `link` VARCHAR(255) NULL,
    `is_read` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Resources Table
CREATE TABLE IF NOT EXISTS `resources` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `file_url` VARCHAR(500) NOT NULL,
    `uploaded_by` INT NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `course_id` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Event Favorites Table
CREATE TABLE IF NOT EXISTS `event_favorites` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `event_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uniq_event_user` (`event_id`, `user_id`),
    FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. User Settings Table (notification preferences)
CREATE TABLE IF NOT EXISTS `user_settings` (
    `user_id` INT PRIMARY KEY,
    `notify_whatsapp` TINYINT(1) DEFAULT 1,
    `notify_email` TINYINT(1) DEFAULT 1,
    `notify_push` TINYINT(1) DEFAULT 1,
    `welcome_seen` TINYINT(1) NOT NULL DEFAULT 0,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Emergency Contacts Table
CREATE TABLE IF NOT EXISTS `emergency_contacts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `relation` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `photo` VARCHAR(255) DEFAULT 'blank.png',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Courses Table
CREATE TABLE IF NOT EXISTS `courses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `mentor_id` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`mentor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Course Enrollments Table
CREATE TABLE IF NOT EXISTS `course_enrollments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `course_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uniq_course_user` (`course_id`, `user_id`),
    FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. Resource Categories Table (admin-managed library filters)
CREATE TABLE IF NOT EXISTS `resource_categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(120) NOT NULL UNIQUE,
    `created_by` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. Post Likes Table (one like per user per post)
CREATE TABLE IF NOT EXISTS `post_likes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `post_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uniq_post_user` (`post_id`, `user_id`),
    FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. Course Chat Reads Table (per-member read marker for group chats)
CREATE TABLE IF NOT EXISTS `course_reads` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `course_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `last_read_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uniq_course_reader` (`course_id`, `user_id`),
    FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 18. Activity Log Table (dashboard recent activity)
CREATE TABLE IF NOT EXISTS `activity_log` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `link` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY `idx_activity_user` (`user_id`, `created_at`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================================
-- SEED DATA (Default Password for all: password123 and admin@123 for demo admin)
-- ==========================================================

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `expertise`, `bio`) VALUES
(1, 'Demo Student', 'student@pragya.org', '$2y$10$v.8LBNg65xHFkFIJO4y7kuW./7xkAyLNWqCIDe01vwUzrApIvOVQ6', 'Student', '+91 98765 43210', 'Vedic Sciences & Asana', 'Seeker on the path of mindful living, dedicated to practicing Yoga and exploring holistic Ayurveda.'),
(2, 'Demo Mentor', 'mentor@pragya.org', '$2y$10$v.8LBNg65xHFkFIJO4y7kuW./7xkAyLNWqCIDe01vwUzrApIvOVQ6', 'Mentor', '+91 98765 43211', 'Holistic Yoga & Meditation', 'Certified Yogic Science specialist with 10+ years helping students attain focus and wellness.'),
(3, 'Demo Admin', 'admin@pragya.org', '$2y$10$v.8LBNg65xHFkFIJO4y7kuW./7xkAyLNWqCIDe01vwUzrApIvOVQ6', 'Admin', '+91 98765 43212', 'Operations & Administration', 'Platform administrator for Pragya Connect.'),
(4, 'Gyan Prakash', 'gyan@gmail.com', '$2y$10$v.8LBNg65xHFkFIJO4y7kuW./7xkAyLNWqCIDe01vwUzrApIvOVQ6', 'Student', '+91 98765 43213', 'Ashtanga & Pranayama', 'Enthusiastic student of mindfulness and pranayama.'),
(5, 'Aarya Kuldeep', 'aarya@pragya.com', '$2y$10$v.8LBNg65xHFkFIJO4y7kuW./7xkAyLNWqCIDe01vwUzrApIvOVQ6', 'Teacher', '+91 98765 43214', 'Asana Precision & Alignment', 'Dedicated teacher focusing on anatomical safety and daily breath control.'),
(6, 'Dr. Yatendra Dutt Amoli', 'yatendra@pragya.com', '$2y$10$v.8LBNg65xHFkFIJO4y7kuW./7xkAyLNWqCIDe01vwUzrApIvOVQ6', 'Teacher', '+91 98765 43215', 'Ayurveda & Lifestyle Medicine', 'Doctor of Ayurvedic medicine focusing on root-cause dietary and yogic therapies.'),
(7, 'Angela', 'angela@pragya.com', '$2y$10$v.8LBNg65xHFkFIJO4y7kuW./7xkAyLNWqCIDe01vwUzrApIvOVQ6', 'Teacher', '+91 98765 43216', 'Mindfulness & Stress Management', 'Mindfulness practitioner specialized in cognitive calming and restorative yoga.'),
(8, 'Demo Admin Alias', 'demo@pyshk.com', '$2y$10$QO9Zc06/dM3Q5h2R/3rW0.B4Vp7hI3m7m0Xf7J1D5YqO8V2Z4p7hy', 'Admin', '+91 98765 43217', 'System Admin', 'Demo administrator account')
ON DUPLICATE KEY UPDATE `id`=`id`;

INSERT INTO `mentors` (`id`, `user_id`, `expertise`, `availability`, `bio`, `rating`) VALUES
(1, 2, 'Holistic Yoga & Meditation', 'Mon-Fri (08:00 AM - 05:00 PM)', 'Certified Yogic Science specialist with 10+ years helping students attain focus and wellness.', 4.95),
(2, 5, 'Asana Precision & Alignment', 'Tue-Sat (09:00 AM - 04:00 PM)', 'Dedicated teacher focusing on anatomical safety and daily breath control.', 4.90),
(3, 6, 'Ayurveda & Lifestyle Medicine', 'Mon-Thu (10:00 AM - 02:00 PM)', 'Doctor of Ayurvedic medicine focusing on root-cause dietary and yogic therapies.', 5.00),
(4, 7, 'Mindfulness & Stress Management', 'Mon-Sun (07:00 AM - 08:00 PM)', 'Mindfulness practitioner specialized in cognitive calming and restorative yoga.', 4.88)
ON DUPLICATE KEY UPDATE `id`=`id`;

INSERT INTO `posts` (`id`, `user_id`, `content`, `image`, `category`, `likes`) VALUES
(1, 5, 'Daily morning yoga session successfully completed. Remember, consistency is the key to deep healing! ✨ #YogaTherapy #MorningVibes', 'assets/akhilesh_post.png', 'Yoga & Asana', 12),
(2, 4, 'Just finished the 5-Day Meditation challenge. Feeling absolutely rejuvenated and focused! Thanks to Aarya Kuldeep for the guidance. #Meditation #Mindfulness', '', 'Meditation & Pranayama', 8)
ON DUPLICATE KEY UPDATE `id`=`id`;

INSERT INTO `comments` (`id`, `post_id`, `user_id`, `comment_text`) VALUES
(1, 1, 4, 'Thank you teacher! Looking forward to tomorrow session.')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Dates are relative to the install date so the calendar always has believable
-- past, present and future sessions to show.
INSERT INTO `events` (`id`, `title`, `description`, `date`, `time`, `location`, `category`, `course_id`, `is_free`, `amount`, `created_by`) VALUES
(1, 'Kids Summer Yog Camp (Age 7-11 Batch 2)', 'A fun-filled, interactive yoga camp specially tailored for kids to learn breathing, postures, and focus.', DATE_SUB(CURDATE(), INTERVAL 40 DAY), '09:00 AM', 'Kids Hall', 'Yoga Workshops', NULL, 1, 0.00, 5),
(2, 'ABC Workshop: Backbends for Beginners', 'An absolute beginners workshop covering correct spinal extension techniques and core activation.', DATE_SUB(CURDATE(), INTERVAL 12 DAY), '09:00 AM', 'Yoga Studio', 'Yoga Workshops', 1, 0, 299.00, 5),
(3, 'Sunset Beach Yog 2026', 'Relax, stretch, and breathe under the golden hour on the beach. Followed by a bonfire.', DATE_ADD(CURDATE(), INTERVAL 21 DAY), '05:30 PM', 'Beach Area', 'Meditation Retreats', NULL, 1, 0.00, 5),
(4, 'Morning Hatha Practice — Week 5', 'Guided morning session working through the standing sequence with alignment corrections.', CURDATE(), '07:00 AM', 'Studio One', 'Yoga Workshops', 1, 1, 0.00, 5),
(5, 'Evening Pranayama & Stillness', 'Wind-down breathwork followed by twenty minutes of silent sitting.', CURDATE(), '06:30 PM', 'Meditation Hall', 'Meditation Retreats', 3, 1, 0.00, 7),
(6, 'Ayurvedic Kitchen Workshop', 'Cook three dosha-balancing meals and take home the recipe cards.', DATE_ADD(CURDATE(), INTERVAL 5 DAY), '11:00 AM', 'Community Kitchen', 'Ayurveda Masterclasses', 2, 0, 499.00, 6),
(7, 'Vedic Philosophy Webinar: The Four Paths', 'Online lecture and Q&A exploring Karma, Bhakti, Raja and Jnana yoga.', DATE_ADD(CURDATE(), INTERVAL 9 DAY), '08:00 PM', 'Online (Zoom)', 'Vedic Science Webinars', NULL, 1, 0.00, 6)
ON DUPLICATE KEY UPDATE `id`=`id`;

INSERT INTO `event_registrations` (`id`, `event_id`, `user_id`) VALUES
(1, 4, 1), (2, 5, 1), (3, 3, 1), (4, 4, 4)
ON DUPLICATE KEY UPDATE `id`=`id`;

INSERT INTO `resources` (`id`, `title`, `description`, `file_url`, `uploaded_by`, `category`, `course_id`) VALUES
(1, 'Yoga Anatomy Reference Guide', 'A detailed visual dictionary explaining muscle engagement in key yoga postures.', 'resources/anatomy_guide.pdf', 5, 'Yoga Guides', 1),
(2, 'Meditation and Breathing Exercises', 'Pranayama techniques and guidelines to improve lung capacity and clear mental fog.', 'resources/meditation_guide.pdf', 5, 'Meditation Audios', 3),
(3, 'Hatha Sequence Workbook (Weeks 1-4)', 'Printable practice sheets covering the first half of the Foundations of Hatha Yoga syllabus.', 'resources/hatha_workbook.pdf', 5, 'Yoga Guides', 1),
(4, 'Dosha Self-Assessment Chart', 'Determine your constitution and the seasonal routine that suits it best.', 'resources/dosha_chart.pdf', 6, 'Ayurveda & Nutrition', 2),
(5, 'Patanjali Yoga Sutras — Annotated', 'Full Sanskrit text with transliteration and plain-language commentary. Open to every member.', 'resources/yoga_sutras.pdf', 3, 'Ancient Sutras & E-Books', NULL),
(6, 'Mindful Living Starter Pack', 'A short introduction to breath awareness and daily reflection for newcomers.', 'resources/mindful_starter.pdf', 3, 'Meditation Audios', NULL),
(7, 'Research: Yoga and Stress Biomarkers', 'Peer-reviewed summary of cortisol response across an eight-week yoga intervention.', 'resources/yoga_stress_research.pdf', 6, 'Research Papers', NULL)
ON DUPLICATE KEY UPDATE `id`=`id`;

INSERT INTO `messages` (`id`, `sender`, `recipient`, `text`, `attachments`, `reactions`, `is_read`, `pinned`, `starred`) VALUES
(1, 'Angela', 'Demo Student', 'Hi 🌿, how is your meditation practice going?', '[]', '[]', 0, 0, 0),
(2, 'Demo Student', 'Angela', 'Hello Angela! It is going great, thank you! I feel much more grounded.', '[]', '[]', 1, 0, 0)
ON DUPLICATE KEY UPDATE `id`=`id`;

INSERT INTO `notifications` (`id`, `user`, `title`, `type`, `content`, `is_read`) VALUES
(1, 'Demo Student', 'Welcome to Pragya Connect!', 'system', 'Explore workshops, community feed, and connect with mentors.', 0),
(2, 'Demo Student', 'New Event: Backbends for Beginners', 'event', 'ABC Workshop: Backbends for Beginners is scheduled for July 18th.', 0)
ON DUPLICATE KEY UPDATE `id`=`id`;

INSERT INTO `courses` (`id`, `name`, `description`, `mentor_id`) VALUES
(1, 'Foundations of Hatha Yoga', 'An eight-week grounding course covering the classical asana sequence, alignment, and breath awareness.', 5),
(2, 'Ayurveda for Daily Living', 'Practical Ayurvedic routines, seasonal eating, and dosha-balancing lifestyle design.', 6),
(3, 'Meditation & Mindfulness Intensive', 'Progressive concentration practices, pranayama, and mindful stress management.', 7)
ON DUPLICATE KEY UPDATE `id`=`id`;

INSERT INTO `course_enrollments` (`id`, `course_id`, `user_id`) VALUES
(1, 1, 1), (2, 3, 1), (3, 1, 4), (4, 2, 4)
ON DUPLICATE KEY UPDATE `id`=`id`;

INSERT INTO `resource_categories` (`id`, `name`, `created_by`) VALUES
(1, 'Yoga Guides', 3),
(2, 'Ayurveda & Nutrition', 3),
(3, 'Meditation Audios', 3),
(4, 'Ancient Sutras & E-Books', 3),
(5, 'Research Papers', 3)
ON DUPLICATE KEY UPDATE `id`=`id`;
