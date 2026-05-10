import { DataTypes } from 'sequelize';

export const UserStepProgress = (sequelize) => {
  const UserStepProgress = sequelize.define(
    'UserStepProgress',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userTutorialProgressId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'user_tutorial_progress', key: 'id' },
      },
      stepId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'tutorial_steps', key: 'id' },
      },
      status: {
        type: DataTypes.ENUM('locked', 'available', 'in_progress', 'completed'),
        defaultValue: 'locked',
      },
      userResponse: {
        type: DataTypes.JSONB,
      },
      isCorrect: {
        type: DataTypes.BOOLEAN,
      },
      completedAt: {
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
      tableName: 'user_step_progress',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['userTutorialProgressId', 'stepId'],
        },
      ],
    }
  );

  UserStepProgress.associate = (models) => {
    UserStepProgress.belongsTo(models.UserTutorialProgress, {
      foreignKey: 'userTutorialProgressId',
      as: 'tutorialProgress',
    });
    UserStepProgress.belongsTo(models.TutorialStep, {
      foreignKey: 'stepId',
      as: 'step',
    });
  };

  return UserStepProgress;
};
