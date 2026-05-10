import { DataTypes } from 'sequelize';

export const Badge = (sequelize) => {
  const Badge = sequelize.define(
    'Badge',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      badgeKey: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      nameFr: {
        type: DataTypes.STRING(100),
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
      iconUrl: {
        type: DataTypes.STRING(255),
      },
      rarity: {
        type: DataTypes.STRING(20),
        defaultValue: 'common',
      },
      unlockCriteria: {
        type: DataTypes.JSONB,
        allowNull: false,
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
      tableName: 'badges',
      timestamps: true,
      underscored: true,
    }
  );

  Badge.associate = (models) => {
    Badge.hasMany(models.UserBadge, {
      foreignKey: 'badgeId',
      as: 'users',
    });
  };

  return Badge;
};
