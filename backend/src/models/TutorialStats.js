import { DataTypes } from 'sequelize';

export const TutorialStats = (sequelize) => {
  const TutorialStats = sequelize.define(
    'TutorialStats',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tutorialId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'civic_tutorials', key: 'id' },
      },
      totalStarted: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      totalCompleted: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      totalCivicActions: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      avgCompletionTimeMinutes: {
        type: DataTypes.INTEGER,
      },
      completionRatePercent: {
        type: DataTypes.DECIMAL(5, 2),
      },
      lastUpdated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'tutorial_stats',
      timestamps: false,
    }
  );

  TutorialStats.associate = (models) => {
    TutorialStats.belongsTo(models.CivicTutorial, {
      foreignKey: 'tutorialId',
      as: 'tutorial',
    });
  };

  return TutorialStats;
};
