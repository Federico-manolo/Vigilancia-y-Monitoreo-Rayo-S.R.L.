const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Planilla = sequelize.define('planilla', {
    id_planilla: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    id_puesto: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    mes: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    anio: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    horas_mensuales: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuario',
            key: 'id_usuario'
        }
    }
}, {
    tableName: 'planilla',
    timestamps: false,
});

module.exports = Planilla;
