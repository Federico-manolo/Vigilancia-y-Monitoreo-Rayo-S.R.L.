const UsuarioService = require('./usuarioService');

const bootstrapAdminUser = async () => {
    const usuarios = await UsuarioService.contarUsuarios();
    if (usuarios === 0) {
        const adminEmail = process.env.ADMIN_EMAIL || 'ariasfede596@gmail.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';
        const adminNombre = process.env.ADMIN_NOMBRE || 'Admin';
        const adminApellido = process.env.ADMIN_APELLIDO || 'Principal';
        await UsuarioService.crearUsuario({
            nombre: adminNombre,
            apellido: adminApellido,
            email: adminEmail,
            contraseña: adminPassword,
            rol: 'admin',
        }, 'admin');
        console.log(`👤 Usuario admin inicial creado: ${adminEmail} (contraseña: ${adminPassword})`);
        return { created: true, email: adminEmail };
    }
    console.log(`ℹ️  Ya existen ${usuarios} usuario(s) en la base de datos.`);
    return { created: false, count: usuarios };
};

module.exports = { bootstrapAdminUser };


