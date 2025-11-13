import React, { useState, useRef } from "react";
import "../styles/profile.css";

const years = [
  "BTech 1st Year",
  "BTech 2nd Year",
  "BTech 3rd Year",
  "BTech 4th Year",
  "MTech 1st Year",
  "MTech 2nd Year",
  "PhD",
];

const getDepartmentsByYear = (year) => {
  if (!year) return [];

  if (year.startsWith("BTech")) return ["CSE", "ECE"];
  if (year.startsWith("MTech")) return ["CSE", "ECE-VLSI", "ECE-CSP"];
  if (year === "PhD") return ["CSE", "ECE", "HSS"];

  return [];
};

function UserProfile() {
  const [formData, setFormData] = useState({
    fullName: "",
    rollNumber: "",
    email: "",
    phone: "",
    gender: "",
    department: "",
    ProgramAndYear: "",
    bio: "",
    avatarUrl: "",
  });

  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "year") {
      setAvailableDepartments(getDepartmentsByYear(value));
      setFormData((prev) => ({ ...prev, year: value, department: "" }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setFormData((prev) => ({ ...prev, avatarUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

 
  const calculateCompleteness = () => {
    const fields = Object.values(formData);
    const filled = fields.filter((v) => v && v.trim() !== "").length;
    return Math.round((filled / fields.length) * 100);
  };

  const completeness = calculateCompleteness();

  const isFormValid = () =>
    formData.fullName &&
    formData.rollNumber &&
    formData.email &&
    formData.phone &&
    formData.gender &&
    formData.department &&
    formData.ProgramAndYear;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("Not logged in!");
        return;
      }

      const payload = {
      fullName: formData.fullName,
      rollNumber: formData.rollNumber,
      email: formData.email,
      phone: formData.phone,
      gender: formData.gender,
      department: formData.department,
      
      // The combined field stored in DB
      year: formData.year,   // "MTech 1st Year"
      bio: formData.bio,
      avatarUrl: formData.avatarUrl,
    };


      const res = await fetch("http://localhost:5001/api/user/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to save profile");
        return;
      }

      // ✓ Save new user to localStorage
      localStorage.setItem("user", JSON.stringify(data.user));

      // ✓ Redirect to home
      window.location.href = "/home";
    } catch (err) {
      console.error("Save error:", err);
      alert("Could not save profile. Check console.");
    }
  };

  const getInitials = () =>
    formData.fullName
      ? formData.fullName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "?";

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Complete Your Profile</h1>
        <p>Help your peers know you better on Sarthi</p>
      </div>

      <form className="profile-form" onSubmit={handleSubmit}>
        {/* COMPLETION BAR */}
        <div className="profile-completion-indicator">
          <div className="completion-text">
            <span>Profile Completeness</span>
            <span>{completeness}%</span>
          </div>
          <div className="completion-bar-container">
            <div
              className="completion-bar"
              style={{ width: `${completeness}%` }}
            ></div>
          </div>
        </div>

        {/* AVATAR */}
        <div className="profile-avatar-section">
          <div className="avatar-wrapper">
            <div className="profile-avatar" onClick={handleAvatarClick}>
              {avatarPreview || formData.avatarUrl ? (
                <img src={avatarPreview || formData.avatarUrl} alt="Profile" />
              ) : (
                getInitials()
              )}
            </div>
          </div>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <button
            type="button"
            className="avatar-upload-btn"
            onClick={handleAvatarClick}
          >
            Upload Photo
          </button>
        </div>

        {/* FULL NAME + ROLL */}
        <div className="form-row">
          <div className="form-group">
            <label>Full Name *</label>
            <input
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Roll Number *</label>
            <input
              name="rollNumber"
              value={formData.rollNumber}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        {/* EMAIL + PHONE */}
        <div className="form-row">
          <div className="form-group">
            <label>IIITG Email *</label>
            <input
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone *</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        {/* GENDER */}
        <div className="form-group">
          <label>Gender *</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            required
          >
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
            <option>Prefer not to say</option>
          </select>
        </div>

        {/* YEAR + DEPARTMENT */}
        <div className="form-row">
          <div className="form-group">
            <label>Program & Year *</label>
            <select
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              required
            >
              <option value="">Select</option>
              {years.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Department *</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              required
              disabled={!formData.year}
            >
              <option value="">
                {formData.year ? "Select department" : "Select program first"}
              </option>

              {availableDepartments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* BIO */}
        <div className="form-group">
          <label>About You</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Tell something about yourself..."
          />
        </div>

        {/* BUTTON */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={!isFormValid()}>
            Complete Profile & Continue
          </button>
        </div>
      </form>
    </div>
  );
}

export default UserProfile;
