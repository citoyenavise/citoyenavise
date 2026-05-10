import { DataTypes } from 'sequelize';

export const UserAction = (sequelize) => {
  const UserAction = sequelize.define(
    'UserAction',
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
      actionKey: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
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
      xpValue: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      metadata: {
        type: DataTypes.JSONB,
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
      tableName: 'user_actions',
      timestamps: true,
      underscored: true,
    }
  );

  UserAction.associate = (models) => {
    UserAction.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return UserAction;
};
