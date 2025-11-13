// routes/studentRoutes.js
const express = require("express");
const router = express.Router();
const Student = require("../Models/Students");

router.get("/profile", async (req, res) => {
  try {
    const { email, rollNumber } = req.query;

    if (!email && !rollNumber) {
      return res
        .status(400)
        .json({ message: "Email or roll number is required" });
    }

    const student = await Student.findOne(
      email ? { email } : { rollNumber }
    ).lean();

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      message: "Student profile fetched successfully",
      student,
    });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.put("/profile", async (req, res) => {
  try {
    const {
      email,
      fullName,
      rollNumber,
      phone,
      gender,
      department,
      ProgramAndYear,       
      bio,
      avatarUrl,
    } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    
    const program = year || "";

    const updatedStudent = await Student.findOneAndUpdate(
      { email },
      {
        $set: {
          fullName,
          rollNumber,
          phone,
          gender,
          department,
          ProgramAndYear,
          bio,
          avatarUrl,
        },
      },
      { new: true, upsert: true }
    ).lean();

    res.json({
      message: "Profile updated successfully!",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
