import { DataTypes } from "sequelize";

export const definePostModel = (sequelize) => {
  const Post = sequelize.define(
    "Post",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "category_id",
      },
      districtId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "district_id",
      },
      talukaId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "taluka_id",
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      media: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [], // Store array of URLs
      },
      postedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "posted_by",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "is_active",
      },
    },
    {
      tableName: "posts",
      timestamps: true,
      underscored: true,
    }
  );

  return Post;
};
