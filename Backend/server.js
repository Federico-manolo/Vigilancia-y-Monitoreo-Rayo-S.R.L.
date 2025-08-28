const app = require('./src/app');
const { testConnection, ensureDatabaseInitialized } = require('./config/db');
require('./models');
const { bootstrapAdminUser } = require('./services/bootstrapService');
const { ensureRlsPolicies } = require('./services/rlsService');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Función para inicializar el servidor
const startServer = async () => {
  console.log('🚀 Iniciando servidor...');
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Puerto: ${PORT}`);
  console.log(`📁 Directorio de trabajo: ${process.cwd()}`);
  
  try {
    // Probar conexión a la base de datos (saltable por variable de entorno)
    if (process.env.SKIP_DB !== '1') {
      await testConnection();
    } else {
      console.log('⚠️  SKIP_DB=1: iniciando servidor sin verificar conexión a la base de datos.');
    }

    // Inicialización/sincronización de base de datos centralizada
    await ensureDatabaseInitialized({ sentinelTable: 'usuario' });
    // Asegurar políticas RLS solo si está indicado por env
    await ensureRlsPolicies();
    // Asegurar usuario admin inicial si la base está vacía
    await bootstrapAdminUser();
    
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log('🎉 Servidor iniciado exitosamente!');
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📡 API disponible en http://localhost:${PORT}/api`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ Hora de inicio: ${new Date().toLocaleString()}`);
      console.log('✨ Backend listo para recibir conexiones');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejar señales de terminación
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});

// Iniciar el servidor
startServer();
