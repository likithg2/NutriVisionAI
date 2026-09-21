import sys
with open('src/pages/CalorieTracker.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('import { useState, useEffect } from "react";', 'import { useState, useEffect } from "react";\nimport { useLocation, useNavigate } from "react-router-dom";\nimport { Check, AlertCircle } from "lucide-react";')
c = c.replace('export default function CalorieTracker() {', '''function Toast({ msg, type }) {
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

export default function CalorieTracker() {
  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState({ msg: "", type: "" });
  
  useEffect(() => {
    if (location.state?.showToast) {
      setToast({ msg: location.state.showToast, type: "success" });
      setTimeout(() => setToast({ msg: "", type: "" }), 4000);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location]);
''')

c = c.replace('return (\n    <div className="w-full', 'return (\n    <>\n      <AnimatePresence>{toast.msg && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>\n      <div className="w-full')
c = c.replace('      </div>\n    </div>\n  );\n}', '      </div>\n    </div>\n    </>\n  );\n}')

with open('src/pages/CalorieTracker.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
