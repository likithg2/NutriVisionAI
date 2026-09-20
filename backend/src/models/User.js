import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/db.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    set(val) {
      if (val) this.setDataValue('email', val.toLowerCase());
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  theme: {
    type: DataTypes.STRING,
    defaultValue: 'light',
  },
  accent: {
    type: DataTypes.STRING,
    defaultValue: '#0b5fff',
  },
  layoutDensity: {
    type: DataTypes.STRING,
    defaultValue: 'spacious',
  },
  notificationPrefs: {
    type: DataTypes.JSON,
    defaultValue: {
      emailEnabled: true,
      pushEnabled: true,
      reminderDays: 3,
      digest: 'weekly'
    }
  },
  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sessionsRevokedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  height: {
    type: DataTypes.FLOAT, // in cm
    allowNull: true,
  },
  weight: {
    type: DataTypes.FLOAT, // in kg
    allowNull: true,
  },
  gender: {
    type: DataTypes.STRING, // 'male', 'female', 'other'
    allowNull: true,
  },
  activityLevel: {
    type: DataTypes.STRING, // 'sedentary', 'light', 'moderate', 'active', 'very_active'
    defaultValue: 'sedentary',
  },
  goal: {
    type: DataTypes.STRING, // 'lose', 'maintain', 'gain'
    defaultValue: 'maintain',
  },
  district: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  kitchenRecipes: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  kitchenCache: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  shoppingCache: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  dashboardCache: {
    type: DataTypes.JSON,
    allowNull: true,
  }
}, {
  timestamps: true,
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

User.prototype.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default User;
