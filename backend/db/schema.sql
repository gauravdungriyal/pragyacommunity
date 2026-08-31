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
    `recipient` VARCHAR(191) NOT NULL,
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
    `title` VARCHAR(255) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `content` TEXT,
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
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
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

INSERT INTO `events` (`id`, `title`, `description`, `date`, `time`, `location`, `category`, `is_free`, `amount`, `created_by`) VALUES
(1, 'Kids Summer Yog Camp (Age 7-11 Batch 2)', 'A fun-filled, interactive yoga camp specially tailored for kids to learn breathing, postures, and focus.', '2026-07-06', '09:00 AM', 'Kids Hall', 'Yoga Workshops', 1, 0.00, 5),
(2, 'ABC Workshop: Backbends for Beginners', 'An absolute beginners workshop covering correct spinal extension techniques and core activation.', '2026-07-18', '09:00 AM', 'Yoga Studio', 'Yoga Workshops', 0, 299.00, 5),
(3, 'Sunset Beach Yog 2026', 'Relax, stretch, and breathe under the golden hour on the beach. Followed by a bonfire.', '2026-07-30', '05:30 PM', 'Beach Area', 'Meditation Retreats', 1, 0.00, 5)
ON DUPLICATE KEY UPDATE `id`=`id`;

INSERT INTO `resources` (`id`, `title`, `description`, `file_url`, `uploaded_by`, `category`) VALUES
(1, 'Yoga Anatomy Reference Guide', 'A detailed visual dictionary explaining muscle engagement in key yoga postures.', 'resources/anatomy_guide.pdf', 5, 'Yoga Guides'),
(2, 'Meditation and Breathing Exercises', 'Pranayama techniques and guidelines to improve lung capacity and clear mental fog.', 'resources/meditation_guide.pdf', 5, 'Meditation Audios')
ON DUPLICATE KEY UPDATE `id`=`id`;

INSERT INTO `messages` (`id`, `sender`, `recipient`, `text`, `attachments`, `reactions`, `is_read`, `pinned`, `starred`) VALUES
(1, 'Angela', 'Demo Student', 'Hi 🌿, how is your meditation practice going?', '[]', '[]', 0, 0, 0),
(2, 'Demo Student', 'Angela', 'Hello Angela! It is going great, thank you! I feel much more grounded.', '[]', '[]', 1, 0, 0)
ON DUPLICATE KEY UPDATE `id`=`id`;

INSERT INTO `notifications` (`id`, `user`, `title`, `type`, `content`, `is_read`) VALUES
(1, 'Demo Student', 'Welcome to Pragya Connect!', 'system', 'Explore workshops, community feed, and connect with mentors.', 0),
(2, 'Demo Student', 'New Event: Backbends for Beginners', 'event', 'ABC Workshop: Backbends for Beginners is scheduled for July 18th.', 0)
ON DUPLICATE KEY UPDATE `id`=`id`;
