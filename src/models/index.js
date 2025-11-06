import { defineUserModel } from "./user.model.js";
import { defineDistrictModel } from "./district.model.js";
import { defineTalukaModel } from "./taluka.model.js";

export const initModels = (sequelize) => {
  const User = defineUserModel(sequelize);
  const District = defineDistrictModel(sequelize);
  const Taluka = defineTalukaModel(sequelize);

  // 🧩 Relationships
  District.hasMany(Taluka, {
    foreignKey: "districtId",
    as: "talukas",
    onDelete: "CASCADE",
  });

  Taluka.belongsTo(District, {
    foreignKey: "districtId",
    as: "district",
  });

  return {
    User,
    District,
    Taluka,
  };
};

export default initModels;
