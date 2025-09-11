const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  totalSpent: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'total_spent'
  },
  orderCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'order_count'
  },
  lastOrderDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_order_date'
  }
}, {
  tableName: 'customers',
  underscored: true,
  timestamps: true
});

module.exports = Customer;