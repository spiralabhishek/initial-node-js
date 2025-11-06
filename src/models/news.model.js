import { DataTypes } from "sequelize";

export const defineNewsModel = (sequelize) => {
  const News = sequelize.define(
    "News",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      media: {
        type: DataTypes.STRING, // URL or file path for the news image/video
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "is_active",
      },
    },
    {
      tableName: "news",
      timestamps: true,
      underscored: true,
    }
  );

  return News;
};
