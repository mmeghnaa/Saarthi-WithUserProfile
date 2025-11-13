// Models/Admin.js
const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },

    // IMPORTANT: this is the *job title*, not the platform role.
    // Make it optional so accounts can be created on first login and filled later.
    adminRole: {
      type: String,
      enum: [
        "Office Assistant",
        "Librarian",
        "System Administrator",
        "Finance Officer",
        "Hostel Warden",
        "Maintenance Staff",
        "Placement Officer",
      ],
      required: false,
      trim: true,
    },
    //default: "",

    bio: { type: String },
    avatarUrl: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    password: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
