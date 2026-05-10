import { DataTypes } from 'sequelize';

export const TutorialStep = (sequelize) => {
  const TutorialStep = sequelize.define(
    'TutorialStep',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tutorialId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'civic_tutorials', key: 'id' },
      },
      stepNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      titleFr: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      descriptionFr: {
        type: DataTypes.TEXT,
      },
      contentType: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      contentData: {
        type: DataTypes.JSONB,
      },
      actionType: {
        type: DataTypes.STRING(50),
      },
      orderIndex: {
        type: DataTypes.INTEGER,
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
      tableName: 'tutorial_steps',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['tutorialId', 'stepNumber'],
        },
      ],
    }
  );

  TutorialStep.associate = (models) => {
    TutorialStep.belongsTo(models.CivicTutorial, {
      foreignKey: 'tutorialId',
      as: 'tutorial',
    });
    TutorialStep.hasMany(models.TutorialExample, {
      foreignKey: 'stepId',
      as: 'examples',
    });
  };

  return TutorialStep;
};
