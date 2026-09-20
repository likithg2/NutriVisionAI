import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const MealLog = sequelize.define('MealLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY, // YYYY-MM-DD
    allowNull: false,
  },
  mealType: {
    type: DataTypes.STRING, // breakfast, lunch, dinner, snack
    allowNull: false,
  },
  itemName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  calories: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  protein: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  carbs: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  fat: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  servings: {
    type: DataTypes.FLOAT,
    defaultValue: 1,
  },
}, {
  timestamps: true,
});

export default MealLog;
