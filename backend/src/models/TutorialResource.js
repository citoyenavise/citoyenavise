import { DataTypes } from 'sequelize';

export const TutorialResource = (sequelize) => {
  const TutorialResource = sequelize.define(
    'TutorialResource',
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
      titleFr: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      url: {
        type: DataTypes.STRING(500),
      },
      source: {
        type: DataTypes.STRING(100),
      },
      isOfficial: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      verificationDate: {
        type: DataTypes.DATEONLY,
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
      tableName: 'tutorial_resources',
      timestamps: true,
      underscored: true,
    }
  );

  TutorialResource.associate = (models) => {
    TutorialResource.belongsTo(models.CivicTutorial, {
      foreignKey: 'tutorialId',
      as: 'tutorial',
    });
  };

  return TutorialResource;
};
