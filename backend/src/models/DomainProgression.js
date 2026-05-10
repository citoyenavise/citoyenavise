import { DataTypes } from 'sequelize';

export const DomainProgression = (sequelize) => {
  const DomainProgression = sequelize.define(
    'DomainProgression',
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
      domain: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      level: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      xp: {
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
      tableName: 'domain_progression',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'domain'],
        },
      ],
    }
  );

  DomainProgression.associate = (models) => {
    DomainProgression.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return DomainProgression;
};
