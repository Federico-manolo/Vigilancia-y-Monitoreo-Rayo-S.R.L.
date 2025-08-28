const { Sequelize } = require('sequelize');
const { AsyncLocalStorage } = require('async_hooks');
// Habilitar CLS con AsyncLocalStorage para transacciones por request
const als = new AsyncLocalStorage();

const cls = {
  run(fn) { als.run(new Map(), fn); },
  bind(fn) {
    const store = als.getStore();
    return (...args) => als.run(store || new Map(), () => fn(...args));
  },
  get(key) {
    const s = als.getStore();
    return s ? s.get(key) : undefined;
  },
  set(key, val) {
    const s = als.getStore();
    if (s) s.set(key, val);
  }
};

Sequelize.useCLS(cls);
require('dotenv').config();

// Permitir aliases DB_USERNAME/DB_PASSWORD además de DB_USER/DB_PASS
const DB_USER = process.env.DB_USER || process.env.DB_USERNAME;
const DB_PASS = process.env.DB_PASS || process.env.DB_PASSWORD;

const sequelize = new Sequelize(
  process.env.DB_NAME,
  DB_USER,
  DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || 'postgres',
    // Control por env: DB_LOGGING=1 habilita SQL en consola; por defecto desactivado
    logging: process.env.DB_LOGGING === '1' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: false,
      freezeTableName: true
    }
  }
);

// Función para probar la conexión
const testConnection = async () => {
  try {
    console.log('🔌 Intentando conectar a la base de datos...');
    console.log(`📍 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`🗄️  Base de datos: ${process.env.DB_NAME}`);
    console.log(`👤 Usuario: ${process.env.DB_USER}`);
    console.log(`🔑 Dialecto: ${process.env.DB_DIALECT || 'postgres'}`);
    
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');
    console.log('📊 Base de datos lista para operaciones.');
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:');
    console.error('   Detalles:', error.message);
    console.error('   Código:', error.code);
    process.exit(1);
  }
};

// Asegura la inicialización de la base de datos (primera vez o forzado por env)
const ensureDatabaseInitialized = async (options = {}) => {
  const {
    sentinelTable = 'usuario',
    forceSync = process.env.DB_SYNC === '1',
    useAlterEnv = process.env.DB_SYNC_ALTER === '1'
  } = options;

  // Modo reset total: eliminar y recrear todas las tablas
  if (process.env.DB_RESET === '1') {
    console.log('🧨 DB_RESET=1: Se eliminarán y recrearán TODAS las tablas.');
    console.log('⚠️  Esta acción borra todos los datos. Asegurate de tener backups.');
    await sequelize.sync({ force: true });
    console.log('✅ Reset completo: tablas recreadas desde los modelos.');
    return { synced: true, reason: 'reset' };
  }

  const queryInterface = sequelize.getQueryInterface();
  let isFirstInitialization = false;
  try {
    await queryInterface.describeTable(sentinelTable);
    console.log(`🧾 Tabla base "${sentinelTable}" detectada. Se asume que la base ya está inicializada.`);
  } catch (err) {
    isFirstInitialization = true;
    console.log(`🆕 Base no inicializada: la tabla "${sentinelTable}" no existe.`);
  }

  const shouldSync = forceSync || isFirstInitialization;
  if (!shouldSync) {
    console.log('ℹ️  Sincronización omitida: las tablas ya existen y DB_SYNC≠1.');
    console.log('⚠️  Si necesitás aplicar cambios de modelo, ejecutá con DB_SYNC=1 y opcionalmente DB_SYNC_ALTER=1.');
    return { synced: false, reason: 'skipped' };
  }

  const useAlter = !!(forceSync && useAlterEnv);
  const syncReason = isFirstInitialization ? 'creación inicial de tablas' : 'sincronización forzada por DB_SYNC=1';
  console.log(`🛠️  Ejecutando ${syncReason} (alter=${useAlter ? 'true' : 'false'})...`);
  console.log('📋 Modelos a sincronizar:');
  console.log('   - Usuario, Vigilador, Servicio, Puesto');
  console.log('   - Planilla, DiaPlanilla, Turno');
  console.log('   - DiaVigilador, DiaPuestoTipo');
  console.log('   - LogAccion, PlanillaVigilador, ContinuidadTurno');
  console.log('   - RefreshToken, PasswordResetToken');

  await sequelize.sync({ alter: useAlter });
  console.log('✅ Modelos sincronizados exitosamente.');
  console.log('🗃️  Todas las tablas han sido creadas/actualizadas en la base de datos.');
  return { synced: true, reason: isFirstInitialization ? 'first-init' : 'forced' };
};

module.exports = { sequelize, testConnection, ensureDatabaseInitialized }; 