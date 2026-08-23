const express = require("express");
const router = express.Router();
const Resource = require("../models/Resource");


// CREATE RESOURCE
router.post("/create", async (req, res) => {
    try {
        const { title, description, file_url, uploaded_by, category } = req.body;

        const resource = new Resource({
            title,
            description,
            file_url,
            uploaded_by,
            category
        });

        await resource.save();

        res.send("Resource Created Successfully");

    } catch (error) {
        console.log(error);
        res.send("Resource Creation Failed");
    }
});


// GET ALL RESOURCES
router.get("/", async (req, res) => {
    try {
        const resources = await Resource.find().sort({ createdAt: -1 });
        res.json(resources);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Resources Fetch Failed", error: error.message });
    }
});

// UPDATE RESOURCE
router.put("/:id", async (req, res) => {
    try {
        const updated = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: "Resource not found" });
        res.json(updated);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Resource Update Failed", error: error.message });
    }
});

// DELETE RESOURCE
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Resource.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Resource not found" });
        res.json({ message: "Resource Deleted Successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Resource Deletion Failed", error: error.message });
    }
});

module.exports = router;