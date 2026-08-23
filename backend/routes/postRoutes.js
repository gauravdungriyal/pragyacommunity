const express = require("express");
const router = express.Router();

const Post = require("../models/post");
const Comment = require("../models/Comment");

// GET ALL POSTS WITH COMMENTS
router.get("/", async (req, res) => {
    try {
        const posts = await Post.find()
            .populate("user_id", "name role")
            .sort({ createdAt: -1 });

        const postsWithComments = await Promise.all(posts.map(async (post) => {
            const comments = await Comment.find({ post_id: post._id })
                .populate("user_id", "name role")
                .sort({ createdAt: 1 });

            return {
                ...post.toObject(),
                comments
            };
        }));

        res.json(postsWithComments);

    } catch (error) {
        console.log(error);
        res.status(500).send("Posts Fetch Failed");
    }
});

// CREATE POST API
router.post("/create", async (req, res) => {
    try {
        const { user_id, content, image } = req.body;

        const post = new Post({
            user_id,
            content,
            image
        });

        await post.save();
        res.status(201).json(post);

    } catch (error) {
        console.log(error);
        res.status(500).send("Post Creation Failed");
    }
});

// EDIT POST API
router.put("/edit/:id", async (req, res) => {
    try {
        const { content, image } = req.body;

        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { content, image },
            { new: true }
        );

        res.json(post);

    } catch (error) {
        console.log(error);
        res.status(500).send("Post Update Failed");
    }
});

// DELETE POST API
router.delete("/delete/:id", async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        // Also delete associated comments
        await Comment.deleteMany({ post_id: req.params.id });

        res.send("Post Deleted Successfully");

    } catch (error) {
        console.log(error);
        res.status(500).send("Post Deletion Failed");
    }
});

// COMMENT API (Create Comment)
router.post("/comment", async (req, res) => {
    try {
        const { post_id, user_id, comment_text } = req.body;

        const comment = new Comment({
            post_id,
            user_id,
            comment_text
        });

        await comment.save();
        res.status(201).json(comment);

    } catch (error) {
        console.log(error);
        res.status(500).send("Comment Failed");
    }
});

// EDIT COMMENT API
router.put("/comment/:id", async (req, res) => {
    try {
        const { comment_text } = req.body;

        const comment = await Comment.findByIdAndUpdate(
            req.params.id,
            { comment_text },
            { new: true }
        );

        res.json(comment);

    } catch (error) {
        console.log(error);
        res.status(500).send("Comment Edit Failed");
    }
});

// DELETE COMMENT API
router.delete("/comment/:id", async (req, res) => {
    try {
        await Comment.findByIdAndDelete(req.params.id);
        res.send("Comment Deleted Successfully");

    } catch (error) {
        console.log(error);
        res.status(500).send("Comment Delete Failed");
    }
});

// LIKE API (Toggle / Add Like or Unlike)
router.put("/like/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).send("Post not found");
        }

        const { action } = req.body || {};
        if (action === "unlike") {
            post.likes = Math.max(0, (post.likes || 1) - 1);
        } else {
            post.likes = (post.likes || 0) + 1;
        }
        await post.save();

        res.json({ likes: post.likes, isLiked: action !== "unlike" });

    } catch (error) {
        console.log(error);
        res.status(500).send("Like Failed");
    }
});

module.exports = router;