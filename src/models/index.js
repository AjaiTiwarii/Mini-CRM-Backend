const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Import models with error handling
let Customer, Order, User, Segment, Campaign, CommunicationLog;

try {
  Customer = require('./Customer')(sequelize);
  Order = require('./Order')(sequelize);
  User = require('./User')(sequelize);
  Segment = require('./Segment')(sequelize);
  Campaign = require('./Campaign')(sequelize);
  CommunicationLog = require('./CommunicationLog')(sequelize);
  
  console.log('All models imported successfully');
} catch (error) {
  console.error('Model import error:', error.message);
  throw error;
}

// Define associations
try {
  Customer.hasMany(Order, { foreignKey: 'customer_id', as: 'orders' });
  Order.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

  User.hasMany(Segment, { foreignKey: 'user_id', as: 'segments' });
  Segment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  User.hasMany(Campaign, { foreignKey: 'user_id', as: 'campaigns' });
  Campaign.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  Segment.hasMany(Campaign, { foreignKey: 'segment_id', as: 'campaigns' });
  Campaign.belongsTo(Segment, { foreignKey: 'segment_id', as: 'segment' });

  Campaign.hasMany(CommunicationLog, { foreignKey: 'campaign_id', as: 'logs' });
  CommunicationLog.belongsTo(Campaign, { foreignKey: 'campaign_id', as: 'campaign' });

  Customer.hasMany(CommunicationLog, { foreignKey: 'customer_id', as: 'communications' });
  CommunicationLog.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  
  console.log('Model associations defined successfully');
} catch (error) {
  console.error('Association error:', error.message);
  throw error;
}

module.exports = {
  sequelize,
  Customer,
  Order,
  User,
  Segment,
  Campaign,
  CommunicationLog
};