const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcrypt');

const Usuario = sequelize.define('usuario', {
    id_usuario: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    rol: {
        type: DataTypes.ENUM('supervisor', 'admin', 'contabilidad'),
        allowNull: false,
        defaultValue: 'supervisor'
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    apellido: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    contraseña: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'usuario',
    timestamps: false,
    hooks: {
        beforeCreate: async (usuario) => {
            if (usuario.contraseña) {
                const saltRounds = 10;
                usuario.contraseña = await bcrypt.hash(usuario.contraseña, saltRounds);
            }
        },
        beforeUpdate: async (usuario) => {
            if (usuario.changed('contraseña')) {
                const saltRounds = 10;
                usuario.contraseña = await bcrypt.hash(usuario.contraseña, saltRounds);
            }
        }
    }
});

// Método para comparar contraseñas
Usuario.prototype.compararContraseña = async function(contraseñaPlana) {
    return await bcrypt.compare(contraseñaPlana, this.contraseña);
};

module.exports = Usuario;