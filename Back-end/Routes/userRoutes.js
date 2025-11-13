// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const verifyAuth = require("../middleware/authMiddleware");

const Student = require("../Models/Students");
const Faculty  = require("../Models/Faculty");
const Admin    = require("../Models/Admin");

// Fetch profile of the logged-in user
router.get("/me", verifyAuth, async (req, res) => {
  try {
    const { id, role } = req.user || {};
    if (!id || !role) {
      return res.status(400).json({ message: "Missing user info in token" });
    }

    let Model;
    if (role === "student") Model = Student;
    else if (role === "faculty") Model = Faculty;
    else if (role === "admin")   Model = Admin;
    else return res.status(400).json({ message: "Invalid role" });

    const doc = await Model.findById(id).lean();
    if (!doc) return res.status(404).json({ message: "User not found" });

    // scrub sensitive
    delete doc.password;
    delete doc.googleId;

    // IMPORTANT:
    // Always include a *platform role* field in the response so the frontend
    // can route correctly. (Do NOT confuse with adminRole job title.)
    const user = { ...doc, role }; // role = "student" | "faculty" | "admin"

    return res.json({ success: true, user });
  } catch (err) {
    console.error("Error fetching user:", err);
    return res.status(500).json({ message: "Error fetching user", error: err.message });
  }
});

// Update profile of the logged-in user
router.put("/me", verifyAuth, async (req, res) => {
  try {
    const { id, role } = req.user || {};
    if (!id) return res.status(400).json({ message: "Missing user id in token" });

    const updates = req.body || {};
    let Model;
    let allowed = [];

    if (role === "student") {
      Model = Student;
      allowed = [
        "fullName",
        "rollNumber",
        "email",
        "phone",
        "gender",
        "department",
        "ProgramAndYear",
        "bio",
        "avatarUrl",
    ];

    } else if (role === "faculty") {
      Model = Faculty;
      allowed = [
        "fullName", "department", "phone", "bio", "avatarUrl", "email",
      ];
    } else if (role === "admin") {
      Model = Admin;
      // NOTE: job title is adminRole (NOT 'role')
      allowed = [
        "fullName", "adminRole", "phone", "bio", "avatarUrl", "email",
      ];
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    const patch = {};
    for (const k of Object.keys(updates)) {
      if (allowed.includes(k)) patch[k] = updates[k];
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const updated = await Model.findByIdAndUpdate(
      id,
      { $set: patch },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "User not found" });

    delete updated.password;
    delete updated.googleId;

    // keep platform role explicit
    const user = { ...updated, role };

    return res.json({ success: true, user });
  } catch (err) {
    console.error("Error updating profile:", err);
    return res.status(500).json({ message: "Error updating profile", error: err.message });
  }
});

module.exports = router;
