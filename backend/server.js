const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const eventRoutes = require("./routes/eventRoutes");
const adminRoutes = require("./routes/adminRoutes");
const profileRoutes = require("./routes/profileRoutes");
const mentorRoutes = require("./routes/mentorRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// Load Environment Variables
dotenv.config({ path: path.join(__dirname, ".env") });

// Connect Database
connectDB();

// Initialize App
const app = express();

app.use(cors());

// Middleware
app.use(express.json());

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.static(path.join(__dirname, "../Frontend")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Fallback for landing & login page
app.get(["/", "/login", "/login.html", "/index.html"], (req, res) => {
    const indexPath = path.join(__dirname, "../frontend/index.html");
    res.sendFile(indexPath);
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});