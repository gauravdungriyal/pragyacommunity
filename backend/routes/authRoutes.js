const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register Route
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ status: false, message: "Name, email and password are required" });
        }

        // Check if user already exists
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ status: false, message: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: role || "student"
        });

        // Save user
        await user.save();

        res.status(201).json({ status: true, message: "User Registered Successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Registration Failed" });
    }
});


// Login Route
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: false, message: "Email and password are required" });
        }

        // Check user exists
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ status: false, message: "Invalid email or password" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ status: false, message: "Invalid email or password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            status: true,
            message: "Login Successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "Login Failed" });
    }
});

module.exports = router;