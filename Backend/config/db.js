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

const sequelize = new Sequelize(
  process.env.DATABASE_URL,
  {
    dialect: process.env.DB_DIALECT,
    logging: 1,
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
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');
    console.log('📊 Base de datos lista para operaciones.');
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:');
    console.error('   Detalles:', error.message);
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
    await sequelize.sync({ force: true });
    return { synced: true, reason: 'reset' };
  }

  const queryInterface = sequelize.getQueryInterface();
  let isFirstInitialization = false;
  try {
    await queryInterface.describeTable(sentinelTable);
  } catch (err) {
    isFirstInitialization = true;
  }

  const shouldSync = forceSync || isFirstInitialization;
  if (!shouldSync) {
    return { synced: false, reason: 'skipped' };
  }

  const useAlter = !!(forceSync && useAlterEnv);
  await sequelize.sync({ alter: useAlter });
  return { synced: true, reason: isFirstInitialization ? 'first-init' : 'forced' };
};

module.exports = { sequelize, testConnection, ensureDatabaseInitialized }; 