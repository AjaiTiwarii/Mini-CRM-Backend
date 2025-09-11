const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Segment = sequelize.define('Segment', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    rules: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    audienceSize: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'audience_size'
    }
  }, {
    tableName: 'segments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return Segment;
};