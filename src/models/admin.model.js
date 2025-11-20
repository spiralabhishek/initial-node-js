import { DataTypes } from "sequelize";

export const defineAdminModel = (sequelize) => {
  const Admin = sequelize.define(
    "Admin",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: { isEmail: true },
      },

      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      role: {
        type: DataTypes.ENUM("superadmin", "admin", "editor"),
        defaultValue: "admin",
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "is_active"
      },

      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "last_login",
      },

      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "deleted_at",
      }
    },

    {
      tableName: "admins",
      timestamps: true,
      paranoid: false,
      underscored: true,
      indexes: [
        { unique: true, fields: ["email"] }
      ],
    }
  );

  // Hide password when returning admin data
  Admin.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  return Admin;
};
