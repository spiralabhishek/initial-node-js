import { DataTypes } from "sequelize";

export const defineTalukaModel = (sequelize) => {
  const Taluka = sequelize.define(
    "Taluka",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      taluka: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      districtId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "district_id",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "is_active",
      },
    },
    {
      tableName: "talukas",
      timestamps: true,
      underscored: true,
      paranoid: false,
    }
  );

  return Taluka;
};
