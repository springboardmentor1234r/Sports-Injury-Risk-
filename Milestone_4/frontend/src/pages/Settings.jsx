import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/config";

export default function Settings() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [profileForm, setProfileForm] = useState({ name: "", email: "", bio: "" });
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [pictureMsg, setPictureMsg] = useState("");

  useEffect(() => {
    axios
      .get(`${API_BASE}/users/me`, { headers })
      .then((res) => {
        setUser(res.data);
        setProfileForm({
          name: res.data.name || "",
          email: res.data.email || "",
          bio: res.data.bio || "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProfileChange = (e) => setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

  const handleSaveProfile = async () => {
    setProfileMsg({ type: "", text: "" });
    setSavingProfile(true);
    try {
      const res = await axios.put(`${API_BASE}/users/me`, profileForm, { headers });
      setUser(res.data);
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setProfileMsg({ type: "error", text: err.response?.data?.detail || "Couldn't update profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMsg({ type: "", text: "" });
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMsg({ type: "error", text: "New password and confirmation don't match." });
      return;
    }
    setSavingPassword(true);
    try {
      await axios.post(
        `${API_BASE}/users/me/password`,
        { current_password: passwordForm.current_password, new_password: passwordForm.new_password },
        { headers }
      );
      setPasswordMsg({ type: "success", text: "Password changed successfully." });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setPasswordMsg({ type: "error", text: err.response?.data?.detail || "Couldn't change password." });
    } finally {
      setSavingPassword(false);
    }
  };

  const handlePictureSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPictureMsg("");
    setUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${API_BASE}/users/me/profile-picture`, formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      setUser(res.data);
    } catch (err) {
      setPictureMsg(err.response?.data?.detail || "Couldn't upload image.");
    } finally {
      setUploadingPicture(false);
      e.target.value = "";
    }
  };

  const avatarUrl = user?.profile_picture ? `${API_BASE}${user.profile_picture}` : null;

  return (
    <div style={styles.container}>
      <style>{`
        .settings-avatar-wrapper:hover .settings-avatar-overlay { opacity: 1; }
        .settings-input:focus, .settings-textarea:focus { border-color: #a855f7 !important; }
        .settings-save-btn:hover { opacity: 0.9; }
        .settings-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div style={styles.card}>
        <div style={styles.topRow}>
          <h2 style={styles.title}>⚙️ Account Settings</h2>
          <button style={styles.back} onClick={() => navigate("/dashboard")}>← Dashboard</button>
        </div>

        {loading && <p style={styles.msg}>Loading…</p>}

        {!loading && (
          <>
            {/* Profile picture */}
            <div style={styles.avatarSection}>
              <div className="settings-avatar-wrapper" style={styles.avatarWrapper} onClick={() => fileInputRef.current?.click()}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" style={styles.avatarImg} />
                ) : (
                  <div style={styles.avatarPlaceholder}>🏃</div>
                )}
                <div className="settings-avatar-overlay" style={styles.avatarOverlay}>{uploadingPicture ? "Uploading…" : "📷 Change"}</div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
                onChange={handlePictureSelect}
              />
              <div>
                <p style={styles.avatarName}>{user?.name}</p>
                <p style={styles.avatarRole}>{user?.role}</p>
                {pictureMsg && <p style={styles.errorText}>{pictureMsg}</p>}
              </div>
            </div>

            {/* Profile info */}
            <div style={styles.section}>
              <p style={styles.sectionTitle}>Profile Information</p>

              <label style={styles.label}>Full Name</label>
              <input
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                className="settings-input" style={styles.input}
                placeholder="Your name"
              />

              <label style={styles.label}>Email</label>
              <input
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                className="settings-input" style={styles.input}
                placeholder="you@example.com"
              />

              <label style={styles.label}>Bio</label>
              <textarea
                name="bio"
                value={profileForm.bio}
                onChange={handleProfileChange}
                className="settings-textarea" style={styles.textarea}
                placeholder="Tell us a bit about yourself…"
                maxLength={500}
                rows={4}
              />
              <p style={styles.charCount}>{profileForm.bio.length}/500</p>

              {profileMsg.text && (
                <p style={profileMsg.type === "success" ? styles.successText : styles.errorText}>
                  {profileMsg.text}
                </p>
              )}
              <button className="settings-save-btn" style={styles.saveBtn} onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? "Saving…" : "Save Profile"}
              </button>
            </div>

            {/* Password */}
            <div style={styles.section}>
              <p style={styles.sectionTitle}>Change Password</p>

              <label style={styles.label}>Current Password</label>
              <input
                name="current_password"
                type="password"
                value={passwordForm.current_password}
                onChange={handlePasswordChange}
                className="settings-input" style={styles.input}
              />

              <label style={styles.label}>New Password</label>
              <input
                name="new_password"
                type="password"
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
                className="settings-input" style={styles.input}
              />

              <label style={styles.label}>Confirm New Password</label>
              <input
                name="confirm_password"
                type="password"
                value={passwordForm.confirm_password}
                onChange={handlePasswordChange}
                className="settings-input" style={styles.input}
              />

              {passwordMsg.text && (
                <p style={passwordMsg.type === "success" ? styles.successText : styles.errorText}>
                  {passwordMsg.text}
                </p>
              )}
              <button
                className="settings-save-btn" style={styles.saveBtn}
                onClick={handleChangePassword}
                disabled={
                  savingPassword ||
                  !passwordForm.current_password ||
                  !passwordForm.new_password ||
                  !passwordForm.confirm_password
                }
              >
                {savingPassword ? "Updating…" : "Update Password"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#fdf2f8 0%,#f5f3ff 50%,#eef2ff 100%)",
    display: "flex",
    justifyContent: "center",
    padding: "60px 24px",
    fontFamily: "'Poppins', sans-serif",
  },
  card: {
    width: "640px",
    maxWidth: "100%",
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(18px)",
    borderRadius: "32px",
    padding: "44px",
    boxShadow: "0 20px 60px rgba(139,92,246,0.15), 0 8px 24px rgba(0,0,0,0.06)",
    border: "1px solid rgba(255,255,255,0.6)",
  },
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  title: { margin: 0, fontSize: "28px", fontWeight: "800", color: "#4c1d95" },
  back: {
    background: "#ede9fe", color: "#6d28d9", border: "none", padding: "10px 20px",
    borderRadius: "14px", cursor: "pointer", fontWeight: "700", fontSize: "14px",
  },
  msg: { textAlign: "center", color: "#6b7280" },

  avatarSection: { display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px" },
  avatarWrapper: {
    width: "96px", height: "96px", borderRadius: "50%", position: "relative",
    cursor: "pointer", overflow: "hidden", flexShrink: 0,
    border: "3px solid #fff", boxShadow: "0 6px 20px rgba(139,92,246,0.25)",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarPlaceholder: {
    width: "100%", height: "100%", background: "linear-gradient(135deg,#f3e8ff,#fce7f3)",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px",
  },
  avatarOverlay: {
    position: "absolute", inset: 0, background: "rgba(76,29,149,0.65)", color: "white",
    fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center",
    opacity: 0, transition: "opacity 0.2s ease",
  },
  avatarName: { margin: 0, fontSize: "18px", fontWeight: "800", color: "#1e1b4b" },
  avatarRole: { margin: "2px 0 0", fontSize: "12px", color: "#8b5cf6", fontWeight: "700", textTransform: "capitalize" },

  section: {
    background: "#faf5ff", borderRadius: "20px", padding: "24px", marginBottom: "20px",
    border: "1px solid #f3e8ff",
  },
  sectionTitle: { margin: "0 0 16px", fontSize: "15px", fontWeight: "800", color: "#6d28d9" },
  label: { display: "block", fontSize: "12px", fontWeight: "700", color: "#6b7280", marginBottom: "6px", marginTop: "14px" },
  input: {
    width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1.5px solid #e9d5ff",
    fontSize: "14px", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  },
  textarea: {
    width: "100%", padding: "12px 14px", borderRadius: "12px", border: "1.5px solid #e9d5ff",
    fontSize: "14px", outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
  },
  charCount: { textAlign: "right", fontSize: "11px", color: "#9ca3af", margin: "4px 0 0" },
  saveBtn: {
    marginTop: "18px", padding: "12px 26px", background: "linear-gradient(135deg,#d946ef,#8b5cf6)",
    color: "white", border: "none", borderRadius: "14px", fontWeight: "700", fontSize: "14px",
    cursor: "pointer",
  },
  successText: { color: "#16a34a", fontWeight: "600", fontSize: "13px", marginTop: "14px" },
  errorText: { color: "#dc2626", fontWeight: "600", fontSize: "13px", marginTop: "14px" },
};
