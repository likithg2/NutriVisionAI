import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  verb: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  emoji: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  itemName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  brief: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  meta: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  details: {
    type: DataTypes.JSON,
    defaultValue: {},
  }
}, {
  timestamps: true,
});

export default Activity;
