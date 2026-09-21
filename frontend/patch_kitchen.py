import sys
with open('src/pages/Kitchen.jsx', 'r') as f:
    c = f.read()

c = c.replace('import { useTheme } from "../context/ThemeContext.jsx";', 'import Modal from "../components/ui/Modal.jsx";\nimport { useTheme } from "../context/ThemeContext.jsx";')
c = c.replace('const [logStatus, setLogStatus] = useState(null);', 'const [logStatus, setLogStatus] = useState(null);\n  const [showLogConfirm, setShowLogConfirm] = useState(false);')
c = c.replace('const handleLogRecipe = async () => {\n    if (!selectedRecipe) return;\n    setLogStatus(\'loading\');', 'const handleLogRecipe = async () => {\n    if (!selectedRecipe) return;\n    setShowLogConfirm(false);\n    setLogStatus(\'loading\');')
c = c.replace('onClick={handleLogRecipe}', 'onClick={() => setShowLogConfirm(true)}')

modal_code = """      </AnimatePresence>

      <Modal open={showLogConfirm} onClose={() => setShowLogConfirm(false)} title="Confirm Action" size="sm">
        <div className="p-4">
          <p className="mb-6 font-medium" style={{ color: dark ? "#C9B8AE" : "#6B6560" }}>
            Are you sure you want to log this recipe to your Calorie Tracker for today?
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowLogConfirm(false)} className="px-5 py-2.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
              Cancel
            </button>
            <button onClick={handleLogRecipe} className="px-5 py-2.5 bg-[#FF6B4A] text-white rounded-xl font-medium hover:bg-[#E85A3A] transition-colors">
              Cooked & Log
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}"""
c = c.replace('      </AnimatePresence>\n\n    </div>\n  );\n}', modal_code)

with open('src/pages/Kitchen.jsx', 'w') as f:
    f.write(c)
