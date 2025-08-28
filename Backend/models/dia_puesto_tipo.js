const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DiaPuestoTipo = sequelize.define('dia_puesto_tipo', {
    id_dia_tipo: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    id_puesto: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    dia_semana: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '0 = Domingo, 6 = Sábado. Se ignora si hay fecha_especial.'
    },
    fecha_especial: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Si no es null, representa una configuración de horario específica para ese día exacto.'
    },
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
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    jornada_horario_partido: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    es_laborable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'dia_puesto_tipo',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['id_puesto', 'dia_semana', 'fecha_especial'],
            name: 'unique_config_por_puesto_y_dia_o_fecha'
        }
        //De esta forma se asegura que no haya dos configuraciones iguales para el mismo puesto y dia o fecha especial
    ]
});


// Hook para calcular horas requeridas antes de crear o actualizar
const calcularHorasRequeridas = (horaInicio, horaFin) => {
    if (!horaInicio || !horaFin) {
        return 0;
    }
    const [hEntrada, mEntrada] = horaInicio.split(':').map(Number);
    const [hSalida, mSalida] = horaFin.split(':').map(Number);

    if (
        Number.isNaN(hEntrada) || Number.isNaN(mEntrada) ||
        Number.isNaN(hSalida) || Number.isNaN(mSalida)
    ) {
        return 0;
    }

    let inicio = hEntrada + mEntrada / 60;
    let fin = hSalida + mSalida / 60;

    // Si la salida es menor que la entrada, se asume que termina al día siguiente
    if (fin < inicio) {
        fin += 24;
    }

    return parseFloat((fin - inicio).toFixed(2));
};

DiaPuestoTipo.beforeCreate((dia) => {
    if (dia.es_laborable) {
        const tramo1 = calcularHorasRequeridas(dia.horario_entrada, dia.horario_salida);
        const tramo2 = dia.jornada_horario_partido ? calcularHorasRequeridas(dia.horario_entrada_2, dia.horario_salida_2) : 0;
        dia.horas_requeridas = tramo1 + tramo2;
    } else {
        dia.horas_requeridas = 0;
        dia.jornada_horario_partido = false;
    }
});
  
DiaPuestoTipo.beforeUpdate((dia) => {
    if (dia.es_laborable) {
        const tramo1 = calcularHorasRequeridas(dia.horario_entrada, dia.horario_salida);
        const tramo2 = dia.jornada_horario_partido ? calcularHorasRequeridas(dia.horario_entrada_2, dia.horario_salida_2) : 0;
        dia.horas_requeridas = tramo1 + tramo2;
    } else {
        dia.horas_requeridas = 0;
        dia.jornada_horario_partido = false;
    }
});

module.exports = DiaPuestoTipo;
