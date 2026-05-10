import { DataTypes } from 'sequelize';

export const CivicTutorial = (sequelize) => {
  const CivicTutorial = sequelize.define(
    'CivicTutorial',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      titleFr: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      descriptionFr: {
        type: DataTypes.TEXT,
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      difficultyLevel: {
        type: DataTypes.STRING(20),
        defaultValue: 'beginner',
      },
      estimatedDurationMinutes: {
        type: DataTypes.INTEGER,
      },
      iconUrl: {
        type: DataTypes.STRING(255),
      },
      orderIndex: {
        type: DataTypes.INTEGER,
      },
      prerequisites: {
        type: DataTypes.JSONB,
      },
      isActive: {
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
      tableName: 'civic_tutorials',
      timestamps: true,
      underscored: true,
    }
  );

  CivicTutorial.associate = (models) => {
    CivicTutorial.hasMany(models.TutorialStep, {
      foreignKey: 'tutorialId',
      as: 'steps',
    });
    CivicTutorial.hasMany(models.UserTutorialProgress, {
      foreignKey: 'tutorialId',
      as: 'userProgress',
    });
    CivicTutorial.hasMany(models.TutorialResource, {
      foreignKey: 'tutorialId',
      as: 'resources',
    });
    CivicTutorial.hasOne(models.TutorialStats, {
      foreignKey: 'tutorialId',
      as: 'stats',
    });
  };

  return CivicTutorial;
};
