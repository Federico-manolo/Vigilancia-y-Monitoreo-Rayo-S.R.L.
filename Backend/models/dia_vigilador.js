const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DiaVigilador = sequelize.define('dia_vigilador', {
    id_dia_vigilador: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    id_vigilador: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    id_turno: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    estado: {
        type: DataTypes.ENUM('trabaja', 'franco', 'ausente', 'vacaciones', 'licencia', 'feriado', 'enfermo', 'No Asignado'),
        allowNull: false,
    }
}, {
    indexes: [
        {
          name: 'idx_dia_vigilador_vigilador_fecha',
          fields: ['id_vigilador', 'fecha']
        }
      ],
    tableName: 'dia_vigilador',
    timestamps: false,
});

module.exports = DiaVigilador;
