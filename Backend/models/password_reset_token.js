const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Usuario = require('./usuario');

const PasswordResetToken = sequelize.define('password_reset_token', {
  id_password_reset_token: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuario',
      key: 'id_usuario',
    },
    onDelete: 'CASCADE',
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  used: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'password_reset_token',
  timestamps: false,
});

PasswordResetToken.belongsTo(Usuario, { foreignKey: 'id_usuario' });
Usuario.hasMany(PasswordResetToken, { foreignKey: 'id_usuario' });

module.exports = PasswordResetToken;
