import sys
with open('src/pages/CalorieTracker.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('import { useState, useEffect } from "react";', 'import { useState, useEffect } from "react";\nimport { useLocation, useNavigate } from "react-router-dom";\nimport { Check, AlertCircle } from "lucide-react";')
c = c.replace('return (\n    <div className="w-full', 'return (\n    <>\n      <AnimatePresence>{toast.msg && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>\n      <div className="w-full')
c = c.replace('      </div>\n    </div>\n  );\n}', '      </div>\n    </div>\n    </>\n  );\n}')

with open('src/pages/CalorieTracker.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
