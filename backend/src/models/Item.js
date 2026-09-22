import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import User from './User.js';

const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'grocery',
  },
  barcode: {
    type: DataTypes.STRING,
  },
  brand: {
    type: DataTypes.STRING,
  },
  quantity: {
    type: DataTypes.FLOAT,
  },
  unit: {
    type: DataTypes.STRING,
    defaultValue: 'pcs',
  },
  location: {
    type: DataTypes.STRING,
    defaultValue: 'pantry',
  },
  notes: {
    type: DataTypes.TEXT,
  },
  dosage: {
    type: DataTypes.STRING,
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  purchaseDate: {
    type: DataTypes.DATE,
  },
  openedAt: {
    type: DataTypes.DATE,
  },
  reminderTime: {
    type: DataTypes.DATE,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active',
  },
  notified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  notifiedAt: {
    type: DataTypes.DATE,
  },
  estimatedCost: {
    type: DataTypes.FLOAT,
  },
  consumedAt: {
    type: DataTypes.DATE,
  },
  mealType: {
    type: DataTypes.STRING,
  },
  calories: {
    type: DataTypes.FLOAT,
  },
  protein: {
    type: DataTypes.FLOAT,
  },
  carbs: {
    type: DataTypes.FLOAT,
  },
  fat: {
    type: DataTypes.FLOAT,
  },
  fiber: {
    type: DataTypes.FLOAT,
  }
}, {
  timestamps: true,
  hooks: {
    beforeSave: (item) => {
      if (item.expiryDate && new Date(item.expiryDate) < new Date()) {
        item.status = (item.status === 'consumed' || item.status === 'partially_consumed') ? item.status : 'expired';
      } else if (item.status !== 'consumed' && item.status !== 'partially_consumed') {
        item.status = 'active';
      }
    }
  }
});

// Associations
User.hasMany(Item, { foreignKey: 'userId', as: 'items' });
Item.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Item;
