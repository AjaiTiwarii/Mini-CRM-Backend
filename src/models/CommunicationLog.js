const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CommunicationLog = sequelize.define('CommunicationLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    campaignId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'campaign_id'
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'customer_id'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'PENDING',
    },
    sentAt: {
      type: DataTypes.DATE,
      field: 'sent_at'
    },
    failedAt: {
      type: DataTypes.DATE,
      field: 'failed_at'
    },
    failureReason: {
      type: DataTypes.TEXT,
      field: 'failure_reason'
    }
  }, {
    tableName: 'communication_logs',
    timestamps: true,
    underscored: true,
    updatedAt: false
  });

  return CommunicationLog;
};