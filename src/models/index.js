import { defineUserModel } from './user.model.js';

export const initModels = sequelize => {
  const User = defineUserModel(sequelize);

  return {
    User
  };
};

export default initModels;
