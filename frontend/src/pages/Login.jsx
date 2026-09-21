import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Leaf, Zap, Shield, Search, Goal, Target, Activity, Moon, Sun, Phone, Scale, Ruler, Calendar, ArrowLeft, MapPin } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { login as apiLogin, signup as apiSignup, requestOtp, loginOtp, forgotPassword, resetPassword } from "../api/auth.js";
import { useTheme } from "../context/ThemeContext.jsx";

/* ─── UTILS ─── */
function Field({ icon: Icon, label, value, onChange, type = "text", placeholder, required, error, autoComplete, options }) {
  const [showPwd, setShowPwd] = useState(false);
  const isPwd = type === "password";
  const { dark } = useTheme();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1.5 w-full">
      <label className="text-[11px] font-bold tracking-widest uppercase transition-colors duration-300" 
             style={{ color: dark ? "#8A7A6E" : "#000000" }}>
        {label}
      </label>
      <div className="relative group">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: dark ? "#000000" : "#000000" }} />}
        
        {type === "select" ? (
          <select 
            value={value} 
            onChange={onChange} 
            required={required}
            className="w-full py-3 text-sm outline-none rounded-xl transition-all duration-300 appearance-none"
            style={{
              paddingLeft: Icon ? "2.75rem" : "1rem", paddingRight: "1rem",
              background: dark ? "rgba(255,255,255,0.03)" : "#FFFFFF",
              border: error ? "1px solid rgba(229,83,61,0.5)" : dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
              color: dark ? "#FDF6F0" : "#000000",
            }}
            onFocus={e => { e.target.style.border = "1px solid rgba(255,107,74,0.6)"; e.target.style.boxShadow = "0 0 0 4px rgba(255,107,74,0.1)"; }}
            onBlur={e => { e.target.style.border = error ? "1px solid rgba(229,83,61,0.5)" : dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)"; e.target.style.boxShadow = "none"; }}
          >
            <option value="" disabled style={{ background: dark ? '#1A1210' : '#FFF', color: dark ? '#FDF6F0' : '#1A1210' }}>{placeholder}</option>
            {options.map(o => <option key={o.value} value={o.value} style={{ background: dark ? '#1A1210' : '#FFF', color: dark ? '#FDF6F0' : '#1A1210' }}>{o.label}</option>)}
          </select>
        ) : (
          <input type={isPwd && showPwd ? "text" : type} placeholder={placeholder} value={value} onChange={onChange} required={required} autoComplete={autoComplete}
            className="w-full py-3 text-sm outline-none rounded-xl transition-all duration-300 placeholder:opacity-50"
            style={{
              paddingLeft: Icon ? "2.75rem" : "1rem", paddingRight: isPwd ? "2.75rem" : "1rem",
              background: dark ? "rgba(255,255,255,0.03)" : "#FFFFFF",
              border: error ? "1px solid rgba(229,83,61,0.5)" : dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
              color: dark ? "#FDF6F0" : "#000000",
            }}
            onFocus={e => { e.target.style.border = "1px solid rgba(255,107,74,0.6)"; e.target.style.boxShadow = "0 0 0 4px rgba(255,107,74,0.1)"; }}
            onBlur={e => { e.target.style.border = error ? "1px solid rgba(229,83,61,0.5)" : dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)"; e.target.style.boxShadow = "none"; }}
          />
        )}
        
        {isPwd && (
          <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors" style={{ color: dark ? "#000000" : "#000000" }}>
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-xs flex items-center gap-1" style={{ color: "#E5533D" }}>
            <AlertCircle className="w-3 h-3" />{error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatCard({ icon: Icon, value, label, delay = 0 }) {
  const { dark } = useTheme();
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}
      className="flex items-center gap-4 px-5 py-4 rounded-2xl backdrop-blur-xl transition-colors duration-500"
      style={{ 
        background: dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.55)", 
        border: dark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(255,255,255,0.4)",
        boxShadow: dark ? "none" : "0 8px 32px rgba(0,0,0,0.04)"
      }}>
      <div className="flex-1">
        <div className="text-xl font-bold tracking-tight" style={{ color: dark ? "#FDF6F0" : "#000000" }}>{value}</div>
        <div className="text-[11px] font-medium tracking-wide uppercase mt-0.5" style={{ color: dark ? "#8A7A6E" : "#000000" }}>{label}</div>
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: dark ? "rgba(255,107,74,0.1)" : "rgba(255,107,74,0.1)", color: "#FF6B4A" }}>
        <Icon className="w-5 h-5" />
      </div>
    </motion.div>
  );
}

function Badge({ icon: Icon, label }) {
  const { dark } = useTheme();
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl transition-colors duration-500"
      style={{ 
        background: dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.55)", 
        border: dark ? "1px solid rgba(255,107,74,0.3)" : "1px solid rgba(255,107,74,0.2)",
        color: dark ? "#FDF6F0" : "#000000"
      }}>
      <Icon className="w-4 h-4" style={{ color: "#FF6B4A" }} />
      <span className="text-xs font-semibold">{label}</span>
    </div>
  );
}

// Timer hook for Resend OTP
function useCountdown(initialSeconds) {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    if (seconds <= 0) return;
    const interval = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(interval);
  }, [seconds]);
  return [seconds, setSeconds];
}

/* ─── MAIN COMPONENT ─── */
export default function Login() {
  const { login: setAuth } = useAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Modes: "login", "register", "register-otp", "login-otp-req", "login-otp-ver", "forgot-password", "reset-password"
  const [mode, setMode] = useState(location.state?.mode || "login");
  
  const [form, setForm] = useState({ 
    name: "", identifier: "", password: "", confirm: "", 
    phone: "", age: "", height: "", weight: "", gender: "", goal: "", activityLevel: "", district: "", otp: "" 
  });
  
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showShake, setShowShake] = useState(false);
  const [timer, setTimer] = useCountdown(0);

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
  
  const validate = () => {
    const e = {};
    if (mode === "register") {
      if (!form.name.trim()) e.name = "Name is required";
      if (!form.identifier.includes("@")) e.identifier = "Enter a valid email";
      if (!form.phone.trim()) e.phone = "Phone number is required";
      if (form.password.length < 6) e.password = "At least 6 characters";
      if (form.password !== form.confirm) e.confirm = "Passwords don't match";
    }
    if (mode === "login") {
      if (!form.identifier.trim()) e.identifier = "Identifier required";
      if (!form.password) e.password = "Password required";
    }
    if (mode === "login-otp-req" || mode === "forgot-password") {
      if (!form.identifier.trim()) e.identifier = "Email or Phone required";
    }
    if (mode === "reset-password") {
      if (!form.otp.trim()) e.otp = "OTP required";
      if (form.password.length < 6) e.password = "At least 6 characters";
    }
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleRequestOtp = async (actionType) => {
    setLoading(true); setApiError(""); setSuccess("");
    try {
      const idToUse = form.identifier;
      await requestOtp(idToUse, actionType);
      setSuccess("OTP sent to your email!");
      setTimer(90); // 1.5 minutes
      if (actionType === "signup") setMode("register-otp");
      else if (actionType === "login") setMode("login-otp-ver");
      else if (actionType === "reset") setMode("reset-password");
    } catch (err) {
      setApiError(err.response?.data?.error || "Failed to send OTP");
      setShowShake(true); setTimeout(() => setShowShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault(); if (!validate()) return;
    setLoading(true); setApiError(""); setSuccess("");
    
    try {
      if (mode === "login") {
        const res = await apiLogin(form.identifier, form.password);
        finishAuth(res.data, "Welcome back!");
      } 
      else if (mode === "register") {
        // Instead of signing up immediately, request OTP first
        await handleRequestOtp("signup");
        // setLoading(false) is handled in handleRequestOtp
      }
      else if (mode === "register-otp") {
        const payload = {
          name: form.name, email: form.identifier, password: form.password, phone: form.phone,
          age: form.age, height: form.height, weight: form.weight, gender: form.gender, goal: form.goal, activityLevel: form.activityLevel, district: form.district,
          otp: form.otp
        };
        const res = await apiSignup(payload);
        finishAuth(res.data, "Account created!");
      }
      else if (mode === "login-otp-req") {
        await handleRequestOtp("login");
      }
      else if (mode === "login-otp-ver") {
        const res = await loginOtp(form.identifier, form.otp);
        finishAuth(res.data, "Logged in successfully!");
      }
      else if (mode === "forgot-password") {
        await handleRequestOtp("reset");
      }
      else if (mode === "reset-password") {
        const res = await resetPassword(form.identifier, form.otp, form.password);
        setSuccess("Password updated! You can now log in.");
        setTimeout(() => switchMode("login"), 2000);
      }
    } catch (err) {
      setApiError(err.response?.data?.message || err.response?.data?.error || err.message || "Something went wrong");
      setShowShake(true); setTimeout(() => setShowShake(false), 500);
    } finally { 
      setLoading(false); 
    }
  };

  const finishAuth = (data, msg) => {
    const token = data.token || data.accessToken;
    const user = data.user || { email: form.identifier, name: form.name };
    if (!token) throw new Error("No token returned");
    localStorage.setItem("token", token);
    setSuccess(msg);
    setTimeout(() => { setAuth(token, user); navigate("/dashboard", { replace: true }); }, 600);
  };

  const switchMode = next => { 
    setMode(next); 
    setErrors({}); setApiError(""); setSuccess(""); 
  };
  
  const dir = mode.includes("register") ? 1 : -1;

  // Dynamic Theme Tokens
  const t = {
    cardBg: dark ? "rgba(20,12,10,0.5)" : "rgba(255,255,255,0.3)",
    cardBorder: dark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(255,255,255,0.4)",
    cardShadow: dark ? "0 32px 64px rgba(0,0,0,0.6)" : "0 24px 64px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)",
    cardBlur: dark ? "backdrop-blur-xl" : "backdrop-blur-md",
    textPrimary: dark ? "#FDF6F0" : "#000000",
    textSecondary: dark ? "#8A7A6E" : "#000000",
    toggleBg: dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.8)",
    toggleBorder: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    toggleInactive: dark ? "#8A7A6E" : "#000000",
    errBg: dark ? "rgba(229,83,61,0.1)" : "rgba(253,237,234,0.9)",
    errBorder: dark ? "rgba(229,83,61,0.2)" : "rgba(245,198,188,0.8)",
    errText: "#E5533D",
    successBg: "rgba(34,197,94,0.08)"
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row transition-colors duration-1000 ease-in-out relative" 
         style={{ background: dark ? "#110A08" : "#FDF8F3" }}>
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <img src="/loginlighttheme.png" alt="" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${dark ? 'opacity-0' : 'opacity-100'}`} />
        <img src="/logindarktheme.png" alt="" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${dark ? 'opacity-100' : 'opacity-0'}`} />
        <div className="absolute inset-0 transition-colors duration-1000 ease-in-out" 
          style={{ background: dark ? "radial-gradient(circle at left, rgba(17,10,8,0.6) 0%, rgba(17,10,8,0.1) 40%, rgba(0,0,0,0) 80%)" : "radial-gradient(circle at left, rgba(253,248,243,0.7) 0%, rgba(253,248,243,0.2) 40%, rgba(255,255,255,0) 80%)" }} 
        />
      </div>

      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleTheme}
          className="p-3 rounded-full shadow-lg transition-colors duration-500 backdrop-blur-xl border flex items-center justify-center"
          style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.55)", borderColor: dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)", color: dark ? "#FDF6F0" : "#000000" }}
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </motion.button>
      </div>

      {/* LEFT PANEL (Copy & Badges) */}
      <div className="hidden lg:flex flex-col w-[55%] pl-12 pr-8 relative z-10 h-full py-10 fixed left-0">
        <nav className="flex items-center gap-3 mb-auto">
          <img src="/custom-logo.png" alt="Logo" className="w-12 h-12 object-contain drop-shadow-lg" />
          <div>
            <span className="text-xl tracking-tight transition-colors duration-500" style={{ color: dark ? "#FDF6F0" : "#000000" }}>
              <span className="font-semibold">NutriVision</span><span style={{ color: "#FF6B4A" }} className="font-bold">Ai</span>
            </span>
            <p className="text-[9px] font-medium tracking-[0.25em] uppercase -mt-1 transition-colors duration-500" style={{ color: dark ? "#8A7A6E" : "#000000" }}>SCAN &middot; TRACK &middot; EAT BETTER</p>
          </div>
        </nav>

        <div className="max-w-xl relative mb-auto mt-12">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight mb-8 transition-colors duration-500" style={{ color: dark ? "#FDF6F0" : "#000000" }}>
            Eat smart.<br />
            <span style={{ color: "#FF6B4A" }}>Live better.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg mb-10 transition-colors duration-500 max-w-sm leading-relaxed" style={{ color: dark ? "#E8DCC8" : "#000000" }}>
            AI-powered food inventory tracking and nutrition insights — built for people who care about what they eat.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-wrap gap-3 mb-16">
            <Badge icon={Zap} label="AI Food Scanner" />
            <Badge icon={Search} label="Smart Search" />
            <Badge icon={Shield} label="Expiry Alerts" />
          </motion.div>

          {/* Bottom Stats */}
          <div className="flex gap-4 w-full">
            <StatCard icon={Target} value="100%" label="Personalized" delay={0.4} />
            <StatCard icon={Activity} value="98%" label="Scan accuracy" delay={0.5} />
            <StatCard icon={Leaf} value="0 waste" label="Goal" delay={0.6} />
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} 
            className="absolute -bottom-20 left-0 text-[10px] font-medium tracking-wider uppercase transition-colors duration-500" style={{ color: dark ? "#000000" : "#000000" }}>
            Nutrition today. A healthier tomorrow.
          </motion.p>
        </div>
      </div>

      {/* RIGHT PANEL (Auth Card) */}
      <div className="w-full lg:w-[45%] lg:ml-auto flex flex-col justify-center items-center p-6 sm:p-12 py-24 lg:py-0 z-20 relative min-h-screen lg:min-h-0 overflow-y-auto">
        <div className="w-full max-w-md relative z-10">
          
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex lg:hidden items-center gap-2.5 mb-8">
            <img src="/custom-logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-md" />
            <span className="font-semibold transition-colors duration-300" style={{ color: t.textPrimary }}>NutriVision<span style={{ color: "#FF6B4A" }}>Ai</span></span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`rounded-3xl p-8 transition-all duration-700 ${t.cardBlur}`}
            style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}
          >
            {/* Header */}
            <div className="mb-6">
              <AnimatePresence mode="wait">
                <motion.div key={mode} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
                  <h2 className="text-3xl font-bold tracking-tight transition-colors duration-500 flex items-center gap-3" style={{ color: t.textPrimary }}>
                    {mode !== "login" && mode !== "register" && (
                      <button type="button" onClick={() => switchMode("login")} className="hover:opacity-70 transition-opacity">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                    )}
                    {mode === "login" && "Welcome back"}
                    {mode === "register" && "Create account"}
                    {mode === "forgot-password" && "Reset Password"}
                    {mode.includes("otp") && "Verify OTP"}
                  </h2>
                  <p className="text-sm mt-1 transition-colors duration-500" style={{ color: t.textSecondary }}>
                    {mode === "login" && "Sign in to continue to your dashboard"}
                    {mode === "register" && "Start tracking your nutrition today"}
                    {mode === "forgot-password" && "Enter your email or phone to reset your password"}
                    {mode.includes("otp") && "We've sent a 6-digit code to your email."}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Toggle pill only for primary modes */}
            {(mode === "login" || mode === "register") && (
              <div className="flex p-1.5 mb-8 rounded-xl transition-colors duration-500" style={{ background: t.toggleBg, border: `1px solid ${t.toggleBorder}` }}>
                {[["login","Sign in"],["register","Sign up"]].map(([m, label]) => (
                  <button key={m} type="button" onClick={() => switchMode(m)}
                    className="relative flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-300 z-10" style={{ color: mode === m ? "#FFFFFF" : t.toggleInactive }}>
                    {mode === m && (
                      <motion.span layoutId="tab-pill-auth" className="absolute inset-0 rounded-lg shadow-md" style={{ background: "linear-gradient(135deg, #FF7A45, #FF4D6D)" }} transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />
                    )}
                    <span className="relative z-10">{label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Form */}
            <AnimatePresence mode="wait" custom={dir}>
              <motion.form key={mode} initial={{ opacity: 0, x: dir > 0 ? 32 : -32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir > 0 ? -32 : 32 }} transition={{ duration: 0.28, ease: "easeInOut" }} onSubmit={handleSubmit} className="space-y-4">

                {mode === "register" && (
                  <>
                    <Field label="Full Name" placeholder="Jane Doe" icon={User} value={form.name} onChange={set("name")} required error={errors.name} autoComplete="name" />
                    <Field label="Email Address" type="email" placeholder="you@example.com" icon={Mail} value={form.identifier} onChange={set("identifier")} required error={errors.identifier} autoComplete="email" />
                    <Field label="Phone Number" type="tel" placeholder="+1234567890" icon={Phone} value={form.phone} onChange={set("phone")} required error={errors.phone} autoComplete="tel" />
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Age" type="number" placeholder="25" icon={Calendar} value={form.age} onChange={set("age")} />
                      <Field label="Height (cm)" type="number" placeholder="170" icon={Ruler} value={form.height} onChange={set("height")} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Weight (kg)" type="number" placeholder="65" icon={Scale} value={form.weight} onChange={set("weight")} />
                      <Field label="Gender" type="select" placeholder="Select" icon={User} value={form.gender} onChange={set("gender")} options={[{label:'Male',value:'male'},{label:'Female',value:'female'},{label:'Other',value:'other'}]} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Activity Level" type="select" placeholder="Select" icon={Activity} value={form.activityLevel} onChange={set("activityLevel")} options={[{label:'Sedentary',value:'sedentary'},{label:'Lightly Active',value:'light'},{label:'Moderately Active',value:'moderate'},{label:'Very Active',value:'active'},{label:'Extra Active',value:'very_active'}]} />
                      <Field label="Goal" type="select" placeholder="Select your goal" icon={Target} value={form.goal} onChange={set("goal")} options={[{label:'Lose Weight',value:'lose'},{label:'Maintain',value:'maintain'},{label:'Gain Muscle/Weight',value:'gain'}]} />
                    </div>
                    <Field label="District / City" placeholder="e.g. New York, Mumbai" icon={MapPin} value={form.district} onChange={set("district")} autoComplete="address-level2" />
                    <Field label="Password" type="password" placeholder="Min 6 characters" icon={Lock} value={form.password} onChange={set("password")} required error={errors.password} autoComplete="new-password" />
                    <Field label="Confirm Password" type="password" placeholder="Repeat password" icon={Lock} value={form.confirm} onChange={set("confirm")} required error={errors.confirm} autoComplete="new-password" />
                  </>
                )}

                {mode === "login" && (
                  <>
                    <Field label="Email or Phone Number" type="text" placeholder="you@example.com or phone" icon={Mail} value={form.identifier} onChange={set("identifier")} required error={errors.identifier} autoComplete="username" />
                    <Field label="Password" type="password" placeholder="••••••••" icon={Lock} value={form.password} onChange={set("password")} required error={errors.password} autoComplete="current-password" />
                    
                    <div className="flex justify-between items-center text-xs mt-2" style={{ color: t.textSecondary }}>
                      <button type="button" onClick={() => switchMode("login-otp-req")} className="hover:text-[#FF6B4A] transition-colors">Login with OTP</button>
                      <button type="button" onClick={() => switchMode("forgot-password")} className="hover:text-[#FF6B4A] transition-colors">Forgot Password?</button>
                    </div>
                  </>
                )}

                {(mode === "login-otp-req" || mode === "forgot-password") && (
                  <Field label="Email or Phone Number" type="text" placeholder="you@example.com or phone" icon={Mail} value={form.identifier} onChange={set("identifier")} required error={errors.identifier} />
                )}

                {(mode === "register-otp" || mode === "login-otp-ver" || mode === "reset-password") && (
                  <Field label="6-Digit OTP" type="text" placeholder="123456" icon={Shield} value={form.otp} onChange={set("otp")} required error={errors.otp} />
                )}

                {mode === "reset-password" && (
                  <Field label="New Password" type="password" placeholder="Min 6 characters" icon={Lock} value={form.password} onChange={set("password")} required error={errors.password} />
                )}

                {/* Resend OTP Logic */}
                {(mode === "register-otp" || mode === "login-otp-ver" || mode === "reset-password") && (
                  <div className="flex justify-end text-xs mt-2" style={{ color: t.textSecondary }}>
                    {timer > 0 ? (
                      <span>Resend OTP in {timer}s</span>
                    ) : (
                      <button type="button" onClick={() => handleRequestOtp(mode.includes('register') ? 'signup' : mode.includes('reset') ? 'reset' : 'login')} className="font-bold text-[#FF6B4A] hover:underline">
                        Resend OTP
                      </button>
                    )}
                  </div>
                )}

                <AnimatePresence>
                  {apiError && (
                    <motion.div initial={{ opacity: 0, height: 0, y: -8 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0 }} className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm ${showShake ? "animate-shake" : ""}`} style={{ background: t.errBg, border: `1px solid ${t.errBorder}`, color: t.errText }}>
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{apiError}</span>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: t.successBg, border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}>
                      <CheckCircle2 className="w-4 h-4" /><span>{success}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                  className={`w-full py-3.5 rounded-xl text-sm font-semibold text-white relative overflow-hidden mt-4 disabled:opacity-60 transition-all ${!loading ? "animate-glow-pulse" : ""}`}
                  style={{ background: "linear-gradient(135deg, #FF7A45, #FF4D6D)", boxShadow: "0 0 24px rgba(255,107,74,0.35), 0 4px 16px rgba(0,0,0,0.15)" }}>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <><span className="w-4 h-4 rounded-full border-2 border-white/50 border-t-white animate-spin" />Processing...</>
                    ) : (
                      <>
                        {mode === "login" && "Sign in to dashboard"}
                        {mode === "register" && "Create my account"}
                        {(mode === "login-otp-req" || mode === "forgot-password") && "Send OTP"}
                        {(mode === "register-otp" || mode === "login-otp-ver") && "Verify & Proceed"}
                        {mode === "reset-password" && "Reset Password"}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </span>
                </motion.button>

                {(mode === "login" || mode === "register") && (
                  <p className="text-center text-xs pt-2 transition-colors duration-500" style={{ color: t.textSecondary }}>
                    {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                    <button type="button" onClick={() => switchMode(mode === "login" ? "register" : "login")} className="font-bold transition-colors" style={{ color: "#FF6B4A" }}>
                      {mode === "login" ? "Sign up free" : "Sign in"}
                    </button>
                  </p>
                )}
              </motion.form>
            </AnimatePresence>
          </motion.div>

          <p className="text-center text-[11px] mt-6 transition-colors duration-500" style={{ color: t.textSecondary }}>
            By continuing, you agree to our <span className="cursor-pointer font-semibold" style={{ color: "#FF6B4A" }}>Terms & Privacy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
