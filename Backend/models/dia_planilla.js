const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DiaPlanilla = sequelize.define('dia_planilla', {
    id_dia_planilla: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    id_planilla: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    id_dia_tipo: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    horas_totales_trabajadas: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },

    //Vamos a agregar la copia de los valores del DiaPuestoTipo al momento de la Creación
    horario_entrada: {
        type: DataTypes.TIME,
        allowNull: true,
    },
    horario_salida: {
        type: DataTypes.TIME,
        allowNull: true,
    },
    horario_entrada_2: {
        type: DataTypes.TIME,
        allowNull: true,
    },
    horario_salida_2: {
        type: DataTypes.TIME,
        allowNull: true,
    },
    horas_requeridas: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    jornada_partida: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    es_laborable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    horas_cumplidas: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    indexes: [
        {
          name: 'idx_dia_planilla_planilla_fecha',
          fields: ['id_planilla', 'fecha']
        }
      ],
    tableName: 'dia_planilla',
    timestamps: false,
});

module.exports = DiaPlanilla;
