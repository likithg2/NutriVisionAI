import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before anything else
dotenv.config({ path: path.resolve('.env') });

import { sequelize } from './src/config/db.js';
import User from './src/models/User.js';
import Item from './src/models/Item.js';
import MealLog from './src/models/MealLog.js';
import Activity from './src/models/Activity.js';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    
    // 1. Ensure user exists
    let user = await User.findOne({ where: { email: 'thearjun006@gmail.com' } });
    if (!user) {
      const hashedPassword = await bcrypt.hash('12345678', 10);
      user = await User.create({
        name: 'Arjun',
        email: 'thearjun006@gmail.com',
        password: hashedPassword,
      });
      console.log('User created:', user.email);
    } else {
      console.log('User exists:', user.email);
    }

    const now = new Date();

    // 2. Add another 10 inventory items
    const items = [
      { name: 'Apples', category: 'produce', expiryDate: new Date(now.getTime() + 10 * 86400000), calories: 95, protein: 0.5, carbs: 25, fat: 0.3, location: 'Fridge' },
      { name: 'Bananas', category: 'produce', expiryDate: new Date(now.getTime() + 5 * 86400000), calories: 105, protein: 1.3, carbs: 27, fat: 0.4, location: 'Counter' },
      { name: 'Ground Beef', category: 'meat', expiryDate: new Date(now.getTime() + 2 * 86400000), calories: 250, protein: 26, carbs: 0, fat: 15, location: 'Fridge' },
      { name: 'Spinach', category: 'vegetables', expiryDate: new Date(now.getTime() + 4 * 86400000), calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, location: 'Fridge' },
      { name: 'Quinoa', category: 'grains', expiryDate: new Date(now.getTime() + 120 * 86400000), calories: 222, protein: 8, carbs: 39, fat: 3.6, location: 'Pantry' },
      { name: 'Peanut Butter', category: 'snacks', expiryDate: new Date(now.getTime() + 365 * 86400000), calories: 588, protein: 25, carbs: 20, fat: 50, location: 'Pantry' },
      { name: 'Cottage Cheese', category: 'dairy', expiryDate: new Date(now.getTime() + 14 * 86400000), calories: 98, protein: 11, carbs: 3.4, fat: 4.3, location: 'Fridge' },
      { name: 'Tomatoes', category: 'produce', expiryDate: new Date(now.getTime() + 6 * 86400000), calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, location: 'Counter' }, 
      { name: 'Oats', category: 'grains', expiryDate: new Date(now.getTime() + 200 * 86400000), calories: 389, protein: 16.9, carbs: 66, fat: 6.9, location: 'Pantry' },
      { name: 'Salmon Fillet', category: 'meat', expiryDate: new Date(now.getTime() + 1.5 * 86400000), calories: 208, protein: 20, carbs: 0, fat: 13, location: 'Fridge' },
    ];

    for (const item of items) {
      await Item.create({ ...item, userId: user.id });
      
      // Activity Log
      await Activity.create({
        userId: user.id,
        userName: user.name,
        type: 'inventory',
        verb: 'added',
        subject: item.name,
        message: `Added ${item.name} to inventory`
      });
    }
    console.log('Inserted 10 more inventory items & activity logs.');

    // 3. Add another 10 calorie log meals
    const today = now.toISOString().split('T')[0];
    const yesterdayDate = new Date(now.getTime() - 24 * 3600000 * 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    const logs = [
      { itemName: 'Pancakes with Syrup', mealType: 'breakfast', calories: 450, protein: 8, carbs: 85, fat: 10, date: today },
      { itemName: 'Caesar Salad', mealType: 'lunch', calories: 350, protein: 15, carbs: 12, fat: 28, date: today },
      { itemName: 'Banana', mealType: 'snack', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, date: today },
      { itemName: 'Protein Bar', mealType: 'snack', calories: 200, protein: 20, carbs: 22, fat: 6, date: today },
      { itemName: 'Steak and Potatoes', mealType: 'dinner', calories: 750, protein: 55, carbs: 45, fat: 35, date: yesterday }, 
      { itemName: 'Avocado Toast', mealType: 'breakfast', calories: 280, protein: 6, carbs: 20, fat: 20, date: yesterday }, 
      { itemName: 'Sushi Roll', mealType: 'lunch', calories: 350, protein: 15, carbs: 50, fat: 8, date: yesterday }, 
      { itemName: 'Carrot Sticks', mealType: 'snack', calories: 35, protein: 1, carbs: 8, fat: 0.1, date: yesterday }, 
      { itemName: 'Spaghetti Bolognese', mealType: 'dinner', calories: 650, protein: 30, carbs: 70, fat: 22, date: today }, 
      { itemName: 'Smoothie Bowl', mealType: 'breakfast', calories: 300, protein: 10, carbs: 45, fat: 8, date: yesterday }, 
    ];

    for (const log of logs) {
      await MealLog.create({ ...log, userId: user.id });

      // Activity Log
      await Activity.create({
        userId: user.id,
        userName: user.name,
        type: 'meal',
        verb: 'logged',
        subject: log.itemName,
        message: `Logged meal: ${log.itemName}`
      });
    }
    console.log('Inserted 10 more calorie log meals & activity logs.');

    // Let's add activity logs for the previously added items/meals too just so it looks full
    await Activity.create({ userId: user.id, userName: user.name, type: 'inventory', verb: 'added', subject: 'Fresh Milk', message: 'Added Fresh Milk to inventory' });
    await Activity.create({ userId: user.id, userName: user.name, type: 'inventory', verb: 'added', subject: 'Eggs', message: 'Added Eggs to inventory' });
    await Activity.create({ userId: user.id, userName: user.name, type: 'inventory', verb: 'added', subject: 'Chicken Breast', message: 'Added Chicken Breast to inventory' });
    await Activity.create({ userId: user.id, userName: user.name, type: 'inventory', verb: 'added', subject: 'Broccoli', message: 'Added Broccoli to inventory' });
    await Activity.create({ userId: user.id, userName: user.name, type: 'inventory', verb: 'added', subject: 'Brown Rice', message: 'Added Brown Rice to inventory' });
    
    await Activity.create({ userId: user.id, userName: user.name, type: 'meal', verb: 'logged', subject: 'Oatmeal with Berries', message: 'Logged meal: Oatmeal with Berries' });
    await Activity.create({ userId: user.id, userName: user.name, type: 'meal', verb: 'logged', subject: 'Grilled Chicken Salad', message: 'Logged meal: Grilled Chicken Salad' });
    await Activity.create({ userId: user.id, userName: user.name, type: 'meal', verb: 'logged', subject: 'Apple', message: 'Logged meal: Apple' });

    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
