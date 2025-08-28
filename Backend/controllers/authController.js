const UsuarioService = require('../services/usuarioService');
const { validationResult } = require('express-validator');
const AppError = require('../structure/AppError');
const { generateToken, setRefreshTokenCookie, clearRefreshTokenCookie } = require('../config/jwt');
const { sendEmail } = require('../services/emailService');

class AuthController {
    static async login(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, contraseña } = req.body;
            const usuario = await UsuarioService.validarCredenciales(email, contraseña);

            // Crear refresh token y guardarlo en la base
            const userAgent = req.headers['user-agent'] || null;
            const ip = req.ip || req.connection?.remoteAddress || null;
            const refreshToken = await UsuarioService.crearRefreshToken(usuario, userAgent, ip);

            // Setear cookie httpOnly
            setRefreshTokenCookie(res, refreshToken.token);

            // Generar access token
            const token = generateToken({
                id_usuario: usuario.id_usuario,
                rol: usuario.rol
            });

            const { contraseña: _, ...usuarioSinContraseña } = usuario.toJSON();
            return res.status(200).json({
                usuario: usuarioSinContraseña,
                token
            });
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Credenciales inválidas', 401, error.message));
        }
    }

    static async refresh(req, res, next) {
        try {
            const refreshToken = req.cookies?.refreshToken;
            if (!refreshToken) {
                return res.status(401).json({ error: 'Refresh token requerido' });
            }
            const tokenDb = await UsuarioService.encontrarRefreshToken(refreshToken);
            if (!tokenDb || tokenDb.revoked || new Date(tokenDb.expires_at) < new Date()) {
                return res.status(401).json({ error: 'Refresh token inválido o expirado' });
            }
            const usuario = await UsuarioService.obtenerPorId(tokenDb.id_usuario);
            if (!usuario || !usuario.activo) {
                return res.status(401).json({ error: 'Usuario no válido' });
            }
            // Generar nuevo access token
            const token = generateToken({
                id_usuario: usuario.id_usuario,
                rol: usuario.rol
            });
            return res.status(200).json({ token });
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al refrescar token', 401, error.message));
        }
    }

    static async logout(req, res, next) {
        try {
            const refreshToken = req.cookies?.refreshToken;
            if (refreshToken) {
                await UsuarioService.revocarRefreshToken(refreshToken);
                clearRefreshTokenCookie(res);
            }
            return res.status(200).json({ mensaje: 'Logout exitoso' });
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al hacer logout', 500, error.message));
        }
    }

    static async solicitarRecuperacionPassword(req, res, next) {
        try {
            const { email } = req.body;
            // Mensaje genérico siempre
            const genericMessage = { mensaje: 'Si el correo existe, recibirás un email con instrucciones para recuperar tu contraseña.' };

            const usuario = await UsuarioService.obtenerPorEmail(email);
            if (!usuario) {
                return res.status(200).json(genericMessage);
            }

            const resetToken = await UsuarioService.crearPasswordResetToken(usuario);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
            const resetLink = `${frontendUrl}/reset-password?token=${resetToken.token}`;

            await sendEmail({
                to: usuario.email,
                subject: 'Recuperación de contraseña',
                text: `Para recuperar tu contraseña, visitá: ${resetLink}`,
                html: `<p>Para recuperar tu contraseña, hacé clic en el siguiente enlace:</p><p><a href="${resetLink}">Recuperar contraseña</a></p><p>Este enlace expira en ${process.env.RESET_TOKEN_EXP_MINUTES || 15} minutos.</p>`,
            });

            return res.status(200).json(genericMessage);
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('Error al solicitar recuperación', 500, error.message));
        }
    }

    static async resetPassword(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { token, nuevaContraseña } = req.body;

            await UsuarioService.resetearContraseñaConToken(token, nuevaContraseña);
            return res.status(200).json({ mensaje: 'Contraseña actualizada correctamente' });
        } catch (error) {
            next(error instanceof AppError ? error : new AppError('No se pudo actualizar la contraseña', 400, error.message));
        }
    }
}

module.exports = AuthController;
