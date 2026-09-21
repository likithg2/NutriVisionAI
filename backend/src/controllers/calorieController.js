import MealLog from '../models/MealLog.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import { makeActivityPayload } from '../utils/activityHelper.js';
import { notifyUser } from '../utils/notify.js';
import { Op } from 'sequelize';

export function calculateGoals(user) {
  // Default fallback if physical metrics are missing
  const defaultGoals = { calories: 2000, protein: 100, carbs: 250, fat: 65 };
  if (!user.age || !user.weight || !user.height || !user.gender) {
    return defaultGoals;
  }
  
  // Mifflin-St Jeor Equation
  // Men: (10 x weight in kg) + (6.25 x height in cm) - (5 x age in years) + 5
  // Women: (10 x weight in kg) + (6.25 x height in cm) - (5 x age in years) - 161
  let bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age);
  bmr = user.gender === 'male' ? bmr + 5 : bmr - 161;

  let multiplier = 1.2; // sedentary
  switch (user.activityLevel) {
    case 'light': multiplier = 1.375; break;
    case 'moderate': multiplier = 1.55; break;
    case 'active': multiplier = 1.725; break;
    case 'very_active': multiplier = 1.9; break;
  }
  
  let tdee = bmr * multiplier;

  // Adjust for goal
  if (user.goal === 'lose') tdee -= 500;
  if (user.goal === 'gain') tdee += 500;

  // Macronutrient split (e.g. 30% Protein, 40% Carbs, 30% Fat)
  const proteinCals = tdee * 0.30;
  const carbsCals = tdee * 0.40;
  const fatCals = tdee * 0.30;

  return {
    calories: Math.round(tdee),
    protein: Math.round(proteinCals / 4), // 4 cals per gram
    carbs: Math.round(carbsCals / 4), // 4 cals per gram
    fat: Math.round(fatCals / 9), // 9 cals per gram
  };
}

export const getDailyStats = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const goals = calculateGoals(user);

    // Get today's logs
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const logs = await MealLog.findAll({
      where: { userId: req.user.id, date },
      order: [['createdAt', 'DESC']]
    });

    // Aggregate
    let consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    logs.forEach(log => {
      consumed.calories += log.calories * log.servings;
      consumed.protein += log.protein * log.servings;
      consumed.carbs += log.carbs * log.servings;
      consumed.fat += log.fat * log.servings;
    });

    res.json({ goals, consumed, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getHistory = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const past = new Date();
    past.setDate(past.getDate() - (days - 1));
    const startDate = past.toISOString().split('T')[0];
    
    const logs = await MealLog.findAll({
      where: { 
        userId: req.user.id,
        date: { [Op.gte]: startDate }
      }
    });
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const logMeal = async (req, res) => {
  try {
    const { itemName, calories, protein, carbs, fat, servings = 1, mealType = 'snack', date } = req.body;
    
    if (!itemName || calories == null) {
      return res.status(400).json({ error: 'Item name and calories are required' });
    }

    const log = await MealLog.create({
      userId: req.user.id,
      date: date || new Date().toISOString().split('T')[0],
      mealType,
      itemName,
      calories,
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0,
      servings
    });

    try {
      const activityPayload = makeActivityPayload({
        type: 'calories:log',
        message: `Logged meal: ${itemName} (${calories * servings} kcal)`,
        meta: { mealLog: log },
        userId: req.user.id,
        userName: req.user.name
      });
      await Activity.create(activityPayload);
    } catch (e) {
      console.warn('Activity logging failed (logMeal):', e?.message || e);
    }

    // Notify user: new food logged
    try {
      await notifyUser(
        req.user.id.toString(),
        `🍽️ Meal Logged: ${itemName}`,
        `${itemName} (${mealType}) — ${calories * servings} kcal logged for ${date || new Date().toLocaleDateString()}.`,
        'system'
      );
    } catch (e) {
      console.warn('[calorieController] meal-logged notification failed:', e?.message || e);
    }

    // Checking Macro Limits for notifications
    try {
      const user = await User.findByPk(req.user.id);
      if (user) {
        const goals = calculateGoals(user);
        const logDate = date || new Date().toISOString().split('T')[0];
        
        // Fetch all logs for the day to get totals
        const allLogs = await MealLog.findAll({
          where: { userId: req.user.id, date: logDate }
        });
        
        let consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        allLogs.forEach(l => {
          consumed.calories += l.calories * l.servings;
          consumed.protein += l.protein * l.servings;
          consumed.carbs += l.carbs * l.servings;
          consumed.fat += l.fat * l.servings;
        });
        
        const limitAlerts = [];
        if (consumed.calories > goals.calories) limitAlerts.push(`Calories (${consumed.calories} / ${goals.calories} kcal)`);
        if (consumed.protein > goals.protein) limitAlerts.push(`Protein (${consumed.protein}g / ${goals.protein}g)`);
        if (consumed.carbs > goals.carbs) limitAlerts.push(`Carbs (${consumed.carbs}g / ${goals.carbs}g)`);
        if (consumed.fat > goals.fat) limitAlerts.push(`Fat (${consumed.fat}g / ${goals.fat}g)`);
        
        // Calculate previous consumed to see if THIS meal pushed them over the edge
        let prevConsumed = { ...consumed };
        prevConsumed.calories -= (log.calories * log.servings);
        prevConsumed.protein -= (log.protein * log.servings);
        prevConsumed.carbs -= (log.carbs * log.servings);
        prevConsumed.fat -= (log.fat * log.servings);
        
        const newlyExceeded = [];
        if (consumed.calories > goals.calories && prevConsumed.calories <= goals.calories) newlyExceeded.push('Calories');
        if (consumed.protein > goals.protein && prevConsumed.protein <= goals.protein) newlyExceeded.push('Protein');
        if (consumed.carbs > goals.carbs && prevConsumed.carbs <= goals.carbs) newlyExceeded.push('Carbs');
        if (consumed.fat > goals.fat && prevConsumed.fat <= goals.fat) newlyExceeded.push('Fat');
        
        if (newlyExceeded.length > 0) {
          const body = `You just exceeded your daily limit for: ${newlyExceeded.join(', ')}. \n\nCurrent Totals:\n${limitAlerts.join('\n')}`;
          await notifyUser(
            user.id.toString(),
            "⚠️ Daily Limit Exceeded",
            body,
            "alert"
          );
        }
      }
    } catch (e) {
      console.warn('Macro check failed (logMeal):', e?.message || e);
    }

    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteMealLog = async (req, res) => {
  try {
    const log = await MealLog.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!log) return res.status(404).json({ error: 'Log not found' });
    const itemName = log.itemName;
    await log.destroy();
    
    try {
      const activityPayload = makeActivityPayload({
        type: 'calories:delete',
        message: `Deleted meal log: ${itemName}`,
        meta: { mealLogId: req.params.id },
        userId: req.user.id,
        userName: req.user.name
      });
      await Activity.create(activityPayload);
    } catch (e) {
      console.warn('Activity logging failed (deleteMealLog):', e?.message || e);
    }
    
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
