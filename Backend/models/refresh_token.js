const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Usuario = require('./usuario');

const RefreshToken = sequelize.define('refresh_token', {
  id_refresh_token: {
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
  user_agent: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  revoked: {
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
  tableName: 'refresh_token',
  timestamps: false,
});

// Relación N:1 con usuario
RefreshToken.belongsTo(Usuario, { foreignKey: 'id_usuario' });
Usuario.hasMany(RefreshToken, { foreignKey: 'id_usuario' });

module.exports = RefreshToken;
