// import { chatWithAssistant } from '../ai/chatbotService.js'

// export async function chat(req, res, next) {
//   try {
//     const { messages = [] } = req.body
//     const reply = await chatWithAssistant(req.user.id, messages)
//     res.json({ reply })
//   } catch (err) {
//     next(err)
//   }
// }
// aiController.js
// backend/src/controllers/aiController.js
// src/controllers/aiController.js
// src/controllers/aiController.js
// src/controllers/aiController.js
import { chatWithAssistant } from '../ai/chatbotService.js';
import Item from '../models/Item.js';
import User from '../models/User.js';
import fetch from "node-fetch";
import { Op } from 'sequelize';
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { calculateGoals } from './calorieController.js';
import crypto from 'crypto';

if (process.env.GEMINI_API_KEY) {
  delete process.env.GOOGLE_API_KEY;
}
const API_KEY = process.env.GEMINI_API_KEY;
let GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-3.5-flash-lite").replace(/^models\//i, "").trim();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const NEMOTRON_API_KEY = process.env.NEMOTRON_API_KEY;

const aiClient = new GoogleGenAI({ apiKey: API_KEY });
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

async function generateAIResponse(prompt, providers = ['gemini', 'openai', 'nemotron']) {
  if (!API_KEY && !OPENAI_API_KEY && !NEMOTRON_API_KEY) throw new Error("Missing AI API KEYS");
  
  for (const provider of providers) {
    if (provider === 'gemini' && API_KEY) {
      try {
        console.log(`[AI] Attempting with Gemini...`);
        const response = await aiClient.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
        });
        return response.text;
      } catch (err) {
        console.error("Gemini API Error:", err.message);
      }
    }

    if (provider === 'openai' && openai) {
      try {
        console.log(`[AI] Attempting with OpenAI...`);
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }]
        });
        return response.choices[0].message.content;
      } catch (err) {
        console.error("OpenAI Fallback Error:", err.message);
      }
    }

    if (provider === 'nemotron' && NEMOTRON_API_KEY) {
      try {
        console.log(`[AI] Attempting with Nemotron...`);
        const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${NEMOTRON_API_KEY}`
          },
          body: JSON.stringify({
            model: "nvidia/nemotron-4-340b-instruct",
            messages: [{ role: "user", content: prompt }]
          })
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return data.choices[0].message.content;
      } catch (err) {
        console.error("Nemotron Fallback Error:", err.message);
      }
    }
  }

  throw new Error("All AI APIs failed.");
}



export async function chat(req, res, next) {
  try {
    let { messages, message } = req.body;
    // Support single 'message' string from Smart Search
    if (!messages && message) {
      messages = [{ role: 'user', content: message }];
    }
    if (!Array.isArray(messages)) {
      messages = typeof messages === 'string' ? [{ role: 'user', content: messages }] : [];
    }
    const result = await chatWithAssistant(req.user.id, messages);
    if (result && result.structured) {
      return res.json({ reply: result.text, structured: result.structured });
    }
    const reply = (result && (result.text || result)) || 'Understood.';
    return res.json({ reply: String(reply) });
  } catch (err) {
    console.error('[aiController.chat] error', err);
    return res.status(500).json({ error: 'Unable to process the request right now.' });
  }
}

export async function regenerateKitchenRecipes(userId, force = false) {
  try {
    const user = await User.findByPk(userId);
    const goals = user ? calculateGoals(user) : { calories: 2000, protein: 100, carbs: 250, fat: 65 };
    const userProfile = user ? `${user.age || '?'} yrs old ${user.gender || 'unknown'}, ${user.weight || '?'}kg, ${user.height || '?'}cm. Goal: ${user.goal || 'maintain'}, Activity Level: ${user.activityLevel || 'moderate'}, Location: ${user.district || 'Unknown'}. Target Daily Macros: ${goals.calories} kcal, ${goals.protein}g protein, ${goals.carbs}g carbs, ${goals.fat}g fat.` : 'Standard Adult.';
    
    const items = await Item.findAll({ where: { userId, status: 'active' }, raw: true });
    // Filter out medicine for kitchen context
    const foodItems = items.filter(i => i.category !== 'medicine');
    const inventoryText = foodItems.map(i => `- ${i.name} (${i.category || 'unknown'})`).join('\n') || 'Inventory is empty.';
    
    // Dynamically scale recipes based on user's exact requested formula: inventory size + 5
    const numRecipes = foodItems.length + 5;
    
    const prompt = `
You are SmartShelf AI, an elite master chef and nutritionist.
User Profile: ${userProfile}
Here is their current inventory:
${inventoryText}

Please suggest exactly ${numRecipes} creative, delicious, and healthy recipes they can make primarily using their inventory. 
1. The first few recipes MUST be "Local Staple Foods" based on their local district (${user?.district || 'their region'}) using the ingredients available.
2. The next few recipes MUST be "Country Cuisine" based on the broader national cuisine of their country.
3. The remaining recipes MUST be a "Global Cuisine" showcase from different countries (e.g., Italian, Mexican, Japanese, Mediterranean, Thai, French). Each of these MUST use the SPECIFIC country/region name as the cuisine tag, NOT the word "Global Cuisine".

CRITICAL INSTRUCTIONS FOR RECIPE DETAIL:
- The \`ingredients\` list MUST creatively combine as many items from their inventory as possible (aim for at least 4-5 inventory items per recipe, plus essential pantry staples). Do not just suggest a recipe with 2 ingredients.
- The \`instructions\` MUST be EXTREMELY detailed. 
- You MUST specify EXACT cooking times (e.g., "sauté for 3 minutes until golden").
- You MUST specify EXACT amounts of common seasonings like salt, pepper, oil, or spices (e.g., "add 1/2 tsp of salt").
- DO NOT use open loops like "add other ingredients as well", "season to taste", or "cook according to package directions". Walk the user through every single step.

You MUST return a raw JSON array (do not wrap in markdown code blocks like \`\`\`json). The array must contain exactly ${numRecipes} objects with the following schema:
[
  {
    "title": "Catchy Recipe Title",
    "time": "e.g., 30 mins",
    "macros": "e.g., 400 kcal • 20g Protein • 30g Carbs",
    "ingredients": "A Markdown bulleted list of exact ingredients and measurements.",
    "instructions": "A highly detailed Markdown string containing step-by-step instructions. Explain exactly how to cook each element with precise times and seasoning amounts.",
    "globalCuisine": "IMPORTANT: Use 'Local Staple' for district-local recipes, 'Country Cuisine' for national recipes, or the SPECIFIC country/cuisine name (e.g., 'Italian', 'Mexican', 'Japanese', 'Thai', 'Mediterranean') for global recipes. NEVER write 'Global Cuisine' here."
  }
]
`;
    
    const promptHash = crypto.createHash('md5').update(prompt).digest('hex');
    
    if (!force && user && user.kitchenCache && user.kitchenCache.hash === promptHash && user.kitchenCache.data && user.kitchenCache.data.length > 2) {
      return user.kitchenCache.data;
    }

    let text = "";
    try {
      // Prioritize Gemini since it has the updated 3.5-flash model
      text = await generateAIResponse(prompt, ['gemini', 'openai', 'nemotron']);
    } catch (aiErr) {
      console.error("All AI generation failed:", aiErr);
    }
    
    let recipes;
    try {
      if (!text) throw new Error("No response text from AI");
      // Strip markdown code blocks if present
      let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const match = cleanText.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("No JSON array found in response");
      recipes = JSON.parse(match[0]);
      
      // Ensure we have at least the requested number minus a small margin of error
      if (recipes.length < 3) {
         console.warn(`AI generated only ${recipes.length} recipes when ${numRecipes} were requested.`);
      }
    } catch (parseError) {
      console.error("Failed to parse or generate recipes JSON:", parseError);
      console.log("Raw output was:", text);
      // HARDCODED FALLBACK
      recipes = [
        {
          title: "Quick Kitchen Stir-fry",
          time: "20 mins",
          macros: "350 kcal • 15g Protein • 45g Carbs",
          ingredients: "- Any veggies you have\n- Rice or noodles\n- Soy sauce",
          instructions: "1. Chop veggies.\n2. Stir fry in a hot pan with oil.\n3. Add rice/noodles and soy sauce. Serve hot.",
          globalCuisine: "Asian Fusion"
        },
        {
          title: "Pantry Pasta",
          time: "15 mins",
          macros: "400 kcal • 12g Protein • 60g Carbs",
          ingredients: "- Pasta\n- Olive oil or butter\n- Garlic and herbs",
          instructions: "1. Boil pasta until al dente.\n2. Toss with olive oil, garlic, and available herbs.\n3. Top with cheese if available.",
          globalCuisine: "Italian"
        }
      ];
    }
    
    await User.update({ 
      kitchenRecipes: recipes,
      kitchenCache: { hash: promptHash, data: recipes }
    }, { where: { id: userId } });
    return recipes;
  } catch (err) {
    console.error('[aiController.regenerateKitchenRecipes] background generation failed', err);
    return null;
  }
}

export async function kitchenRecipe(req, res, next) {
  try {
    const force = req.query.force === 'true';
    const recipes = await regenerateKitchenRecipes(req.user.id, force);
    if (recipes) {
      return res.json({ recipes });
    }
    
    res.status(500).json({ error: 'Unable to generate recipes right now.' });
  } catch (err) {
    console.error('[aiController.kitchenRecipe] error', err);
    res.status(500).json({ error: 'Unable to generate recipes right now.' });
  }
}

export async function shoppingRecommendations(req, res, next) {
  console.log('[shoppingRecommendations] hit, user id:', req.user?.id);
  try {
    const force = req.query.force === 'true';
    const user = await User.findByPk(req.user.id);
    const goals = user ? calculateGoals(user) : { calories: 2000, protein: 100, carbs: 250, fat: 65 };
    const userProfile = user ? `${user.age || '?'} yrs old ${user.gender || 'unknown'}, ${user.weight || '?'}kg. Goal: ${user.goal || 'maintain'}, Location: ${user.district || 'Unknown'}. Target Daily Macros: ${goals.calories} kcal, ${goals.protein}g P, ${goals.carbs}g C, ${goals.fat}g F.` : 'Standard Adult.';

    const items = await Item.findAll({ where: { userId: req.user.id, status: 'active' }, raw: true });
    const foodItems = items.filter(i => i.category !== 'medicine');
    const inventoryText = foodItems.map(i => `- ${i.name} (${i.category || 'unknown'})`).join('\n') || 'Inventory is empty.';
    
    const prompt = `
You are SmartShelf AI, an expert nutritionist and budget-friendly shopping assistant.
User Profile: ${userProfile}
The user wants recommendations for what to buy on their next grocery trip.
They want to hit their macro goals, be cost-effective, and buy items that pair well with what they already have.
Since they are located in ${user?.district || 'an unknown location'}, predict local food items to prepare and suggest groceries available in that region.
Here is their current inventory:
${inventoryText}

Please suggest a categorized, cost-effective shopping list of at least 12 items.
IMPORTANT: You MUST format your response as a raw JSON array (do not wrap in markdown code blocks like \`\`\`json). The array must contain exactly 12 to 15 objects with the following schema:
[
  {
    "item": "Name of the item",
    "category": "grocery, produce, dairy, meat, pantry, etc.",
    "reason": "Reason to buy / Pairing with existing inventory",
    "globalCuisine": "Associated Global Cuisine (e.g., Italian, Asian, Universal)"
  }
]
`;

    const promptHash = crypto.createHash('md5').update(prompt).digest('hex');
    
    if (!force && user && user.shoppingCache && user.shoppingCache.hash === promptHash) {
      return res.json({ reply: user.shoppingCache.data });
    }

    let text = "";
    try {
      // Prioritize Gemini
      text = await generateAIResponse(prompt, ['gemini', 'openai', 'nemotron']);
    } catch (aiErr) {
      console.error("All AI generation failed for shopping:", aiErr);
    }

    let shoppingItems;
    try {
      if (!text) throw new Error("No response text from AI");
      // Strip markdown code blocks if present
      let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const match = cleanText.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("No JSON array found in response");
      shoppingItems = JSON.parse(match[0]);
    } catch (parseError) {
      console.error("Failed to parse shopping JSON:", parseError);
      shoppingItems = [
        { item: "Rice", category: "pantry", reason: "Pairs with everything", globalCuisine: "Asian" },
        { item: "Eggs", category: "protein", reason: "Quick meals", globalCuisine: "Universal" },
        { item: "Seasonal Veggies", category: "produce", reason: "Healthy addition", globalCuisine: "Universal" },
        { item: "Olive Oil", category: "grocery", reason: "Cooking essential", globalCuisine: "Mediterranean" }
      ];
    }

    await User.update({ 
      shoppingCache: { hash: promptHash, data: shoppingItems }
    }, { where: { id: req.user.id } });
    
    res.json({ reply: shoppingItems });
  } catch (err) {
    console.error('[aiController.shoppingRecommendations] error', err);
    res.json({ reply: [{ item: "Basics", category: "grocery", reason: "System offline fallback", globalCuisine: "Universal" }] });
  }
}
export async function dashboardSuggestions(req, res, next) {
  try {
    const force = req.query.force === 'true';
    const user = await User.findByPk(req.user.id);
    const goals = user ? calculateGoals(user) : { calories: 2000, protein: 100, carbs: 250, fat: 65 };
    const userProfile = user ? `${user.age || '?'} yrs old ${user.gender || 'unknown'}, goal: ${user.goal || 'maintain'}. Target Daily Macros: ${goals.calories} kcal, ${goals.protein}g P, ${goals.carbs}g C, ${goals.fat}g F.` : 'Standard Adult.';

    const items = await Item.findAll({ where: { userId: req.user.id, status: 'active' }, raw: true });
    const foodItems = items.filter(i => i.category !== 'medicine');
    
    // Calculate simple stats to pass to AI
    const expiringSoon = foodItems.filter(i => {
      if (!i.expiryDate) return false;
      const diff = new Date(i.expiryDate) - new Date();
      return diff > 0 && diff <= 2 * 86400000;
    });

    const activeItems = foodItems.filter(i => i.status === 'active');
    
    const inventoryText = activeItems.map(i => `- ${i.name} (${i.category || 'unknown'})`).join('\n') || 'Inventory is empty.';
    const expiringText = expiringSoon.map(i => `- ${i.name}`).join('\n') || 'No items expiring soon.';

    const prompt = `
You are SmartShelf AI, a proactive nutritionist and kitchen manager.
User Profile: ${userProfile}
The user is viewing their dashboard. Provide a short, friendly, and inspiring daily suggestion based on their inventory and their diet/calorie goals.

Focus on:
1. Highlighting what is expiring soon and how to use it:
${expiringText}
2. Suggesting a healthy meal idea using their current inventory that fits their daily calorie and macro goals:
${inventoryText}

Format your response strictly as a bulleted list (using '- ' for bullets) with a very brief introductory sentence. Keep the entire response under 3 or 4 short bullet points. Do not use markdown headers.
`;

    const promptHash = crypto.createHash('md5').update(prompt).digest('hex');
    
    if (!force && user && user.dashboardCache && user.dashboardCache.hash === promptHash) {
      return res.json({ reply: user.dashboardCache.data });
    }

    let text = "";
    try {
      text = await generateAIResponse(prompt, ['gemini', 'openai', 'nemotron']);
    } catch (aiErr) {
      console.error("All AI generation failed for dashboard:", aiErr);
      text = "Here are your smart insights:\n- Stay hydrated and track your meals.\n- Check your inventory for expiring items.\n- Plan your meals ahead to hit your goals.";
    }

    await User.update({ 
      dashboardCache: { hash: promptHash, data: text }
    }, { where: { id: req.user.id } });

    res.json({ reply: text });
  } catch (err) {
    console.error('[aiController.dashboardSuggestions] error', err);
    res.json({ reply: "Here are your smart insights:\n- Stay hydrated and track your meals.\n- Check your inventory for expiring items.\n- Plan your meals ahead to hit your goals." });
  }
}
