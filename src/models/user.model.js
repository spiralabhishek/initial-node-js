import { DataTypes } from "sequelize";

export const defineUserModel = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      phoneNumber: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true,
        field: 'phone_number',
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
          isEmail: true,
        },
        set(value) {
          if (value) {
            this.setDataValue('email', value.toLowerCase());
          }
        }
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'first_name',
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'last_name',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_verified',
      },
      lastLogin: {
        type: DataTypes.DATE,
        field: 'last_login',
      },
      // Refresh Token fields
      refreshToken: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'refresh_token',
      },
      refreshTokenExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'refresh_token_expires_at',
      },
      refreshTokenRevokedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'refresh_token_revoked_at',
      },
      // OTP fields
      currentOtp: {
        type: DataTypes.STRING(6),
        allowNull: true,
        field: 'current_otp',
      },
      otpExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'otp_expires_at',
      },
      otpAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'otp_attempts',
      },
      otpIsUsed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'otp_is_used',
      },
      deletedAt: {
        type: DataTypes.DATE,
        field: 'deleted_at',
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      underscored: true,
      paranoid: false,
      indexes: [
        {
          unique: true,
          fields: ['phone_number'],
          where: {
            deleted_at: null
          }
        },
        {
          unique: true,
          fields: ['email'],
          where: {
            deleted_at: null,
            email: {
              [sequelize.Sequelize.Op.ne]: null
            }
          }
        },
        {
          fields: ['refresh_token'],
        },
        {
          fields: ['otp_expires_at'],
        },
        {
          fields: ['refresh_token_expires_at'],
        }
      ]
    }
  );

  // Instance methods
  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.currentOtp;
    delete values.refreshToken;
    return values;
  };

  return User;
};
