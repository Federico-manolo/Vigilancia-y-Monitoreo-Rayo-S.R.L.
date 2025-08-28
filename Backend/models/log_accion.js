const { DataTypes, Sequelize } = require('sequelize');
const { sequelize } = require('../config/db');

const LogAccion = sequelize.define('log_accion', {
    id_log: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    accion: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    detalles: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_DATE'),
    },
    hora: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIME'),
    },
}, {
    tableName: 'log_accion',
    timestamps: false,
});

module.exports = LogAccion;
