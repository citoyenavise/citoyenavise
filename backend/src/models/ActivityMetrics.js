import { DataTypes } from 'sequelize';

export const ActivityMetrics = (sequelize) => {
  const ActivityMetrics = sequelize.define(
    'ActivityMetrics',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      metricDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      actionsCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      timeSpentSeconds: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      scrollDepthPercent: {
        type: DataTypes.DECIMAL(5, 2),
      },
      pagesVisited: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'activity_metrics',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'metricDate'],
        },
      ],
    }
  );

  ActivityMetrics.associate = (models) => {
    ActivityMetrics.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return ActivityMetrics;
};
