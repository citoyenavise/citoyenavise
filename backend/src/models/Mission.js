import { DataTypes } from 'sequelize';

export const Mission = (sequelize) => {
  const Mission = sequelize.define(
    'Mission',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      missionKey: {
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
        type: DataTypes.ENUM(
          'discovery',
          'social',
          'creative',
          'public_data',
          'civic',
          'system'
        ),
        allowNull: false,
      },
      frequency: {
        type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'special'),
        allowNull: false,
      },
      xpReward: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      completionCriteria: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      displayOrder: {
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
      tableName: 'missions',
      timestamps: true,
      underscored: true,
    }
  );

  Mission.associate = (models) => {
    Mission.hasMany(models.UserMissionProgress, {
      foreignKey: 'missionId',
      as: 'userProgress',
    });
  };

  return Mission;
};
