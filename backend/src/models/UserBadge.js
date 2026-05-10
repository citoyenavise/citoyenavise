import { DataTypes } from 'sequelize';

export const UserBadge = (sequelize) => {
  const UserBadge = sequelize.define(
    'UserBadge',
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
      badgeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'badges', key: 'id' },
      },
      unlockedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'user_badges',
      timestamps: false,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'badgeId'],
        },
      ],
    }
  );

  UserBadge.associate = (models) => {
    UserBadge.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    UserBadge.belongsTo(models.Badge, {
      foreignKey: 'badgeId',
      as: 'badge',
    });
  };

  return UserBadge;
};
