import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const CommentTranslation = sequelize.define('CommentTranslation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    commentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'comment_id',
      references: {
        model: 'comments',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    language: {
      type: DataTypes.STRING(2),
      allowNull: false,
    },
    contenu: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'comment_translations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['comment_id', 'language'],
        unique: true,
      },
      {
        fields: ['language'],
      },
    ],
});

export default CommentTranslation;
export { CommentTranslation };

