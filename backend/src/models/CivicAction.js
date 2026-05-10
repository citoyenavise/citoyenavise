import { DataTypes } from 'sequelize';

export const CivicAction = (sequelize) => {
  const CivicAction = sequelize.define(
    'CivicAction',
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
      tutorialId: {
        type: DataTypes.INTEGER,
        references: { model: 'civic_tutorials', key: 'id' },
      },
      actionType: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      actionData: {
        type: DataTypes.JSONB,
      },
      targetOfficialId: {
        type: DataTypes.INTEGER,
        references: { model: 'elus', key: 'id' },
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: 'confirmed',
      },
      confirmationDate: {
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
      tableName: 'civic_actions',
      timestamps: true,
      underscored: true,
    }
  );

  CivicAction.associate = (models) => {
    CivicAction.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    CivicAction.belongsTo(models.CivicTutorial, {
      foreignKey: 'tutorialId',
      as: 'tutorial',
    });
    CivicAction.belongsTo(models.Elu, {
      foreignKey: 'targetOfficialId',
      as: 'targetOfficial',
    });
  };

  return CivicAction;
};
