const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Campaign = sequelize.define('Campaign', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    segmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'segment_id'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    audienceSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'audience_size'
    },
    sentCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sent_count'
    },
    failedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'failed_count'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'PENDING',
    }
  }, {
    tableName: 'campaigns',
    timestamps: true,
    underscored: true
  });

  return Campaign;
};