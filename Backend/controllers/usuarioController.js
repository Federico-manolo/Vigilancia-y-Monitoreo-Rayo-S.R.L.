const UsuarioService = require('../services/usuarioService');
const { validationResult } = require('express-validator');
const AppError = require('../structure/AppError');
const { generateToken } = require('../config/jwt');

class UsuarioController {
    static async crearUsuario(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const creadorRol = req.user?.rol || 'supervisor';
            const id_usuario_accion = req.user?.id_usuario;
            const usuario = await UsuarioService.crearUsuario(req.body, creadorRol, id_usuario_accion);
            return res.status(201).json(usuario);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al crear usuario', 500, error.message));
        }
    }

    static async obtenerUsuarioPorId(req, res, next) {
        try {
            const { id } = req.params;
            const usuario = await UsuarioService.obtenerPorId(id);
            if (!usuario) {
                throw new AppError('Usuario no encontrado', 404);
            }
            return res.status(200).json(usuario);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al obtener usuario', 500, error.message));
        }
    }

    static async obtenerUsuarioPorEmail(req, res, next) {
        try {
            const { email } = req.params;
            const usuario = await UsuarioService.obtenerPorEmail(email);
            if (!usuario) {
                throw new AppError('Usuario no encontrado', 404);
            }
            return res.status(200).json(usuario);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al obtener usuario por email', 500, error.message));
        }
    }

    static async listarUsuarios(req, res, next) {
        try {
            const { rol, activo } = req.query;
            const usuarios = await UsuarioService.listarUsuarios({ rol, activo });
            return res.status(200).json(usuarios);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al listar usuarios', 500, error.message));
        }
    }

    static async actualizarUsuario(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { id } = req.params;
            const id_usuario_accion = req.user?.id_usuario;
            const usuario = await UsuarioService.actualizarUsuario(id, req.body, id_usuario_accion);
            return res.status(200).json(usuario);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al actualizar usuario', 500, error.message));
        }
    }

    static async cambiarRol(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { id } = req.params;
            const { nuevoRol } = req.body;
            const solicitanteRol = req.user?.rol || 'supervisor';
            const id_usuario_accion = req.user?.id_usuario;
            const usuario = await UsuarioService.cambiarRol(id, nuevoRol, solicitanteRol, id_usuario_accion);
            return res.status(200).json(usuario);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al cambiar rol', 403, error.message));
        }
    }

    static async cambiarEstado(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { id } = req.params;
            const { activo } = req.body;
            const solicitanteRol = req.user?.rol || 'supervisor';
            const id_usuario_accion = req.user?.id_usuario;
            const usuario = await UsuarioService.cambiarEstado(id, activo, solicitanteRol, id_usuario_accion);
            return res.status(200).json(usuario);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al cambiar estado', 403, error.message));
        }
    }

    static async eliminarUsuario(req, res, next) {
        try {
            const { id } = req.params;
            const solicitanteRol = req.user?.rol || 'supervisor';
            const id_usuario_accion = req.user?.id_usuario;
            await UsuarioService.eliminarUsuario(id, solicitanteRol, id_usuario_accion);
            return res.status(200).json({ mensaje: 'Usuario eliminado correctamente' });
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al eliminar usuario', 403, error.message));
        }
    }
}

module.exports = UsuarioController; 