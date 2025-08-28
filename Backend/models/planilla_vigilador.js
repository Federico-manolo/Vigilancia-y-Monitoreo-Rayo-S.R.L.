const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PlanillaVigilador = sequelize.define('planilla_vigilador', {
  id_planilla_vigilador: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  id_planilla: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'planilla',  // nombre real de tu tabla Planilla
      key: 'id_planilla'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  id_vigilador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'vigilador', // nombre real de tu tabla Vigilador
      key: 'id_vigilador'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  }
}, {
  tableName: 'vigilador_puesto_puesto',
  timestamps: true,
  paranoid: false,
});

module.exports = PlanillaVigilador;
