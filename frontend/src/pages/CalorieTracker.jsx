import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Flame, Plus, Sparkles, ChefHat, Target, Camera, Loader2, AlertTriangle, Search as SearchIcon, Activity, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import api from '../api/axios.js';
import { estimateFood } from '../api/scanner.js';
import MacroChart from '../components/charts/MacroChart.jsx';
import Input from '../components/ui/Input.jsx';
import Markdown from 'react-markdown';

const INSPIRING_FACTS = [
  "Eating a rainbow of vegetables ensures you get a wide variety of essential vitamins and minerals.",
  "Staying hydrated can boost your metabolism and help you feel fuller throughout the day.",
  "Did you know? Almonds are a great source of heart-healthy monounsaturated fats and vitamin E.",
  "Protein is the building block of your muscles—aim to include a source in every meal!",
  "A handful of walnuts a day can support brain health thanks to their omega-3 fatty acids.",
  "Dark chocolate (70%+ cocoa) is packed with antioxidants and can actually improve heart health.",
  "Fiber-rich foods like oats and lentils help maintain steady energy levels and support digestion.",
  "Avocados are rich in potassium, which helps regulate blood pressure and muscle function.",
  "Don't fear carbs! Complex carbohydrates like sweet potatoes are your body's preferred energy source.",
  "Spices like turmeric and cinnamon not only add flavor but also possess powerful anti-inflammatory properties."
];

export default function CalorieTracker() {
  const { dark } = useTheme();
  const { user } = useAuth();
  
  const [data, setData] = useState({ 
    goals: { calories: 2000, protein: 150, carbs: 200, fat: 65 }, 
    consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 }, 
    logs: [] 
  });
  const [loading, setLoading] = useState(true);
  const [todayLogs, setTodayLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const [showLogModal, setShowLogModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [newLog, setNewLog] = useState({ itemName: '', quantity: '100', calories: '', protein: '', carbs: '', fat: '', mealType: 'snack' });

  // Lock body scroll when modals are open
  useEffect(() => {
    if (showLogModal || showScanModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showLogModal, showScanModal]);
  
  const getLocalYYYYMMDD = (d = new Date()) => {
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().split('T')[0];
  };
  const [currentDate, setCurrentDate] = useState(getLocalYYYYMMDD());
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [suggesting, setSuggesting] = useState(false);
  const [placeholderFact] = useState(() => INSPIRING_FACTS[Math.floor(Math.random() * INSPIRING_FACTS.length)]);


  
  const fileInputRef = React.useRef(null);
  const cameraInputRef = React.useRef(null);
  const [scanning, setScanning] = useState(false);
  const [aiEstimateLoading, setAiEstimateLoading] = useState(false);

  const handleScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScanning(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await api.post('/api/ai/scan', formData);
      setNewLog({
        itemName: res.data.itemName || 'Scanned Meal',
        calories: res.data.calories || 0,
        protein: res.data.protein || 0,
        carbs: res.data.carbs || 0,
        fat: res.data.fat || 0,
        servings: 1,
        mealType: 'snack'
      });
      setShowLogModal(true);
    } catch (err) {
      console.error(err);
      alert('Failed to scan meal. Ensure your image is clear and try again.');
    } finally {
      setScanning(false);
      e.target.value = '';
    }
  };

  const location = useLocation();
  const navigate = useNavigate();

  const handleAnalyse = async () => {
    if (!newLog.itemName || newLog.itemName.length < 2) return;
    setAiEstimateLoading(true);
    try {
      const { data } = await estimateFood(newLog.itemName, newLog.quantity);
      if (data) {
        setNewLog(prev => ({
          ...prev,
          calories: data.calories || 0,
          protein: data.protein || 0,
          carbs: data.carbs || 0,
          fat: data.fat || 0,
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiEstimateLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fdcId = params.get("addFood");
    if (fdcId) {
      // Fetch food details and open log modal
      api.get(`/api/usda/food/${fdcId}`).then(res => {
        const food = res.data.food;
        setNewLog({
          itemName: food.name,
          calories: Math.round(food.calories),
          protein: Math.round(food.protein),
          carbs: Math.round(food.carbohydrates),
          fat: Math.round(food.fat),
          servings: 1,
          mealType: "snack"
        });
        setShowLogModal(true);
        // Clear query param
        navigate("/calories", { replace: true });
      }).catch(err => {
        console.error("Failed to load food from USDA:", err);
      });
    }
  }, [location.search, navigate]);

  
  const fetchStats = async () => {
    setLoading(true);
    setAdvice(null);
    try {
      const res = await api.get(`/api/calories?date=${currentDate}`);
      if (res.data && !res.data.error) {
        setData(res.data);
      } else {
        console.error('API returned an error:', res.data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchStats();
  }, [currentDate]);

  useEffect(() => {
    if (!loading && !advice && !gettingAdvice && data.goals) {
      getDietExerciseAdvice();
    }
  }, [loading]);

  const handleLogMeal = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/calories', { ...newLog, date: currentDate });
      setShowLogModal(false);
      setNewLog({ itemName: '', quantity: '100', calories: '', protein: '', carbs: '', fat: '', mealType: 'snack' });
      localStorage.removeItem(`ai_advice_${currentDate}`);
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  const changeDate = (days) => {
    const d = new Date(currentDate);
    d.setUTCDate(d.getUTCDate() + days);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const formatDisplayDate = (dateStr) => {
    const today = getLocalYYYYMMDD();
    if (dateStr === today) return "Today";
    
    const d = new Date(dateStr);
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    if (dateStr === getLocalYYYYMMDD(yest)) return "Yesterday";
    
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const [advice, setAdvice] = useState(null);
  const [gettingAdvice, setGettingAdvice] = useState(false);

  const getAiSuggestion = async () => {
    setSuggesting(true);
    setAiSuggestion(null);
    try {
      // Fetch inventory items
      const itemsRes = await api.get('/api/items');
      const items = (itemsRes.data.items || []).map(i => i.name).join(', ');
      
      const prompt = `I have the following items in my fridge: ${items || 'nothing'}. 
      My macro goals for today are: ${data.goals.calories} cals, ${data.goals.protein}g protein, ${data.goals.carbs}g carbs, ${data.goals.fat}g fat.
      I have consumed: ${data.consumed.calories} cals, ${data.consumed.protein}g protein, ${data.consumed.carbs}g carbs, ${data.consumed.fat}g fat.
      
      Please suggest ONE simple, delicious meal I can make using my ingredients to help me reach my remaining macros. Make it short and inspiring.`;

      const res = await api.post('/api/chat', { userId: user?.id, message: prompt, history: [] });
      setAiSuggestion(res.data?.reply || res.data?.structured?.summary || String(res.data));
    } catch (err) {
      console.error(err);
      setAiSuggestion("Unable to generate a suggestion right now. Please try again later.");
    } finally {
      setSuggesting(false);
    }
  };

  const getDietExerciseAdvice = async (force = false) => {
    const CACHE_KEY = `ai_advice_${currentDate}`;
    const isForce = force === true || force?.type === 'click';
    
    if (!isForce) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        setAdvice(cached);
        return;
      }
    }

    setGettingAdvice(true);
    setAdvice(null);
    try {
      const itemsRes = await api.get('/api/items');
      const items = (itemsRes.data.items || []).map(i => i.name).join(', ');
      
      const prompt = `I have the following items in my fridge: ${items || 'nothing'}. 
      My macro goals for today are: ${data.goals.calories} cals, ${data.goals.protein}g protein, ${data.goals.carbs}g carbs, ${data.goals.fat}g fat.
      I have consumed: ${data.consumed.calories} cals, ${data.consumed.protein}g protein, ${data.consumed.carbs}g carbs, ${data.consumed.fat}g fat.
      
      Please provide a structured daily plan for me. Use beautiful, clean markdown formatting with plenty of emojis. Use bullet points and spacious line breaks so it doesn't look crowded. Include exactly these 3 sections:
      
      1. 🍽️ **Meal Suggestion**: A specific meal you can make using ingredients you already have to hit your exact remaining macros for the day.
      2. 🥗 **Diet Advice**: Tailored recommendations on what foods/products you should add to your diet to hit your macros and help with weight reduction.
      3. 🏃‍♂️ **Exercise Plan**: Practical advice on how much walking, steps, or light workouts you should do to balance your calories for the day.
      
      Make it engaging, highly practical, and visually stunning.`;

      const res = await api.post('/api/chat', { userId: user?.id, message: prompt, history: [] });
      const adviceStr = res.data?.reply || res.data?.structured?.summary || String(res.data);
      setAdvice(adviceStr);
      localStorage.setItem(CACHE_KEY, adviceStr);
    } catch (err) {
      console.error(err);
      setAdvice("Unable to generate advice right now. Please try again later.");
    } finally {
      setGettingAdvice(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF6B4A] border-t-transparent animate-spin" />
      </div>
    );
  }

  const { goals, consumed, logs } = data;
  const calsPercent = Math.min((consumed.calories / goals.calories) * 100, 100) || 0;
  
  const macros = [
    { label: 'Protein', value: consumed.protein, goal: goals.protein, color: '#3b82f6' },
    { label: 'Carbs', value: consumed.carbs, goal: goals.carbs, color: '#eab308' },
    { label: 'Fat', value: consumed.fat, goal: goals.fat, color: '#ec4899' },
  ];

  // Compute over-limit macros
  const overLimitMacros = [];
  if (consumed.calories > goals.calories) overLimitMacros.push(`Calories (${consumed.calories}/${goals.calories} kcal)`);
  if (consumed.protein > goals.protein) overLimitMacros.push(`Protein (${consumed.protein}g/${goals.protein}g)`);
  if (consumed.carbs > goals.carbs) overLimitMacros.push(`Carbs (${consumed.carbs}g/${goals.carbs}g)`);
  if (consumed.fat > goals.fat) overLimitMacros.push(`Fat (${consumed.fat}g/${goals.fat}g)`);

  const heightM = (user?.height || 0) / 100;
  const weightKg = user?.weight || 0;
  const bmi = heightM > 0 && weightKg > 0 ? (weightKg / (heightM * heightM)).toFixed(1) : null;
  
  let bmiCategory = "Unknown";
  let bmiColor = "#C9B8AE";
  
  if (bmi) {
    if (bmi < 18.5) { bmiCategory = "Underweight"; bmiColor = "#3b82f6"; }
    else if (bmi < 25) { bmiCategory = "Normal"; bmiColor = "#22c55e"; }
    else if (bmi < 30) { bmiCategory = "Overweight"; bmiColor = "#eab308"; }
    else { bmiCategory = "Obese"; bmiColor = "#ef4444"; }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: dark ? '#FDF6F0' : '#1A1210' }}>Calorie Tracker</h1>
          
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center glass rounded-xl ring-1 ring-black/5 dark:ring-white/10 p-1">
              <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 px-3 font-medium min-w-[120px] justify-center text-sm">
                <CalendarIcon className="w-4 h-4 opacity-50" />
                {formatDisplayDate(currentDate)}
              </div>
              <button 
                onClick={() => changeDate(1)} 
                disabled={currentDate === getLocalYYYYMMDD()} 
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {currentDate !== getLocalYYYYMMDD() && (
              <button onClick={() => setCurrentDate(getLocalYYYYMMDD())} className="text-xs font-medium text-[#FF6B4A] hover:underline">
                Back to Today
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button onClick={() => setShowScanModal(true)} disabled={scanning} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-white rounded-xl font-medium transition-colors shadow-lg" style={{ background: dark ? "rgba(255,255,255,0.1)" : "#1A1210" }}>
            {scanning ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Camera className="w-4 h-4" />} Scan
          </button>
          <button onClick={() => setShowLogModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#FF6B4A] text-white rounded-xl font-medium hover:bg-[#E85A3A] transition-colors shadow-lg">
            <Plus className="w-4 h-4" /> Log
          </button>
          <input type="file" ref={fileInputRef} onChange={(e) => { setShowScanModal(false); handleScan(e); }} accept="image/*" className="hidden" />
          <input type="file" ref={cameraInputRef} onChange={(e) => { setShowScanModal(false); handleScan(e); }} accept="image/*" capture="environment" className="hidden" />
        </div>
      </motion.div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Calories Circle */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="col-span-1 glass p-6 rounded-3xl flex flex-col items-center justify-center relative">
          <h2 className="text-lg font-semibold mb-6 w-full text-center" style={{ color: dark ? '#E5D5C5' : '#4A4542' }}>Daily Calories</h2>
          
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="88" stroke={dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"} strokeWidth="12" fill="none" />
              <motion.circle 
                initial={{ strokeDasharray: "0, 1000" }}
                animate={{ strokeDasharray: `${(calsPercent / 100) * 553}, 1000` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                cx="96" cy="96" r="88" 
                stroke="#FF6B4A" 
                strokeWidth="12" 
                fill="none" 
                strokeLinecap="round" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Flame className="w-6 h-6 text-[#FF6B4A] mb-1" />
              <span className="text-3xl font-bold" style={{ color: dark ? '#FDF6F0' : '#1A1210' }}>{Math.max(goals.calories - consumed.calories, 0)}</span>
              <span className="text-xs" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>Remaining</span>
            </div>
          </div>
          
          <div className="flex justify-between w-full mt-6 px-4 text-sm font-medium" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>
            <span>{consumed.calories} Consumed</span>
            <span>{goals.calories} Goal</span>
          </div>
        </motion.div>

        {/* Macros */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="col-span-1 glass p-6 rounded-3xl flex flex-col items-center justify-center relative">
          <h2 className="text-lg font-semibold mb-2 w-full text-center" style={{ color: dark ? '#E5D5C5' : '#4A4542' }}>Macro Split</h2>
          <MacroChart protein={consumed.protein} carbs={consumed.carbs} fat={consumed.fat} dark={dark} />
        </motion.div>
        
        <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {macros.map((m, i) => {
            const pct = (m.value / m.goal) * 100 || 0;
            return (
              <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`glass p-5 rounded-3xl flex flex-col justify-between ${pct > 100 ? 'ring-1 ring-red-500/40' : ''}`}>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold" style={{ color: dark ? '#E5D5C5' : '#4A4542' }}>{m.label}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md text-white`} style={{ background: pct > 100 ? '#ef4444' : m.color }}>{Math.round(pct)}%</span>
                  </div>
                  <span className="text-xs" style={{ color: pct > 100 ? '#ef4444' : (dark ? '#C9B8AE' : '#6B6560') }}>{m.value}g / {m.goal}g{pct > 100 ? ' ⚠️' : ''}</span>
                </div>
                
                <div className="w-full h-3 rounded-full mt-4 overflow-hidden" style={{ background: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(pct, 100)}%` }}
                    transition={{ duration: 1, delay: 0.2 + (i * 0.1) }}
                    className="h-full rounded-full"
                    style={{ background: pct > 100 ? '#ef4444' : m.color }}
                  />
                </div>
              </motion.div>
            );
          })}

          {/* AI Suggestion Card */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="col-span-1 sm:col-span-3 glass p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#FF6B4A]/10 rounded-full blur-3xl group-hover:bg-[#FF6B4A]/20 transition-colors" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-[#FF6B4A]" />
                <h3 className="font-semibold text-lg" style={{ color: dark ? '#FDF6F0' : '#1A1210' }}>Smart Meal Suggestion</h3>
              </div>
              <button 
                onClick={getAiSuggestion}
                disabled={suggesting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{ background: dark ? 'rgba(255,107,74,0.15)' : 'rgba(255,107,74,0.1)', color: '#FF6B4A' }}
              >
                {suggesting ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {suggesting ? 'Thinking...' : 'Inspire Me'}
              </button>
            </div>
            
            <div className="relative z-10 p-4 rounded-2xl" style={{ background: dark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)', border: dark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
              {aiSuggestion ? (
                <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none
                                prose-headings:text-[#FF6B4A] prose-headings:font-bold
                                prose-a:text-[#FF6B4A] hover:prose-a:text-[#E55540]
                                prose-li:marker:text-[#FF6B4A]" 
                     style={{ color: dark ? '#E5D5C5' : '#4A4542' }}>
                  <Markdown>{aiSuggestion}</Markdown>
                </div>
              ) : (
                <p className="text-sm text-center italic" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>
                  💡 {placeholderFact}
                </p>
              )}
            </div>
          </motion.div>

        </div>
      </div>

      {/* Over-Limit Alert */}
      <AnimatePresence>
        {overLimitMacros.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="glass p-5 rounded-3xl border border-red-500/30"
            style={{ background: dark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)' }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-red-500/15">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-red-500 mb-1">Daily Limit Exceeded!</h3>
                <p className="text-sm leading-relaxed" style={{ color: dark ? '#E5D5C5' : '#4A4542' }}>
                  You've gone over your daily goal for: <strong>{overLimitMacros.join(', ')}</strong>. Consider lighter meals for the rest of the day to stay on track.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body Metrics */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6 mt-6">
        <div className="flex-1">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-2" style={{ color: dark ? '#FDF6F0' : '#1A1210' }}>
            <Sparkles className="w-5 h-5 text-[#FF6B4A]" /> Body Metrics
          </h3>
          {bmi ? (
            <p className="text-sm" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>
              Based on your profile, your BMI is <strong>{bmi}</strong>, which is classified as <strong style={{ color: bmiColor }}>{bmiCategory}</strong>.
            </p>
          ) : (
            <p className="text-sm" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>
              Please update your height and weight in Settings to calculate your BMI and body status.
            </p>
          )}
        </div>
        <div className="w-full md:w-1/2 bg-black/5 dark:bg-white/5 rounded-2xl h-3 relative overflow-hidden flex">
          {/* BMI Scale gradient */}
          <div className="h-full w-[18.5%] bg-blue-500" title="Thin (<18.5)" />
          <div className="h-full w-[25%] bg-green-500" title="Fit (18.5-24.9)" />
          <div className="h-full w-[25%] bg-yellow-500" title="Overweight (25-29.9)" />
          <div className="h-full flex-1 bg-red-500" title="Obese (30+)" />
          
          {/* Indicator Marker */}
          {bmi && (
            <motion.div 
              initial={{ left: 0 }}
              animate={{ left: `${Math.max(0, Math.min(100, ((bmi - 10) / 30) * 100))}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)] z-10 rounded-full -ml-0.5"
            />
          )}
        </div>
      </motion.div>

      {/* AI Diet & Exercise Advice */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }} className="glass p-6 rounded-3xl mt-6 relative overflow-hidden group">
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#FF6B4A]/10 rounded-full blur-3xl group-hover:bg-[#FF6B4A]/20 transition-colors" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#FF6B4A]" />
            <h3 className="font-semibold text-lg" style={{ color: dark ? '#FDF6F0' : '#1A1210' }}>Smart Diet & Exercise Advice</h3>
          </div>
          <button 
            onClick={getDietExerciseAdvice}
            disabled={gettingAdvice}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm w-full sm:w-auto"
            style={{ background: '#FF6B4A', color: '#FFF' }}
          >
            {gettingAdvice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {gettingAdvice ? 'Analyzing...' : 'Refresh Advice'}
          </button>
        </div>

        <div className="relative z-10">
          {advice ? (
            <div className="p-4 rounded-2xl" style={{ background: dark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)', border: dark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
              <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none
                              prose-headings:text-[#FF6B4A] prose-headings:font-bold
                              prose-a:text-[#FF6B4A] hover:prose-a:text-[#E55540]
                              prose-li:marker:text-[#FF6B4A]" 
                   style={{ color: dark ? '#E5D5C5' : '#4A4542' }}>
                <Markdown>{advice}</Markdown>
              </div>
            </div>
          ) : (
            <p className="text-sm italic" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>
              Click the button above to receive a personalized meal, diet, and exercise plan based on your current macros and inventory.
            </p>
          )}
        </div>
      </motion.div>

      {/* Today's Log */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass p-6 rounded-3xl">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2" style={{ color: dark ? '#FDF6F0' : '#1A1210' }}>
          <Target className="w-5 h-5 text-[#FF6B4A]" /> Today's Log
        </h3>
        
        {logs.length === 0 ? (
          <div className="text-center py-8" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>
            <p>No meals logged today. Time to eat!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex justify-between items-center p-4 rounded-2xl" style={{ background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <div>
                  <p className="font-medium" style={{ color: dark ? '#E5D5C5' : '#4A4542' }}>{log.itemName}</p>
                  <p className="text-xs mt-0.5 capitalize" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>{log.mealType} • {log.servings} serving(s)</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#FF6B4A]">{log.calories * log.servings} kcal</p>
                  <p className="text-xs mt-0.5" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>
                    P: {log.protein * log.servings}g • C: {log.carbs * log.servings}g • F: {log.fat * log.servings}g
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Log Modal */}
      <AnimatePresence>
        {showLogModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="fixed inset-0 z-40 flex items-center justify-center p-4 pb-6 bg-white/5 dark:bg-black/20 backdrop-blur-2xl" onClick={() => setShowLogModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()} className="relative flex flex-col w-full max-w-lg rounded-2xl z-10 bg-white/70 dark:bg-[#1A1210]/70 backdrop-blur-3xl border border-white/60 dark:border-white/20 shadow-2xl ring-1 ring-white/40 dark:ring-white/10" style={{ maxHeight: '90dvh' }}>
              <div className="flex-none flex items-center justify-between p-6 pb-4 border-b border-black/5 dark:border-white/5">
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: dark ? '#FDF6F0' : '#1A1210' }}>
                  Log a Meal
                  {aiEstimateLoading && <Loader2 className="w-5 h-5 animate-spin text-[#FF6B4A]" />}
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 pt-5">
                <form onSubmit={handleLogMeal} className="space-y-4">
                  <Input label="Food Name" required value={newLog.itemName} onChange={e => setNewLog({...newLog, itemName: e.target.value})} placeholder="e.g. Chicken Salad" />
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Input label="Quantity (g/ml)" required type="number" value={newLog.quantity} onChange={e => setNewLog({...newLog, quantity: e.target.value})} placeholder="100" />
                  </div>
                  <button
                    type="button"
                    onClick={handleAnalyse}
                    disabled={aiEstimateLoading || !newLog.itemName || newLog.itemName.length < 2 || !newLog.quantity}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-40 shrink-0 mb-[2px]"
                    style={{ background: 'linear-gradient(135deg, #FF6B4A, #E55540)', color: 'white' }}
                  >
                    {aiEstimateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
                    {aiEstimateLoading ? 'Analysing...' : 'Analyse'}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Calories" required type="number" value={newLog.calories} onChange={e => setNewLog({...newLog, calories: e.target.value})} placeholder="kcal" />
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Meal Type</label>
                    <select value={newLog.mealType} onChange={e => setNewLog({...newLog, mealType: e.target.value})} className="w-full glass rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint-500/50 transition-all duration-200" style={{ color: dark ? "#FDF6F0" : "#1A1210" }}>
                      <option value="breakfast" className="bg-white dark:bg-[#1A1210] text-zinc-900 dark:text-zinc-100">Breakfast</option>
                      <option value="lunch" className="bg-white dark:bg-[#1A1210] text-zinc-900 dark:text-zinc-100">Lunch</option>
                      <option value="dinner" className="bg-white dark:bg-[#1A1210] text-zinc-900 dark:text-zinc-100">Dinner</option>
                      <option value="snack" className="bg-white dark:bg-[#1A1210] text-zinc-900 dark:text-zinc-100">Snack</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Input label="Protein (g)" type="number" value={newLog.protein} onChange={e => setNewLog({...newLog, protein: e.target.value})} />
                  <Input label="Carbs (g)" type="number" value={newLog.carbs} onChange={e => setNewLog({...newLog, carbs: e.target.value})} />
                  <Input label="Fat (g)" type="number" value={newLog.fat} onChange={e => setNewLog({...newLog, fat: e.target.value})} />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowLogModal(false)} className="px-5 py-2.5 rounded-xl font-medium transition-colors" style={{ color: dark ? '#C9B8AE' : '#6B6560', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>Cancel</button>
                  <button type="submit" disabled={aiEstimateLoading} className="px-5 py-2.5 rounded-xl font-medium bg-[#FF6B4A] text-white hover:bg-[#E85A3A] transition-colors disabled:opacity-50">
                    {aiEstimateLoading ? 'Estimating...' : 'Add Meal'}
                  </button>
                </div>
              </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan Options Modal */}
      <AnimatePresence>
        {showScanModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="fixed inset-0 z-40 flex items-center justify-center p-4 pb-6 bg-white/5 dark:bg-black/20 backdrop-blur-2xl" onClick={() => setShowScanModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()} className="relative flex flex-col w-full max-w-sm backdrop-blur-3xl bg-white/70 dark:bg-[#1A1210]/70 border border-white/60 dark:border-white/20 shadow-2xl ring-1 ring-white/40 dark:ring-white/10 rounded-3xl z-10">
              <div className="flex-none flex items-center justify-between p-6 pb-4 border-b border-black/5 dark:border-white/5">
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: dark ? '#FDF6F0' : '#1A1210' }}>
                  Scan Meal
                </h2>
              </div>
              <div className="flex flex-col gap-3 p-6 pt-5">
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="flex items-center justify-center gap-3 px-4 py-4 rounded-xl font-medium transition-all"
                  style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: dark ? '#FDF6F0' : '#1A1210' }}
                >
                  <SearchIcon className="w-5 h-5 text-[#FF6B4A]" /> Select a Picture
                </button>
                <button 
                  onClick={() => cameraInputRef.current?.click()} 
                  className="flex items-center justify-center gap-3 px-4 py-4 rounded-xl font-medium transition-all"
                  style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: dark ? '#FDF6F0' : '#1A1210' }}
                >
                  <Camera className="w-5 h-5 text-[#FF6B4A]" /> Take a Picture
                </button>
                <button 
                  onClick={() => setShowScanModal(false)}
                  className="mt-2 px-4 py-3 rounded-xl font-medium transition-colors" 
                  style={{ color: dark ? '#C9B8AE' : '#6B6560' }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
