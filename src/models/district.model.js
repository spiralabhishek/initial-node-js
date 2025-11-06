import { DataTypes } from "sequelize";

export const defineDistrictModel = (sequelize) => {
  const District = sequelize.define(
    "District",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      district: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "is_active",
      },
    },
    {
      tableName: "districts",
      timestamps: true,
      underscored: true,
      paranoid: false,
    }
  );

  return District;
};
