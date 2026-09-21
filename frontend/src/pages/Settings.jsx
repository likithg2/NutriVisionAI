import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Lock, Sun, Moon, LogOut, Check, AlertCircle, Bell, CalendarClock, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { updateMe, getMe, uploadAvatar, changePassword } from "../api/settings.js";
import Modal from "../components/ui/Modal.jsx";
// Re-use your axios instance if you add a deleteAccount endpoint to endpoints.js, or write a custom fetch
import api from '../api/axios.js';

/* Helper components */
function GlassCard({ children, className = "" }) {
  return (
    <div className={`p-6 rounded-2xl glass transition-all ${className}`} style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
      {children}
    </div>
  );
}

function Input({ label, ...props }) {
  const { dark } = useTheme();
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 ml-1">{label}</label>
      <input
        {...props}
        className="w-full px-4 py-2.5 rounded-xl outline-none transition-all"
        style={{
          background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
          color: dark ? "#FDF6F0" : "#1A1210",
          border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
        }}
      />
    </div>
  );
}

function Select({ label, options, ...props }) {
  const { dark } = useTheme();
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 ml-1">{label}</label>
      <select
        {...props}
        className="w-full px-4 py-2.5 rounded-xl outline-none transition-all appearance-none"
        style={{
          background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
          color: dark ? "#FDF6F0" : "#1A1210",
          border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <option value="" disabled style={{ background: dark ? '#1A1210' : '#FFF', color: dark ? '#FDF6F0' : '#1A1210' }}>Select {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: dark ? '#1A1210' : '#FFF', color: dark ? '#FDF6F0' : '#1A1210' }}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function Button({ children, loading, variant = "primary", size = "md", className = "", ...props }) {
  const isDanger = variant === "danger";
  const bg = isDanger ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-[#FF6B4A] text-white hover:bg-[#E85A3A]";
  const sz = size === "sm" ? "px-4 py-2 text-sm" : "px-6 py-2.5";
  return (
    <button disabled={loading} className={`rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${bg} ${sz} ${className}`} {...props}>
      {loading ? <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : children}
    </button>
  );
}

function Toggle({ enabled, onToggle, label, desc }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{desc}</p>
      </div>
      <button onClick={onToggle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-[#FF6B4A]" : "bg-zinc-300 dark:bg-zinc-700"}`}>
        <motion.span animate={{ x: enabled ? 22 : 2 }} className="w-4 h-4 bg-white rounded-full shadow-md" />
      </button>
    </div>
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className="fixed top-28 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-xl backdrop-blur-2xl bg-white/60 dark:bg-[#1A1210]/60 border border-white/20 dark:border-white/10 text-zinc-800 dark:text-zinc-200"
    >
      {type === "success" ? <Check className="w-4 h-4 text-mint-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
      {msg}
    </motion.div>
  );
}

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  
  const [profile, setProfile] = useState({ 
    name: "", email: "", age: "", height: "", weight: "", gender: "other", activityLevel: "sedentary", goal: "maintain", district: "" 
  });
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteOtpSent, setDeleteOtpSent] = useState(false);
  const [deleteOtpLoading, setDeleteOtpLoading] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState({ emailExpiry: true, pushExpiry: true, emailDigest: false, aiInsights: true });
  const [reminderPrefs, setReminderPrefs] = useState({ threeDayWarning: true, oneDayWarning: true, dayOfExpiry: true, weeklyReport: false });

  useEffect(() => {
    const initPrefs = (u) => {
      if (u?.notificationPrefs) {
        setNotifPrefs({
          emailExpiry: u.notificationPrefs.emailExpiry ?? true,
          pushExpiry: u.notificationPrefs.pushExpiry ?? true,
          emailDigest: u.notificationPrefs.emailDigest ?? false,
          aiInsights: u.notificationPrefs.aiInsights ?? true,
        });
        setReminderPrefs({
          threeDayWarning: u.notificationPrefs.threeDayWarning ?? true,
          oneDayWarning: u.notificationPrefs.oneDayWarning ?? true,
          dayOfExpiry: u.notificationPrefs.dayOfExpiry ?? true,
          weeklyReport: u.notificationPrefs.weeklyReport ?? false,
        });
      }
    };

    if (user) {
      setProfile({ 
        name: user.name || "", 
        email: user.email || "",
        age: user.age || "",
        height: user.height || "",
        weight: user.weight || "",
        gender: user.gender || "other",
        activityLevel: user.activityLevel || "sedentary",
        goal: user.goal || "maintain",
        district: user.district || ""
      });
      initPrefs(user);
    } else {
      getMe().then(r => { 
        const u = r.data?.user || r.data; 
        setProfile({ 
          name: u.name || "", email: u.email || "",
          age: u.age || "", height: u.height || "", weight: u.weight || "",
          gender: u.gender || "other", activityLevel: u.activityLevel || "sedentary", goal: u.goal || "maintain", district: u.district || ""
        });
        initPrefs(u);
      });
    }
  }, [user]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3000);
  };

  const handleProfile = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...profile, notificationPrefs: { ...notifPrefs, ...reminderPrefs } };
      const r = await updateMe(payload);
      setUser(r.data?.user || r.data);
      showToast("Profile updated successfully!");
    } catch (err) { showToast(err.response?.data?.message || "Failed to update", "error"); }
    finally { setSaving(false); }
  };

  const handlePassword = async e => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) return showToast("Passwords don't match", "error");
    if (pwdForm.newPassword.length < 6) return showToast("Password must be at least 6 characters", "error");
    setShowPasswordConfirm(true);
  };

  const confirmPasswordUpdate = async () => {
    setSaving(true);
    setShowPasswordConfirm(false);
    try {
      await changePassword({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      showToast("Password changed successfully!");
      setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) { showToast(err.response?.data?.message || "Failed to change password", "error"); }
    finally { setSaving(false); }
  };

  const handleAvatarUpload = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append("avatar", file);
    try {
      const r = await uploadAvatar(fd);
      setUser(u => ({ ...u, avatarUrl: r.data?.avatarUrl || r.data?.user?.avatarUrl }));
      showToast("Avatar updated!");
    } catch { showToast("Failed to upload avatar", "error"); }
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
    setDeleteOtpSent(false);
    setDeleteOtp("");
  };

  const requestDeleteOtp = async () => {
    setDeleteOtpLoading(true);
    try {
      await api.post('/api/auth/otp', { identifier: user?.email, action: 'delete' });
      setDeleteOtpSent(true);
      showToast("OTP sent to your email", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to send OTP", "error");
    } finally {
      setDeleteOtpLoading(false);
    }
  };

  const confirmDeleteAccount = async () => {
    if (!deleteOtp) return showToast("Please enter the OTP", "error");
    setDeleteOtpLoading(true);
    try {
      await api.delete('/api/users/me', { 
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        data: { otp: deleteOtp }
      });
      setShowDeleteConfirm(false);
      logout();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to delete account", "error");
    } finally {
      setDeleteOtpLoading(false);
    }
  };

  const initials = (profile.name || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <AnimatePresence><Toast msg={toast.msg} type={toast.type} /></AnimatePresence>

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Manage your account and preferences</p>
      </motion.div>

      {/* PROFILE SECTION */}
      <GlassCard>
        <div className="flex items-center gap-5 mb-6 pb-5 border-b border-white/10">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden"
              style={{ background: "linear-gradient(135deg, #FF6B4A, #D94A3A)", boxShadow: "0 0 24px rgba(255,107,74,0.3)" }}>
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            <label className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-5 h-5 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>
          <div>
            <p className="text-lg font-semibold">{profile.name || "Your Name"}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{profile.email}</p>
            <p className="text-xs text-zinc-400 mt-1">Hover avatar to change photo</p>
          </div>
        </div>

        <form onSubmit={handleProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
            <Input label="Email" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Age" type="number" value={profile.age} onChange={e => setProfile(p => ({ ...p, age: e.target.value }))} />
            <Input label="Height (cm)" type="number" value={profile.height} onChange={e => setProfile(p => ({ ...p, height: e.target.value }))} />
            <Input label="Weight (kg)" type="number" value={profile.weight} onChange={e => setProfile(p => ({ ...p, weight: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select 
              label="Gender" 
              value={profile.gender} 
              onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <Select 
              label="Activity Level" 
              value={profile.activityLevel} 
              onChange={e => setProfile(p => ({ ...p, activityLevel: e.target.value }))}
              options={[
                { value: 'sedentary', label: 'Sedentary' },
                { value: 'light', label: 'Lightly Active' },
                { value: 'moderate', label: 'Moderately Active' },
                { value: 'active', label: 'Very Active' },
                { value: 'very_active', label: 'Extra Active' },
              ]}
            />
            <Select 
              label="Goal" 
              value={profile.goal} 
              onChange={e => setProfile(p => ({ ...p, goal: e.target.value }))}
              options={[
                { value: 'lose', label: 'Lose Weight' },
                { value: 'maintain', label: 'Maintain Weight' },
                { value: 'gain', label: 'Gain Weight' },
              ]}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="District / City" value={profile.district} onChange={e => setProfile(p => ({ ...p, district: e.target.value }))} placeholder="e.g. New York, Mumbai" />
          </div>
          
          <div className="flex justify-end pt-4">
            <Button type="submit" loading={saving}>Save Profile</Button>
          </div>
        </form>
      </GlassCard>

      {/* APPEARANCE */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/10">
          {dark ? <Moon className="w-4 h-4 text-[#FF6B4A]" /> : <Sun className="w-4 h-4 text-[#FF6B4A]" />}
          <h2 className="font-semibold text-sm">Appearance</h2>
        </div>
        <Toggle enabled={dark} onToggle={toggleTheme} label="Dark Mode" desc="Switch between light and dark theme" />
      </GlassCard>

      {/* NOTIFICATIONS */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/10">
          <Bell className="w-4 h-4 text-[#FF6B4A]" />
          <h2 className="font-semibold text-sm">Notifications</h2>
        </div>
        <div className="divide-y divide-white/5">
          <Toggle enabled={notifPrefs.emailExpiry} onToggle={() => setNotifPrefs(p => ({ ...p, emailExpiry: !p.emailExpiry }))}
            label="Email expiry alerts" desc="Get notified when items are about to expire" />
          <Toggle enabled={notifPrefs.pushExpiry} onToggle={() => setNotifPrefs(p => ({ ...p, pushExpiry: !p.pushExpiry }))}
            label="Push notifications" desc="Browser push alerts for expiring items" />
        </div>
      </GlassCard>

      {/* REMINDERS */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/10">
          <CalendarClock className="w-4 h-4 text-[#FF6B4A]" />
          <h2 className="font-semibold text-sm">Reminders</h2>
        </div>
        <div className="divide-y divide-white/5">
          <Toggle enabled={reminderPrefs.threeDayWarning} onToggle={() => setReminderPrefs(p => ({ ...p, threeDayWarning: !p.threeDayWarning }))}
            label="3-day warning" desc="Remind me 3 days before an item expires" />
          <Toggle enabled={reminderPrefs.dayOfExpiry} onToggle={() => setReminderPrefs(p => ({ ...p, dayOfExpiry: !p.dayOfExpiry }))}
            label="Day of expiry" desc="Alert on the exact expiration date" />
        </div>
      </GlassCard>

      {/* SECURITY */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/10">
          <Lock className="w-4 h-4 text-[#FF6B4A]" />
          <h2 className="font-semibold text-sm">Security</h2>
        </div>
        <form onSubmit={handlePassword} className="space-y-4">
          <Input label="Current Password" type="password" value={pwdForm.currentPassword} onChange={e => setPwdForm(p => ({ ...p, currentPassword: e.target.value }))} required />
          <Input label="New Password" type="password" value={pwdForm.newPassword} onChange={e => setPwdForm(p => ({ ...p, newPassword: e.target.value }))} required />
          <Input label="Confirm New Password" type="password" value={pwdForm.confirmPassword} onChange={e => setPwdForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={saving}>Update Password</Button>
          </div>
        </form>
      </GlassCard>

      {/* DANGER ZONE */}
      <GlassCard className="border-red-500/15">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-500/10">
          <Shield className="w-4 h-4 text-red-400" />
          <h2 className="font-semibold text-sm text-red-400">Danger Zone</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Delete Account</p>
            <p className="text-xs text-zinc-500 mt-0.5">Permanently delete your account and all data</p>
          </div>
          <Button variant="danger" onClick={handleDeleteAccount}><LogOut className="w-3.5 h-3.5" /> Delete Profile</Button>
        </div>
      </GlassCard>

      {/* Delete Account Confirmation Modal */}
      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Account" size="sm">
        <div className="p-4">
          {!deleteOtpSent ? (
            <>
              <p className="mb-6 font-medium" style={{ color: dark ? "#C9B8AE" : "#6B6560" }}>
                Are you sure you want to delete your account? This action cannot be undone. We will send an OTP to your email to confirm.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-5 py-2.5 rounded-xl font-medium transition-colors" style={{ color: dark ? '#C9B8AE' : '#6B6560', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                  Cancel
                </button>
                <button disabled={deleteOtpLoading} onClick={requestDeleteOtp} className="px-5 py-2.5 bg-[#FF6B4A] text-white rounded-xl font-medium hover:bg-[#E85A3A] transition-colors disabled:opacity-50">
                  {deleteOtpLoading ? "Sending..." : "Request OTP"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-4 font-medium" style={{ color: dark ? "#C9B8AE" : "#6B6560" }}>
                Enter the 6-digit OTP sent to your email to confirm account deletion.
              </p>
              <Input 
                type="text" 
                placeholder="000000" 
                value={deleteOtp} 
                onChange={(e) => setDeleteOtp(e.target.value)} 
                className="mb-6"
                maxLength={6}
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-5 py-2.5 rounded-xl font-medium transition-colors" style={{ color: dark ? '#C9B8AE' : '#6B6560', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                  Cancel
                </button>
                <button disabled={deleteOtpLoading} onClick={confirmDeleteAccount} className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
                  {deleteOtpLoading ? "Deleting..." : "Confirm & Delete"}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Update Password Confirmation Modal */}
      <Modal open={showPasswordConfirm} onClose={() => setShowPasswordConfirm(false)} title="Update Password" size="sm">
        <div className="p-4">
          <p className="mb-6 font-medium" style={{ color: dark ? "#C9B8AE" : "#6B6560" }}>
            Are you sure you want to update your password?
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowPasswordConfirm(false)} className="px-5 py-2.5 rounded-xl font-medium transition-colors" style={{ color: dark ? '#C9B8AE' : '#6B6560', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              Cancel
            </button>
            <button onClick={confirmPasswordUpdate} className="px-5 py-2.5 bg-[#FF6B4A] text-white rounded-xl font-medium hover:bg-[#E85A3A] transition-colors">
              Update Password
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
