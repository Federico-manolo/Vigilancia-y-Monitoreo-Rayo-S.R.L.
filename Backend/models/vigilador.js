const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Vigilador = sequelize.define('vigilador', {
    id_vigilador: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    apellido: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    dni: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
    },
    legajo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
    },
    activo:{
        type: DataTypes.BOOLEAN,
        allowNull:false,
        defaultValue: true,
    }
}, {
    tableName: 'vigilador',
    timestamps: false,
});

module.exports = Vigilador;
