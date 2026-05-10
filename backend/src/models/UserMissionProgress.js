import { DataTypes } from 'sequelize';

export const UserMissionProgress = (sequelize) => {
  const UserMissionProgress = sequelize.define(
    'UserMissionProgress',
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
      missionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'missions', key: 'id' },
      },
      status: {
        type: DataTypes.ENUM('active', 'completed', 'expired', 'failed'),
        defaultValue: 'active',
      },
      progressValue: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      startedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      completedAt: {
        type: DataTypes.DATE,
      },
      expiredAt: {
        type: DataTypes.DATE,
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
      tableName: 'user_mission_progress',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'missionId'],
        },
      ],
    }
  );

  UserMissionProgress.associate = (models) => {
    UserMissionProgress.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    UserMissionProgress.belongsTo(models.Mission, {
      foreignKey: 'missionId',
      as: 'mission',
    });
  };

  return UserMissionProgress;
};
