// // // server/src/ai/chatbotService.js
// // import Item from '../models/Item.js';
// // import { GoogleGenerativeAI } from '@google/generative-ai';

// // /**
// //  * Chatbot service for SmartShelf AI
// //  * - DB-backed inventory intents (expiry, item details, category filters, recipes)
// //  * - General questions -> Gemini (if configured)
// //  * - Conservative, deterministic intent detection + limited fuzzy matching
// //  */

// // /* -------------------- Gemini client & model fallback -------------------- */
// // let _genAI = null;
// // let _genKeySeen = null;
// // let _modelId = null;
// // const MODEL_CANDIDATES = [
// //   process.env.GEMINI_MODEL,
// //   'models/gemini-2.5-flash',
// //   'gemini-3.5-flash-latest',
// //   'models/gemini-1.0-pro'
// // ].filter(Boolean);

// // function getGenAI() {
// //   const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
// //   if (!key) return null;
// //   if (!_genAI || _genKeySeen !== key) {
// //     _genAI = new GoogleGenerativeAI(key);
// //     _genKeySeen = key;
// //     _modelId = null;
// //     console.log('[AI] Gemini client initialized.');
// //   }
// //   return _genAI;
// // }

// // async function generateWithFallback(genAI, prompt) {
// //   if (!genAI) throw new Error('No Gemini client');
// //   if (_modelId) {
// //     try {
// //       const model = genAI.getGenerativeModel({ model: _modelId });
// //       return await model.generateContent(prompt);
// //     } catch (e) {
// //       // reset and try candidates
// //       _modelId = null;
// //     }
// //   }
// //   let lastErr;
// //   for (const id of MODEL_CANDIDATES) {
// //     try {
// //       console.log('[AI] Trying model:', id);
// //       const model = genAI.getGenerativeModel({ model: id });
// //       const res = await model.generateContent(prompt);
// //       _modelId = id;
// //       console.log('[AI] Selected model:', id);
// //       return res;
// //     } catch (e) {
// //       lastErr = e;
// //       const msg = String(e?.message || e);
// //       if (msg.includes('404') || msg.includes('not found')) {
// //         console.warn('[AI] Model not available:', id);
// //       } else {
// //         console.error('[AI] Model error for', id, ':', msg);
// //       }
// //     }
// //   }
// //   throw lastErr || new Error('No Gemini models available');
// // }

// // /* -------------------- Utilities -------------------- */
// // function normalizeText(s = '') { return (s || '').toString().trim().toLowerCase(); }

// // function escapeRegex(s = '') { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// // /* Lightweight Levenshtein for small candidate lists */
// // function levenshtein(a = '', b = '') {
// //   a = String(a || '').toLowerCase();
// //   b = String(b || '').toLowerCase();
// //   const m = a.length, n = b.length;
// //   const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
// //   for (let i = 0; i <= m; i++) dp[i][0] = i;
// //   for (let j = 0; j <= n; j++) dp[0][j] = j;
// //   for (let i = 1; i <= m; i++) {
// //     for (let j = 1; j <= n; j++) {
// //       const cost = a[i-1] === b[j-1] ? 0 : 1;
// //       dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost);
// //     }
// //   }
// //   return dp[m][n];
// // }

// // /* Friendly single-line summary */
// // function summarizeItem(item) {
// //   if (!item) return 'Item not found.';
// //   const when = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'unknown';
// //   const daysLeft = item.expiryDate ? Math.ceil((new Date(item.expiryDate) - new Date()) / (1000*60*60*24)) : null;
// //   const qty = (item.quantity === undefined || item.quantity === null) ? 'unknown' : item.quantity;
// //   const unit = item.unit || '';
// //   const brand = item.brand ? ` (${item.brand})` : '';
// //   const loc = item.location ? `, location: ${item.location}` : '';
// //   return `${item.name}${brand} — expires on ${when}${daysLeft !== null ? ` (${daysLeft} day(s) from now)` : ''}. quantity: ${qty} ${unit}${loc}`;
// // }

// // /* Full details output */
// // function fullDetails(item) {
// //   if (!item) return 'Item not found.';
// //   const lines = [
// //     `Name: ${item.name}`,
// //     `Category: ${item.category}`,
// //     `Expiry date: ${item.expiryDate ? new Date(item.expiryDate).toLocaleString() : 'unknown'}`,
// //     `Quantity: ${item.quantity ?? 'unknown'} ${item.unit || ''}`,
// //     `Brand: ${item.brand || 'unknown'}`,
// //     `Location: ${item.location || 'unknown'}`,
// //     `Status: ${item.status || 'unknown'}`,
// //     `Notes: ${item.notes || 'none'}`
// //   ];
// //   return lines.join('\n');
// // }

// // /* -------------------- Matching: exact -> partial -> fuzzy (limited) -------------------- */
// // async function matchItemByName(userId, name) {
// //   const queryName = (name || '').toString().trim();
// //   if (!queryName) return null;

// //   // 1) exact case-insensitive (anchors)
// //   const exact = await Item.findOne({
// //     userId,
// //     name: { $regex: `^\\s*${escapeRegex(queryName)}\\s*$`, $options: 'i' }
// //   }).lean();
// //   if (exact) return exact;

// //   // 2) partial match with limit (word anywhere)
// //   const partial = await Item.find({
// //     userId,
// //     name: { $regex: escapeRegex(queryName), $options: 'i' }
// //   }).sort({ expiryDate: 1 }).limit(10).lean();
// //   if (partial && partial.length === 1) return partial[0];
// //   if (partial && partial.length > 1) {
// //     // return earliest-expiring among partials
// //     partial.sort((a,b) => new Date(a.expiryDate) - new Date(b.expiryDate));
// //     return partial[0];
// //   }

// //   // 3) fuzzy: fetch up to 100 items and score with Levenshtein (avoid full scan)
// //   const candidates = await Item.find({ userId }).sort({ expiryDate: 1 }).limit(100).lean();
// //   if (!candidates || !candidates.length) return null;

// //   const q = normalizeText(queryName);
// //   const scored = candidates.map(c => ({ item: c, score: levenshtein(q, normalizeText(c.name)) }));
// //   scored.sort((a,b) => a.score - b.score);
// //   const best = scored[0];
// //   const len = Math.max(q.length, 1);
// //   // Acceptable threshold: <=3 or <= 40% of length
// //   if (best && (best.score <= 3 || best.score <= Math.floor(len * 0.4))) {
// //     return best.item;
// //   }

// //   return null;
// // }

// // /* -------------------- Simple intent detection -------------------- */
// // function detectIntent(text) {
// //   const t = normalizeText(text);

// //   // explicit "full details" request
// //   if (/\b(full details|details|show me details|give full details|tell me about)\b/.test(t)) {
// //     const m = t.match(/\b(?:details|about|full details of|tell me about)\s+(.{1,80})$/i);
// //     const name = m ? m[1].trim() : null;
// //     return { intent: 'item_details', params: { name } };
// //   }

// //   // when does X expire?
// //   let m = t.match(/\bwhen (?:does|is)\s+(?:the|my|a)?\s*([a-z0-9\-\_\' ]{1,80})\s*(?:expire|expires|expiry|expiring)?\b/i);
// //   if (m && m[1]) return { intent: 'when_item_expires', params: { name: m[1].trim() } };

// //   // "what about X expiry" / direct item "bread expiry"
// //   m = t.match(/\b([a-z0-9\-\_\' ]{1,80})\s+(?:expire|expires|expiry|expiring)\b/i);
// //   if (m && m[1]) return { intent: 'when_item_expires', params: { name: m[1].trim() } };

// //   // "expiring in N days" or "within N days"
// //   m = t.match(/\b(in|within|next)\s+(\d+)\s+days?\b/);
// //   if (m) return { intent: 'expiring_in_days', params: { days: Number(m[2]) } };

// //   if (/\b(today|today\?|\bexpiring today\b)/.test(t)) return { intent: 'expiring_in_days', params: { days: 0 } };
// //   if (/\b(tomorrow|tomorrow\?|\bexpiring tomorrow\b)/.test(t)) return { intent: 'expiring_in_days', params: { days: 1 } };
// //   if (/\b(this week|week|next week)\b/.test(t)) return { intent: 'expiring_in_days', params: { days: 7 } };
// //   if (/\b(3 days|next 3|within 3)\b/.test(t)) return { intent: 'expiring_in_days', params: { days: 3 } };

// //   // category-specific: beverages, medicine, cosmetic, grocery
// //   if (/\b(beverage|beverages|drink|drinks|juice|milk|tea|coffee)\b/.test(t)) return { intent: 'expiring_category', params: { category: 'beverage', days: 7 } };
// //   if (/\b(medicine|medicines|tablet|capsule|syrup)\b/.test(t)) return { intent: 'expiring_category', params: { category: 'medicine', days: 7 } };
// //   if (/\b(cosmetic|cosmetics|cream|lotion|soap|shampoo)\b/.test(t)) return { intent: 'expiring_category', params: { category: 'cosmetic', days: 7 } };
// //   if (/\b(grocery|groceries|food|vegetable|fruit|bread)\b/.test(t)) return { intent: 'expiring_category', params: { category: 'grocery', days: 7 } };

// //   // recipes
// //   if (/\b(recipe|recipes|suggest (me )?(recipes|meals|dishes)|how to cook|cook|use up)\b/.test(t)) {
// //     const n = t.match(/\b(in|within)?\s*(\d+)\s*days?\b/);
// //     return { intent: 'recipes_with_expiring', params: { days: n ? Number(n[2]) : 7 } };
// //   }

// //   // safety after expiry: "is it safe to eat X 2 days after expiry"
// //   m = t.match(/\b(is it safe to|safe to|can i (eat|consume|use))\b.*?(\d+)\s*days?\s*(after|later)?/);
// //   if (m) {
// //     // try to capture item before that phrase
// //     const nameMatch = t.match(/(?:is it safe to|safe to|can i (?:eat|consume|use))\s*(.*?)\s*\d+\s*days?/);
// //     const name = nameMatch && nameMatch[1] ? nameMatch[1].trim() : null;
// //     return { intent: 'safety_after_expiry', params: { days: Number(m[3]), name } };
// //   }

// //   // if question words and not inventory-specific => general
// //   if (/\b(how|what|why|explain|tell me|who|when|where|give me|write|poem|story)\b/.test(t)) {
// //     return { intent: 'general', params: {} };
// //   }

// //   // default to weekly list
// //   return { intent: 'expiring_in_days', params: { days: 7 } };
// // }

// // /* -------------------- Inventory helpers -------------------- */
// // async function findExpiring(userId, days = 7, category = null) {
// //   const now = new Date();
// //   const end = new Date(now.getTime() + Number(days) * 24 * 60 * 60 * 1000);
// //   const q = { userId, status: { $ne: 'consumed' }, expiryDate: { $gte: now, $lte: end } };
// //   if (category) q.category = category;
// //   const items = await Item.find(q).sort({ expiryDate: 1 }).lean();
// //   return items;
// // }

// // async function buildInventorySummary(userId, days = 7) {
// //   const items = await findExpiring(userId, days);
// //   const soonList = items.map(i => `${i.name} (${i.category}) — ${new Date(i.expiryDate).toLocaleDateString()}`).join('\n');
// //   const totals = await Item.aggregate([{ $match: { userId } }, { $group: { _id: '$category', count: { $sum: 1 } } }]);
// //   const counts = (totals || []).map(t => `${t._id}: ${t.count}`).join(', ') || 'no items';
// //   return { soonItems: items, soonList, counts };
// // }

// // /* -------------------- Safety advice -------------------- */
// // function safetyAdvice(category, daysAfterExpiry) {
// //   category = normalizeText(category || '');
// //   if (category === 'medicine') {
// //     return 'Medicines can be risky past expiry. For prescription/critical meds, do NOT use them after expiry. Consult a pharmacist.';
// //   }
// //   if (category === 'beverage' || category === 'grocery') {
// //     if (daysAfterExpiry <= 0) return 'If not past expiry yet, check smell/appearance. Cooked/dairy/meat are higher risk.';
// //     if (daysAfterExpiry <= 2) return 'Some sealed long-life items may be okay; perishable items (dairy/meat) are risky — check smell/appearance.';
// //     if (daysAfterExpiry <= 7) return 'Be cautious — throw out perishable items; unopened canned/jarred goods usually fine.';
// //     return 'After many days discard perishable foods. When in doubt, throw it out.';
// //   }
// //   if (category === 'cosmetic') {
// //     if (daysAfterExpiry <= 30) return 'Cosmetics may lose efficacy and risk contamination; avoid using expired eye/skin products.';
// //     return 'Discard expired cosmetics to avoid irritation or infection.';
// //   }
// //   return 'Safety depends on item type; for perishable foods be conservative.';
// // }

// // /* -------------------- Main exported function -------------------- */
// // export async function chatWithAssistant(userId, messages = []) {
// //   try {
// //     // extract last user text
// //     const last = Array.isArray(messages) && messages.length ? messages[messages.length - 1] : null;
// //     let text = '';
// //     if (!last) return 'Please ask a question like "What items expire this week?" or "When does bread expire?".';
// //     text = typeof last === 'string' ? last : (last.content || last.text || '');
// //     text = String(text || '').trim();
// //     if (!text) return 'Please ask something I can help with.';

// //     const { intent, params } = detectIntent(text);

// //     // 1) Items expiring in N days
// //     if (intent === 'expiring_in_days') {
// //       const days = Math.max(0, Number(params.days ?? 7));
// //       const items = await findExpiring(userId, days);
// //       if (!items.length) return days === 0 ? 'No items are expiring today.' : `No items are expiring within the next ${days} day(s).`;
// //       const lines = items.map(i => `${i.name} (${i.category}) — ${new Date(i.expiryDate).toLocaleDateString()}`);
// //       return `Items expiring within ${days} day(s):\n- ${lines.join('\n- ')}`;
// //     }

// //     // 2) When does a specific item expire
// //     if (intent === 'when_item_expires') {
// //       const name = params.name || '';
// //       if (!name) return "I couldn't identify the item. Ask like 'When does bread expire?' or 'When is the milk expiring?'.";
// //       const item = await matchItemByName(userId, name);
// //       if (!item) return `I couldn't find an item matching "${name}". Try exact or similar name.`;
// //       return summarizeItem(item);
// //     }

// //     // 3) Category-specific expiring items
// //     if (intent === 'expiring_category') {
// //       const category = params.category || 'grocery';
// //       const days = Number(params.days ?? 7);
// //       const items = await findExpiring(userId, days, category);
// //       if (!items.length) return `No ${category} items expiring within ${days} day(s).`;
// //       const lines = items.map(i => `${i.name} — ${new Date(i.expiryDate).toLocaleDateString()}`);
// //       return `${category.charAt(0).toUpperCase()+category.slice(1)} items expiring within ${days} day(s):\n- ${lines.join('\n- ')}`;
// //     }

// //     // 4) Full details of an item
// //     if (intent === 'item_details') {
// //       const name = params.name || '';
// //       if (!name) return "Please ask like: 'Give full details of curd' or 'Details of bread'.";
// //       const item = await matchItemByName(userId, name);
// //       if (!item) return `I couldn't find an item matching "${name}".`;
// //       return fullDetails(item);
// //     }

// //     // 5) Safety after expiry
// //     if (intent === 'safety_after_expiry') {
// //       const days = Number(params.days ?? 0);
// //       const name = (params.name || '').trim();
// //       if (name) {
// //         const item = await matchItemByName(userId, name);
// //         if (!item) return `I couldn't find "${name}" in your inventory. General advice: ${safetyAdvice('', days)}`;
// //         const advice = safetyAdvice(item.category, days);
// //         return `${summarizeItem(item)}\nAdvice: ${advice}`;
// //       }
// //       return `General advice: ${safetyAdvice('', days)}`;
// //     }

// //     // 6) Recipes using expiring items
// //     if (intent === 'recipes_with_expiring') {
// //       const days = Math.max(0, Number(params.days ?? 7));
// //       const { soonItems, soonList } = await buildInventorySummary(userId, days);
// //       if (!soonItems.length) return `No items expiring within ${days} day(s) to base recipes on.`;
// //       const genAI = getGenAI();
// //       if (!genAI) {
// //         // Local simple suggestions fallback
// //         const names = soonItems.map(i => i.name.toLowerCase()).slice(0,6).join(', ');
// //         return `Items expiring within ${days} days:\n${soonList}\n\nQuick ideas: try omelette/scramble (eggs + dairy), grilled sandwiches (bread + cheese + veg), stir-fry with mixed vegetables. Use: ${names}`;
// //       }
// //       const prompt = `You are Smart Shelf AI. Inventory expiring within ${days} day(s):\n${soonList}\nTask: Suggest up to 3 short recipes that use the items above. Provide an ingredient list (prefer items listed) and a 3-step method for each. Keep concise.`;
// //       try {
// //         const result = await generateWithFallback(genAI, prompt);
// //         const textOut = (result?.response?.text && result.response.text()) || result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
// //         return textOut || `I couldn't generate recipes right now. Inventory:\n${soonList}`;
// //       } catch (e) {
// //         console.error('[AI] recipe generation failed', e);
// //         return `I couldn't generate recipes using external AI right now. Inventory:\n${soonList}`;
// //       }
// //     }

// //     // 7) General question -> Gemini (with inventory context)
// //     if (intent === 'general') {
// //       const genAI = getGenAI();
// //       if (!genAI) {
// //         return 'I can answer inventory questions. For broader knowledge questions enable GEMINI_API_KEY in server .env.';
// //       }
// //       const { soonList, counts } = await buildInventorySummary(userId, 7);
// //       const system = `You are Smart Shelf AI. Use the inventory context if relevant.\nInventory summary: ${counts}\nExpiring soon:\n${soonList || 'none'}\nBe concise.`;
// //       const prompt = `${system}\nUser: ${text}\nAssistant:`;
// //       try {
// //         const result = await generateWithFallback(genAI, prompt);
// //         const textOut = (result?.response?.text && result.response.text()) || result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
// //         return textOut || 'I could not generate an answer right now.';
// //       } catch (e) {
// //         console.error('[AI] general generate failed', e);
// //         return 'I had trouble generating an answer. Try again later.';
// //       }
// //     }

// //     // 8) default fallback: weekly list
// //     {
// //       const items = await findExpiring(userId, 7);
// //       if (!items.length) return 'No items expiring soon.';
// //       const lines = items.map(i => `${i.name} (${i.category}) — ${new Date(i.expiryDate).toLocaleDateString()}`);
// //       return `Items expiring within 7 days:\n- ${lines.join('\n- ')}`;
// //     }
// //   } catch (err) {
// //     console.error('[chatWithAssistant] unexpected error', err);
// //     return 'Sorry — something went wrong while answering. Try again later.';
// //   }
// // }
// // server/src/ai/chatbotService.js
// import Item from '../models/Item.js';
// import { GoogleGenerativeAI } from '@google/generative-ai';

// /**
//  * Chatbot service for SmartShelf AI
//  * - Returns structured responses matching the system prompt:
//  *   Summary, Details, Suggested actions (<=3), Extra tips, optional question, source
//  *
//  * Behavior:
//  * - Prioritize DB facts (source: SmartShelf DB)
//  * - If inferring days left, mark as estimate
//  * - Avoid apologetic language; give alternatives / next steps
//  */

// /* -------------------- Gemini client & model fallback -------------------- */
// let _genAI = null;
// let _genKeySeen = null;
// let _modelId = null;
// const MODEL_CANDIDATES = [
//   process.env.GEMINI_MODEL,
//   'models/gemini-2.5-flash',
//   'gemini-3.5-flash-latest',
//   'models/gemini-1.0-pro'
// ].filter(Boolean);

// function getGenAI() {
//   const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
//   if (!key) return null;
//   if (!_genAI || _genKeySeen !== key) {
//     _genAI = new GoogleGenerativeAI(key);
//     _genKeySeen = key;
//     _modelId = null;
//     console.log('[AI] Gemini client initialized.');
//   }
//   return _genAI;
// }

// async function generateWithFallback(genAI, prompt) {
//   if (!genAI) throw new Error('No Gemini client');
//   if (_modelId) {
//     try {
//       const model = genAI.getGenerativeModel({ model: _modelId });
//       return await model.generateContent(prompt);
//     } catch (e) {
//       _modelId = null;
//     }
//   }
//   let lastErr;
//   for (const id of MODEL_CANDIDATES) {
//     try {
//       console.log('[AI] Trying model:', id);
//       const model = genAI.getGenerativeModel({ model: id });
//       const res = await model.generateContent(prompt);
//       _modelId = id;
//       console.log('[AI] Selected model:', id);
//       return res;
//     } catch (e) {
//       lastErr = e;
//       const msg = String(e?.message || e);
//       if (msg.includes('404') || msg.includes('not found')) {
//         console.warn('[AI] Model not available:', id);
//       } else {
//         console.error('[AI] Model error for', id, ':', msg);
//       }
//     }
//   }
//   throw lastErr || new Error('No Gemini models available');
// }

// /* -------------------- Utilities -------------------- */
// function normalizeText(s = '') { return (s || '').toString().trim().toLowerCase(); }
// function escapeRegex(s = '') { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// function daysBetweenDates(a, b) {
//   return Math.ceil((b - a) / (1000 * 60 * 60 * 24));
// }

// function fmtDateISO(d) {
//   if (!d) return 'unknown';
//   try { return new Date(d).toLocaleDateString(); } catch { return String(d); }
// }

// /* Lightweight Levenshtein for small candidate lists */
// function levenshtein(a = '', b = '') {
//   a = String(a || '').toLowerCase();
//   b = String(b || '').toLowerCase();
//   const m = a.length, n = b.length;
//   const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
//   for (let i = 0; i <= m; i++) dp[i][0] = i;
//   for (let j = 0; j <= n; j++) dp[0][j] = j;
//   for (let i = 1; i <= m; i++) {
//     for (let j = 1; j <= n; j++) {
//       const cost = a[i-1] === b[j-1] ? 0 : 1;
//       dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost);
//     }
//   }
//   return dp[m][n];
// }

// /* -------------------- Matching: exact -> partial -> fuzzy (limited) -------------------- */
// async function matchItemByName(userId, name) {
//   const queryName = (name || '').toString().trim();
//   if (!queryName) return null;

//   // Exact
//   const exact = await Item.findOne({
//     userId,
//     name: { $regex: `^\\s*${escapeRegex(queryName)}\\s*$`, $options: 'i' }
//   }).lean();
//   if (exact) return exact;

//   // Partial
//   const partial = await Item.find({
//     userId,
//     name: { $regex: escapeRegex(queryName), $options: 'i' }
//   }).sort({ expiryDate: 1 }).limit(10).lean();
//   if (partial && partial.length === 1) return partial[0];
//   if (partial && partial.length > 1) {
//     partial.sort((a,b) => new Date(a.expiryDate) - new Date(b.expiryDate));
//     return partial[0];
//   }

//   // Fuzzy (limited)
//   const candidates = await Item.find({ userId }).sort({ expiryDate: 1 }).limit(100).lean();
//   if (!candidates || !candidates.length) return null;
//   const q = normalizeText(queryName);
//   const scored = candidates.map(c => ({ item: c, score: levenshtein(q, normalizeText(c.name)) }));
//   scored.sort((a,b) => a.score - b.score);
//   const best = scored[0];
//   const len = Math.max(q.length, 1);
//   if (best && (best.score <= 3 || best.score <= Math.floor(len * 0.4))) {
//     return best.item;
//   }
//   return null;
// }

// /* -------------------- Intent detection (unchanged logic, same as before) -------------------- */
// function detectIntent(text) {
//   const t = normalizeText(text);

//   if (/\b(full details|details|show me details|give full details|tell me about)\b/.test(t)) {
//     const m = t.match(/\b(?:details|about|full details of|tell me about)\s+(.{1,80})$/i);
//     const name = m ? m[1].trim() : null;
//     return { intent: 'item_details', params: { name } };
//   }

//   let m = t.match(/\bwhen (?:does|is)\s+(?:the|my|a)?\s*([a-z0-9\-\_\' ]{1,80})\s*(?:expire|expires|expiry|expiring)?\b/i);
//   if (m && m[1]) return { intent: 'when_item_expires', params: { name: m[1].trim() } };

//   m = t.match(/\b([a-z0-9\-\_\' ]{1,80})\s+(?:expire|expires|expiry|expiring)\b/i);
//   if (m && m[1]) return { intent: 'when_item_expires', params: { name: m[1].trim() } };

//   m = t.match(/\b(in|within|next)\s+(\d+)\s+days?\b/);
//   if (m) return { intent: 'expiring_in_days', params: { days: Number(m[2]) } };

//   if (/\b(today|today\?|\bexpiring today\b)/.test(t)) return { intent: 'expiring_in_days', params: { days: 0 } };
//   if (/\b(tomorrow|tomorrow\?|\bexpiring tomorrow\b)/.test(t)) return { intent: 'expiring_in_days', params: { days: 1 } };
//   if (/\b(this week|week|next week)\b/.test(t)) return { intent: 'expiring_in_days', params: { days: 7 } };
//   if (/\b(3 days|next 3|within 3)\b/.test(t)) return { intent: 'expiring_in_days', params: { days: 3 } };

//   if (/\b(beverage|beverages|drink|drinks|juice|milk|tea|coffee)\b/.test(t)) return { intent: 'expiring_category', params: { category: 'beverage', days: 7 } };
//   if (/\b(medicine|medicines|tablet|capsule|syrup)\b/.test(t)) return { intent: 'expiring_category', params: { category: 'medicine', days: 7 } };
//   if (/\b(cosmetic|cosmetics|cream|lotion|soap|shampoo)\b/.test(t)) return { intent: 'expiring_category', params: { category: 'cosmetic', days: 7 } };
//   if (/\b(grocery|groceries|food|vegetable|fruit|bread)\b/.test(t)) return { intent: 'expiring_category', params: { category: 'grocery', days: 7 } };

//   if (/\b(recipe|recipes|suggest (me )?(recipes|meals|dishes)|how to cook|cook|use up)\b/.test(t)) {
//     const n = t.match(/\b(in|within)?\s*(\d+)\s*days?\b/);
//     return { intent: 'recipes_with_expiring', params: { days: n ? Number(n[2]) : 7 } };
//   }

//   m = t.match(/\b(is it safe to|safe to|can i (eat|consume|use))\b.*?(\d+)\s*days?\s*(after|later)?/);
//   if (m) {
//     const nameMatch = t.match(/(?:is it safe to|safe to|can i (?:eat|consume|use))\s*(.*?)\s*\d+\s*days?/);
//     const name = nameMatch && nameMatch[1] ? nameMatch[1].trim() : null;
//     return { intent: 'safety_after_expiry', params: { days: Number(m[3]), name } };
//   }

//   if (/\b(how|what|why|explain|tell me|who|when|where|give me|write|poem|story)\b/.test(t)) {
//     return { intent: 'general', params: {} };
//   }

//   return { intent: 'expiring_in_days', params: { days: 7 } };
// }

// /* -------------------- Inventory helpers -------------------- */
// async function findExpiring(userId, days = 7, category = null) {
//   const now = new Date();
//   const end = new Date(now.getTime() + Number(days) * 24 * 60 * 60 * 1000);
//   const q = { userId, status: { $ne: 'consumed' }, expiryDate: { $gte: now, $lte: end } };
//   if (category) q.category = category;
//   const items = await Item.find(q).sort({ expiryDate: 1 }).lean();
//   return items;
// }

// async function buildInventorySummary(userId, days = 7) {
//   const items = await findExpiring(userId, days);
//   const soonList = items.map(i => `${i.name} (${i.category}) — ${fmtDateISO(i.expiryDate)}`).join('\n');
//   const totals = await Item.aggregate([{ $match: { userId } }, { $group: { _id: '$category', count: { $sum: 1 } } }]);
//   const counts = (totals || []).map(t => `${t._id}: ${t.count}`).join(', ') || 'no items';
//   return { soonItems: items, soonList, counts };
// }

// /* -------------------- Safety advice -------------------- */
// function safetyAdvice(category, daysAfterExpiry) {
//   category = normalizeText(category || '');
//   if (category === 'medicine') {
//     return 'Medicines can be risky past expiry. For prescription/critical meds, do NOT use them after expiry. Consult a pharmacist.';
//   }
//   if (category === 'beverage' || category === 'grocery') {
//     if (daysAfterExpiry <= 0) return 'If not past expiry yet, check smell/appearance. Cooked/dairy/meat are higher risk.';
//     if (daysAfterExpiry <= 2) return 'Some sealed long-life items may be okay; perishable items (dairy/meat) are risky — check smell/appearance.';
//     if (daysAfterExpiry <= 7) return 'Be cautious — throw out perishable items; unopened canned/jarred goods usually fine.';
//     return 'After many days discard perishable foods. When in doubt, throw it out.';
//   }
//   if (category === 'cosmetic') {
//     if (daysAfterExpiry <= 30) return 'Cosmetics may lose efficacy and risk contamination; avoid using expired eye/skin products.';
//     return 'Discard expired cosmetics to avoid irritation or infection.';
//   }
//   return 'Safety depends on item type; for perishable foods be conservative.';
// }

// /* -------------------- Formatting helpers (create structured response & render) -------------------- */
// function makeSummary(text) {
//   // keep succinct
//   return (String(text || '')).split('\n')[0].trim();
// }

// function renderStructuredAsText(obj) {
//   // obj: { summary, details: [{label,value}], suggestedActions: [{title,api,note}], tips: [..], question, source }
//   const lines = [];
//   lines.push(`Summary: ${obj.summary || ''}`);
//   lines.push('');
//   if (obj.details && obj.details.length) {
//     lines.push('Details:');
//     for (const d of obj.details) {
//       // if value looks like an estimate marker, include it
//       lines.push(`- ${d.label}: ${d.value}`);
//     }
//     lines.push('');
//   }
//   if (obj.suggestedActions && obj.suggestedActions.length) {
//     lines.push('Suggested actions:');
//     obj.suggestedActions.slice(0,3).forEach((a, i) => {
//       const idx = i+1;
//       const apiline = a.api ? ` — API: ${a.api}` : '';
//       lines.push(`${idx}. ${a.title}${apiline}${a.note ? ` — ${a.note}` : ''}`);
//     });
//     lines.push('');
//   }
//   if (obj.tips && obj.tips.length) {
//     lines.push('Extra tips / Recipes:');
//     for (const t of obj.tips.slice(0,5)) lines.push(`- ${t}`);
//     lines.push('');
//   }
//   if (obj.question) {
//     lines.push(`Question: ${obj.question}`);
//     lines.push('');
//   }
//   lines.push(`source: ${obj.source || 'general'}`);
//   return lines.join('\n');
// }

// /* -------------------- Main exported function -------------------- */
// export async function chatWithAssistant(userId, messages = []) {
//   try {
//     const last = Array.isArray(messages) && messages.length ? messages[messages.length - 1] : null;
//     if (!last) {
//       const structured = {
//         summary: 'Ask something like "What items expire this week?"',
//         details: [],
//         suggestedActions: [{ title: 'List items expiring this week', api: 'GET /api/items?limit=100&sort=expiryDate' }],
//         tips: [],
//         question: null,
//         source: 'general'
//       };
//       return { structured, text: renderStructuredAsText(structured) };
//     }

//     let text = typeof last === 'string' ? last : (last.content || last.text || '');
//     text = String(text || '').trim();
//     if (!text) {
//       const structured = {
//         summary: 'Please type a question about your inventory or recipes.',
//         details: [],
//         suggestedActions: [{ title: 'View inventory', api: 'GET /api/items' }],
//         tips: [],
//         question: null,
//         source: 'general'
//       };
//       return { structured, text: renderStructuredAsText(structured) };
//     }

//     const { intent, params } = detectIntent(text);

//     /* ---------- Handlers per intent: build structured response ---------- */

//     // 1) expiring_in_days
//     if (intent === 'expiring_in_days') {
//       const days = Math.max(0, Number(params.days ?? 7));
//       const items = await findExpiring(userId, days);
//       if (!items.length) {
//         const structured = {
//           summary: days === 0 ? 'No items expiring today.' : `No items expiring within ${days} day(s).`,
//           details: [],
//           suggestedActions: [{ title: 'Add items', api: 'POST /api/items', note: 'Add name & expiry' }],
//           tips: [],
//           question: null,
//           source: 'SmartShelf DB'
//         };
//         return { structured, text: renderStructuredAsText(structured) };
//       }
//       const details = items.map(i => ({ label: i.name, value: `${fmtDateISO(i.expiryDate)} (${daysBetweenDates(new Date(), new Date(i.expiryDate))} days)` }));
//       const summary = `Items expiring within ${days} day(s): ${items.length} item(s).`;
//       const suggestedActions = [
//         { title: `View expiring items list`, api: `GET /api/items?expiryBefore=${new Date(Date.now()+days*24*60*60*1000).toISOString()}` },
//         { title: 'Set a digest reminder', api: 'PUT /api/notifications/prefs', note: 'Enable daily/weekly digest' }
//       ];
//       const tips = [`Try recipes using the soonest items`, `Consider freezing or using in cooked dishes`];
//       const structured = { summary, details: details.slice(0,10), suggestedActions, tips, question: null, source: 'SmartShelf DB' };
//       return { structured, text: renderStructuredAsText(structured) };
//     }

//     // 2) when_item_expires
//     if (intent === 'when_item_expires') {
//       const name = params.name || '';
//       if (!name) {
//         const structured = {
//           summary: "Please provide the item name, e.g. 'When does bread expire?'",
//           details: [],
//           suggestedActions: [{ title: 'Search items', api: 'GET /api/items?q=bread' }],
//           tips: [],
//           question: null,
//           source: 'general'
//         };
//         return { structured, text: renderStructuredAsText(structured) };
//       }
//       const item = await matchItemByName(userId, name);
//       if (!item) {
//         const structured = {
//           summary: `No matching item found for "${name}".`,
//           details: [],
//           suggestedActions: [
//             { title: 'Search by barcode or exact name', api: `GET /api/items?q=${encodeURIComponent(name)}` },
//             { title: 'Add the item', api: 'POST /api/items', note: 'Include expiry date' }
//           ],
//           tips: [`Try searching with brand or variant names`],
//           question: null,
//           source: 'SmartShelf DB'
//         };
//         return { structured, text: renderStructuredAsText(structured) };
//       }

//       // Build details
//       const daysLeft = item.expiryDate ? daysBetweenDates(new Date(), new Date(item.expiryDate)) : null;
//       const estimateNote = (item.expiryDate && typeof daysLeft === 'number') ? (daysLeft < 0 ? 'expired' : `${daysLeft} day(s) left`) : 'estimate unavailable';
//       const details = [
//         { label: 'Name', value: item.name },
//         { label: 'Expiry', value: `${fmtDateISO(item.expiryDate)}${daysLeft !== null ? ` (${daysLeft} day(s) from now)` : ''}` },
//         { label: 'Location', value: item.location || 'unknown' },
//         { label: 'Status', value: item.status || 'unknown' },
//         { label: 'Quantity', value: item.quantity ?? 'unknown' }
//       ];

//       const summary = `${item.name} expires on ${fmtDateISO(item.expiryDate)}${daysLeft !== null ? ` (${daysLeft} day(s))` : ''}.`;
//       const suggestedActions = [
//         { title: 'Set reminder', api: `POST /api/items/${item._id}/reminder`, note: 'body: { time: ISO8601 }' },
//         { title: 'Mark as consumed', api: `POST /api/items/${item._id}/mark-consumed` },
//         { title: 'Edit item', api: `PUT /api/items/${item._id}` }
//       ];
//       const tips = [];
//       // quick recipe tip based on category
//       if (item.category === 'grocery' || item.category === 'beverage') {
//         tips.push('Use in cooked dishes or smoothies to avoid waste.');
//       } else if (item.category === 'medicine') {
//         tips.push('Check label and consult pharmacist for expired meds.');
//       }

//       const structured = { summary: makeSummary(summary), details, suggestedActions, tips, question: null, source: 'SmartShelf DB' };
//       return { structured, text: renderStructuredAsText(structured) };
//     }

//     // 3) expiring_category
//     if (intent === 'expiring_category') {
//       const category = params.category || 'grocery';
//       const days = Number(params.days ?? 7);
//       const items = await findExpiring(userId, days, category);
//       if (!items.length) {
//         const structured = {
//           summary: `No ${category} items expiring within ${days} day(s).`,
//           details: [],
//           suggestedActions: [{ title: 'Review inventory', api: `GET /api/items?category=${category}` }],
//           tips: [],
//           question: null,
//           source: 'SmartShelf DB'
//         };
//         return { structured, text: renderStructuredAsText(structured) };
//       }
//       const details = items.map(i => ({ label: i.name, value: fmtDateISO(i.expiryDate) }));
//       const structured = {
//         summary: `${category.charAt(0).toUpperCase() + category.slice(1)} items expiring within ${days} day(s): ${items.length} item(s).`,
//         details,
//         suggestedActions: [{ title: 'View these items', api: `GET /api/items?category=${category}&expiryBefore=${new Date(Date.now()+days*24*60*60*1000).toISOString()}` }],
//         tips: ['Create a meal plan using the soonest items'],
//         question: null,
//         source: 'SmartShelf DB'
//       };
//       return { structured, text: renderStructuredAsText(structured) };
//     }

//     // 4) item_details
//     if (intent === 'item_details') {
//       const name = params.name || '';
//       if (!name) {
//         const structured = {
//           summary: "Ask like: 'Give full details of curd' or 'Details of bread'.",
//           details: [],
//           suggestedActions: [{ title: 'Search items', api: 'GET /api/items?q=curd' }],
//           tips: [],
//           question: null,
//           source: 'general'
//         };
//         return { structured, text: renderStructuredAsText(structured) };
//       }
//       const item = await matchItemByName(userId, name);
//       if (!item) {
//         const structured = {
//           summary: `No matching item found for "${name}".`,
//           details: [],
//           suggestedActions: [{ title: 'Add item', api: 'POST /api/items' }],
//           tips: [],
//           question: null,
//           source: 'SmartShelf DB'
//         };
//         return { structured, text: renderStructuredAsText(structured) };
//       }
//       const details = [
//         { label: 'Name', value: item.name },
//         { label: 'Category', value: item.category },
//         { label: 'Expiry date', value: fmtDateISO(item.expiryDate) },
//         { label: 'Quantity', value: item.quantity ?? 'unknown' },
//         { label: 'Brand', value: item.brand || 'unknown' },
//         { label: 'Location', value: item.location || 'unknown' },
//         { label: 'Status', value: item.status || 'unknown' },
//         { label: 'Notes', value: item.notes || 'none' }
//       ];
//       const suggestedActions = [
//         { title: 'Set reminder', api: `POST /api/items/${item._id}/reminder` },
//         { title: 'Edit item', api: `PUT /api/items/${item._id}` },
//         { title: 'Mark as consumed', api: `POST /api/items/${item._id}/mark-consumed` }
//       ];
//       const structured = { summary: `${item.name} — details below.`, details, suggestedActions, tips: [], question: null, source: 'SmartShelf DB' };
//       return { structured, text: renderStructuredAsText(structured) };
//     }

//     // 5) safety_after_expiry
//     if (intent === 'safety_after_expiry') {
//       const days = Number(params.days ?? 0);
//       const name = (params.name || '').trim();
//       if (name) {
//         const item = await matchItemByName(userId, name);
//         if (!item) {
//           const structured = {
//             summary: `No matching item found for "${name}". General safety guidance below.`,
//             details: [],
//             suggestedActions: [{ title: 'Search inventory for the item', api: `GET /api/items?q=${encodeURIComponent(name)}` }],
//             tips: [safetyAdvice('', days)],
//             question: null,
//             source: 'general'
//           };
//           return { structured, text: renderStructuredAsText(structured) };
//         }
//         const advice = safetyAdvice(item.category, days);
//         const structured = {
//           summary: `${item.name}: safety advice for ${days} day(s) after expiry.`,
//           details: [
//             { label: 'Name', value: item.name },
//             { label: 'Category', value: item.category },
//             { label: 'Expiry', value: fmtDateISO(item.expiryDate) }
//           ],
//           suggestedActions: [{ title: 'Discard if unsure', api: null }, { title: 'Consult pharmacist for medicines', api: null }],
//           tips: [advice],
//           question: null,
//           source: 'SmartShelf DB'
//         };
//         return { structured, text: renderStructuredAsText(structured) };
//       }
//       const structured = {
//         summary: `General safety advice for items ${days} day(s) after expiry.`,
//         details: [],
//         suggestedActions: [{ title: 'When in doubt, discard perishable items', api: null }],
//         tips: [safetyAdvice('', days)],
//         question: null,
//         source: 'general'
//       };
//       return { structured, text: renderStructuredAsText(structured) };
//     }

//     // 6) recipes_with_expiring
//     if (intent === 'recipes_with_expiring') {
//       const days = Math.max(0, Number(params.days ?? 7));
//       const { soonItems, soonList } = await buildInventorySummary(userId, days);
//       if (!soonItems.length) {
//         const structured = {
//           summary: `No items expiring within ${days} day(s) to base recipes on.`,
//           details: [],
//           suggestedActions: [{ title: 'Review your inventory', api: 'GET /api/items' }],
//           tips: [],
//           question: null,
//           source: 'SmartShelf DB'
//         };
//         return { structured, text: renderStructuredAsText(structured) };
//       }
//       const genAI = getGenAI();
//       if (!genAI) {
//         // fallback suggestions
//         const names = soonItems.map(i => i.name.toLowerCase()).slice(0,6).join(', ');
//         const tips = [
//           `Quick ideas: omelette/scramble (eggs + dairy), grilled sandwiches (bread + cheese + veg), stir-fry with mixed vegetables.`,
//           `Use: ${names}`
//         ];
//         const structured = {
//           summary: `Recipe ideas using items expiring within ${days} day(s).`,
//           details: soonItems.slice(0,6).map(i => ({ label: i.name, value: fmtDateISO(i.expiryDate) })),
//           suggestedActions: [{ title: 'Use these in quick recipes', api: null }],
//           tips,
//           question: null,
//           source: 'SmartShelf DB'
//         };
//         return { structured, text: renderStructuredAsText(structured) };
//       }
//       const prompt = `You are Smart Shelf AI. Inventory expiring within ${days} day(s):\n${soonList}\nTask: Suggest up to 3 short recipes that use the items above. Provide an ingredient list (prefer items listed) and a 3-step method for each. Keep concise.`;
//       try {
//         const result = await generateWithFallback(genAI, prompt);
//         const textOut = (result?.response?.text && result.response.text()) || result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
//         const structured = {
//           summary: `Recipe suggestions for items expiring within ${days} day(s).`,
//           details: soonItems.slice(0,6).map(i => ({ label: i.name, value: fmtDateISO(i.expiryDate) })),
//           suggestedActions: [{ title: 'Try the recipes below', api: null }],
//           tips: [textOut || 'See generated recipes above.'],
//           question: null,
//           source: 'SmartShelf DB'
//         };
//         return { structured, text: renderStructuredAsText(structured) };
//       } catch (e) {
//         console.error('[AI] recipe generation failed', e);
//         const structured = {
//           summary: `Unable to generate recipes right now; here are quick fallback ideas.`,
//           details: soonItems.slice(0,6).map(i => ({ label: i.name, value: fmtDateISO(i.expiryDate) })),
//           suggestedActions: [{ title: 'Use simple cooked dishes or smoothies', api: null }],
//           tips: ['Omelette/scramble', 'Grilled sandwiches', 'Stir-fry'],
//           question: null,
//           source: 'SmartShelf DB'
//         };
//         return { structured, text: renderStructuredAsText(structured) };
//       }
//     }

//     // 7) general
//     if (intent === 'general') {
//       const genAI = getGenAI();
//       if (!genAI) {
//         const structured = {
//           summary: 'I can answer inventory questions. For broader knowledge enable GEMINI_API_KEY in the server .env.',
//           details: [],
//           suggestedActions: [{ title: 'View inventory', api: 'GET /api/items' }],
//           tips: [],
//           question: null,
//           source: 'general'
//         };
//         return { structured, text: renderStructuredAsText(structured) };
//       }
//       const { soonList, counts } = await buildInventorySummary(userId, 7);
//       const system = `You are Smart Shelf AI. Use the inventory context if relevant.\nInventory summary: ${counts}\nExpiring soon:\n${soonList || 'none'}\nBe concise.`;
//       const prompt = `${system}\nUser: ${text}\nAssistant:`;
//       try {
//         const result = await generateWithFallback(genAI, prompt);
//         const textOut = (result?.response?.text && result.response.text()) || result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
//         const structured = {
//           summary: makeSummary(textOut || 'Generated answer'),
//           details: [],
//           suggestedActions: [],
//           tips: [textOut || ''],
//           question: null,
//           source: 'general'
//         };
//         return { structured, text: renderStructuredAsText(structured) };
//       } catch (e) {
//         console.error('[AI] general generate failed', e);
//         const structured = {
//           summary: 'Unable to generate an extended answer. Inventory context provided below.',
//           details: [{ label: 'Inventory counts', value: counts }],
//           suggestedActions: [{ title: 'Try again later', api: null }],
//           tips: [],
//           question: null,
//           source: 'SmartShelf DB'
//         };
//         return { structured, text: renderStructuredAsText(structured) };
//       }
//     }

//     // default fallback: weekly list
//     {
//       const items = await findExpiring(userId, 7);
//       if (!items.length) {
//         const structured = { summary: 'No items expiring soon.', details: [], suggestedActions: [{ title: 'Add items', api: 'POST /api/items' }], tips: [], question: null, source: 'SmartShelf DB' };
//         return { structured, text: renderStructuredAsText(structured) };
//       }
//       const details = items.map(i => ({ label: i.name, value: fmtDateISO(i.expiryDate) }));
//       const structured = { summary: `Items expiring within 7 days: ${items.length} item(s).`, details, suggestedActions: [{ title: 'View items', api: 'GET /api/items?sort=expiryDate' }], tips: [], question: null, source: 'SmartShelf DB' };
//       return { structured, text: renderStructuredAsText(structured) };
//     }
//   } catch (err) {
//     console.error('[chatWithAssistant] unexpected error', err);
//     const structured = { summary: 'An internal error occurred while answering. Please try again later.', details: [], suggestedActions: [], tips: [], question: null, source: 'general' };
//     return { structured, text: renderStructuredAsText(structured) };
//   }
// }




















// server/src/ai/chatbotService.js
import Item from '../models/Item.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { Op, Sequelize } from 'sequelize';

/**
 * Chatbot service for SmartShelf AI
 * - Returns structured responses matching the system prompt:
 *   Summary, Details, Suggested actions (<=3), Extra tips, optional question, source
 *
 * Behavior:
 * - Prioritize DB facts (source: SmartShelf DB)
 * - If inferring days left, mark as estimate
 * - Avoid apologetic language; give alternatives / next steps
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
let _openai = null;
function getOpenAI() {
  if (OPENAI_API_KEY && !_openai) {
    _openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  }
  return _openai;
}

/* -------------------- Gemini client & model fallback -------------------- */
let _genAI = null;
let _genKeySeen = null;
let _modelId = null;
const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  'gemini-3.5-flash',
  'gemini-3.5-flash-latest'
].filter(Boolean);

function getGenAI() {
  const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!key) return null;
  if (!_genAI || _genKeySeen !== key) {
    _genAI = new GoogleGenerativeAI(key);
    _genKeySeen = key;
    _modelId = null;
    console.log('[AI] Gemini client initialized.');
  }
  return _genAI;
}

async function generateWithFallback(genAI, prompt) {
  if (!genAI && !getOpenAI()) throw new Error('No AI clients available');
  
  if (genAI) {
    if (_modelId) {
      try {
        const model = genAI.getGenerativeModel({ model: _modelId });
        return await model.generateContent(prompt);
      } catch (e) {
        _modelId = null;
      }
    }
    let lastErr;
    for (const id of MODEL_CANDIDATES) {
      try {
        const model = genAI.getGenerativeModel({ model: id });
        const res = await model.generateContent(prompt);
        _modelId = id;
        return res;
      } catch (e) {
        lastErr = e;
        const msg = String(e?.message || e);
        if (msg.includes('429')) break; // Rate limit, fallback to OpenAI
      }
    }
  }

  // Fallback to OpenAI
  const openai = getOpenAI();
  if (openai) {
    console.log('[AI] Falling back to OpenAI');
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      });
      return {
        response: {
          text: () => response.choices[0].message.content
        },
        candidates: [{
          content: { parts: [{ text: response.choices[0].message.content }] }
        }]
      };
    } catch (e) {
      console.error('[AI] OpenAI fallback error:', e.message);
    }
  }

  throw new Error('All AI models failed');
}

/* -------------------- Utilities -------------------- */
function normalizeText(s = '') { return (s || '').toString().trim().toLowerCase(); }
function escapeRegex(s = '') { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function daysBetweenDates(a, b) {
  return Math.ceil((b - a) / (1000 * 60 * 60 * 24));
}

function fmtDateISO(d) {
  if (!d) return 'unknown';
  try { return new Date(d).toLocaleDateString(); } catch { return String(d); }
}

/* Lightweight Levenshtein for small candidate lists */
function levenshtein(a = '', b = '') {
  a = String(a || '').toLowerCase();
  b = String(b || '').toLowerCase();
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost);
    }
  }
  return dp[m][n];
}

/* -------------------- Matching: exact -> partial -> fuzzy (limited) -------------------- */
async function matchItemByName(userId, name) {
  const queryName = (name || '').toString().trim();
  if (!queryName) return null;

  // Exact
  const exact = await Item.findOne({
    where: {
      userId,
      name: {
        [Op.iLike]: queryName
      }
    }
  });
  if (exact) return exact.toJSON();

  // Partial
  const partial = await Item.findAll({
    where: {
      userId,
      name: {
        [Op.iLike]: `%${queryName}%`
      }
    },
    order: [['expiryDate', 'ASC']],
    limit: 10
  });
  if (partial && partial.length === 1) return partial[0].toJSON();
  if (partial && partial.length > 1) {
    const rawPartial = partial.map(p => p.toJSON());
    rawPartial.sort((a,b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    return rawPartial[0];
  }

  // Fuzzy (limited)
  const candidates = await Item.findAll({
    where: { userId },
    order: [['expiryDate', 'ASC']],
    limit: 100
  });
  if (!candidates || !candidates.length) return null;
  const rawCandidates = candidates.map(c => c.toJSON());
  const q = normalizeText(queryName);
  const scored = rawCandidates.map(c => ({ item: c, score: levenshtein(q, normalizeText(c.name)) }));
  scored.sort((a,b) => a.score - b.score);
  const best = scored[0];
  const len = Math.max(q.length, 1);
  if (best && (best.score <= 3 || best.score <= Math.floor(len * 0.4))) {
    return best.item;
  }
  return null;
}

/* -------------------- Intent detection (unchanged logic, same as before) -------------------- */
function detectIntent(text) {
  const t = normalizeText(text);

  if (/\b(full details|details|show me details|give full details|tell me about)\b/.test(t)) {
    const m = t.match(/\b(?:details|about|full details of|tell me about)\s+(.{1,80})$/i);
    const name = m ? m[1].trim() : null;
    return { intent: 'item_details', params: { name } };
  }

  let m = t.match(/\bwhen (?:does|is)\s+(?:the|my|a)?\s*([a-z0-9\-\_\' ]{1,80})\s*(?:expire|expires|expiry|expiring)?\b/i);
  if (m && m[1]) return { intent: 'when_item_expires', params: { name: m[1].trim() } };

  m = t.match(/\b([a-z0-9\-\_\' ]{1,80})\s+(?:expire|expires|expiry|expiring)\b/i);
  if (m && m[1]) return { intent: 'when_item_expires', params: { name: m[1].trim() } };

  m = t.match(/\b(in|within|next)\s+(\d+)\s+days?\b/);
  if (m) return { intent: 'expiring_in_days', params: { days: Number(m[2]) } };

  if (/\b(today|today\?|\bexpiring today\b)/.test(t)) return { intent: 'expiring_in_days', params: { days: 0 } };
  if (/\b(tomorrow|tomorrow\?|\bexpiring tomorrow\b)/.test(t)) return { intent: 'expiring_in_days', params: { days: 1 } };
  if (/\b(this week|week|next week)\b/.test(t)) return { intent: 'expiring_in_days', params: { days: 7 } };
  if (/\b(3 days|next 3|within 3)\b/.test(t)) return { intent: 'expiring_in_days', params: { days: 3 } };

  if (/\b(beverage|beverages|drink|drinks|juice|milk|tea|coffee)\b/.test(t)) return { intent: 'expiring_category', params: { category: 'beverage', days: 7 } };
  if (/\b(medicine|medicines|tablet|capsule|syrup)\b/.test(t)) return { intent: 'expiring_category', params: { category: 'medicine', days: 7 } };
  if (/\b(cosmetic|cosmetics|cream|lotion|soap|shampoo)\b/.test(t)) return { intent: 'expiring_category', params: { category: 'cosmetic', days: 7 } };
  if (/\b(grocery|groceries|food|vegetable|fruit|bread)\b/.test(t)) return { intent: 'expiring_category', params: { category: 'grocery', days: 7 } };

  if (/\b(recipe|recipes|suggest (me )?(recipes|meals|dishes)|how to cook|cook|use up|what can i (make|cook|prepare)|what to cook|what to make)\b/.test(t)) {
    const n = t.match(/\b(in|within)?\s*(\d+)\s*days?\b/);
    return { intent: 'recipes_with_expiring', params: { days: n ? Number(n[2]) : 7 } };
  }

  // Inventory listing: "what's in my inventory", "show my items", "list inventory"
  if (/\b(what('s| is) in my (inventory|fridge|pantry|kitchen)|show (my |all )?(items|inventory)|list (my )?(inventory|items)|my inventory)\b/.test(t)) {
    return { intent: 'general', params: {} };
  }

  // Priority/usage: "which should I use first", "what to use first", "use first"
  if (/\b(which (should|do) i (use|eat|consume) first|use first|eat first|priority)\b/.test(t)) {
    return { intent: 'expiring_in_days', params: { days: 7 } };
  }

  m = t.match(/\b(is it safe to|safe to|can i (eat|consume|use))\b.*?(\d+)\s*days?\s*(after|later)?/);
  if (m) {
    const nameMatch = t.match(/(?:is it safe to|safe to|can i (?:eat|consume|use))\s*(.*?)\s*\d+\s*days?/);
    const name = nameMatch && nameMatch[1] ? nameMatch[1].trim() : null;
    return { intent: 'safety_after_expiry', params: { days: Number(m[3]), name } };
  }

  if (/\b(how|what|why|explain|tell me|who|when|where|give me|write|poem|story)\b/.test(t)) {
    return { intent: 'general', params: {} };
  }

  return { intent: 'expiring_in_days', params: { days: 7 } };
}

/* -------------------- Inventory helpers -------------------- */
async function findExpiring(userId, days = 7, category = null) {
  const now = new Date();
  const end = new Date(now.getTime() + Number(days) * 24 * 60 * 60 * 1000);
  
  const where = {
    userId,
    status: { [Op.ne]: 'consumed' },
    expiryDate: { [Op.between]: [now, end] }
  };
  
  if (category) where.category = category;
  
  const items = await Item.findAll({
    where,
    order: [['expiryDate', 'ASC']]
  });
  return items.map(i => i.toJSON());
}

async function buildInventorySummary(userId, days = 7) {
  const items = await findExpiring(userId, days);
  const soonList = items.map(i => `${i.name} (${i.category}) — ${fmtDateISO(i.expiryDate)}`).join('\n');
  
  const allActive = await Item.findAll({ where: { userId, status: 'active' }, raw: true });
  const fullList = allActive.map(i => `${i.name} (${i.category || 'unknown'})`).join(', ');

  const totals = await Item.findAll({
    where: { userId, status: 'active' },
    attributes: [
      'category',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    group: ['category'],
    raw: true
  });
  
  const counts = (totals || []).map(t => `${t.category}: ${t.count}`).join(', ') || 'no items';
  return { soonItems: items, soonList, counts, fullList };
}

/* -------------------- Safety advice -------------------- */
function safetyAdvice(category, daysAfterExpiry) {
  category = normalizeText(category || '');
  if (category === 'medicine') {
    return 'Medicines can be risky past expiry. For prescription/critical meds, do NOT use them after expiry. Consult a pharmacist.';
  }
  if (category === 'beverage' || category === 'grocery') {
    if (daysAfterExpiry <= 0) return 'If not past expiry yet, check smell/appearance. Cooked/dairy/meat are higher risk.';
    if (daysAfterExpiry <= 2) return 'Some sealed long-life items may be okay; perishable items (dairy/meat) are risky — check smell/appearance.';
    if (daysAfterExpiry <= 7) return 'Be cautious — throw out perishable items; unopened canned/jarred goods usually fine.';
    return 'After many days discard perishable foods. When in doubt, throw it out.';
  }
  if (category === 'cosmetic') {
    if (daysAfterExpiry <= 30) return 'Cosmetics may lose efficacy and risk contamination; avoid using expired eye/skin products.';
    return 'Discard expired cosmetics to avoid irritation or infection.';
  }
  return 'Safety depends on item type; for perishable foods be conservative.';
}

/* -------------------- Formatting helpers (create structured response & render) -------------------- */
function makeSummary(text) {
  // keep succinct
  return (String(text || '')).split('\n')[0].trim();
}

function renderStructuredAsText(obj) {
  // obj: { summary, details: [{label,value}], suggestedActions: [{title,api,note}], tips: [..], question, source }
  const lines = [];
  lines.push(`Summary: ${obj.summary || ''}`);
  lines.push('');
  if (obj.details && obj.details.length) {
    lines.push('Details:');
    for (const d of obj.details) {
      // if value looks like an estimate marker, include it
      lines.push(`- ${d.label}: ${d.value}`);
    }
    lines.push('');
  }
  if (obj.suggestedActions && obj.suggestedActions.length) {
    lines.push('Suggested actions:');
    obj.suggestedActions.slice(0,3).forEach((a, i) => {
      const idx = i+1;
      const apiline = a.api ? ` — API: ${a.api}` : '';
      lines.push(`${idx}. ${a.title}${apiline}${a.note ? ` — ${a.note}` : ''}`);
    });
    lines.push('');
  }
  if (obj.tips && obj.tips.length) {
    lines.push('Extra tips / Recipes:');
    for (const t of obj.tips.slice(0,5)) lines.push(`- ${t}`);
    lines.push('');
  }
  if (obj.question) {
    lines.push(`Question: ${obj.question}`);
    lines.push('');
  }
  lines.push(`source: ${obj.source || 'general'}`);
  return lines.join('\n');
}

/* -------------------- Main exported function -------------------- */
export async function chatWithAssistant(userId, messages = []) {
  try {
    const last = Array.isArray(messages) && messages.length ? messages[messages.length - 1] : null;
    if (!last) {
      const structured = {
        summary: 'Ask something like "What items expire this week?"',
        details: [],
        suggestedActions: [{ title: 'List items expiring this week', api: 'GET /api/items?limit=100&sort=expiryDate' }],
        tips: [],
        question: null,
        source: 'general'
      };
      return { structured, text: renderStructuredAsText(structured) };
    }

    let text = typeof last === 'string' ? last : (last.content || last.text || '');
    text = String(text || '').trim();
    if (!text) {
      const structured = {
        summary: 'Please type a question about your inventory or recipes.',
        details: [],
        suggestedActions: [{ title: 'View inventory', api: 'GET /api/items' }],
        tips: [],
        question: null,
        source: 'general'
      };
      return { structured, text: renderStructuredAsText(structured) };
    }

    const { intent, params } = detectIntent(text);

    /* ---------- Handlers per intent: build structured response ---------- */

    // 1) expiring_in_days
    if (intent === 'expiring_in_days') {
      const days = Math.max(0, Number(params.days ?? 7));
      const items = await findExpiring(userId, days);
      if (!items.length) {
        const structured = {
          summary: days === 0 ? 'No items expiring today.' : `No items expiring within ${days} day(s).`,
          details: [],
          suggestedActions: [{ title: 'Add items', api: 'POST /api/items', note: 'Add name & expiry' }],
          tips: [],
          question: null,
          source: 'SmartShelf DB'
        };
        return { structured, text: renderStructuredAsText(structured) };
      }
      const details = items.map(i => ({ label: i.name, value: `${fmtDateISO(i.expiryDate)} (${daysBetweenDates(new Date(), new Date(i.expiryDate))} days)` }));
      const summary = `Items expiring within ${days} day(s): ${items.length} item(s).`;
      const suggestedActions = [
        { title: `View expiring items list`, api: `GET /api/items?expiryBefore=${new Date(Date.now()+days*24*60*60*1000).toISOString()}` },
        { title: 'Set a digest reminder', api: 'PUT /api/notifications/prefs', note: 'Enable daily/weekly digest' }
      ];
      const tips = [`Try recipes using the soonest items`, `Consider freezing or using in cooked dishes`];
      const structured = { summary, details: details.slice(0,10), suggestedActions, tips, question: null, source: 'SmartShelf DB' };
      return { structured, text: renderStructuredAsText(structured) };
    }

    // 2) when_item_expires
    if (intent === 'when_item_expires') {
      const name = params.name || '';
      if (!name) {
        const structured = {
          summary: "Please provide the item name, e.g. 'When does bread expire?'",
          details: [],
          suggestedActions: [{ title: 'Search items', api: 'GET /api/items?q=bread' }],
          tips: [],
          question: null,
          source: 'general'
        };
        return { structured, text: renderStructuredAsText(structured) };
      }
      const item = await matchItemByName(userId, name);
      if (!item) {
        const structured = {
          summary: `No matching item found for "${name}".`,
          details: [],
          suggestedActions: [
            { title: 'Search by barcode or exact name', api: `GET /api/items?q=${encodeURIComponent(name)}` },
            { title: 'Add the item', api: 'POST /api/items', note: 'Include expiry date' }
          ],
          tips: [`Try searching with brand or variant names`],
          question: null,
          source: 'SmartShelf DB'
        };
        return { structured, text: renderStructuredAsText(structured) };
      }

      // Build details
      const daysLeft = item.expiryDate ? daysBetweenDates(new Date(), new Date(item.expiryDate)) : null;
      const estimateNote = (item.expiryDate && typeof daysLeft === 'number') ? (daysLeft < 0 ? 'expired' : `${daysLeft} day(s) left`) : 'estimate unavailable';
      const details = [
        { label: 'Name', value: item.name },
        { label: 'Expiry', value: `${fmtDateISO(item.expiryDate)}${daysLeft !== null ? ` (${daysLeft} day(s) from now)` : ''}` },
        { label: 'Location', value: item.location || 'unknown' },
        { label: 'Status', value: item.status || 'unknown' },
        { label: 'Quantity', value: item.quantity ?? 'unknown' }
      ];

      const summary = `${item.name} expires on ${fmtDateISO(item.expiryDate)}${daysLeft !== null ? ` (${daysLeft} day(s))` : ''}.`;
      const suggestedActions = [
        { title: 'Set reminder', api: `POST /api/items/${item.id || item._id}/reminder`, note: 'body: { time: ISO8601 }' },
        { title: 'Mark as consumed', api: `POST /api/items/${item.id || item._id}/mark-consumed` },
        { title: 'Edit item', api: `PUT /api/items/${item.id || item._id}` }
      ];
      const tips = [];
      // quick recipe tip based on category
      if (item.category === 'grocery' || item.category === 'beverage') {
        tips.push('Use in cooked dishes or smoothies to avoid waste.');
      } else if (item.category === 'medicine') {
        tips.push('Check label and consult pharmacist for expired meds.');
      }

      const structured = { summary: makeSummary(summary), details, suggestedActions, tips, question: null, source: 'SmartShelf DB' };
      return { structured, text: renderStructuredAsText(structured) };
    }

    // 3) expiring_category
    if (intent === 'expiring_category') {
      const category = params.category || 'grocery';
      const days = Number(params.days ?? 7);
      const items = await findExpiring(userId, days, category);
      if (!items.length) {
        const structured = {
          summary: `No ${category} items expiring within ${days} day(s).`,
          details: [],
          suggestedActions: [{ title: 'Review inventory', api: `GET /api/items?category=${category}` }],
          tips: [],
          question: null,
          source: 'SmartShelf DB'
        };
        return { structured, text: renderStructuredAsText(structured) };
      }
      const details = items.map(i => ({ label: i.name, value: fmtDateISO(i.expiryDate) }));
      const structured = {
        summary: `${category.charAt(0).toUpperCase() + category.slice(1)} items expiring within ${days} day(s): ${items.length} item(s).`,
        details,
        suggestedActions: [{ title: 'View these items', api: `GET /api/items?category=${category}&expiryBefore=${new Date(Date.now()+days*24*60*60*1000).toISOString()}` }],
        tips: ['Create a meal plan using the soonest items'],
        question: null,
        source: 'SmartShelf DB'
      };
      return { structured, text: renderStructuredAsText(structured) };
    }

    // 4) item_details
    if (intent === 'item_details') {
      const name = params.name || '';
      if (!name) {
        const structured = {
          summary: "Ask like: 'Give full details of curd' or 'Details of bread'.",
          details: [],
          suggestedActions: [{ title: 'Search items', api: 'GET /api/items?q=curd' }],
          tips: [],
          question: null,
          source: 'general'
        };
        return { structured, text: renderStructuredAsText(structured) };
      }
      const item = await matchItemByName(userId, name);
      if (!item) {
        const structured = {
          summary: `No matching item found for "${name}".`,
          details: [],
          suggestedActions: [{ title: 'Add item', api: 'POST /api/items' }],
          tips: [],
          question: null,
          source: 'SmartShelf DB'
        };
        return { structured, text: renderStructuredAsText(structured) };
      }
      const details = [
        { label: 'Name', value: item.name },
        { label: 'Category', value: item.category },
        { label: 'Expiry date', value: fmtDateISO(item.expiryDate) },
        { label: 'Quantity', value: item.quantity ?? 'unknown' },
        { label: 'Brand', value: item.brand || 'unknown' },
        { label: 'Location', value: item.location || 'unknown' },
        { label: 'Status', value: item.status || 'unknown' },
        { label: 'Notes', value: item.notes || 'none' }
      ];
      const suggestedActions = [
        { title: 'Set reminder', api: `POST /api/items/${item.id || item._id}/reminder` },
        { title: 'Edit item', api: `PUT /api/items/${item.id || item._id}` },
        { title: 'Mark as consumed', api: `POST /api/items/${item.id || item._id}/mark-consumed` }
      ];
      const structured = { summary: `${item.name} — details below.`, details, suggestedActions, tips: [], question: null, source: 'SmartShelf DB' };
      return { structured, text: renderStructuredAsText(structured) };
    }

    // 5) safety_after_expiry
    if (intent === 'safety_after_expiry') {
      const days = Number(params.days ?? 0);
      const name = (params.name || '').trim();
      if (name) {
        const item = await matchItemByName(userId, name);
        if (!item) {
          const structured = {
            summary: `No matching item found for "${name}". General safety guidance below.`,
            details: [],
            suggestedActions: [{ title: 'Search inventory for the item', api: `GET /api/items?q=${encodeURIComponent(name)}` }],
            tips: [safetyAdvice('', days)],
            question: null,
            source: 'general'
          };
          return { structured, text: renderStructuredAsText(structured) };
        }
        const advice = safetyAdvice(item.category, days);
        const structured = {
          summary: `${item.name}: safety advice for ${days} day(s) after expiry.`,
          details: [
            { label: 'Name', value: item.name },
            { label: 'Category', value: item.category },
            { label: 'Expiry', value: fmtDateISO(item.expiryDate) }
          ],
          suggestedActions: [{ title: 'Discard if unsure', api: null }, { title: 'Consult pharmacist for medicines', api: null }],
          tips: [advice],
          question: null,
          source: 'SmartShelf DB'
        };
        return { structured, text: renderStructuredAsText(structured) };
      }
      const structured = {
        summary: `General safety advice for items ${days} day(s) after expiry.`,
        details: [],
        suggestedActions: [{ title: 'When in doubt, discard perishable items', api: null }],
        tips: [safetyAdvice('', days)],
        question: null,
        source: 'general'
      };
      return { structured, text: renderStructuredAsText(structured) };
    }

    // 6) recipes_with_expiring
    if (intent === 'recipes_with_expiring') {
      const genAI = getGenAI();
      const days = Number(params?.days) || 7;
      let soonItems = await findExpiring(userId, days);
      // Filter out medicine
      soonItems = soonItems.filter(i => i.category !== 'medicine');
      
      if (!soonItems.length) {
        const structured = {
          summary: `No food items expiring within ${days} days to make recipes from.`,
          details: [],
          suggestedActions: [{ title: 'View all food', api: 'GET /api/items' }],
          tips: [],
          question: null,
          source: 'SmartShelf DB'
        };
        return { structured, text: renderStructuredAsText(structured) };
      }
      const soonList = soonItems.map(i => `- ${i.name} (exp: ${fmtDateISO(i.expiryDate)})`).join('\n');
      if (!genAI) {
        const tips = soonItems.map(i => `Use ${i.name} soon!`);
        const structured = {
          summary: `Here are the foods expiring within ${days} days. ENABLE GEMINI_API_KEY for smart recipe generation!`,
          details: soonItems.map(i => ({ label: i.name, value: fmtDateISO(i.expiryDate) })),
          suggestedActions: [{ title: 'Use these in quick recipes', api: null }],
          tips,
          question: null,
          source: 'SmartShelf DB'
        };
        return { structured, text: renderStructuredAsText(structured) };
      }
      const prompt = `You are Smart Shelf AI. Inventory food expiring within ${days} day(s):\n${soonList}\nTask: Suggest up to 3 short recipes that use the items above. Provide an ingredient list (prefer items listed) and a 3-step method for each. Keep concise.`;
      try {
        const result = await generateWithFallback(genAI, prompt);
        const textOut = (result?.response?.text && result.response.text()) || result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
        const structured = {
          summary: `Recipe suggestions for food items expiring within ${days} day(s).`,
          details: soonItems.slice(0,6).map(i => ({ label: i.name, value: fmtDateISO(i.expiryDate) })),
          suggestedActions: [{ title: 'Try the recipes below', api: null }],
          tips: [textOut || 'See generated recipes above.'],
          question: null,
          source: 'SmartShelf DB'
        };
        return { structured, text: renderStructuredAsText(structured) };
      } catch (e) {
        console.error('[AI] recipe generation failed', e);
        const structured = {
          summary: `Unable to generate recipes right now; here are quick fallback ideas.`,
          details: soonItems.slice(0,6).map(i => ({ label: i.name, value: fmtDateISO(i.expiryDate) })),
          suggestedActions: [{ title: 'Use simple cooked dishes or smoothies', api: null }],
          tips: ['Omelette/scramble', 'Grilled sandwiches', 'Stir-fry'],
          question: null,
          source: 'SmartShelf DB'
        };
        return { structured, text: renderStructuredAsText(structured) };
      }
    }

    // 7) general
    if (intent === 'general') {
      const genAI = getGenAI();
      if (!genAI) {
        const structured = {
          summary: 'I can answer inventory questions. For broader knowledge enable GEMINI_API_KEY in the server .env.',
          details: [],
          suggestedActions: [{ title: 'View inventory', api: 'GET /api/items' }],
          tips: [],
          question: null,
          source: 'general'
        };
        return { structured, text: renderStructuredAsText(structured) };
      }
      const { soonList, counts, fullList } = await buildInventorySummary(userId, 7);
      const system = `You are Smart Shelf AI. Use the inventory context if relevant.\nFull Inventory: ${fullList || 'none'}\nExpiring soon:\n${soonList || 'none'}\nBe concise.`;
      const prompt = `${system}\nUser: ${text}\nAssistant:`;
      try {
        const result = await generateWithFallback(genAI, prompt);
        const textOut = (result?.response?.text && result.response.text()) || result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
        const structured = {
          summary: makeSummary(textOut || 'Generated answer'),
          details: [],
          suggestedActions: [],
          tips: [textOut || ''],
          question: null,
          source: 'general'
        };
        return { structured, text: renderStructuredAsText(structured) };
      } catch (e) {
        console.error('[AI] general generate failed', e);
        const structured = {
          summary: 'Unable to generate an extended answer. Inventory context provided below.',
          details: [{ label: 'Inventory counts', value: counts }],
          suggestedActions: [{ title: 'Try again later', api: null }],
          tips: [],
          question: null,
          source: 'SmartShelf DB'
        };
        return { structured, text: renderStructuredAsText(structured) };
      }
    }

    // default fallback: weekly list
    {
      const items = await findExpiring(userId, 7);
      if (!items.length) {
        const structured = { summary: 'No items expiring soon.', details: [], suggestedActions: [{ title: 'Add items', api: 'POST /api/items' }], tips: [], question: null, source: 'SmartShelf DB' };
        return { structured, text: renderStructuredAsText(structured) };
      }
      const details = items.map(i => ({ label: i.name, value: fmtDateISO(i.expiryDate) }));
      const structured = { summary: `Items expiring within 7 days: ${items.length} item(s).`, details, suggestedActions: [{ title: 'View items', api: 'GET /api/items?sort=expiryDate' }], tips: [], question: null, source: 'SmartShelf DB' };
      return { structured, text: renderStructuredAsText(structured) };
    }
  } catch (err) {
    console.error('[chatWithAssistant] unexpected error', err);
    const structured = { summary: 'An internal error occurred while answering. Please try again later.', details: [], suggestedActions: [], tips: [], question: null, source: 'general' };
    return { structured, text: renderStructuredAsText(structured) };
  }
}
