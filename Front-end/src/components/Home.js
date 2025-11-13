import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/config";

export default function Home() {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const getInitialLocalUser = () => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const [storedUser, setStoredUser] = useState(getInitialLocalUser());
  const displayName = storedUser?.fullName || storedUser?.email || null;

  const handleSignOut = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/");
  };

  const toggleProfile = async () => {
    const willOpen = !isProfileOpen;
    setIsProfileOpen(willOpen);

    if (willOpen && !profile) {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setProfileError("Not signed in");
        return;
      }

      setLoadingProfile(true);
      setProfileError("");

      try {
        const res = await api.get("/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.user) {
          setProfile(res.data.user);
          setStoredUser((prev) => ({
            ...(prev || {}),
            ...(res.data.user || {}),
          }));
        }
      } catch {
        setProfileError("Error loading profile");
      } finally {
        setLoadingProfile(false);
      }
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async () => {
    if (!profile) return;

    setSavingProfile(true);
    setProfileMessage("");

    const token = localStorage.getItem("authToken");

    let payload = { fullName: profile.fullName, email: profile.email };

    if (storedUser?.role === "student") {
      payload = {
        ...payload,
        rollNumber: profile.rollNumber,
        course: profile.course,
        department: profile.department,
      };
    } else if (storedUser?.role === "faculty") {
      payload = {
        ...payload,
        department: profile.department,
      };
    } else if (storedUser?.role === "admin") {
      payload = {
        ...payload,
        adminRole: profile.adminRole,
      };
    }

    try {
      const res = await api.put("/user/me", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.user) {
        setProfile(res.data.user);
        setStoredUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setProfileMessage("Profile saved");
      }
    } catch {
      setProfileMessage("Error saving profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const ads = [
    {
      title: "IIITG Tech Fest 2025",
      subtitle: "Tech Fest Banner",
      description:
        "Join the biggest campus event of the year — competitions, concerts, and more!",
      img: "https://images.unsplash.com/photo-1556761175-129418cb2dfe?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "IIITG Lost & Found Portal",
      subtitle: "Lost and Found Banner",
      description:
        "Lost something on campus? Post or browse items here — quick and secure.",
      img: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=80",
      link: "https://chat.whatsapp.com/Hr0Ahu1ViB5FnYFpHYSyFG?mode=wwt",
    },
    {
      title: "IIITG Merchandise Store",
      subtitle: "Merchandise Banner",
      description: "Get your hoodies, mugs, and tees with the official IIITG logo!",
      img: "https://images.unsplash.com/photo-1607083206968-13611e3d76c7?auto=format&fit=crop&w=800&q=80",
    },
  ];

  return (
    <div className="app-container">

      {/* HEADER */}
      <header className="header">
        <div className="header-content">
          <div className="header-title">IIITG Student Community Hub</div>

          <div className="header-nav">
            {displayName ? (
              <>
                <div className="btn btn-ghost">Welcome, {displayName}</div>
                <button onClick={toggleProfile} className="profile-toggle">
                  <span className="profile-avatar">
                    {(storedUser?.fullName || storedUser?.email || "U")[0]}
                  </span>
                  <span style={{ fontSize: 13 }}>Profile</span>
                </button>
                <button onClick={handleSignOut} className="btn btn-outline">
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/auth?role=student" className="btn btn-ghost">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT RESTORED */}
      <main>
        {/* HERO SECTION */}
        <section className="hero-section">
          <div className="hero-text">
            <h1 className="hero-title">IIITG Student Community Hub</h1>
            <p className="hero-description">
              Your one-stop platform for carpooling and a campus marketplace.
              Connect, collaborate, and make campus life easier.
            </p>

            <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "center" }}>
              <Link to="/rides" className="btn btn-primary" style={{ width: 160 }}>
                Find a Ride
              </Link>
              <Link to="/marketplace" className="btn btn-outline" style={{ width: 160 }}>
                Buy & Sell
              </Link>
            </div>
          </div>
        </section>

        {/* CARDS SECTION */}
        <section className="cards-grid" style={{ padding: "2rem 1rem" }}>
          {ads.map((ad, index) => {
            const card = (
              <div key={index} className={`card ${index % 2 === 0 ? "card-blue" : "card-purple"}`}>
                <div className="card-image-container">
                  <img src={ad.img} alt={ad.subtitle} className="card-image" />
                  <div className="card-image-overlay" />
                </div>
                <div className="card-header">
                  <div className="card-title">
                    <div>{ad.title}</div>
                  </div>
                  <div className="card-content">
                    <p className="card-description">{ad.description}</p>
                  </div>
                </div>
              </div>
            );

            return ad.link ? (
              <a
                key={`link-${index}`}
                href={ad.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {card}
              </a>
            ) : (
              card
            );
          })}
        </section>
      </main>

      {/* PROFILE PANEL */}
      <div className={`profile-panel ${isProfileOpen ? "open" : ""}`}>
        <div className="panel-header">
          <div style={{ fontWeight: 700 }}>Your Profile</div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn"
              onClick={() => {
                if (storedUser?.role === "faculty") navigate("/faculty/profile");
                else if (storedUser?.role === "admin") navigate("/admin/profile");
                else navigate("/student/profile");
              }}
            >
              Edit
            </button>
            <button className="btn" onClick={() => setIsProfileOpen(false)}>
              Close
            </button>
          </div>
        </div>

        <div className="panel-body">

          {loadingProfile ? (
            <p>Loading…</p>
          ) : profileError ? (
            <p style={{ color: "red" }}>{profileError}</p>
          ) : profile ? (
            <div>

              {/* UNIVERSAL */}
              <div className="profile-row">
                <label>Full name</label>
                <input
                  name="fullName"
                  className="form-input"
                  value={profile.fullName || ""}
                  onChange={handleProfileChange}
                />
              </div>

              <div className="profile-row">
                <label>Email</label>
                <div className="value">{profile.email}</div>
              </div>

              {/* STUDENT */}
              {storedUser?.role === "student" && (
                <>
                  <div className="profile-row">
                    <label>Roll Number</label>
                    <input
                      name="rollNumber"
                      className="form-input"
                      value={profile.rollNumber || ""}
                      onChange={handleProfileChange}
                    />
                  </div>

                  <div className="profile-row">
                    <label>Course</label>
                    <input
                      name="course"
                      className="form-input"
                      value={profile.course || ""}
                      onChange={handleProfileChange}
                    />
                  </div>

                  <div className="profile-row">
                    <label>Department</label>
                    <input
                      name="department"
                      className="form-input"
                      value={profile.department || ""}
                      onChange={handleProfileChange}
                    />
                  </div>
                </>
              )}

              {/* FACULTY */}
              {storedUser?.role === "faculty" && (
                <div className="profile-row">
                  <label>Department</label>
                  <input
                    name="department"
                    className="form-input"
                    value={profile.department || ""}
                    onChange={handleProfileChange}
                  />
                </div>
              )}

              {/* ADMIN */}
              {storedUser?.role === "admin" && (
                <div className="profile-row">
                  <label>Role</label>
                  <input
                    name="adminRole"
                    className="form-input"
                    value={profile.adminRole || ""}
                    onChange={handleProfileChange}
                  />
                </div>
              )}

              {profileMessage && (
                <div style={{ marginTop: 8, color: "green" }}>{profileMessage}</div>
              )}

            </div>
          ) : (
            <p>No profile data</p>
          )}
        </div>

        <div className="profile-actions">
          <button className="btn btn-outline" onClick={() => setIsProfileOpen(false)}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handleProfileSave}>
            Save
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (storedUser?.role === "faculty") navigate("/faculty/profile");
              else if (storedUser?.role === "admin") navigate("/admin/profile");
              else navigate("/student/profile");
            }}
          >
            Open Profile Page
          </button>
        </div>

      </div>
    </div>
  );
}
