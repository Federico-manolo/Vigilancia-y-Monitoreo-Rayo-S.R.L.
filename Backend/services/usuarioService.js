const { Usuario } = require('../models');
const LogService = require('./logService');
const { RefreshToken, PasswordResetToken } = require('../models');
const { generateRefreshToken, getRefreshTokenExpiryDate } = require('../config/jwt');
const crypto = require('crypto');

class UsuarioService {
    static async contarUsuarios() {
        return await Usuario.count();
    }
    static async crearUsuario(data, creadorRol = 'supervisor', id_usuario_accion = null) {
        const {
            nombre,
            apellido,
            email,
            contraseña,
            rol = 'supervisor' // por defecto
        } = data;

        // Solo admin puede crear usuarios con rol diferente a supervisor
        if (rol !== 'supervisor' && creadorRol !== 'admin') {
            throw new Error('Solo los administradores pueden asignar roles diferentes a supervisor');
        }

        // La contraseña se encripta automáticamente en el modelo
        const usuario = await Usuario.create({
            nombre,
            apellido,
            email,
            contraseña,
            rol,
            activo: true
        });
        if (id_usuario_accion) {
            await LogService.registrarAccion({
                id_usuario: id_usuario_accion,
                accion: 'crear_usuario',
                detalles: `Se creó el usuario ${nombre} ${apellido} (${email}) con rol ${rol}`
            });
        }
        return usuario;
    }

    static async obtenerPorId(id_usuario) {
        return await Usuario.findByPk(id_usuario);
    }

    static async obtenerPorEmail(email) {
        return await Usuario.findOne({ where: { email } });
    }

    static async listarUsuarios({ rol, activo } = {}) {
        const where = {};
        if (rol) where.rol = rol;
        if (activo !== undefined) where.activo = activo;
        return await Usuario.findAll({ where });
    }

    static async validarCredenciales(email, contraseña) {
        const usuario = await Usuario.findOne({ where: { email } });
        if (!usuario) throw new Error('Usuario no encontrado');

        // Usar el método del modelo para comparar contraseñas
        const valid = await usuario.compararContraseña(contraseña);
        if (!valid) throw new Error('Contraseña incorrecta');

        if (!usuario.activo) throw new Error('Usuario bloqueado');

        return usuario;
    }

    static async actualizarUsuario(id_usuario, data, id_usuario_accion = null) {
        const usuario = await Usuario.findByPk(id_usuario);
        if (!usuario) throw new Error('Usuario no encontrado');

        // La contraseña se encripta automáticamente en el modelo si se modifica
        await usuario.update(data);
        if (id_usuario_accion) {
            await LogService.registrarAccion({
                id_usuario: id_usuario_accion,
                accion: 'actualizar_usuario',
                detalles: `Se actualizó el usuario ${usuario.nombre} ${usuario.apellido} (${usuario.email}) con los datos: ${JSON.stringify(data)}`
            });
        }
        return usuario;
    }

    static async cambiarRol(id_usuario, nuevoRol, solicitanteRol = 'supervisor', id_usuario_accion = null) {
        if (solicitanteRol !== 'admin') {
            throw new Error('Solo los administradores pueden cambiar roles');
        }

        const usuario = await Usuario.findByPk(id_usuario);
        if (!usuario) throw new Error('Usuario no encontrado');

        usuario.rol = nuevoRol;
        await usuario.save();
        if (id_usuario_accion) {
            await LogService.registrarAccion({
                id_usuario: id_usuario_accion,
                accion: 'cambiar_rol_usuario',
                detalles: `Se cambió el rol del usuario ${usuario.nombre} ${usuario.apellido} (${usuario.email}) a ${nuevoRol}`
            });
        }
        return usuario;
    }

    static async cambiarEstado(id_usuario, activo, solicitanteRol = 'supervisor', id_usuario_accion = null) {
        if (solicitanteRol !== 'admin') {
            throw new Error('Solo los administradores pueden activar o desactivar usuarios');
        }

        const usuario = await Usuario.findByPk(id_usuario);
        if (!usuario) throw new Error('Usuario no encontrado');

        usuario.activo = activo;
        await usuario.save();
        if (id_usuario_accion) {
            await LogService.registrarAccion({
                id_usuario: id_usuario_accion,
                accion: 'cambiar_estado_usuario',
                detalles: `Se cambió el estado del usuario ${usuario.nombre} ${usuario.apellido} (${usuario.email}) a ${activo ? 'activo' : 'inactivo'}`
            });
        }
        return usuario;
    }

    static async eliminarUsuario(id_usuario, solicitanteRol = 'supervisor', id_usuario_accion = null) {
        if (solicitanteRol !== 'admin') {
            throw new Error('Solo los administradores pueden eliminar usuarios');
        }

        const usuario = await Usuario.findByPk(id_usuario);
        if (!usuario) throw new Error('Usuario no encontrado');

        usuario.activo = false;
        await usuario.save();
        if (id_usuario_accion) {
            await LogService.registrarAccion({
                id_usuario: id_usuario_accion,
                accion: 'eliminar_usuario',
                detalles: `Se eliminó el usuario ${usuario.nombre} ${usuario.apellido} (${usuario.email})`
            });
        }
        return true;
    }

    // --- REFRESH TOKEN MANAGEMENT ---
    static async crearRefreshToken(usuario, userAgent, ip) {
        const token = generateRefreshToken();
        const expires_at = getRefreshTokenExpiryDate();
        const refreshToken = await RefreshToken.create({
            token,
            id_usuario: usuario.id_usuario,
            user_agent: userAgent,
            ip,
            expires_at,
            revoked: false,
            created_at: new Date(),
        });
        return refreshToken;
    }

    static async encontrarRefreshToken(token) {
        return await RefreshToken.findOne({ where: { token } });
    }

    static async revocarRefreshToken(token) {
        const refreshToken = await RefreshToken.findOne({ where: { token } });
        if (refreshToken) {
            refreshToken.revoked = true;
            await refreshToken.save();
        }
        return refreshToken;
    }

    static async eliminarRefreshToken(token) {
        return await RefreshToken.destroy({ where: { token } });
    }

    static async eliminarTodosRefreshTokensUsuario(id_usuario) {
        return await RefreshToken.destroy({ where: { id_usuario } });
    }

    static async crearPasswordResetToken(usuario) {
        const token = crypto.randomBytes(48).toString('hex');
        const expires_at = new Date(Date.now() + (Number(process.env.RESET_TOKEN_EXP_MINUTES || 15) * 60 * 1000));
        const resetToken = await PasswordResetToken.create({
            token,
            id_usuario: usuario.id_usuario,
            expires_at,
            used: false,
            created_at: new Date(),
        });
        return resetToken;
    }

    static async encontrarPasswordResetToken(token) {
        return await PasswordResetToken.findOne({ where: { token } });
    }

    static async marcarPasswordResetUsado(token) {
        const prt = await PasswordResetToken.findOne({ where: { token } });
        if (prt) {
            prt.used = true;
            await prt.save();
        }
        return prt;
    }

    static async resetearContraseñaConToken(token, nuevaContraseña) {
        const prt = await PasswordResetToken.findOne({ where: { token } });
        if (!prt || prt.used || new Date(prt.expires_at) < new Date()) {
            throw new Error('Token inválido o expirado');
        }
        const usuario = await Usuario.findByPk(prt.id_usuario);
        if (!usuario || !usuario.activo) {
            throw new Error('Usuario no válido');
        }
        // Actualizar contraseña (hook del modelo encripta)
        usuario.contraseña = nuevaContraseña;
        await usuario.save();

        // Marcar token como usado
        prt.used = true;
        await prt.save();

        // Revocar todos los refresh tokens del usuario
        await RefreshToken.update({ revoked: true }, { where: { id_usuario: usuario.id_usuario } });

        return true;
    }
}

module.exports = UsuarioService;
