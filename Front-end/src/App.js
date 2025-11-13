import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import CreatePost from "./components/CreatePost";
import RideList from "./components/RideList";
import Home from "./components/Home";
import Marketplace from "./components/Marketplace";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";

import UserProfile from "./components/UserProfile";           // Student
import FacultyProfile from "./components/FacultyProfile";     // Faculty
import AdminProfile from "./components/AdminProfile";         // Admin
import Chat from "./components/Chat";

import Dashboard from "./components/Dashboard.js";
import ProfileView from "./components/ProfileView.js";

export default function App() {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  //ROLE-BASED REDIRECT AFTER PROFILE COMPLETION
  const handleProfileComplete = (profileData) => {
    setUserData(profileData);

    const role =
      profileData?.role ||
      JSON.parse(localStorage.getItem("user") || "{}")?.role;

    if (role === "faculty") navigate("/faculty/profile");
    else if (role === "admin") navigate("/admin/profile");
    else navigate("/student/profile");
  };

  const handleLogout = () => {
    setUserData(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/");
  };

  //ROLE-BASED VIEW PROFILE
  const handleViewProfile = () => {
    const role = userData?.role || JSON.parse(localStorage.getItem("user") || "{}")?.role;

    if (role === "faculty") navigate("/faculty/profile");
    else if (role === "admin") navigate("/admin/profile");
    else navigate("/student/profile");
  };

  // ROLE-BASED EDIT PROFILE
  const handleEditProfile = () => {
    const role = userData?.role || JSON.parse(localStorage.getItem("user") || "{}")?.role;

    if (role === "faculty") navigate("/faculty/profile");
    else if (role === "admin") navigate("/admin/profile");
    else navigate("/student/profile");
  };

  const handleProfileUpdate = (updatedData) => {
    setUserData(updatedData);
    handleViewProfile();
  };

  const handleBackToDashboard = () => {
    navigate("/Home");
  };

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<LoginPage />} />

      {/* Main pages */}
      <Route path="/home" element={<Home />} />
      <Route path="/create-ride" element={<CreatePost />} />
      <Route path="/rides" element={<RideList />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/chat/:id" element={<Chat />} />

      {/* ROLE PROFILE ROUTES */}
      <Route path="/student/profile" element={<UserProfile />} />
      <Route path="/faculty/profile" element={<FacultyProfile />} />
      <Route path="/admin/profile" element={<AdminProfile />} />

      {/* Dashboard (optional) */}
      <Route
        path="/dashboard"
        element={
          userData ? (
            <Dashboard
              userData={userData}
              onLogout={handleLogout}
              onViewProfile={handleViewProfile}
            />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Removed ALL student-only profile routes */}
      {/* View profile now routes based on role */}
      <Route
        path="/profile/view"
        element={
          userData ? (
            <ProfileView
              userData={userData}
              onEditProfile={handleEditProfile}
              onBack={handleBackToDashboard}
            />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* EDIT PROFILE — handled by role-based redirect */}
      <Route
        path="/profile/edit"
        element={
          <LoginPage /> /* not used anymore, handled dynamically */
        }
      />
    </Routes>
  );
}
