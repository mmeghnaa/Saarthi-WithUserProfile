// routes/authRoutes.js
const express = require("express");
const axios   = require("axios");
const jwt     = require("jsonwebtoken");

const Student = require("../Models/Students");
const Faculty = require("../Models/Faculty");
const Admin   = require("../Models/Admin");

const router = express.Router();

// POST /api/auth/google
// Accepts { tokenId } and optional { role: "student" | "faculty" | "admin" }
router.post("/auth/google", async (req, res) => {
  const { tokenId, role: rawRole } = req.body || {};
  // Don't force a default here; if role isn't provided the backend should
  // decide based on existing accounts or fall back to student when needed.
  const role = rawRole ? String(rawRole).toLowerCase() : undefined;

  if (!tokenId) {
    return res.status(400).json({ success: false, message: "Missing ID token" });
  }

  try {
    // Verify token
    const resp = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenId)}`
    );
    const info = resp.data;

    const expectedAud = process.env.GOOGLE_CLIENT_ID;
    if (expectedAud && info.aud !== expectedAud) {
      return res.status(401).json({ success: false, message: "Token audience mismatch" });
    }

    const emailVerified = info.email_verified === true || info.email_verified === "true";
    if (!emailVerified) {
      return res.status(401).json({ success: false, message: "Google account email not verified" });
    }

    const email    = info.email;
    const googleId = info.sub;
    const fullName = info.name || info.email;

    // Find existing account across collections
    let user = await Student.findOne({ email });
    let detectedRole = null; // only set if we actually find an account

    if (user) detectedRole = "student";
    else {
      user = await Faculty.findOne({ email });
      if (user) detectedRole = "faculty";
    }

    if (!user) {
      user = await Admin.findOne({ email });
      if (user) detectedRole = "admin";
    }

    // Decide model to create/use
    let Model;
    if (user) {
      if (detectedRole === "faculty") Model = Faculty;
      else if (detectedRole === "admin") Model = Admin;
      else Model = Student;
    } else {
      if (role === "faculty") Model = Faculty;
      else if (role === "admin") Model = Admin;
      else Model = Student;
    }

    // Create or update googleId
    if (!user) {
      // For Admin creation, adminRole is optional in schema; user can fill later.
      user = await Model.create({ fullName, email, googleId });
      console.log("Auth: created new user:", { id: user._id.toString(), model: Model.modelName });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
      console.log("Auth: updated existing user with googleId:", { id: user._id.toString(), model: Model.modelName });
    }

  // Determine final role for the JWT/response:
  // - If the account already existed (detectedRole set), use that.
  // - Otherwise, use the requested role (role) or fallback to student.
  const finalRole = detectedRole || role || "student";

    console.log("Auth: finalRole determined:", { detectedRole, requestedRole: role, finalRole });
    try {
      console.log("Auth: responding user object (sanitized):", { id: user._id.toString(), email: user.email, model: Model?.modelName || null });
    } catch (e) {}

    const jwtSecret = process.env.JWT_SECRET || "dev_jwt_secret";
    const payload   = { id: user._id, email: user.email, role: finalRole };
    const token     = jwt.sign(payload, jwtSecret, { expiresIn: "7d" });

    const obj = user.toObject ? user.toObject() : user;
    if (obj) {
      delete obj.password;
      delete obj.googleId;
    }

    // Include platform role explicitly in user object for the frontend
    return res.json({
      success: true,
      token,
      user: { ...(obj || {}), role: finalRole },
    });
  } catch (err) {
    const status = err?.response?.status || 500;
    const message =
      err?.response?.data?.error_description ||
      err?.response?.data?.error ||
      err.message ||
      "Google token verification failed";
    return res.status(status === 200 ? 500 : status).json({ success: false, message });
  }
});

module.exports = router;
