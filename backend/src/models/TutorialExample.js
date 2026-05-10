import { DataTypes } from 'sequelize';

export const TutorialExample = (sequelize) => {
  const TutorialExample = sequelize.define(
    'TutorialExample',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      stepId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'tutorial_steps', key: 'id' },
      },
      titleFr: {
        type: DataTypes.STRING(255),
      },
      exampleContent: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      exampleType: {
        type: DataTypes.STRING(50),
      },
      isPositiveExample: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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
      tableName: 'tutorial_examples',
      timestamps: true,
      underscored: true,
    }
  );

  TutorialExample.associate = (models) => {
    TutorialExample.belongsTo(models.TutorialStep, {
      foreignKey: 'stepId',
      as: 'step',
    });
  };

  return TutorialExample;
};
