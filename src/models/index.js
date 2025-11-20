import { defineUserModel } from './user.model.js';
import { defineDistrictModel } from './district.model.js';
import { defineTalukaModel } from './taluka.model.js';
import { defineCategoryModel } from './category.model.js';
import { definePostModel } from './post.model.js';
import { defineNewsModel } from './news.model.js';
import { defineAdminModel } from './admin.model.js';

export const initModels = sequelize => {
  const User = defineUserModel(sequelize);
  const District = defineDistrictModel(sequelize);
  const Taluka = defineTalukaModel(sequelize);
  const Category = defineCategoryModel(sequelize);
  const Post = definePostModel(sequelize);
  const News = defineNewsModel(sequelize);
  const Admin = defineAdminModel(sequelize);

  District.hasMany(Taluka, { foreignKey: 'districtId', as: 'talukas' });
  Taluka.belongsTo(District, { foreignKey: 'districtId', as: 'district' });

  Category.hasMany(Post, { foreignKey: 'categoryId', as: 'posts' });
  District.hasMany(Post, { foreignKey: 'districtId', as: 'posts' });
  Taluka.hasMany(Post, { foreignKey: 'talukaId', as: 'posts' });
  User.hasMany(Post, { foreignKey: 'postedBy', as: 'posts' });

  Post.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
  Post.belongsTo(District, { foreignKey: 'districtId', as: 'district' });
  Post.belongsTo(Taluka, { foreignKey: 'talukaId', as: 'taluka' });
  Post.belongsTo(User, { foreignKey: 'postedBy', as: 'author' });

  Admin.hasMany(News, { foreignKey: 'createdBy', as: 'createdNews' });
  News.belongsTo(Admin, { foreignKey: 'createdBy', as: 'createdByAdmin' });

  return {
    User,
    District,
    Taluka,
    Category,
    Post,
    News,
    Admin
  };
};

export default initModels;
