import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Markdown from "react-markdown";
import { sendMessage } from "../api/chat.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Send, Leaf, PlusCircle, History } from "lucide-react";

const SUGGESTIONS = [
  "What can I make for dinner tonight?",
  "Show me my highest calorie items",
  "How much protein have I logged?",
  "Which items expire this week?",
  "Give me a healthy meal plan idea"
];

function Message({ msg, isTypingEffect = false }) {
  const isUser = msg.role === "user";
  const [displayedText, setDisplayedText] = useState(isTypingEffect ? "" : msg.content);

  useEffect(() => {
    if (!isTypingEffect) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(msg.content.slice(0, i));
      i++;
      if (i > msg.content.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [msg.content, isTypingEffect]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* AI avatar */}
      {!isUser && (
        <img src="/custom-logo.png" alt="AI Avatar" className="w-8 h-8 rounded-xl shrink-0 mt-0.5 object-cover drop-shadow-md" />
      )}
      {/* Bubble */}
      <div className={`max-w-[78%] px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? "rounded-2xl rounded-tr-sm text-white"
          : "rounded-2xl rounded-tl-sm glass"
      }`}
        style={isUser
          ? { background: "linear-gradient(135deg, #FF6B4A, #E55540)", boxShadow: "0 4px 20px rgba(255,107,74,0.25)" }
          : {}
        }
      >
        {isUser ? (
          <p className="whitespace-pre-line">{displayedText}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-pre:bg-white/5 prose-pre:rounded-lg max-w-none">
            <Markdown>{displayedText}</Markdown>
          </div>
        )}
        <p className={`text-[10px] mt-1.5 ${isUser ? "text-white/60" : "text-zinc-500"}`}>
          {new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Typing Indicator ── */
function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-3">
      <img src="/custom-logo.png" alt="AI Avatar" className="w-8 h-8 rounded-xl shrink-0 drop-shadow-md object-contain" />
      <div className="rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-2 glass">
        {[0, 1, 2].map(i => (
          <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-mint-400"
            animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18 }} />
        ))}
      </div>
    </motion.div>
  );
}

/* ── Main ── */
export default function ChatBot() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "there";
  const defaultMessage = { role: "assistant", content: `Hi ${firstName}! 👋\n\nI'm your **NutriVision AI** assistant. I can help you with:\n- 🍳 Meal ideas from your inventory\n- 📊 Nutrition insights and tracking\n- 📅 Expiry reminders\n\nWhat would you like to know?`, ts: Date.now() };
  
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("nutrivision_current_chat");
    return saved ? JSON.parse(saved) : [defaultMessage];
  });
  const [historySessions, setHistorySessions] = useState(() => {
    const saved = localStorage.getItem("nutrivision_chat_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();
  const textareaRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem("nutrivision_current_chat", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("nutrivision_chat_history", JSON.stringify(historySessions));
  }, [historySessions]);

  const newChat = () => {
    if (messages.length > 1) {
      setHistorySessions(prev => [{ id: Date.now(), messages }, ...prev].slice(0, 50));
    }
    setMessages([{ ...defaultMessage, ts: Date.now() }]);
  };

  // Auto-resize textarea
  const resize = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
  };

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    const userMsg = { role: "user", content: msg, ts: Date.now() };
    setMessages(p => [...p, userMsg]);
    setLoading(true);
    try {
      const historyLog = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const r = await sendMessage(user.id, msg, historyLog);
      const reply = typeof r.data === 'string' ? r.data : (r.data?.reply || r.data?.message || r.data?.response || "I couldn't get a response. Please try again.");
      setMessages(p => [...p, { role: "assistant", content: reply, ts: Date.now() }]);
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "Sorry, I ran into an error. Please check the backend is running and try again.", ts: Date.now() }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9.5rem)] -mb-14 p-4 sm:p-6 rounded-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold">ChatBot</h1>
          <p className="text-sm text-black dark:text-white mt-0.5">AI-powered nutrition assistant</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white glass px-3 py-2 rounded-xl transition-all">
            <History className="w-3.5 h-3.5" /> History
          </button>
          <button onClick={newChat}
            className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white glass px-3 py-2 rounded-xl transition-all">
            <PlusCircle className="w-3.5 h-3.5" /> New Chat
          </button>
        </div>
      </div>

      {showHistory && (
        <div className="glass rounded-xl p-3 mb-4 max-h-40 overflow-y-auto">
          <h3 className="text-xs font-semibold mb-2">Past Conversations</h3>
          {historySessions.length === 0 ? <p className="text-xs text-zinc-400">No past conversations.</p> : (
            <div className="space-y-2">
              {historySessions.map(session => (
                <button key={session.id} onClick={() => { setMessages(session.messages); setShowHistory(false); }}
                  className="w-full text-left text-xs bg-black/5 dark:bg-white/5 p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors truncate">
                  {new Date(session.id).toLocaleString()} - {session.messages[1]?.content || "Chat"}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((m, i) => (
          <Message key={i} msg={m} isTypingEffect={i === 0 && messages.length === 1 && m.role === "assistant"} />
        ))}
        <AnimatePresence>{loading && <TypingIndicator />}</AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Suggestions (only at start) */}
      <AnimatePresence>
        {messages.length <= 1 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
            className="flex gap-2 flex-wrap py-3 shrink-0">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)}
                className="glass px-3 py-2 rounded-xl text-xs text-black dark:text-white hover:text-mint-400 hover:border-mint-500/20 transition-all text-left">{s}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input dock */}
      <div className="shrink-0 pt-3 mt-3">
        <div className="rounded-2xl p-3 glass">
          <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); resize(); }}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask about your food, nutrition, meal ideas..."
              rows={1}
              style={{ resize: "none" }}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-black/50 dark:placeholder:text-white/50 py-1.5"
            />
            <motion.button
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.05 }}
              type="submit"
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-colors shrink-0"
              style={{ background: "linear-gradient(135deg, #FF6B4A, #E55540)", boxShadow: "0 0 16px rgba(255,107,74,0.3)" }}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
