import { DataTypes } from 'sequelize';

export const UserProgression = (sequelize) => {
  const UserProgression = sequelize.define(
    'UserProgression',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
      },
      totalXp: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      level: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      currentLevelXp: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      nextLevelXp: {
        type: DataTypes.INTEGER,
        defaultValue: 500,
      },
      totalActions: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      totalMissionsCompleted: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      totalBadgesEarned: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      currentStreak: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      longestStreak: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastActionAt: {
        type: DataTypes.DATE,
      },
      lastMissionCompletedAt: {
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
      tableName: 'user_progression',
      timestamps: true,
      underscored: true,
    }
  );

  UserProgression.associate = (models) => {
    UserProgression.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return UserProgression;
};
