import { DataTypes } from 'sequelize';

export const UserTutorialProgress = (sequelize) => {
  const UserTutorialProgress = sequelize.define(
    'UserTutorialProgress',
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
      tutorialId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'civic_tutorials', key: 'id' },
      },
      status: {
        type: DataTypes.ENUM(
          'locked',
          'available',
          'in_progress',
          'completed',
          'mastered'
        ),
        defaultValue: 'available',
      },
      startedAt: {
        type: DataTypes.DATE,
      },
      completedAt: {
        type: DataTypes.DATE,
      },
      currentStepNumber: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      attemptsCount: {
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
      tableName: 'user_tutorial_progress',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'tutorialId'],
        },
      ],
    }
  );

  UserTutorialProgress.associate = (models) => {
    UserTutorialProgress.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    UserTutorialProgress.belongsTo(models.CivicTutorial, {
      foreignKey: 'tutorialId',
      as: 'tutorial',
    });
    UserTutorialProgress.hasMany(models.UserStepProgress, {
      foreignKey: 'userTutorialProgressId',
      as: 'stepProgress',
    });
  };

  return UserTutorialProgress;
};
