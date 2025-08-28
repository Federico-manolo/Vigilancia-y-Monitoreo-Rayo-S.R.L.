const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Turno = sequelize.define('turno', {
    id_turno: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    id_dia_planilla: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    id_dia_vigilador: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    hora_inicio: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    cantidad_horas: {
        type: DataTypes.NUMERIC,
        allowNull: false,
    },
    horas_diurnas: {
        type: DataTypes.NUMERIC,
        allowNull: false,
    },
    horas_nocturnas: {
        type: DataTypes.NUMERIC,
        allowNull: false,
    },
    hora_fin: {
        type: DataTypes.TIME,
        allowNull: false,
    },
}, {
    tableName: 'turno',
    timestamps: false,
});

module.exports = Turno;
