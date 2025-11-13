// Models/Faculty.js
const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    department: { type: String, enum: ["CSE", "ECE"], required: true },
    bio: { type: String },
    avatarUrl: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    password: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Faculty", facultySchema);
