import { DataTypes, Op } from 'sequelize';
import { sequelize } from '../config/db.js';
import User from './User.js';
import Item from './Item.js';

const Notification = sequelize.define('Notification', {
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
  itemId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: Item,
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'email',
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'itemId', 'type', 'title'],
      where: {
        itemId: {
          [Op.ne]: null
        }
      }
    }
  ]
});

// Associations
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Item.hasMany(Notification, { foreignKey: 'itemId', as: 'notifications' });
Notification.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

export default Notification;
