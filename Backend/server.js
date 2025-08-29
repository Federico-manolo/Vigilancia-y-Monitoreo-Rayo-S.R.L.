const app = require('./src/app');
const { testConnection, ensureDatabaseInitialized } = require('./config/db');
require('./models');
const { bootstrapAdminUser } = require('./services/bootstrapService');
const { ensureRlsPolicies } = require('./services/rlsService');
require('dotenv').config();

// Función para inicializar el servidor
const startServer = async () => {
  console.log('🚀 Iniciando servidor...');
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Puerto: ${PORT}`);
  
  try {
    await testConnection();
    // Inicialización/sincronización de base de datos centralizada
    await ensureDatabaseInitialized({ sentinelTable: 'usuario' });
    // Asegurar políticas RLS solo si está indicado por env
    await ensureRlsPolicies();
    // Asegurar usuario admin inicial si la base está vacía
    await bootstrapAdminUser();
    
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log('🎉 Servidor iniciado exitosamente!');
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
