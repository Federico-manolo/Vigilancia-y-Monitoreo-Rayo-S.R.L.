const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ContinuidadTurno = sequelize.define('ContinuidadTurno', {
  id_continuidad_turno: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  id_turno: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_dia_planilla_destino: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_dia_vigilador_destino: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_vigilador: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  hora_inicio_heredada: {
    type: DataTypes.STRING, // formato 'HH:mm'
    allowNull: false
  },
  hora_fin_heredada: {
    type: DataTypes.STRING, // formato 'HH:mm'
    allowNull: false
  }
}, {
  indexes: [
    {
      name: 'idx_continuidad_vigilador_destino_fecha',
      fields: ['id_dia_vigilador_destino', 'hora_inicio_heredada']
    }
  ],
  tableName: 'turno_continuidad',
  timestamps: false
});

module.exports = ContinuidadTurno;
